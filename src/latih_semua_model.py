import sys, time, joblib
from pathlib import Path
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.naive_bayes import ComplementNB
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.metrics import f1_score

sys.path.insert(0, str(Path(__file__).resolve().parent))
from baseline import normalisasi_teks

ROOT = Path(__file__).resolve().parents[1]
PROCESSED = ROOT / "data" / "processed"
MODELS_DIR = ROOT / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

print("Memuat data...")
train_df = pd.read_csv(PROCESSED / "train.csv")
valid_df = pd.read_csv(PROCESSED / "valid.csv")
test_df = pd.read_csv(PROCESSED / "test.csv")

text_col = "text" if "text" in train_df.columns else train_df.columns[0]
label_col = "label" if "label" in train_df.columns else train_df.columns[-1]

X_train = train_df[text_col].astype(str).apply(normalisasi_teks)
y_train = train_df[label_col]
X_valid = valid_df[text_col].astype(str).apply(normalisasi_teks)
y_valid = valid_df[label_col]
X_test = test_df[text_col].astype(str).apply(normalisasi_teks)
y_test = test_df[label_col]

feat_dasar = TfidfVectorizer(max_features=10000)
feat_lengkap = FeatureUnion([
    ("word", TfidfVectorizer(max_features=10000, ngram_range=(1, 2))),
    ("char", TfidfVectorizer(analyzer="char_wb", max_features=5000, ngram_range=(2, 5)))
])

daftar_model = [
    {"id": "logreg_baseline", "nama": "LogReg Baseline", "deskripsi": "Logistic Regression dasar + TF-IDF kata", "pipeline": Pipeline([("features", feat_dasar), ("clf", LogisticRegression(max_iter=1000, random_state=42))])},
    {"id": "logreg_tuned", "nama": "LogReg Tuned", "deskripsi": "Logistic Regression + TF-IDF kata & karakter, C=1.0", "pipeline": Pipeline([("features", feat_lengkap), ("clf", LogisticRegression(C=1.0, class_weight="balanced", max_iter=1000, random_state=42))])},
    {"id": "svm_tuned", "nama": "SVM Tuned", "deskripsi": "Support Vector Machine + TF-IDF kata & karakter", "pipeline": Pipeline([("features", feat_lengkap), ("clf", SVC(C=1.0, class_weight="balanced", probability=True, random_state=42))])},
    {"id": "nb_tuned", "nama": "Naive Bayes", "deskripsi": "Complement Naive Bayes + TF-IDF", "pipeline": Pipeline([("features", feat_dasar), ("clf", ComplementNB())])}
]

rekap = []
for m in daftar_model:
    print(f"\n--- Melatih: {m['nama']} ---")
    t0 = time.time()
    m["pipeline"].fit(X_train, y_train)
    f1_val = f1_score(y_valid, m["pipeline"].predict(X_valid), average="macro")
    f1_test = f1_score(y_test, m["pipeline"].predict(X_test), average="macro")
    print(f"F1 Validasi: {f1_val:.4f} | F1 Test: {f1_test:.4f} | Waktu: {time.time() - t0:.1f}s")
    joblib.dump(m["pipeline"], MODELS_DIR / f"{m['id']}.pkl")
    rekap.append({"id": m["id"], "nama": m["nama"], "deskripsi": m["deskripsi"], "f1_valid": round(f1_val, 4), "f1_test": round(f1_test, 4), "path": f"models/{m['id']}.pkl"})

pd.DataFrame(rekap).to_csv(MODELS_DIR / "rekap_hasil.csv", index=False)
print("\nTraining selesai!")