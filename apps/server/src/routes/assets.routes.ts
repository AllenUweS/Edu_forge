import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { supabase } from '../config/supabase.js';

export const assetsRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const BUCKET_NAME = process.env.VITE_SUPABASE_STORAGE_BUCKET || 'question-assets';

async function ensureBucketExists() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = (buckets || []).some(b => b.name === BUCKET_NAME);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET_NAME, { public: true });
    }
  } catch (err) {
    // Ignore error if bucket creation fails or exists
  }
}

// GET /api/assets
assetsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { data, error } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
    if (error || !data) {
      return res.json({ success: true, data: [] });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/assets - Upload image/media to Supabase Storage bucket 'question-assets'
assetsRouter.post('/', upload.single('file'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_FILE_PROVIDED', message: 'No upload file provided' }
      });
    }

    await ensureBucketExists();

    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const storagePath = `uploads/${fileName}`;

    // Upload to Supabase Storage bucket
    const { data: storageData, error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    let publicUrl = '';
    if (!storageError && storageData) {
      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      publicUrl = urlData.publicUrl;
    } else {
      // Fallback data URL if storage is unconfigured
      publicUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    // Save metadata in PostgreSQL
    const { data: assetData, error: dbError } = await supabase
      .from('assets')
      .insert({
        storage_path: storagePath,
        public_url: publicUrl,
        filename: file.originalname,
        mime_type: file.mimetype,
        size_bytes: file.size
      })
      .select()
      .single();

    const result = {
      id: assetData?.id || `asset-${Date.now()}`,
      url: publicUrl,
      originalName: file.originalname,
      storagePath,
      sizeBytes: file.size
    };

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/assets/:id
assetsRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { data: asset } = await supabase.from('assets').select('*').eq('id', id).single();
    if (asset && asset.storage_path) {
      await supabase.storage.from('question-assets').remove([asset.storage_path]);
    }
    await supabase.from('assets').delete().eq('id', id);
    res.json({ success: true, data: { id } });
  } catch (err) {
    next(err);
  }
});
