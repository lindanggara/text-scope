# **Tabel Eksperimen TextScope**

Catatan semua percobaan model. **Jangan hapus baris lama**, tambahkan baris baru setiap kali ada percobaan.

## **1. Eksperimen Model Klasik**

| Tanggal | Model | PJ | Data | Perubahan | Macro F1 (valid) | Macro F1 (test) | Catatan |
|---|---|---|---|---|---:|---:|---|
| 28 Okt 2026 | LogReg | Linda | train v1 | Baseline (TF-IDF) | 0.7176 | 0.7108 | Baseline awal |
| 28 Okt 2026 | SVM | Linda | train v1 | Baseline (TF-IDF) | 0.7231 | 0.6997 | — |
| 28 Okt 2026 | Naive Bayes | Linda | train v1 | Baseline (TF-IDF) | 0.5456 | 0.5628 | — |
| 3 Nov 2026 | LogReg | Linda | train v1 | + Normalisasi kata gaul + Class Weighting | 0.7247 | 0.7155 | 🥇 Eksperimen 1 |
| 3 Nov 2026 | SVM | Linda | train v1 | + Normalisasi kata gaul + Class Weighting | 0.7251 | 0.7075 | — |
| 3 Nov 2026 | Naive Bayes | Linda | train v1 | + Normalisasi kata gaul + Class Weighting | 0.5580 | 0.5586 | — |
| 3 Nov 2026 | LogReg Tuned | Linda | train v1 | + Fitur Char TF-IDF + GridSearch (C=1.0) | 0.7312 | **0.7286** | 🏆 Model klasik terbaik keseluruhan |
| 3 Nov 2026 | SVM Tuned | Linda | train v1 | + Fitur Char TF-IDF + GridSearch (C=0.1) | 0.7265 | 0.7251 | — |

## **2. Eksperimen Model Transformer (Chila)**

| Tanggal | Model | PJ | Data | Perubahan | Macro F1 (valid) | Macro F1 (test) | Catatan |
|---|---|---|---|---|---:|---:|---|
| 17 Nov 2026 | IndoBERT | Chila | train v1 (70/15/15) | Fine-tuning `indobenchmark/indobert-base-p1`, MAX_LENGTH=128, BATCH_SIZE=4, EPOCHS=1, LR=2e-5 | 0.7728 | 0.7707 | Training CPU selama 87 menit 24 detik |
| 19 Nov 2026 | IndoBERTweet | Chila | train v1 (70/15/15) | Fine-tuning `indolem/indobertweet-base-uncased`, MAX_LENGTH=128, BATCH_SIZE=4, EPOCHS=1, LR=2e-5 | **0.7999** | **0.7889** | 🏆 Model Transformer terbaik pada dataset utama; training CPU selama 62 menit 26 detik |

## **3. Evaluasi Lintas Domain EmoT (Model Klasik & Transformer)**

| Tanggal | Model | PJ | Macro F1 (EmoT) | Akurasi | Prediksi Neutral | Catatan |
|---|---|---|---:|---:|---:|---|
| 3 Nov 2026 | LogReg Tuned | Linda | 0.4142 | — | — | Mengalami penurunan performa dibandingkan pengujian data utama |
| 19 Nov 2026 | IndoBERT | Chila | 0.4166 | 0.2991 | 58,40% | Sedikit lebih tinggi dari LogReg Tuned |
| 25 Nov 2026 | IndoBERTweet | Chila | **0.5094** | **0.3708** | 54,84% | 🏆 Model dengan performa lintas domain terbaik sejauh ini |

**Analisis Singkat (EmoT):**

Model klasik terbaik, yaitu LogReg Tuned, memperoleh Macro F1 sebesar 0.4142 pada dataset EmoT, turun dari 0.7286 pada dataset utama.

IndoBERT memperoleh Macro F1 sebesar 0.4166 dengan akurasi 0.2991. Hasil tersebut hanya berbeda 0.0024 dari LogReg Tuned.

Sementara itu, IndoBERTweet memperoleh Macro F1 sebesar **0.5094** dan akurasi sebesar **0.3708**. Nilai Macro F1 tersebut lebih tinggi 0.0928 dibandingkan IndoBERT dan 0.0952 dibandingkan LogReg Tuned.

Hasil ini menunjukkan bahwa IndoBERTweet memiliki kemampuan generalisasi lintas domain yang lebih baik dibandingkan IndoBERT dan model klasik terbaik dalam eksperimen yang telah dilakukan.

Namun, kedua model Transformer masih menunjukkan kecenderungan menghasilkan prediksi `neutral`, padahal dataset EmoT hanya memiliki lima kelas emosi tanpa kelas `neutral`. IndoBERT menghasilkan prediksi neutral sebanyak 58,40%, sedangkan IndoBERTweet sebesar 54,84%.

Dengan demikian, IndoBERTweet menjadi model dengan performa terbaik pada evaluasi lintas domain EmoT sejauh ini, meskipun masih terdapat tantangan dalam mengenali emosi pada domain yang berbeda.

## **4. Analisis Hasil IndoBERT**

IndoBERT berhasil memperoleh Macro F1 sebesar **0.7728 pada validation** dan **0.7707 pada test**. Selisih keduanya hanya 0.0021, sehingga performa model relatif konsisten antara data validation dan test.

Beberapa hasil penting dari eksperimen:

- Training loss: 0.9197.
- Akurasi validation: 0.7649.
- Akurasi test: 0.7659.
- Waktu training: 5.244,39 detik atau sekitar 87 menit 24 detik.
- Epoch terbaik: 1.
- Perangkat training: CPU.

IndoBERT memperoleh Macro F1 test sebesar 0.7707, lebih tinggi dibandingkan model klasik terbaik, yaitu LogReg Tuned dengan Macro F1 test 0.7286. Selisih keduanya sebesar 0.0421.

**Hasil evaluasi lintas domain IndoBERT:**

- Macro F1 EmoT: 0.4166.
- Akurasi: 0.2991.
- Prediksi `neutral`: 2.558 data atau 58,40%.
- Kelas dengan F1 terbaik: `fear` sebesar 0.6771.
- Kelas dengan F1 terendah: `sad` sebesar 0.1638.

Hasil tersebut menunjukkan bahwa IndoBERT memiliki performa cukup baik pada dataset utama, tetapi mengalami penurunan ketika diuji pada dataset EmoT.

**Kesimpulan:** IndoBERT berhasil menjadi salah satu model Transformer dengan performa baik pada dataset utama. Namun, evaluasi lintas domain menunjukkan bahwa kemampuan generalisasinya masih menghadapi tantangan ketika diterapkan pada dataset dengan karakteristik berbeda.

## **5. Analisis Hasil IndoBERTweet**

IndoBERTweet berhasil memperoleh Macro F1 sebesar **0.7999 pada validation** dan **0.7889 pada test**. Hasil ini menunjukkan bahwa model mampu mempelajari pola emosi pada dataset utama dengan performa lebih tinggi dibandingkan IndoBERT.

Beberapa hasil penting dari eksperimen:

- Training loss: 0.8472.
- Akurasi validation: 0.7915.
- Akurasi test: 0.7829.
- Waktu training: 3.746,42 detik atau sekitar 62 menit 26 detik.
- Epoch terbaik: 1.
- Perangkat training: CPU.
- Model pretrained: `indolem/indobertweet-base-uncased`.
- MAX_LENGTH: 128.
- BATCH_SIZE: 4.
- LEARNING_RATE: 2e-5.

**Hasil F1-score setiap kelas pada data test:**

| Kelas | Precision | Recall | F1-score |
|---|---:|---:|---:|
| anger | 0.8034 | 0.8462 | 0.8242 |
| fear | 0.8120 | 0.7941 | 0.8030 |
| joy | 0.8079 | 0.7606 | 0.7836 |
| love | 0.7647 | 0.8053 | 0.7845 |
| sad | 0.8852 | 0.7152 | 0.7912 |
| neutral | 0.7147 | 0.7819 | 0.7468 |

IndoBERTweet memperoleh Macro F1 test sebesar 0.7889, lebih tinggi dibandingkan IndoBERT yang memperoleh 0.7707. Selisih keduanya sebesar 0.0182.

Jika dibandingkan dengan model klasik terbaik, yaitu LogReg Tuned dengan Macro F1 test 0.7286, IndoBERTweet memiliki selisih sebesar 0.0603.

IndoBERTweet juga memperoleh nilai F1 lebih tinggi pada lima dari enam kelas emosi dibandingkan IndoBERT. Kelas `anger` memperoleh F1 tertinggi sebesar 0.8242, sedangkan kelas `neutral` memiliki F1 terendah sebesar 0.7468.

**Hasil evaluasi lintas domain IndoBERTweet pada EmoT:**

- Jumlah data: 4.380.
- Macro F1: **0.5094**.
- Akurasi: 0.3708.
- Waktu prediksi: 437,40 detik atau sekitar 7 menit 17 detik.
- Prediksi `neutral`: 2.402 data atau 54,84%.
- Kelas dengan F1 terbaik: `fear` sebesar 0.7364.
- Kelas dengan F1 terendah: `sad` sebesar 0.2559.

**Hasil F1-score setiap kelas pada evaluasi EmoT:**

| Kelas | Precision | Recall | F1-score |
|---|---:|---:|---:|
| anger | 0.8498 | 0.4377 | 0.5778 |
| fear | 0.8637 | 0.6417 | 0.7364 |
| joy | 0.7698 | 0.3380 | 0.4697 |
| love | 0.7810 | 0.3758 | 0.5074 |
| sad | 0.8118 | 0.1519 | 0.2559 |

Hasil evaluasi menunjukkan bahwa IndoBERTweet memperoleh Macro F1 lebih tinggi daripada IndoBERT pada dataset EmoT, yaitu 0.5094 dibandingkan 0.4166. Selisih keduanya sebesar 0.0928.

Walaupun precision pada kelima kelas relatif tinggi, recall masih rendah pada beberapa kelas, khususnya `sad` sebesar 0.1519. Hal ini menunjukkan bahwa model masih kesulitan menemukan seluruh data yang sebenarnya termasuk dalam kelas tersebut.

Selain itu, sebanyak 54,84% prediksi menghasilkan label `neutral`, padahal label tersebut tidak tersedia dalam dataset EmoT. Kondisi ini menjadi salah satu faktor yang memengaruhi performa lintas domain.

**Kesimpulan:** IndoBERTweet menjadi model Transformer dengan performa terbaik pada dataset utama maupun evaluasi lintas domain EmoT berdasarkan eksperimen yang telah dilakukan. Namun, model masih menghadapi tantangan generalisasi, terutama dalam mengenali kelas `sad` dan menangani perbedaan kategori label pada dataset lintas domain.

## **6. Perbandingan Keseluruhan Model**

Berdasarkan Macro F1 pada dataset utama (test).

| Peringkat | Model | Macro F1 Test |
|---:|---|---:|
| 1 | IndoBERTweet | **0.7889** |
| 2 | IndoBERT | 0.7707 |
| 3 | LogReg Tuned | 0.7286 |
| 4 | SVM Tuned | 0.7251 |
| 5 | LogReg | 0.7108 |
| 6 | SVM | 0.6997 |
| 7 | Naive Bayes | 0.5628 |

**Perbandingan Macro F1 Test**

Performa model pada dataset utama.

| Model | Macro F1 Test |
|---|---:|
| IndoBERTweet | 0.7889 |
| IndoBERT | 0.7707 |
| LogReg Tuned | 0.7286 |
| SVM Tuned | 0.7251 |
| LogReg | 0.7108 |
| SVM | 0.6997 |
| Naive Bayes | 0.5628 |

**Perbandingan Macro F1 pada Evaluasi Lintas Domain EmoT**

| Peringkat | Model | Macro F1 EmoT |
|---:|---|---:|
| 1 | IndoBERTweet | **0.5094** |
| 2 | IndoBERT | 0.4166 |
| 3 | LogReg Tuned | 0.4142 |

**Kesimpulan sementara keseluruhan:**

Berdasarkan eksperimen yang telah dilakukan, IndoBERTweet memperoleh Macro F1 tertinggi pada dataset utama dengan nilai 0.7889. IndoBERT berada di posisi kedua dengan nilai 0.7707, sedangkan model klasik terbaik adalah LogReg Tuned dengan nilai 0.7286.

Pada evaluasi lintas domain EmoT, IndoBERTweet juga memperoleh nilai tertinggi, yaitu 0.5094. Nilai tersebut lebih tinggi dibandingkan IndoBERT sebesar 0.4166 dan LogReg Tuned sebesar 0.4142.

Dengan demikian, IndoBERTweet menjadi kandidat model terbaik berdasarkan hasil eksperimen saat ini, baik dari sisi performa pada dataset utama maupun kemampuan generalisasi lintas domain. Meskipun demikian, hasil evaluasi juga menunjukkan bahwa seluruh model masih mengalami penurunan performa ketika diterapkan pada dataset dengan karakteristik domain berbeda.

## **7. Status Eksperimen Chila**

**Fine-tuning IndoBERT**: Selesai

**Evaluasi cross-domain IndoBERT**: Selesai

**Fine-tuning IndoBERTweet**: Selesai

**Evaluasi cross-domain IndoBERTweet**: Selesai

**Perbandingan akhir Transformer**: Selesai

**Model terbaik pada dataset utama**: IndoBERTweet (Macro F1 0.7889)

**Model terbaik pada evaluasi lintas domain**: IndoBERTweet (Macro F1 0.5094)

**Kesimpulan sementara:** IndoBERTweet merupakan model Transformer dengan performa terbaik di antara eksperimen yang telah dilakukan. Model ini unggul pada dataset utama dan pengujian lintas domain EmoT, meskipun masih memiliki tantangan dalam mengenali kelas tertentu dan menghadapi perbedaan karakteristik dataset.

**Catatan:** Seluruh hasil evaluasi menggunakan dataset utama dan dataset EmoT sesuai eksperimen yang telah dijalankan. Prediksi `neutral` tetap dihitung sebagai kesalahan pada evaluasi EmoT karena dataset tersebut hanya memiliki lima kelas emosi.
