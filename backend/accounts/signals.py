from django.conf import settings
from django.db.models.signals import post_migrate, post_save
from django.dispatch import receiver

from .models import Profile


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def ensure_user_profile(sender, instance, created, **kwargs):
    """Every newly created user gets a profile (FACULTY by default)."""
    if created:
        Profile.objects.get_or_create(user=instance)


@receiver(post_migrate)
def backfill_missing_profiles(sender, **kwargs):
    """Users that predate this app still need a profile."""
    if sender.label != "accounts":
        return

    from django.contrib.auth import get_user_model

    User = get_user_model()
    existing = set(Profile.objects.values_list("user_id", flat=True))
    missing = [
        Profile(user=u, role="ADMIN" if u.is_superuser else "FACULTY")
        for u in User.objects.exclude(id__in=existing)
    ]
    if missing:
        Profile.objects.bulk_create(missing)
