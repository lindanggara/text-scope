import { mockAnalyze, mockPredict } from './mockApi.js'
import { EMOTIONS } from './emotions.js'
import { extOf } from './readFile.js'
import { rowsToCsvFile } from './templates.js'
import { getAccessToken } from '../context/AuthContext.jsx'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'

// Batas jumlah kata untuk mode "Ketik teks" (samakan dengan MIN_WORDS / MAX_WORDS di backend).
export const MIN_WORDS = 3
export const MAX_WORDS = 100

export function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0
}

/**
 * Cek apakah backend sudah siap: GET /health.
 * Server gratis (Render) "tidur" kalau lama tidak dipakai; permintaan pertama membangunkannya.
 */
export async function checkHealth(timeoutMs = 8000) {
  if (USE_MOCK) return true
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API_URL}/health`, { signal: ctrl.signal })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

// Pastikan keenam emosi selalu ada, walau jumlahnya 0, supaya grafik konsisten.
function normalize(data) {
  const byEmotion = Object.fromEntries((data.distribution ?? []).map((d) => [d.emotion, d]))
  const distribution = EMOTIONS
    .map((e) => byEmotion[e] ?? { emotion: e, count: 0, percentage: 0 })
    .sort((a, b) => b.count - a.count)
  const topics = Object.fromEntries(EMOTIONS.map((e) => [e, data.topics?.[e] ?? []]))
  return { ...data, distribution, topics, results: data.results ?? [] }
}

// Kirim request ke backend dan ambil pesan error dari FastAPI ({ "detail": ... }).
// Token login ikut dikirim supaya backend tahu siapa yang memanggil dan apa role-nya.
async function request(path, options = {}) {
  let res
  try {
    const token = await getAccessToken()
    const headers = { ...(options.headers ?? {}) }
    if (token) headers.Authorization = `Bearer ${token}`
    res = await fetch(`${API_URL}${path}`, { ...options, headers })
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Coba lagi beberapa saat lagi.')
  }
  let data = null
  try {
    data = await res.json()
  } catch {
    // respons bukan JSON
  }
  if (!res.ok) {
    const detail = Array.isArray(data?.detail) ? data.detail.map((d) => d.msg).join(', ') : data?.detail
    throw new Error(detail ?? data?.message ?? `Permintaan gagal (kode ${res.status}).`)
  }
  return data
}

/**
 * Analisis file: POST /analyze (multipart/form-data)
 *   file           : File .csv / .xlsx (file .txt diubah ke .csv dulu)
 *   text_column    : nama kolom teks
 *   privacy_shield : "true" / "false"
 */
export async function analyzeFile({ file, rows, textColumn, privacyShield }) {
  if (USE_MOCK) {
    return normalize(await mockAnalyze({ rows, textColumn, privacyShield }))
  }
  // Backend hanya menerima .csv/.xlsx, jadi file .txt dikirim sebagai CSV.
  const upload = extOf(file.name) === '.txt' ? rowsToCsvFile(rows, file.name) : file
  const form = new FormData()
  form.append('file', upload)
  form.append('text_column', textColumn)
  form.append('privacy_shield', String(privacyShield))
  const data = await request('/analyze', { method: 'POST', body: form })
  if (data?.status !== 'success') throw new Error(data?.message ?? 'Analisis gagal.')
  return normalize(data)
}

/**
 * Analisis satu teks: POST /predict  { "text": "..." }
 * Respons: { label, confidence, probabilities, reasons, text_anonymized }
 */
export async function predictText(text) {
  const data = USE_MOCK
    ? await mockPredict(text)
    : await request('/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
  return {
    emotion: data.label,
    confidence: data.confidence,
    probabilities: data.probabilities ?? null,
    reasons: data.reasons ?? [],
    text: data.text_anonymized ?? text,
  }
}

/**
 * Info model untuk halaman admin: GET /admin/model-info (khusus admin).
 */
export async function getModelInfo() {
  if (USE_MOCK) throw new Error('Info model hanya tersedia saat dashboard terhubung ke backend (VITE_USE_MOCK=false).')
  return request('/admin/model-info')
}

export async function getModels() {
  return request('/admin/models')
}

export async function setActiveModel(id) {
  return request('/admin/models/aktif', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id }),
  })
}