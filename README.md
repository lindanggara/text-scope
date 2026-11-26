# TextScope

**TextScope** adalah sistem klasifikasi emosi teks berbahasa Indonesia berbasis **Natural Language Processing (NLP), Machine Learning, dan Deep Learning**. Proyek ini dikembangkan sebagai bagian dari mata kuliah **Project Sistem Cerdas** pada Program Studi Sarjana Terapan Sains Data Terapan, Politeknik Elektronika Negeri Surabaya (PENS).

TextScope mengolah teks media sosial yang tidak terstruktur menjadi informasi emosional yang terukur melalui klasifikasi enam kategori emosi. Selain pengembangan dan evaluasi model, proyek ini dilengkapi aplikasi web interaktif untuk melakukan prediksi, menganalisis pola emosi, memantau tren sosial, serta mengelola model secara dinamis.

## Tim Pengembang

| NRP | Nama |
|---|---|
| `3324600008` | Linda Anggara Wati |
| `3324600009` | Siti Cholilah Mi'Rodtul Rohma |
| `3324600020` | Yuhanidz Habibah |
| `3324600028` | Intan Azzuhra Permadani |

## Tujuan Proyek

1. Mengembangkan sistem klasifikasi emosi teks berbahasa Indonesia menggunakan pendekatan machine learning dan transformer.
2. Membandingkan performa berbagai model berdasarkan metrik evaluasi yang relevan.
3. Menguji kemampuan generalisasi model menggunakan dataset lintas domain EmoT.
4. Mengimplementasikan aplikasi web untuk prediksi dan visualisasi hasil analisis emosi.
5. Menerapkan pengelolaan data yang memperhatikan privasi dan keamanan informasi pengguna.

## Fitur Utama

### 1. Klasifikasi Emosi

Mengklasifikasikan teks berbahasa Indonesia ke dalam enam kategori emosi:

- `anger`
- `fear`
- `joy`
- `love`
- `sad`
- `neutral`

Prediksi tersedia melalui dua metode:
- **Single Prediction:** Menganalisis teks secara langsung (real-time).
- **Batch Prediction:** Memproses data secara massal melalui file CSV atau XLSX hingga 5.000 baris.

### 2. Privacy Shield

Fitur anonimisasi otomatis untuk membantu melindungi informasi sensitif sebelum teks diproses atau disimpan dalam riwayat analisis. Informasi yang ditangani mencakup username, nomor telepon, alamat email, dan identitas mahasiswa.

### 3. Topic Radar

Mengekstraksi dan menampilkan kata kunci dominan berdasarkan kelompok emosi untuk membantu memahami topik yang berkaitan dengan respons emosional pengguna.

### 4. Tren dan Analisis Sosial

Menyajikan visualisasi perubahan emosi berdasarkan waktu unggahan dan tingkat interaksi, seperti jumlah likes, untuk mengidentifikasi pola serta dinamika percakapan.

### 5. Manajemen Model Adaptif

Menggunakan sistem model registry melalui `registry.json` untuk mengelola model klasifikasi yang tersedia. Administrator dapat memilih model aktif secara dinamis, meliputi:

- Logistic Regression Tuned
- SVM Tuned
- Naive Bayes
- IndoBERT
- IndoBERTweet

### 6. Human-in-the-Loop

Pengguna dapat melaporkan hasil prediksi yang dianggap kurang tepat. Administrator dapat meninjau laporan dan mengekspor laporan yang disetujui sebagai data tambahan untuk pengembangan model.

### 7. Autentikasi dan Manajemen Pengguna

Menyediakan autentikasi berbasis peran melalui Supabase dengan dua jenis pengguna:

- **Admin:** Mengelola pengguna, laporan prediksi salah, informasi model, dan pemilihan model aktif.
- **Pengguna:** Mengakses fitur prediksi dan analisis sesuai hak akses.

### 8. Ekspor Hasil Analisis

Mendukung ekspor hasil prediksi dan analisis ke format Excel (`.xlsx`) untuk memudahkan dokumentasi dan pengolahan lebih lanjut.

## Dataset

TextScope menggunakan dataset yang dipisahkan berdasarkan tujuan pengembangan dan evaluasinya.

### 1. Dataset Utama Klasifikasi Emosi

Dataset *Emotion Dataset from Indonesian Public Opinion* digunakan sebagai dataset utama untuk pelatihan dan evaluasi model.

Dataset terdiri atas enam kategori emosi, yaitu `anger`, `fear`, `joy`, `love`, `sad`, dan `neutral`.

Tahapan persiapan dataset mencakup penggabungan enam berkas kategori emosi, pembersihan teks duplikat, serta penanganan konflik label.

Pembagian dataset yang digunakan:

| Subset | Jumlah Data |
|---|---:|
| Training | 4.921 |
| Validation | 1.055 |
| Testing | 1.055 |
| **Total** | **7.031** |

### 2. Dataset Evaluasi Lintas Domain (EmoT)

Dataset EmoT dari IndoNLU digunakan untuk menguji kemampuan generalisasi model terhadap sumber teks yang berbeda.

Evaluasi menggunakan lima kategori emosi:

- `anger`
- `fear`
- `joy`
- `love`
- `sad`

Kategori `neutral` tidak disertakan dalam pemetaan label EmoT. Oleh karena itu, evaluasi lintas domain dilakukan dengan memperhatikan kesesuaian kategori emosi.

### 3. Data Demonstrasi

Data komentar dan unggahan media sosial digunakan untuk mendemonstrasikan penerapan model pada teks nyata.

Data demonstrasi tidak digabungkan dengan dataset pelatihan maupun pengujian resmi. Hasil prediksi tanpa label acuan hanya digunakan untuk ilustrasi penerapan sistem dan bukan sebagai dasar penghitungan metrik evaluasi.

## Metodologi dan Evaluasi

Pengembangan model dilakukan melalui dua pendekatan utama.

### 1. Machine Learning Klasik

Model klasik dikembangkan menggunakan representasi teks TF-IDF dan beberapa konfigurasi preprocessing serta optimasi hyperparameter.

Model yang dievaluasi meliputi:
- Logistic Regression
- Support Vector Machine (SVM)
- Naive Bayes

### 2. Deep Learning dan Transformer

Pengembangan model transformer dilakukan melalui fine-tuning model pretrained:

- **IndoBERT:** `indobenchmark/indobert-base-p1`
- **IndoBERTweet:** `indolem/indobertweet-base-uncased`

Kedua model dievaluasi pada dataset utama dan dataset EmoT untuk membandingkan performa klasifikasi serta kemampuan generalisasi lintas domain.

### Metrik Evaluasi

Evaluasi performa menggunakan beberapa metrik berikut:

- **Macro F1-score:** Metrik utama untuk mengukur keseimbangan performa pada seluruh kategori emosi.
- **Precision:** Mengukur ketepatan hasil prediksi setiap kategori.
- **Recall:** Mengukur kemampuan model dalam mengenali seluruh data pada setiap kategori.
- **Confusion Matrix:** Mengidentifikasi pola kesalahan klasifikasi antar kategori emosi.

## Hasil Eksperimen Final

### 1. Perbandingan Performa Model

Berikut merupakan rekap hasil eksperimen berdasarkan Macro F1-score pada dataset utama dan evaluasi lintas domain EmoT.

| Peringkat | Model | Macro F1 Valid | Macro F1 Test | Macro F1 EmoT |
|:---:|---|---:|---:|---:|
| **1** | **IndoBERTweet** | **0.8024** | **0.7979** | **0.5094** |
| 2 | IndoBERT | 0.7728 | 0.7707 | 0.4166 |
| 3 | Logistic Regression Tuned | 0.7312 | 0.7286 | 0.4142 |
| 4 | SVM Tuned | 0.7265 | 0.7251 | — |
| 5 | Logistic Regression + Normalisasi + Class Weighting | 0.7247 | 0.7155 | — |
| 6 | Naive Bayes (Complement NB) | 0.6631 | 0.6719 | — |

*Catatan: Tanda — menunjukkan hasil evaluasi lintas domain yang tidak dicantumkan dalam rekap eksperimen.*

### 2. Analisis Hasil

Berdasarkan hasil eksperimen, **IndoBERTweet memperoleh performa terbaik** pada dataset utama dengan Macro F1-score sebesar 0.7979 dan menunjukkan performa terbaik pada evaluasi lintas domain EmoT dengan skor 0.5094.

IndoBERT menempati posisi berikutnya dengan Macro F1-score sebesar 0.7707 pada dataset utama dan 0.4166 pada EmoT.

Sementara itu, Logistic Regression Tuned menjadi model terbaik dari kelompok machine learning klasik dengan Macro F1-score sebesar 0.7286 pada dataset utama.

Hasil tersebut menunjukkan bahwa model transformer, khususnya IndoBERTweet, memiliki performa lebih baik dibandingkan model klasik pada konfigurasi eksperimen yang diuji.

Dokumentasi metrik per kelas, confusion matrix, dan analisis eksperimen lebih lanjut tersedia pada [`reports/results/eksperimen4.md`](reports/results/eksperimen4.md).

## Arsitektur Aplikasi

TextScope menggunakan arsitektur full-stack yang memisahkan layanan backend, frontend, dan pengelolaan data.

| Komponen | Teknologi | Fungsi |
|---|---|---|
| Backend | Python, FastAPI | REST API, layanan prediksi, preprocessing, dan model registry |
| Frontend | React, Vite | Antarmuka dan interaksi pengguna |
| Styling | Tailwind CSS | Desain dan tata letak aplikasi |
| Database & Authentication | Supabase | Autentikasi dan penyimpanan data aplikasi |
| Machine Learning | Scikit-learn | Implementasi model klasik |
| Deep Learning | Transformers, PyTorch | Fine-tuning dan inferensi model transformer |
| Model Management | JSON Registry | Pengelolaan model dan pemilihan model aktif |

Alur umum aplikasi:

1. Pengguna mengirimkan teks atau mengunggah file melalui frontend.
2. Backend menerima permintaan melalui REST API.
3. Privacy Shield menangani anonimisasi informasi sensitif.
4. Sistem mengambil model aktif berdasarkan konfigurasi model registry.
5. Model melakukan prediksi kategori emosi.
6. Hasil prediksi dikembalikan kepada frontend untuk ditampilkan dan dianalisis.
7. Data aplikasi dikelola melalui integrasi Supabase sesuai hak akses pengguna.

## Struktur Repositori

```text
text-scope/
├── README.md
├── requirements.txt
├── .gitignore
│
├── data/
│   └── README.md
│
├── backend/
│   ├── main.py
│   ├── models/
│   │   └── registry.json
│   ├── scripts/
│   └── services/
│       └── predictor.py
│
├── frontend/
│   ├── package.json
│   └── src/
│       ├── lib/
│       └── pages/
│           └── admin/
│
├── src/
│   ├── download_data.py
│   ├── train_indobert.py
│   ├── train_indobertweet.py
│   ├── evaluate.py
│   ├── evaluasi_indobert_cross_domain.py
│   └── evaluasi_indobertweet_cross_domain.py
│
├── models/
│   ├── README.md
│   └── rekap_hasil.csv
│
├── reports/
│   ├── figures/
│   └── results/
│       ├── eksperimen.md
│       ├── eksperimen2.md
│       ├── eksperimen3.md
│       └── eksperimen4.md
│
├── supabase/
│
└── docs/
    ├── panduan/
    │   └── PANDUAN_TIM.md
    └── laporan/
        ├── 01_data_eda.md
        └── 02_model_klasik.md
```

*Catatan: Struktur di atas merupakan gambaran direktori utama berdasarkan struktur pengembangan yang didokumentasikan. Direktori internal dapat memiliki berkas tambahan sesuai implementasi.*

## Persiapan Lingkungan

TextScope menggunakan Python 3.10 atau 3.11 dengan dependensi yang tercantum dalam `requirements.txt`.

### 1. Clone Repository

```powershell
git clone https://github.com/lindanggara/text-scope.git
cd text-scope
```

### 2. Menyiapkan Virtual Environment

Jalankan perintah berikut melalui PowerShell:

```powershell
py -m venv .venv

.\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Menyiapkan Dataset

Jalankan script pengunduhan dataset dari direktori utama:

```powershell
python .\src\download_data.py
```

Script digunakan untuk mengunduh dan menyiapkan dataset utama serta dataset EmoT sesuai konfigurasi pengolahan data.

Data disimpan secara lokal dan tidak disertakan dalam repositori GitHub.

### 4. Konfigurasi Supabase

Siapkan proyek Supabase dan sesuaikan konfigurasi koneksi dengan environment variables yang digunakan oleh backend dan frontend.

Pastikan kredensial dan API key disimpan dalam file environment lokal, bukan diunggah ke repositori publik.

## Menjalankan Aplikasi Web

TextScope terdiri atas backend FastAPI dan frontend React yang dijalankan melalui dua terminal terpisah.

### 1. Menjalankan Backend

Buka terminal PowerShell:

```powershell
cd text-scope

.\.venv\Scripts\Activate.ps1

cd backend

python -m uvicorn main:app --reload --port 8000
```

Backend API berjalan pada:

```text
http://localhost:8000
```

### 2. Menjalankan Frontend

Buka terminal PowerShell baru:

```powershell
cd text-scope\frontend

npm install

npm run dev
```

Frontend dapat diakses melalui:

```text
http://localhost:5173
```

Pastikan konfigurasi koneksi frontend ke backend dan Supabase telah disesuaikan sebelum menggunakan aplikasi.

## Menjalankan Eksperimen

Script eksperimen tersedia pada direktori `src/`.

| Script | Keterangan |
|---|---|
| `download_data.py` | Mengunduh dan menyiapkan dataset |
| `train_indobert.py` | Pelatihan dan fine-tuning IndoBERT |
| `train_indobertweet.py` | Pelatihan dan fine-tuning IndoBERTweet |
| `evaluate.py` | Evaluasi model pada dataset utama |
| `evaluasi_indobert_cross_domain.py` | Evaluasi lintas domain IndoBERT menggunakan EmoT |
| `evaluasi_indobertweet_cross_domain.py` | Evaluasi lintas domain IndoBERTweet menggunakan EmoT |

Parameter dan konfigurasi eksperimen mengikuti implementasi pada masing-masing script. Hasil eksperimen didokumentasikan pada direktori `reports/results/`.

## Tata Kelola Data dan Privasi

Pengelolaan data dalam TextScope memperhatikan prinsip berikut:

- Memastikan penggunaan dataset sesuai ketentuan sumber, lisensi, dan izin yang berlaku.
- Tidak mengunggah API key, cookie, kredensial, maupun informasi sensitif ke GitHub.
- Melakukan anonimisasi terhadap informasi identitas pada data demonstrasi.
- Memisahkan data demonstrasi dari dataset pelatihan dan evaluasi resmi.
- Menghindari publikasi teks asli yang dapat mengidentifikasi pemilik akun tanpa dasar penggunaan yang sesuai.
- Memeriksa ketentuan lisensi sebelum menggunakan atau mendistribusikan ulang dataset.

## Dokumentasi Terkait

| Dokumen | Deskripsi |
|---|---|
| [Rekap Eksperimen Lengkap](reports/results/eksperimen4.md) | Hasil eksperimen model klasik, transformer, dan evaluasi lintas domain EmoT. |
| [Rekap Eksperimen Sebelumnya](reports/results/eksperimen.md) | Dokumentasi tahapan eksperimen sebelumnya. |
| [Rekap CSV Model](models/rekap_hasil.csv) | Ringkasan hasil evaluasi model. |
| [Panduan Tim](docs/panduan/PANDUAN_TIM.md) | Panduan kolaborasi dan alur kerja pengembangan proyek. |
| [Dokumentasi Dataset](data/README.md) | Informasi sumber, pembagian, dan pengelolaan dataset. |
| [Laporan EDA](docs/laporan/01_data_eda.md) | Eksplorasi dan analisis karakteristik dataset. |
| [Laporan Model Klasik](docs/laporan/02_model_klasik.md) | Metodologi dan hasil eksperimen machine learning klasik. |

## Kontribusi Tim

Pengembangan TextScope dilakukan secara kolaboratif dengan memperhatikan konsistensi kode dan dokumentasi.

Ketentuan kolaborasi meliputi:

1. Menggunakan branch terpisah untuk setiap pengembangan fitur.
2. Menuliskan pesan commit yang jelas dan deskriptif.
3. Melakukan pengujian sebelum menggabungkan perubahan.
4. Tidak mengunggah dataset lokal, artefak model berukuran besar, atau kredensial.
5. Memperbarui dokumentasi apabila terdapat perubahan pada struktur, metodologi, maupun implementasi aplikasi.

## Status Pengembangan

Tahapan utama pengembangan TextScope telah mencakup:

- [x] Pengumpulan dan persiapan dataset utama.
- [x] Pembersihan dan preprocessing teks.
- [x] Eksplorasi data (EDA).
- [x] Pengembangan dan evaluasi model machine learning klasik.
- [x] Fine-tuning dan evaluasi IndoBERT.
- [x] Fine-tuning dan evaluasi IndoBERTweet.
- [x] Evaluasi lintas domain menggunakan EmoT.
- [x] Implementasi backend menggunakan FastAPI.
- [x] Implementasi frontend menggunakan React dan Vite.
- [x] Integrasi Supabase untuk autentikasi dan pengelolaan data.
- [x] Implementasi manajemen model dinamis.
- [x] Implementasi fitur analisis dan visualisasi aplikasi.

**Model dengan performa terbaik:** IndoBERTweet, dengan Macro F1-score sebesar **0.7979 pada dataset utama** dan **0.5094 pada evaluasi lintas domain EmoT**.

---

**TextScope — Indonesian Emotion Classification and Analysis System**

Developed as part of the Project Sistem Cerdas course, Applied Data Science Program, Electronic Engineering Polytechnic Institute of Surabaya (PENS).

## Continuous Retraining (Human-in-the-Loop)

TextScope menyediakan pipeline retraining melalui `src/retrain_pipeline.py`.
Admin dapat mengekspor koreksi prediksi dalam format CSV dengan kolom `text`
dan `label`, kemudian menggunakan data tersebut untuk melatih ulang model.

Contoh penggunaan:

```powershell
python src/retrain_pipeline.py --feedback data_latih_tambahan_2026-11-25.csv --model logreg_tuned
```

Untuk model Transformer:

```powershell
python src/retrain_pipeline.py --feedback data_latih_tambahan_2026-11-25.csv --model indobertweet --epochs 1
```

Simulasi tanpa menerapkan perubahan:

```powershell
python src/retrain_pipeline.py --feedback data_latih_tambahan_2026-11-25.csv --model logreg_tuned --dry-run
```

Pipeline memvalidasi data, melakukan deduplikasi, melatih model, dan mengevaluasi
Macro F1. Safe Deployment Gate hanya mengizinkan promosi apabila skor Macro F1
Test baru tidak lebih rendah daripada skor model sebelumnya. Hasil retraining
dicatat pada `reports/results/retrain_log.csv`.
