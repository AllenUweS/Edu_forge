from django.contrib.auth import get_user_model
from django.test import TestCase
from .models import QuestionBank

from exam_project.testutils import (
    api_client,
    make_chapter,
    make_user,
    question_payload,
)

User = get_user_model()


class BankQuestionTestBase(TestCase):
    def setUp(self):
        self.admin = make_user("alice-admin", role="ADMIN")
        self.bob = make_user("bob-faculty")
        self.carol = make_user("carol-faculty")
        self.chapter = make_chapter()

    def auth(self, user):
        return api_client(user)

    def create_bank(self, user, name):
        client = self.auth(user)
        res = client.post(
            "/api/question-banks/",
            {"name": name, "description": ""},
        )
        self.assertEqual(res.status_code, 201, res.data)
        bank_id = res.data["id"]
        return QuestionBank.objects.get(pk=bank_id)

    def create_question(self, user, bank, chapter_id=None):
        client = self.auth(user)
        res = client.post(
            "/api/bank-questions/",
            question_payload(chapter_id or self.chapter.id, bank.id),
        )
        self.assertEqual(res.status_code, 201, res.data)
        return res.data["id"]


class QuestionBankTests(BankQuestionTestBase):
    def test_admin_bank_public_everyone_reads_owner_only_writes(self):
        admin_bank = self.create_bank(self.admin, "Admin NEET Physics")

        # Everyone can list & read.
        for user in (self.admin, self.bob, self.carol):
            res = self.auth(user).get("/api/question-banks/")
            ids = [b["id"] for b in res.data]
            self.assertIn(admin_bank.id, ids)

        # Faculty cannot modify the admin's bank...
        res = self.auth(self.bob).patch(
            f"/api/question-banks/{admin_bank.id}/", {"name": "Hacked"}
        )
        self.assertEqual(res.status_code, 403)
        # ...nor delete it.
        res = self.auth(self.bob).delete(f"/api/question-banks/{admin_bank.id}/")
        self.assertEqual(res.status_code, 403)

        # Other admins cannot modify either (strict owner rule).
        other_admin = make_user("admin-two", role="ADMIN")
        res = self.auth(other_admin).patch(
            f"/api/question-banks/{admin_bank.id}/", {"name": "X"}
        )
        self.assertEqual(res.status_code, 403)

        # Owner can.
        res = self.auth(self.admin).patch(
            f"/api/question-banks/{admin_bank.id}/", {"name": "Admin NEET"}
        )
        self.assertEqual(res.status_code, 200)

    def test_faculty_bank_private_to_owner(self):
        bob_bank = self.create_bank(self.bob, "Bob's Bank")

        # Carol must not see Bob's bank at all.
        res = self.auth(self.carol).get("/api/question-banks/")
        ids = [b["id"] for b in res.data]
        self.assertNotIn(bob_bank.id, ids)
        res = self.auth(self.carol).get(f"/api/question-banks/{bob_bank.id}/")
        self.assertEqual(res.status_code, 404)

        # Admins of any rank also keep out (owner-only writes/reads).
        res = self.auth(self.admin).get(f"/api/question-banks/{bob_bank.id}/")
        self.assertEqual(res.status_code, 404)

        # Superusers bypass.
        root = make_user("rootx", superuser=True)
        res = self.auth(root).get(f"/api/question-banks/{bob_bank.id}/")
        self.assertEqual(res.status_code, 200)

        # Duplicate names blocked per owner.
        res = self.auth(self.bob).post("/api/question-banks/", {"name": "Bob's Bank"})
        self.assertEqual(res.status_code, 400)


class QuestionTests(BankQuestionTestBase):
    def test_admin_question_visible_all_not_editable_by_faculty(self):
        admin_bank = self.create_bank(self.admin, "Public bank")
        qid = self.create_question(self.admin, admin_bank)

        # Readable by every faculty member.
        self.assertEqual(self.auth(self.bob).get(f"/api/bank-questions/{qid}/").status_code, 200)
        self.assertEqual(self.auth(self.carol).get(f"/api/bank-questions/{qid}/").status_code, 200)

        # Not editable/deletable by faculty.
        self.assertEqual(
            self.auth(self.bob).patch(f"/api/bank-questions/{qid}/", {"marks": 9}).status_code,
            403,
        )
        self.assertEqual(
            self.auth(self.bob).delete(f"/api/bank-questions/{qid}/").status_code,
            403,
        )

    def test_faculty_owns_own_questions_only(self):
        bob_bank = self.create_bank(self.bob, "Mine")
        qid = self.create_question(self.bob, bob_bank)
        other_qid = self.create_question(self.carol, self.create_bank(self.carol, "Carols"))

        # Bob edits and deletes his own question.
        res = self.auth(self.bob).patch(f"/api/bank-questions/{qid}/", {"marks": 7})
        self.assertEqual(res.status_code, 200)
        self.assertEqual(float(res.data["marks"]), 7)

        # ...but not Carol's (hidden => 404, no existence leak).
        self.assertEqual(
            self.auth(self.bob).patch(f"/api/bank-questions/{other_qid}/", {"marks": 1}).status_code,
            404,
        )
        self.assertEqual(
            self.auth(self.bob).get(f"/api/bank-questions/{other_qid}/").status_code,
            404,
        )

        # An admin role gains NO visibility into faculty-private banks, so
        # reaching Bob's question yields 404 as well - admins can neither
        # read nor edit questions locked inside someone else's private bank.
        self.assertEqual(
            self.auth(self.admin).patch(f"/api/bank-questions/{qid}/", {"marks": 2}).status_code,
            404,
        )

    def test_pool_browse_filters_and_visibility(self):
        admin_bank = self.create_bank(self.admin, "Pub")
        bob_bank = self.create_bank(self.bob, "Priv")

        admin_q = self.create_question(self.admin, admin_bank)
        own_q = self.create_question(self.bob, bob_bank)
        carol_q = self.create_question(self.carol, self.create_bank(self.carol, "C"))

        res = self.auth(self.bob).get("/api/bank-questions/?source=admin")
        self.assertEqual([q["id"] for q in res.data["results"]], [admin_q])

        res = self.auth(self.bob).get("/api/bank-questions/?mine=true")
        self.assertEqual([q["id"] for q in res.data["results"]], [own_q])

        res = self.auth(self.bob).get("/api/bank-questions/")
        all_ids = {q["id"] for q in res.data["results"]}
        self.assertEqual(all_ids, {admin_q, own_q})  # never Carol's

        res = self.auth(self.bob).get(
            f"/api/bank-questions/?difficulty=MEDIUM&chapter={self.chapter.id}"
        )
        self.assertEqual(len(res.data["results"]), 2)

        res = self.auth(self.bob).get("/api/bank-questions/?search=x%3F")
        self.assertEqual(len(res.data["results"]), 2)  # "What is x?" text match

    def test_question_validation_rules(self):
        client = self.auth(self.admin)
        bank = self.create_bank(self.admin, "V")

        # Not exactly 4 options -> rejected.
        bad = question_payload(self.chapter.id, bank.id)
        bad["options"] = bad["options"][:3]
        res = client.post("/api/bank-questions/", bad)
        self.assertEqual(res.status_code, 400)
        self.assertIn("options", str(res.data))

        # Two correct answers -> rejected.
        bad = question_payload(self.chapter.id, bank.id)
        bad["options"][1]["is_correct"] = True
        res = client.post("/api/bank-questions/", bad)
        self.assertEqual(res.status_code, 400)

        # EQUATION content without latex -> rejected.
        bad = question_payload(self.chapter.id, bank.id)
        bad["contents"][1] = {"content_type": "EQUATION", "latex": "", "sequence": 2}
        res = client.post("/api/bank-questions/", bad)
        self.assertEqual(res.status_code, 400)

    def test_full_update_replaces_nested_collections(self):
        bank = self.create_bank(self.admin, "Upd")
        qid = self.create_question(self.admin, bank)
        original = self.auth(self.admin).get(f"/api/bank-questions/{qid}/").data

        updated = dict(original)
        updated["question_bank"] = bank.id
        updated["chapter"] = self.chapter.id
        updated["contents"] = [
            {"content_type": "TEXT", "text": "New stem.", "sequence": 1}
        ]
        updated["solution"] = {
            "contents": [{"content_type": "TEXT", "text": "New solution.", "sequence": 1}]
        }
        res = self.auth(self.admin).put(f"/api/bank-questions/{qid}/", updated)
        self.assertEqual(res.status_code, 200, res.data)
        detail = self.auth(self.admin).get(f"/api/bank-questions/{qid}/").data
        self.assertEqual(detail["contents"][0]["text"], "New stem.")
        self.assertEqual(len(detail["contents"]), 1)


class LegacyEndpointTests(BankQuestionTestBase):
    def test_legacy_chapter_listing_respects_visibility(self):
        admin_bank = self.create_bank(self.admin, "Legacy public")
        public_q = self.create_question(self.admin, admin_bank)
        private_q = self.create_question(
            self.bob, self.create_bank(self.bob, "Legacy private")
        )

        res = self.auth(self.carol).get(
            f"/api/chapters/{self.chapter.id}/questions/"
        )
        ids = [q["id"] for q in res.data]
        self.assertIn(public_q, ids)
        self.assertNotIn(private_q, ids)

    def test_legacy_create_lands_in_personal_bank_with_creator(self):
        res = self.auth(self.bob).post(
            f"/api/chapters/{self.chapter.id}/questions/",
            question_payload(self.chapter.id),
        )
        self.assertEqual(res.status_code, 201, res.data)

        from .models import Question

        question = Question.objects.get(pk=res.data["id"])
        self.assertEqual(question.created_by, self.bob)
        self.assertEqual(question.question_bank.owner, self.bob)
        self.assertTrue(
            QuestionBank.objects.filter(
                name="My Questions", owner=self.bob
            ).exists()
        )
