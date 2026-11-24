# TextScope · Frontend

Dashboard analisis emosi **komentar media sosial** (TikTok, Instagram, YouTube, X, dan lainnya) berbahasa Indonesia.
Dibangun dengan **React + Vite + Tailwind CSS**, grafik memakai **Recharts**. Tampilan otomatis menyesuaikan laptop dan HP.

## Halaman

| URL | Halaman | Isi |
|---|---|---|
| `/` | Landing page | Perkenalan TextScope dan tombol "Mulai analisis" |
| `/upload` | Analisis | Tab **Unggah file** (.csv / .xlsx / .txt) dan tab **Ketik teks** (satu komentar, 3–100 kata) |
| `/hasil` | Hasil Analisis | Ringkasan otomatis, kartu angka, distribusi 6 emosi + Topic Radar, tabel per komentar, unduh Excel |
| `/sosial` | Tren & Sosial | Tren emosi per waktu, komentar paling disukai, emoji & hashtag per emosi |
| `/panduan` | Panduan | Cara pakai, format file, template, arti 6 label emosi (bisa dibuka tanpa login) |
| `/masuk` | Masuk / Daftar | Login, daftar akun baru, lupa password |
| `/riwayat` | Riwayat | Analisis file yang pernah dijalankan (bisa dibuka lagi / dihapus) dan status laporan saya |
| `/profil` | Profil | Ganti nama & password, keluar. Di HP juga berisi menu Panduan dan menu admin |
| `/admin` | Dashboard Admin | Statistik semua pengguna: jumlah pengguna, komentar diproses, analisis per hari, emosi seluruh sistem |
| `/admin/pengguna` | Kelola Pengguna | Ubah role (Admin/Pengguna), aktifkan/nonaktifkan akun |
| `/admin/laporan` | Laporan Prediksi Salah | Terima/tolak laporan, unduh laporan yang diterima sebagai data latih (`text,label`) |
| `/admin/model` | Info Model | Macro F1, perbandingan model, confusion matrix, detail teknis |

Menu **Hasil Analisis** dan **Tren & Sosial** terkunci sampai ada hasil analisis file.

## Role

| | Pengguna | Admin |
|---|---|---|
| Analisis file & ketik teks, hasil, tren, unduh Excel | ✓ | ✓ |
| Riwayat analisis milik sendiri | ✓ | ✓ |
| Laporkan "Emosinya salah?" | ✓ | ✓ |
| Dashboard Admin, Kelola Pengguna, Laporan, Info Model | – | ✓ |

Semua halaman selain Landing, Masuk, dan Panduan wajib login. Akun baru otomatis menjadi **Pengguna**.
Hak akses dijaga di tiga tempat: tampilan (frontend), database (aturan RLS di `supabase/schema.sql`),
dan backend (token diperiksa di setiap request). Cara menyiapkan Supabase ada di **`supabase/README.md`**.

## Fitur utama

- **Unggah file**: panduan format sebelum upload, unduh template (CSV/Excel/TXT), pratinjau data, pilih kolom komentar, kolom waktu & likes (opsional, terdeteksi otomatis), Privacy Shield.
- **Ketik teks**: hasil emosi, peluang 6 emosi, penjelasan "Kenapa …?" beserta arti tiap kata pemicu.
- **Hasil**: ringkasan otomatis per emosi (topik + kata kunci), donat dan Topic Radar yang saling terhubung, penanda **Perlu dicek** untuk prediksi dengan keyakinan di bawah 50%.
- **Tren & Sosial**: hanya memakai data di browser (kolom waktu/likes tidak dikirim ke backend).
- **Status server**: penanda "Server siap / Menyiapkan server…" memakai `GET /health` (berguna karena server gratis bisa "tidur").

## Menjalankan di komputer

Butuh **Node.js 20 atau lebih baru**.

```bash
npm install
cp .env.example .env     # Windows PowerShell: copy .env.example .env
npm run dev
```

Buka http://localhost:5173.

Atur `.env`:

```env
VITE_API_URL=http://localhost:8000   # alamat backend FastAPI
VITE_USE_MOCK=false                  # true = data dummy, false = backend asli
```

Mencoba di HP lewat Wi-Fi yang sama: jalankan `npm run dev -- --host`, isi `VITE_API_URL` dengan IP laptop
(misalnya `http://192.168.1.10:8000`), dan tambahkan alamat frontend ke `CORS_ORIGINS` di backend.

## Endpoint backend yang dipakai

| Endpoint | Dipakai untuk |
|---|---|
| `GET /health` | Cek status server |
| `POST /analyze` | Analisis file (multipart: `file`, `text_column`, `privacy_shield`) |
| `POST /predict` | Analisis satu komentar (JSON: `{ "text": "..." }`) |

### Respons `POST /analyze`

```json
{
  "status": "success",
  "summary": { "total_texts": 48, "dominant_emotion": "love", "avg_confidence": 0.56, "censored_count": 0 },
  "distribution": [{ "emotion": "love", "count": 12, "percentage": 25.0 }],
  "topics": {
    "love": [{ "topic": "gemes, favorit", "score": 0.42, "keywords": ["couple", "rapi"] }],
    "anger": [], "fear": [], "joy": [], "sad": [], "neutral": []
  },
  "insight": "…",
  "results": [{ "id": 1, "text": "…", "emotion": "love", "confidence": 0.91 }]
}
```

### Respons `POST /predict`

```json
{
  "label": "fear",
  "confidence": 0.82,
  "probabilities": { "anger": 0.03, "fear": 0.82, "joy": 0.04, "love": 0.02, "neutral": 0.07, "sad": 0.02 },
  "reasons": ["takut"],
  "text_anonymized": "…"
}
```

Catatan:
- Label emosi huruf kecil: `anger`, `fear`, `joy`, `love`, `sad`, `neutral`.
- Topik: idealnya 5 per emosi (minimal 3 agar radar terbentuk). Array kosong = data belum cukup.
- Error dari backend memakai format FastAPI: `{ "detail": "pesan" }`.
- Batas: maksimal **5.000 baris** per file (`MAX_ROWS`) dan **3–100 kata** per komentar (`MIN_WORDS`/`MAX_WORDS`). Samakan dengan nilai di `src/lib/readFile.js` dan `src/lib/api.js`.

## Deploy

**Vercel**: Root Directory = `frontend`, isi Environment Variables `VITE_API_URL` dan `VITE_USE_MOCK=false`.
File `vercel.json` sudah mengatur agar refresh di `/hasil` dan halaman lain tidak 404.

**Netlify** (kalau perlu untuk pemakaian komersial): Base directory = `frontend`, build command `npm run build`,
publish directory `dist`, lalu tambahkan file `public/_redirects` berisi `/* /index.html 200`.

## Struktur folder

```text
src/
├── App.jsx                      # daftar halaman (dashboard dimuat saat dibuka)
├── index.css                    # warna tema, font Nunito, efek kartu & animasi
├── context/AnalysisContext.jsx  # menyimpan hasil analisis (bertahan saat refresh)
├── components/
│   ├── DashboardLayout.jsx      # sidebar (bisa diciutkan), header & navigasi bawah HP
│   ├── TextAnalyzer.jsx         # tab Ketik teks + penjelasan kata pemicu
│   ├── TemplateBox.jsx          # panduan format file + unduh template
│   ├── SocialInsights.jsx       # tren waktu, komentar terpopuler, emoji & hashtag
│   ├── ServerStatus.jsx         # penanda status server
│   ├── Logo.jsx, Owl.jsx, ui.jsx
│   └── charts/                  # EmotionDonut, TopicRadarChart
├── lib/
│   ├── api.js                   # panggilan backend (atau data dummy)
│   ├── readFile.js              # baca .csv/.xlsx/.txt, batas ukuran & baris
│   ├── insight.js               # ringkasan otomatis per emosi
│   ├── explain.js               # penjelasan kata pemicu
│   ├── social.js                # waktu, likes, tren, emoji, hashtag
│   ├── templates.js, sampleData.js, exportExcel.js, emotions.js
│   └── useCountUp.js, useServerStatus.js
└── pages/                       # Landing, Upload, Hasil, Sosial, Panduan
```
