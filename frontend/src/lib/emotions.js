// Satu emosi = satu warna di semua bagian dashboard.
// Warna diambil dari dashboard/app.py di repo agar konsisten.
// Di bawah angka ini, prediksi dianggap kurang yakin dan perlu dicek manual.
export const LOW_CONFIDENCE = 0.5

export const EMOTIONS = ['anger', 'fear', 'joy', 'love', 'sad', 'neutral']

export const EMOTION_INFO = {
  anger:   { nama: 'Marah',  color: '#E34948', arti: 'Kesal, jengkel, atau tidak terima terhadap sesuatu.', contoh: 'Kesel banget, udah nunggu live dari tadi malah dibatalin 😤' },
  fear:    { nama: 'Takut',  color: '#6250D6', arti: 'Cemas, khawatir, atau merasa terancam.', contoh: 'Merinding parah nonton part terakhirnya, takut tidur sendiri.' },
  joy:     { nama: 'Senang', color: '#EDA100', arti: 'Gembira, puas, atau bersyukur.', contoh: 'Seru banget kontennya, bikin ketawa terus 😂' },
  love:    { nama: 'Cinta',  color: '#E87BA4', arti: 'Sayang, kagum, atau rasa dekat dengan seseorang atau sesuatu.', contoh: 'Sayang banget sama kreator ini, selalu kasih vibes positif ❤️' },
  sad:     { nama: 'Sedih',  color: '#2A78D6', arti: 'Kecewa, kehilangan, atau patah semangat.', contoh: 'Nangis liat videonya, jadi kangen almarhum ayah 😭' },
  neutral: { nama: 'Netral', color: '#1BAF7A', arti: 'Informasi atau pernyataan tanpa muatan emosi yang jelas.', contoh: 'Kak, lagu di video ini judulnya apa ya?' },
}

export function emotionInfo(key) {
  return EMOTION_INFO[key] ?? { nama: key, color: '#8A84A0', arti: '', contoh: '' }
}

// Warna transparan untuk latar label (hex + alpha).
export function tint(key, alpha = '26') {
  return emotionInfo(key).color + alpha
}

export function formatNumber(n) {
  return Number(n ?? 0).toLocaleString('id-ID')
}

// Persen dengan koma desimal khas Indonesia, mis. 22,9
export function formatPercent(p) {
  return Number(p ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })
}
