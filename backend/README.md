# Exam Paper Editor — Django

A Word-like exam paper editor: Django + Django REST Framework + SQLite on
the backend, a single `contenteditable` page (plain HTML/CSS/JS, no
editor library) on the frontend. Django serves both the API and the
page, so the frontend calls the API with plain relative paths — no CORS
setup needed.

## Project layout

```
manage.py
requirements.txt
exam_project/          settings, project-level urls, wsgi
editor/
  models.py             ExamPaper, ExamPage, UploadedImage
  serializers.py         DRF serializers (nested pages, image URL)
  views.py                API views + the view that renders the editor page
  urls.py                 /api/... routes
  utils.py                links an uploaded image to a paper on save
  admin.py                 registers models with /admin/
  templates/editor/index.html   the editor page
  static/editor/editor.css
  static/editor/editor.js       all editor behaviour
media/                  uploaded images land here (MEDIA_ROOT)
```

## Setup

```bash
python -m venv venv
venv\Scripts\activate        # or: source venv/bin/activate on Mac/Linux
pip install -r requirements.txt

py manage.py migrate
py manage.py runserver
```

Open `http://127.0.0.1:8000/`.

(Optional) `py manage.py createsuperuser` to browse saved exam papers and
images at `/admin/`.

## How each requirement is handled

- **Run with `py manage.py runserver`** — standard Django project, no
  separate frontend build step. The editor page is a Django template
  (`editor/views.editor_page`) served at `/`.
- **Django + DRF + SQLite** — `rest_framework` in `INSTALLED_APPS`,
  default `DATABASES` engine is `sqlite3` (`db.sqlite3`, created on
  `migrate`).
- **Plain HTML/CSS/JS, no high-level editor library** — `editor.js` is
  vanilla JS using `contenteditable` and `document.execCommand`. No
  TinyMCE/Quill/CKEditor/TipTap.
- **Paste image from clipboard** — a `paste` listener on the pages
  container reads `clipboardData.items`, and if it finds an image it
  uploads it immediately and inserts the returned URL — the image is
  never inserted as a base64 data URL.
- **Upload sent to the API immediately** — `insertUploadedImage()` calls
  `POST /api/images/upload/` the moment a paste or file-picker selection
  happens, before anything is shown in the editor.
- **No Base64 in editor or database** — the editor only ever inserts
  `<img src="http://.../media/exam_images/....png">`; `ExamPage.content`
  is just HTML text containing that URL, never image data.
- **Images stored via API, path saved in SQLite** — `UploadedImage.image`
  is a Django `ImageField` (`upload_to="exam_images/"`); the file goes to
  `MEDIA_ROOT/exam_images/`, and the field just stores the relative path
  in SQLite.
- **Display pasted image in the editor** — the upload response's `url`
  is inserted directly into the `contenteditable` page.
- **Resize / move images** — each image sits inside a wrapper `<span>`
  with a small corner handle driven by plain mousedown/mousemove/mouseup
  (sets `img.style.width`). The wrapper is `contenteditable="false"`
  inside the `contenteditable="true"` page, which is enough for
  Chrome/Firefox to let you drag it to a new spot natively — no extra
  code needed for moving.
- **Bold / italic / underline / alignment** — `document.execCommand`
  (`bold`, `italic`, `underline`, `justifyLeft/Center/Right`).
- **Tables** — a rows/columns prompt builds a plain `<table>` and
  inserts it with `execCommand('insertHTML', ...)`.
- **Symbols** — a small fixed palette of common exam symbols (± × ÷ ≤ ≥
  π ∑ ∫ ...) that insert as plain unicode characters.
- **Equations** — LaTeX typed into a prompt, rendered client-side with
  [KaTeX](https://katex.org) (CDN) into a `contenteditable="false"` span
  that keeps the original LaTeX in `data-latex` so it can be reopened
  and edited.
- **Multiple pages** — each page is its own `.page` div; "+ Page" adds
  another, pages are added/removed manually rather than auto-paginating
  overflowing text (auto-pagination is a much harder problem than asked
  for here).
- **Save / load with formatting and images intact** — `ExamPaperSerializer`
  saves the title and each page's raw HTML as one `ExamPage` row per
  page. Loading just re-inserts each page's saved HTML back into a
  `.page` div, so formatting, tables, equations and images all come back
  exactly as saved (image URLs are absolute, so they still resolve).

## API endpoints

| Method | URL                          | Purpose                              |
|--------|------------------------------|---------------------------------------|
| POST   | `/api/images/upload/`         | Upload one image, returns `{id, url}` |
| GET    | `/api/exam-papers/`           | List papers (`id`, `title`, `updated_at`) |
| POST   | `/api/exam-papers/`           | Create a paper (`title`, `pages: [{content}]`) |
| GET    | `/api/exam-papers/<id>/`      | Full paper with ordered pages         |
| PUT    | `/api/exam-papers/<id>/`      | Replace title + all pages             |

## Notes / things to harden before production

- No auth on the API — add DRF permissions before exposing this
  publicly.
- No cleanup job for uploaded images that never end up linked to a
  paper (e.g. pasted, then the tab is closed without saving).
- `DEBUG = True` and `SECRET_KEY` in `settings.py` are dev-only — do not
  ship those as-is.
