from django.core.exceptions import PermissionDenied
from django.db.models import Count, ProtectedError, Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, mixins, serializers, status, viewsets
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from accounts.permissions import ADMIN_ROLE, FACULTY_ROLE

from .models import Chapter, Media, Question, QuestionBank, Subject
from .permissions import (
    CanEditQuestion,
    CanModifyBank,
    can_modify_bank,
    visible_banks,
    visible_questions,
)
from .serializers import (
    ChapterSerializer,
    MediaSerializer,
    QuestionBankSerializer,
    QuestionListSerializer,
    QuestionSerializer,
    SubjectSerializer,
)


class DefaultPagePagination(PageNumberPagination):
    """Applied only to pool-browsing endpoints; legacy lists stay unpaginated."""

    page_size = 25
    page_size_query_param = "page_size"
    max_page_size = 100


DEFAULT_BANK_NAME = "My Questions"


def get_or_create_default_bank(user):
    """
    Landing bank for questions created outside an explicit bank context
    (e.g. through the legacy chapter-based endpoint).
    """
    bank, _ = QuestionBank.objects.get_or_create(
        name=DEFAULT_BANK_NAME,
        owner=user,
        defaults={"description": f"{user.username}'s personal questions."},
    )
    return bank


# =========================================================
# MEDIA UPLOAD
# POST /api/media/
# =========================================================

class MediaUploadView(generics.CreateAPIView):
    queryset = Media.objects.all()
    serializer_class = MediaSerializer
    parser_classes = [MultiPartParser, FormParser]


# =========================================================
# SUBJECTS
# =========================================================

class SubjectListCreateView(generics.ListCreateAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


class SubjectDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer


# =========================================================
# CHAPTERS
# =========================================================

class ChapterListCreateView(generics.ListCreateAPIView):
    serializer_class = ChapterSerializer

    def get_queryset(self):
        return Chapter.objects.filter(
            subject_id=self.kwargs["subject_id"]
        )

    def perform_create(self, serializer):
        serializer.save(
            subject_id=self.kwargs["subject_id"]
        )


class ChapterDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Chapter.objects.all()
    serializer_class = ChapterSerializer


# =========================================================
# QUESTION BANKS
#
# GET    /api/question-banks/            -> own banks + public (admin) banks
# POST   /api/question-banks/            -> any user creates their own bank
# GET    /api/question-banks/<pk>/
# PUT    /api/question-banks/<pk>/       -> owner only (superuser bypasses)
# DELETE /api/question-banks/<pk>/
# =========================================================

class QuestionBankViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = QuestionBankSerializer
    permission_classes = [CanModifyBank]

    def get_queryset(self):
        return (
            visible_banks(self.request.user)
            .annotate(questions_count=Count("questions"))
            .order_by("-updated_at")
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


# =========================================================
# QUESTIONS INSIDE A QUESTION BANK
#
# GET/POST /api/question-banks/<pk>/questions/
# Reads require a visible bank; creates require being its owner.
# =========================================================

class BankQuestionsView(generics.ListCreateAPIView):

    def _get_bank(self):
        bank = get_object_or_404(
            visible_banks(self.request.user),
            pk=self.kwargs["bank_id"],
        )
        return bank

    def get_serializer_class(self):
        if self.request.method == "POST":
            return QuestionSerializer
        return QuestionListSerializer

    def get_queryset(self):
        bank = self._get_bank()
        return (
            Question.objects.filter(question_bank=bank)
            .select_related("chapter__subject", "question_bank__owner__profile")
            .prefetch_related("contents")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        bank = self._get_bank()
        if not can_modify_bank(self.request.user, bank):
            raise PermissionDenied(
                "You can only add questions to your own question banks."
            )
        serializer.save(
            question_bank=bank,
            created_by=self.request.user,
        )


# =========================================================
# QUESTION POOL (cross-bank browsing, used when composing papers)
#
# GET/POST /api/bank-questions/
# GET/PUT/PATCH/DELETE /api/bank-questions/<pk>/
#
# Filters: ?subject=&chapter=&difficulty=&status=&bank=
#          &source=admin|faculty&mine=true&search=
# =========================================================

class RichQuestionViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    permission_classes = [CanEditQuestion]
    pagination_class = DefaultPagePagination

    def get_queryset(self):
        queryset = (
            visible_questions(self.request.user)
            .order_by("-created_at")
        )
        params = self.request.query_params

        subject_id = params.get("subject")
        if subject_id:
            queryset = queryset.filter(chapter__subject_id=subject_id)

        chapter_id = params.get("chapter")
        if chapter_id:
            queryset = queryset.filter(chapter_id=chapter_id)

        difficulty = params.get("difficulty")
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)

        status_value = params.get("status")
        if status_value:
            queryset = queryset.filter(status=status_value)

        bank_id = params.get("bank")
        if bank_id:
            queryset = queryset.filter(question_bank_id=bank_id)

        source = params.get("source")
        if source == "admin":
            queryset = queryset.filter(
                question_bank__owner__profile__role=ADMIN_ROLE
            )
        elif source == "faculty":
            queryset = queryset.filter(
                question_bank__owner__profile__role=FACULTY_ROLE
            )

        if params.get("mine") in ("true", "1"):
            queryset = queryset.filter(created_by=self.request.user)

        search = params.get("search")
        if search:
            queryset = queryset.filter(
                Q(contents__content_type="TEXT",
                  contents__text__icontains=search)
            ).distinct()

        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return QuestionListSerializer
        return QuestionSerializer

    def perform_create(self, serializer):
        bank = serializer.validated_data.get("question_bank")
        if bank is None:
            raise serializers.ValidationError(
                {"question_bank": "This field is required."}
            )
        if not can_modify_bank(self.request.user, bank):
            raise PermissionDenied(
                "You can only add questions to your own question banks."
            )
        serializer.save(created_by=self.request.user)

    def destroy(self, request, *args, **kwargs):
        question = self.get_object()
        try:
            question.delete()
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "This question is referenced by one or more saved "
                        "exam papers and cannot be deleted."
                    )
                },
                status=status.HTTP_409_CONFLICT,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


# =========================================================
# LEGACY ENDPOINTS (kept working, now role-aware)
# =========================================================

class QuestionListCreateView(generics.ListCreateAPIView):
    """
    Kept at the historical path /api/chapters/<chapter_id>/questions/.

    Lists every VISIBLE question of the chapter (admin banks + own banks).
    Creates land in the requester's personal bank instead of anonymous rows,
    so ownership/visibility keeps working.
    """

    def get_serializer_class(self):
        if self.request.method == "POST":
            return QuestionSerializer
        return QuestionListSerializer

    def get_queryset(self):
        return (
            visible_questions(self.request.user)
            .filter(chapter_id=self.kwargs["chapter_id"])
        )

    def perform_create(self, serializer):
        serializer.save(
            question_bank=get_or_create_default_bank(self.request.user),
            created_by=self.request.user,
        )


class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Kept at the historical path /api/questions/<pk>/ for rich bank
    questions. Invisible questions resolve to 404; visible ones may only be
    modified by their creator.
    """

    permission_classes = [CanEditQuestion]
    serializer_class = QuestionSerializer

    def get_queryset(self):
        return visible_questions(self.request.user)
