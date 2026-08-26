import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function seedDatabase(db: Database.Database, resourcesDir?: string) {
  const rootResources = resourcesDir || path.resolve(__dirname, '../../../../resources');

  const templatesPath = path.join(rootResources, 'templates/templates.json');
  if (fs.existsSync(templatesPath)) {
    const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
    // Always refresh system templates so all old 2-column templates are wiped out completely
    db.prepare('DELETE FROM template_sections').run();
    db.prepare('DELETE FROM templates').run();

    const insertTemplate = db.prepare(`
      INSERT INTO templates (id, name, description, category, template_json, is_system, created_at, updated_at)
      VALUES (@id, @name, @description, @category, @template_json, 1, @created_at, @updated_at)
    `);
    const insertSection = db.prepare(`
      INSERT INTO template_sections (id, template_id, title, instructions, marks, sequence_order)
      VALUES (@id, @template_id, @title, @instructions, @marks, @sequence_order)
    `);

    for (const t of templates) {
      insertTemplate.run({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        template_json: JSON.stringify(t),
        created_at: t.createdAt || new Date().toISOString(),
        updated_at: t.updatedAt || new Date().toISOString()
      });

      if (t.defaultSections && Array.isArray(t.defaultSections)) {
        t.defaultSections.forEach((sec: any, idx: number) => {
          insertSection.run({
            id: `${t.id}-sec-${idx + 1}`,
            template_id: t.id,
            title: sec.defaultTitle,
            instructions: sec.defaultInstructions || '',
            marks: sec.defaultMarks || null,
            sequence_order: idx
          });
        });
      }
    }
  }

  // Seed Symbols
  const checkSymbols = db.prepare('SELECT COUNT(*) as count FROM symbols').get() as { count: number };
  if (checkSymbols.count === 0) {
    const symbolsPath = path.join(rootResources, 'symbols/symbols.json');
    if (fs.existsSync(symbolsPath)) {
      const categories = JSON.parse(fs.readFileSync(symbolsPath, 'utf8'));
      const insertCat = db.prepare('INSERT INTO symbol_categories (id, name, is_system) VALUES (@id, @name, 1)');
      const insertSym = db.prepare(`
        INSERT INTO symbols (id, category_id, symbol, latex, name, description, is_system)
        VALUES (@id, @category_id, @symbol, @latex, @name, @description, 1)
      `);

      for (const cat of categories) {
        insertCat.run({ id: cat.id, name: cat.name });
        for (let i = 0; i < cat.symbols.length; i++) {
          const sym = cat.symbols[i];
          insertSym.run({
            id: `${cat.id}-${i + 1}`,
            category_id: cat.id,
            symbol: sym.symbol,
            latex: sym.latex,
            name: sym.name,
            description: sym.description || null
          });
        }
      }
    }
  }

  // Seed Physics
  const checkPhysics = db.prepare('SELECT COUNT(*) as count FROM physics_symbols').get() as { count: number };
  if (checkPhysics.count === 0) {
    const physicsPath = path.join(rootResources, 'physics/chapters.json');
    if (fs.existsSync(physicsPath)) {
      const chapters = JSON.parse(fs.readFileSync(physicsPath, 'utf8'));
      const insertSubject = db.prepare('INSERT OR IGNORE INTO subjects (id, name, code, is_system) VALUES (?, ?, ?, 1)');
      insertSubject.run('physics', 'Physics', 'PHY');

      const insertChapter = db.prepare('INSERT OR IGNORE INTO chapters (id, subject_id, name, sequence_order, is_system) VALUES (?, ?, ?, ?, 1)');
      const insertPhysicsSym = db.prepare(`
        INSERT INTO physics_symbols (id, chapter_id, symbol, latex, name, standard_unit, dimension, description, formulas_json, is_system)
        VALUES (@id, @chapter_id, @symbol, @latex, @name, @standard_unit, @dimension, @description, @formulas_json, 1)
      `);

      chapters.forEach((ch: any, idx: number) => {
        insertChapter.run(ch.id, 'physics', ch.name, idx);
        for (const s of ch.symbols) {
          insertPhysicsSym.run({
            id: s.id,
            chapter_id: ch.id,
            symbol: s.symbol,
            latex: s.latex,
            name: s.name,
            standard_unit: s.standardUnit || null,
            dimension: s.dimension || null,
            description: s.description || null,
            formulas_json: JSON.stringify(s.commonFormulas || [])
          });
        }
      });
    }
  }

  // Seed Chemistry Elements & Notations
  const checkChem = db.prepare('SELECT COUNT(*) as count FROM chemistry_symbols').get() as { count: number };
  if (checkChem.count === 0) {
    const elementsPath = path.join(rootResources, 'chemistry/elements.json');
    const notationsPath = path.join(rootResources, 'chemistry/notations.json');
    const insertChem = db.prepare(`
      INSERT INTO chemistry_symbols (id, type, name, formula, latex, description, data_json, is_system)
      VALUES (@id, @type, @name, @formula, @latex, @description, @data_json, 1)
    `);

    if (fs.existsSync(elementsPath)) {
      const elements = JSON.parse(fs.readFileSync(elementsPath, 'utf8'));
      for (const el of elements) {
        insertChem.run({
          id: `elem-${el.symbol.toLowerCase()}`,
          type: 'element',
          name: el.name,
          formula: el.symbol,
          latex: `\\text{${el.symbol}}`,
          description: `Atomic Number ${el.atomicNumber} (${el.category})`,
          data_json: JSON.stringify(el)
        });
      }
    }

    if (fs.existsSync(notationsPath)) {
      const notations = JSON.parse(fs.readFileSync(notationsPath, 'utf8'));
      for (const not of notations) {
        insertChem.run({
          id: not.id,
          type: not.type,
          name: not.name,
          formula: not.formula,
          latex: not.latex,
          description: not.description || null,
          data_json: JSON.stringify(not)
        });
      }
    }
  }

  // Seed Units
  const checkUnits = db.prepare('SELECT COUNT(*) as count FROM units').get() as { count: number };
  if (checkUnits.count === 0) {
    const unitsPath = path.join(rootResources, 'units/units.json');
    if (fs.existsSync(unitsPath)) {
      const { units, prefixes } = JSON.parse(fs.readFileSync(unitsPath, 'utf8'));
      const insertUnit = db.prepare(`
        INSERT INTO units (id, name, symbol, type, dimension, category, si_equivalent, is_system)
        VALUES (@id, @name, @symbol, @type, @dimension, @category, @si_equivalent, 1)
      `);

      for (const u of units) {
        insertUnit.run({
          id: u.id,
          name: u.name,
          symbol: u.symbol,
          type: u.type,
          dimension: u.dimension || null,
          category: u.category,
          si_equivalent: u.siEquivalent || null
        });
      }

      for (const p of prefixes) {
        insertUnit.run({
          id: `prefix-${p.id}`,
          name: `${p.name} (${p.factor})`,
          symbol: p.symbol,
          type: 'prefix',
          dimension: null,
          category: 'Prefix',
          si_equivalent: p.factor
        });
      }
    }
  }

  // Seed Constants
  const checkConstants = db.prepare('SELECT COUNT(*) as count FROM constants').get() as { count: number };
  if (checkConstants.count === 0) {
    const constPath = path.join(rootResources, 'constants/constants.json');
    if (fs.existsSync(constPath)) {
      const constants = JSON.parse(fs.readFileSync(constPath, 'utf8'));
      const insertConst = db.prepare(`
        INSERT INTO constants (id, name, symbol, latex, value, unit, category, description, is_system)
        VALUES (@id, @name, @symbol, @latex, @value, @unit, @category, @description, 1)
      `);

      for (const c of constants) {
        insertConst.run(c);
      }
    }
  }

  // Seed Presets
  const checkPresets = db.prepare('SELECT COUNT(*) as count FROM presets').get() as { count: number };
  if (checkPresets.count === 0) {
    const presetsPath = path.join(rootResources, 'presets/presets.json');
    if (fs.existsSync(presetsPath)) {
      const presets = JSON.parse(fs.readFileSync(presetsPath, 'utf8'));
      const insertPreset = db.prepare('INSERT INTO presets (id, preset_type, name, preset_json, is_system) VALUES (?, ?, ?, ?, 1)');
      for (const [key, value] of Object.entries(presets)) {
        insertPreset.run(`preset-${key}`, key, key, JSON.stringify(value));
      }
    }
  }

  // Seed Initial Questions
  const checkQuestions = db.prepare('SELECT COUNT(*) as count FROM questions').get() as { count: number };
  if (checkQuestions.count === 0) {
    const questionsPath = path.join(rootResources, 'presets/initial_questions.json');
    if (fs.existsSync(questionsPath)) {
      const questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
      const insertQ = db.prepare(`
        INSERT INTO questions (id, question_number, question_type, subject, chapter, topic, difficulty, marks, negative_marks, option_layout, question_json, is_system, created_at, updated_at)
        VALUES (@id, @question_number, @question_type, @subject, @chapter, @topic, @difficulty, @marks, @negative_marks, @option_layout, @question_json, 1, @created_at, @updated_at)
      `);
      const insertBank = db.prepare(`
        INSERT INTO question_bank (id, question_id, tags_json, year, created_at)
        VALUES (@id, @question_id, @tags_json, @year, @created_at)
      `);

      for (const q of questions) {
        insertQ.run({
          id: q.id,
          question_number: String(q.questionNumber || ''),
          question_type: q.questionType,
          subject: q.subject || 'General',
          chapter: q.chapter || '',
          topic: q.topic || '',
          difficulty: q.difficulty,
          marks: q.marks,
          negative_marks: q.negativeMarks || 0,
          option_layout: q.optionLayout || 'grid_2x2',
          question_json: JSON.stringify(q),
          created_at: q.createdAt || new Date().toISOString(),
          updated_at: q.updatedAt || new Date().toISOString()
        });

        insertBank.run({
          id: `bank-${q.id}`,
          question_id: q.id,
          tags_json: JSON.stringify(q.tags || []),
          year: q.year || null,
          created_at: q.createdAt || new Date().toISOString()
        });
      }
    }
  }

  // Seed Default Settings
  const checkSettings = db.prepare("SELECT COUNT(*) as count FROM settings WHERE key = 'app_settings'").get() as { count: number };
  if (checkSettings.count === 0) {
    const defaultSettings = {
      defaultFont: 'Inter',
      defaultFontSize: 11,
      defaultPaperSize: 'A4',
      defaultMargins: { top: 15, bottom: 15, left: 15, right: 15 },
      defaultQuestionStyle: 'number_dot',
      defaultOptionStyle: 'grid_2x2',
      defaultEquationSize: 11,
      autosaveIntervalMs: 2000,
      theme: 'system',
      exportSettings: {
        pdfDpi: 300,
        embedFonts: true,
        showPageNumbers: true
      },
      backupSettings: {
        autoBackupDaily: true,
        maxBackupsToKeep: 10
      }
    };
    db.prepare('INSERT INTO settings (key, value_json, updated_at) VALUES (?, ?, ?)').run(
      'app_settings',
      JSON.stringify(defaultSettings),
      new Date().toISOString()
    );
  }

  // Convert any existing documents in database to single-column layout
  try {
    const existingDocs = db.prepare('SELECT id, document_json FROM documents').all() as any[];
    for (const d of existingDocs) {
      if (d.document_json) {
        const parsed = JSON.parse(d.document_json);
        if (parsed.settings) {
          parsed.settings.columns = 1;
          parsed.settings.columnGap = 0;
          parsed.settings.columnDivider = false;
          if (parsed.templateId === 'a4-two-column') {
            parsed.templateId = 'a4-single-column';
          }
          db.prepare('UPDATE documents SET document_json = ? WHERE id = ?').run(JSON.stringify(parsed), d.id);
        }
      }
    }
  } catch (err) {
    // Ignore migration error if table does not exist
  }
}
