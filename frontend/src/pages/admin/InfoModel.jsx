import { useEffect, useState } from 'react'
import { BrainCircuit, Loader2 } from 'lucide-react'
import { Card, Dot, PageHeader } from '../../components/ui.jsx'
import { getModelInfo } from '../../lib/api.js'
import { emotionInfo } from '../../lib/emotions.js'

function score(v) {
  return v == null ? '—' : Number(v).toLocaleString('id-ID', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
}

function Metric({ label, value, note, bg }) {
  return (
    <div className="flex flex-col gap-1 rounded-[22px] p-4" style={{ background: bg }}>
      <span className="text-sm font-extrabold text-muted">{label}</span>
      <span className="text-[28px] leading-tight font-black tabular-nums">{score(value)}</span>
      {note && <span className="text-[13px] text-muted">{note}</span>}
    </div>
  )
}

export default function InfoModel() {
  const [info, setInfo] = useState(null)
  const [error, setError] = useState('')
  const [imgOk, setImgOk] = useState(true)

  useEffect(() => {
    getModelInfo().then(setInfo).catch((err) => setError(err.message))
  }, [])

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Info Model" subtitle="Model yang sedang dipakai TextScope dan hasil evaluasinya." />
        <p role="alert" className="rounded-2xl bg-pink px-4 py-3 font-bold text-[#A3324F]">{error}</p>
      </div>
    )
  }
  if (!info) {
    return <p className="flex items-center gap-2 font-bold text-muted"><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Memuat info model…</p>
  }

  const m = info.metrics ?? {}
  const rt = info.runtime ?? {}
  const best = Math.max(...(info.comparison ?? []).map((c) => c.macro_f1_test ?? 0))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Info Model" subtitle="Model yang sedang dipakai TextScope dan hasil evaluasinya. Halaman ini khusus admin." />

      <Card className="flex flex-wrap items-start gap-5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-[18px] bg-lilac text-primary"><BrainCircuit size={28} aria-hidden="true" /></span>
        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2">
          <h2 className="text-2xl font-black">{info.active_model ?? rt.type}</h2>
          {info.description && <p className="leading-relaxed text-muted">{info.description}</p>}
          <p className="text-sm text-muted">
            {info.trained_by && <>Dilatih oleh <b className="text-ink">{info.trained_by}</b></>}
            {info.trained_at && <> · {info.trained_at}</>}
          </p>
          {rt.classes?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {rt.classes.map((c) => (
                <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-page px-3 py-1 text-sm font-bold">
                  <Dot color={emotionInfo(c).color} size={8} /> {emotionInfo(c).nama}
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Metric bg="#ECE6FB" label="Macro F1 (test)" value={m.macro_f1_test} note="dataset utama" />
        <Metric bg="#DFF3EA" label="Macro F1 (validasi)" value={m.macro_f1_valid} note="dataset utama" />
        <Metric bg="#FDE7DC" label="Macro F1 (EmoT)" value={m.macro_f1_emot} note="uji lintas domain (Twitter)" />
        <Metric bg="#FFF2D2" label="Recall (EmoT)" value={m.recall_emot} note="uji lintas domain" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h2 className="text-xl font-black">Perbandingan model</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[15px]">
              <thead>
                <tr className="border-b-2 border-line text-sm text-muted">
                  <th className="px-2 py-2.5 font-extrabold">Model</th>
                  <th className="px-2 py-2.5 text-right font-extrabold">F1 valid</th>
                  <th className="px-2 py-2.5 text-right font-extrabold">F1 test</th>
                  <th className="px-2 py-2.5 text-right font-extrabold">F1 EmoT</th>
                </tr>
              </thead>
              <tbody>
                {(info.comparison ?? []).map((c) => {
                  const active = c.model === info.active_model
                  return (
                    <tr key={c.model} className={`border-b border-line ${active ? 'bg-lilac/60' : ''}`}>
                      <td className="px-2 py-2.5 font-extrabold">
                        {c.model}
                        {active && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-black text-white">aktif</span>}
                        {c.pj && <span className="block text-xs font-semibold text-muted">PJ: {c.pj}</span>}
                      </td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{score(c.macro_f1_valid)}</td>
                      <td className={`px-2 py-2.5 text-right tabular-nums ${c.macro_f1_test === best ? 'font-black text-primary' : ''}`}>{score(c.macro_f1_test)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{score(c.macro_f1_emot)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {info.notes?.length > 0 && (
            <ul className="flex flex-col gap-1.5 rounded-2xl bg-page p-4 text-sm leading-relaxed text-muted">
              {info.notes.map((n) => <li key={n}>• {n}</li>)}
            </ul>
          )}
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-xl font-black">Confusion matrix</h2>
          {info.confusion_matrix_image && imgOk ? (
            <img
              src={info.confusion_matrix_image}
              alt={`Confusion matrix model ${info.active_model}`}
              onError={() => setImgOk(false)}
              className="w-full rounded-2xl border-2 border-line"
            />
          ) : (
            <p className="text-muted">Gambar confusion matrix belum tersedia.</p>
          )}
          <p className="text-sm text-muted">Baris = emosi sebenarnya, kolom = emosi tebakan model. Angka di diagonal adalah tebakan yang benar.</p>
        </Card>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="text-xl font-black">Detail teknis</h2>
        <dl className="grid grid-cols-1 gap-3 text-[15px] sm:grid-cols-2 xl:grid-cols-4">
          {(rt.steps ?? []).flatMap((s) =>
            s.features
              ? s.features.map((f) => (
                  <div key={f.name} className="rounded-2xl bg-page p-3.5">
                    <dt className="text-sm font-extrabold text-muted">Fitur “{f.name}”</dt>
                    <dd className="font-black">{f.type}{f.size ? ` · ${f.size.toLocaleString('id-ID')} fitur` : ''}</dd>
                  </div>
                ))
              : [
                  <div key={s.name} className="rounded-2xl bg-page p-3.5">
                    <dt className="text-sm font-extrabold text-muted">Klasifikasi “{s.name}”</dt>
                    <dd className="font-black">{s.type}{s.C != null ? ` · C = ${s.C}` : ''}</dd>
                  </div>,
                ],
          )}
          {rt.settings && (
            <div className="rounded-2xl bg-page p-3.5">
              <dt className="text-sm font-extrabold text-muted">Batas sistem</dt>
              <dd className="font-black">
                {rt.settings.max_rows?.toLocaleString('id-ID')} baris · {rt.settings.min_words}–{rt.settings.max_words} kata · {rt.settings.n_topics} topik
              </dd>
            </div>
          )}
        </dl>
      </Card>
    </div>
  )
}
