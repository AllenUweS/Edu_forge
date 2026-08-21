import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { defaultDb } from '../../database/db.js';
import { Question } from '@eduforge/shared';

export const questionBankRouter = Router();

// GET /api/question-bank - List and filter questions
questionBankRouter.get('/', (req: Request, res: Response) => {
  try {
    const {
      search,
      subject,
      chapter,
      topic,
      difficulty,
      year,
      questionType,
      tags
    } = req.query;

    let query = `
      SELECT q.id, q.question_number, q.question_type, q.subject, q.chapter, q.topic,
             q.difficulty, q.marks, q.negative_marks, q.option_layout, q.question_json,
             q.is_system, q.created_at, q.updated_at, qb.tags_json, qb.year
      FROM questions q
      LEFT JOIN question_bank qb ON q.id = qb.question_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (subject) {
      query += ' AND LOWER(q.subject) = LOWER(?)';
      params.push(String(subject));
    }
    if (chapter) {
      query += ' AND LOWER(q.chapter) LIKE LOWER(?)';
      params.push(`%${String(chapter)}%`);
    }
    if (topic) {
      query += ' AND LOWER(q.topic) LIKE LOWER(?)';
      params.push(`%${String(topic)}%`);
    }
    if (difficulty) {
      query += ' AND q.difficulty = ?';
      params.push(String(difficulty));
    }
    if (year) {
      query += ' AND qb.year = ?';
      params.push(Number(year));
    }
    if (questionType) {
      query += ' AND q.question_type = ?';
      params.push(String(questionType));
    }
    if (search) {
      query += ' AND (LOWER(q.question_json) LIKE LOWER(?) OR LOWER(q.subject) LIKE LOWER(?) OR LOWER(q.chapter) LIKE LOWER(?))';
      const term = `%${String(search)}%`;
      params.push(term, term, term);
    }
    if (tags) {
      const tagList = String(tags).split(',').map(t => t.trim().toLowerCase());
      for (const t of tagList) {
        query += ' AND LOWER(qb.tags_json) LIKE ?';
        params.push(`%${t}%`);
      }
    }

    query += ' ORDER BY q.created_at DESC';

    const rows = defaultDb.prepare(query).all(...params) as any[];
    const questions: Question[] = rows.map(r => {
      const qObj = JSON.parse(r.question_json);
      qObj.id = r.id;
      return qObj;
    });

    res.json({ success: true, data: questions, total: questions.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/question-bank/export - Export all or filtered questions as JSON
questionBankRouter.get('/export', (req: Request, res: Response) => {
  try {
    const rows = defaultDb.prepare('SELECT question_json FROM questions ORDER BY created_at ASC').all() as any[];
    const questions = rows.map(r => JSON.parse(r.question_json));
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="eduforge_question_bank.json"');
    res.json(questions);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/question-bank/:id - Get single question
questionBankRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const row = defaultDb.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id) as any;
    if (!row) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    const question: Question = JSON.parse(row.question_json);
    res.json({ success: true, data: question });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/question-bank - Create question
questionBankRouter.post('/', (req: Request, res: Response) => {
  try {
    const body = req.body as Partial<Question>;
    const id = body.id || `q-${uuidv4()}`;
    const now = new Date().toISOString();

    const question: Question = {
      id,
      questionNumber: body.questionNumber || 1,
      questionType: body.questionType || 'MCQ_SINGLE',
      content: body.content || [
        {
          id: `p-${uuidv4().slice(0, 8)}`,
          type: 'paragraph',
          runs: [{ id: `t-${uuidv4().slice(0, 8)}`, text: body.rawText || 'Enter question statement here...' }]
        }
      ],
      rawText: body.rawText,
      options: body.options || [
        { id: `opt-${uuidv4().slice(0, 8)}`, key: 'a', content: [{ id: `p-${uuidv4().slice(0, 8)}`, type: 'paragraph', runs: [{ id: `t-${uuidv4().slice(0, 8)}`, text: 'Option A' }] }], isCorrect: true },
        { id: `opt-${uuidv4().slice(0, 8)}`, key: 'b', content: [{ id: `p-${uuidv4().slice(0, 8)}`, type: 'paragraph', runs: [{ id: `t-${uuidv4().slice(0, 8)}`, text: 'Option B' }] }], isCorrect: false },
        { id: `opt-${uuidv4().slice(0, 8)}`, key: 'c', content: [{ id: `p-${uuidv4().slice(0, 8)}`, type: 'paragraph', runs: [{ id: `t-${uuidv4().slice(0, 8)}`, text: 'Option C' }] }], isCorrect: false },
        { id: `opt-${uuidv4().slice(0, 8)}`, key: 'd', content: [{ id: `p-${uuidv4().slice(0, 8)}`, type: 'paragraph', runs: [{ id: `t-${uuidv4().slice(0, 8)}`, text: 'Option D' }] }], isCorrect: false }
      ],
      correctAnswer: body.correctAnswer || 'a',
      marks: body.marks || 4,
      negativeMarks: body.negativeMarks !== undefined ? body.negativeMarks : 1,
      subject: body.subject || 'Physics',
      chapter: body.chapter || '',
      topic: body.topic || '',
      difficulty: body.difficulty || 'Medium',
      tags: body.tags || [],
      year: body.year || new Date().getFullYear(),
      optionLayout: body.optionLayout || 'grid_2x2',
      explanation: body.explanation,
      explanationText: body.explanationText,
      isSystem: false,
      createdAt: now,
      updatedAt: now
    };

    defaultDb.prepare(`
      INSERT INTO questions (id, question_number, question_type, subject, chapter, topic, difficulty, marks, negative_marks, option_layout, question_json, is_system, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      question.id,
      String(question.questionNumber),
      question.questionType,
      question.subject || null,
      question.chapter || null,
      question.topic || null,
      question.difficulty,
      question.marks,
      question.negativeMarks || 0,
      question.optionLayout,
      JSON.stringify(question),
      0,
      now,
      now
    );

    defaultDb.prepare(`
      INSERT OR REPLACE INTO question_bank (id, question_id, tags_json, year, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `bank-${question.id}`,
      question.id,
      JSON.stringify(question.tags),
      question.year || null,
      now
    );

    res.status(201).json({ success: true, data: question });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/question-bank/:id - Update question
questionBankRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const body = req.body as Question;
    const now = new Date().toISOString();
    body.id = id;
    body.updatedAt = now;

    defaultDb.prepare(`
      UPDATE questions
      SET question_number = ?, question_type = ?, subject = ?, chapter = ?, topic = ?, difficulty = ?, marks = ?, negative_marks = ?, option_layout = ?, question_json = ?, updated_at = ?
      WHERE id = ?
    `).run(
      String(body.questionNumber || ''),
      body.questionType,
      body.subject || null,
      body.chapter || null,
      body.topic || null,
      body.difficulty,
      body.marks,
      body.negativeMarks || 0,
      body.optionLayout,
      JSON.stringify(body),
      now,
      id
    );

    defaultDb.prepare(`
      UPDATE question_bank
      SET tags_json = ?, year = ?
      WHERE question_id = ?
    `).run(
      JSON.stringify(body.tags || []),
      body.year || null,
      id
    );

    res.json({ success: true, data: body });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/question-bank/:id/duplicate - Duplicate question
questionBankRouter.post('/:id/duplicate', (req: Request, res: Response) => {
  try {
    const row = defaultDb.prepare('SELECT * FROM questions WHERE id = ?').get(req.params.id) as any;
    if (!row) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }

    const question: Question = JSON.parse(row.question_json);
    const newId = `q-${uuidv4()}`;
    const now = new Date().toISOString();
    question.id = newId;
    question.isSystem = false;
    question.createdAt = now;
    question.updatedAt = now;

    defaultDb.prepare(`
      INSERT INTO questions (id, question_number, question_type, subject, chapter, topic, difficulty, marks, negative_marks, option_layout, question_json, is_system, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).run(
      newId,
      String(question.questionNumber),
      question.questionType,
      question.subject || null,
      question.chapter || null,
      question.topic || null,
      question.difficulty,
      question.marks,
      question.negativeMarks || 0,
      question.optionLayout,
      JSON.stringify(question),
      now,
      now
    );

    defaultDb.prepare(`
      INSERT INTO question_bank (id, question_id, tags_json, year, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      `bank-${newId}`,
      newId,
      JSON.stringify(question.tags || []),
      question.year || null,
      now
    );

    res.status(201).json({ success: true, data: question });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/question-bank/:id - Delete question
questionBankRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const info = defaultDb.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, error: 'Question not found' });
    }
    defaultDb.prepare('DELETE FROM question_bank WHERE question_id = ?').run(req.params.id);
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/question-bank/import - Bulk import questions
questionBankRouter.post('/import', (req: Request, res: Response) => {
  try {
    const questions = req.body as Question[];
    if (!Array.isArray(questions)) {
      return res.status(400).json({ success: false, error: 'Expected an array of questions' });
    }

    const insertQ = defaultDb.prepare(`
      INSERT OR REPLACE INTO questions (id, question_number, question_type, subject, chapter, topic, difficulty, marks, negative_marks, option_layout, question_json, is_system, created_at, updated_at)
      VALUES (@id, @question_number, @question_type, @subject, @chapter, @topic, @difficulty, @marks, @negative_marks, @option_layout, @question_json, 0, @created_at, @updated_at)
    `);
    const insertBank = defaultDb.prepare(`
      INSERT OR REPLACE INTO question_bank (id, question_id, tags_json, year, created_at)
      VALUES (@id, @question_id, @tags_json, @year, @created_at)
    `);

    const now = new Date().toISOString();
    let count = 0;

    for (const q of questions) {
      const id = q.id || `q-${uuidv4()}`;
      q.id = id;
      q.createdAt = q.createdAt || now;
      q.updatedAt = now;

      insertQ.run({
        id,
        question_number: String(q.questionNumber || ''),
        question_type: q.questionType || 'MCQ_SINGLE',
        subject: q.subject || 'General',
        chapter: q.chapter || '',
        topic: q.topic || '',
        difficulty: q.difficulty || 'Medium',
        marks: q.marks || 4,
        negative_marks: q.negativeMarks || 0,
        option_layout: q.optionLayout || 'grid_2x2',
        question_json: JSON.stringify(q),
        created_at: q.createdAt,
        updated_at: now
      });

      insertBank.run({
        id: `bank-${id}`,
        question_id: id,
        tags_json: JSON.stringify(q.tags || []),
        year: q.year || null,
        created_at: q.createdAt
      });

      count++;
    }

    res.json({ success: true, count, message: `Successfully imported ${count} questions` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
