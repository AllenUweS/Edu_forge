from django.core.exceptions import PermissionDenied
from django.db import models, transaction
from django.db.models import ProtectedError, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import is_faculty
from questionbank.permissions import visible_questions

from .models import (
    ExamPaper,
    ExamPaperQuestion,
    UploadedImage,
    Question,
    Symbol,
)
from .serializers import (
    BulkPlacementsSerializer,
    ExamPaperSerializer,
    PaperQuestionItemSerializer,
    UploadedImageSerializer,
    QuestionSerializer,
    SymbolSerializer,
)

# ==================== PAPER VISIBILITY HELPERS ====================

def visible_papers(user):
    """
    Papers a user may see: own plus unclaimed legacy papers. Admin/Superusers see everything.
    """
    queryset = ExamPaper.objects.select_related("created_by").order_by("-updated_at")
    if user.is_superuser or user.username == 'admin' or (hasattr(user, 'profile') and user.profile.role == 'ADMIN'):
        return queryset.all()
    return queryset.filter(Q(created_by=user) | Q(created_by__isnull=True))


def get_visible_paper_or_404(user, pk):
    return get_object_or_404(visible_papers(user), pk=pk)


def ensure_paper_writable(request, paper):
    user = request.user
    if user.is_superuser or paper.created_by_id == user.id or user.username == 'admin' or (hasattr(user, 'profile') and user.profile.role == 'ADMIN'):
        return paper

    if paper.created_by_id is None:
        paper.created_by = user
        paper.save(update_fields=["created_by"])
        return paper

    raise PermissionDenied("You can only modify your own exam papers.")


# ==================== EXISTING VIEWS (PRESERVED) ====================

def editor_page(request):
    """Serves the editor's single HTML page."""
    from django.shortcuts import render
    return render(request, "editor/index.html")


class ImageUploadView(APIView):
    """
    POST /api/images/upload/
    multipart/form-data: image=<file>, exam_paper_id=<optional int>

    Stores the file on disk (MEDIA_ROOT/exam_images/) and a row in the
    UploadedImage table. Only the URL is ever sent back — never base64.
    """

    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"error": "No image file provided"}, status=status.HTTP_400_BAD_REQUEST)

        exam_paper = None
        exam_paper_id = request.data.get("exam_paper_id")
        if exam_paper_id:
            exam_paper = get_visible_paper_or_404(request.user, exam_paper_id)

        uploaded = UploadedImage.objects.create(image=image_file, exam_paper=exam_paper)
        serializer = UploadedImageSerializer(uploaded, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ExamPaperListCreateView(APIView):
    """
    GET  /api/exam-papers/       -> papers visible to the caller
    POST /api/exam-papers/       -> create a new paper (Admin & Faculty)
    """

    def get(self, request):
        mine_only = request.query_params.get("mine") in ("true", "1")
        papers = visible_papers(request.user)
        if mine_only:
            papers = papers.filter(created_by=request.user)
        serializer = ExamPaperSerializer(papers, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        serializer = ExamPaperSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        paper = serializer.save(created_by=request.user)
        return Response(
            ExamPaperSerializer(paper, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ExamPaperDetailView(APIView):
    """
    GET    /api/exam-papers/<id>/   -> full paper with ordered pages
    PUT    /api/exam-papers/<id>/   -> replace title + all pages
    DELETE /api/exam-papers/<id>/   -> remove paper (owner only)

    PUT/DELETE additionally require ownership; saving an unclaimed legacy
    paper claims it for the caller (faculty only).
    """

    def get(self, request, pk):
        paper = get_visible_paper_or_404(request.user, pk)
        serializer = ExamPaperSerializer(paper, context={"request": request})
        return Response(serializer.data)

    def put(self, request, pk):
        paper = get_visible_paper_or_404(request.user, pk)
        ensure_paper_writable(request, paper)
        serializer = ExamPaperSerializer(paper, data=request.data)
        serializer.is_valid(raise_exception=True)
        paper = serializer.save()
        return Response(ExamPaperSerializer(paper, context={"request": request}).data)

    def delete(self, request, pk):
        paper = get_visible_paper_or_404(request.user, pk)
        ensure_paper_writable(request, paper)
        try:
            paper.delete()
        except ProtectedError:
            return Response(
                {"detail": "This paper still references protected questions."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)


# ==================== STRUCTURED QUESTIONS ON LEGACY PAPERS ====================
# (the free-form editor's own Question model - preserved as-is, now scoped)

class QuestionListCreateView(ListCreateAPIView):
    """
    List and create questions for an exam paper.
    GET: /api/exam-papers/<paper_id>/questions/
    POST: /api/exam-papers/<paper_id>/questions/ (requires exactly 4 options)
    """
    serializer_class = QuestionSerializer

    def _get_writable_paper(self):
        paper = get_visible_paper_or_404(self.request.user, self.kwargs.get("paper_id"))
        ensure_paper_writable(self.request, paper)
        return paper

    def get_queryset(self):
        paper = get_visible_paper_or_404(self.request.user, self.kwargs.get("paper_id"))
        return Question.objects.filter(exam_paper_id=paper.id)

    def get_serializer_context(self):
        """Add exam_paper to serializer context."""
        context = super().get_serializer_context()
        paper_id = self.kwargs.get("paper_id")
        if paper_id:
            context["exam_paper"] = get_visible_paper_or_404(self.request.user, paper_id)
        return context

    def perform_create(self, serializer):
        """Auto-assign question_number if not provided."""
        paper = self._get_writable_paper()

        max_number = Question.objects.filter(
            exam_paper_id=paper.id
        ).aggregate(models.Max("question_number"))["question_number__max"] or 0

        if "question_number" not in serializer.validated_data or not serializer.validated_data["question_number"]:
            serializer.validated_data["question_number"] = max_number + 1

        # CRITICAL: Call save() to actually create the question
        serializer.save()


class LegacyQuestionDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific structured editor question."""
    serializer_class = QuestionSerializer

    def _paper_of(self, instance):
        return get_visible_paper_or_404(self.request.user, instance.exam_paper_id)

    def get_queryset(self):
        # Scoped to papers the caller can see.
        return Question.objects.filter(exam_paper__in=visible_papers(self.request.user))

    def perform_update(self, serializer):
        paper = self._paper_of(self.get_object())
        ensure_paper_writable(self.request, paper)
        serializer.save()

    def perform_destroy(self, instance):
        """Delete the linked page when deleting a question."""
        paper = self._paper_of(instance)
        ensure_paper_writable(self.request, paper)
        linked_page = instance.linked_page
        if linked_page:
            linked_page.delete()
        instance.delete()


class SymbolListView(ListAPIView):
    """
    List and filter symbols by category, exam type, or search.
    GET: /api/symbols/?category=greek&exam_type=jee&search=integral
    """
    serializer_class = SymbolSerializer
    queryset = Symbol.objects.all()

    def get_queryset(self):
        queryset = Symbol.objects.all()

        # Filter by category
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)

        # Filter by exam type
        exam_type = self.request.query_params.get("exam_type")
        if exam_type:
            queryset = queryset.filter(models.Q(exam_type=exam_type) | models.Q(exam_type="all"))

        # Search in display_name, latex, or tags
        search = self.request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                models.Q(display_name__icontains=search) |
                models.Q(latex__icontains=search) |
                models.Q(search_tags__icontains=search)
            )

        return queryset


# ==================== PAPER COMPOSITION FROM THE QUESTION BANK ====================

class ExamPaperFullView(APIView):
    """
    GET /api/exam-papers/<pk>/full/

    The complete generated exam paper: metadata, ordered placements with
    effective marks, and every question fully resolved (contents, options,
    solution), plus totals.
    """

    def get(self, request, pk):
        paper = get_visible_paper_or_404(request.user, pk)
        placements = (
            paper.paper_questions
            .select_related(
                "question__chapter__subject",
                "question__question_bank__owner__profile",
            )
            .prefetch_related(
                "question__contents",
                "question__options__contents",
                "question__solution__contents",
            )
        )

        items = PaperQuestionItemSerializer(placements, many=True, context={"request": request}).data
        total_marks = round(sum(float(p.effective_marks or 0) for p in placements), 2)
        total_negative = round(
            sum(float(p.effective_negative_marks or 0) for p in placements), 2
        )

        return Response({
            "id": paper.id,
            "title": paper.title,
            "created_by": paper.created_by_id,
            "is_own": paper.created_by_id == request.user.id,
            "created_at": paper.created_at,
            "updated_at": paper.updated_at,
            "total_questions": len(items),
            "total_marks": round(total_marks, 2),
            "total_negative_marks": round(total_negative, 2),
            "questions": items,
        })


class AddPaperQuestionsView(APIView):
    """
    POST /api/exam-papers/<pk>/questions/add/

    Pulls EXISTING questions into the paper by reference.

    Body (single): {"question": 12, "marks_override": null}
    Body (bulk):   {"questions": [12, {"question": 15, "marks_override": 2}]}

    Only questions the caller can see are eligible (admin banks + own banks),
    and no question may appear twice in the same paper.
    """

    def post(self, request, pk):
        paper = get_visible_paper_or_404(request.user, pk)
        ensure_paper_writable(request, paper)

        input_serializer = BulkPlacementsSerializer(data=request.data)
        input_serializer.is_valid(raise_exception=True)
        placements = input_serializer.validated_data["placements"]

        requested_ids = [entry["question"] for entry in placements]
        if len(set(requested_ids)) != len(requested_ids):
            return Response(
                {"detail": "The same question was requested more than once."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        candidates = {
            q.id: q
            for q in visible_questions(request.user).filter(id__in=requested_ids)
        }
        missing = [qid for qid in requested_ids if qid not in candidates]
        if missing:
            return Response(
                {
                    "detail": "Some questions do not exist or you cannot access them.",
                    "question_ids": missing,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        already_in_paper = set(
            paper.paper_questions.filter(question_id__in=requested_ids)
            .values_list("question_id", flat=True)
        )
        if already_in_paper:
            return Response(
                {
                    "detail": "These questions are already part of this paper.",
                    "question_ids": sorted(already_in_paper),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        next_sequence = (
            paper.paper_questions.aggregate(models.Max("sequence"))[
                "sequence__max"
            ]
            or 0
        )

        created = []
        with transaction.atomic():
            for entry in placements:
                next_sequence += 1
                created.append(
                    ExamPaperQuestion.objects.create(
                        exam_paper=paper,
                        question=candidates[entry["question"]],
                        sequence=next_sequence,
                        marks_override=entry["marks_override"],
                        negative_marks_override=entry["negative_marks_override"],
                    )
                )

        data = PaperQuestionItemSerializer(created, many=True, context={"request": request})
        return Response(data.data, status=status.HTTP_201_CREATED)


class RemovePaperQuestionView(APIView):
    """
    DELETE /api/exam-papers/<pk>/questions/remove/<placement_id>/
    Removes a question reference from the paper (the banked question stays).
    """

    def delete(self, request, pk, placement_id):
        paper = get_visible_paper_or_404(request.user, pk)
        ensure_paper_writable(request, paper)
        placement = get_object_or_404(
            ExamPaperQuestion, pk=placement_id, exam_paper=paper
        )
        placement.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ReorderPaperQuestionsView(APIView):
    """
    POST /api/exam-papers/<pk>/questions/reorder/
    Body: {"order": [<placement_id>, ...]} - must be exactly the current set.
    """

    def post(self, request, pk):
        paper = get_visible_paper_or_404(request.user, pk)
        ensure_paper_writable(request, paper)

        order = request.data.get("order")
        if not isinstance(order, list) or not order:
            return Response(
                {"detail": "\"order\" must be a non-empty list of placement ids."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        placements = {p.id: p for p in paper.paper_questions.all()}
        try:
            wanted = {int(item) for item in order}
        except (TypeError, ValueError):
            return Response(
                {"detail": "\"order\" entries must be integers."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if wanted != set(placements.keys()) or len(order) != len(wanted):
            return Response(
                {
                    "detail": (
                        "\"order\" must contain every placement of this paper "
                        "exactly once."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        offset = 1_000_000
        with transaction.atomic():
            # Two-phase renumber keeps the unique (paper, sequence) constraint
            # satisfied throughout.
            for index, placement_id in enumerate(order):
                placements[int(placement_id)].sequence = offset + index
            ExamPaperQuestion.objects.bulk_update(placements.values(), ["sequence"])
            for index, placement_id in enumerate(order):
                placements[int(placement_id)].sequence = index + 1
            ExamPaperQuestion.objects.bulk_update(placements.values(), ["sequence"])

        return Response({"detail": "Order updated."})
