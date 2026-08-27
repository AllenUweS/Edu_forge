# Debug Guide: Structured Questions → Free-form Pages Sync

## Issues Fixed

### 1. KaTeX Python Library Not Installed
**Problem:** Backend tried to import `katex` which wasn't installed, causing silent failures.

**Solution:** Removed KaTeX dependency from backend. Equations now stored in page HTML as:
```html
<span class="equation" data-latex="x^2">[[EQ:0]]</span>
```

Frontend KaTeX renders these when pages load.

### 2. ExamPaper Context Missing
**Problem:** Serializer couldn't access exam_paper during creation.

**Solution:** Pass exam_paper via context:
```python
# In views.py
serializer.save(exam_paper=exam_paper)

# In serializers.py
exam_paper = self.context.get("exam_paper")
```

### 3. Frontend Equation Rendering
**Problem:** Equations in synced pages weren't being rendered.

**Solution:** Added `renderSyncedEquations()` function that runs after loading pages.

## Debug Output

The server now logs:
```
[DEBUG] Creating question for paper <id>
[DEBUG] Question created with ID <id>
[DEBUG] Page data before render: question_text=<text preview>
[DEBUG] Rendered HTML length: <bytes>
[DEBUG] Created linked page ID <id> with content length <bytes>
```

The browser console logs:
```
Saving question payload: {...}
Saved question response: {...}
```

## Testing Steps

### 1. Create and Save a Structured Question

1. Open http://127.0.0.1:8000/
2. Create/save an exam paper (enter title, click Save)
3. Click "Structured Questions" mode button
4. Click "+ Add Question"
5. Enter question text: "What is 2 + 2?"
6. Enter options:
   - A) 3
   - B) 4
   - C) 5
   - D) 6
7. Click "Save Question"

**Check Browser Console:**
- Should show "Saving question payload: {...}"
- Should show "Saved question response: {...}"

**Check Server Terminal:**
- Should show debug messages

### 2. Switch to Free-form Pages and Verify

1. Click "Free-form Pages" mode button
2. **Expected:** See the formatted question with Q1 header and A/B/C/D options

**If blank page appears:**
- Open browser DevTools → Network tab
- Reload the paper
- Check the API response for `/api/exam-papers/<id>/`
- Look at the `pages` array in the response
- Each page should have a `content` field with HTML

### 3. Test with Equations

1. Switch to "Structured Questions"
2. Add equation: "Solve for x: [[EQ:0]]" where LaTeX is `x^2 = 4`
3. Save question
4. Switch to "Free-form Pages"
5. **Expected:** Equation appears with KaTeX rendering

### 4. Test with Images

1. In structured mode, paste an image (Ctrl+V)
2. Save question
3. Switch to free-form mode
4. **Expected:** Image displays in the page

## Troubleshooting

### If Page is Still Blank

**Check 1: Browser Console**
```javascript
// After loading, check if pages have content
document.querySelectorAll('.page').forEach((p, i) => {
  console.log(`Page ${i+1} content length:`, p.innerHTML.length);
});
```

**Check 2: Network Response**
- DevTools → Network
- Find `exam-papers/<id>/` request
- Check `pages` array
- Each page should have `content` field

**Check 3: Direct API Check**
```bash
curl http://127.0.0.1:8000/api/exam-papers/1/
```
Look for pages array with content.

### Check Database Directly

```python
from editor.models import Question, ExamPage

# Check questions
for q in Question.objects.all():
    print(f"Question {q.question_number}: linked_page = {q.linked_page_id}")

# Check pages
for p in ExamPage.objects.all():
    print(f"Page {p.page_number}: content length = {len(p.content)}")
    if p.content:
        print(f"  Content preview: {p.content[:100]}")
```

## Files Modified

1. **editor/serializers.py**
   - Removed KaTeX import dependency
   - Added exam_paper context handling
   - Added debug logging

2. **editor/views.py**
   - Updated perform_create to pass exam_paper via context
   - Added linked page deletion on question delete

3. **editor/static/editor/editor.js**
   - Added renderSyncedEquations() function
   - Added console logging for debugging

## Expected Page Content Format

After saving a question, the linked page should contain:

```html
<div class="synced-question" data-question-id="1">
  <div class="synced-question-header">Q1. </div>
  <div class="synced-question-text">What is 2 + 2?</div>
  <div class="synced-options">
    <div class="synced-option"><span class="option-label">A)</span> 3</div>
    <div class="synced-option"><span class="option-label">B)</span> 4</div>
    <div class="synced-option"><span class="option-label">C)</span> 5</div>
    <div class="synced-option"><span class="option-label">D)</span> 6</div>
  </div>
</div>
```

## Next Steps After Testing

1. If pages are still blank, check the actual API response
2. Look at the server terminal for debug messages
3. Verify the linked_page_id is set in the Question model
4. Check if ExamPage.content is actually populated

---

**Test URL:** http://127.0.0.1:8000/

**Debug Location:** Server terminal shows [DEBUG] messages, browser console shows payload/response.
