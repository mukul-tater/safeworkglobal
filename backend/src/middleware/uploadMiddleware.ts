import type { Request } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsRoot = path.resolve(__dirname, '../../data/uploads');

if (!fs.existsSync(uploadsRoot)) {
  fs.mkdirSync(uploadsRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsRoot);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
    cb(null, safe);
  },
});

function mediaFilter(allowed: RegExp) {
  return (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowed.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  };
}

export const uploadWorkerPhoto = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: mediaFilter(/^image\//),
});

export const uploadWorkerVideo = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: mediaFilter(/^video\//),
});

export function relativeUploadPath(filename: string): string {
  return `/uploads/${filename}`;
}
