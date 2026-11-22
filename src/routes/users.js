import { Router } from 'express';
import { ROLES } from '../config/roles.js';
import { requireAuthApi, requireRoles } from '../middleware/auth.js';
import {
  createUser,
  deleteUser,
  listUsers,
  updateUserRole,
} from '../services/db.js';

const router = Router();

router.use('/api/users', requireAuthApi, requireRoles([ROLES.SUPER_ADMIN]));

router.get('/api/users', (req, res) => {
  return res.status(200).json({
    ok: true,
    users: listUsers(),
  });
});

router.post('/api/users', (req, res) => {
  try {
    const user = createUser({
      name: req.body?.name,
      email: req.body?.email,
      role: req.body?.role,
      password: req.body?.password,
    });
    return res.status(201).json({ ok: true, user });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      ok: false,
      message: error.message || 'Gagal menambahkan pengguna.',
    });
  }
});

router.patch('/api/users/:id/role', (req, res) => {
  try {
    const user = updateUserRole(req.params.id, req.body?.role, req.user.id);
    return res.status(200).json({ ok: true, user });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      ok: false,
      message: error.message || 'Gagal mengubah role pengguna.',
    });
  }
});

router.delete('/api/users/:id', (req, res) => {
  try {
    const user = deleteUser(req.params.id, req.user.id);
    return res.status(200).json({ ok: true, user });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      ok: false,
      message: error.message || 'Gagal menghapus pengguna.',
    });
  }
});

export default router;
