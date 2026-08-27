from django.db import models


class ExamPaper(models.Model):
    title = models.CharField(max_length=255, default="Untitled Exam")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} (#{self.id})"


class ExamPage(models.Model):
    exam_paper = models.ForeignKey(ExamPaper, related_name="pages", on_delete=models.CASCADE)
    page_number = models.PositiveIntegerField()
    content = models.TextField(blank=True, default="")  # raw editor HTML for this page

    class Meta:
        ordering = ["page_number"]

    def __str__(self):
        return f"{self.exam_paper.title} - page {self.page_number}"


class UploadedImage(models.Model):
    # Nullable: an image can be pasted before the exam paper has ever been
    # saved. It gets linked to a paper the first time that paper is saved.
    exam_paper = models.ForeignKey(
        ExamPaper, related_name="images", on_delete=models.SET_NULL, null=True, blank=True
    )
    image = models.ImageField(upload_to="exam_images/")
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.image.name


# ==================== STRUCTURED QUESTIONS (NEW) ====================


class Question(models.Model):
    """
    A structured exam question with plain text and equation placeholders.
    Syncs to a corresponding ExamPage for free-form editing.
    """
    exam_paper = models.ForeignKey(
        ExamPaper,
        related_name="structured_questions",
        on_delete=models.CASCADE
    )
    linked_page = models.OneToOneField(
        "ExamPage",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="linked_question",
        help_text="The free-form page that syncs with this question"
    )
    question_number = models.PositiveIntegerField(
        help_text="Auto-assigned unique number within exam paper"
    )
    question_text = models.TextField(
        help_text="Plain text ONLY with [[EQ:N]] placeholders, no HTML"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["question_number"]
        unique_together = [["exam_paper", "question_number"]]
        indexes = [
            models.Index(fields=["exam_paper", "question_number"]),
        ]

    def __str__(self):
        return f"Q{self.question_number} of {self.exam_paper.title}"


class Option(models.Model):
    """An option for a question. Exactly 4 options per question: A, B, C, D."""
    OPTION_CHOICES = [
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
        choices=OPTION_CHOICES,
        help_text="One of: A, B, C, D"
    )
    option_text = models.TextField(
        help_text="Plain text ONLY with [[EQ:N]] placeholders, no HTML"
    )

    class Meta:
        unique_together = [["question", "label"]]
        ordering = ["label"]
        indexes = [
            models.Index(fields=["question", "label"]),
        ]

    def __str__(self):
        return f"{self.question} - Option {self.label}"


class QuestionEquation(models.Model):
    """
    LaTeX equations for questions using proper ForeignKey.
    Stores ONLY original LaTeX; never rendered KaTeX HTML.
    """
    question = models.ForeignKey(
        Question,
        related_name="equations",
        on_delete=models.CASCADE
    )
    latex = models.TextField(
        help_text="Raw LaTeX only, e.g. A = A_0(1 + \\sin t)"
    )
    placeholder = models.CharField(
        max_length=20,
        help_text="Placeholder in text, e.g. [[EQ:1]]"
    )
    position = models.PositiveIntegerField(
        default=0,
        help_text="Order of appearance in question text"
    )

    class Meta:
        ordering = ["position"]
        unique_together = [["question", "placeholder"]]
        indexes = [
            models.Index(fields=["question", "position"]),
        ]

    def __str__(self):
        return f"Equation {self.placeholder} for {self.question}"


class OptionEquation(models.Model):
    """
    LaTeX equations for options using proper ForeignKey.
    Stores ONLY original LaTeX; never rendered KaTeX HTML.
    """
    option = models.ForeignKey(
        Option,
        related_name="equations",
        on_delete=models.CASCADE
    )
    latex = models.TextField(
        help_text="Raw LaTeX only"
    )
    placeholder = models.CharField(
        max_length=20,
        help_text="Placeholder in text, e.g. [[EQ:1]]"
    )
    position = models.PositiveIntegerField(
        default=0,
        help_text="Order of appearance in option text"
    )

    class Meta:
        ordering = ["position"]
        unique_together = [["option", "placeholder"]]
        indexes = [
            models.Index(fields=["option", "position"]),
        ]

    def __str__(self):
        return f"Equation {self.placeholder} for {self.option}"


class Symbol(models.Model):
    """Symbol/equation library for NEET, KCET, JEE exams."""
    CATEGORY_CHOICES = [
        ("greek", "Greek Letters"),
        ("math-ops", "Math Operators"),
        ("fractions", "Fractions & Roots"),
        ("powers", "Powers & Indices"),
        ("calculus", "Calculus"),
        ("vectors", "Vectors & Matrices"),
        ("trig", "Trigonometry"),
        ("phys", "Physics Symbols"),
        ("chem", "Chemical Formulas"),
        ("chem-reac", "Chemical Reactions"),
        ("units", "Units"),
        ("sets", "Sets & Logic"),
        ("misc", "Miscellaneous"),
    ]

    EXAM_TYPE_CHOICES = [
        ("neet", "NEET"),
        ("kcet", "KCET/CET"),
        ("jee", "JEE"),
        ("all", "All"),
    ]

    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    exam_type = models.CharField(max_length=10, choices=EXAM_TYPE_CHOICES, default="all")
    latex = models.TextField(help_text="LaTeX source")
    display_name = models.CharField(max_length=100, help_text="Human-readable name")
    search_tags = models.CharField(max_length=200, blank=True, help_text="Comma-separated tags")
    is_favorite = models.BooleanField(default=False)

    class Meta:
        ordering = ["category", "display_name"]
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["exam_type"]),
            models.Index(fields=["is_favorite"]),
        ]

    def __str__(self):
        return f"{self.display_name} ({self.category})"
