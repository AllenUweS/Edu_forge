from django.urls import path

from . import views

urlpatterns = [
    # Existing endpoints
    path("images/upload/", views.ImageUploadView.as_view(), name="image-upload"),
    path("exam-papers/", views.ExamPaperListCreateView.as_view(), name="exam-paper-list"),
    path("exam-papers/<int:pk>/", views.ExamPaperDetailView.as_view(), name="exam-paper-detail"),

    # NEW: Structured questions and symbols
    path("exam-papers/<int:paper_id>/questions/", views.QuestionListCreateView.as_view(), name="question-list"),
    path("questions/<int:pk>/", views.QuestionDetailView.as_view(), name="question-detail"),
    path("symbols/", views.SymbolListView.as_view(), name="symbol-list"),
]
