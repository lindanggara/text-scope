import { useState } from 'react'
import ReportButton from './ReportButton.jsx'
import { AlertTriangle, Lightbulb, Loader2, Sparkles, Trash2 } from 'lucide-react'
import Owl from './Owl.jsx'
import { Card, Dot, EmotionChip, InfoTip } from './ui.jsx'
import { EMOTIONS, emotionInfo, LOW_CONFIDENCE, tint } from '../lib/emotions.js'
import { countWords, MAX_WORDS, MIN_WORDS, predictText, USE_MOCK } from '../lib/api.js'
import { describeReason, explainResult } from '../lib/explain.js'

const EXAMPLES = [
  'Kesel banget, udah nonton sampai habis ternyata cuma clickbait 😤',
  'Sumpah ini konten paling lucu minggu ini, makasih kak udah bikin hariku 😂',
  'Merinding parah liat part terakhirnya, takut nggak bisa tidur',
]

export default function TextAnalyzer() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [history, setHistory] = useState([])

  const words = countWords(text)
  const tooShort = words > 0 && words < MIN_WORDS
  const tooLong = words > MAX_WORDS
  const canSubmit = words >= MIN_WORDS && !tooLong && !loading

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setError('')
    setLoading(true)
    try {
      const res = await predictText(text.trim())
      setResult(res)
      setHistory((h) => [{ ...res, at: Date.now() }, ...h].slice(0, 5))
    } catch (err) {
      setError(err.message || 'Deteksi gagal. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const info = result ? emotionInfo(result.emotion) : null
  const explanation = result ? explainResult(result) : null
  const probs = result?.probabilities
    ? EMOTIONS.map((e) => ({ emotion: e, value: result.probabilities[e] ?? 0 })).sort((a, b) => b.value - a.value)
    : null

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-stretch gap-5">
        <Card className="flex min-w-0 flex-[2_1_480px] flex-col gap-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="teks" className="text-xl font-black">Tulis komentar yang mau dicek</label>
              <p className="text-sm text-muted">Satu komentar dari TikTok, Instagram, YouTube, atau media sosial lain, {MIN_WORDS}–{MAX_WORDS} kata. Username dan data pribadi tetap disensor otomatis.</p>
            </div>
            <textarea
              id="teks"
              rows={6}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Contoh: Kontennya bagus banget, tapi kenapa endingnya bikin sedih sih 😭"
              aria-describedby="hitung-kata"
              className={`min-h-40 w-full resize-y rounded-[20px] border-[1.5px] bg-page px-4 py-3.5 text-[16px] leading-relaxed outline-none focus:border-primary ${tooLong ? 'border-[#E34948]' : 'border-[#D6CCF4]'}`}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span id="hitung-kata" aria-live="polite" className={`text-sm font-extrabold ${tooLong ? 'text-[#C93B3A]' : 'text-muted'}`}>
                {words} / {MAX_WORDS} kata
                {tooShort && ` · minimal ${MIN_WORDS} kata`}
                {tooLong && ` · kelebihan ${words - MAX_WORDS} kata`}
              </span>
              <div className="flex gap-2">
                {text && (
                  <button type="button" onClick={() => { setText(''); setError('') }} className="min-h-11 cursor-pointer rounded-full bg-lilac px-4 text-sm font-extrabold text-primary">
                    Bersihkan
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-6 font-black text-white shadow-button transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-[#E6E1F2] disabled:text-[#6E6886] disabled:shadow-none"
                >
                  {loading ? <><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Mendeteksi…</> : <><Sparkles size={18} aria-hidden="true" /> Deteksi emosi</>}
                </button>
              </div>
            </div>
          </form>

          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-extrabold tracking-wide text-muted uppercase">Coba contoh</span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button key={ex} type="button" onClick={() => { setText(ex); setError('') }} className="cursor-pointer rounded-xl bg-page px-3 py-2 text-left text-sm font-semibold hover:bg-lilac">
                  “{ex}”
                </button>
              ))}
            </div>
          </div>

          {error && <div role="alert" className="rounded-2xl bg-[#FDE3E3] px-4 py-3 font-bold text-[#A42F2E]">{error}</div>}
          {USE_MOCK && <p className="rounded-xl bg-butter px-3 py-2 text-center text-xs font-bold text-[#6B5200]">Mode data dummy aktif (VITE_USE_MOCK=true)</p>}
        </Card>

        <Card className="flex min-w-0 flex-[1_1_320px] flex-col gap-4" aria-live="polite">
          <h2 className="text-xl font-black">Hasil deteksi</h2>
          {!result && !loading && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-[22px] bg-page px-6 py-8 text-center">
              <Owl size={110} />
              <p className="font-bold text-muted">Hasil deteksi emosi akan muncul di sini.</p>
            </div>
          )}
          {loading && (
            <div className="flex flex-1 items-center justify-center gap-2 rounded-[22px] bg-page py-16 font-bold text-muted">
              <Loader2 size={20} className="animate-spin" aria-hidden="true" /> Membaca emosinya…
            </div>
          )}
          {result && !loading && (
            <>
              <div className="flex flex-wrap items-center gap-4 rounded-[22px] p-4" style={{ background: tint(result.emotion, '24') }}>
                <span className="flex size-16 shrink-0 items-center justify-center rounded-[20px] bg-white shadow-soft">
                  <span className="size-6 rounded-full" style={{ background: info.color }} />
                </span>
                <div className="min-w-0">
                  <span className="text-[13px] font-extrabold tracking-wide text-muted uppercase">Emosi terdeteksi</span>
                  <p className="text-[30px] leading-tight font-black">{info.nama}</p>
                  <p className="text-sm font-bold text-muted">Keyakinan {Math.round(result.confidence * 100)}%</p>
                </div>
                <div className="ml-auto self-start">
                  <ReportButton key={`${result.text}|${result.emotion}`} text={result.text} predicted={result.emotion} confidence={result.confidence} source="teks" />
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-[22px] bg-page p-4">
                <span className="flex items-center gap-2 text-[13px] font-extrabold tracking-wide text-muted uppercase">
                  <Lightbulb size={16} aria-hidden="true" /> Kenapa {info.nama.toLowerCase()}?
                </span>
                <p className="text-[15px] leading-relaxed">{explanation.main}</p>
                {explanation.extra && <p className="text-[15px] leading-relaxed text-muted">{explanation.extra}</p>}
                {result.reasons?.length > 0 && (
                  <ul className="mt-1 flex flex-col gap-2">
                    {result.reasons.map((w, i) => (
                      <li key={w} className="flex flex-col gap-1 rounded-xl bg-white px-3 py-2.5">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="rounded-md px-2 py-0.5 text-sm font-black" style={{ background: tint(result.emotion, '40') }}>{w}</span>
                          <span className="text-xs font-extrabold text-muted">{i === 0 ? 'Pemicu utama' : 'Pemicu pendukung'}</span>
                        </span>
                        <span className="text-sm leading-relaxed text-muted">{describeReason(w, result.emotion)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {result.confidence < LOW_CONFIDENCE && (
                <p className="flex items-start gap-2 rounded-2xl bg-butter px-3.5 py-2.5 text-sm font-semibold text-[#5C4600]">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  Model kurang yakin. Komentar ini mungkin mengandung lebih dari satu emosi atau bernada sarkas.
                </p>
              )}

              {probs && (
                <div className="flex flex-col gap-2.5">
                  <span className="flex items-center gap-1 text-[13px] font-extrabold tracking-wide text-muted uppercase">Peluang tiap emosi <InfoTip label="Apa itu peluang tiap emosi?" text={'Peluang setiap emosi menurut model. Emosi dengan peluang tertinggi dipilih sebagai hasil deteksi.'} align="left" /></span>
                  {probs.map((p) => (
                    <div key={p.emotion} className="flex items-center gap-2.5 text-sm">
                      <Dot color={emotionInfo(p.emotion).color} />
                      <span className="w-14 font-extrabold">{emotionInfo(p.emotion).nama}</span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-[#F0ECF8]">
                        <span className="block h-full rounded-full" style={{ width: `${p.value * 100}%`, background: emotionInfo(p.emotion).color }} />
                      </span>
                      <span className="w-10 text-right font-bold text-muted">{Math.round(p.value * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}

            </>
          )}
        </Card>
      </div>

      {history.length > 0 && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">Riwayat cek terakhir</h2>
            <button type="button" onClick={() => setHistory([])} className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-extrabold text-muted hover:bg-page">
              <Trash2 size={16} aria-hidden="true" /> Hapus
            </button>
          </div>
          <ul className="flex flex-col divide-y divide-[#F0ECF8]">
            {history.map((h) => (
              <li key={h.at} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="min-w-0 flex-[1_1_260px] text-[15px]">{h.text}</span>
                <EmotionChip emotion={h.emotion} />
                <span className="w-12 text-right text-sm font-extrabold text-muted">{Math.round(h.confidence * 100)}%</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
