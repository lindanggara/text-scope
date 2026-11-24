import joblib
import numpy as np


class Predictor:
    def __init__(self, model_path: str):
        self.model = joblib.load(model_path)
        self.classes = [str(c) for c in getattr(self.model, "classes_", [])]

    def predict(self, text: str):
        """Prediksi satu teks. Kembalikan label, confidence, dan probabilitas semua emosi."""
        if hasattr(self.model, "predict_proba"):
            proba = self.model.predict_proba([text])[0]
            idx = int(np.argmax(proba))
            probabilities = {self.classes[i]: round(float(p), 4) for i, p in enumerate(proba)}
            return self.classes[idx], float(proba[idx]), probabilities
        label = str(self.model.predict([text])[0])
        return label, 1.0, {label: 1.0}

    def predict_batch(self, texts):
        labels = self.model.predict(texts)
        if hasattr(self.model, "predict_proba"):
            confidences = self.model.predict_proba(texts).max(axis=1).tolist()
        else:
            confidences = [1.0] * len(texts)
        return [
            {"label": str(l), "confidence": float(c)}
            for l, c in zip(labels, confidences)
        ]
