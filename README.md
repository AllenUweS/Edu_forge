# EduForge — Desktop Scientific Document Editor & Question Paper Authoring Suite

<div align="center">
  <img src="apps/web/public/logo.png" alt="EduForge Logo" width="120" />
  <h3>Professional Question Paper Authoring, Scientific Typesetting & Desktop Publishing</h3>
  <p>Built for educators, universities, exam boards, and STEM publishers.</p>
</div>

---

## ✨ Features

### 📄 Real-Time A4 Two-Column Canvas & MS Word Experience
- **Pixel-Perfect A4 Pagination**: Automatic column-balancing, section splitting, margin guides, and column divider rendering in real time.
- **MS Word-Style Ribbon Toolbar**: Full Home, Insert, Page Layout, Math & Science, Review, and View ribbon tabs.
- **80+ Typography & Custom Font Styles**: Standard, STEM, Monospace, and Display font families with live preview.
- **Rich Document Formatting**: Bold, italic, underline styles, superscript, subscript, alignment, line spacing, list bullets/numbering, margins, and headers.

### 📐 Scientific Typesetting & Math AST Builder
- **Visual Construct Palette**: Fractions, radicals, integrals, summations, matrices, limits, vectors, brackets, and chemical equations.
- **High-Resolution KaTeX Rendering**: Fast 120Hz/144Hz math rendering with formula caching and LaTeX syntax support.
- **23 Physics Chapters Catalog**: 200+ standard symbols, SI units, dimensions, and formula annotations.
- **Chemistry & Periodic Table**: 118 interactive elements and standard chemical notation structures.
- **Comprehensive Units & Constants**: Base SI units, derived units, metric prefixes, and universal physical constants.

### ❓ Question Bank & Exam Paper Wizard
- **Step-by-Step Question Paper Wizard**: Automated template selection, metadata configuration, and section layout generation.
- **Structured MCQ Builder**: Multi-layout support (2x2 Grid, Vertical Stack, Horizontal Inline) with answer keys, negative marking, and step-by-step explanations.
- **Local SQLite Repository**: 100% offline data storage for questions, templates, and exam documents.
- **Import & Export**: JSON interchange for bulk question bank import/export.

### 🎨 Themes & Modern UI
- **3 Dynamic UI Themes**: Dark, White, and Dark Blue (Navy).
- **Persistent White Paper Canvas**: The A4 examination sheet strictly stays 100% pure white (`#ffffff`) with high-contrast text across all UI themes.
- **Manrope UI Typography**: Modern UI aesthetics with high display refresh rate support (60Hz / 120Hz / 144Hz).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide Icons, KaTeX
- **Backend**: Node.js, Express, TypeScript, Better-SQLite3
- **Shared Core**: Shared TypeScript interfaces, types, and AST structures
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

### Development

```bash
# Run both frontend and backend concurrently
npm run dev
```

- **Web App**: http://localhost:3000
- **API Server**: http://localhost:3001

### Build & Test

```bash
# Build all workspaces
npm run build

# Run unit tests
npm test
```

---

## 📁 Monorepo Structure

```
eduforge/
├── apps/
│   ├── server/       # Express + SQLite REST API server
│   └── web/          # React + Vite desktop web editor
├── packages/
│   └── shared/       # Shared TypeScript models, types & AST
├── resources/        # Seed datasets (physics, chemistry, units, constants, templates)
└── package.json      # Monorepo root config
```

---

## 📄 License

MIT License. Designed & Developed for Scientific Education & Publishing.
