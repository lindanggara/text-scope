"""Mencari kata/frasa yang paling mendorong prediksi emosi.

Untuk model LogReg (TF-IDF + LogisticRegression), kontribusi sebuah kata ke suatu emosi
= nilai TF-IDF kata itu di teks x bobot (koefisien) kata itu untuk emosi tersebut.
Hanya fitur kata (bukan n-gram karakter) yang dipakai, supaya penjelasannya mudah dibaca.
"""
import numpy as np

from services.topic_model import STOPWORDS_ID

STOP = set(STOPWORDS_ID)


class Explainer:
    def __init__(self, model):
        self.ok = False
        try:
            fitur = model.named_steps["fitur"]
            self.word_vec = dict(fitur.transformer_list)["kata"]
            self.clf = model.named_steps["clf"]
            self.classes = [str(c) for c in self.clf.classes_]
            self.vocab = self.word_vec.get_feature_names_out()
            self.ok = True  # struktur model cocok; model lain (mis. IndoBERT) -> tanpa penjelasan
        except Exception:
            pass

    def reasons(self, text_clean: str, label: str, top_k: int = 3):
        """Kembalikan maksimal top_k kata/frasa pendorong emosi `label`."""
        if not self.ok or label not in self.classes:
            return []
        x = self.word_vec.transform([text_clean])
        if x.nnz == 0:
            return []
        coef = self.clf.coef_[self.classes.index(label)]
        contrib = x.data * coef[x.indices]
        order = np.argsort(contrib)[::-1]

        picked = []
        top = contrib[order[0]]
        for i in order:
            # berhenti kalau kontribusinya kecil dibanding kata terkuat (kurang bermakna)
            if contrib[i] <= 0 or contrib[i] < 0.3 * top or len(picked) >= top_k:
                break
            phrase = self.vocab[x.indices[i]]
            words = phrase.split()
            if all(w in STOP or w.startswith("[") for w in words):
                continue
            # lewati frasa yang tumpang tindih dengan yang sudah dipilih
            if any(set(words) & set(p.split()) for p in picked):
                continue
            picked.append(phrase)
        return picked
