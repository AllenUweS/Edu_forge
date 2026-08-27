from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import Profile

from exam_project.testutils import api_client

User = get_user_model()


def make_user(username, *, role="FACULTY", superuser=False):
    user = User.objects.create_user(
        username=username,
        email=f"{username}@example.com",
        password="pass12345",
        is_superuser=superuser,
    )
    profile, _ = Profile.objects.get_or_create(user=user)
    profile.role = role
    profile.save(update_fields=["role"])
    Token.objects.get_or_create(user=user)
    return user


class ProfileSignalTests(TestCase):
    def test_profile_created_with_user(self):
        user = User.objects.create_user(username="newbie", password="pass12345")
        self.assertTrue(Profile.objects.filter(user=user).exists())
        self.assertEqual(user.profile.role, "FACULTY")


class AuthFlowTests(TestCase):
    def setUp(self):
        self.client = api_client()
        self.user = make_user("alice", role="ADMIN")

    def test_register_creates_faculty_and_returns_token(self):
        res = self.client.post("/api/auth/register/", {
            "username": "bob", "email": "b@x.com", "password": "secret123",
            "first_name": "Bob", "last_name": "B",
        })
        self.assertEqual(res.status_code, 201)
        self.assertIn("token", res.data)
        self.assertEqual(res.data["user"]["role"], "FACULTY")
        # Role cannot be elevated through registration input.
        self.assertFalse(Profile.objects.get(user__username="bob").is_admin_role)

    def test_login_returns_token(self):
        res = self.client.post("/api/auth/login/", {
            "username": "alice", "password": "pass12345",
        })
        self.assertEqual(res.status_code, 200)
        self.assertEqual(Token.objects.get(user=self.user).key, res.data["token"])

    def test_login_rejects_bad_password(self):
        res = self.client.post("/api/auth/login/", {
            "username": "alice", "password": "wrong",
        })
        self.assertEqual(res.status_code, 400)

    def test_me_requires_authentication(self):
        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, 401)

        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.user.auth_token.key}")
        res = self.client.get("/api/auth/me/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data["role"], "ADMIN")

    def test_logout_invalidates_token(self):
        token_key = self.user.auth_token.key
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token_key}")
        self.assertEqual(self.client.post("/api/auth/logout/").status_code, 200)
        self.client.credentials()
        res = self.client.get("/api/auth/me/", HTTP_AUTHORIZATION=f"Token {token_key}")
        self.assertEqual(res.status_code, 401)


class RoleManagementTests(TestCase):
    def setUp(self):
        self.admin = make_user("admin1", role="ADMIN")
        self.other_admin = make_user("admin2", role="ADMIN")
        self.faculty = make_user("fac1", role="FACULTY")
        self.superuser = make_user("root", superuser=True)

    def auth(self, user):
        return api_client(user)

    def test_only_admin_lists_users(self):
        self.assertEqual(self.auth(self.admin).get("/api/users/").status_code, 200)
        self.assertEqual(self.auth(self.faculty).get("/api/users/").status_code, 403)

    def test_only_admin_changes_roles(self):
        # Admin promotes a faculty member.
        res = self.auth(self.admin).patch(
            f"/api/users/{self.faculty.id}/role/", {"role": "ADMIN"}
        )
        self.assertEqual(res.status_code, 200)
        self.faculty.profile.refresh_from_db()
        self.assertEqual(self.faculty.profile.role, "ADMIN")

        # A plain faculty user cannot change anyone's role.
        attacker = make_user("fac-attacker")
        res = self.auth(attacker).patch(
            f"/api/users/{self.admin.id}/role/", {"role": "FACULTY"}
        )
        self.assertEqual(res.status_code, 403)

    def test_cannot_demote_yourself(self):
        res = self.auth(self.admin).patch(
            f"/api/users/{self.admin.id}/role/", {"role": "FACULTY"}
        )
        self.assertEqual(res.status_code, 400)

    def test_superuser_counts_as_admin_without_profile_role(self):
        self.superuser.profile.role = "FACULTY"
        self.superuser.profile.save(update_fields=["role"])
        res = self.auth(self.superuser).patch(
            f"/api/users/{self.faculty.id}/role/", {"role": "ADMIN"}
        )
        self.assertEqual(res.status_code, 200)

    def test_make_admin_command(self):
        import io
        buffer = io.StringIO()
        call_command("make_admin", "fac1", stdout=buffer)
        self.faculty.profile.refresh_from_db()
        self.assertEqual(self.faculty.profile.role, "ADMIN")
