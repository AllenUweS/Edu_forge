from django.urls import path

from . import views

urlpatterns = [
    path("auth/register/", views.RegisterView.as_view(), name="auth-register"),
    path("auth/login/", views.LoginView.as_view(), name="auth-login"),
    path("auth/logout/", views.LogoutView.as_view(), name="auth-logout"),
    path("auth/me/", views.CurrentUserView.as_view(), name="auth-me"),

    path("users/", views.UserListCreateView.as_view(), name="user-list"),
    path("users/<int:pk>/role/", views.UserRoleUpdateView.as_view(), name="user-role"),
]
