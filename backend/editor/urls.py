from django.urls import path

from . import views

urlpatterns = [
    # Legacy free-form editor endpoints (now ownership-scoped)
    path("images/upload/", views.ImageUploadView.as_view(), name="image-upload"),
    path("exam-papers/", views.ExamPaperListCreateView.as_view(), name="exam-paper-list"),
    path("exam-papers/<int:pk>/", views.ExamPaperDetailView.as_view(), name="exam-paper-detail"),

    # Structured questions of the free-form editor (its own Question model)
    path("exam-papers/<int:paper_id>/questions/", views.QuestionListCreateView.as_view(), name="paper-question-list"),
    path("questions/<int:pk>/", views.LegacyQuestionDetailView.as_view(), name="question-detail"),
    path("symbols/", views.SymbolListView.as_view(), name="symbol-list"),

    # Composition of exam papers from the question bank (faculty)
    path("exam-papers/<int:pk>/full/", views.ExamPaperFullView.as_view(), name="exam-paper-full"),
    path("exam-papers/<int:pk>/questions/add/", views.AddPaperQuestionsView.as_view(), name="exam-paper-add-questions"),
    path("exam-papers/<int:pk>/questions/reorder/", views.ReorderPaperQuestionsView.as_view(), name="exam-paper-reorder"),
    path("exam-papers/<int:pk>/questions/remove/<int:placement_id>/", views.RemovePaperQuestionView.as_view(), name="exam-paper-remove-question"),
]
