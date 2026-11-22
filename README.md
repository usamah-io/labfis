# LabFis — Sistem Manajemen Laboratorium Fisika

Aplikasi web **LabFis** bergaya **True Acrylic Glassmorphism** (1440px desktop-first & responsif mobile) dengan sistem peran bertingkat (**Super Admin**, **Admin**, **User**), akses **Publik vs Wajib Login**, **Google OAuth 2.0**, notifikasi **Gmail SMTP**, **Panel Admin Kelola Alat**, dan **PWA**.

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

## Penyimpanan Data Terpusat (`data/`)

- `data/equipment.json`: menyimpan katalog alat dan bahan laboratorium secara terpusat (dapat diedit langsung oleh Admin / Super Admin melalui Panel Admin, dan siap dimigrasi ke database cloud untuk deploy Vercel).
- `data/db.json`: menyimpan akun pengguna dan transaksi peminjaman.

## Hak Akses & Role

| Role | Hak Akses |
| --- | --- |
| **Publik (Tanpa Login)** | Melihat Dashboard, Inventaris Alat, dan Daftar Bahan. Klik **Pinjam Barang** otomatis diarahkan ke `/login` lalu kembali ke formulir peminjaman. |
| **User** (default login Google baru) | Melihat data inventaris, mengajukan peminjaman (`/pinjam`), memantau riwayat peminjaman, dan membuka halaman `/profil`. |
| **Admin** | Mengelola inventaris alat & bahan melalui **Panel Admin (Kelola Alat / Edit Data)** serta memproses peminjaman (**Setujui**, **Tunda**, **Tolak**). |
| **Super Admin** (`rafikawahyuni15@gmail.com`) | Seluruh hak akses Admin ditambah halaman **Manajemen Pengguna** (tambah Admin/User, ubah role, hapus akun). |

## Konfigurasi Google OAuth 2.0

Pastikan di Google Cloud Console (**APIs & Services → Credentials → OAuth 2.0 Client IDs**) Anda telah mendaftarkan Authorized Redirect URI berikut:

- `http://localhost:3000/auth/callback/google`
- `https://labfis.vercel.app/auth/callback/google` (untuk produksi)

## Konfigurasi Gmail SMTP (`GMAIL_USER`)

Pada file `.env`:
- `GMAIL_USER`: isi dengan **alamat email Gmail pengirim** yang membuat App Password (contoh: `rafikawahyuni15@gmail.com`).
- `GMAIL_APP_PASSWORD`: App Password 16 digit dari Google Account Security.

## Akun Super Admin Utama

- **Super Admin**: `rafikawahyuni15@gmail.com` / `SuperAdmin2026!` (juga otomatis ditetapkan sebagai **Super Admin** saat login menggunakan **Masuk dengan Google**).
- Akun Admin maupun User tambahan dibuat oleh Super Admin melalui menu **Admin → Manajemen Pengguna** atau saat pengguna login menggunakan **Google**.
