import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity, ArrowRight, ArrowRightLeft, Award, BrainCircuit, Calendar,
  CheckCircle2, Cpu, FileSpreadsheet, Gauge, Info, Layers, Loader2,
  SlidersHorizontal, Sparkles, UserCheck,
} from 'lucide-react'
import { Card, Dot } from '../../components/ui.jsx'
import { getModelInfo, getModels, setActiveModel } from '../../lib/api.js'
import { emotionInfo } from '../../lib/emotions.js'

function score(v) {
  return v == null
    ? '—'
    : Number(v).toLocaleString('id-ID', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
}

function Metric({ icon: Icon, label, value, note, bg, accent }) {
  return (
    <div
      className="group flex flex-col justify-between gap-3 rounded-[26px] border border-white/60 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft"
      style={{ background: bg }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-black tracking-wider text-[#4A4360] uppercase">{label}</span>
        <span
          className="flex size-9 items-center justify-center rounded-2xl bg-white/90 shadow-xs transition-transform duration-200 group-hover:scale-105"
          style={{ color: accent }}
        >
          <Icon size={17} strokeWidth={2.4} />
        </span>
      </div>
      <div>
        <div className="text-[30px] leading-none font-black text-ink tabular-nums">
          {score(value)}
        </div>
        {note && <span className="mt-1.5 block text-xs font-semibold text-[#5F5875]">{note}</span>}
      </div>
    </div>
  )
}

export default function InfoModel() {
  const [info, setInfo] = useState(null)
  const [registry, setRegistry] = useState(null)
  const [switchingId, setSwitchingId] = useState(null)
  const [toast, setToast] = useState(null)
  const [error, setError] = useState('')
  const [imgOk, setImgOk] = useState(true)

  async function loadAll() {
    try {
      const [infoRes, regRes] = await Promise.all([
        getModelInfo(),
        getModels().catch(() => null),
      ])
      setInfo(infoRes)
      setRegistry(regRes)
      setImgOk(true)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  async function handleQuickSwitch(modelId, modelName) {
    if (!modelId || switchingId) return
    setSwitchingId(modelId)
    setToast(null)
    try {
      await setActiveModel(modelId)
      setToast({ ok: true, text: `Model aktif berhasil diganti ke ${modelName}` })
      await loadAll()
    } catch (err) {
      setToast({ ok: false, text: err.message || 'Gagal mengganti model aktif' })
    } finally {
      setSwitchingId(null)
    }
  }

  if (error) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div>
          <h1 className="text-[28px] font-black text-ink">Info Model</h1>
          <p className="text-sm text-muted">Model yang sedang dipakai TextScope dan hasil evaluasinya.</p>
        </div>
        <p role="alert" className="rounded-2xl bg-[#FCE4EE] px-4 py-3.5 text-sm font-extrabold text-[#B33560]">
          {error}
        </p>
      </div>
    )
  }

  if (!info) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center gap-2 font-bold text-muted">
        <Loader2 size={20} className="animate-spin text-primary" aria-hidden="true" />
        <span>Memuat informasi model…</span>
      </div>
    )
  }

  const m = info.metrics ?? {}
  const rt = info.runtime ?? {}
  const bestTest = Math.max(...(info.comparison ?? []).map((c) => c.macro_f1_test ?? 0))
  const regModels = Array.isArray(registry?.model) ? registry.model : []

  // Susun tahap alur visual pipeline yang bersih (bebas [object Object])
  const pipelineStages = [
    { step: '01', name: 'Preprocessing', desc: 'Normalisasi & cleaning' },
    { step: '02', name: 'Ekstraksi Fitur', desc: rt.feat_char?.title !== 'Tidak digunakan' ? 'TF-IDF Word + Char' : 'TF-IDF Word' },
    { step: '03', name: 'Klasifikasi', desc: rt.type || info.active_model },
  ]

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-8">
      {/* Header Halaman */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-black tracking-tight text-ink">
            Info & Manajemen Model
          </h1>
          <p className="mt-1 text-sm font-medium text-muted">
            Pantau performa evaluasi model klasifikasi emosi dan beralih antar algoritma secara instan.
          </p>
        </div>

        <Link
          to="/admin/model/pilih"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-white no-underline shadow-button transition hover:opacity-95"
        >
          <SlidersHorizontal size={15} />
          <span>Mode Pilih Kartu</span>
        </Link>
      </div>

      {/* Notifikasi Toast saat Ganti Model */}
      {toast && (
        <div
          role="alert"
          className={`flex items-center gap-2.5 rounded-2xl px-4 py-3.5 text-sm font-extrabold shadow-soft ${
            toast.ok ? 'bg-[#DFF3EA] text-[#237451]' : 'bg-[#FCE4EE] text-[#B33560]'
          }`}
        >
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Hero Card: Model Aktif Saat Ini */}
      <Card className="relative overflow-hidden border border-line/70 bg-white p-6 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex min-w-0 flex-[1_1_420px] items-start gap-5">
            <span className="flex size-16 shrink-0 items-center justify-center rounded-[22px] bg-lilac text-primary shadow-xs">
              <BrainCircuit size={32} strokeWidth={2.2} aria-hidden="true" />
            </span>

            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-2xl font-black text-ink sm:text-[26px]">
                  {info.active_model ?? rt.type}
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DFF3EA] px-3 py-1 text-xs font-black text-[#237451]">
                  <span className="size-2 animate-pulse rounded-full bg-[#237451]" />
                  Sedang Aktif
                </span>
              </div>

              {info.description && (
                <p className="max-w-3xl text-sm leading-relaxed text-[#5A5372]">
                  {info.description}
                </p>
              )}

              {/* Metadata Trainer & Tanggal */}
              <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs font-bold text-muted">
                {info.trained_by && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-page px-3 py-1.5">
                    <UserCheck size={14} className="text-primary" />
                    <span>PJ: <b className="text-ink">{info.trained_by}</b></span>
                  </span>
                )}
                {info.trained_at && (
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-page px-3 py-1.5">
                    <Calendar size={14} className="text-primary" />
                    <span>Diperbarui <b className="text-ink">{info.trained_at}</b></span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-page px-3 py-1.5">
                  <Cpu size={14} className="text-primary" />
                  <span>Estimator: <b className="text-ink">{rt.type || 'Pipeline'}</b></span>
                </span>
              </div>
            </div>
          </div>

          {/* Pil 6 Target Emosi */}
          {rt.classes?.length > 0 && (
            <div className="flex flex-col gap-2 rounded-2xl bg-page/80 p-4 lg:max-w-xs">
              <span className="text-[11px] font-black tracking-wider text-muted uppercase">
                6 Kelas Emosi Terdeteksi
              </span>
              <div className="flex flex-wrap gap-1.5">
                {rt.classes.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line/80 bg-white px-2.5 py-1 text-xs font-extrabold text-ink shadow-2xs"
                  >
                    <Dot color={emotionInfo(c).color} size={8} /> {emotionInfo(c).nama}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 4 Kartu Metrik Utama */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={Award}
          bg="#ECE6FB"
          accent="#6B5DC2"
          label="Macro F1 (Test)"
          value={m.macro_f1_test}
          note="Evaluasi dataset utama"
        />
        <Metric
          icon={Gauge}
          bg="#DFF3EA"
          accent="#237451"
          label="Macro F1 (Validasi)"
          value={m.macro_f1_valid}
          note="Validasi silang / grid"
        />
        <Metric
          icon={Activity}
          bg="#FDE7DC"
          accent="#C85A28"
          label="Macro F1 (EmoT)"
          value={m.macro_f1_emot}
          note="Uji lintas domain (Twitter)"
        />
        <Metric
          icon={Sparkles}
          bg="#FFF2D2"
          accent="#B57B00"
          label="Recall (EmoT)"
          value={m.recall_emot}
          note="Cakupan lintas domain"
        />
      </div>

      {/* Tabel Perbandingan (dengan Quick-Switch) & Confusion Matrix */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <Card className="flex flex-col justify-between gap-4 p-6 xl:col-span-7">
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-ink">Perbandingan & Aktivasi Model</h2>
                <p className="text-xs font-medium text-muted">
                  Klik tombol <b>Gunakan</b> pada model klasik untuk langsung mengganti model aktif.
                </p>
              </div>
              <span className="rounded-full bg-lilac px-3 py-1 text-[11px] font-black text-primary">
                Benchmark
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b-2 border-line text-[11px] tracking-wider text-muted uppercase">
                    <th className="px-2.5 py-3 font-extrabold">Model</th>
                    <th className="px-2.5 py-3 text-right font-extrabold">F1 Valid</th>
                    <th className="px-2.5 py-3 text-right font-extrabold">F1 Test</th>
                    <th className="px-2.5 py-3 text-right font-extrabold">F1 EmoT</th>
                    <th className="px-2.5 py-3 text-right font-extrabold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(info.comparison ?? []).map((c) => {
                    const active = c.model === info.active_model
                    const regMatch = regModels.find(
                      (rm) => rm.nama?.toLowerCase() === c.model?.toLowerCase()
                    )
                    return (
                      <tr
                        key={c.model}
                        className={`border-b border-line/70 transition ${
                          active ? 'bg-lilac/65' : 'hover:bg-page/80'
                        }`}
                      >
                        <td className="px-2.5 py-3.5 font-extrabold text-ink">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span>{c.model}</span>
                          </div>
                          {c.pj && (
                            <span className="mt-0.5 block text-xs font-semibold text-muted">
                              PJ: {c.pj}
                            </span>
                          )}
                        </td>
                        <td className="px-2.5 py-3.5 text-right font-medium tabular-nums">
                          {score(c.macro_f1_valid)}
                        </td>
                        <td
                          className={`px-2.5 py-3.5 text-right tabular-nums ${
                            c.macro_f1_test === bestTest ? 'font-black text-primary' : 'font-semibold'
                          }`}
                        >
                          {score(c.macro_f1_test)}
                        </td>
                        <td className="px-2.5 py-3.5 text-right font-medium tabular-nums">
                          {score(c.macro_f1_emot)}
                        </td>
                        <td className="px-2.5 py-3.5 text-right">
                          {active ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#DFF3EA] px-2.5 py-1 text-[11px] font-black text-[#237451]">
                              <CheckCircle2 size={12} /> Aktif
                            </span>
                          ) : regMatch ? (
                            <button
                              type="button"
                              disabled={switchingId === regMatch.id}
                              onClick={() => handleQuickSwitch(regMatch.id, regMatch.nama)}
                              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-primary/30 bg-white px-3 py-1 text-[11px] font-extrabold text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
                            >
                              {switchingId === regMatch.id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <ArrowRightLeft size={11} />
                              )}
                              <span>Gunakan</span>
                            </button>
                          ) : (
                            <span className="text-[11px] font-semibold text-muted">Arsip</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {info.notes?.length > 0 && (
            <div className="rounded-2xl bg-page p-4">
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-black text-ink uppercase">
                <Info size={14} className="text-primary" />
                <span>Catatan Evaluasi</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs leading-relaxed text-muted">
                {info.notes.map((n) => (
                  <li key={n} className="flex items-start gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                    <span>{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="flex flex-col justify-between gap-4 p-6 xl:col-span-5">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black text-ink">Confusion Matrix</h2>
              <span className="rounded-full bg-page px-3 py-1 text-xs font-bold text-muted">
                Test Set
              </span>
            </div>

            {info.confusion_matrix_image && imgOk ? (
              <div className="overflow-hidden rounded-2xl border border-line bg-white p-2">
                <img
                  src={info.confusion_matrix_image}
                  alt={`Confusion matrix model ${info.active_model}`}
                  onError={() => setImgOk(false)}
                  className="w-full rounded-xl object-contain"
                />
              </div>
            ) : (
              <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-page p-6 text-center text-sm text-muted">
                Gambar confusion matrix belum tersedia untuk model ini.
              </div>
            )}
          </div>

          <p className="rounded-xl bg-page px-3.5 py-2.5 text-xs leading-relaxed text-muted">
            <b>Cara membaca:</b> Baris = emosi sebenarnya, kolom = emosi tebakan model. Diagonal utama menunjukkan prediksi benar.
          </p>
        </Card>
      </div>

      {/* Detail Teknis Pipeline (Visual Stepper + 4 Kartu Spesifikasi) */}
      <Card className="p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-ink">Detail Teknis Pipeline</h2>
            <p className="text-xs font-medium text-muted">
              Konfigurasi ekstraksi fitur dan estimator yang termuat di memori server saat ini.
            </p>
          </div>

          {/* Alur Tahapan Visual */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-page px-3.5 py-2">
            {pipelineStages.map((st, idx) => (
              <div key={st.step} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
                    {st.step}
                  </span>
                  <span className="text-xs font-extrabold text-ink">{st.desc}</span>
                </div>
                {idx < pipelineStages.length - 1 && (
                  <ArrowRight size={13} className="text-muted" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-line/60 bg-page/70 p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-muted">
              <span className="flex size-7 items-center justify-center rounded-lg bg-lilac text-primary">
                <Layers size={14} />
              </span>
              <span>Fitur &ldquo;word&rdquo;</span>
            </div>
            <p className="mt-2.5 text-sm font-black text-ink">
              {rt.feat_word?.title || 'TfidfVectorizer · 10.000 fitur'}
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted">
              {rt.feat_word?.sub || 'N-gram kata (1, 2)'}
            </p>
          </div>

          <div className="rounded-2xl border border-line/60 bg-page/70 p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-muted">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#DFF3EA] text-[#237451]">
                <Layers size={14} />
              </span>
              <span>Fitur &ldquo;char&rdquo;</span>
            </div>
            <p className="mt-2.5 text-sm font-black text-ink">
              {rt.feat_char?.title || 'Tidak digunakan'}
            </p>
            <p className="mt-0.5 text-xs font-medium text-muted">
              {rt.feat_char?.sub || 'Hanya fitur kata'}
            </p>
          </div>

          <div className="rounded-2xl border border-line/60 bg-page/70 p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-muted">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#FDE7DC] text-[#C85A28]">
                <Cpu size={14} />
              </span>
              <span>Klasifikasi &ldquo;clf&rdquo;</span>
            </div>
            <p className="mt-2.5 text-sm font-black text-ink">{rt.type || info.active_model}</p>
            <p className="mt-0.5 text-xs font-medium text-muted">{rt.clf_detail || 'Pipeline scikit-learn'}</p>
          </div>

          <div className="rounded-2xl border border-line/60 bg-page/70 p-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-muted">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#FFF2D2] text-[#B57B00]">
                <FileSpreadsheet size={14} />
              </span>
              <span>Batas Input Sistem</span>
            </div>
            <p className="mt-2.5 text-sm font-black text-ink">5.000 baris · 3–100 kata</p>
            <p className="mt-0.5 text-xs font-medium text-muted">Maksimal 5 topik per emosi</p>
          </div>
        </div>
      </Card>
    </div>
  )
}