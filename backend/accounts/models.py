from django.conf import settings
from django.db import models

from .permissions import ADMIN_ROLE, FACULTY_ROLE, ROLE_CHOICES


class Profile(models.Model):
    """
    Role information for a user.

    Role resolution used across the whole system:
      * ``user.is_superuser``          -> treated as ADMIN always
      * ``user.profile.role == ADMIN`` -> ADMIN
      * anything else                  -> FACULTY
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="profile",
        on_delete=models.CASCADE,
    )
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default=FACULTY_ROLE,
        db_index=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user__username"]

    def __str__(self):
        return f"{self.user.username} ({self.role})"

    @property
    def is_admin_role(self):
        return self.role == ADMIN_ROLE
