import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import { ROLES } from '../config/roles.js';
import { requireAuthApi, requireRoles } from '../middleware/auth.js';
import {
  createInventoryItem,
  deleteInventoryItem,
  listInventory,
  updateInventoryItem,
} from '../services/db.js';

const IS_VERCEL = Boolean(process.env.VERCEL);
const ALAT_IMAGES_DIR = path.join(process.cwd(), 'public', 'images', 'alat');
const UPLOAD_DIR = IS_VERCEL ? path.join('/tmp', 'labfis-uploads') : ALAT_IMAGES_DIR;
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

const MIME_EXT_MAP = {
  png: 'png',
  jpeg: 'jpg',
  jpg: 'jpg',
  webp: 'webp',
  'svg+xml': 'svg',
};

const router = Router();

router.get('/api/inventory', (req, res) => {
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const result = listInventory({ type, category, q });

  return res.status(200).json({
    ok: true,
    items: result.items,
    summary: result.summary,
  });
});

router.get('/api/uploads/:filename', (req, res) => {
  const filename = String(req.params.filename || '');
  if (!/^[a-z0-9._-]+$/i.test(filename) || filename.includes('..')) {
    return res.status(400).json({ ok: false, message: 'Nama file tidak valid.' });
  }

  const filePath = path.join(UPLOAD_DIR, filename);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }

  const staticFallback = path.join(ALAT_IMAGES_DIR, filename);
  if (fs.existsSync(staticFallback)) {
    return res.sendFile(staticFallback);
  }

  return res.status(404).json({ ok: false, message: 'Gambar tidak ditemukan.' });
});

router.post(
  '/api/inventory/upload-image',
  requireAuthApi,
  requireRoles([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  (req, res) => {
    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl.trim() : '';
    const match = /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,([A-Za-z0-9+/=\r\n]+)$/.exec(
      dataUrl
    );
    if (!match) {
      return res.status(400).json({
        ok: false,
        message: 'Format gambar tidak didukung. Gunakan PNG, JPG, WebP, atau SVG.',
      });
    }

    const ext = MIME_EXT_MAP[match[1]];
    const buffer = Buffer.from(match[2].replace(/\s+/g, ''), 'base64');
    if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
      return res.status(400).json({
        ok: false,
        message: 'Ukuran gambar maksimal 2 MB.',
      });
    }

    const rawName = typeof req.body?.filename === 'string' ? req.body.filename : 'alat';
    const baseName = rawName
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'alat';

    const fileName = `${baseName}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    try {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      fs.writeFileSync(path.join(UPLOAD_DIR, fileName), buffer);
    } catch (error) {
      return res.status(500).json({
        ok: false,
        message: `Gagal menyimpan gambar: ${error?.message || error}`,
      });
    }

    const imageUrl = IS_VERCEL ? `/api/uploads/${fileName}` : `/images/alat/${fileName}`;
    return res.status(200).json({
      ok: true,
      imageUrl,
    });
  }
);

router.post(
  '/api/inventory',
  requireAuthApi,
  requireRoles([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  (req, res) => {
    try {
      const item = createInventoryItem(req.body);
      return res.status(201).json({ ok: true, item });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        ok: false,
        message: error.message || 'Gagal menambahkan barang inventaris.',
      });
    }
  }
);

router.put(
  '/api/inventory/:id',
  requireAuthApi,
  requireRoles([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  (req, res) => {
    try {
      const item = updateInventoryItem(req.params.id, req.body);
      return res.status(200).json({ ok: true, item });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        ok: false,
        message: error.message || 'Gagal memperbarui barang inventaris.',
      });
    }
  }
);

router.delete(
  '/api/inventory/:id',
  requireAuthApi,
  requireRoles([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  (req, res) => {
    try {
      const item = deleteInventoryItem(req.params.id);
      return res.status(200).json({ ok: true, item });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        ok: false,
        message: error.message || 'Gagal menghapus barang inventaris.',
      });
    }
  }
);

export default router;
