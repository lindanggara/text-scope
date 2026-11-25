import json
import os
import joblib
import numpy as np


LABELS = ["marah", "takut", "senang", "cinta", "netral", "sedih"]

_BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_REGISTRY_PATH = os.path.join(_BASE, "models", "registry.json")


def _load_registry():
    if not os.path.exists(_REGISTRY_PATH):
        return {"aktif": "logreg_tuned", "model": {}}
    with open(_REGISTRY_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def get_registry():
    reg = _load_registry()
    return {
        "aktif": reg.get("aktif"),
        "model": [{"id": k, **v} for k, v in reg.get("model", {}).items()],
    }


def set_aktif(nama):
    reg = _load_registry()
    if nama not in reg.get("model", {}):
        raise ValueError(f"Model '{nama}' tidak ada di registry")
    reg["aktif"] = nama
    with open(_REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(reg, f, ensure_ascii=False, indent=2)
    return reg["aktif"]


class Predictor:
    """Predictor dengan dukungan registry model (sklearn & transformer).

    Kompatibel dengan pemakaian lama: Predictor(model_path="models/logreg_tuned.pkl")
    """

    def __init__(self, model_path: str = None):
        self._cache = {}
        if model_path:
            self.model = self._load_sklearn(model_path)
            self.classes = [str(c) for c in getattr(self.model, "classes_", [])]
        else:
            reg = _load_registry()
            aktif = reg.get("aktif", "logreg_tuned")
            info = reg.get("model", {}).get(aktif, {})
            if info.get("tipe") == "sklearn":
                path = os.path.join(_BASE, info["path"])
                self.model = self._load_sklearn(path)
                self.classes = [str(c) for c in getattr(self.model, "classes_", [])]
            else:
                self.model = None
                self.classes = LABELS

    def _load_sklearn(self, path):
        return joblib.load(path)

    def _load_transformer(self, path):
        import torch
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        tok = AutoTokenizer.from_pretrained(path)
        mod = AutoModelForSequenceClassification.from_pretrained(path)
        mod.eval()
        return {"tokenizer": tok, "model": mod, "torch": torch}

    def _get_model_for(self, nama):
        if nama in self._cache:
            return self._cache[nama]
        reg = _load_registry()
        info = reg["model"][nama]
        path = os.path.join(_BASE, info["path"])
        if info["tipe"] == "sklearn":
            obj = {"tipe": "sklearn", "obj": self._load_sklearn(path)}
        elif info["tipe"] == "transformer":
            obj = {"tipe": "transformer", "obj": self._load_transformer(path)}
        else:
            raise ValueError(f"Tipe tidak dikenal: {info['tipe']}")
        self._cache[nama] = obj
        return obj

    def _predict_one(self, text, nama=None):
        reg = _load_registry()
        nama = nama or reg.get("aktif", "logreg_tuned")
        info = reg.get("model", {}).get(nama, {})

        if info.get("tipe") == "sklearn" or nama == "logreg_tuned":
            m = self._get_model_for(nama)
            model = m["obj"]
            classes = [str(c) for c in getattr(model, "classes_", [])]
            if hasattr(model, "predict_proba"):
                proba = model.predict_proba([text])[0]
                idx = int(np.argmax(proba))
                probabilities = {classes[i]: round(float(p), 4) for i, p in enumerate(proba)}
                return classes[idx], float(proba[idx]), probabilities
            label = str(model.predict([text])[0])
            return label, 1.0, {label: 1.0}

        m = self._get_model_for(nama)
        torch = m["obj"]["torch"]
        tok = m["obj"]["tokenizer"]
        model = m["obj"]["model"]
        inputs = tok(text, return_tensors="pt", truncation=True, max_length=128)
        with torch.no_grad():
            logits = model(**inputs).logits
        proba = torch.softmax(logits, dim=-1)[0].tolist()
        idx = int(np.argmax(proba))
        probabilities = {LABELS[i]: round(float(p), 4) for i, p in enumerate(proba)}
        return LABELS[idx], float(proba[idx]), probabilities

    def predict(self, text: str):
        """Prediksi satu teks. Kembalikan label, confidence, dan probabilitas semua emosi."""
        return self._predict_one(text)

    def predict_batch(self, texts):
        reg = _load_registry()
        nama = reg.get("aktif", "logreg_tuned")
        info = reg.get("model", {}).get(nama, {})

        if info.get("tipe") == "sklearn" or nama == "logreg_tuned":
            m = self._get_model_for(nama)
            model = m["obj"]
            labels = model.predict(texts)
            if hasattr(model, "predict_proba"):
                confidences = model.predict_proba(texts).max(axis=1).tolist()
            else:
                confidences = [1.0] * len(texts)
            return [{"label": str(l), "confidence": float(c)} for l, c in zip(labels, confidences)]

        return [self._predict_one(t) and {"label": self._predict_one(t)[0], "confidence": self._predict_one(t)[1]} for t in texts]