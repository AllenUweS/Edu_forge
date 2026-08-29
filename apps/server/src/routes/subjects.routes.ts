import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const subjectsRouter = Router();

// GET /api/subjects
subjectsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const [subsRes, chsRes, qsRes] = await Promise.all([
      supabase.from('subjects').select('*').order('name'),
      supabase.from('chapters').select('id, subject_id, subject'),
      supabase.from('questions').select('id, subject_id, subject')
    ]);

    if (subsRes.error) {
      console.error('Supabase getSubjects error:', subsRes.error);
      return res.json({ success: true, data: [] });
    }

    const subjects = subsRes.data || [];
    const chapters = chsRes.data || [];
    const questions = qsRes.data || [];

    const formatted = subjects.map((s: any) => {
      const sId = String(s.id || '').toLowerCase();
      const sName = String(s.name || '').trim().toLowerCase();

      // Count chapters belonging to this subject
      const chCount = chapters.filter((c: any) => {
        const cSubId = c.subject_id ? String(c.subject_id).toLowerCase() : '';
        const cSubName = c.subject ? String(c.subject).trim().toLowerCase() : '';
        return (cSubId && cSubId === sId) || (cSubName && cSubName === sName);
      }).length;

      // Count questions belonging to this subject
      const qCount = questions.filter((q: any) => {
        const qSubId = q.subject_id ? String(q.subject_id).toLowerCase() : '';
        const qSubName = q.subject ? String(q.subject).trim().toLowerCase() : '';
        return (qSubId && qSubId === sId) || (qSubName && (qSubName === sName || qSubName.includes(sName)));
      }).length;

      return {
        id: s.id,
        name: s.name,
        code: s.code,
        color: s.color || 'bg-slate-50 text-slate-700 border-slate-200',
        chapters: chCount,
        questions: qCount
      };
    });

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
