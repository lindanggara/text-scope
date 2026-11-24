from collections import defaultdict

from sklearn.decomposition import NMF
from sklearn.feature_extraction.text import TfidfVectorizer

# Stopword sederhana (sama dengan src/topic_modeling.py) supaya topik tidak berisi kata umum.
STOPWORDS_ID = [
    "yang", "dan", "di", "ke", "dari", "ini", "itu", "untuk", "dengan", "pada", "adalah", "juga",
    "atau", "tidak", "ga", "gak", "nggak", "tak", "ya", "aja", "saja", "sih", "deh", "dong", "lah",
    "kok", "kan", "nya", "ada", "akan", "sudah", "udah", "belum", "bisa", "dapat", "jadi", "karena",
    "sama", "lebih", "sangat", "banget", "yg", "dg", "dgn", "utk", "tp", "tapi", "dalam", "oleh",
    "saya", "aku", "kamu", "kita", "kami", "mereka", "dia", "anda", "gue", "gw", "lu", "lo", "kau",
    "mu", "ku", "buat", "bgt", "apa", "siapa", "bagaimana", "kenapa", "mengapa", "kalau", "kalo",
    "jika", "agar", "supaya", "sebagai", "para", "pun", "hanya", "masih", "telah", "sedang",
    "harus", "mau", "lagi", "lg", "nih", "tu", "tuh", "se", "per", "kalian", "sebuah", "semua",
    "setiap", "username", "nomor_hp", "nim", "nik", "email", "url",
    # kata gaul / pengisi yang sering muncul di komentar media sosial
    "liat", "liatnya", "lihat", "sekali", "aja", "gitu", "gini", "kayak", "kaya", "emang", "pas",
    "jd", "pengen", "pingin", "kak", "kakak", "min", "bang", "guys", "gaes", "ges", "wkwk",
    "wkwkwk", "haha", "hahaha", "hehe", "anjir", "anjay", "btw", "plis", "pls", "tolong",
    "fyp", "fypシ", "foryou", "foryoupage", "viral", "xyzbca", "trending",
    "makin", "bikin", "banyak", "baru", "lama", "kali", "terus", "masih", "selalu", "pernah",
    "orang", "semua", "ternyata", "padahal", "sampe", "sampai", "nonton", "video", "upload",
    "malah", "gara", "mana", "cuma", "ikut", "asal", "parah", "kok", "nih", "deh",
]

# Kata perasaan (termasuk hasil konversi emoji) tidak dipakai sebagai nama topik,
# karena sudah jadi sinyal emosi, bukan "soal apa". Tetap boleh dipakai sebagai kata pemicu.
EMOTION_WORDS = [
    "marah", "kesal", "kesel", "takut", "khawatir", "seram", "serem", "ngakak", "senang", "seneng",
    "keren", "bagus", "mantap", "enak", "sayang", "cinta", "nangis", "sedih", "kecewa", "emosi",
]
TOPIC_STOPWORDS = STOPWORDS_ID + EMOTION_WORDS

MIN_TEXTS = 5          # minimal teks per emosi agar topik bisa dicari
MAX_TEXTS = 1000       # batas teks per emosi supaya tetap cepat
KEYWORDS_PER_TOPIC = 4


class TopicModel:
    def __init__(self, n_topics: int = 5):
        self.n_topics = n_topics

    def _fit_one(self, texts):
        """Cari topik untuk satu kelompok teks. Kembalikan list topik (boleh kosong)."""
        texts = texts[:MAX_TEXTS]
        if len(texts) < MIN_TEXTS:
            return []
        min_df = 2 if len(texts) >= 50 else 1
        vectorizer = TfidfVectorizer(max_df=0.95, min_df=min_df, max_features=3000,
                                     ngram_range=(1, 1), stop_words=TOPIC_STOPWORDS,
                                     token_pattern=r"(?u)\b[^\W\d_]{3,}\b")  # huruf saja, min. 3 huruf
        try:
            X = vectorizer.fit_transform(texts)
        except ValueError:  # semua kata terbuang oleh stopword / min_df
            return []
        n = min(self.n_topics, X.shape[0] - 1, X.shape[1])
        if n < 1:
            return []

        nmf = NMF(n_components=n, random_state=42, init="nndsvda", max_iter=400)
        W = nmf.fit_transform(X)
        feature_names = vectorizer.get_feature_names_out()

        # Skor topik = porsi teks yang topik dominannya adalah topik ini (0-1).
        dominant = W.argmax(axis=1)
        topics = []
        for idx, comp in enumerate(nmf.components_):
            top = [feature_names[i] for i in comp.argsort()[::-1][: 2 + KEYWORDS_PER_TOPIC]]
            name = ", ".join(top[:2])          # nama topik = 2 kata teratas
            keywords = top[2:]                 # kata kunci = kata berikutnya
            score = round(float((dominant == idx).sum()) / len(texts), 2)
            topics.append({"topic": name, "score": score, "keywords": keywords})
        topics = [t for t in topics if t["score"] > 0] or topics
        return sorted(topics, key=lambda t: t["score"], reverse=True)

    def fit_per_emotion(self, texts, labels, emotions):
        """Topic modeling terpisah untuk setiap emosi."""
        groups = defaultdict(list)
        for text, label in zip(texts, labels):
            groups[label].append(text)
        return {emo: self._fit_one(groups.get(emo, [])) for emo in emotions}
