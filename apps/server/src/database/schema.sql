-- EduForge SQLite Schema (Phase 1)
-- Zero auth / user tables. Fully parameterized and local.

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  template_id TEXT,
  document_json TEXT NOT NULL,
  is_system INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS document_versions (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  version_num INTEGER NOT NULL,
  document_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  question_number TEXT,
  question_type TEXT NOT NULL,
  subject TEXT,
  chapter TEXT,
  topic TEXT,
  difficulty TEXT NOT NULL,
  marks REAL NOT NULL DEFAULT 4,
  negative_marks REAL DEFAULT 1,
  option_layout TEXT DEFAULT 'grid_2x2',
  question_json TEXT NOT NULL,
  is_system INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS question_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL,
  option_key TEXT NOT NULL,
  content_json TEXT NOT NULL,
  is_correct INTEGER DEFAULT 0,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS question_bank (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL UNIQUE,
  tags_json TEXT,
  year INTEGER,
  created_at TEXT NOT NULL,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT,
  is_system INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS chapters (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sequence_order INTEGER DEFAULT 0,
  is_system INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS symbol_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_system INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS symbols (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  latex TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_system INTEGER DEFAULT 1,
  FOREIGN KEY (category_id) REFERENCES symbol_categories(id)
);

CREATE TABLE IF NOT EXISTS math_constructs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  construct_type TEXT NOT NULL,
  latex_template TEXT NOT NULL,
  ast_template_json TEXT,
  is_system INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS equation_templates (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  latex TEXT NOT NULL,
  ast_json TEXT,
  is_system INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS physics_symbols (
  id TEXT PRIMARY KEY,
  chapter_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  latex TEXT NOT NULL,
  name TEXT NOT NULL,
  standard_unit TEXT,
  dimension TEXT,
  description TEXT,
  formulas_json TEXT,
  is_system INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS chemistry_symbols (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  formula TEXT NOT NULL,
  latex TEXT NOT NULL,
  description TEXT,
  data_json TEXT,
  is_system INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  type TEXT NOT NULL,
  dimension TEXT,
  category TEXT NOT NULL,
  si_equivalent TEXT,
  is_system INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS constants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  latex TEXT NOT NULL,
  value TEXT NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  is_system INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  template_json TEXT NOT NULL,
  is_system INTEGER DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS template_sections (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  marks REAL,
  sequence_order INTEGER DEFAULT 0,
  FOREIGN KEY (template_id) REFERENCES templates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS presets (
  id TEXT PRIMARY KEY,
  preset_type TEXT NOT NULL,
  name TEXT NOT NULL,
  preset_json TEXT NOT NULL,
  is_system INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Indices for rapid querying
CREATE INDEX IF NOT EXISTS idx_documents_updated ON documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject, chapter, difficulty);
CREATE INDEX IF NOT EXISTS idx_physics_chapter ON physics_symbols(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chemistry_type ON chemistry_symbols(type);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
