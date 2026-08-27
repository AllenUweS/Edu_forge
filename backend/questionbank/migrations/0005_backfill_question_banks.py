from django.db import migrations


BANK_DESCRIPTION = (
    "Auto-created during the QuestionBank rollout. Questions that already "
    "existed were grouped into this bank by their original creator."
)


def ensure_profile(Profile, user):
    profile, _ = Profile.objects.get_or_create(user=user)
    return profile


def _fallback_owner(User, Profile):
    """
    Owner for legacy questions whose created_by is NULL: first active
    superuser, then first staff member, then first active user. If the
    database has no users at all, an inert placeholder account owns the
    imported bank so it can be reassigned from the admin panel later.
    """
    for qs in (
        User.objects.filter(is_superuser=True, is_active=True).order_by("pk"),
        User.objects.filter(is_staff=True, is_active=True).order_by("pk"),
        User.objects.filter(is_active=True).order_by("pk"),
    ):
        candidate = qs.first()
        if candidate:
            return candidate
    return User.objects.create(
        username="system-imported-bank",
        is_active=False,
        first_name="System",
        last_name="Imported",
    )


def forwards(apps, schema_editor):
    User = apps.get_model("auth", "User")
    Profile = apps.get_model("accounts", "Profile")
    Question = apps.get_model("questionbank", "Question")
    QuestionBank = apps.get_model("questionbank", "QuestionBank")

    pending = Question.objects.filter(question_bank__isnull=True)
    if not pending.exists():
        return

    # One import bank per original creator keeps ownership (and therefore
    # visibility) meaningful after the upgrade.
    by_creator = {}
    for row in (
        pending.values("id", "created_by_id").order_by("id")
    ):
        by_creator.setdefault(row["created_by_id"], []).append(row["id"])

    for creator_id, question_ids in by_creator.items():
        if creator_id:
            owner = User.objects.get(pk=creator_id)
            username = owner.username
            role = "ADMIN" if owner.is_superuser else "FACULTY"
            profile = ensure_profile(Profile, owner)
            profile.role = role
            profile.save(update_fields=["role"])
            bank_name = f"Imported questions - {username}"
        else:
            # Unowned legacy questions were globally visible before, so they
            # land in a publicly readable bank owned by an ADMIN.
            owner = _fallback_owner(User, Profile)
            profile = ensure_profile(Profile, owner)
            profile.role = "ADMIN"
            profile.save(update_fields=["role"])
            bank_name = "Imported questions"

        bank = QuestionBank.objects.create(
            name=bank_name,
            description=BANK_DESCRIPTION,
            owner=owner,
        )
        Question.objects.filter(id__in=question_ids).update(question_bank=bank.id)


def backwards(apps, schema_editor):
    # Forward-only: re-nulling questions would orphan them from any bank.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
        ("questionbank", "0004_optioncontent_latex_questioncontent_latex_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
