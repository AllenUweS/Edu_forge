import { Router, Request, Response } from 'express';
import { DocxExportService } from './docx.service.js';
import { PdfExportService } from './pdf.service.js';
import { DocumentModel } from '@eduforge/shared';
import { defaultDb } from '../../database/db.js';

export const exportRouter = Router();

// POST /api/export/docx - Generate genuine OpenXML DOCX from body
exportRouter.post('/docx', async (req: Request, res: Response) => {
  try {
    const docModel = req.body as DocumentModel;
    if (!docModel || !docModel.title) {
      return res.status(400).json({ success: false, error: 'Valid document model required' });
    }

    const buffer = await DocxExportService.generateDocx(docModel);
    const safeTitle = (docModel.title || 'EduForge_Paper').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.docx"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/export/:id/docx - Generate genuine OpenXML DOCX by document ID
exportRouter.get('/:id/docx', async (req: Request, res: Response) => {
  try {
    const docRow = defaultDb.prepare('SELECT document_json FROM documents WHERE id = ?').get(req.params.id) as any;
    if (!docRow) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    const docModel = JSON.parse(docRow.document_json) as DocumentModel;
    const buffer = await DocxExportService.generateDocx(docModel);
    const safeTitle = (docModel.title || 'EduForge_Paper').replace(/[^a-zA-Z0-9_-]/g, '_');

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}.docx"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/export/pdf - Generate printable A4 HTML from body
exportRouter.post('/pdf', (req: Request, res: Response) => {
  try {
    const docModel = req.body as DocumentModel;
    if (!docModel || !docModel.title) {
      return res.status(400).json({ success: false, error: 'Valid document model required' });
    }

    const html = PdfExportService.generatePrintableHtml(docModel);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/export/:id/pdf - Generate printable A4 HTML by document ID
exportRouter.get('/:id/pdf', (req: Request, res: Response) => {
  try {
    const docRow = defaultDb.prepare('SELECT document_json FROM documents WHERE id = ?').get(req.params.id) as any;
    if (!docRow) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }
    const docModel = JSON.parse(docRow.document_json) as DocumentModel;
    const html = PdfExportService.generatePrintableHtml(docModel);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

