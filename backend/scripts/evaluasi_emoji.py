"""Bandingkan Macro F1 model dengan dan tanpa konversi emoji -> kata.

Cara pakai (dari folder backend/):
    python scripts/evaluasi_emoji.py ../data/processed/test.csv

File CSV harus punya kolom `text` dan `label` (sama dengan data uji di src/finalisasi_model.py).
"""
import sys
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import classification_report, f1_score

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "src"))

from baseline import normalisasi_teks  # noqa: E402
from services.emoji_map import emoji_ke_kata  # noqa: E402


def main(path):
    df = pd.read_csv(path)
    model = joblib.load(ROOT / "models" / "logreg_tuned.pkl")
    y = df["label"]

    tanpa = model.predict([normalisasi_teks(t) for t in df["text"].astype(str)])
    dengan = model.predict([normalisasi_teks(emoji_ke_kata(t)) for t in df["text"].astype(str)])

    ada_emoji = df["text"].astype(str).map(lambda t: emoji_ke_kata(t) != t.strip())
    print(f"Jumlah data: {len(df)} (berisi emoji: {ada_emoji.sum()})")
    print(f"Macro F1 tanpa konversi emoji : {f1_score(y, tanpa, average='macro'):.4f}")
    print(f"Macro F1 dengan konversi emoji: {f1_score(y, dengan, average='macro'):.4f}")
    print("\nLaporan per kelas (dengan konversi emoji):")
    print(classification_report(y, dengan, digits=4))


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1])
