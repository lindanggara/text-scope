import { EMOTIONS, emotionInfo } from './emotions.js'

// Makna tiap emosi, dipakai di kalimat penjelasan.
const MAKNA = {
  anger: 'rasa kesal atau tidak terima terhadap sesuatu',
  fear: 'rasa cemas, khawatir, atau merasa terancam',
  joy: 'rasa senang, puas, atau bersyukur',
  love: 'rasa sayang, rindu, atau kedekatan dengan seseorang',
  sad: 'rasa kecewa, kehilangan, atau patah semangat',
  neutral: 'penyampaian informasi tanpa muatan perasaan yang kuat',
}

function quoteList(words) {
  const q = words.map((w) => `“${w}”`)
  if (q.length <= 1) return q.join('')
  if (q.length === 2) return `${q[0]} dan ${q[1]}`
  return `${q.slice(0, -1).join(', ')}, dan ${q[q.length - 1]}`
}

/**
 * Susun kalimat penjelasan dari hasil deteksi.
 * reasons = kata/frasa yang paling mendorong emosi tersebut.
 */
export function explainResult({ emotion, probabilities, reasons = [] }) {
  const nama = emotionInfo(emotion).nama.toLowerCase()
  const makna = MAKNA[emotion] ?? ''
  let main
  if (emotion === 'neutral') {
    main = reasons.length
      ? `Komentar ini cenderung netral karena isinya lebih banyak berupa informasi, seperti ${quoteList(reasons)}, tanpa ungkapan perasaan yang kuat.`
      : 'Komentar ini cenderung netral karena isinya lebih banyak berupa informasi, tanpa ungkapan perasaan yang kuat.'
  } else if (reasons.length) {
    const isEmoji = (r) => /\p{Extended_Pictographic}/u.test(r)
    const nEmoji = reasons.filter(isEmoji).length
    const jenis = nEmoji === 0 ? 'kata' : nEmoji === reasons.length ? 'emoji' : 'kata dan emoji'
    const subjek = nEmoji === 0 ? (reasons.length > 1 ? 'Kata-kata' : 'Kata') : nEmoji === reasons.length ? 'Emoji' : 'Kata dan emoji'
    main = `Komentar ini terdeteksi ${nama} karena ada ${jenis} seperti ${quoteList(reasons)}. ${subjek} tersebut biasanya muncul untuk mengungkapkan ${makna}.`
  } else {
    main = `Komentar ini terdeteksi ${nama} dari nada kalimatnya secara keseluruhan, yang menggambarkan ${makna}.`
  }

  let extra = ''
  if (probabilities) {
    const second = EMOTIONS
      .filter((e) => e !== emotion)
      .map((e) => ({ e, p: probabilities[e] ?? 0 }))
      .sort((a, b) => b.p - a.p)[0]
    if (second && second.p >= 0.2) {
      extra = `Selain itu, ada juga nuansa ${emotionInfo(second.e).nama.toLowerCase()} (${Math.round(second.p * 100)}%) di dalam komentar ini.`
    }
  }
  return { main, extra }
}

// ---------------------------------------------------------------
// Penjelasan singkat untuk tiap kata pemicu
// ---------------------------------------------------------------

// Kata yang langsung menyebut perasaan.
export const KATA_PERASAAN = {
  anger: ['kesal', 'kesel', 'marah', 'emosi', 'benci', 'jengkel', 'sebal', 'sebel', 'menyebalkan', 'nyebelin', 'muak', 'geram', 'dongkol'],
  fear: ['takut', 'khawatir', 'cemas', 'ngeri', 'was', 'panik', 'deg', 'gelisah', 'waswas', 'trauma'],
  joy: ['senang', 'seneng', 'bahagia', 'gembira', 'puas', 'syukur', 'bersyukur', 'lega', 'mantap', 'makasih', 'terima', 'kasih', 'asyik', 'seru'],
  love: ['sayang', 'cinta', 'kangen', 'rindu', 'suka', 'kasih', 'peduli'],
  sad: ['sedih', 'kecewa', 'nangis', 'menangis', 'hampa', 'menyesal', 'patah', 'pilu', 'galau', 'sakit'],
}

// Kata penguat yang mempertegas perasaan.
export const KATA_PENGUAT = ['banget', 'bgt', 'sekali', 'sangat', 'benar', 'bener', 'parah', 'amat', 'terlalu', 'paling', 'super', 'pol']

// Kata situasi yang sering menjadi penyebab emosi tertentu.
const KATA_SITUASI = {
  anger: ['clickbait', 'settingan', 'iklan', 'drama', 'toxic', 'hate', 'lambat', 'telat', 'lama', 'mahal', 'ketus', 'jutek', 'error', 'rusak', 'penyok', 'bohong', 'tipu', 'dibalas', 'tanggapan', 'komplain', 'sepihak', 'sembarangan'],
  fear: ['horor', 'seram', 'serem', 'hantu', 'hoaks', 'hoax', 'diretas', 'otp', 'penipuan', 'tipu', 'bocor', 'hilang', 'ancam', 'ujian', 'sidang', 'malam', 'sepi', 'gelap', 'asing', 'refund', 'saldo', 'terpotong'],
  joy: ['ngakak', 'kocak', 'lucu', 'wkwk', 'wkwkwk', 'relate', 'giveaway', 'editan', 'lulus', 'diskon', 'promo', 'gratis', 'cepat', 'kilat', 'berhasil', 'akhirnya', 'menang', 'diterima', 'bagus', 'keren', 'original', 'murah'],
  love: ['kreator', 'idola', 'bias', 'couple', 'kucing', 'ibu', 'ayah', 'bapak', 'mama', 'papa', 'kamu', 'pasangan', 'keluarga', 'adik', 'kakak', 'nenek', 'kakek', 'pacar', 'kado', 'hadiah', 'langganan', 'favorit'],
  sad: ['ending', 'pamit', 'hiatus', 'almarhum', 'almarhumah', 'pergi', 'meninggal', 'mati', 'gagal', 'hilang', 'rusak', 'pecah', 'sendiri', 'sendirian', 'batal', 'dibatalkan', 'habis', 'putus', 'jelek'],
  neutral: ['lagu', 'judul', 'part', 'link', 'lokasi', 'tag', 'jadwal', 'tanggal', 'jam', 'hari', 'dikirim', 'info', 'informasi', 'resi', 'alamat', 'pembayaran', 'transfer', 'ukuran', 'tersedia', 'gedung', 'semester', 'pengumuman'],
}

const ARTI_SITUASI = {
  anger: 'Menggambarkan hal yang merugikan atau tidak sesuai harapan, sehingga memancing rasa kesal.',
  fear: 'Menggambarkan situasi berisiko atau belum pasti yang membuat seseorang khawatir.',
  joy: 'Menggambarkan hal baik atau keberhasilan yang membuat seseorang senang.',
  love: 'Merujuk pada orang atau hal yang dekat dan disayangi.',
  sad: 'Menggambarkan kehilangan atau kegagalan yang membuat seseorang sedih.',
  neutral: 'Kata yang bersifat informasi, tidak membawa perasaan tertentu.',
}

// Penjelasan khusus untuk kata-kata yang paling sering muncul.
const ARTI_KATA = [
  [['kesal', 'kesel', 'jengkel', 'sebal', 'sebel', 'dongkol'], 'Ungkapan langsung rasa jengkel atau tidak senang.'],
  [['marah', 'geram', 'emosi'], 'Menyatakan amarah secara terang-terangan.'],
  [['benci', 'muak'], 'Menunjukkan rasa tidak suka yang sangat kuat.'],
  [['menyebalkan', 'nyebelin'], 'Menilai sesuatu sebagai hal yang mengganggu dan bikin kesal.'],
  [['takut', 'ngeri', 'trauma'], 'Ungkapan langsung rasa takut terhadap sesuatu yang mengancam.'],
  [['khawatir', 'cemas', 'was', 'waswas', 'gelisah'], 'Menunjukkan rasa waswas terhadap sesuatu yang belum pasti.'],
  [['panik', 'deg'], 'Menggambarkan rasa tegang atau gugup.'],
  [['senang', 'seneng', 'bahagia', 'gembira'], 'Ungkapan langsung rasa senang.'],
  [['puas'], 'Menunjukkan harapan yang terpenuhi.'],
  [['makasih', 'terima', 'syukur', 'bersyukur'], 'Ucapan terima kasih atau syukur yang menandakan perasaan positif.'],
  [['lega'], 'Menandakan beban atau kekhawatiran yang sudah hilang.'],
  [['sayang', 'cinta'], 'Ungkapan langsung rasa sayang kepada seseorang atau sesuatu.'],
  [['kangen', 'rindu'], 'Menunjukkan rasa rindu ingin bertemu atau bersama.'],
  [['suka', 'favorit'], 'Menunjukkan rasa suka atau ketertarikan yang kuat.'],
  [['sedih', 'pilu'], 'Ungkapan langsung rasa sedih.'],
  [['kecewa'], 'Menunjukkan harapan yang tidak terwujud.'],
  [['nangis', 'menangis'], 'Menggambarkan kesedihan yang sampai membuat menangis.'],
  [['hampa'], 'Menggambarkan perasaan kosong, biasanya setelah kehilangan.'],
  [['menyesal'], 'Menunjukkan penyesalan atas sesuatu yang sudah terjadi.'],
  [['jadwal', 'tanggal', 'jam', 'hari', 'semester'], 'Keterangan waktu atau jadwal yang bersifat informasi.'],
  [['merinding'], 'Menggambarkan rasa ngeri sampai bulu kuduk berdiri.'],
  [['ngakak', 'kocak', 'wkwk', 'wkwkwk'], 'Menunjukkan sesuatu yang sangat lucu sampai membuat tertawa.'],
  [['relate'], 'Menunjukkan konten terasa dekat dengan pengalaman pribadi penonton.'],
  [['clickbait'], 'Judul atau isi konten yang tidak sesuai harapan, sering membuat penonton kesal.'],
  [['settingan'], 'Tuduhan bahwa konten dibuat-buat, biasanya disertai rasa kesal.'],
  [['lagu', 'judul', 'link', 'lokasi'], 'Pertanyaan atau permintaan informasi tentang isi konten.'],
]

function hasAny(tokens, list) {
  return tokens.some((t) => list.includes(t))
}

/** Penjelasan singkat kenapa sebuah kata/frasa mendorong emosi tertentu. */
export function describeReason(phrase, emotion) {
  const tokens = phrase.toLowerCase().split(/[\s-]+/)
  const nama = emotionInfo(emotion).nama.toLowerCase()

  if (/\p{Extended_Pictographic}/u.test(phrase)) {
    return `Emoji yang biasa dipakai untuk mengungkapkan rasa ${nama}.`
  }

  const khusus = ARTI_KATA.find(([words]) => hasAny(tokens, words))
  if (khusus) return khusus[1]
  if (emotion !== 'neutral' && hasAny(tokens, KATA_PERASAAN[emotion] ?? [])) {
    return `Kata yang secara langsung mengungkapkan rasa ${nama}.`
  }
  if (hasAny(tokens, KATA_SITUASI[emotion] ?? [])) {
    return ARTI_SITUASI[emotion]
  }
  if (hasAny(tokens, KATA_PENGUAT)) {
    return 'Kata penguat yang membuat perasaan dalam kalimat terdengar lebih kuat.'
  }
  if (emotion === 'neutral') return ARTI_SITUASI.neutral
  return `Kata ini sering muncul pada komentar yang mengungkapkan ${MAKNA[emotion]}.`
}

// Pecah teks menjadi potongan biasa dan potongan yang perlu disorot.
export function highlightParts(text, words = []) {
  const clean = words.filter(Boolean).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  if (!clean.length) return [{ text, hit: false }]
  const re = new RegExp(`(?<![\\p{L}\\p{N}])(${clean.join('|')})(?![\\p{L}\\p{N}])`, 'giu')
  const parts = []
  let last = 0
  for (const m of text.matchAll(re)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), hit: false })
    parts.push({ text: m[0], hit: true })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last), hit: false })
  return parts
}
