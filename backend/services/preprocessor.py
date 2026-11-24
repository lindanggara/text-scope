import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "src"))

try:
    from baseline import normalisasi_teks
except ImportError as e:
    raise ImportError(
        "normalisasi_teks() tidak ditemukan di src/baseline.py. "
        "Pastikan file baseline.py ada di backend/src/."
    ) from e

from services.emoji_map import emoji_ke_kata


def preprocess(text: str) -> str:
    """Emoji -> kata, lalu normalisasi yang sama dengan saat model dilatih."""
    if not isinstance(text, str):
        text = str(text)
    return normalisasi_teks(emoji_ke_kata(text))
