import { Router, Request, Response } from 'express';
import { defaultDb } from '../../database/db.js';
import { PhysicsChapter } from '@eduforge/shared';

export const physicsRouter = Router();

// GET /api/physics/chapters
physicsRouter.get('/chapters', (req: Request, res: Response) => {
  try {
    const chapters = defaultDb.prepare('SELECT id, name FROM chapters WHERE subject_id = ? ORDER BY sequence_order ASC').all('physics') as any[];
    const result: PhysicsChapter[] = [];

    for (const ch of chapters) {
      const symbols = defaultDb.prepare('SELECT * FROM physics_symbols WHERE chapter_id = ?').all(ch.id) as any[];
      result.push({
        id: ch.id,
        name: ch.name,
        category: 'Physics',
        symbols: symbols.map(s => ({
          id: s.id,
          symbol: s.symbol,
          latex: s.latex,
          name: s.name,
          chapter: ch.name,
          standardUnit: s.standard_unit || undefined,
          dimension: s.dimension || undefined,
          description: s.description || undefined,
          commonFormulas: s.formulas_json ? JSON.parse(s.formulas_json) : []
        }))
      });
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
