import { Router, Request, Response } from 'express';
import { defaultDb } from '../../database/db.js';
import { SymbolCategory } from '@eduforge/shared';

export const symbolsRouter = Router();

// GET /api/symbols
symbolsRouter.get('/', (req: Request, res: Response) => {
  try {
    const categories = defaultDb.prepare('SELECT id, name FROM symbol_categories ORDER BY id ASC').all() as any[];
    const result: SymbolCategory[] = [];

    for (const cat of categories) {
      const symbols = defaultDb.prepare('SELECT symbol, latex, name, description FROM symbols WHERE category_id = ?').all(cat.id) as any[];
      result.push({
        id: cat.id,
        name: cat.name,
        symbols: symbols.map(s => ({
          symbol: s.symbol,
          latex: s.latex,
          name: s.name,
          description: s.description || undefined
        }))
      });
    }

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
