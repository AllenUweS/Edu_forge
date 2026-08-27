from django.contrib.auth import get_user_model
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token

from .models import Profile
from .permissions import ADMIN_ROLE, IsAdminRole
from .serializers import (
    LoginSerializer,
    RegisterSerializer,
    RoleUpdateSerializer,
    UserSerializer,
)

User = get_user_model()


# =========================================================
# AUTHENTICATION
# POST /api/auth/register/
# =========================================================

class RegisterView(generics.CreateAPIView):
    """Open signup; the resulting account is always a FACULTY account."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        payload = {
            "token": token.key,
            "user": UserSerializer(user, context={"request": request}).data,
        }
        return Response(payload, status=status.HTTP_201_CREATED)


# POST /api/auth/login/
class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token = serializer.create_token(user)
        payload = {
            "token": token.key,
            "user": UserSerializer(user, context={"request": request}).data,
        }
        return Response(payload)


# POST /api/auth/logout/
class LogoutView(APIView):
    def post(self, request):
        Token.objects.filter(user=request.user).delete()
        return Response({"detail": "Logged out."})


# GET /api/auth/me/
class CurrentUserView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


# =========================================================
# USER / ROLE MANAGEMENT  (ADMIN only)
# GET    /api/users/
# POST   /api/users/          (create user directly as admin)
# PATCH  /api/users/<pk>/role/
# =========================================================

class UserListCreateView(generics.ListCreateAPIView):
    queryset = User.objects.select_related("profile").order_by("username")
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]


class UserRoleUpdateView(APIView):
    permission_classes = [IsAdminRole]

    def patch(self, request, pk):
        user = generics.get_object_or_404(User, pk=pk)
        serializer = RoleUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile, _ = Profile.objects.get_or_create(user=user)
        # Guard rails: nobody demotes themselves into lockout, and only
        # superusers can touch other superusers' effective role.
        if user.pk == request.user.pk and serializer.validated_data["role"] != ADMIN_ROLE:
            return Response(
                {"detail": "You cannot remove your own ADMIN role."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if user.is_superuser and not request.user.is_superuser:
            return Response(
                {"detail": "Only a superuser can change another superuser's role."},
                status=status.HTTP_403_FORBIDDEN,
            )
        profile.role = serializer.validated_data["role"]
        profile.save(update_fields=["role", "updated_at"])
        return Response(UserSerializer(user).data)
