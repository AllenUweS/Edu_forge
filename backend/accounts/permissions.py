"""
Role constants and cheap helpers shared by every app.

These are plain functions so they can be reused from querysets, views,
serializers and permission classes alike.
"""

from django.core.exceptions import ImproperlyConfigured
from rest_framework.permissions import SAFE_METHODS, BasePermission

ADMIN_ROLE = "ADMIN"
FACULTY_ROLE = "FACULTY"

ROLE_CHOICES = [
    (ADMIN_ROLE, "Admin"),
    (FACULTY_ROLE, "Faculty"),
]


def user_role(user):
    """
    Return ADMIN_ROLE / FACULTY_ROLE, or None for anonymous users.

    Superusers are always considered ADMIN regardless of the stored role.
    A missing profile (should not happen thanks to signals) is treated as
    FACULTY to stay on the restrictive side.
    """
    if not getattr(user, "is_authenticated", False):
        return None
    if user.is_superuser:
        return ADMIN_ROLE
    # RelatedObjectDoesNotExist subclasses AttributeError, so a missing row
    # resolves to None here instead of raising.
    profile = getattr(user, "profile", None)
    if profile is None:
        return FACULTY_ROLE
    return profile.role


def is_admin(user):
    return user_role(user) == ADMIN_ROLE


def is_faculty(user):
    return user_role(user) == FACULTY_ROLE


class IsAdminRole(BasePermission):
    """Allows only ADMIN users (superusers included)."""

    def has_permission(self, request, view):
        return is_admin(request.user)


class IsFacultyRole(BasePermission):
    """
    Allows only FACULTY users.

    Deliberately excludes admins: per the system rules only faculty generate
    and manage exam papers.
    """

    def has_permission(self, request, view):
        return is_faculty(request.user)


class IsOwnerOrSuperuserForWrites(BasePermission):
    """
    Read for everyone who passed the view's queryset scoping; writes only for
    the object owner. Set ``owner_field`` on the view ("owner", "created_by",
    ...) or override ``get_owner_object(obj)``.
    """

    def get_owner_object(self, obj, view):
        field = getattr(view, "owner_field", None)
        if field:
            return getattr(obj, field, None)
        getter = getattr(view, "get_owner_object", None)
        if getter:
            return getter(obj)
        raise ImproperlyConfigured(
            "IsOwnerOrSuperuserForWrites needs view.owner_field "
            "or view.get_owner_object()."
        )

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        owner = self.get_owner_object(obj, view)
        return owner == request.user or is_admin(request.user)
