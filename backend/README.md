# TextScope · Backend

API **FastAPI** untuk analisis emosi komentar media sosial: klasifikasi 6 emosi (model `logreg_tuned.pkl`),
topic modeling **NMF per emosi**, penjelasan kata pemicu, dan **Privacy Shield**.

## Menjalankan di komputer

Butuh **Python 3.10+** (disarankan 3.11).

```bash
python -m venv .venv
# Windows: .\.venv\Scripts\activate    |    macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Dokumentasi otomatis: http://localhost:8000/docs

Pengaturan opsional di file `.env` (lihat `.env.example`):

| Variabel | Default | Keterangan |
|---|---|---|
| `MODEL_PATH` | `models/logreg_tuned.pkl` | Lokasi model |
| `CORS_ORIGINS` | `http://localhost:5173` | Alamat frontend, pisahkan dengan koma |
| `N_TOPICS` | `5` | Jumlah topik NMF per emosi |
| `MAX_ROWS` | `5000` | Maksimal baris per file |
| `MIN_WORDS` / `MAX_WORDS` | `3` / `100` | Batas kata untuk `/predict` |
| `SUPABASE_URL` | – | Alamat project Supabase. **Wajib saat deploy**; kalau kosong login dimatikan (mode lokal) |
| `SUPABASE_ANON_KEY` | – | Publishable/anon key, dipakai untuk membaca role pengguna |
| `SUPABASE_JWT_SECRET` | – | Opsional, hanya untuk project yang masih memakai Legacy JWT secret |

## Endpoint

| Endpoint | Isi |
|---|---|
| `GET /health` | `{ "status": "ok", "auth": true }` (tanpa login) |
| `GET /me` | Akun yang sedang login menurut backend |
| `GET /admin/model-info` | **Khusus admin**: isi `models/model_info.json` + detail model aktif |
| `POST /predict` | JSON `{ "text": "..." }` → `label`, `confidence`, `probabilities`, `reasons`, `text_anonymized` |
| `POST /analyze` | multipart `file` (.csv/.xlsx), `text_column`, `privacy_shield` → `summary`, `distribution`, `topics`, `insight`, `results` |

Semua endpoint kecuali `/health` wajib membawa header `Authorization: Bearer <token Supabase>`.
Tanpa token → 401, akun nonaktif → 403, endpoint admin dibuka Pengguna → 403.
Skor model untuk halaman Info Model diambil dari `models/model_info.json`; perbarui file itu setiap ganti model.

Format lengkap ada di `frontend/README.md`.

## Alur pemrosesan

1. **Privacy Shield**: sensor URL, email, @username, NIK, nomor HP, NIM (`services/anonymizer.py`).
2. **Emoji → kata**: 😭 → "nangis", 😡 → "marah", 😂 → "ngakak", dan seterusnya (`services/emoji_map.py`).
3. **Normalisasi**: `normalisasi_teks()` dari `src/baseline.py` (sama dengan saat model dilatih).
4. **Prediksi**: `logreg_tuned.pkl` + probabilitas 6 emosi (`services/predictor.py`).
5. **Kata pemicu**: kontribusi TF-IDF × koefisien LogReg (`services/explainer.py`).
6. **Topik**: NMF terpisah untuk tiap emosi, dengan stopword kata gaul media sosial (`services/topic_model.py`).

### Catatan konversi emoji
Pada 48 komentar contoh buatan tim frontend, akurasi naik dari 64,6% menjadi 77,1%. Sampel ini kecil dan dibuat sendiri,
jadi **perlu dicek di data uji resmi**:

```bash
python scripts/evaluasi_emoji.py ../data/processed/test.csv
```

Kalau Macro F1 di data uji turun, hapus baris `emoji_ke_kata` di `services/preprocessor.py`.

## Deploy ke Render

1. **New → Web Service**, pilih repo, **Root Directory** = `backend`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Environment: `CORS_ORIGINS=https://<alamat-frontend>`, `SUPABASE_URL`, `SUPABASE_ANON_KEY` (versi Python mengikuti file `.python-version`).

Paket gratis Render "tidur" setelah 15 menit tidak dipakai. Dashboard sudah menampilkan status
"Menyiapkan server…" selama server bangun.
