import express from 'express';
import cors from 'cors';
import { defaultDb } from './database/db.js';
import { seedDatabase } from './database/seeder.js';
import { documentsRouter } from './modules/documents/documents.router.js';
import { questionBankRouter } from './modules/question-bank/question-bank.router.js';
import { templatesRouter } from './modules/templates/templates.router.js';
import { symbolsRouter } from './modules/symbols/symbols.router.js';
import { physicsRouter } from './modules/physics/physics.router.js';
import { chemistryRouter } from './modules/chemistry/chemistry.router.js';
import { unitsRouter } from './modules/units/units.router.js';
import { constantsRouter } from './modules/constants/constants.router.js';
import { settingsRouter } from './modules/settings/settings.router.js';
import { assetsRouter } from './modules/assets/assets.router.js';
import { exportRouter } from './modules/export/export.router.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Seed database on startup
try {
  seedDatabase(defaultDb);
  console.log('Database initialized and seeded successfully.');
} catch (err) {
  console.error('Database seeding failed:', err);
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'EduForge Server', version: '1.0.0' });
});

// API Routes
app.use('/api/documents', documentsRouter);
app.use('/api/question-bank', questionBankRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/symbols', symbolsRouter);
app.use('/api/physics', physicsRouter);
app.use('/api/chemistry', chemistryRouter);
app.use('/api/units', unitsRouter);
app.use('/api/constants', constantsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/export', exportRouter);

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`⚡️ EduForge Server running on http://localhost:${PORT}`);
  });
}

export { app };
