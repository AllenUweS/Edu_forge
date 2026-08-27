from django.test import TestCase

from questionbank.models import QuestionBank
from .models import ExamPaper, ExamPaperQuestion

from exam_project.testutils import (
    api_client,
    make_chapter,
    make_user,
    question_payload,
)


class PaperTestBase(TestCase):
    def setUp(self):
        self.admin = make_user("alice-admin", role="ADMIN")
        self.bob = make_user("bob-faculty")
        self.carol = make_user("carol-faculty")
        self.chapter = make_chapter()

    def auth(self, user):
        return api_client(user)

    def create_bank_and_question(self, user, bank_name="Bank", **payload_over):
        bank, _ = QuestionBank.objects.get_or_create(
            name=bank_name,
            owner=user,
        )
        payload = question_payload(self.chapter.id, bank.id, **payload_over)
        res = self.auth(user).post("/api/bank-questions/", payload)
        self.assertEqual(res.status_code, 201, res.data)
        return bank, res.data["id"]

    def create_paper(self, user, title="Term Test"):
        res = self.auth(user).post("/api/exam-papers/", {"title": title})
        self.assertEqual(res.status_code, 201, res.data)
        return res.data["id"]


class PaperAccessTests(PaperTestBase):
    def test_anonymous_blocked_everywhere(self):
        anon = api_client()
        self.assertEqual(anon.get("/api/exam-papers/").status_code, 401)
        self.assertEqual(anon.post("/api/exam-papers/", {"title": "x"}).status_code, 401)

    def test_only_faculty_creates_papers(self):
        self.assertEqual(
            self.auth(self.bob).post("/api/exam-papers/", {"title": "B1"}).status_code,
            201,
        )
        # Admin role is NOT allowed to create papers.
        res = self.auth(self.admin).post("/api/exam-papers/", {"title": "A1"})
        self.assertEqual(res.status_code, 403)

    def test_listing_scopes_to_owner_plus_legacy(self):
        bob_paper = self.create_paper(self.bob, "Bob's")
        carol_paper = self.create_paper(self.carol, "Carol's")
        legacy = ExamPaper.objects.create(title="Legacy free-form")

        ids = lambda u: {p["id"] for p in self.auth(u).get("/api/exam-papers/").data}
        self.assertEqual(ids(self.bob), {int(bob_paper), int(legacy.id)})
        self.assertEqual(ids(self.carol), {int(carol_paper), int(legacy.id)})

        root = make_user("rootx", superuser=True)
        self.assertEqual(ids(root), {int(bob_paper), int(carol_paper), int(legacy.id)})

    def test_claim_on_save_of_unclaimed_paper_faculty_only(self):
        legacy = ExamPaper.objects.create(title="Old draft")

        # Visible (thus editable) to faculty; save claims it.
        put_body = {"title": "Claimed by Bob", "pages": [{"content": "<p>x</p>"}]}
        res = self.auth(self.bob).put(f"/api/exam-papers/{legacy.id}/", put_body)
        self.assertEqual(res.status_code, 200)
        legacy.refresh_from_db()
        self.assertEqual(legacy.created_by, self.bob)

        # A second unclaimed paper cannot be claimed or saved by an admin.
        other = ExamPaper.objects.create(title="Other old")
        res = self.auth(self.admin).put(f"/api/exam-papers/{other.id}/", put_body)
        self.assertEqual(res.status_code, 403)

    def test_other_faculty_cannot_touch_my_paper(self):
        paper_id = self.create_paper(self.carol, "Secret")

        # Bob can't even see it.
        self.assertEqual(self.auth(self.bob).get(f"/api/exam-papers/{paper_id}/").status_code, 404)
        self.assertEqual(
            self.auth(self.bob).put(f"/api/exam-papers/{paper_id}/", {"title": "hax"}).status_code,
            404,
        )


class PaperCompositionTests(PaperTestBase):
    def setUp(self):
        super().setUp()
        self.public_bank, self.public_q = self.create_bank_and_question(
            self.admin, "Admin public"
        )
        _, self.bob_q = self.create_bank_and_question(self.bob, "Bob private")
        _, self.carol_q = self.create_bank_and_question(self.carol, "Carol private")
        self.paper_id = self.create_paper(self.bob, "Physics Unit Test")

    def add(self, user, body):
        return self.auth(user).post(
            f"/api/exam-papers/{self.paper_id}/questions/add/", body
        )

    def test_add_single_bulks_and_overrides(self):
        # Single id form with an admin-bank question.
        res = self.add(self.bob, {"question": self.public_q})
        self.assertEqual(res.status_code, 201, res.data)
        placement_id = res.data[0]["id"]
        self.assertEqual(res.data[0]["sequence"], 1)

        # Bulk mixed form with a marks override on Bob's own question.
        res = self.add(self.bob, {
            "questions": [
                self.bob_q,
                {"question": self.carol_q},  # hidden to Bob -> whole request fails
            ]
        })
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.data["question_ids"], [self.carol_q])

        res = self.add(self.bob, {
            "questions": [
                {"question": self.bob_q, "marks_override": "10"},
                {"question": self.public_q},  # duplicate of earlier add -> rejected
            ]
        })
        self.assertEqual(res.status_code, 400)
        self.assertIn("already part", str(res.data["detail"]))

        # Re-add Bob's own question successfully.
        res = self.add(self.bob, {"question": self.bob_q, "marks_override": 10})
        self.assertEqual(res.status_code, 201, res.data)
        second_placement = res.data[0]["id"]

        full = self.auth(self.bob).get(f"/api/exam-papers/{self.paper_id}/full/").data
        self.assertEqual(full["total_questions"], 2)
        self.assertEqual(full["total_marks"], 14.0)  # 4 (public) + 10 override
        first, second = full["questions"][0], full["questions"][1]
        self.assertEqual(first["sequence"], 1)
        self.assertEqual(float(second["marks_effective"]), 10.0)
        self.assertEqual(second["id"], second_placement)

        # Full payload embeds the resolved rich question incl. solution.
        embedded = first["question"]
        self.assertIn(embedded["id"], (self.public_q,))
        self.assertEqual(len(embedded["options"]), 4)
        self.assertTrue(any(o["is_correct"] for o in embedded["options"]))
        self.assertTrue(embedded["solution"]["contents"])

        # Everything above done BY the owner; admin can't compose papers.
        res = self.auth(self.admin).post(
            f"/api/exam-papers/{self.paper_id}/questions/add/",
            {"question": self.public_q},
        )
        # Carol's paper invisible? This one belongs to BOB; admin gets 404.
        self.assertEqual(res.status_code, 404)

    def test_remove_and_reorder(self):
        p1 = self.add(self.bob, {"question": self.public_q}).data[0]
        p2 = self.add(self.bob, {"question": self.bob_q}).data[0]

        res = self.auth(self.bob).delete(
            f"/api/exam-papers/{self.paper_id}/questions/remove/{p1['id']}/"
        )
        self.assertEqual(res.status_code, 204)

        # Gaps are fine; reorder must cover every remaining placement once.
        res = self.auth(self.bob).post(
            f"/api/exam-papers/{self.paper_id}/questions/reorder/",
            {"order": [p2["id"]]},
        )
        self.assertEqual(res.status_code, 200)

        bad_orders = [
            [],                      # empty
            [p2["id"], p1["id"]],    # removed id included
            [p2["id"], p2["id"]],    # duplicates
        ]
        for order in bad_orders:
            res = self.auth(self.bob).post(
                f"/api/exam-papers/{self.paper_id}/questions/reorder/",
                {"order": order},
            )
            self.assertEqual(res.status_code, 400)

        full = self.auth(self.bob).get(f"/api/exam-papers/{self.paper_id}/full/").data
        self.assertEqual([q["id"] for q in full["questions"]], [p2["id"]])
        self.assertEqual(full["questions"][0]["sequence"], 1)

    def test_carol_cannot_compose_into_bobs_paper(self):
        res = self.add(self.carol, {"question": self.public_q})
        self.assertEqual(res.status_code, 404)  # paper hidden from her

    def test_placed_question_is_protected_from_deletion(self):
        placement = self.add(self.bob, {"question": self.public_q}).data[0]

        # Faculty cannot delete admin questions anyway...
        self.assertEqual(
            self.auth(self.bob).delete(f"/api/bank-questions/{self.public_q}/").status_code,
            403,
        )
        # ...and even its OWNER cannot delete while it sits in a paper (PROTECT).
        self.assertEqual(
            self.auth(self.admin).delete(f"/api/bank-questions/{self.public_q}/").status_code,
            409,
        )

        # After removing from the paper deletion works again.
        self.auth(self.bob).delete(
            f"/api/exam-papers/{self.paper_id}/questions/remove/{placement['id']}/"
        )
        self.assertEqual(
            self.auth(self.admin).delete(f"/api/bank-questions/{self.public_q}/").status_code,
            204,
        )
