# Menyiapkan login & role (Supabase)

TextScope memakai **Supabase** untuk login, menyimpan riwayat analisis, laporan prediksi salah,
dan role (**Admin** / **Pengguna**). Paket gratis Supabase sudah cukup.

## 1. Buat project
1. Daftar di https://supabase.com → **New project** (region terdekat: Singapore).
2. Simpan password database di tempat aman.

## 2. Buat tabel
1. Buka **SQL Editor → New query**.
2. Tempel seluruh isi `supabase/schema.sql`, lalu **Run**. (Aman dijalankan ulang.)

Isinya: tabel `profiles`, `analyses`, `reports`, aturan akses (RLS), dan fungsi `admin_stats`, `admin_list_users`.

## 3. Atur login email
**Authentication → Sign In / Providers → Email**: pastikan aktif.
- *Confirm email* **aktif** (disarankan): pengguna baru harus klik link di email sebelum bisa masuk.
- **Authentication → URL Configuration**:
  - *Site URL* = alamat frontend (mis. `https://textscope.vercel.app`)
  - *Redirect URLs* tambahkan: `http://localhost:5173/**` dan `https://textscope.vercel.app/**`

> Email bawaan Supabase dibatasi beberapa email per jam. Untuk banyak pengguna, sambungkan SMTP sendiri
> di **Authentication → Emails → SMTP Settings**.

## 4. Isi environment variable
Ambil dari **Project Settings → API** (atau **API Keys**):

| Tempat | Variabel | Isi |
|---|---|---|
| `frontend/.env` dan Vercel/Netlify | `VITE_SUPABASE_URL` | Project URL |
| | `VITE_SUPABASE_ANON_KEY` | publishable / anon key |
| `backend/.env` dan Render | `SUPABASE_URL` | Project URL |
| | `SUPABASE_ANON_KEY` | publishable / anon key |
| | `SUPABASE_JWT_SECRET` | *kosongkan*, kecuali project masih memakai "Legacy JWT secret" |

**Jangan** pernah memakai `service_role` / secret key di frontend.

## 5. Jadikan akun pertama sebagai admin
1. Jalankan dashboard, buka **Masuk → Daftar**, buat akunmu.
2. Di **SQL Editor** jalankan (ganti emailnya):
   ```sql
   update public.profiles set role = 'admin' where email = 'email-kamu@contoh.com';
   ```
3. Muat ulang dashboard. Menu **Admin** muncul di sidebar (di HP: menu **Akun**).

Setelah itu admin lain cukup diatur dari **Kelola Pengguna**. Sistem menolak menurunkan atau menonaktifkan admin terakhir.

## Siapa boleh apa (dijaga database, bukan hanya tampilan)

| Data | Pengguna | Admin |
|---|---|---|
| Profil | lihat & ubah nama sendiri (role tidak bisa diubah sendiri) | lihat semua, ubah role/status |
| Riwayat analisis | lihat, simpan, hapus milik sendiri | lihat semua (untuk statistik) |
| Laporan prediksi salah | kirim & lihat milik sendiri | lihat semua, terima/tolak |
| Statistik & daftar pengguna | – | ✓ |

Akun yang dinonaktifkan tidak bisa menyimpan data baru dan ditolak backend.

## Catatan privasi
Riwayat menyimpan hasil analisis lengkap, termasuk teks komentar. Kalau **Privacy Shield** aktif,
yang tersimpan adalah teks yang sudah disensor. Pengguna bisa menghapus riwayatnya sendiri kapan saja.
