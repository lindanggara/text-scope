import io
import json
import os
import logging
from contextlib import asynccontextmanager
from typing import Dict, List, Optional

import pandas as pd
from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Baca file .env (kalau ada) sebelum layanan lain membaca variabel lingkungan.
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from services import auth
from services.auth import User, get_current_user, require_admin
from services.predictor import Predictor
from services.topic_model import TopicModel
from services.anonymizer import Anonymizer
from services.preprocessor import preprocess
from services.explainer import Explainer
from services.emoji_map import emoji_untuk_kata

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("textscope")

EMOTIONS = ["anger", "fear", "joy", "love", "sad", "neutral"]
EMOTION_NAMES = {
    "anger": "marah", "fear": "takut", "joy": "senang",
    "love": "cinta", "sad": "sedih", "neutral": "netral",
}
MAX_ROWS = int(os.getenv("MAX_ROWS", "5000"))
MIN_WORDS = int(os.getenv("MIN_WORDS", "3"))
MAX_WORDS = int(os.getenv("MAX_WORDS", "100"))

state = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Loading model & services...")
    state["predictor"] = Predictor(model_path=os.getenv("MODEL_PATH", "models/logreg_tuned.pkl"))
    state["topic_model"] = TopicModel(n_topics=int(os.getenv("N_TOPICS", "5")))
    state["anonymizer"] = Anonymizer()
    state["explainer"] = Explainer(state["predictor"].model)
    auth.log_status()
    logger.info("Model & services loaded.")
    yield
    state.clear()
    logger.info("Shutdown.")


app = FastAPI(
    title="TextScope API",
    description="Analisis teks: klasifikasi emosi, topic modeling, anonimisasi.",
    version="1.3.0",
    lifespan=lifespan,
)

origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# Teks tunggal: POST /predict
# ============================================================

class PredictRequest(BaseModel):
    text: str


class PredictResponse(BaseModel):
    label: str
    confidence: float
    probabilities: Dict[str, float]
    reasons: List[str]
    text_anonymized: str


@app.get("/health")
def health():
    return {"status": "ok", "auth": auth.AUTH_ENABLED}


# ============================================================
# Akun & admin
# ============================================================

@app.get("/me")
def me(user: User = Depends(get_current_user)):
    """Cek siapa yang sedang login menurut backend (dipakai untuk uji koneksi)."""
    return {"id": user.id, "email": user.email, "role": user.role, "full_name": user.full_name}


MODEL_INFO_PATH = os.getenv("MODEL_INFO_PATH", "models/model_info.json")


@app.get("/admin/model-info")
def model_info(user: User = Depends(require_admin)):
    """Info model untuk halaman admin: metrik dari model_info.json + isi model yang sedang aktif."""
    try:
        with open(MODEL_INFO_PATH, encoding="utf-8") as f:
            info = json.load(f)
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("model_info.json tidak terbaca: %s", exc)
        info = {}

    model = state["predictor"].model
    runtime = {
        "type": type(model).__name__,
        "classes": state["predictor"].classes,
        "steps": [],
        "settings": {
            "max_rows": MAX_ROWS,
            "min_words": MIN_WORDS,
            "max_words": MAX_WORDS,
            "n_topics": state["topic_model"].n_topics if hasattr(state["topic_model"], "n_topics") else None,
        },
    }
    steps = getattr(model, "steps", None) or []
    for name, step in steps:
        entry = {"name": name, "type": type(step).__name__}
        for sub_name, sub in getattr(step, "transformer_list", []) or []:
            vocab = getattr(sub, "vocabulary_", None)
            entry.setdefault("features", []).append(
                {"name": sub_name, "type": type(sub).__name__, "size": len(vocab) if vocab is not None else None}
            )
        if hasattr(step, "C"):
            entry["C"] = step.C
        runtime["steps"].append(entry)
    return {**info, "runtime": runtime}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest, user: User = Depends(get_current_user)):
    text = req.text.strip()
    n_words = len(text.split())
    if n_words < MIN_WORDS:
        raise HTTPException(status_code=400, detail=f"Teks terlalu pendek. Minimal {MIN_WORDS} kata.")
    if n_words > MAX_WORDS:
        raise HTTPException(status_code=400, detail=f"Teks terlalu panjang. Maksimal {MAX_WORDS} kata (teks kamu {n_words} kata).")

    text_anon = state["anonymizer"].anonymize(text)
    text_clean = preprocess(text_anon)
    label, confidence, probabilities = state["predictor"].predict(text_clean)
    reasons = state["explainer"].reasons(text_clean, label)
    # Kalau kata pemicu berasal dari emoji (mis. 😭 -> "nangis"), tampilkan emojinya.
    lower = text_anon.lower()
    reasons = [r if r in lower else (emoji_untuk_kata(text_anon, r) or r) for r in reasons]
    return PredictResponse(label=label, confidence=confidence, probabilities=probabilities,
                           reasons=reasons, text_anonymized=text_anon)


# ============================================================
# File: POST /analyze
# ============================================================

def read_table(file: UploadFile) -> pd.DataFrame:
    filename = (file.filename or "").lower()
    if not (filename.endswith(".csv") or filename.endswith(".xlsx")):
        raise HTTPException(status_code=400, detail="File harus .csv atau .xlsx")
    try:
        if filename.endswith(".csv"):
            raw = file.file.read()
            # utf-8-sig: buang BOM dari file ekspor Excel; cp1252 untuk CSV lama yang bukan UTF-8.
            # keep_default_na=False: teks seperti "NA"/"null" tetap dianggap komentar (sama dengan dashboard).
            for enc in ("utf-8-sig", "cp1252"):
                try:
                    return pd.read_csv(io.BytesIO(raw), encoding=enc, keep_default_na=False, na_values=[""])
                except UnicodeDecodeError:
                    continue
            raise HTTPException(status_code=400, detail="File CSV tidak bisa dibaca. Simpan ulang dengan encoding UTF-8.")
        return pd.read_excel(file.file, engine="openpyxl", keep_default_na=False, na_values=[""])
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Gagal membaca file: {e}")


def guess_text_column(df: pd.DataFrame) -> str:
    """Kalau kolom teks tidak dikirim, pilih kolom dengan rata-rata isi terpanjang."""
    lengths = {c: df[c].astype(str).str.len().mean() for c in df.columns}
    return max(lengths, key=lengths.get)


def build_insight(distribution, topics) -> str:
    if not distribution or distribution[0]["count"] == 0:
        return "Tidak ada teks yang bisa dianalisis."
    first = distribution[0]
    name = EMOTION_NAMES.get(first["emotion"], first["emotion"])
    text = f"Emosi yang paling banyak muncul adalah {name} ({first['percentage']:g}%)"
    top_topics = [t["topic"].split(", ")[0] for t in topics.get(first["emotion"], [])[:2]]
    if top_topics:
        text += ", terutama terkait " + " dan ".join(top_topics)
    text += "."
    if len(distribution) > 1 and distribution[1]["count"] > 0:
        second = distribution[1]
        text += f" Disusul emosi {EMOTION_NAMES.get(second['emotion'], second['emotion'])} ({second['percentage']:g}%)."
    return text


@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    text_column: Optional[str] = Form(None),
    privacy_shield: bool = Form(True),
    user: User = Depends(get_current_user),
):
    df = read_table(file)
    if df.empty:
        raise HTTPException(status_code=400, detail="File kosong.")
    if len(df) > MAX_ROWS:
        raise HTTPException(status_code=400, detail=f"Maksimal {MAX_ROWS} baris. File kamu: {len(df)} baris.")

    if text_column:
        if text_column not in df.columns:
            raise HTTPException(status_code=400, detail=f"Kolom '{text_column}' tidak ditemukan di file.")
    else:
        text_column = guess_text_column(df)

    texts = df[text_column].dropna().astype(str).str.strip()
    texts = texts[texts != ""].tolist()
    if not texts:
        raise HTTPException(status_code=400, detail=f"Kolom '{text_column}' tidak berisi teks.")

    # 1. Privacy Shield (dijalankan sebelum model dan NMF)
    anonymizer = state["anonymizer"]
    censored_count = 0
    shown_texts, anon_texts = [], []
    for t in texts:
        a, n = anonymizer.anonymize_count(t)
        anon_texts.append(a)
        censored_count += n
        shown_texts.append(a if privacy_shield else t)

    # 2. Normalisasi + prediksi emosi
    cleaned = [preprocess(t) for t in anon_texts]
    predictions = state["predictor"].predict_batch(cleaned)
    labels = [p["label"] for p in predictions]

    # 3. Distribusi emosi (keenam emosi selalu ada)
    total = len(texts)
    counts = pd.Series(labels).value_counts().to_dict()
    distribution = sorted(
        [{"emotion": e, "count": int(counts.get(e, 0)),
          "percentage": round(counts.get(e, 0) / total * 100, 1)} for e in EMOTIONS],
        key=lambda d: d["count"], reverse=True,
    )

    # 4. Topic modeling per emosi
    topics = state["topic_model"].fit_per_emotion(cleaned, labels, EMOTIONS)

    confidences = [p["confidence"] for p in predictions]
    return {
        "status": "success",
        "summary": {
            "total_texts": total,
            "dominant_emotion": distribution[0]["emotion"],
            "avg_confidence": round(sum(confidences) / total, 2),
            "censored_count": censored_count if privacy_shield else 0,
        },
        "distribution": distribution,
        "topics": topics,
        "insight": build_insight(distribution, topics),
        "results": [
            {"id": i + 1, "text": shown_texts[i], "emotion": labels[i], "confidence": round(confidences[i], 4)}
            for i in range(total)
        ],
    }
