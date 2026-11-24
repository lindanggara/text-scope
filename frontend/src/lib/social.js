// Fitur khusus komentar media sosial: waktu, likes, emoji, dan hashtag.
import { EMOTIONS } from './emotions.js'

// ---------- Tebak kolom dari nama kolom file ekspor ----------
const TIME_NAMES = ['waktu', 'tanggal', 'time', 'date', 'datetime', 'timestamp', 'createtime', 'createtimeiso',
  'created_at', 'createdat', 'publishedat', 'published_at', 'posted_at', 'jam']
const LIKES_NAMES = ['likes', 'like', 'likecount', 'likescount', 'like_count', 'diggcount', 'jumlah_like', 'suka']

function norm(c) {
  return String(c).toLowerCase().replace(/[\s-]/g, '')
}

export function guessTimeColumn(columns) {
  return columns.find((c) => TIME_NAMES.includes(norm(c))) ?? columns.find((c) => /time|date|waktu|tanggal/.test(norm(c))) ?? ''
}

export function guessLikesColumn(columns) {
  return columns.find((c) => LIKES_NAMES.includes(norm(c))) ?? columns.find((c) => /like|digg/.test(norm(c))) ?? ''
}

// ---------- Baca nilai waktu dan likes ----------
/** Ubah berbagai format waktu jadi angka milidetik. null kalau tidak terbaca. */
export function parseTime(v) {
  if (v === null || v === undefined || v === '') return null
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.getTime()
  if (typeof v === 'number' || /^\d{9,13}$/.test(String(v).trim())) {
    const n = Number(v)
    if (n > 1e12) return n // milidetik
    if (n > 1e9) return n * 1000 // detik (mis. createTime TikTok)
    return null
  }
  const s = String(v).trim()
  // 21/11/2026 19:05 atau 21-11-2026 19:05
  const dmy = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?/)
  if (dmy) {
    const [, d, m, y, h = '0', mi = '0', se = '0'] = dmy
    const t = new Date(+y, +m - 1, +d, +h, +mi, +se).getTime()
    return Number.isNaN(t) ? null : t
  }
  // 2026-11-21 19:05 / 2026-11-21T19:05:00Z
  const t = Date.parse(/^\d{4}-\d{2}-\d{2} \d/.test(s) ? s.replace(' ', 'T') : s)
  return Number.isNaN(t) ? null : t
}

export function parseLikes(v) {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'number') return v
  const s = String(v).trim().toLowerCase().replace(/\s/g, '')
  const m = s.match(/^([\d.,]+)(rb|k|jt|m)?$/)
  if (!m) return null
  let n = Number(m[2] ? m[1].replace(',', '.') : m[1].replace(/[.,]/g, ''))
  if (m[2] === 'rb' || m[2] === 'k') n *= 1e3
  if (m[2] === 'jt' || m[2] === 'm') n *= 1e6
  return Number.isFinite(n) ? Math.round(n) : null
}

/**
 * Tempelkan waktu & likes dari baris file ke hasil analisis.
 * Backend melewati baris yang komentarnya kosong, jadi baris kosong juga dilewati di sini
 * supaya urutannya sama. Kalau jumlahnya tidak cocok, data tambahan tidak dipakai.
 */
export function attachSocialData(results, rows, { textColumn, timeColumn, likesColumn }) {
  if (!timeColumn && !likesColumn) return { results, ok: false }
  const src = rows.filter((r) => r[textColumn] !== null && r[textColumn] !== undefined && String(r[textColumn]).trim() !== '')
  if (src.length !== results.length) return { results, ok: false }
  return {
    ok: true,
    results: results.map((r, i) => ({
      ...r,
      time: timeColumn ? parseTime(src[i][timeColumn]) : null,
      likes: likesColumn ? parseLikes(src[i][likesColumn]) : null,
    })),
  }
}

// ---------- Tren per waktu ----------
const HOUR = 3600e3
const DAY = 24 * HOUR

function bucketStart(ts, unit) {
  const d = new Date(ts)
  if (unit === 'hour') d.setMinutes(0, 0, 0)
  else {
    d.setHours(0, 0, 0, 0)
    if (unit === 'week') d.setDate(d.getDate() - ((d.getDay() + 6) % 7)) // mulai Senin
  }
  return d.getTime()
}

function labelOf(ts, unit) {
  const d = new Date(ts)
  const tgl = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  if (unit === 'hour') return `${tgl} ${String(d.getHours()).padStart(2, '0')}.00`
  if (unit === 'week') return `Minggu ${tgl}`
  return tgl
}

/** Hitung jumlah komentar tiap emosi per jam / hari / minggu (dipilih otomatis). */
export function buildTrend(results) {
  const timed = results.filter((r) => r.time)
  if (timed.length < 3) return null
  const min = Math.min(...timed.map((r) => r.time))
  const max = Math.max(...timed.map((r) => r.time))
  const span = max - min
  const unit = span <= 3 * DAY ? 'hour' : span <= 90 * DAY ? 'day' : 'week'
  const step = unit === 'hour' ? HOUR : unit === 'day' ? DAY : 7 * DAY

  const buckets = new Map()
  for (let t = bucketStart(min, unit); t <= max; t = bucketStart(t + step + 60e3, unit)) {
    buckets.set(t, Object.fromEntries(EMOTIONS.map((e) => [e, 0])))
    if (buckets.size > 400) break
  }
  for (const r of timed) {
    const b = buckets.get(bucketStart(r.time, unit))
    if (b && b[r.emotion] !== undefined) b[r.emotion]++
  }
  const points = [...buckets.entries()].map(([ts, counts]) => ({ ts, label: labelOf(ts, unit), ...counts }))
  const unitName = { hour: 'jam', day: 'hari', week: 'minggu' }[unit]
  return { unit, unitName, points, timedCount: timed.length }
}

export function peakOf(trend, emotion) {
  if (!trend) return null
  const best = trend.points.reduce((a, p) => (p[emotion] > (a?.[emotion] ?? 0) ? p : a), null)
  return best && best[emotion] > 0 ? { label: best.label, count: best[emotion] } : null
}

// ---------- Komentar paling disukai ----------
export function topLiked(results, emotion, n = 3) {
  return results
    .filter((r) => r.emotion === emotion && r.likes !== null && r.likes !== undefined)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, n)
}

// ---------- Emoji & hashtag ----------
const EMOJI_RE = /\p{Extended_Pictographic}(?:️|‍\p{Extended_Pictographic})*/gu
const HASHTAG_RE = /#[\p{L}\p{N}_]{2,}/gu

function countMatches(texts, re, lower = false) {
  const counts = new Map()
  for (const t of texts) {
    for (const m of t.matchAll(re)) {
      const k = lower ? m[0].toLowerCase() : m[0]
      counts.set(k, (counts.get(k) ?? 0) + 1)
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, count }))
}

export function emojiAndHashtags(results, emotion) {
  const texts = results.filter((r) => r.emotion === emotion).map((r) => r.text)
  return {
    emoji: countMatches(texts, EMOJI_RE).slice(0, 8),
    hashtags: countMatches(texts, HASHTAG_RE, true).slice(0, 8),
  }
}

export function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
