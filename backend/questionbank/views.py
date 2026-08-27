from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser

from .models import (
    Subject,
    Chapter,
    Question,
    Media,
)

from .serializers import (
    SubjectSerializer,
    ChapterSerializer,
    QuestionSerializer,
    MediaSerializer,
)


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
# QUESTIONS
# =========================================================

class QuestionListCreateView(generics.ListCreateAPIView):
    serializer_class = QuestionSerializer

    def get_queryset(self):
        return Question.objects.filter(
            chapter_id=self.kwargs["chapter_id"]
        )

    def perform_create(self, serializer):
        serializer.save(
            chapter_id=self.kwargs["chapter_id"],
            created_by=None
        )


class QuestionDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer