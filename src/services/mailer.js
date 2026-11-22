import nodemailer from 'nodemailer';
import { config } from '../config/env.js';
import { LOAN_STATUS, LOAN_STATUS_LABELS, ROLE_LABELS } from '../config/roles.js';

let cachedTransporter = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatWib(isoOrDateString) {
  if (!isoOrDateString) return '-';
  const parsed = new Date(isoOrDateString);
  if (Number.isNaN(parsed.getTime())) {
    return String(isoOrDateString);
  }
  return parsed.toLocaleString('id-ID', {
    dateStyle: 'full',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  });
}

function formatDateId(dateString) {
  if (!dateString) return '-';
  const parsed = new Date(`${dateString}T00:00:00+07:00`);
  if (Number.isNaN(parsed.getTime())) {
    return String(dateString);
  }
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });
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
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: config.gmailUser,
        pass: config.gmailAppPasswordNormalized,
      },
    });
  }
  return cachedTransporter;
}

function normalizeRecipients(to) {
  const list = Array.isArray(to) ? to : [to];
  const unique = new Set();
  for (const entry of list) {
    if (typeof entry === 'string' && entry.trim()) {
      unique.add(entry.trim().toLowerCase());
    }
  }
  return Array.from(unique);
}

async function dispatchEmail({ to, subject, html, contextLabel }) {
  const recipients = normalizeRecipients(to);
  if (recipients.length === 0) {
    const errMsg = 'Tidak ada alamat email tujuan.';
    console.warn(`[LabFis Mailer] GAGAL (${contextLabel}): ${errMsg}`);
    return {
      sent: false,
      configured: isGmailConfigured(),
      recipients,
      messageId: null,
      statusMessage: `Email belum dikirim: ${errMsg}`,
      error: errMsg,
    };
  }

  if (!isGmailConfigured()) {
    console.warn(
      `[LabFis Mailer] GAGAL (${contextLabel}): GMAIL_USER belum diisi di .env. Isi GMAIL_USER dengan alamat Gmail pembuat App Password lalu restart server.`
    );
    return {
      sent: false,
      configured: false,
      recipients,
      messageId: null,
      statusMessage:
        'Email belum dikirim: GMAIL_USER belum diisi di file .env (isi alamat Gmail pengirim lalu restart server).',
      error: 'GMAIL_USER belum diisi di .env',
    };
  }

  try {
    const info = await getTransporter().sendMail({
      from: `"LabFis" <${config.gmailUser}>`,
      to: recipients.join(', '),
      subject,
      html,
    });

    console.info(
      `[LabFis Mailer] SUKSES (${contextLabel}) -> [${recipients.join(', ')}] | Subject: "${subject}" | MessageId: ${info.messageId}`
    );

    return {
      sent: true,
      configured: true,
      recipients,
      messageId: info.messageId || null,
      statusMessage: `Email notifikasi berhasil dikirim ke ${recipients.join(', ')}.`,
      error: null,
    };
  } catch (error) {
    const errMsg = error?.message || String(error);
    console.error(
      `[LabFis Mailer] GAGAL (${contextLabel}) -> [${recipients.join(', ')}] | Error: ${errMsg}`
    );

    return {
      sent: false,
      configured: true,
      recipients,
      messageId: null,
      statusMessage: `Gagal mengirim email ke ${recipients.join(', ')}: ${errMsg}`,
      error: errMsg,
    };
  }
}

function buildItemsTableHtml(items) {
  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 9px 10px; border-bottom: 1px solid #e5f2eb; font-family: monospace; color: #047857;">${escapeHtml(item.code)}</td>
        <td style="padding: 9px 10px; border-bottom: 1px solid #e5f2eb; font-weight: 600; color: #0f2e24;">${escapeHtml(item.name)}</td>
        <td style="padding: 9px 10px; border-bottom: 1px solid #e5f2eb; color: #476359;">${escapeHtml(item.type === 'bahan' ? 'Bahan' : 'Alat')}</td>
        <td style="padding: 9px 10px; border-bottom: 1px solid #e5f2eb; text-align: right; font-weight: 600; color: #0f2e24;">${escapeHtml(item.qty)} ${escapeHtml(item.unit)}</td>
      </tr>
    `
    )
    .join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13.5px; background: #ffffff; border: 1px solid #dcfce7; border-radius: 10px; overflow: hidden;">
      <thead>
        <tr style="background: #ecfdf5; text-align: left; color: #065f46;">
          <th style="padding: 9px 10px;">Kode</th>
          <th style="padding: 9px 10px;">Nama Barang</th>
          <th style="padding: 9px 10px;">Jenis</th>
          <th style="padding: 9px 10px; text-align: right;">Jumlah</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/**
 * Send HTML notification to Super Admin and Admins when a user submits a new loan request.
 */
export async function sendLoanSubmittedNotification(loan, recipientEmails) {
  const itemsTable = buildItemsTableHtml(loan.items || []);
  const html = `
    <div style="font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif; background: #f3fbf7; padding: 28px 16px; color: #0f2e24;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #d1fae5; border-radius: 20px; padding: 28px; box-shadow: 0 12px 30px rgba(5, 150, 105, 0.08);">
        <div style="display: inline-block; padding: 6px 14px; border-radius: 999px; background: #ecfdf5; color: #059669; font-size: 12.5px; font-weight: 700; margin-bottom: 14px;">
          LabFis • Pengajuan Peminjaman Baru
        </div>
        <h2 style="margin: 0 0 8px; font-size: 21px; color: #0f2e24;">Permintaan Peminjaman (${escapeHtml(loan.code)})</h2>
        <p style="margin: 0 0 18px; font-size: 14.5px; line-height: 1.6; color: #476359;">
          Ada pengajuan peminjaman baru yang memerlukan tinjauan dan persetujuan Admin/Super Admin.
        </p>

        <div style="background: #f8fcfa; border: 1px solid #e2f2ea; border-radius: 14px; padding: 16px 18px; font-size: 14px; line-height: 1.75;">
          <div><strong>Kode Peminjaman:</strong> ${escapeHtml(loan.code)}</div>
          <div><strong>Nama Peminjam:</strong> ${escapeHtml(loan.borrowerName)}</div>
          <div><strong>Email Peminjam:</strong> ${escapeHtml(loan.borrowerEmail)}</div>
          <div><strong>No. HP / WhatsApp:</strong> ${escapeHtml(loan.phone)}</div>
          <div><strong>Jadwal Peminjaman:</strong> ${escapeHtml(formatDateId(loan.borrowDate))} s.d. ${escapeHtml(formatDateId(loan.returnDate))}</div>
          <div><strong>Keperluan:</strong> ${escapeHtml(loan.purpose)}</div>
        </div>

        <h3 style="margin: 20px 0 6px; font-size: 15px; color: #0f2e24;">Daftar Barang yang Dipinjam</h3>
        ${itemsTable}

        <p style="margin: 20px 0 0; font-size: 12.5px; color: #6b857b;">
          Silakan buka portal LabFis bagian <strong>Kelola Peminjaman</strong> untuk menyetujui, menunda, atau menolak pengajuan ini.
        </p>
      </div>
    </div>
  `;

  return dispatchEmail({
    to: recipientEmails,
    subject: `[LabFis] Pengajuan Peminjaman Baru ${loan.code} — ${loan.borrowerName}`,
    html,
    contextLabel: `Pengajuan Peminjaman ${loan.code}`,
  });
}

/**
 * Send HTML notification back to the borrower when Admin/Super Admin updates loan status.
 */
export async function sendLoanStatusNotification(loan) {
  const statusPalette = {
    [LOAN_STATUS.APPROVED]: { bg: '#ecfdf5', border: '#a7f3d0', text: '#059669', label: 'Disetujui' },
    [LOAN_STATUS.DELAYED]: { bg: '#fffbeb', border: '#fde68a', text: '#d97706', label: 'Ditunda' },
    [LOAN_STATUS.REJECTED]: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', label: 'Ditolak' },
  };
  const badge = statusPalette[loan.status] || {
    bg: '#f3f4f6',
    border: '#d1d5db',
    text: '#374151',
    label: LOAN_STATUS_LABELS[loan.status] || loan.status,
  };

  const itemsTable = buildItemsTableHtml(loan.items || []);
  const noteBlock = loan.adminNote
    ? `<div><strong>Catatan Admin:</strong> ${escapeHtml(loan.adminNote)}</div>`
    : '<div><strong>Catatan Admin:</strong> Tidak ada catatan tambahan.</div>';

  const html = `
    <div style="font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif; background: #f3fbf7; padding: 28px 16px; color: #0f2e24;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #d1fae5; border-radius: 20px; padding: 28px; box-shadow: 0 12px 30px rgba(5, 150, 105, 0.08);">
        <div style="display: inline-block; padding: 6px 14px; border-radius: 999px; background: ${badge.bg}; border: 1px solid ${badge.border}; color: ${badge.text}; font-size: 13px; font-weight: 700; margin-bottom: 14px;">
          Status Peminjaman: ${escapeHtml(badge.label)}
        </div>
        <h2 style="margin: 0 0 8px; font-size: 21px; color: #0f2e24;">Pembaruan Pengajuan ${escapeHtml(loan.code)}</h2>
        <p style="margin: 0 0 18px; font-size: 14.5px; line-height: 1.6; color: #476359;">
          Halo <strong>${escapeHtml(loan.borrowerName)}</strong>, pengajuan peminjaman laboratorium Anda telah diproses dengan status <strong>${escapeHtml(badge.label)}</strong>.
        </p>

        <div style="background: #f8fcfa; border: 1px solid #e2f2ea; border-radius: 14px; padding: 16px 18px; font-size: 14px; line-height: 1.75;">
          <div><strong>Kode Peminjaman:</strong> ${escapeHtml(loan.code)}</div>
          <div><strong>Jadwal:</strong> ${escapeHtml(formatDateId(loan.borrowDate))} s.d. ${escapeHtml(formatDateId(loan.returnDate))}</div>
          <div><strong>Diproses Oleh:</strong> ${escapeHtml(loan.reviewedByName || '-')} (${escapeHtml(loan.reviewedByRole || 'Admin')})</div>
          ${noteBlock}
        </div>

        <h3 style="margin: 20px 0 6px; font-size: 15px; color: #0f2e24;">Rincian Barang</h3>
        ${itemsTable}
      </div>
    </div>
  `;

  return dispatchEmail({
    to: loan.borrowerEmail,
    subject: `[LabFis] Peminjaman ${loan.code} ${badge.label}`,
    html,
    contextLabel: `Update Status ${loan.code} -> ${badge.label}`,
  });
}

/**
 * Send a diagnostic SMTP verification email for testing Gmail delivery.
 */
export async function sendTestEmail(toEmail, triggeredBy) {
  const actorName = triggeredBy?.name || 'Admin LabFis';
  const actorRole = ROLE_LABELS[triggeredBy?.role] || triggeredBy?.role || 'Admin';
  const html = `
    <div style="font-family: 'Plus Jakarta Sans', 'Segoe UI', Arial, sans-serif; background: #f3fbf7; padding: 28px 16px; color: #0f2e24;">
      <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border: 1px solid #d1fae5; border-radius: 20px; padding: 28px;">
        <div style="display: inline-block; padding: 6px 14px; border-radius: 999px; background: #ecfdf5; color: #059669; font-size: 12.5px; font-weight: 700; margin-bottom: 14px;">
          LabFis • Verifikasi Gmail SMTP
        </div>
        <h2 style="margin: 0 0 10px; font-size: 20px;">Koneksi Gmail SMTP LabFis Berhasil</h2>
        <p style="margin: 0 0 16px; font-size: 14.5px; line-height: 1.6; color: #476359;">
          Email ini dikirim otomatis untuk memastikan konfigurasi Gmail SMTP pada aplikasi <strong>LabFis</strong> berjalan normal.
        </p>
        <div style="background: #f8fcfa; border: 1px solid #e2f2ea; border-radius: 14px; padding: 14px 16px; font-size: 13.5px; line-height: 1.7;">
          <div><strong>Pengirim (GMAIL_USER):</strong> ${escapeHtml(config.gmailUser)}</div>
          <div><strong>Diuji Oleh:</strong> ${escapeHtml(actorName)} (${escapeHtml(actorRole)})</div>
          <div><strong>Waktu:</strong> ${escapeHtml(formatWib(new Date().toISOString()))} WIB</div>
        </div>
      </div>
    </div>
  `;

  return dispatchEmail({
    to: toEmail,
    subject: '[LabFis] Verifikasi Pengiriman Email Gmail SMTP Berhasil',
    html,
    contextLabel: 'Tes Kirim Email SMTP',
  });
}

/**
 * Send an HTML login notification email via Gmail SMTP when configured.
 */
export async function sendLoginNotification({ to, name, provider, loginAt }) {
  const safeName = escapeHtml(name || to);
  const safeEmail = escapeHtml(to);
  const safeProvider = escapeHtml(provider === 'google' ? 'Google OAuth' : 'Email & Password');
  const formattedTime = escapeHtml(formatWib(loginAt));

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
      </div>
    </div>
  `;

  return dispatchEmail({
    to,
    subject: 'Aktivitas Masuk ke LabFis',
    html,
    contextLabel: `Login ${to}`,
  });
}
