import { createClient } from '@supabase/supabase-js'

// Isi di frontend/.env (lokal) atau Environment Variables di Vercel/Netlify:
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=publishable / anon key (BUKAN service_role key)
const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const key = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const SUPABASE_READY = Boolean(url && key)

export const supabase = SUPABASE_READY
  ? createClient(url, key, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null

// Ubah pesan error Supabase (bahasa Inggris) menjadi kalimat yang mudah dipahami.
export function pesanError(error, fallback = 'Terjadi kesalahan. Coba lagi.') {
  if (!error) return fallback
  const msg = String(error.message ?? error)
  const map = [
    [/invalid login credentials/i, 'Email atau password salah.'],
    [/email not confirmed/i, 'Email belum dikonfirmasi. Cek kotak masuk email kamu.'],
    [/user already registered|already been registered/i, 'Email ini sudah terdaftar. Silakan masuk.'],
    [/password should be at least/i, 'Password minimal 8 karakter.'],
    [/weak.?password|password is known to be weak/i, 'Password terlalu mudah ditebak. Pakai kombinasi lain.'],
    [/rate limit|too many requests|security purposes/i, 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.'],
    [/unable to validate email|invalid.*email/i, 'Format email tidak valid.'],
    [/new password should be different/i, 'Password baru harus berbeda dari password lama.'],
    [/row-level security|permission denied|42501/i, 'Kamu tidak punya izin untuk tindakan ini.'],
    [/minimal harus ada satu admin aktif/i, 'Minimal harus ada satu admin aktif.'],
    [/hanya admin/i, 'Fitur ini khusus admin.'],
    [/failed to fetch|network/i, 'Tidak bisa terhubung ke server login. Cek koneksi internet.'],
  ]
  for (const [re, text] of map) if (re.test(msg)) return text
  return fallback
}
