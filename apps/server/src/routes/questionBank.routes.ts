import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const questionBankRouter = Router();

// GET /api/question-bank - Question Bank Listing
questionBankRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, chapter, difficulty, search } = req.query;

    let query = supabase
      .from('questions')
      .select('*, subjects(name), chapters(title), question_options(*)');

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty as string);
    }

    if (search) {
      query = query.ilike('raw_text', `%${search}%`);
    }

    const { data, error } = await query;

    if (error || !data) {
      return res.json({ success: true, data: [] });
    }

    const formatted = data.map((q: any) => ({
      id: q.id,
      questionCode: q.question_code,
      questionType: q.question_type || 'MCQ_SINGLE',
      content: q.content || [],
      explanation: q.explanation || [],
      difficulty: q.difficulty || 'Medium',
      marks: Number(q.marks) || 1,
      negativeMarks: Number(q.negative_marks) || 0,
      correctAnswer: (q.correct_option || 'a').toUpperCase(),
      optionLayout: q.option_layout || 'grid_2x2',
      year: q.year,
      source: q.source,
      subject: q.subjects?.name || 'General',
      chapter: q.chapters?.title || 'General',
      rawText: q.raw_text || '',
      options: (q.question_options || []).map((opt: any) => ({
        id: opt.id,
        key: opt.option_key ? opt.option_key.toUpperCase() : 'A',
        rawText: opt.raw_text || (Array.isArray(opt.content) ? opt.content.map((c: any) => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || '')).join(' ') : ''),
        content: opt.content || [],
        isCorrect: (q.correct_option || '').toLowerCase() === (opt.option_key || '').toLowerCase()
      })),
      createdAt: q.created_at,
      updatedAt: q.updated_at
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});

// GET /api/question-bank/:id
questionBankRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: q, error } = await supabase
      .from('questions')
      .select('*, subjects(name), chapters(title), question_options(*)')
      .eq('id', id)
      .single();

    if (error || !q) {
      return res.status(404).json({
        success: false,
        error: { code: 'QUESTION_NOT_FOUND', message: 'Question not found' }
      });
    }

    const formatted = {
      id: q.id,
      questionCode: q.question_code,
      questionType: q.question_type || 'MCQ_SINGLE',
      content: q.content || [],
      explanation: q.explanation || [],
      difficulty: q.difficulty || 'Medium',
      marks: Number(q.marks) || 1,
      negativeMarks: Number(q.negative_marks) || 0,
      correctAnswer: (q.correct_option || 'a').toUpperCase(),
      optionLayout: q.option_layout || 'grid_2x2',
      year: q.year,
      source: q.source,
      subject: q.subjects?.name || 'General',
      chapter: q.chapters?.title || 'General',
      rawText: q.raw_text || '',
      options: (q.question_options || []).map((opt: any) => ({
        id: opt.id,
        key: opt.option_key ? opt.option_key.toUpperCase() : 'A',
        rawText: opt.raw_text || (Array.isArray(opt.content) ? opt.content.map((c: any) => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || '')).join(' ') : ''),
        content: opt.content || [],
        isCorrect: (q.correct_option || '').toLowerCase() === (opt.option_key || '').toLowerCase()
      })),
      createdAt: q.created_at,
      updatedAt: q.updated_at
    };

    res.json({ success: true, data: formatted });
  } catch (err) {
    next(err);
  }
});
