"""
Visibility/modification rules for question banks and questions.

The rules are derived from the bank's owner role:
  * ADMIN-owned bank  -> public: everyone reads it, only its owner (or a
    superuser) modifies it
  * FACULTY-owned bank -> private: only that owner (or a superuser)
  * questions inherit their bank's visibility, but modification additionally
    requires being the question's creator
"""

from django.db.models import Q
from rest_framework.permissions import SAFE_METHODS, BasePermission

from accounts.permissions import ADMIN_ROLE


def bank_visibility_q(user):
    """Q-object restricting banks to what ``user`` may see."""
    return Q(owner=user) | Q(owner__profile__role=ADMIN_ROLE)


def visible_banks(user):
    from .models import QuestionBank

    qs = QuestionBank.objects.select_related("owner__profile")
    if user.is_superuser:
        return qs.all()
    return qs.filter(bank_visibility_q(user))


def can_view_bank(user, bank):
    if user.is_superuser:
        return True
    return bank.owner_id == user.id or _bank_owner_role(bank) == ADMIN_ROLE


def can_modify_bank(user, bank):
    if user.is_superuser:
        return True
    return bank.owner_id == user.id


def visible_questions(user):
    """Queryset of every question ``user`` may read."""
    from .models import Question

    qs = Question.objects.select_related(
        "question_bank__owner__profile",
        "chapter__subject",
    ).prefetch_related("contents", "options__contents", "solution__contents")
    if user.is_superuser:
        return qs.all()
    return qs.filter(
        Q(question_bank__owner=user)
        | Q(question_bank__owner__profile__role=ADMIN_ROLE)
    )


def can_view_question(user, question):
    return can_view_bank(user, question.question_bank)


def can_edit_question(user, question):
    """Creator edits own questions; admins do NOT edit faculty questions."""
    if user.is_superuser:
        return True
    return question.created_by_id == user.id


def _bank_owner_role(bank):
    profile = getattr(getattr(bank.owner, "profile", None), "role", None)
    return profile


class CanEditQuestion(BasePermission):
    """
    Read for anyone who reached the object through the scoped queryset;
    writes only for the question's creator (superusers bypass).
    """

    message = "You can only modify your own questions."

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return can_edit_question(request.user, obj)


class CanModifyBank(BasePermission):
    """Read allowed, writes restricted to the bank's owner."""

    owner_field = "owner"

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        return can_modify_bank(request.user, obj)
