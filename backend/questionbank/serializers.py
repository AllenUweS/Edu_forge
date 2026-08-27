from rest_framework import serializers
from django.db import transaction
from .models import (
    Subject,
    Chapter,
    Media,
    Question,
    QuestionContent,
    QuestionOption,
    OptionContent,
    Solution,
    SolutionContent,
)

class MediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Media
        fields = "__all__"


class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = "__all__"


class ChapterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chapter
        fields = "__all__"


class QuestionContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionContent
        fields = ["id", "content_type", "text", "media", "sequence"]


class OptionContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionContent
        fields = ["id", "content_type", "text", "media", "sequence"]


class QuestionOptionSerializer(serializers.ModelSerializer):
    contents = OptionContentSerializer(many=True)

    class Meta:
        model = QuestionOption
        fields = ["id", "label", "sequence", "is_correct", "contents"]


class SolutionContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolutionContent
        fields = ["id", "content_type", "text", "media", "sequence"]


class SolutionSerializer(serializers.ModelSerializer):
    contents = SolutionContentSerializer(many=True)

    class Meta:
        model = Solution
        fields = ["id", "contents"]


class QuestionSerializer(serializers.ModelSerializer):
    contents = QuestionContentSerializer(many=True)
    options = QuestionOptionSerializer(many=True)
    solution = SolutionSerializer()

    class Meta:
        model = Question
        fields = [
            "id",
            "chapter",
            "difficulty",
            "marks",
            "negative_marks",
            "status",
            "created_by",
            "contents",
            "options",
            "solution",
            "created_at",
            "updated_at",
        ]

    @transaction.atomic
    def create(self, validated_data):
        contents_data = validated_data.pop("contents", [])
        options_data = validated_data.pop("options", [])
        solution_data = validated_data.pop("solution", None)

        question = Question.objects.create(**validated_data)

        for content_data in contents_data:
            QuestionContent.objects.create(
                question=question,
                **content_data
            )

        for option_data in options_data:
            option_contents = option_data.pop("contents", [])

            option = QuestionOption.objects.create(
                question=question,
                **option_data
            )

            for content_data in option_contents:
                OptionContent.objects.create(
                    option=option,
                    **content_data
                )

        if solution_data:
            solution_contents = solution_data.pop("contents", [])

            solution = Solution.objects.create(
                question=question,
                **solution_data
            )

            for content_data in solution_contents:
                SolutionContent.objects.create(
                    solution=solution,
                    **content_data
                )

        return question