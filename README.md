# LabFis — Sistem Manajemen Laboratorium Fisika

Aplikasi web **LabFis** dengan halaman login **Modern Glassmorphism** (1440px desktop-first & responsif) yang mendukung autentikasi **Google OAuth 2.0**, login manual **Email & Password**, serta notifikasi login melalui **Gmail SMTP**.

## Menjalankan Aplikasi

1. Instal dependensi:
   ```bash
   npm install
   ```
2. Jalankan server:
   ```bash
   npm start
   ```
3. Buka browser dan akses:
   `http://localhost:3000`

## Konfigurasi Google OAuth 2.0

Pastikan di Google Cloud Console (**APIs & Services → Credentials → OAuth 2.0 Client IDs**) Anda telah mendaftarkan Authorized Redirect URI berikut:

- `http://localhost:3000/auth/google/callback`

Dan pada **Authorized JavaScript origins** (opsional):

- `http://localhost:3000`

Kredensial OAuth tersimpan aman di file `.env` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`).

## Konfigurasi Notifikasi Gmail SMTP

App Password Gmail sudah disiapkan pada variabel `GMAIL_APP_PASSWORD` di `.env`. Untuk mengaktifkan pengiriman email notifikasi saat login berhasil, isi alamat Gmail pengirim pada `.env`:

```env
GMAIL_USER=alamatgmailanda@gmail.com
```

Jika `GMAIL_USER` masih kosong, proses login tetap berjalan normal dan pengiriman email otomatis dilewati dengan catatan di log server.

## Akun Uji Login Manual

Untuk pengujian form email & password:

- **Kepala Laboratorium**: `admin@labfis.ac.id` / `LabFis2026!`
- **Asisten Laboratorium**: `asisten@labfis.ac.id` / `Asisten123!`
