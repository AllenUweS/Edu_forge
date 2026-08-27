from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        # Guarantees every User has a Profile with a role.
        from . import signals  # noqa: F401
