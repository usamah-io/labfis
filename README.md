# LabFis — Sistem Manajemen Laboratorium Fisika

Aplikasi web **LabFis** bergaya **Modern Glassmorphism** (1440px desktop-first & responsif) dengan sistem peran bertingkat (**Super Admin**, **Admin**, **User**), akses **Publik vs Wajib Login**, **Google OAuth 2.0**, dan notifikasi **Gmail SMTP**.

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

## Hak Akses & Role

| Role | Hak Akses |
| --- | --- |
| **Publik (Tanpa Login)** | Melihat Dashboard, Inventaris Alat, dan Daftar Bahan. Klik **Pinjam Barang** otomatis diarahkan ke `/login` lalu kembali ke formulir peminjaman. |
| **User** (default pendaftar/Google baru) | Melihat data inventaris, mengajukan peminjaman (`/pinjam`), dan memantau riwayat peminjaman sendiri. |
| **Admin** | Mengelola inventaris alat & bahan (tambah, edit, hapus) serta memproses peminjaman (**Setujui**, **Tunda**, **Tolak**). Tidak dapat mengelola akun Admin/Super Admin. |
| **Super Admin** (`rafikawahyuni15@gmail.com`) | Seluruh hak akses Admin ditambah halaman **Manajemen Pengguna** (tambah user/admin, ubah role, hapus user/admin). |

## Konfigurasi Google OAuth 2.0

Pastikan di Google Cloud Console (**APIs & Services → Credentials → OAuth 2.0 Client IDs**) Anda telah mendaftarkan Authorized Redirect URI berikut:

- `http://localhost:3000/auth/callback/google`
- `https://labfis.vercel.app/auth/callback/google` (untuk produksi)

Saat `rafikawahyuni15@gmail.com` pertama kali login via Google OAuth, role otomatis ditetapkan sebagai **Super Admin**. Akun Google lainnya otomatis mendapat role **User** (atau mengikuti role yang sudah ditetapkan oleh Super Admin).

## Konfigurasi Gmail SMTP (`GMAIL_USER`)

Pada file `.env`:
- `GMAIL_USER`: isi dengan **alamat email Gmail pengirim** yang membuat App Password (contoh: `rafikawahyuni15@gmail.com`).
- `GMAIL_APP_PASSWORD`: App Password 16 digit dari Google Account Security.

Setelah mengisi `GMAIL_USER`, restart server agar notifikasi email pengajuan peminjaman (ke Super Admin & Admin) serta notifikasi status **Disetujui / Ditunda / Ditolak** (ke email peminjam) aktif terkirim. Tersedia juga tombol **Tes Kirim Email SMTP** pada halaman **Kelola Peminjaman**.

## Akun Uji Default (Login Manual)

- **Super Admin**: `rafikawahyuni15@gmail.com` / `SuperAdmin2026!`
- **Admin**: `admin@labfis.ac.id` / `LabFis2026!`
- **User**: `user@labfis.ac.id` / `UserLabFis2026!`
