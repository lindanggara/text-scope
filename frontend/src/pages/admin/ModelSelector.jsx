import { useEffect, useState } from 'react'
import { Check, CheckCircle2, Cpu, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { getModels, setActiveModel } from '../../lib/api.js'

function formatSkor(v) {
  return v == null
    ? '—'
    : Number(v).toLocaleString('id-ID', { minimumFractionDigits: 4, maximumFractionDigits: 4 })
}

export default function ModelSelector() {
  const [data, setData] = useState(null)
  const [pilih, setPilih] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  async function muat() {
    setLoading(true)
    try {
      const j = await getModels()
      setData(j)
      setPilih(j.aktif)
    } catch (err) {
      setMsg({ tipe: 'error', isi: err.message || 'Gagal memuat daftar model' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { muat() }, [])

  async function simpan() {
    if (!pilih || pilih === data?.aktif) return
    setSaving(true)
    setMsg(null)
    try {
      await setActiveModel(pilih)
      setMsg({ tipe: 'ok', isi: 'Model aktif berhasil diperbarui dan siap digunakan!' })
      await muat()
    } catch (err) {
      setMsg({ tipe: 'error', isi: err.message || 'Gagal menyimpan pilihan model' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 font-bold text-muted">
        <Loader2 size={20} className="animate-spin text-primary" />
        <span>Memuat daftar model…</span>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-3xl bg-white p-6 font-bold text-muted shadow-soft">
        {msg?.isi || 'Tidak ada data model yang tersedia.'}
      </div>
    )
  }

  const daftarModel = Array.isArray(data.model)
    ? data.model
    : Object.entries(data.model || {}).map(([id, val]) => ({ id, ...val }))

  const maxF1 = Math.max(...daftarModel.map((m) => Number(m.f1_test) || 0))
  const modelTerpilihObj = daftarModel.find((m) => m.id === pilih)
  const adaPerubahan = pilih && pilih !== data.aktif

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-black tracking-tight text-ink">
            Pilih Model Analisis
          </h1>
          <p className="mt-1 text-sm font-medium text-muted">
            Tentukan algoritma klasifikasi emosi aktif yang digunakan TextScope untuk memproses komentar baru.
          </p>
        </div>

        <button
          type="button"
          onClick={muat}
          disabled={loading}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-extrabold text-ink shadow-soft transition hover:bg-lilac/40"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span>Muat ulang</span>
        </button>
      </div>

      {/* Notifikasi Status */}
      {msg && (
        <div
          role="alert"
          className={`flex items-center gap-2.5 rounded-2xl px-4 py-3.5 text-sm font-extrabold shadow-soft ${
            msg.tipe === 'ok'
              ? 'bg-[#DFF3EA] text-[#237451]'
              : 'bg-[#FCE4EE] text-[#B33560]'
          }`}
        >
          <CheckCircle2 size={18} className="shrink-0" />
          <span>{msg.isi}</span>
        </div>
      )}

      {/* Grid Pilihan Model */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {daftarModel.map((m) => {
          const aktif = data.aktif === m.id
          const dipilih = pilih === m.id
          const f1Val = Number(m.f1_test) || 0
          const terbaik = f1Val > 0 && f1Val === maxF1

          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setPilih(m.id)}
              aria-pressed={dipilih}
              className={`group relative flex cursor-pointer flex-col justify-between rounded-[28px] bg-white p-6 text-left transition-all duration-200 ${
                dipilih
                  ? 'ring-2 ring-primary shadow-[0_12px_30px_rgba(107,93,194,0.14)]'
                  : 'border border-transparent shadow-soft hover:-translate-y-0.5 hover:border-line'
              }`}
            >
              <div>
                {/* Baris Atas: Ikon + Judul + Indikator Radio Custom */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <span
                      className={`flex size-12 shrink-0 items-center justify-center rounded-2xl transition ${
                        dipilih ? 'bg-primary text-white' : 'bg-lilac text-primary'
                      }`}
                    >
                      <Cpu size={22} strokeWidth={2.2} />
                    </span>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-lg font-black text-ink">{m.nama}</span>
                        {aktif && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#DFF3EA] px-2.5 py-0.5 text-[11px] font-black text-[#237451]">
                            <CheckCircle2 size={12} /> Aktif
                          </span>
                        )}
                        {terbaik && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-lilac px-2.5 py-0.5 text-[11px] font-black text-primary">
                            <Sparkles size={11} /> Terbaik
                          </span>
                        )}
                      </div>
                      <span className="mt-0.5 block text-xs font-bold tracking-wide text-muted uppercase">
                        Engine: {m.tipe || 'sklearn'}
                      </span>
                    </div>
                  </div>

                  {/* Indikator Pilihan */}
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      dipilih
                        ? 'border-primary bg-primary text-white'
                        : 'border-[#CFC7E8] bg-white group-hover:border-primary/60'
                    }`}
                  >
                    {dipilih && <Check size={14} strokeWidth={3} />}
                  </span>
                </div>

                {/* Deskripsi Model */}
                <p className="mt-4 text-sm leading-relaxed text-[#5A5372]">
                  {m.deskripsi}
                </p>
              </div>

              {/* Footer Kartu: Progress Bar F1 & Pill Metrik */}
              <div className="mt-5 border-t border-line/70 pt-4">
                <div className="mb-1.5 flex items-center justify-between text-xs font-extrabold">
                  <span className="text-muted">Macro F1 (Test Set)</span>
                  <span className="text-sm font-black text-ink tabular-nums">
                    {formatSkor(m.f1_test)}
                  </span>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-[#EFEBF9]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      dipilih ? 'bg-primary' : 'bg-[#9E92DF]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(8, f1Val * 100))}%` }}
                  />
                </div>

                {m.f1_emot != null && (
                  <div className="mt-3 flex items-center gap-2">
                    <span className="rounded-xl bg-[#FFF1E6] px-2.5 py-1 text-[11px] font-extrabold text-[#B85D19] tabular-nums">
                      F1 Lintas Domain (EmoT): {formatSkor(m.f1_emot)}
                    </span>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Action Bar Bawah */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[26px] bg-white px-6 py-4 shadow-soft">
        <div className="text-sm">
          <span className="font-medium text-muted">Model terpilih: </span>
          <span className="font-black text-ink">{modelTerpilihObj?.nama || '—'}</span>
          {!adaPerubahan && (
            <span className="ml-2 text-xs font-bold text-[#237451]">(Sedang digunakan)</span>
          )}
        </div>

        <button
          type="button"
          onClick={simpan}
          disabled={saving || !adaPerubahan}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-black text-white shadow-button transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Menyimpan…</span>
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              <span>{adaPerubahan ? 'Simpan & Aktifkan Model' : 'Model Sudah Aktif'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}