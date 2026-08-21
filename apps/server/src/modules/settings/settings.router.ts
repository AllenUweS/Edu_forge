import { Router, Request, Response } from 'express';
import { defaultDb } from '../../database/db.js';
import { AppSettings } from '@eduforge/shared';

export const settingsRouter = Router();

// GET /api/settings
settingsRouter.get('/', (req: Request, res: Response) => {
  try {
    const row = defaultDb.prepare("SELECT value_json FROM settings WHERE key = 'app_settings'").get() as any;
    if (!row) {
      return res.status(404).json({ success: false, error: 'Settings not found' });
    }
    const settings: AppSettings = JSON.parse(row.value_json);
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/settings
settingsRouter.put('/', (req: Request, res: Response) => {
  try {
    const body = req.body as AppSettings;
    const now = new Date().toISOString();

    defaultDb.prepare(`
      INSERT INTO settings (key, value_json, updated_at)
      VALUES ('app_settings', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
    `).run(JSON.stringify(body), now);

    res.json({ success: true, data: body, message: 'Settings updated successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
