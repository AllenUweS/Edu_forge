import { describe, it, expect, beforeAll } from 'vitest';
import { getDatabase } from '../database/db.js';
import { seedDatabase } from '../database/seeder.js';
import { DocxExportService } from '../modules/export/docx.service.js';
import { PdfExportService } from '../modules/export/pdf.service.js';
import { DocumentModel } from '@eduforge/shared';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDbPath = path.resolve(__dirname, '../../../../data/test_app.db');

describe('EduForge Backend & Core Engines Test Suite', () => {
  let db: any;

  beforeAll(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = getDatabase(testDbPath);
    seedDatabase(db);
  });

  it('should seed 23 physics chapters with symbols and formulas', () => {
    const chapters = db.prepare('SELECT * FROM chapters WHERE subject_id = ?').all('physics');
    expect(chapters.length).toBeGreaterThanOrEqual(20);

    const symbols = db.prepare('SELECT * FROM physics_symbols').all();
    expect(symbols.length).toBeGreaterThan(15);
  });

  it('should seed chemistry elements, reaction arrows, and equilibrium notations', () => {
    const elements = db.prepare("SELECT * FROM chemistry_symbols WHERE type = 'element'").all();
    expect(elements.length).toBeGreaterThanOrEqual(20);

    const notations = db.prepare("SELECT * FROM chemistry_symbols WHERE type != 'element'").all();
    expect(notations.length).toBeGreaterThanOrEqual(10);
  });

  it('should seed standard units and fundamental constants', () => {
    const units = db.prepare('SELECT * FROM units').all();
    expect(units.length).toBeGreaterThanOrEqual(20);

    const constants = db.prepare('SELECT * FROM constants').all();
    expect(constants.length).toBeGreaterThanOrEqual(10);
  });

  it('should seed built-in exam templates including A4 single-column format', () => {
    const templates = db.prepare('SELECT * FROM templates').all();
    expect(templates.length).toBe(2);

    const singleCol = db.prepare('SELECT * FROM templates WHERE id = ?').get('a4-single-column');
    expect(singleCol).toBeDefined();
    const parsed = JSON.parse(singleCol.template_json);
    expect(parsed.settings.columns).toBe(1);
  });

  it('should support document CRUD in SQLite', () => {
    const docId = `test-doc-${Date.now()}`;
    const testDoc: DocumentModel = {
      id: docId,
      title: 'Physics Mid-Term Exam 2026',
      templateId: 'a4-single-column',
      metadata: {
        instituteName: 'TEST ACADEMY',
        examName: 'MID-TERM EXAM',
        subject: 'Physics',
        timeAllowedMinutes: 180,
        maxMarks: 100,
        generalInstructions: ['Read all questions']
      },
      settings: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 15, bottom: 15, left: 15, right: 15 },
        columns: 1,
        columnGap: 0,
        columnDivider: false,
        defaultFont: 'Inter',
        defaultFontSize: 10.5,
        questionSpacing: 12,
        optionSpacing: 4,
        lineSpacing: 1.25,
        paragraphSpacing: 6,
        showPageNumbers: true,
        pageNumberPosition: 'bottom_center'
      },
      sections: [
        {
          id: 'sec-1',
          title: 'SECTION A: PHYSICS',
          marks: 50,
          blocks: [
            {
              id: 'q-1',
              type: 'question',
              question: {
                id: 'q-1',
                questionNumber: 1,
                questionType: 'MCQ_SINGLE',
                rawText: 'What is the velocity of light in vacuum?',
                content: [],
                options: [
                  { id: 'opt-a', key: 'a', rawText: '3 x 10^8 m/s', isCorrect: true, content: [] },
                  { id: 'opt-b', key: 'b', rawText: '3 x 10^6 m/s', isCorrect: false, content: [] }
                ],
                correctAnswer: 'a',
                marks: 4,
                negativeMarks: 1,
                difficulty: 'Easy',
                tags: ['optics'],
                optionLayout: 'grid_2x2',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            }
          ]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Insert
    db.prepare(`
      INSERT INTO documents (id, title, template_id, document_json, is_system, created_at, updated_at)
      VALUES (?, ?, ?, ?, 0, ?, ?)
    `).run(testDoc.id, testDoc.title, testDoc.templateId, JSON.stringify(testDoc), testDoc.createdAt, testDoc.updatedAt);

    // Read
    const retrieved = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId) as any;
    expect(retrieved).toBeDefined();
    const parsed = JSON.parse(retrieved.document_json);
    expect(parsed.title).toBe('Physics Mid-Term Exam 2026');
    expect(parsed.sections[0].blocks.length).toBe(1);

    // Update
    parsed.title = 'Updated Exam Title';
    db.prepare('UPDATE documents SET title = ?, document_json = ? WHERE id = ?').run(parsed.title, JSON.stringify(parsed), docId);
    const updated = db.prepare('SELECT title FROM documents WHERE id = ?').get(docId) as any;
    expect(updated.title).toBe('Updated Exam Title');

    // Delete
    db.prepare('DELETE FROM documents WHERE id = ?').run(docId);
    const deleted = db.prepare('SELECT * FROM documents WHERE id = ?').get(docId);
    expect(deleted).toBeUndefined();
  });

  it('should generate valid OpenXML DOCX buffer without external Microsoft dependencies', async () => {
    const sampleDoc: DocumentModel = {
      id: 'doc-export-test',
      title: 'Sample Test Paper',
      metadata: {
        instituteName: 'APEX INSTITUTE',
        examName: 'ENTRANCE TEST',
        subject: 'PHYSICS',
        timeAllowedMinutes: 180,
        maxMarks: 100,
        generalInstructions: ['Attempt all questions']
      },
      settings: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 15, bottom: 15, left: 15, right: 15 },
        columns: 2,
        columnGap: 8,
        columnDivider: true,
        defaultFont: 'Inter',
        defaultFontSize: 10.5,
        questionSpacing: 12,
        optionSpacing: 4,
        lineSpacing: 1.25,
        paragraphSpacing: 6
      },
      sections: [
        {
          id: 'sec-1',
          title: 'SECTION A: PHYSICS',
          marks: 100,
          blocks: [
            {
              id: 'p-1',
              type: 'paragraph',
              runs: [{ id: 't-1', text: 'Sample paragraph with bold formatting', formatting: { bold: true } }]
            },
            {
              id: 'eq-1',
              type: 'equation',
              rawLatex: 'E = mc^2',
              ast: { version: '1.0', nodes: [] }
            },
            {
              id: 'q-1',
              type: 'question',
              question: {
                id: 'q-1',
                questionNumber: 1,
                questionType: 'MCQ_SINGLE',
                rawText: 'Calculate the acceleration due to gravity.',
                content: [],
                options: [
                  { id: 'opt-a', key: 'a', rawText: '9.8 m/s^2', isCorrect: true, content: [] },
                  { id: 'opt-b', key: 'b', rawText: '10 m/s^2', isCorrect: false, content: [] },
                  { id: 'opt-c', key: 'c', rawText: '9.0 m/s^2', isCorrect: false, content: [] },
                  { id: 'opt-d', key: 'd', rawText: '8.5 m/s^2', isCorrect: false, content: [] }
                ],
                correctAnswer: 'a',
                marks: 4,
                negativeMarks: 1,
                difficulty: 'Easy',
                tags: ['gravitation'],
                optionLayout: 'grid_2x2',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            }
          ]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const buffer = await DocxExportService.generateDocx(sampleDoc);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000); // Valid zip archive
    expect(buffer.slice(0, 4).toString('hex')).toBe('504b0304'); // PK ZIP header
  });

  it('should generate printable HTML with KaTeX and column styles for PDF export', () => {
    const sampleDoc: DocumentModel = {
      id: 'doc-pdf-test',
      title: 'PDF Test Paper',
      metadata: {
        instituteName: 'APEX INSTITUTE',
        examName: 'ANNUAL TEST',
        subject: 'CHEMISTRY',
        timeAllowedMinutes: 120,
        maxMarks: 80
      },
      settings: {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 15, bottom: 15, left: 15, right: 15 },
        columns: 2,
        columnGap: 8,
        columnDivider: true,
        defaultFont: 'Inter',
        defaultFontSize: 10.5,
        questionSpacing: 12,
        optionSpacing: 4,
        lineSpacing: 1.25,
        paragraphSpacing: 6
      },
      sections: [
        {
          id: 'sec-1',
          title: 'SECTION A: CHEMISTRY',
          marks: 80,
          blocks: [
            {
              id: 'eq-1',
              type: 'equation',
              rawLatex: '2\\text{H}_2 + \\text{O}_2 \\rightarrow 2\\text{H}_2\\text{O}',
              ast: { version: '1.0', nodes: [] }
            }
          ]
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const html = PdfExportService.generatePrintableHtml(sampleDoc);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('katex');
    expect(html).toContain('size: A4 portrait');
    expect(html).toContain('column-count: 2');
    expect(html).toContain('APEX INSTITUTE');
  });
});
