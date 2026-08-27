from django.urls import path
from . import views


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
    # QUESTIONS
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