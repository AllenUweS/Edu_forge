from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

from accounts.models import Profile
from accounts.permissions import ADMIN_ROLE, FACULTY_ROLE


class Command(BaseCommand):
    help = (
        "Promote or demote a user between ADMIN and FACULTY roles. "
        "Usage: py manage.py make_admin <username> [--demote]"
    )

    def add_arguments(self, parser):
        parser.add_argument("username")
        parser.add_argument("--demote", action="store_true", help="Set role to FACULTY")

    def handle(self, *args, **options):
        User = get_user_model()
        try:
            user = User.objects.get(username=options["username"])
        except User.DoesNotExist:
            raise CommandError(f"User '{options['username']}' does not exist.")

        role = FACULTY_ROLE if options["demote"] else ADMIN_ROLE
        profile, _ = Profile.objects.get_or_create(user=user)
        profile.role = role
        profile.save(update_fields=["role", "updated_at"])
        self.stdout.write(self.style.SUCCESS(f"{user.username} is now {role}."))
