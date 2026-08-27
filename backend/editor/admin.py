from django.contrib import admin

from .models import ExamPage, ExamPaper, ExamPaperQuestion, UploadedImage


class ExamPageInline(admin.TabularInline):
    model = ExamPage
    extra = 0


class PaperQuestionsInline(admin.TabularInline):
    model = ExamPaperQuestion
    extra = 0
    readonly_fields = ["added_at"]


@admin.register(ExamPaper)
class ExamPaperAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "created_by", "updated_at"]
    inlines = [ExamPageInline, PaperQuestionsInline]


@admin.register(UploadedImage)
class UploadedImageAdmin(admin.ModelAdmin):
    list_display = ["id", "image", "exam_paper", "uploaded_at"]
