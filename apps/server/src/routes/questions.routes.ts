import { Router, Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase.js';

export const questionsRouter = Router();

// GET /api/questions - Full question list with options
questionsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
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

    if (error) {
      console.error('Supabase getQuestions error:', error);
      return res.json({ success: true, data: [] });
    }

    const formattedList = (data || []).map((q: any) => {
      const options = (q.question_options || []).map((opt: any) => {
        let textVal = opt.raw_text || '';
        if (!textVal && Array.isArray(opt.content)) {
          textVal = opt.content.map((c: any) => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || '')).join(' ');
        }
        return {
          id: opt.id,
          key: opt.option_key ? opt.option_key.toUpperCase() : 'A',
          content: opt.content || [],
          rawText: textVal,
          isCorrect: q.correct_option === opt.option_key
        };
      });

      return {
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
        rawText: q.raw_text || '',
        subject: q.subjects?.name || 'General',
        chapter: q.chapters?.title || 'General',
        options,
        createdAt: q.created_at,
        updatedAt: q.updated_at
      };
    });

    res.json({ success: true, data: formattedList });
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

// Helper to resolve or auto-create subject_id and chapter_id in Supabase
async function resolveSubjectAndChapter(subjectName?: string, chapterTitle?: string) {
  let subject_id: string | null = null;
  let chapter_id: string | null = null;

  if (subjectName) {
    const { data: sub } = await supabase
      .from('subjects')
      .select('id')
      .ilike('name', subjectName.trim())
      .maybeSingle();

    if (sub?.id) {
      subject_id = sub.id;
    } else {
      const code = subjectName.trim().substring(0, 3).toUpperCase();
      const { data: newSub } = await supabase
        .from('subjects')
        .insert({ name: subjectName.trim(), code })
        .select('id')
        .maybeSingle();
      if (newSub?.id) subject_id = newSub.id;
    }
  }

  if (chapterTitle && subject_id) {
    const { data: ch } = await supabase
      .from('chapters')
      .select('id')
      .eq('subject_id', subject_id)
      .ilike('title', chapterTitle.trim())
      .maybeSingle();

    if (ch?.id) {
      chapter_id = ch.id;
    } else {
      const { data: newCh } = await supabase
        .from('chapters')
        .insert({
          subject_id,
          chapter_code: `CH-${Date.now().toString().slice(-4)}`,
          title: chapterTitle.trim()
        })
        .select('id')
        .maybeSingle();
      if (newCh?.id) chapter_id = newCh.id;
    }
  }

  return { subject_id, chapter_id };
}

// POST /api/questions - Create Question
questionsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = req.body;
    const { subject_id, chapter_id } = await resolveSubjectAndChapter(body.subject, body.chapter);

    const questionCode = body.questionCode || body.id || `Q-${Date.now()}`;
    const rawText = body.rawText || (Array.isArray(body.content) ? body.content.map((b: any) => b.text || b.html || '').join(' ') : '');

    const insertPayload: any = {
      question_code: questionCode,
      subject_id,
      chapter_id,
      question_type: body.questionType || 'MCQ_SINGLE',
      content: body.content || body.blocks || [],
      explanation: body.explanation || body.explanationText || [],
      difficulty: body.difficulty || 'Medium',
      marks: body.marks || 1,
      negative_marks: body.negativeMarks || 0,
      correct_option: (body.correctAnswer || 'a').toLowerCase(),
      option_layout: body.optionLayout || 'grid_2x2',
      year: body.year,
      source: body.source,
      raw_text: rawText
    };

    // Only pass id if it is a valid UUID
    if (body.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.id)) {
      insertPayload.id = body.id;
    }

    const { data: newQ, error } = await supabase
      .from('questions')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error('Supabase Question Insert Error:', error);
      throw error;
    }

    // Save options if present
    if (Array.isArray(body.options) && body.options.length > 0) {
      const opts = body.options.map((opt: any, idx: number) => {
        let rawVal = opt.rawText || '';
        if (!rawVal && Array.isArray(opt.content)) {
          rawVal = opt.content.map((c: any) => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || '')).join(' ');
        }
        return {
          question_id: newQ.id,
          option_key: (opt.key || String.fromCharCode(97 + idx)).toLowerCase(),
          content: opt.content || (rawVal ? [{ type: 'text', html: rawVal }] : []),
          raw_text: rawVal,
          sort_order: idx + 1
        };
      });
      const { error: optErr } = await supabase.from('question_options').insert(opts);
      if (optErr) console.error('Supabase Option Insert Error:', optErr);
    }

    res.status(201).json({ success: true, data: { ...body, id: newQ.id, questionCode } });
  } catch (err) {
    console.error('Create question route error:', err);
    next(err);
  }
});

// PUT /api/questions/:id - Update Question
questionsRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const body = req.body;
    const { subject_id, chapter_id } = await resolveSubjectAndChapter(body.subject, body.chapter);

    const { error } = await supabase
      .from('questions')
      .update({
        subject_id: subject_id || undefined,
        chapter_id: chapter_id || undefined,
        content: body.content || body.blocks,
        explanation: body.explanation || body.explanationText,
        difficulty: body.difficulty,
        marks: body.marks,
        negative_marks: body.negativeMarks,
        correct_option: (body.correctAnswer || 'a').toLowerCase(),
        option_layout: body.optionLayout,
        raw_text: body.rawText,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    if (Array.isArray(body.options) && body.options.length > 0) {
      await supabase.from('question_options').delete().eq('question_id', id);
      const opts = body.options.map((opt: any, idx: number) => {
        let rawVal = opt.rawText || '';
        if (!rawVal && Array.isArray(opt.content)) {
          rawVal = opt.content.map((c: any) => c.latex ? `\\(${c.latex}\\)` : (c.html || c.text || '')).join(' ');
        }
        return {
          question_id: id,
          option_key: (opt.key || String.fromCharCode(97 + idx)).toLowerCase(),
          content: opt.content || (rawVal ? [{ type: 'text', html: rawVal }] : []),
          raw_text: rawVal,
          sort_order: idx + 1
        };
      });
      const { error: optErr } = await supabase.from('question_options').insert(opts);
      if (optErr) console.error('Supabase Option Update Error:', optErr);
    }

    res.json({ success: true, data: { ...body, id } });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/questions/:id - Delete Question
questionsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    await supabase.from('question_options').delete().eq('question_id', id);
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) throw error;

    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
