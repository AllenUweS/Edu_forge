// editor.js — plain JS, no editor libraries. API_BASE is defined inline
// in index.html (empty string, since Django serves both).

const pagesEl = document.getElementById("pages");
const statusEl = document.getElementById("statusMsg");
const symbolPalette = document.getElementById("symbolPalette");
const paperSelect = document.getElementById("paperSelect");
const examTitleEl = document.getElementById("examTitle");

let currentPaperId = null;
let lastRange = null;
let lastPage = null;
let currentChapterId = 1;

document.execCommand("defaultParagraphSeparator", false, "p");

/* ---------------- selection tracking ----------------
   contenteditable loses its selection the moment you click a toolbar
   button, so we remember the last selection made inside a .page and
   restore it right before running any insert command. */

document.addEventListener("selectionchange", () => {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  const node = range.commonAncestorContainer;
  const el = node.nodeType === 3 ? node.parentElement : node;
  const pageEl = el && el.closest && el.closest(".page");
  if (pageEl) {
    lastRange = range.cloneRange();
    lastPage = pageEl;
  }
});

function restoreSelection() {
  if (!lastPage) {
    lastPage = document.querySelector(".page");
  }
  lastPage.focus();
  if (lastRange) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(lastRange);
  }
}

function insertHTML(html) {
  restoreSelection();
  document.execCommand("insertHTML", false, html);
}

/* ---------------- pages ---------------- */

function renumberPages() {
  document.querySelectorAll(".page-wrapper").forEach((w, i) => {
    w.querySelector(".page-label").textContent = "Page " + (i + 1);
  });
}

function addPage(html) {
  const wrapper = document.createElement("div");
  wrapper.className = "page-wrapper";
  wrapper.innerHTML = `
    <div class="page-bar">
      <span class="page-label">Page</span>
      <button type="button" class="delete-page">Delete page</button>
    </div>
    <div class="page" contenteditable="true"></div>
  `;
  wrapper.querySelector(".page").innerHTML = html || "<p><br></p>";
  pagesEl.appendChild(wrapper);
  wrapper.querySelector(".delete-page").addEventListener("click", () => {
    if (document.querySelectorAll(".page-wrapper").length === 1) {
      alert("An exam paper needs at least one page.");
      return;
    }
    wrapper.remove();
    renumberPages();
  });
  renumberPages();
  return wrapper.querySelector(".page");
}

function resetToBlankPaper() {
  pagesEl.innerHTML = "";
  addPage("<p><br></p>");
  currentPaperId = null;
  examTitleEl.value = "";
}

/* ---------------- images: paste / upload / resize / move ---------------- */

async function uploadImageBlob(blob) {
  const formData = new FormData();
  formData.append("image", blob, blob.name || "pasted-image.png");
  if (currentPaperId) formData.append("exam_paper_id", currentPaperId);

  const res = await fetch(`${API_BASE}/api/images/upload/`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Upload failed");
  return res.json(); // { id, url, uploaded_at }
}

function imageWrapperHTML(fullUrl) {
  return `<span class="img-wrap" contenteditable="false">` +
         `<img src="${fullUrl}" draggable="true">` +
         `<span class="resize-handle"></span></span>&nbsp;`;
}

async function insertUploadedImage(blob) {
  restoreSelection();
  try {
    const data = await uploadImageBlob(blob);
    insertHTML(imageWrapperHTML(data.url));
  } catch (err) {
    alert("Image upload failed: " + err.message);
  }
}

// paste handler (delegated to the whole page list)
pagesEl.addEventListener("paste", (e) => {
  const items = e.clipboardData && e.clipboardData.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith("image/")) {
      e.preventDefault();
      insertUploadedImage(item.getAsFile());
      return;
    }
  }
  // otherwise let normal text paste happen
});

// resize handle drag
pagesEl.addEventListener("mousedown", (e) => {
  if (!e.target.classList.contains("resize-handle")) return;
  e.preventDefault();
  const wrap = e.target.closest(".img-wrap");
  const img = wrap.querySelector("img");
  const startX = e.clientX;
  const startWidth = img.offsetWidth;

  function onMove(ev) {
    const newWidth = Math.max(40, startWidth + (ev.clientX - startX));
    img.style.width = newWidth + "px";
  }
  function onUp() {
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("mouseup", onUp);
  }
  document.addEventListener("mousemove", onMove);
  document.addEventListener("mouseup", onUp);
});
// Moving an image: the wrapper is contenteditable="false" inside a
// contenteditable="true" page, so Chrome/Firefox already let the user
// drag it to a new spot in the text — no extra JS needed for that part.

document.getElementById("btnImage").addEventListener("click", () => {
  document.getElementById("fileInput").click();
});
document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) insertUploadedImage(file);
  e.target.value = "";
});

/* ---------------- formatting ---------------- */

document.querySelectorAll("#toolbar button[data-cmd]").forEach((btn) => {
  btn.addEventListener("click", () => {
    restoreSelection();
    document.execCommand(btn.dataset.cmd, false, null);
  });
});

/* ---------------- tables ---------------- */

document.getElementById("btnTable").addEventListener("click", () => {
  const input = prompt("Table size as rows,columns (e.g. 3,4):", "2,2");
  if (!input) return;
  const [rows, cols] = input.split(",").map((n) => parseInt(n.trim(), 10));
  if (!rows || !cols || rows < 1 || cols < 1) {
    alert("Enter a valid rows,columns value.");
    return;
  }
  let html = '<table class="exam-table">';
  for (let r = 0; r < rows; r++) {
    html += "<tr>";
    for (let c = 0; c < cols; c++) html += "<td>&nbsp;</td>";
    html += "</tr>";
  }
  html += "</table><p><br></p>";
  insertHTML(html);
});

/* ---------------- symbols ---------------- */

const SYMBOLS = ["±","×","÷","≤","≥","≠","≈","∞","√","∑","∫","π",
                  "α","β","γ","θ","Δ","Ω","°","→","∈","∅","∪","∩"];
symbolPalette.innerHTML = SYMBOLS.map(s => `<button type="button">${s}</button>`).join("");
symbolPalette.addEventListener("click", (e) => {
  if (e.target.tagName !== "BUTTON") return;
  insertHTML(e.target.textContent);
  symbolPalette.hidden = true;
});
document.getElementById("btnSymbol").addEventListener("click", (e) => {
  const btnRect = e.target.getBoundingClientRect();
  symbolPalette.style.left = btnRect.left + "px";
  symbolPalette.style.top = (btnRect.bottom + window.scrollY + 4) + "px";
  symbolPalette.hidden = !symbolPalette.hidden;
});
document.addEventListener("click", (e) => {
  if (e.target.id !== "btnSymbol" && !symbolPalette.contains(e.target)) {
    symbolPalette.hidden = true;
  }
});

/* ---------------- equations ---------------- */

function renderEquationHTML(latex) {
  let rendered;
  try {
    rendered = katex.renderToString(latex, { throwOnError: false });
  } catch (err) {
    rendered = latex; // fall back to raw text if katex can't parse it
  }
  const safeLatex = latex.replace(/"/g, "&quot;");
  return `<span class="equation" contenteditable="false" data-latex="${safeLatex}">${rendered}</span>&nbsp;`;
}

document.getElementById("btnEquation").addEventListener("click", () => {
  const latex = prompt("Enter equation in LaTeX (e.g. x^2 + y^2 = r^2):");
  if (!latex) return;
  insertHTML(renderEquationHTML(latex));
});

// click an existing equation to edit it
pagesEl.addEventListener("click", (e) => {
  const eqEl = e.target.closest(".equation");
  if (!eqEl) return;
  const latex = prompt("Edit equation LaTeX:", eqEl.dataset.latex);
  if (latex === null) return;
  const rendered = renderEquationHTML(latex);
  const tmp = document.createElement("div");
  tmp.innerHTML = rendered;
  eqEl.replaceWith(tmp.firstElementChild);
});

/* ---------------- add page / new ---------------- */

document.getElementById("btnAddPage").addEventListener("click", () => addPage());
document.getElementById("btnNew").addEventListener("click", () => {
  if (confirm("Start a new exam paper? Unsaved changes will be lost.")) {
    resetToBlankPaper();
  }
});

/* ---------------- save / load ---------------- */

function collectPages() {
  return Array.from(document.querySelectorAll(".page")).map((p) => ({
    content: p.innerHTML,
  }));
}

async function refreshPaperList() {
  try {
    const res = await fetch(`${API_BASE}/api/exam-papers/`);
    const papers = await res.json();
    paperSelect.innerHTML = '<option value="">-- saved exam papers --</option>' +
      papers.map(p => `<option value="${p.id}">${p.title} (#${p.id})</option>`).join("");
  } catch (err) {
    // backend may not be reachable yet — fine, just skip
  }
}

// Shared by the Save button and autosave. `silent` skips the alert() on
// failure (an alert popping up mid-typing would be disruptive) — the
// error still shows briefly in the status area either way.
async function saveExam({ silent = false } = {}) {
  const payload = {
    title: examTitleEl.value || "Untitled Exam",
    pages: collectPages(),
  };
  try {
    statusEl.style.color = "#2a7a2a";
    statusEl.textContent = "Saving...";
    const url = currentPaperId
      ? `${API_BASE}/api/exam-papers/${currentPaperId}/`
      : `${API_BASE}/api/exam-papers/`;
    const method = currentPaperId ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    currentPaperId = data.id;
    statusEl.textContent = "All changes saved";
    setTimeout(() => {
      if (statusEl.textContent === "All changes saved") statusEl.textContent = "";
    }, 2000);
    refreshPaperList();
  } catch (err) {
    statusEl.style.color = "#c0392b";
    statusEl.textContent = "Save failed";
    if (!silent) alert("Save failed: " + err.message);
    else console.error("Autosave failed:", err);
  }
}

document.getElementById("btnSave").addEventListener("click", () => saveExam({ silent: false }));

// ---- autosave: save automatically ~1.5s after the user stops typing ----
function debounce(fn, delayMs) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}

const AUTOSAVE_DELAY_MS = 1500;
const triggerAutosave = debounce(() => saveExam({ silent: true }), AUTOSAVE_DELAY_MS);

// "input" fires for typed text AND for execCommand-driven changes
// (bold/italic, inserting a table/image/equation), so this one listener
// covers essentially every edit made in the editor.
pagesEl.addEventListener("input", triggerAutosave);
examTitleEl.addEventListener("input", triggerAutosave);

document.getElementById("btnLoad").addEventListener("click", async () => {
  const id = paperSelect.value;
  if (!id) return;
  try {
    const res = await fetch(`${API_BASE}/api/exam-papers/${id}/`);
    if (!res.ok) throw new Error("Not found");
    const data = await res.json();
    currentPaperId = data.id;
    examTitleEl.value = data.title;
    pagesEl.innerHTML = "";
    data.pages.forEach((p) => addPage(p.content));

    // Render equations in synced questions after pages are loaded
    renderSyncedEquations();
  } catch (err) {
    alert("Load failed: " + err.message);
  }
});

/**
 * Render equations in synced questions (free-form pages).
 * Finds .equation spans with data-latex and renders them with KaTeX.
 */
function renderSyncedEquations() {
  document.querySelectorAll(".page .equation").forEach(eqEl => {
    const latex = eqEl.getAttribute("data-latex");
    if (latex && !eqEl.hasAttribute("data-rendered")) {
      try {
        const rendered = katex.renderToString(latex, { throwOnError: false });
        eqEl.innerHTML = rendered;
        eqEl.setAttribute("data-rendered", "true");
      } catch (err) {
        console.error("Failed to render equation:", latex, err);
      }
    }
  });
}

/* ---------------- init ---------------- */

resetToBlankPaper();
refreshPaperList();


// ==================== NEW: MODE TOGGLE ====================

const btnFreeFormMode = document.getElementById("btnFreeFormMode");
const btnStructuredMode = document.getElementById("btnStructuredMode");
const structuredQuestionsContainer = document.getElementById("structuredQuestionsContainer");

btnFreeFormMode.addEventListener("click", () => {
  btnFreeFormMode.classList.add("active");
  btnStructuredMode.classList.remove("active");
  pagesEl.hidden = false;
  structuredQuestionsContainer.hidden = true;
});

btnStructuredMode.addEventListener("click", () => {
  btnStructuredMode.classList.add("active");
  btnFreeFormMode.classList.remove("active");
  pagesEl.hidden = true;
  structuredQuestionsContainer.hidden = false;
  if (currentPaperId) {
    loadStructuredQuestions();
  }
});


// ==================== NEW: SYMBOL LIBRARY ====================

const btnSymbolLibrary = document.getElementById("btnSymbolLibrary");
const symbolLibrary = document.getElementById("symbolLibrary");
const btnCloseSymbolLibrary = document.getElementById("btnCloseSymbolLibrary");
const symbolSearch = document.getElementById("symbolSearch");
const symbolLibraryContent = document.getElementById("symbolLibraryContent");
let currentSymbolCategory = "";
let symbolSearchTimeout = null;

btnSymbolLibrary.addEventListener("click", () => {
  symbolLibrary.hidden = !symbolLibrary.hidden;
  if (!symbolLibrary.hidden && symbolLibraryContent.children.length === 0) {
    loadSymbols(currentSymbolCategory);
  }
});

btnCloseSymbolLibrary.addEventListener("click", () => {
  symbolLibrary.hidden = true;
});

// Category filter
document.querySelectorAll(".symbol-categories button").forEach(btn => {
  btn.addEventListener("click", (e) => {
    document.querySelectorAll(".symbol-categories button").forEach(b => b.classList.remove("active"));
    e.target.classList.add("active");
    currentSymbolCategory = e.target.dataset.category;
    loadSymbols(currentSymbolCategory, symbolSearch.value);
  });
});

// Search with debounce
symbolSearch.addEventListener("input", (e) => {
  clearTimeout(symbolSearchTimeout);
  symbolSearchTimeout = setTimeout(() => {
    loadSymbols(currentSymbolCategory, e.target.value);
  }, 300);
});

async function loadSymbols(category = "", search = "") {
  let url = `${API_BASE}/api/symbols/?`;
  if (category) url += `category=${category}&`;
  if (search) url += `search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url);
    const symbols = await res.json();
    renderSymbolLibrary(symbols);
  } catch (err) {
    console.error("Failed to load symbols:", err);
  }
}

function renderSymbolLibrary(symbols) {
  // Group by category
  const grouped = {};
  symbols.forEach(sym => {
    if (!grouped[sym.category]) grouped[sym.category] = [];
    grouped[sym.category].push(sym);
  });

  let html = "";
  for (const [category, syms] of Object.entries(grouped)) {
    html += `<div class="symbol-category-group">
      <h4>${getCategoryDisplayName(category)}</h4>
      <div class="symbol-grid">`;
    syms.forEach(sym => {
      const rendered = katex.renderToString(sym.latex, { throwOnError: false });
      html += `<button class="symbol-item" data-latex="${sym.latex}" title="${sym.display_name}">
        ${rendered}
      </button>`;
    });
    html += `</div></div>`;
  }

  symbolLibraryContent.innerHTML = html;

  // Add click handlers
  symbolLibraryContent.querySelectorAll(".symbol-item").forEach(btn => {
    btn.addEventListener("click", () => {
      insertSymbolFromLibrary(btn.dataset.latex);
    });
  });
}

function getCategoryDisplayName(category) {
  const names = {
    "greek": "Greek Letters",
    "math-ops": "Math Operators",
    "fractions": "Fractions & Roots",
    "powers": "Powers & Indices",
    "calculus": "Calculus",
    "vectors": "Vectors & Matrices",
    "trig": "Trigonometry",
    "phys": "Physics Symbols",
    "chem": "Chemical Formulas",
    "chem-reac": "Chemical Reactions",
    "units": "Units",
    "sets": "Sets & Logic",
    "misc": "Miscellaneous"
  };
  return names[category] || category;
}

function insertSymbolFromLibrary(latex) {
  restoreSelection();
  const rendered = renderEquationHTML(latex);
  insertHTML(rendered);
}


// ==================== NEW: STRUCTURED QUESTIONS ====================

const structuredQuestionsEl = document.getElementById("structuredQuestions");
const btnAddQuestion = document.getElementById("btnAddQuestion");
let questionCounter = 0;

btnAddQuestion.addEventListener("click", () => {
  if (!currentPaperId) {
    alert("Please save the exam paper first.");
    return;
  }
  questionCounter++;
  const questionBlock = createStructuredQuestionBlock(questionCounter);
  structuredQuestionsEl.appendChild(questionBlock);
  attachQuestionEquationEditing(questionBlock);
});

function createStructuredQuestionBlock(questionNum) {
  const wrapper = document.createElement("div");
  wrapper.className = "structured-question-block";
  wrapper.dataset.questionId = "";
  wrapper.dataset.questionNumber = questionNum;

  wrapper.innerHTML = `
    <div class="question-header">
      <span class="question-number">${questionNum}.</span>
      <div class="question-text" contenteditable="true" data-placeholder="Enter question text..."></div>
    </div>
    <div class="options-container">
      <div class="option" data-label="A">
        <span class="option-label">A)</span>
        <span class="option-text" contenteditable="true"></span>
      </div>
      <div class="option" data-label="B">
        <span class="option-label">B)</span>
        <span class="option-text" contenteditable="true"></span>
      </div>
      <div class="option" data-label="C">
        <span class="option-label">C)</span>
        <span class="option-text" contenteditable="true"></span>
      </div>
      <div class="option" data-label="D">
        <span class="option-label">D)</span>
        <span class="option-text" contenteditable="true"></span>
      </div>
    </div>
    <div class="question-actions">
      <button type="button" class="btn-save-question">Save Question</button>
      <button type="button" class="btn-delete-question">Delete</button>
    </div>
  `;

  // Attach save handler
  wrapper.querySelector(".btn-save-question").addEventListener("click", () => {
    saveStructuredQuestion(wrapper);
  });

  // Attach delete handler
  wrapper.querySelector(".btn-delete-question").addEventListener("click", () => {
    if (confirm("Delete this question?")) {
      const questionId = wrapper.dataset.questionId;
      if (questionId) {
        deleteStructuredQuestion(questionId);
      }
      wrapper.remove();
    }
  });

  return wrapper;
}

function attachQuestionEquationEditing(questionBlock) {
  // Question text - equations and images
  const questionText = questionBlock.querySelector(".question-text");
  attachEquationClickToEdit(questionText);
  attachImageHandling(questionText);

  // Option texts - equations and images
  questionBlock.querySelectorAll(".option-text").forEach(optText => {
    attachEquationClickToEdit(optText);
    attachImageHandling(optText);
  });
}

/**
 * Attach image paste and upload handling to a contenteditable element.
 * Reuses existing uploadImageBlob function.
 */
function attachImageHandling(element) {
  // Handle paste events for images
  element.addEventListener("paste", (e) => {
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        insertUploadedImageInElement(file, element);
        return;
      }
    }
  });
}

/**
 * Upload an image and insert it into a specific element.
 */
async function insertUploadedImageInElement(blob, targetElement) {
  try {
    const formData = new FormData();
    formData.append("image", blob, blob.name || "pasted-image.png");
    if (currentPaperId) formData.append("exam_paper_id", currentPaperId);

    const res = await fetch(`${API_BASE}/api/images/upload/`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();

    // Insert image at cursor position in target element
    const imgHTML = imageWrapperHTML(data.url);
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      // Check if selection is within the target element
      if (targetElement.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        const tmp = document.createElement("div");
        tmp.innerHTML = imgHTML;
        range.insertNode(tmp.firstChild);
      }
    } else {
      // Append to end if no selection
      targetElement.innerHTML += imgHTML;
    }
  } catch (err) {
    alert("Image upload failed: " + err.message);
  }
}

/**
 * Override existing file input to support structured questions.
 */
document.getElementById("btnImage").addEventListener("click", () => {
  // Check if we're in structured mode and an element is focused
  const activeElement = document.activeElement;
  if (activeElement && (
    activeElement.classList.contains("question-text") ||
    activeElement.classList.contains("option-text")
  )) {
    document.getElementById("fileInput").click();
  } else {
    // Original behavior for free-form mode
    const page = document.querySelector(".page:focus") || document.querySelector(".page");
    if (page) {
      document.getElementById("fileInput").click();
    }
  }
});

/**
 * Handle file input change for both free-form and structured modes.
 */
document.getElementById("fileInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const activeElement = document.activeElement;
  if (activeElement && (
    activeElement.classList.contains("question-text") ||
    activeElement.classList.contains("option-text")
  )) {
    // Structured mode - insert into focused element
    insertUploadedImageInElement(file, activeElement);
  } else {
    // Free-form mode - use existing behavior
    const page = document.querySelector(".page:focus") || document.querySelector(".page");
    if (page) {
      insertUploadedImage(file);
    }
  }
  e.target.value = "";
});

function attachEquationClickToEdit(element) {
  element.addEventListener("click", (e) => {
    const eqEl = e.target.closest(".equation");
    if (!eqEl) return;
    const latex = prompt("Edit equation LaTeX:", eqEl.dataset.latex);
    if (latex === null) return;

    const rendered = renderEquationHTML(latex);
    const tmp = document.createElement("div");
    tmp.innerHTML = rendered;
    eqEl.replaceWith(tmp.firstElementChild);
  });
}


// ==================== NEW: EQUATION EXTRACTION & RENDERING ====================

/**
 * Extract equations from HTML using DOM parsing (not regex).
 * Preserves images and other HTML while extracting equations.
 * Returns {textWithImages: string, equations: [{placeholder, latex}]}
 */
function extractEquationsFromHTML(html) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const equations = [];
  let eqIndex = 0;

  // Find all equation spans using DOM traversal
  const equationElements = tempDiv.querySelectorAll(".equation");

  equationElements.forEach(eqEl => {
    const latex = eqEl.getAttribute("data-latex");
    if (latex) {
      const placeholder = `[[EQ:${eqIndex}]]`;
      equations.push({
        placeholder: placeholder,
        latex: latex,
        position: eqIndex++
      });

      // Replace the equation span with placeholder text node
      const textNode = document.createTextNode(placeholder);
      eqEl.parentNode.replaceChild(textNode, eqEl);
    }
  });

  // Return HTML with images preserved but equations replaced with placeholders
  // For storage, we keep images as HTML but equations as placeholders
  return {
    textWithImages: tempDiv.innerHTML,
    equations: equations
  };
}

/**
 * Render equations by replacing [[EQ:N]] placeholders with KaTeX.
 * Works with HTML content that may include images.
 * Uses original LaTeX from database (never stores rendered HTML).
 */
function renderEquationsWithPlaceholders(html, equations) {
  let rendered = html;

  equations.forEach(eq => {
    const renderedEq = katex.renderToString(eq.latex, { throwOnError: false });
    const eqHtml = `<span class="equation" contenteditable="false" data-latex="${eq.latex}">${renderedEq}</span>`;
    // Replace placeholder with rendered equation
    rendered = rendered.replace(eq.placeholder, eqHtml);
  });

  return rendered;
}

/**
 * Prepare question payload for API from DOM element.
 * Images are preserved as HTML, equations replaced with placeholders.
 */
function prepareQuestionPayload(questionBlock) {
  const questionTextEl = questionBlock.querySelector(".question-text");
  const optionsEls = questionBlock.querySelectorAll(".option");

  const questionData = extractEquationsFromHTML(
    questionTextEl.innerHTML
  );

  const options = [];

  optionsEls.forEach((optionEl, index) => {
    const label = optionEl.dataset.label;
    const optionTextEl = optionEl.querySelector(".option-text");

    const optionData = extractEquationsFromHTML(
      optionTextEl.innerHTML
    );

    options.push({
      label: label,
      sequence: index + 1,
      is_correct: false,
      contents: [
        {
          content_type: "TEXT",
          text: optionData.textWithImages,
          sequence: 1
        }
      ]
    });
  });

  return {
    chapter: 1,

    difficulty: "MEDIUM",

    marks: 1,

    negative_marks: 0,

    contents: [
      {
        content_type: "TEXT",
        text: questionData.textWithImages,
        sequence: 1
      }
    ],

    options: options,

    solution: {
      contents: [
        {
          content_type: "TEXT",
          text: "",
          sequence: 1
        }
      ]
    }
  };
}

/**
 * Render a structured question block from API data.
 */
function renderStructuredQuestionBlock(questionData) {
  const renderedQuestionText = renderEquationsWithPlaceholders(
    questionData.question_text,
    questionData.equations
  );

  const questionBlock = createStructuredQuestionBlock(questionData.question_number);
  questionBlock.dataset.questionId = questionData.id;

  // Set question text
  const questionTextEl = questionBlock.querySelector(".question-text");
  questionTextEl.innerHTML = renderedQuestionText;

  // Render options
  const optionsEls = questionBlock.querySelectorAll(".option");
  questionData.options.forEach((opt, idx) => {
    const optionTextEl = optionsEls[idx].querySelector(".option-text");
    const renderedOptText = renderEquationsWithPlaceholders(
      opt.option_text,
      opt.equations
    );
    optionTextEl.innerHTML = renderedOptText;
  });

  attachQuestionEquationEditing(questionBlock);
  return questionBlock;
}


// ==================== NEW: SAVE/LOAD STRUCTURED QUESTIONS ====================

async function saveStructuredQuestion(questionBlock) {
  if (!currentChapterId) {
      alert("Please select a chapter first.");
      return;
  }

  const questionId = questionBlock.dataset.questionId;
  const payload = prepareQuestionPayload(questionBlock);

  console.log("Saving question payload:", payload);

  try {
    statusEl.style.color = "#2a7a2a";
    statusEl.textContent = "Saving question...";

    let url, method;
    if (questionId) {
        url = `${API_BASE}/api/questions/${questionId}/`;
        method = "PUT";
    } else {
        url = `${API_BASE}/api/chapters/${currentChapterId}/questions/`;
        method = "POST";
    }

    console.log("Calling API:", method, url);

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    console.log("Response status:", res.status);
    console.log("Response headers:", Object.fromEntries(res.headers.entries()));

    // First get raw text to see if it's HTML (error page) or JSON
    const rawText = await res.text();
    console.log("Raw response (first 200 chars):", rawText.substring(0, 200));

    if (!res.ok) {
      let error;
      try {
        error = JSON.parse(rawText);
      } catch {
        error = { raw: rawText };
      }
      console.error("Save error:", error);
      throw new Error(typeof error === "string" ? error : JSON.stringify(error));
    }

    const data = JSON.parse(rawText);
    console.log("Saved question response:", data);
    questionBlock.dataset.questionId = data.id;
    statusEl.textContent = "Question saved";
    setTimeout(() => {
      if (statusEl.textContent === "Question saved") statusEl.textContent = "";
    }, 2000);
  } catch (err) {
    statusEl.style.color = "#c0392b";
    statusEl.textContent = "Save failed";
    console.error("Save failed:", err);
    alert("Failed to save question: " + err.message);
  }
}

async function loadStructuredQuestions() {
  if (!currentPaperId) return;

  try {
    const res = await fetch(`${API_BASE}/api/exam-papers/${currentPaperId}/questions/`);
    if (!res.ok) return;

    const questions = await res.json();
    structuredQuestionsEl.innerHTML = "";
    questionCounter = 0;

    questions.forEach(q => {
      questionCounter = Math.max(questionCounter, q.question_number);
      const rendered = renderStructuredQuestionBlock(q);
      structuredQuestionsEl.appendChild(rendered);
    });
  } catch (err) {
    console.error("Failed to load questions:", err);
  }
}

async function deleteStructuredQuestion(questionId) {
  try {
    const res = await fetch(`${API_BASE}/api/questions/${questionId}/`, {
      method: "DELETE"
    });
    if (!res.ok) {
      throw new Error("Failed to delete question");
    }
  } catch (err) {
    alert("Failed to delete question: " + err.message);
  }
}


// ==================== EXISTING: Save exam paper now loads structured questions ====================

// Override the existing load function to also load structured questions
const originalLoadHandler = document.getElementById("btnLoad").onclick;
document.getElementById("btnLoad").addEventListener("click", async () => {
  await originalLoadHandler();
  if (btnStructuredMode.classList.contains("active") && currentPaperId) {
    loadStructuredQuestions();
  }
});