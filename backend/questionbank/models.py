from django.db import models
from django.contrib.auth.models import User


class QuestionBank(models.Model):
    """
    A named collection of questions owned by one user.

    Visibility rule (enforced in querysets/permissions, see
    questionbank/permissions.py):
      * owner has the ADMIN role  -> bank is public: everyone can read it,
        only the owner/superuser can modify it
      * owner has the FACULTY role -> bank is private to its owner
      * superusers bypass every restriction
    """

    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default="")
    owner = models.ForeignKey(
        User,
        related_name="question_banks",
        on_delete=models.PROTECT,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "name"],
                name="unique_bank_name_per_owner",
            ),
        ]
        indexes = [
            models.Index(fields=["owner"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.owner.username})"


class Subject(models.Model):
    name = models.CharField(max_length=150, unique=True)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.code})"


class Chapter(models.Model):
    subject = models.ForeignKey(
        Subject,
        related_name="chapters",
        on_delete=models.CASCADE
    )
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=30)
    description = models.TextField(blank=True, default="")
    sequence = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sequence"]
        constraints = [
            models.UniqueConstraint(
                fields=["subject", "name"],
                name="unique_chapter_name_per_subject"
            ),
        ]
        indexes = [
            models.Index(fields=["subject", "sequence"]),
        ]

    def __str__(self):
        return f"{self.subject.code} - {self.name}"


class Media(models.Model):
    MEDIA_TYPE_CHOICES = [
        ("IMAGE", "Image"),
    ]

    file = models.ImageField(upload_to="questionbank/")
    media_type = models.CharField(
        max_length=20,
        choices=MEDIA_TYPE_CHOICES,
        default="IMAGE"
    )
    original_name = models.CharField(max_length=255, blank=True, default="")
    mime_type = models.CharField(max_length=100, blank=True, default="")
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    file_size = models.BigIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.original_name or self.file.name


class Question(models.Model):
    DIFFICULTY_CHOICES = [
        ("EASY", "Easy"),
        ("MEDIUM", "Medium"),
        ("HARD", "Hard"),
    ]

    STATUS_CHOICES = [
        ("DRAFT", "Draft"),
        ("PUBLISHED", "Published"),
        ("ARCHIVED", "Archived"),
    ]

    chapter = models.ForeignKey(
        Chapter,
        related_name="questions",
        on_delete=models.CASCADE
    )

    question_bank = models.ForeignKey(
        QuestionBank,
        related_name="questions",
        on_delete=models.CASCADE
    )

    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES
    )

    marks = models.DecimalField(
        max_digits=6,
        decimal_places=2
    )

    negative_marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=0
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="DRAFT"
    )

    created_by = models.ForeignKey(
        User,
        related_name="questionbank_questions",
        on_delete=models.PROTECT,
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["chapter"]),
            models.Index(fields=["question_bank"]),
            models.Index(fields=["difficulty"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"Question #{self.id}"


class QuestionContent(models.Model):
    CONTENT_TYPE_CHOICES = [
        ("TEXT", "Text"),
        ("IMAGE", "Image"),
        ("EQUATION", "Equation"),
    ]

    question = models.ForeignKey(
        Question,
        related_name="contents",
        on_delete=models.CASCADE
    )

    content_type = models.CharField(
        max_length=10,
        choices=CONTENT_TYPE_CHOICES
    )

    text = models.TextField(
        blank=True,
        null=True
    )

    # Raw LaTeX source for EQUATION rows (e.g. r"A = A_0(1 + \\sin t)").
    latex = models.TextField(blank=True, null=True)

    media = models.ForeignKey(
        Media,
        related_name="question_contents",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    sequence = models.PositiveIntegerField()

    class Meta:
        ordering = ["sequence"]
        constraints = [
            models.UniqueConstraint(
                fields=["question", "sequence"],
                name="unique_question_content_sequence"
            ),
        ]

    def __str__(self):
        return f"{self.question} - Content {self.sequence}"


class QuestionOption(models.Model):
    LABEL_CHOICES = [
        ("A", "A"),
        ("B", "B"),
        ("C", "C"),
        ("D", "D"),
    ]

    question = models.ForeignKey(
        Question,
        related_name="options",
        on_delete=models.CASCADE
    )

    label = models.CharField(
        max_length=1,
        choices=LABEL_CHOICES
    )

    sequence = models.PositiveIntegerField()

    is_correct = models.BooleanField(default=False)

    class Meta:
        ordering = ["sequence"]
        constraints = [
            models.UniqueConstraint(
                fields=["question", "label"],
                name="unique_option_label_per_question"
            ),
            models.UniqueConstraint(
                fields=["question", "sequence"],
                name="unique_option_sequence_per_question"
            ),
        ]

    def __str__(self):
        return f"{self.question} - {self.label}"


class OptionContent(models.Model):
    CONTENT_TYPE_CHOICES = [
        ("TEXT", "Text"),
        ("IMAGE", "Image"),
        ("EQUATION", "Equation"),
    ]

    option = models.ForeignKey(
        QuestionOption,
        related_name="contents",
        on_delete=models.CASCADE
    )

    content_type = models.CharField(
        max_length=10,
        choices=CONTENT_TYPE_CHOICES
    )

    text = models.TextField(
        blank=True,
        null=True
    )

    # Raw LaTeX source for EQUATION rows.
    latex = models.TextField(blank=True, null=True)

    media = models.ForeignKey(
        Media,
        related_name="option_contents",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    sequence = models.PositiveIntegerField()

    class Meta:
        ordering = ["sequence"]
        constraints = [
            models.UniqueConstraint(
                fields=["option", "sequence"],
                name="unique_option_content_sequence"
            ),
        ]


class Solution(models.Model):
    question = models.OneToOneField(
        Question,
        related_name="solution",
        on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Solution for Question #{self.question.id}"


class SolutionContent(models.Model):
    CONTENT_TYPE_CHOICES = [
        ("TEXT", "Text"),
        ("IMAGE", "Image"),
        ("EQUATION", "Equation"),
    ]

    solution = models.ForeignKey(
        Solution,
        related_name="contents",
        on_delete=models.CASCADE
    )

    content_type = models.CharField(
        max_length=10,
        choices=CONTENT_TYPE_CHOICES
    )

    text = models.TextField(
        blank=True,
        null=True
    )

    # Raw LaTeX source for EQUATION rows.
    latex = models.TextField(blank=True, null=True)

    media = models.ForeignKey(
        Media,
        related_name="solution_contents",
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    sequence = models.PositiveIntegerField()

    class Meta:
        ordering = ["sequence"]
        constraints = [
            models.UniqueConstraint(
                fields=["solution", "sequence"],
                name="unique_solution_content_sequence"
            ),
        ]
