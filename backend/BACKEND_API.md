# Exam Editor — Backend API Reference

Django + DRF + MySQL. No frontend included. Interactive schema: `/api/schema/`, Swagger UI: `/api/docs/`.

## Roles

| Role | Meaning |
|---|---|
| `ADMIN` | `user.is_superuser == True` **or** `profile.role == "ADMIN"`. Creates/manages question banks & questions in own banks. Admin banks are public. **Cannot create or pull questions into exam papers.** |
| `FACULTY` | Everyone else (default). Full CRUD on **own** banks/questions; read access to all admin banks; creates and composes exam papers. |

Self-registration always creates FACULTY accounts. Promote with:

```bash
py manage.py make_admin <username>            # promote
py manage.py make_admin <username> --demote   # back to faculty
# or: PATCH /api/users/<id>/role/ as an admin, or use /admin/
```

Bootstrap yourself an admin after migrating:

```bash
py manage.py createsuperuser      # superuser => ADMIN automatically
```

## Authentication

Token auth (`Authorization: Token <key>`). All endpoints require it except register/login.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/register/` | `{username,email,password,...}` → `{token,user{role=FACULTY}}` |
| POST | `/api/auth/login/` | `{username,password}` → `{token,user}` |
| POST | `/api/auth/logout/` | invalidates current token |
| GET  | `/api/auth/me/` | current user incl. `role` |
| GET  | `/api/users/` | ADMIN only |
| PATCH| `/api/users/<id>/role/` | ADMIN only; body `{"role":"ADMIN"\|"FACULTY"}`; self-demote blocked |

## Question banks

Visibility: ADMIN-owned banks are public; FACULTY banks are private; writes = owner only (superusers bypass).

| Method | Path |
|---|---|
| GET / POST | `/api/question-banks/` |
| GET / PUT / PATCH / DELETE | `/api/question-banks/<id>/` |
| GET / POST | `/api/question-banks/<id>/questions/` |

Bank names unique per owner. Deleting a bank deletes its questions — attempted while referenced by any saved paper → HTTP 409.

## Questions (rich)

Nested payload: `contents[]`, exactly four `options[]` (labels A–D, **exactly one** `is_correct=true`) each with nested `contents[]`, and `solution.contents[]`. All content items support `"content_type": "TEXT" \| "IMAGE" \| "EQUATION"` (`EQUATION` rows carry `latex`). Sequence numbers are derived from list order server-side.

| Method | Path | Notes |
|---|---|---|
| GET / POST | `/api/bank-questions/` | cross-bank pool. Filters: `?subject=&chapter=&difficulty=&status=&bank=&source=admin\|faculty&mine=true&search=` (paginated) |
| GET / PUT / PATCH / DELETE | `/api/bank-questions/<id>/` | detail/update/delete. Readable ⇒ visible per bank rules; writable ⇒ creator only |
| DELETE | `/api/bank-questions/<id>/` | referenced by a paper → HTTP 409 |

Legacy chapter paths still work: `GET/POST /api/chapters/<chapter_id>/questions/` (visibility-filtered; creates land in the caller's personal "My Questions" bank instead of anonymous rows) and `GET/PUT/PATCH/DELETE /api/questions/<id>/`. The free-form editor's structured-question endpoints under `/api/exam-papers/<paper_id>/questions/` are untouched apart from authentication and ownership scoping.

Media upload unchanged: `POST /api/media/`.

## Question papers (FACULTY only)

Papers reference banked questions via `ExamPaperQuestion` (sequence + optional marks overrides) — question data is never copied.

| Method | Path | Body / behaviour |
|---|---|---|
| GET | `/api/exam-papers/?mine=true` | own (+ unclaimed legacy); admins excluded from creating but superusers see all |
| POST | `/api/exam-papers/` | `{"title": ...}` (optionally legacy `pages`) — becomes property of caller |
| GET / PUT / DELETE | `/api/exam-papers/<id>/` | owner only; saving an unclaimed pre-roles paper claims it for faculty |
| GET | `/api/exam-papers/<id>/full/` | complete generated paper: ordered placements, fully-resolved questions (contents/options/solution), `total_questions`, `total_marks`, `total_negative_marks` |
| POST | `/api/exam-papers/<id>/questions/add/` | single: `{"question":12,"marks_override":null}` · bulk: `{"questions":[13,{"question":15,"marks_override":2}]}`. Only visible questions; duplicates rejected (HTTP 400 with `question_ids`) |
| DELETE | `/api/exam-papers/<id>/questions/remove/<placement_id>/` | detaches reference |
| POST | `/api/exam-papers/<id>/questions/reorder/` | `{"order":[<placement_id>,...]}` must cover every placement exactly once |

Free-form editor page syncs/pages/images APIs preserved (`/api/images/upload/`, pages inside paper payloads, symbols at `/api/symbols/`).

## Migrations applied

* `accounts.0001` — Profile(role)
* `questionbank.0004..0006` — QuestionBank table; `Question.question_bank` FK (nullable first, then legacy rows grouped into per-creator "Imported questions - <user>" banks — orphan rows into one publicly-readable bank owned by inactive `system-imported-bank`), NOT NULL afterwards; `latex` column + EQUATION type on all three content tables
* `editor.0004` — `ExamPaper.created_by`; `ExamPaperQuestion` (unique question-per-paper, dense-sequence constraints)

Run with `py manage.py migrate`. The backfill already ran on this machine's DB (4 legacy questions → bank #1).

## Permissions cheat-sheet

```
bank     view   : everyone if owner=ADMIN else owner (+superuser)
bank     write  : owner (+superuser)
question view   : follows its bank
question edit   : created_by == you (+superuser). Admins never edit others'.
paper    create : FACULTY role only
paper    view/edit/delete : owner (+superuser); unclaimed legacy claimable by faculty on save
question delete when placed in any paper  -> blocked (PROTECT, HTTP 409)
```

Test suite (hits MySQL `test_exam_editor_db`, auto-created/dropped):

```bash
py manage.py test accounts questionbank editor
```
