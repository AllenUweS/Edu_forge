"""
Shared test factories. Importable only in test contexts.

Kept in exam_project so any app's test suite can reuse them without
introducing app-to-app dependencies.
"""

from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from accounts.models import Profile
from questionbank.models import Chapter, Subject

User = get_user_model()


class FixedJSONAPIClient(APIClient):
    """
    This DRF version ignores ``APIClient(format='json')`` during body
    encoding, so force the per-request default instead of relying on it.
    """

    def post(self, path, data=None, **extra):
        extra.setdefault("format", "json")
        return super().post(path, data, **extra)

    def put(self, path, data=None, **extra):
        extra.setdefault("format", "json")
        return super().put(path, data, **extra)

    def patch(self, path, data=None, **extra):
        extra.setdefault("format", "json")
        return super().patch(path, data, **extra)

    def delete(self, path, data=None, **extra):
        extra.setdefault("format", "json")
        return super().delete(path, data, **extra)


def api_client(user=None):
    """Authenticated JSON test client (anonymous when user is None)."""
    client = FixedJSONAPIClient()
    if user is not None:
        client.credentials(HTTP_AUTHORIZATION=f"Token {user.auth_token.key}")
    return client


def make_user(username, *, role="FACULTY", superuser=False):
    user = User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="pass12345",
        is_superuser=superuser,
    )
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = role
    profile.save(update_fields=["role"])
    from rest_framework.authtoken.models import Token  # noqa: PLC0415

    Token.objects.get_or_create(user=user)
    return user


def make_chapter(name="Kinematics"):
    slug = name.lower().replace(" ", "-")[:12]
    subject = Subject.objects.create(name=f"Subject of {name}", code=f"S-{slug}")
    return Chapter.objects.create(
        subject=subject,
        name=name,
        code=f"C-{slug}",
        sequence=1,
    )


def question_payload(chapter_id, bank_id=None, **over):
    payload = {
        "question_bank": bank_id,
        "chapter": chapter_id,
        "difficulty": "MEDIUM",
        "marks": 4,
        "negative_marks": 1,
        "status": "DRAFT",
        "contents": [
            {"content_type": "TEXT", "text": "What is x?", "sequence": 1},
            {"content_type": "EQUATION", "latex": "x = v_0 t", "sequence": 2},
        ],
        "options": [
            {"label": "A", "sequence": 1, "is_correct": True,
             "contents": [{"content_type": "EQUATION", "latex": "x=1", "sequence": 1}]},
            {"label": "B", "sequence": 2, "is_correct": False,
             "contents": [{"content_type": "TEXT", "text": "two", "sequence": 1}]},
            {"label": "C", "sequence": 3, "is_correct": False,
             "contents": [{"content_type": "TEXT", "text": "three", "sequence": 1}]},
            {"label": "D", "sequence": 4, "is_correct": False,
             "contents": [{"content_type": "TEXT", "text": "four", "sequence": 1}]},
        ],
        "solution": {
            "contents": [
                {"content_type": "TEXT", "text": "Derive it.", "sequence": 1},
                {"content_type": "EQUATION", "latex": "x = \\frac{1}{2}at^2", "sequence": 2},
            ]
        },
    }
    payload.update(over)
    return payload
