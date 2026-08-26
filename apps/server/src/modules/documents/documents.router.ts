import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { defaultDb } from '../../database/db.js';
import { DocumentModel } from '@eduforge/shared';

export const documentsRouter = Router();

// GET /api/documents - List documents
documentsRouter.get('/', (req: Request, res: Response) => {
  try {
    const search = req.query.search ? `%${String(req.query.search).toLowerCase()}%` : null;
    let query = 'SELECT id, title, template_id, is_system, created_at, updated_at FROM documents';
    const params: any[] = [];

    if (search) {
      query += ' WHERE LOWER(title) LIKE ?';
      params.push(search);
    }
    query += ' ORDER BY updated_at DESC';

    const docs = defaultDb.prepare(query).all(...params);
    res.json({ success: true, data: docs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/documents/:id - Get single document
documentsRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const doc = defaultDb.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any;
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    const documentModel: DocumentModel = JSON.parse(doc.document_json);
    res.json({ success: true, data: documentModel });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/documents - Create new document
documentsRouter.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<DocumentModel>;
    const id = body.id || uuidv4();
    const now = new Date().toISOString();

    const newDoc: DocumentModel = {
      id,
      title: body.title || 'Untitled Question Paper',
      templateId: body.templateId || 'a4-single-column',
      metadata: body.metadata || {
        instituteName: 'APEX ACADEMY',
        examName: 'QUESTION PAPER 2026',
        subject: 'PHYSICS',
        timeAllowedMinutes: 180,
        maxMarks: 100,
        generalInstructions: ['All questions are compulsory.', 'Read questions carefully.']
      },
      settings: body.settings || {
        pageSize: 'A4',
        orientation: 'portrait',
        margins: { top: 15, bottom: 15, left: 15, right: 15 },
        columns: 1,
        columnGap: 0,
        columnDivider: false,
        defaultFont: 'Inter',
        defaultFontSize: 11,
        questionSpacing: 12,
        optionSpacing: 4,
        lineSpacing: 1.25,
        paragraphSpacing: 6,
        showPageNumbers: true,
        pageNumberPosition: 'bottom_center'
      },
      sections: body.sections || [
        {
          id: `sec-${uuidv4().slice(0, 8)}`,
          title: 'SECTION A',
          instructions: 'Attempt all questions in this section.',
          marks: 50,
          blocks: []
        }
      ],
      isSystem: false,
      createdAt: now,
      updatedAt: now
    };

    defaultDb.prepare(`
      INSERT INTO documents (id, title, template_id, document_json, is_system, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      newDoc.id,
      newDoc.title,
      newDoc.templateId || null,
      JSON.stringify(newDoc),
      0,
      newDoc.createdAt,
      newDoc.updatedAt
    );

    res.status(201).json({ success: true, data: newDoc });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/documents/:id - Autosave / update document
documentsRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const body = req.body as DocumentModel;
    const now = new Date().toISOString();
    body.updatedAt = now;

    const existing = defaultDb.prepare('SELECT id FROM documents WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    defaultDb.prepare(`
      UPDATE documents
      SET title = ?, template_id = ?, document_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      body.title,
      body.templateId || null,
      JSON.stringify(body),
      now,
      id
    );

    res.json({ success: true, data: body, message: 'Document saved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/documents/:id/duplicate - Duplicate document
documentsRouter.post('/:id/duplicate', (req: Request, res: Response) => {
  try {
    const doc = defaultDb.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id) as any;
    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const documentModel: DocumentModel = JSON.parse(doc.document_json);
    const newId = uuidv4();
    const now = new Date().toISOString();

    documentModel.id = newId;
    documentModel.title = `${documentModel.title} (Copy)`;
    documentModel.createdAt = now;
    documentModel.updatedAt = now;

    defaultDb.prepare(`
      INSERT INTO documents (id, title, template_id, document_json, is_system, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      newId,
      documentModel.title,
      documentModel.templateId || null,
      JSON.stringify(documentModel),
      0,
      now,
      now
    );

    res.status(201).json({ success: true, data: documentModel });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/documents/:id - Delete document
documentsRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const info = defaultDb.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    res.json({ success: true, message: 'Document deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
