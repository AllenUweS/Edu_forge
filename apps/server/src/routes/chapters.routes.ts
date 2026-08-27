import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const chaptersRouter = Router();

// GET /api/chapters
chaptersRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId } = req.query;
    let query = supabase.from('chapters').select('*, subjects(name)');
    if (subjectId) {
      query = query.eq('subject_id', subjectId as string);
    }
    const { data, error } = await query;
    if (error) {
      return res.json({ success: true, data: [] });
    }
    const formatted = (data || []).map((ch: any) => ({
      id: ch.id,
      title: ch.title,
      code: ch.chapter_code,
      subject: ch.subjects?.name || 'General',
      subjectId: ch.subject_id,
      count: 0
    }));
    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// POST /api/chapters
chaptersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subjectId, title, name, code } = req.body;
    const { data, error } = await supabase
      .from('chapters')
      .insert({
        subject_id: subjectId,
        title: title || name,
        chapter_code: code || `CH-${Date.now()}`
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// PUT /api/chapters/:id
chaptersRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { title, name, code } = req.body;
    const { data, error } = await supabase
      .from('chapters')
      .update({
        title: title || name,
        chapter_code: code,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/chapters/:id
chaptersRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('chapters').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
