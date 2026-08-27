import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const questionsRouter = Router();

// GET /api/questions - Lightweight summaries
questionsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject, chapter, difficulty, search } = req.query;

    let query = supabase
      .from('questions')
      .select('id, question_code, difficulty, marks, question_type, raw_text, subjects(name), chapters(title)');

    if (difficulty && difficulty !== 'all') {
      query = query.eq('difficulty', difficulty as string);
    }

    if (search) {
      query = query.ilike('raw_text', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      // Fallback response if DB table is empty/connecting
      return res.json({ success: true, data: [] });
    }

    const summaries = (data || []).map((q: any) => ({
      id: q.id,
      questionCode: q.question_code,
      subject: q.subjects?.name || 'General',
      chapter: q.chapters?.title || 'General',
      difficulty: q.difficulty || 'Medium',
      marks: q.marks || 1,
      questionType: q.question_type || 'MCQ_SINGLE',
      questionPreview: q.raw_text ? q.raw_text.substring(0, 120) : 'Question Content'
    }));

    res.json({ success: true, data: summaries });
  } catch (err) {
    next(err);
  }
});

// GET /api/questions/:id - Full Question detail
questionsRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
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

    const options = (q.question_options || []).map((opt: any) => ({
      id: opt.id,
      key: opt.option_key,
      content: opt.content || [],
      rawText: opt.raw_text || ''
    }));

    const fullQuestion = {
      id: q.id,
      questionCode: q.question_code,
      questionType: q.question_type || 'MCQ_SINGLE',
      content: q.content || [],
      explanation: q.explanation || [],
      difficulty: q.difficulty || 'Medium',
      marks: Number(q.marks) || 1,
      negativeMarks: Number(q.negative_marks) || 0,
      correctAnswer: q.correct_option || 'a',
      optionLayout: q.option_layout || 'grid_2x2',
      year: q.year,
      source: q.source,
      subject: q.subjects?.name || 'General',
      chapter: q.chapters?.title || 'General',
      options,
      createdAt: q.created_at,
      updatedAt: q.updated_at
    };

    res.json({ success: true, data: fullQuestion });
  } catch (err) {
    next(err);
  }
});

// POST /api/questions - Create Question
questionsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;

    const { data: newQ, error } = await supabase
      .from('questions')
      .insert({
        question_code: body.questionCode || `Q-${Date.now()}`,
        question_type: body.questionType || 'MCQ_SINGLE',
        content: body.content || [],
        explanation: body.explanation || [],
        difficulty: body.difficulty || 'Medium',
        marks: body.marks || 1,
        negative_marks: body.negativeMarks || 0,
        correct_option: body.correctAnswer || 'a',
        option_layout: body.optionLayout || 'grid_2x2',
        year: body.year,
        source: body.source,
        raw_text: body.rawText || ''
      })
      .select()
      .single();

    if (error) throw error;

    // Save options if present
    if (Array.isArray(body.options) && body.options.length > 0) {
      const opts = body.options.map((opt: any, idx: number) => ({
        question_id: newQ.id,
        option_key: opt.key || String.fromCharCode(97 + idx),
        content: opt.content || [],
        sort_order: idx + 1
      }));
      await supabase.from('question_options').insert(opts);
    }

    res.status(201).json({ success: true, data: { ...body, id: newQ.id } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/questions/:id - Update Question
questionsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const { error } = await supabase
      .from('questions')
      .update({
        content: body.content,
        explanation: body.explanation,
        difficulty: body.difficulty,
        marks: body.marks,
        negative_marks: body.negativeMarks,
        correct_option: body.correctAnswer,
        option_layout: body.optionLayout,
        raw_text: body.rawText,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, data: { ...body, id } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/questions/:id - Delete Question
questionsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
