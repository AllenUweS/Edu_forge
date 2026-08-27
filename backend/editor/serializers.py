from rest_framework import serializers
from django.db import models

from questionbank.serializers import (
    QuestionSerializer as BankQuestionSerializer,
)

from .models import (
    ExamPaper, ExamPaperQuestion, ExamPage, UploadedImage,
    Question, Option, QuestionEquation, OptionEquation, Symbol
)
from .utils import link_images_to_paper


# ==================== HELPER FUNCTIONS ====================

def render_question_to_html(question_data):
    """
    Render a structured question as HTML for free-form page display.
    Stores equations as HTML spans with data-latex attributes for frontend KaTeX rendering.
    Includes question number, question text with equations, images, and options A/B/C/D.
    """
    html = f'<div class="synced-question" data-question-id="{question_data.get("id", "")}">'

    # Question header
    html += f'<div class="synced-question-header">Q{question_data["question_number"]}. </div>'

    # Question text with equations - wrap placeholders in spans for frontend rendering
    question_text = question_data["question_text"]
    if question_data.get("equations"):
        for eq in question_data["equations"]:
            # Store as span with data-latex - frontend will render with KaTeX
            eq_html = f'<span class="equation" data-latex="{eq["latex"]}">{eq["placeholder"]}</span>'
            question_text = question_text.replace(eq["placeholder"], eq_html)
    html += f'<div class="synced-question-text">{question_text}</div>'

    # Options
    html += '<div class="synced-options">'
    for option in question_data.get("options", []):
        option_text = option["option_text"]
        # Wrap equation placeholders in spans
        if option.get("equations"):
            for eq in option["equations"]:
                eq_html = f'<span class="equation" data-latex="{eq["latex"]}">{eq["placeholder"]}</span>'
                option_text = option_text.replace(eq["placeholder"], eq_html)
        html += f'<div class="synced-option"><span class="option-label">{option["label"]})</span> {option_text}</div>'
    html += '</div>'

    html += '</div>'
    return html


def render_question_to_html_direct(question_number, question_text, options, equations):
    """
    Render a question directly from model objects (avoiding serializer).
    Used during create() to avoid calling to_representation().
    """
    html = f'<div class="synced-question">'

    # Question header
    html += f'<div class="synced-question-header">Q{question_number}. </div>'

    # Question text with equations
    for eq in equations:
        eq_html = f'<span class="equation" data-latex="{eq.latex}">[[EQ:{eq.position}]]</span>'
        question_text = question_text.replace(eq.placeholder, eq_html)
    html += f'<div class="synced-question-text">{question_text}</div>'

    # Options
    html += '<div class="synced-options">'
    for option in options:
        option_text = option.option_text
        # Render equations in options
        for eq in option.equations.all():
            eq_html = f'<span class="equation" data-latex="{eq.latex}">[[EQ:{eq.position}]]</span>'
            option_text = option_text.replace(eq.placeholder, eq_html)
        html += f'<div class="synced-option"><span class="option-label">{option.label})</span> {option_text}</div>'
    html += '</div>'

    html += '</div>'
    return html


# ==================== EXISTING SERIALIZERS (PRESERVED) ====================

class UploadedImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = UploadedImage
        fields = ["id", "url", "uploaded_at"]

    def get_url(self, obj):
        request = self.context.get("request")
        if not obj.image:
            return None
        return request.build_absolute_uri(obj.image.url) if request else obj.image.url


class ExamPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExamPage
        fields = ["id", "page_number", "content"]
        # page_number is assigned server-side (see create/update below),
        # so the frontend only ever needs to send { content }.
        extra_kwargs = {"page_number": {"required": False}}


class ExamPaperSerializer(serializers.ModelSerializer):
    # ``pages`` stays optional so a paper can be created title-first
    # (questions are attached afterwards); the free-form editor still sends it.
    pages = ExamPageSerializer(many=True, required=False)

    class Meta:
        model = ExamPaper
        fields = ["id", "title", "created_by", "created_at", "updated_at", "pages"]
        extra_kwargs = {"created_by": {"required": False}}

    def _create_pages(self, paper, pages_data):
        for i, page_data in enumerate(pages_data, start=1):
            ExamPage.objects.create(
                exam_paper=paper,
                page_number=i,
                content=page_data.get("content", ""),
            )

    def create(self, validated_data):
        pages_data = validated_data.pop("pages", [])
        paper = ExamPaper.objects.create(**validated_data)
        self._create_pages(paper, pages_data)
        link_images_to_paper(paper)
        return paper

    def update(self, instance, validated_data):
        pages_data = validated_data.pop("pages", None)
        instance.title = validated_data.get("title", instance.title)
        if not instance.created_by_id and validated_data.get("created_by"):
            instance.created_by = validated_data["created_by"]
        instance.save()

        # Replace all pages on every save (when provided).
        if pages_data is not None:
            instance.pages.all().delete()
            self._create_pages(instance, pages_data)

        link_images_to_paper(instance)
        return instance


# ==================== NEW SERIALIZERS ====================

class QuestionEquationSerializer(serializers.ModelSerializer):
    """Serializer for question equations using proper ForeignKey."""
    class Meta:
        model = QuestionEquation
        fields = ["id", "latex", "placeholder", "position"]


class OptionEquationSerializer(serializers.ModelSerializer):
    """Serializer for option equations using proper ForeignKey."""
    class Meta:
        model = OptionEquation
        fields = ["id", "latex", "placeholder", "position"]


class OptionSerializer(serializers.ModelSerializer):
    """Serializer for options with equations. Validates exactly 4 options."""
    equations = OptionEquationSerializer(many=True, read_only=True)

    class Meta:
        model = Option
        fields = ["id", "label", "option_text", "equations"]


class QuestionSerializer(serializers.ModelSerializer):
    """Serializer for questions with options and equations."""
    options = OptionSerializer(many=True)
    equations = QuestionEquationSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ["id", "question_number", "question_text", "options", "equations", "created_at", "updated_at"]
        extra_kwargs = {
            "question_number": {"read_only": True, "required": False}
        }

    def validate(self, data):
        """Ensure exactly 4 options (A, B, C, D) are provided."""
        options = data.get("options", [])
        if len(options) != 4:
            raise serializers.ValidationError(
                f"Exactly 4 options required. Got {len(options)}."
            )

        labels = [opt.get("label") for opt in options]
        required_labels = ["A", "B", "C", "D"]
        if sorted(labels) != sorted(required_labels):
            raise serializers.ValidationError(
                f"Options must have labels A, B, C, D. Got: {labels}"
            )

        return data

    def create(self, validated_data):
        """Create question with 4 options and sync to a free-form page."""
        options_data = validated_data.pop("options")
        equations_data = validated_data.pop("equations", [])

        # exam_paper is passed via context from get_serializer_context()
        exam = self.context.get("exam_paper")
        if not exam:
            raise serializers.ValidationError({"exam_paper": "Exam paper must be provided via context"})

        # Create question with exam_paper
        question = Question.objects.create(exam_paper=exam, **validated_data)

        # Create exactly 4 options
        for option_data in options_data:
            option_equations = option_data.pop("equations", [])
            option = Option.objects.create(question=question, **option_data)

            # Create equations for this option
            for eq_data in option_equations:
                OptionEquation.objects.create(option=option, **eq_data)

        # Create equations for the question
        for eq_data in equations_data:
            QuestionEquation.objects.create(question=question, **eq_data)

        # Create linked ExamPage for free-form sync
        # Use direct render to avoid to_representation() issues
        page_html = render_question_to_html_direct(
            question.question_number,
            question.question_text,
            list(question.options.all()),
            list(question.equations.all())
        )

        # Find next available page number
        max_page = ExamPage.objects.filter(
            exam_paper=question.exam_paper
        ).aggregate(models.Max("page_number"))["page_number__max"] or 0

        try:
            linked_page = ExamPage.objects.create(
                exam_paper=question.exam_paper,
                page_number=max_page + 1,
                content=page_html
            )

            question.linked_page = linked_page
            question.save()
        except Exception:
            # Continue without linked page - question is still valid
            pass

        return question

    def update(self, instance, validated_data):
        """Update question and its options, then sync to linked page."""
        options_data = validated_data.pop("options", None)
        equations_data = validated_data.pop("equations", None)

        # Update question fields
        instance.question_text = validated_data.get("question_text", instance.question_text)
        instance.save()

        # Update options if provided
        if options_data is not None:
            instance.options.all().delete()
            for option_data in options_data:
                option_equations = option_data.pop("equations", [])
                option = Option.objects.create(question=instance, **option_data)
                for eq_data in option_equations:
                    OptionEquation.objects.create(option=option, **eq_data)

        # Update equations if provided
        if equations_data is not None:
            instance.equations.all().delete()
            for eq_data in equations_data:
                QuestionEquation.objects.create(question=instance, **eq_data)

        # Sync to linked page
        if instance.linked_page:
            # Use direct render to avoid to_representation() issues
            page_html = render_question_to_html_direct(
                instance.question_number,
                instance.question_text,
                list(instance.options.all()),
                list(instance.equations.all())
            )
            instance.linked_page.content = page_html
            instance.linked_page.save()

        return instance


class SymbolSerializer(serializers.ModelSerializer):
    """Serializer for symbol library."""
    class Meta:
        model = Symbol
        fields = ["id", "category", "exam_type", "latex", "display_name", "search_tags", "is_favorite"]


# ==================== PAPER <-> QUESTION-BANK PLACEMENTS ====================

class PaperQuestionItemSerializer(serializers.ModelSerializer):
    """
    One placed question inside a paper: reference + order + overrides,
    including the FULL resolved rich question for complete-paper rendering.
    """

    marks_effective = serializers.SerializerMethodField()
    negative_marks_effective = serializers.SerializerMethodField()
    question = serializers.SerializerMethodField()

    class Meta:
        model = ExamPaperQuestion
        fields = [
            "id",
            "sequence",
            "marks_override",
            "negative_marks_override",
            "marks_effective",
            "negative_marks_effective",
            "question",
            "added_at",
        ]

    def get_marks_effective(self, obj):
        return obj.effective_marks

    def get_negative_marks_effective(self, obj):
        return obj.effective_negative_marks

    def get_question(self, obj):
        return BankQuestionSerializer(
            obj.question,
            context=self.context,
        ).data


class InputPlacementSerializer(serializers.Serializer):
    """Validates one add-to-paper entry."""

    question = serializers.IntegerField(min_value=1)
    marks_override = serializers.DecimalField(
        max_digits=6, decimal_places=2, required=False, allow_null=True
    )
    negative_marks_override = serializers.DecimalField(
        max_digits=6, decimal_places=2, required=False, allow_null=True
    )

    @staticmethod
    def normalized(validated):
        return {
            "question": validated["question"],
            "marks_override": validated.get("marks_override"),
            "negative_marks_override": validated.get("negative_marks_override"),
        }


class BulkPlacementsSerializer(serializers.Serializer):
    """
    Body accepted by POST /api/exam-papers/<pk>/questions/add/.

    Accepts either {"question": 5} / {"question": 5, "marks_override": 2}
    or a bulk form {"questions": [5, {"question": 6, "marks_override": 1}, ...]}.

    After validation ``validated_data["placements"]`` holds a de-duplicated
    list of normalized placement dicts preserving client order.
    """

    question = serializers.IntegerField(min_value=1, required=False)
    questions = serializers.ListField(
        child=serializers.JSONField(), required=False
    )
    marks_override = serializers.DecimalField(
        max_digits=6, decimal_places=2, required=False, allow_null=True
    )
    negative_marks_override = serializers.DecimalField(
        max_digits=6, decimal_places=2, required=False, allow_null=True
    )

    def validate(self, attrs):
        placements = []

        if attrs.get("question") is not None:
            placements.append(InputPlacementSerializer.normalized(attrs))

        for item in attrs.get("questions") or []:
            if isinstance(item, int):
                placements.append({
                    "question": item,
                    "marks_override": None,
                    "negative_marks_override": None,
                })
            elif isinstance(item, dict):
                entry = InputPlacementSerializer(data=item)
                entry.is_valid(raise_exception=True)
                placements.append(InputPlacementSerializer.normalized(entry.validated_data))
            else:
                raise serializers.ValidationError({
                    "questions": "Items must be question ids or objects like "
                                 "{\"question\": <id>, \"marks_override\": ...}."
                })

        if not placements:
            raise serializers.ValidationError(
                "Provide \"question\" (single add) or \"questions\" (bulk add)."
            )

        attrs["placements"] = placements
        return attrs
