import { Router, Request, Response } from 'express';
import { defaultDb } from '../../database/db.js';
import { Unit } from '@eduforge/shared';

export const unitsRouter = Router();

// GET /api/units
unitsRouter.get('/', (req: Request, res: Response) => {
  try {
    const rows = defaultDb.prepare('SELECT * FROM units ORDER BY category ASC, name ASC').all() as any[];
    const units: Unit[] = rows.map(r => ({
      id: r.id,
      name: r.name,
      symbol: r.symbol,
      type: r.type,
      dimension: r.dimension || undefined,
      category: r.category,
      siEquivalent: r.si_equivalent || undefined
    }));
    res.json({ success: true, data: units });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
