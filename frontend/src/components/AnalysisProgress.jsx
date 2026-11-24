import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import Owl from './Owl.jsx'

const STEPS = [
  { label: 'Membaca file', note: 'Mengambil komentar dari kolom yang dipilih' },
  { label: 'Menyensor data pribadi', note: 'Username, nomor telepon, dan NIM' },
  { label: 'Mendeteksi emosi', note: 'Menentukan emosi setiap komentar' },
  { label: 'Mencari topik pemicu', note: 'Mengelompokkan kata yang sering muncul bersama' },
]

/**
 * Layar proses saat file dianalisis. Backend memproses semuanya dalam satu permintaan,
 * jadi langkah-langkah ini maju berdasarkan waktu dan langkah terakhir menunggu sampai selesai.
 */
export default function AnalysisProgress({ open, slow, total, privacyShield }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!open) { setStep(0); return undefined }
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 1100)
    return () => clearInterval(t)
  }, [open])

  if (!open) return null
  const steps = privacyShield ? STEPS : STEPS.filter((_, i) => i !== 1)
  const current = Math.min(step, steps.length - 1)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2F2A3D]/40 p-4 backdrop-blur-sm">
      <div role="status" aria-live="polite" className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgba(47,42,61,0.25)]">
        <div className="flex items-center gap-4">
          <Owl size={72} className="motion-safe:animate-bounce motion-safe:[animation-duration:1.6s]" />
          <div>
            <p className="text-lg font-black">Sedang menganalisis…</p>
            <p className="text-sm text-muted">{total ? `${total.toLocaleString('id-ID')} komentar` : 'Mohon tunggu sebentar'}</p>
          </div>
        </div>
        <ol className="mt-5 flex flex-col gap-3">
          {steps.map((s, i) => {
            const done = i < current
            const active = i === current
            return (
              <li key={s.label} className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                    done ? 'bg-[#1BAF7A] text-white' : active ? 'bg-lilac text-primary' : 'bg-page text-[#9A93B0]'
                  }`}
                >
                  {done ? <Check size={16} aria-hidden="true" /> : active ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : i + 1}
                </span>
                <span>
                  <span className={`block font-extrabold ${done || active ? 'text-ink' : 'text-[#9A93B0]'}`}>{s.label}</span>
                  <span className="block text-[13px] text-muted">{s.note}</span>
                </span>
              </li>
            )
          })}
        </ol>
        {slow && (
          <p className="mt-5 rounded-2xl bg-butter px-4 py-3 text-sm font-semibold text-[#5C4600]">
            Masih memproses… Kalau server baru bangun atau filenya besar, ini bisa butuh hingga 1 menit.
          </p>
        )}
      </div>
    </div>
  )
}
