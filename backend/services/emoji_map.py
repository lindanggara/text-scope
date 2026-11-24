"""Ubah emoji menjadi kata sebelum prediksi.

Di komentar media sosial, emoji sering menjadi petunjuk emosi yang paling jelas,
tapi model (TF-IDF) tidak mengenali emoji. Emoji diganti kata yang sudah dikenal model.
"""
import re

EMOJI_KATA = {
    # marah
    "😡": "marah", "😠": "marah", "🤬": "marah", "👿": "marah", "💢": "kesal", "😤": "kesal",
    "🖕": "marah", "😒": "kesal", "🙄": "kesal",
    # takut
    "😱": "takut", "😨": "takut", "😰": "takut", "😧": "takut", "😟": "khawatir", "🫣": "takut",
    "😖": "takut", "👻": "seram", "💀": "seram",
    # senang
    "😂": "ngakak", "🤣": "ngakak", "😁": "senang", "😄": "senang", "😆": "senang", "😊": "senang",
    "😃": "senang", "😀": "senang", "🥳": "senang", "🎉": "senang", "🔥": "keren", "👍": "bagus",
    "👏": "keren", "😎": "keren", "✨": "keren", "🙌": "senang", "💯": "mantap", "🤩": "senang",
    "😋": "enak", "🎶": "senang",
    # cinta
    "❤️": "sayang", "❤": "sayang", "💕": "sayang", "💖": "sayang", "💗": "sayang", "💓": "sayang",
    "💞": "sayang", "💘": "cinta", "💝": "sayang", "😍": "cinta", "🥰": "sayang", "😘": "sayang",
    "💜": "sayang", "💙": "sayang", "💚": "sayang", "🧡": "sayang", "🤍": "sayang", "🖤": "sayang",
    "🫶": "sayang", "😻": "sayang",
    # sedih
    "😭": "nangis", "😢": "sedih", "😥": "sedih", "😞": "kecewa", "😔": "sedih", "🥺": "sedih",
    "💔": "sedih", "😿": "sedih", "☹️": "sedih", "☹": "sedih", "🙁": "sedih", "😩": "sedih",
}

# Emoji yang terdiri dari beberapa karakter dicocokkan lebih dulu.
_POLA = re.compile("|".join(re.escape(e) for e in sorted(EMOJI_KATA, key=len, reverse=True)))
_SISA_EMOJI = re.compile(r"[\U0001F000-\U0001FAFF☀-➿️‍]")


def emoji_ke_kata(teks: str) -> str:
    teks = _POLA.sub(lambda m: f" {EMOJI_KATA[m.group(0)]} ", teks)
    teks = _SISA_EMOJI.sub(" ", teks)  # emoji lain yang tidak dikenal dibuang
    return re.sub(r"\s+", " ", teks).strip()


def emoji_untuk_kata(teks: str, kata: str):
    """Cari emoji di teks asli yang diterjemahkan menjadi `kata` (untuk penjelasan kata pemicu)."""
    for e, k in EMOJI_KATA.items():
        if k == kata and e in teks:
            return e
    return None
