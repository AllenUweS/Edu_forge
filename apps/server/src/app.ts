import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import { questionsRouter } from './routes/questions.routes.js';
import { questionBankRouter } from './routes/questionBank.routes.js';
import { subjectsRouter } from './routes/subjects.routes.js';
import { chaptersRouter } from './routes/chapters.routes.js';
import { templatesRouter } from './routes/templates.routes.js';
import { symbolsRouter } from './routes/symbols.routes.js';
import { scienceRouter } from './routes/science.routes.js';
import { assetsRouter } from './routes/assets.routes.js';
import { papersRouter } from './routes/papers.routes.js';
import { settingsRouter } from './routes/settings.routes.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// REST API Endpoints
app.use('/api/questions', questionsRouter);
app.use('/api/question-bank', questionBankRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/chapters', chaptersRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/symbols', symbolsRouter);
app.use('/api', scienceRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/media', assetsRouter); // Alias for media upload
app.use('/api/papers', papersRouter);
app.use('/api/exam-papers', papersRouter); // Alias for papers
app.use('/api/settings', settingsRouter);

// Global Error Handler
app.use(errorHandler);
