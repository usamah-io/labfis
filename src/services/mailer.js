import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let cachedTransporter = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * Return true when both GMAIL_USER and GMAIL_APP_PASSWORD are provided.
 */
export function isGmailConfigured() {
  return Boolean(config.gmailUser && config.gmailAppPasswordNormalized);
}

function getTransporter() {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: config.gmailUser,
        pass: config.gmailAppPasswordNormalized,
      },
    });
  }
  return cachedTransporter;
}

/**
 * Send an HTML login notification email via Gmail SMTP when configured.
 * Errors are caught and logged so email delivery never blocks authentication.
 */
export async function sendLoginNotification({ to, name, provider, loginAt }) {
  if (!isGmailConfigured()) {
    console.info('[LabFis Mailer] GMAIL_USER belum diisi di .env; notifikasi email dilewati.');
    return { sent: false, configured: false };
  }

  const safeName = escapeHtml(name || to);
  const safeEmail = escapeHtml(to);
  const safeProvider = escapeHtml(provider === 'google' ? 'Google OAuth' : 'Email & Password');
  const formattedTime = escapeHtml(
    new Date(loginAt).toLocaleString('id-ID', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'Asia/Jakarta',
    })
  );

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif; background: #f4fbf7; padding: 32px 16px; color: #0f2e24;">
      <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #d1fae5; border-radius: 20px; padding: 32px; box-shadow: 0 12px 30px rgba(5, 150, 105, 0.08);">
        <div style="display: inline-block; padding: 6px 14px; border-radius: 999px; background: #ecfdf5; color: #059669; font-size: 13px; font-weight: 700; margin-bottom: 16px;">
          LabFis • Sistem Manajemen Laboratorium Fisika
        </div>
        <h2 style="margin: 0 0 12px; font-size: 22px; color: #0f2e24;">Aktivitas Masuk ke LabFis</h2>
        <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: #476359;">
          Halo <strong>${safeName}</strong>, akun Anda baru saja masuk ke portal LabFis.
        </p>
        <div style="background: #f8fcfa; border: 1px solid #e2f2ea; border-radius: 14px; padding: 16px 18px; font-size: 14px; line-height: 1.7;">
          <div><strong>Email:</strong> ${safeEmail}</div>
          <div><strong>Metode Masuk:</strong> ${safeProvider}</div>
          <div><strong>Waktu:</strong> ${formattedTime} WIB</div>
        </div>
        <p style="margin: 20px 0 0; font-size: 13px; color: #6b857b;">
          Jika ini bukan aktivitas Anda, segera hubungi administrator laboratorium fisika.
        </p>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: `"LabFis" <${config.gmailUser}>`,
      to,
      subject: 'Aktivitas Masuk ke LabFis',
      html,
    });
    return { sent: true, configured: true };
  } catch (error) {
    console.error('[LabFis Mailer] Gagal mengirim notifikasi email:', error?.message || error);
    return { sent: false, configured: true };
  }
}
