import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { defaultDb } from '../../database/db.js';
import { Template } from '@eduforge/shared';

export const templatesRouter = Router();

// GET /api/templates
templatesRouter.get('/', (req: Request, res: Response) => {
  try {
    const rows = defaultDb.prepare('SELECT * FROM templates ORDER BY is_system DESC, created_at ASC').all() as any[];
    const templates: Template[] = rows.map(r => {
      const parsed: Template = JSON.parse(r.template_json);
      if (parsed.settings) {
        parsed.settings.columns = 1;
        parsed.settings.columnGap = 0;
        parsed.settings.columnDivider = false;
      }
      if (parsed.description && parsed.description.includes('2-Column')) {
        parsed.description = parsed.description.replace('2-Column', 'Single-Column');
      }
      return parsed;
    });
    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/templates/:id
templatesRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const row = defaultDb.prepare('SELECT * FROM templates WHERE id = ?').get(req.params.id) as any;
    if (!row) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    const template: Template = JSON.parse(row.template_json);
    res.json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/templates - Create custom template
templatesRouter.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<Template>;
    const id = body.id || `custom-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    const template: Template = {
      id,
      name: body.name || 'Custom Question Paper Template',
      description: body.description || 'User-created custom question paper layout',
      category: 'custom',
      settings: body.settings || {
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
      defaultMetadata: body.defaultMetadata || {},
      defaultSections: body.defaultSections || [
        { defaultTitle: 'SECTION A', defaultMarks: 50 }
      ],
      defaultOptionLayout: body.defaultOptionLayout || 'grid_2x2',
      isSystem: false,
      createdAt: now,
      updatedAt: now
    };

    defaultDb.prepare(`
      INSERT INTO templates (id, name, description, category, template_json, is_system, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      template.id,
      template.name,
      template.description,
      template.category,
      JSON.stringify(template),
      now,
      now
    );

    res.status(201).json({ success: true, data: template });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/templates/:id
templatesRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const existing = defaultDb.prepare('SELECT is_system FROM templates WHERE id = ?').get(req.params.id) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }
    if (existing.is_system === 1) {
      return res.status(403).json({ success: false, error: 'Cannot delete built-in system template' });
    }

    defaultDb.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Template deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
