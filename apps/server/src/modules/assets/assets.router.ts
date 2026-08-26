import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { defaultDb } from '../../database/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../../../../uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext) ? ext : '.png';
    const uniqueName = `${uuidv4()}${safeExt}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files (PNG, JPEG, GIF, SVG, WebP) are allowed.'));
    }
  }
});

export const assetsRouter = Router();

// POST /api/assets/upload - Upload an image
assetsRouter.post('/upload', upload.single('image'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    const id = path.parse(req.file.filename).name;
    const now = new Date().toISOString();

    defaultDb.prepare(`
      INSERT INTO assets (id, original_name, mime_type, file_path, file_size, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.file.originalname,
      req.file.mimetype,
      req.file.filename,
      req.file.size,
      now
    );

    const assetUrl = `/api/assets/raw/${req.file.filename}`;
    res.status(201).json({
      success: true,
      data: {
        id,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: assetUrl
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const serveAssetFile = (req: Request, res: Response) => {
  const filename = path.basename(req.params.filename); // prevent path traversal
  const filePath = path.join(uploadsDir, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Asset not found');
  }

  res.sendFile(filePath);
};

// GET /api/assets/raw/:filename & GET /api/assets/:filename
assetsRouter.get('/raw/:filename', serveAssetFile);
assetsRouter.get('/:filename', serveAssetFile);
