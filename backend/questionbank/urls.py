from django.urls import path
from rest_framework.routers import DefaultRouter

from . import views


router = DefaultRouter(trailing_slash=True)
router.register(
    r"question-banks",
    views.QuestionBankViewSet,
    basename="question-bank",
)
router.register(
    r"bank-questions",
    views.RichQuestionViewSet,
    basename="bank-questions",
)

urlpatterns = [

    # =========================
    # MEDIA
    # =========================

    path(
        "media/",
        views.MediaUploadView.as_view(),
        name="media-upload"
    ),


    # =========================
    # SUBJECTS
    # =========================

    path(
        "subjects/",
        views.SubjectListCreateView.as_view(),
        name="subject-list"
    ),

    path(
        "subjects/<int:pk>/",
        views.SubjectDetailView.as_view(),
        name="subject-detail"
    ),


    # =========================
    # CHAPTERS
    # =========================

    path(
        "subjects/<int:subject_id>/chapters/",
        views.ChapterListCreateView.as_view(),
        name="chapter-list"
    ),

    path(
        "chapters/<int:pk>/",
        views.ChapterDetailView.as_view(),
        name="chapter-detail"
    ),


    # =========================
    # QUESTIONS (legacy paths, kept compatible)
    # =========================

    path(
        "chapters/<int:chapter_id>/questions/",
        views.QuestionListCreateView.as_view(),
        name="question-list"
    ),

    path(
        "questions/<int:pk>/",
        views.QuestionDetailView.as_view(),
        name="question-detail"
    ),
]

# question-banks/, question-banks/<pk>/,
# question-banks/<pk>/questions/, bank-questions/, bank-questions/<pk>/
urlpatterns += [
    path(
        "question-banks/<int:bank_id>/questions/",
        views.BankQuestionsView.as_view(),
        name="bank-questions-nested",
    ),
] + router.urls
