# Structured Questions ↔ Free-form Pages Sync

## Implementation Summary

### Database Changes

**Question Model Added:**
- `linked_page` - OneToOneField to ExamPage, links each question to a free-form page

### What Syncs When

| Action | Free-form Page Update |
|--------|----------------------|
| **Create Question** | Creates new ExamPage with formatted HTML |
| **Update Question** | Updates linked ExamPage content |
| **Delete Question** | Deletes linked ExamPage |
| **Reorder Questions** | Page numbers automatically reassigned |

### Synced Content Format

Free-form pages display structured questions as:

```html
<div class="synced-question" data-question-id="1">
  <div class="synced-question-header">Q1. </div>
  <div class="synced-question-text">
    Question text with rendered equations and images
  </div>
  <div class="synced-options">
    <div class="synced-option"><span class="option-label">A)</span> Option text</div>
    <div class="synced-option"><span class="option-label">B)</span> Option text</div>
    <div class="synced-option"><span class="option-label">C)</span> Option text</div>
    <div class="synced-option"><span class="option-label">D)</span> Option text</div>
  </div>
</div>
```

### Image Support

**Structured Questions Now Support:**
1. **Paste Images** - Ctrl+V in question text or options
2. **Upload Images** - Click "Image" button when focused on question/option
3. **Image Display** - Images render inline in structured editor
4. **Image Sync** - Images appear in synced free-form pages

**Image Storage:**
- Uses existing `UploadedImage` model
- Linked to exam_paper via existing system
- No changes to image handling

### Equation Handling (Preserved)

**Storage:**
- Database stores **only LaTeX** (no rendered HTML)
- `question_text` contains `[[EQ:N]]` placeholders
- Images stored as `<img>` tags in same field

**Rendering:**
- Frontend replaces `[[EQ:N]]` with KaTeX-rendered HTML
- KaTeX only renders in browser, never stored in DB

### How It Works

#### Creating a Question
1. User fills in structured question (text, equations, images, options)
2. On save → `QuestionSerializer.create()`:
   - Creates Question record
   - Creates linked ExamPage
   - Renders HTML with equations
   - Saves HTML to ExamPage.content

#### Updating a Question
1. User edits structured question
2. On save → `QuestionSerializer.update()`:
   - Updates Question record
   - Re-renders HTML with updated content
   - Updates ExamPage.content

#### Loading in Free-form Mode
- Free-form pages show synced HTML with styled formatting
- Images display via existing `<img>` tags
- Equations already rendered in HTML

#### Loading in Structured Mode
- Loads from Question record (LaTeX only)
- Frontend re-renders equations from placeholders
- Images display via HTML stored in question_text

### Page Number Management

**When creating questions:**
- Each new question gets a new ExamPage
- Page numbers auto-increment across all pages

**When deleting questions:**
- Linked page is also deleted
- Remaining pages are not renumbered (gaps OK)

### CSS Styling

Free-form synced questions have distinct styling:
- Light gray background (#f9f9f9)
- Blue left border (3px)
- Styled option cards
- Bold option labels (A, B, C, D)

### API Changes

**New Question Field:**
```json
{
  "id": 1,
  "question_number": 1,
  "question_text": "Text with [[EQ:0]] and <img src='...'>",
  "linked_page": 5,
  "options": [...],
  "equations": [...]
}
```

### Testing Checklist

- ✅ Create question → Verify page created in free-form mode
- ✅ Update question → Verify page content updated
- ✅ Delete question → Verify page deleted
- ✅ Paste image in question → Verify image displays
- ✅ Upload image in option → Verify image displays
- ✅ Toggle modes → Verify content preserved
- ✅ Equation in question → Renders correctly in both modes
- ✅ Equation in option → Renders correctly in both modes

### Files Modified

1. **editor/models.py** - Added `linked_page` field
2. **editor/serializers.py** - Added page sync logic
3. **editor/views.py** - Added delete handling for linked page
4. **editor/static/editor/editor.js** - Added image support to structured mode
5. **editor/static/editor/editor.css** - Added synced question styles

### Migration Applied

- `0003_question_linked_page.py` - Added linked_page OneToOneField

---

**Status: ✅ IMPLEMENTED**

Structured questions now sync with free-form pages, supporting images, equations, and all formatting.
