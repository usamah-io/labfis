import { Router } from 'express';
import { ROLES } from '../config/roles.js';
import { requireAuthApi, requireRoles } from '../middleware/auth.js';
import {
  createInventoryItem,
  deleteInventoryItem,
  listInventory,
  updateInventoryItem,
} from '../services/db.js';

const router = Router();

router.get('/api/inventory', (req, res) => {
  const type = typeof req.query.type === 'string' ? req.query.type : undefined;
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const result = listInventory({ type, q });

  return res.status(200).json({
    ok: true,
    items: result.items,
    summary: result.summary,
  });
});

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
