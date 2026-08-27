from django.contrib import admin

from .models import ExamPage, ExamPaper, UploadedImage


class ExamPageInline(admin.TabularInline):
    model = ExamPage
    extra = 0


@admin.register(ExamPaper)
class ExamPaperAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "updated_at"]
    inlines = [ExamPageInline]


@admin.register(UploadedImage)
class UploadedImageAdmin(admin.ModelAdmin):
    list_display = ["id", "image", "exam_paper", "uploaded_at"]
