import { useEffect, useRef, useState } from 'react'
import { Check, Flag, Loader2, X } from 'lucide-react'
import { EMOTIONS, emotionInfo } from '../lib/emotions.js'
import { sendReport } from '../lib/db.js'
import { pesanError } from '../lib/supabase.js'
import { Dot, EmotionChip } from './ui.jsx'

/**
 * Tombol "Emosinya salah?": pengguna memilih emosi yang menurutnya benar,
 * lalu laporan masuk ke admin (menu Laporan Prediksi Salah).
 */
export default function ReportButton({ text, predicted, confidence, source = 'file', analysisId, compact = false }) {
  const [open, setOpen] = useState(false)
  const [choice, setChoice] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    dialogRef.current?.querySelector('button')?.focus()
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  async function submit() {
    if (!choice) return
    setBusy(true)
    setError('')
    try {
      await sendReport({ text, predicted, correct: choice, confidence, source, analysisId, note })
      setSent(true)
      setOpen(false)
    } catch (err) {
      setError(pesanError(err, 'Laporan gagal dikirim. Coba lagi.'))
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <span className="inline-flex items-center gap-1 text-[13px] font-extrabold text-[#2E8A62]">
        <Check size={14} aria-hidden="true" /> Dilaporkan
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Laporkan kalau emosinya salah"
        className={`inline-flex cursor-pointer items-center gap-1 rounded-full font-extrabold text-muted transition hover:bg-lilac hover:text-primary ${compact ? 'min-h-8 px-2 text-[12px]' : 'min-h-10 px-3 text-[13px]'}`}
      >
        <Flag size={compact ? 13 : 15} aria-hidden="true" /> Emosinya salah?
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-4" onClick={() => setOpen(false)}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="report-title"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-[28px] bg-white p-6 shadow-soft sm:rounded-[28px]"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 id="report-title" className="text-xl font-black">Laporkan prediksi salah</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup" className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl hover:bg-lilac">
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <blockquote className="line-clamp-4 rounded-2xl bg-page px-4 py-3 text-[15px] leading-relaxed">“{text}”</blockquote>
            <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
              Terdeteksi sebagai <EmotionChip emotion={predicted} />
            </p>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-extrabold">Menurutmu emosi yang benar:</legend>
              <div className="grid grid-cols-2 gap-2">
                {EMOTIONS.filter((e) => e !== predicted).map((e) => (
                  <label
                    key={e}
                    className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border-2 px-3 font-bold transition ${choice === e ? 'border-primary bg-lilac' : 'border-line hover:bg-page'}`}
                  >
                    <input type="radio" name="emosi-benar" value={e} checked={choice === e} onChange={() => setChoice(e)} className="sr-only" />
                    <Dot color={emotionInfo(e).color} /> {emotionInfo(e).nama}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex flex-col gap-1.5 text-sm font-extrabold">
              Catatan (opsional)
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={300}
                rows={2}
                placeholder="Misalnya: ini sindiran, bukan senang"
                className="rounded-2xl border-2 border-line px-3 py-2 text-[15px] font-semibold outline-none focus:border-primary"
              />
            </label>
            {error && <p role="alert" className="rounded-2xl bg-pink px-4 py-3 text-sm font-bold text-[#A3324F]">{error}</p>}
            <p className="text-[13px] text-muted">Laporan dikirim ke admin TextScope beserta teks komentar di atas.</p>
            <button
              type="button"
              disabled={!choice || busy}
              onClick={submit}
              className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy && <Loader2 size={18} className="animate-spin" aria-hidden="true" />} Kirim laporan
            </button>
          </div>
        </div>
      )}
    </>
  )
}
