# EduForge — Scientific Document Editor & Exam Paper Authoring Suite

<div align="center">
  <img src="apps/web/public/logo.png" alt="EduForge Logo" width="120" />
  <h3>Professional Question Paper Authoring, Scientific Typesetting & Cloud Exam Management</h3>
  <p>Built for educators, universities, exam boards, and STEM publishers.</p>
</div>

---

## ✨ Features

### 📄 Real-Time A4 Two-Column Canvas & Exam Paper Editor
- **Pixel-Perfect A4 Pagination**: Automatic column-balancing, section splitting, margin guides, and column divider rendering in real time.
- **MS Word-Style Ribbon Toolbar**: Home, Insert, Page Layout, Math & Science, Review, and View ribbon tabs.
- **80+ Typography & Custom Font Styles**: Standard, STEM, Monospace, and Display font families with live preview.
- **Rich Document Formatting**: Bold, italic, underline styles, superscript, subscript, alignment, line spacing, list bullets/numbering, margins, and headers.

### 📐 MathType & KaTeX Scientific Typesetting Engine
- **Visual MathType Editor**: Integrated TipTap rich text editor with visual equation creation and symbol insertion.
- **LaTeX Delimiter Parsing**: Automatic pre-conversion of `\(`...`\)` and `\[`...`\]` LaTeX delimiters into high-performance KaTeX math expressions.
- **High-Resolution KaTeX Rendering**: Fast 120Hz/144Hz formula rendering with caching across question statements, option layouts, solution explanations, and preview drawers.
- **Physics & Chemistry Catalog**: 200+ standard symbols, SI units, dimensions, and periodic table elements.

### ❓ Cloud Question Bank & Supabase Persistence
- **Full Supabase PostgreSQL Integration**: Real-time cloud storage for questions, options (`question_options`), solution explanations, subjects, and chapters.
- **Structured MCQ Options Engine**: Multi-layout support (2x2 Grid, Vertical Stack, Horizontal Inline) with option key mapping (A, B, C, D), correct answer flags, and raw text/content fallback.
- **Instant Student Preview Drawer**: Fast preview modal fetching full question data and rendering formatted KaTeX formulas and options.
- **Seamless Question Editing**: Fully pre-populates existing question statements, options, solution explanations, difficulty, and marks when editing in Question Bank.

### 📋 Interactive Test Generator & Document Editor
- **4-Step Exam Wizard**: Configure exam metadata, search & select questions from Question Bank, preview layout, and publish.
- **Open in Document Editor Integration**: Edit test papers directly with pre-selected question IDs, subject/chapter metadata, duration, and marking schemes.
- **Export & Print**: DOCX export for Microsoft Word and high-contrast HTML/CSS print engine.

### 🔐 Authentication & Cloud Security
- **Supabase Authentication**: Integrated user authentication, token verification, and role-based access for Admin users.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS (v4), TipTap Editor, MathType, KaTeX, Lucide React Icons
- **Backend**: Node.js, Express, TypeScript, `@supabase/supabase-js` SDK
- **Database & Storage**: Supabase Cloud PostgreSQL, Supabase Storage (`question-assets`), Supabase Auth
- **Shared Core**: `@eduforge/shared` unified TypeScript models and interfaces
- **Export Engine**: `docx` for Microsoft Word DOCX export, HTML/CSS for print/PDF generation

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

```bash
# Clone repository
git clone https://github.com/ashwintelangstark/EduForge.git
cd EduForge

# Install all dependencies across workspaces
npm install
```

### Environment Setup

Create `.env` in `apps/server/` and `apps/web/`:

```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"
SUPABASE_ANON_KEY="your-supabase-anon-key"
PORT=4000
```

### Development

```bash
# Run both frontend and backend concurrently
npm run dev
```

- **Web App**: http://localhost:3000 (or http://localhost:5173)
- **API Server**: http://localhost:4000

### Build & Test

```bash
# Build all workspaces (shared, server, web)
npm run build

# Run tests
npm test
```

---

## 📁 Monorepo Structure

```
eduforge/
├── apps/
│   ├── server/       # Express + Supabase Node.js REST API server
│   └── web/          # React + Vite desktop web editor
├── packages/
│   └── shared/       # Shared TypeScript models, types & AST
├── supabase/         # PostgreSQL schema definitions & migrations
└── package.json      # Monorepo root config
```

---

## 📄 License

MIT License. Designed & Developed for Scientific Education & Publishing.
