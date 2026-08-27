import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const subjectsRouter = Router();

// GET /api/subjects
subjectsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase.from('subjects').select('*').order('name');
    if (error) {
      return res.json({ success: true, data: [] });
    }
    const formatted = (data || []).map((s: any) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      color: s.color || 'bg-slate-50 text-slate-700 border-slate-200',
      chapters: 0,
      questions: 0
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// POST /api/subjects
subjectsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code, color } = req.body;
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, code, color })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/subjects/:id
subjectsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, code, color } = req.body;
    const { data, error } = await supabase
      .from('subjects')
      .update({ name, code, color, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/subjects/:id
subjectsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
