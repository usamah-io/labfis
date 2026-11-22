import { Router } from 'express';
import { ROLES, SUPER_ADMIN_EMAIL } from '../config/roles.js';
import { requireAuthApi, requireRoles } from '../middleware/auth.js';
import {
  createLoan,
  getAdminAndSuperAdminEmails,
  listLoans,
  updateLoanStatus,
} from '../services/db.js';
import {
  sendLoanStatusNotification,
  sendLoanSubmittedNotification,
  sendTestEmail,
} from '../services/mailer.js';

const router = Router();

router.get('/api/loans', requireAuthApi, (req, res) => {
  const isStaff = req.user.role === ROLES.ADMIN || req.user.role === ROLES.SUPER_ADMIN;
  const onlyMine = req.query.mine === 'true';
  const loans = !isStaff || onlyMine ? listLoans({ email: req.user.email }) : listLoans();

  return res.status(200).json({
    ok: true,
    loans,
  });
});

router.post('/api/loans', requireAuthApi, async (req, res) => {
  try {
    const loan = createLoan({
      borrower: req.user,
      borrowerName: req.body?.borrowerName,
      phone: req.body?.phone,
      items: req.body?.items,
      borrowDate: req.body?.borrowDate,
      returnDate: req.body?.returnDate,
      purpose: req.body?.purpose,
    });

    const recipientEmails = getAdminAndSuperAdminEmails();
    const emailNotification = await sendLoanSubmittedNotification(loan, recipientEmails);

    return res.status(201).json({
      ok: true,
      loan,
      emailNotification,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      ok: false,
      message: error.message || 'Gagal mengajukan peminjaman.',
    });
  }
});

router.patch(
  '/api/loans/:id/status',
  requireAuthApi,
  requireRoles([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const loan = updateLoanStatus(req.params.id, {
        status: req.body?.status,
        adminNote: req.body?.adminNote,
        reviewer: req.user,
      });

      const emailNotification = await sendLoanStatusNotification(loan);

      return res.status(200).json({
        ok: true,
        loan,
        emailNotification,
      });
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        ok: false,
        message: error.message || 'Gagal memperbarui status peminjaman.',
      });
    }
  }
);

router.post(
  '/api/email/test',
  requireAuthApi,
  requireRoles([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  async (req, res) => {
    const targetEmail =
      typeof req.body?.to === 'string' && req.body.to.trim()
        ? req.body.to.trim()
        : req.user.email || SUPER_ADMIN_EMAIL;

    const emailNotification = await sendTestEmail(targetEmail, req.user);
    return res.status(200).json({
      ok: emailNotification.sent,
      emailNotification,
    });
  }
);

export default router;
