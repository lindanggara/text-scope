import re


class Anonymizer:
    """Privacy Shield: sensor data pribadi sebelum teks dianalisis.

    Urutan penting: email diproses sebelum username (karena email juga berisi '@'),
    dan NIK (16 digit) sebelum NIM (8-12 digit).
    """

    PATTERNS = [
        (re.compile(r"https?://\S+"), "[URL]"),
        (re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b"), "[EMAIL]"),
        (re.compile(r"(?<![\w@])@[A-Za-z0-9_.]{2,}"), "[USERNAME]"),
        (re.compile(r"\b\d{16}\b"), "[NIK]"),
        (re.compile(r"(?<!\d)(?:\+62|62|0)8\d{8,11}(?!\d)"), "[NOMOR_HP]"),
        (re.compile(r"\b\d{8,12}\b"), "[NIM]"),
    ]

    def anonymize_count(self, text: str):
        """Kembalikan (teks tersensor, jumlah data yang disensor)."""
        if not isinstance(text, str):
            text = str(text)
        total = 0
        for pattern, replacement in self.PATTERNS:
            text, n = pattern.subn(replacement, text)
            total += n
        return text, total

    def anonymize(self, text: str) -> str:
        return self.anonymize_count(text)[0]
