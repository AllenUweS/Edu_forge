from rest_framework import serializers
from django.db import transaction

from accounts.permissions import user_role

from .models import (
    Subject,
    Chapter,
    Media,
    Question,
    QuestionBank,
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


# =========================================================
# QUESTION BANKS
# =========================================================

class QuestionBankSummarySerializer(serializers.ModelSerializer):
    """Compact bank info embedded in question payloads."""

    owner_username = serializers.CharField(source="owner.username", read_only=True)
    owner_role = serializers.SerializerMethodField()

    class Meta:
        model = QuestionBank
        fields = ["id", "name", "owner", "owner_username", "owner_role"]

    def get_owner_role(self, obj):
        return user_role(obj.owner)


class QuestionBankSerializer(serializers.ModelSerializer):
    owner_username = serializers.CharField(read_only=True, source="owner.username")
    owner_role = serializers.SerializerMethodField()
    is_own = serializers.SerializerMethodField()
    questions_count = serializers.IntegerField(read_only=True, default=0)

    class Meta:
        model = QuestionBank
        fields = [
            "id",
            "name",
            "description",
            "owner",
            "owner_username",
            "owner_role",
            "is_own",
            "questions_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["owner"]

    def get_owner_role(self, obj):
        return user_role(obj.owner)

    def get_is_own(self, obj):
        request = self.context.get("request")
        return bool(request and obj.owner_id == request.user.id)

    def validate_name(self, value):
        """
        Per-owner uniqueness (constraint unique_bank_name_per_owner).
        DRF does not derive validators from new-style UniqueConstraints,
        and ``owner`` reaches us at save-time - so do it by hand here.
        """
        request = self.context.get("request")
        if request is None:
            return value
        clashes = QuestionBank.objects.filter(
            owner=request.user,
            name=value,
        )
        if self.instance is not None:
            clashes = clashes.exclude(pk=self.instance.pk)
        if clashes.exists():
            raise serializers.ValidationError(
                "You already have a question bank with this name."
            )
        return value


# =========================================================
# QUESTIONS (nested contents / options / solution)
# =========================================================

class QuestionContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionContent
        fields = ["id", "content_type", "text", "latex", "media", "sequence"]

    def validate(self, attrs):
        content_type = attrs.get("content_type") or getattr(self.instance, "content_type", None)
        if content_type == "EQUATION" and not (attrs.get("latex") or "").strip():
            raise serializers.ValidationError({"latex": "EQUATION content requires a latex value."})
        return attrs


class OptionContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionContent
        fields = ["id", "content_type", "text", "latex", "media", "sequence"]

    def validate(self, attrs):
        content_type = attrs.get("content_type") or getattr(self.instance, "content_type", None)
        if content_type == "EQUATION" and not (attrs.get("latex") or "").strip():
            raise serializers.ValidationError({"latex": "EQUATION content requires a latex value."})
        return attrs


class QuestionOptionSerializer(serializers.ModelSerializer):
    contents = OptionContentSerializer(many=True)

    class Meta:
        model = QuestionOption
        fields = ["id", "label", "sequence", "is_correct", "contents"]


class SolutionContentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SolutionContent
        fields = ["id", "content_type", "text", "latex", "media", "sequence"]

    def validate(self, attrs):
        content_type = attrs.get("content_type") or getattr(self.instance, "content_type", None)
        if content_type == "EQUATION" and not (attrs.get("latex") or "").strip():
            raise serializers.ValidationError({"latex": "EQUATION content requires a latex value."})
        return attrs


class SolutionSerializer(serializers.ModelSerializer):
    contents = SolutionContentSerializer(many=True)

    class Meta:
        model = Solution
        fields = ["id", "contents"]


class QuestionListSerializer(serializers.ModelSerializer):
    """
    Lightweight representation for browsing/filtering the question pool.
    Includes the first TEXT block so clients can render candidate lists
    without fetching full nested payloads.
    """

    question_bank_name = serializers.CharField(
        source="question_bank.name", read_only=True
    )
    bank_owner_role = serializers.SerializerMethodField()
    subject = serializers.IntegerField(
        source="chapter.subject_id", read_only=True
    )
    text_preview = serializers.SerializerMethodField()
    is_own = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = [
            "id",
            "question_bank",
            "question_bank_name",
            "bank_owner_role",
            "subject",
            "chapter",
            "difficulty",
            "marks",
            "negative_marks",
            "status",
            "created_by",
            "is_own",
            "text_preview",
            "created_at",
        ]

    def get_bank_owner_role(self, obj):
        return user_role(obj.question_bank.owner)

    def get_text_preview(self, obj):
        # Uses prefetched contents when available to avoid extra queries.
        for content in obj.contents.all():
            if content.content_type == "TEXT" and content.text:
                return content.text[:200]
        return ""

    def get_is_own(self, obj):
        request = self.context.get("request")
        return bool(request and obj.created_by_id == request.user.id)


REQUIRED_LABELS = ["A", "B", "C", "D"]


def _validate_options(options_data):
    if len(options_data) != 4:
        raise serializers.ValidationError(
            {"options": f"Exactly 4 options required. Got {len(options_data)}."}
        )
    labels = [opt.get("label") for opt in options_data]
    if sorted(labels) != REQUIRED_LABELS:
        raise serializers.ValidationError(
            {"options": f"Options must have labels A, B, C, D exactly once. Got: {labels}"}
        )
    correct = [opt.get("is_correct", False) for opt in options_data]
    if sum(1 for flag in correct if flag) != 1:
        raise serializers.ValidationError(
            {"options": "Exactly one option must have is_correct=true."}
        )


class QuestionSerializer(QuestionListSerializer):
    """
    Full read/write representation of a rich question.

    Reads: contents + options(+contents) + solution(+contents).
    Writes: nested create/update; ``question_bank`` is required unless the
    view injects it (e.g. POST /api/question-banks/<pk>/questions/).
    """

    contents = QuestionContentSerializer(many=True)
    options = QuestionOptionSerializer(many=True)
    solution = SolutionSerializer()

    class Meta(QuestionListSerializer.Meta):
        fields = QuestionListSerializer.Meta.fields + [
            "contents",
            "options",
            "solution",
            "updated_at",
        ]
        read_only_fields = ["created_by"]
        extra_kwargs = {
            # Not schema-required because context-owning views may inject it
            # (nested bank route, legacy chapter route). Explicit nulls are
            # tolerated here and normalised away in validate(); the pool
            # route still rejects a genuinely-missing bank with a clear
            # error afterwards.
            "question_bank": {"required": False, "allow_null": True},
        }

    @staticmethod
    def _create_content(model, parent_kwarg, parent_value, content_data, sequence):
        # Sequence is always derived from list order; inbound values would
        # otherwise collide with the per-parent unique constraint.
        data = dict(content_data)
        data["sequence"] = sequence
        return model.objects.create(**{parent_kwarg: parent_value}, **data)

    @transaction.atomic
    def create(self, validated_data):
        contents_data = self._pop_sequenced(validated_data.pop("contents", []))
        options_data = self._pop_sequenced(validated_data.pop("options"))
        solution_data = validated_data.pop("solution")

        question = Question.objects.create(**validated_data)

        for sequence, content_data in contents_data:
            QuestionContent.objects.create(question=question, **content_data)

        for sequence, option_data in options_data:
            option_contents = self._pop_sequenced(option_data.pop("contents", []))

            option = QuestionOption.objects.create(question=question, **option_data)

            for opt_sequence, content_data in option_contents:
                OptionContent.objects.create(option=option, **content_data)

        solution_contents = self._pop_sequenced(solution_data.pop("contents", []))
        solution = Solution.objects.create(question=question)
        for sol_sequence, content_data in solution_contents:
            SolutionContent.objects.create(solution=solution, **content_data)

        return question

    @staticmethod
    def _pop_sequenced(items):
        """
        Return [(sequence_from_list_order, item_dict), ...], dropping any
        client-supplied ``sequence`` so list order becomes the source of truth.
        """
        result = []
        for index, item in enumerate(items):
            item = dict(item)
            if "id" in item:
                item.pop("id", None)
            item.pop("sequence", None)
            item["sequence"] = index + 1
            result.append((index + 1, item))
        return result

    @transaction.atomic
    def update(self, instance, validated_data):
        contents_data = validated_data.pop("contents", None)
        options_data = validated_data.pop("options", None)
        solution_data = validated_data.pop("solution", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Nested collections are replaced wholesale when provided.
        if contents_data is not None:
            instance.contents.all().delete()
            for _, content_data in self._pop_sequenced(contents_data):
                QuestionContent.objects.create(question=instance, **content_data)

        if options_data is not None:
            instance.options.all().delete()
            for _, option_data in self._pop_sequenced(options_data):
                option_contents = self._pop_sequenced(option_data.pop("contents", []))
                option = QuestionOption.objects.create(question=instance, **option_data)
                for __, content_data in option_contents:
                    OptionContent.objects.create(option=option, **content_data)

        if solution_data is not None:
            solution_contents = self._pop_sequenced(solution_data.pop("contents", []))
            solution = getattr(instance, "solution", None)
            if solution:
                solution.delete()
            solution = Solution.objects.create(question=instance)
            for __, content_data in solution_contents:
                SolutionContent.objects.create(solution=solution, **content_data)

        return instance

    def validate(self, attrs):
        # An explicitly-null question_bank counts as "not supplied": views
        # that own the context inject the correct bank afterwards (nested
        # bank route, legacy chapter route).
        if attrs.get("question_bank") is None:
            attrs.pop("question_bank", None)
        return attrs

    def validate_options(self, options_data):
        _validate_options(options_data)
        return options_data

    def validate_solution(self, solution_data):
        if not solution_data.get("contents"):
            raise serializers.ValidationError({"solution": "At least one solution content item is required."})
        return solution_data
