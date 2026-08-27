from django.shortcuts import get_object_or_404, render
from rest_framework import status
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView, ListAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db import models

from .models import ExamPaper, UploadedImage, Question, Symbol
from .serializers import (
    ExamPaperSerializer, UploadedImageSerializer,
    QuestionSerializer, SymbolSerializer
)


# ==================== EXISTING VIEWS (PRESERVED) ====================

def editor_page(request):
    """Serves the editor's single HTML page."""
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
            exam_paper = ExamPaper.objects.filter(id=exam_paper_id).first()

        uploaded = UploadedImage.objects.create(image=image_file, exam_paper=exam_paper)
        serializer = UploadedImageSerializer(uploaded, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ExamPaperListCreateView(APIView):
    """
    GET  /api/exam-papers/       -> list of {id, title, updated_at} for the "load" dropdown
    POST /api/exam-papers/       -> create a new exam paper with its pages
    """

    def get(self, request):
        papers = ExamPaper.objects.all().order_by("-updated_at")
        data = [{"id": p.id, "title": p.title, "updated_at": p.updated_at} for p in papers]
        return Response(data)

    def post(self, request):
        serializer = ExamPaperSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        paper = serializer.save()
        return Response(
            ExamPaperSerializer(paper, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class ExamPaperDetailView(APIView):
    """
    GET /api/exam-papers/<id>/   -> full paper with ordered pages
    PUT /api/exam-papers/<id>/   -> replace title + all pages
    """

    def get(self, request, pk):
        paper = get_object_or_404(ExamPaper, pk=pk)
        serializer = ExamPaperSerializer(paper, context={"request": request})
        return Response(serializer.data)

    def put(self, request, pk):
        paper = get_object_or_404(ExamPaper, pk=pk)
        serializer = ExamPaperSerializer(paper, data=request.data)
        serializer.is_valid(raise_exception=True)
        paper = serializer.save()
        return Response(ExamPaperSerializer(paper, context={"request": request}).data)


# ==================== NEW VIEWS ====================

class QuestionListCreateView(ListCreateAPIView):
    """
    List and create questions for an exam paper.
    GET: /api/exam-papers/<paper_id>/questions/
    POST: /api/exam-papers/<paper_id>/questions/ (requires exactly 4 options)
    """
    serializer_class = QuestionSerializer

    def get_queryset(self):
        paper_id = self.kwargs.get("paper_id")
        return Question.objects.filter(exam_paper_id=paper_id)

    def get_serializer_context(self):
        """Add exam_paper to serializer context."""
        context = super().get_serializer_context()
        paper_id = self.kwargs.get("paper_id")
        if paper_id:
            context["exam_paper"] = ExamPaper.objects.get(id=paper_id)
        return context

    def perform_create(self, serializer):
        """Auto-assign question_number if not provided."""
        paper_id = self.kwargs.get("paper_id")

        max_number = Question.objects.filter(
            exam_paper_id=paper_id
        ).aggregate(models.Max("question_number"))["question_number__max"] or 0

        if "question_number" not in serializer.validated_data or not serializer.validated_data["question_number"]:
            serializer.validated_data["question_number"] = max_number + 1

        # CRITICAL: Call save() to actually create the question
        serializer.save()


class QuestionDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update, or delete a specific question."""
    serializer_class = QuestionSerializer
    queryset = Question.objects.all()

    def perform_destroy(self, instance):
        """Delete the linked page when deleting a question."""
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
