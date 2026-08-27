from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers
from rest_framework.authtoken.models import Token

from .models import Profile
from .permissions import FACULTY_ROLE, user_role


class RegisterSerializer(serializers.ModelSerializer):
    """
    Open registration always creates a FACULTY account.

    The role is forced server-side: clients cannot elevate themselves.
    ADMIN accounts are granted by an existing admin via
    PATCH /api/users/<id>/role/ or the make_admin management command.
    """

    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "password"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data, password=password)
        Profile.objects.get_or_create(user=user, defaults={"role": FACULTY_ROLE})
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(
            username=attrs.get("username"),
            password=attrs.get("password"),
        )
        if not user:
            raise serializers.ValidationError("Invalid username or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account is disabled.")
        attrs["user"] = user
        return attrs

    def create_token(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        return token


class UserSerializer(serializers.ModelSerializer):
    # Role lives on the related Profile; expose it flat for convenience.
    role = serializers.SerializerMethodField()
    is_superuser = serializers.BooleanField(read_only=True)
    role_label = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_superuser",
            "role",
            "role_label",
            "date_joined",
        ]

    def _profile_role(self, obj):
        profile = getattr(obj, "profile", None)
        return profile.role if profile else None

    def get_role(self, obj):
        return self._profile_role(obj)

    def get_role_label(self, obj):
        return user_role(obj)


class RoleUpdateSerializer(serializers.Serializer):
    """Used by admins to promote/demote users."""

    role = serializers.ChoiceField(choices=Profile._meta.get_field("role").choices)
