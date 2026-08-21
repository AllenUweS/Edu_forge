import { Router, Request, Response } from 'express';
import { defaultDb } from '../../database/db.js';
import { ScientificConstant } from '@eduforge/shared';

export const constantsRouter = Router();

// GET /api/constants
constantsRouter.get('/', (req: Request, res: Response) => {
  try {
    const rows = defaultDb.prepare('SELECT * FROM constants ORDER BY category ASC, name ASC').all() as any[];
    const constants: ScientificConstant[] = rows.map(r => ({
      id: r.id,
      name: r.name,
      symbol: r.symbol,
      latex: r.latex,
      value: r.value,
      unit: r.unit,
      category: r.category,
      description: r.description
    }));
    res.json({ success: true, data: constants });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
