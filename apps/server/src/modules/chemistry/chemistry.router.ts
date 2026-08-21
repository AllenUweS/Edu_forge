import { Router, Request, Response } from 'express';
import { defaultDb } from '../../database/db.js';
import { ChemistryElement, ChemistryNotation } from '@eduforge/shared';

export const chemistryRouter = Router();

// GET /api/chemistry/elements
chemistryRouter.get('/elements', (req: Request, res: Response) => {
  try {
    const rows = defaultDb.prepare("SELECT data_json FROM chemistry_symbols WHERE type = 'element'").all() as any[];
    const elements: ChemistryElement[] = rows.map(r => JSON.parse(r.data_json));
    res.json({ success: true, data: elements });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/chemistry/notations
chemistryRouter.get('/notations', (req: Request, res: Response) => {
  try {
    const rows = defaultDb.prepare("SELECT id, type, name, formula, latex, description FROM chemistry_symbols WHERE type != 'element'").all() as any[];
    const notations: ChemistryNotation[] = rows.map(r => ({
      id: r.id,
      name: r.name,
      type: r.type,
      formula: r.formula,
      latex: r.latex,
      description: r.description || undefined
    }));
    res.json({ success: true, data: notations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
