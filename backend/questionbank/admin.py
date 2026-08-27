from django.contrib import admin

from .models import (
    Chapter,
    Media,
    OptionContent,
    Question,
    QuestionBank,
    QuestionContent,
    QuestionOption,
    Solution,
    SolutionContent,
    Subject,
)


class ChapterInline(admin.TabularInline):
    model = Chapter
    extra = 0


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "code", "is_active", "created_at"]
    inlines = [ChapterInline]


class QuestionContentInline(admin.TabularInline):
    model = QuestionContent
    extra = 0


class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 0


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = [
        "id", "question_bank", "chapter", "difficulty",
        "marks", "status", "created_by", "created_at",
    ]
    list_filter = ["difficulty", "status", "question_bank"]
    search_fields = ["contents__text"]
    inlines = [QuestionContentInline, QuestionOptionInline]


@admin.register(QuestionBank)
class QuestionBankAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "owner", "questions_count", "updated_at"]
    search_fields = ["name", "owner__username"]

    def questions_count(self, obj):
        return obj.questions.count()


admin.site.register([Media, OptionContent, Solution, SolutionContent])
