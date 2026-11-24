import { emotionInfo } from './emotions.js'
import { KATA_PENGUAT, KATA_PERASAAN } from './explain.js'

// Kata yang tidak menjelaskan "terkait apa" (kata perasaan, penguat, kata sambung).
const BUKAN_TOPIK = new Set([
  ...Object.values(KATA_PERASAAN).flat(),
  ...KATA_PENGUAT,
  'padahal', 'sampai', 'sudah', 'udah', 'lagi', 'juga', 'biar', 'soalnya', 'pas', 'tadi', 'terus',
  'malah', 'cuma', 'kali', 'rasanya', 'sama', 'bikin', 'jadi', 'nggak', 'tidak', 'belum', 'mau',
  'ada', 'dari', 'buat', 'kak', 'ya', 'deh', 'kok', 'nih', 'loh', 'dong',
  'mana', 'semoga', 'liat', 'lihat', 'kayak', 'gitu', 'gini', 'emang', 'pengen', 'bisa', 'apa',
  'yuk', 'baru', 'lama', 'naik', 'nonton', 'kali', 'pernah', 'banget', 'aku', 'kamu', 'dia',
  'liatnya', 'fyp', 'viral', 'pakai', 'pake',
])

// Ambil kata-kata isi dari topik (nama topik + kata kunci), urut sesuai bobot.
function kataTopik(list) {
  const words = list.slice(0, 2).flatMap((t) => [...t.topic.split(',').map((w) => w.trim()), ...(t.keywords ?? [])])
  return [...new Set(words)].filter((w) => w && !BUKAN_TOPIK.has(w.toLowerCase()))
}

// Kalimat lanjutan untuk tiap emosi: menjelaskan "terkait apa".
const ISI = {
  anger: 'Kekesalan ini umumnya berkaitan dengan',
  fear: 'Kekhawatiran ini umumnya berkaitan dengan',
  joy: 'Rasa senang ini umumnya muncul karena',
  love: 'Rasa sayang ini umumnya ditujukan pada',
  sad: 'Kesedihan ini umumnya dipicu oleh',
  neutral: 'Komentar netral ini umumnya berisi informasi seputar',
}

// Pembuka kalimat sesuai urutan emosi.
const PEMBUKA = [
  { depan: 'Emosi yang paling banyak muncul adalah ', belakang: '.' },
  { depan: 'Di urutan kedua ada emosi ', belakang: '.' },
  { depan: 'Sementara itu, emosi ', belakang: ' juga cukup terasa.' },
]

const persen = (p) => `${Number(p).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`

function joinWords(words, quote = false) {
  const w = quote ? words.map((x) => `“${x}”`) : words
  if (w.length <= 1) return w.join('')
  if (w.length === 2) return `${w[0]} dan ${w[1]}`
  return `${w.slice(0, -1).join(', ')}, dan ${w[w.length - 1]}`
}

function shorten(text, max = 90) {
  const t = text.trim().replace(/[.!?,;:]+$/, '')
  return t.length > max ? t.slice(0, max).trimEnd() + '…' : t
}

/**
 * Susun ringkasan detail dari hasil analisis file:
 * 3 emosi teratas, masing-masing dengan topik + kata kunci, atau contoh teks
 * kalau topiknya belum bisa dicari (datanya terlalu sedikit).
 */
export function buildInsight({ distribution, topics, results, summary }) {
  const items = distribution
    .filter((d) => d.count > 0)
    .slice(0, 3)
    .map((d, i) => {
      const nama = emotionInfo(d.emotion).nama.toLowerCase()
      const list = topics?.[d.emotion] ?? []
      const words = kataTopik(list)
      const heads = words.slice(0, 2)
      const kata = words.slice(2, 5)

      let isi
      if (heads.length) {
        isi = `${ISI[d.emotion]} ${joinWords(heads)}`
        if (kata.length === 1) isi += `, ditandai kata ${joinWords(kata, true)}`
        else if (kata.length > 1) isi += `, ditandai kata-kata seperti ${joinWords(kata, true)}`
        isi += '.'
      } else {
        const contoh = results
          .filter((r) => r.emotion === d.emotion)
          .sort((a, b) => b.confidence - a.confidence)[0]
        isi = contoh ? `Salah satu contohnya: “${shorten(contoh.text)}”.` : ''
      }

      const { depan, belakang } = PEMBUKA[i]
      return { emotion: d.emotion, pembuka: depan, label: `${nama} (${persen(d.percentage)})`, rest: `${belakang} ${isi}`.trimEnd() }
    })

  // Catatan penutup: proporsi emosi negatif atau positif.
  const pct = Object.fromEntries(distribution.map((d) => [d.emotion, d.percentage]))
  const negatif = Math.round(((pct.anger ?? 0) + (pct.fear ?? 0) + (pct.sad ?? 0)) * 10) / 10
  const positif = Math.round(((pct.joy ?? 0) + (pct.love ?? 0)) * 10) / 10
  let catatan = ''
  if (negatif >= 50) {
    catatan = `Secara keseluruhan, lebih dari separuh komentar (${persen(negatif)}) bernada negatif, yaitu marah, takut, atau sedih, sehingga perlu segera mendapat perhatian.`
  } else if (negatif >= 30) {
    catatan = `Secara keseluruhan, ${persen(negatif)} komentar bernada negatif (marah, takut, atau sedih), sehingga perlu mendapat perhatian.`
  } else if (positif >= 50) {
    catatan = `Secara keseluruhan, sebagian besar komentar (${persen(positif)}) bernada positif, yaitu senang atau cinta.`
  }
  return { items, catatan }
}
