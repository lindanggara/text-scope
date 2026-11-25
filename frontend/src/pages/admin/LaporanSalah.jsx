import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Papa from 'papaparse'
import {
  ArrowRight, ArrowUpRight, Check, CheckCircle2, Clock,
  Download, Flag, Inbox, Loader2, RefreshCw, X, XCircle,
} from 'lucide-react'
import { Card, EmotionChip } from '../../components/ui.jsx'
import { StatusBadge } from '../Riwayat.jsx'
import { adminListReports, adminSetReportStatus } from '../../lib/db.js'
import { formatNumber } from '../../lib/emotions.js'
import { formatTime } from '../../lib/social.js'
import { pesanError } from '../../lib/supabase.js'

const TABS = [
  ['menunggu', 'Menunggu'],
  ['diterima', 'Diterima'],
  ['ditolak', 'Ditolak'],
  ['semua', 'Semua'],
]

function downloadTrainingData(rows) {
  const csv = Papa.unparse(rows.map((r) => ({ text: r.text, label: r.correct_emotion })))
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `data_latih_tambahan_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function LaporanSalah() {
  const [tab, setTab] = useState('menunggu')
  const [allReports, setAllReports] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState({})

  const load = useCallback(async () => {
    setMessage({})
    try {
      const data = await adminListReports('semua')
      setAllReports(data ?? [])
    } catch (err) {
      setMessage({ ok: false, text: pesanError(err, 'Laporan tidak bisa dimuat.') })
      setAllReports([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(r, status) {
    setBusyId(r.id)
    setMessage({})
    try {
      await adminSetReportStatus(r.id, status)
      setAllReports((list) =>
        list.map((x) => (x.id === r.id ? { ...x, status, reviewed_at: new Date().toISOString() } : x)),
      )
      setMessage({
        ok: true,
        text: status === 'diterima'
          ? 'Laporan diterima dan siap diekspor sebagai data latih tambahan.'
          : 'Laporan ditolak.',
      })
    } catch (err) {
      setMessage({ ok: false, text: pesanError(err, 'Status laporan gagal diubah.') })
    } finally {
      setBusyId(null)
    }
  }

  const counts = useMemo(() => {
    const list = allReports ?? []
    return {
      menunggu: list.filter((r) => r.status === 'menunggu').length,
      diterima: list.filter((r) => r.status === 'diterima').length,
      ditolak: list.filter((r) => r.status === 'ditolak').length,
      semua: list.length,
    }
  }, [allReports])

  const filtered = useMemo(() => {
    const list = allReports ?? []
    if (tab === 'semua') return list
    return list.filter((r) => r.status === tab)
  }, [allReports, tab])

  function handleExport() {
    const accepted = (allReports ?? []).filter((r) => r.status === 'diterima')
    if (accepted.length === 0) {
      setMessage({ ok: false, text: 'Belum ada laporan berstatus Diterima untuk diekspor.' })
      return
    }
    downloadTrainingData(accepted)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-8">
      {/* Header + Tombol Aksi */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-black tracking-tight text-ink">
            Laporan Prediksi Salah
          </h1>
          <p className="mt-1 text-sm font-medium text-muted">
            Tinjau koreksi emosi dari pengguna. Laporan yang diterima dapat diekspor sebagai dataset fine-tuning baru.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={load}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-extrabold text-ink shadow-soft transition hover:bg-lilac/40"
          >
            <RefreshCw size={15} />
            <span>Muat ulang</span>
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={counts.diterima === 0}
            title={counts.diterima === 0 ? 'Terima minimal satu laporan terlebih dahulu untuk mengunduh CSV' : undefined}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-white shadow-button transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Download size={16} />
            <span>Unduh data latih ({formatNumber(counts.diterima)})</span>
          </button>
        </div>
      </div>

      {/* 4 Kartu Ringkasan Laporan */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center justify-between rounded-[24px] bg-[#FFF2D2] p-5">
          <div>
            <span className="text-xs font-extrabold tracking-wide text-[#4A4360] uppercase">Menunggu Tinjauan</span>
            <p className="mt-1 text-3xl font-black text-ink tabular-nums">{formatNumber(counts.menunggu)}</p>
            <span className="text-xs font-semibold text-muted">Perlu verifikasi admin</span>
          </div>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/85 text-[#B57B00]">
            <Clock size={21} />
          </span>
        </div>

        <div className="flex items-center justify-between rounded-[24px] bg-[#DFF3EA] p-5">
          <div>
            <span className="text-xs font-extrabold tracking-wide text-[#4A4360] uppercase">Diterima</span>
            <p className="mt-1 text-3xl font-black text-ink tabular-nums">{formatNumber(counts.diterima)}</p>
            <span className="text-xs font-semibold text-muted">Siap jadi data latih</span>
          </div>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/85 text-[#237451]">
            <CheckCircle2 size={21} />
          </span>
        </div>

        <div className="flex items-center justify-between rounded-[24px] bg-[#FDE7DC] p-5">
          <div>
            <span className="text-xs font-extrabold tracking-wide text-[#4A4360] uppercase">Ditolak</span>
            <p className="mt-1 text-3xl font-black text-ink tabular-nums">{formatNumber(counts.ditolak)}</p>
            <span className="text-xs font-semibold text-muted">Prediksi awal sudah tepat</span>
          </div>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/85 text-[#C85A28]">
            <XCircle size={21} />
          </span>
        </div>

        <div className="flex items-center justify-between rounded-[24px] bg-[#ECE6FB] p-5">
          <div>
            <span className="text-xs font-extrabold tracking-wide text-[#4A4360] uppercase">Total Laporan</span>
            <p className="mt-1 text-3xl font-black text-ink tabular-nums">{formatNumber(counts.semua)}</p>
            <span className="text-xs font-semibold text-muted">Seluruh umpan balik masuk</span>
          </div>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/85 text-primary">
            <Flag size={21} />
          </span>
        </div>
      </div>

      {/* Daftar Laporan & Tab Filter */}
      <Card className="flex flex-col gap-4 p-6">
        <div role="tablist" aria-label="Status laporan" className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-1.5">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`min-h-10 cursor-pointer rounded-full px-4 text-sm font-extrabold transition ${
                  tab === key ? 'bg-primary text-white' : 'bg-page text-muted hover:text-ink'
                }`}
              >
                {label} ({formatNumber(counts[key])})
              </button>
            ))}
          </div>
          {allReports !== null && (
            <span className="text-xs font-bold text-muted">
              Menampilkan {formatNumber(filtered.length)} dari {formatNumber(counts.semua)} laporan
            </span>
          )}
        </div>

        {message.text && (
          <p
            role={message.ok ? 'status' : 'alert'}
            className={`rounded-2xl px-4 py-3 text-sm font-bold ${
              message.ok ? 'bg-mint text-[#22684A]' : 'bg-pink text-[#A3324F]'
            }`}
          >
            {message.text}
          </p>
        )}

        {allReports === null ? (
          <p className="flex items-center gap-2 py-6 font-bold text-muted">
            <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Memuat laporan…
          </p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[24px] border-2 border-dashed border-line bg-page/60 px-6 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-lilac text-primary">
              <Inbox size={26} />
            </span>
            <h2 className="mt-4 text-base font-black text-ink">
              {tab === 'menunggu'
                ? 'Belum ada laporan yang menunggu tinjauan'
                : `Belum ada laporan pada kategori "${TABS.find(([k]) => k === tab)?.[1]}"`}
            </h2>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-muted">
              Laporan akan muncul di sini ketika pengguna menekan tombol <strong>Laporkan salah</strong> pada hasil deteksi komentar tunggal maupun tabel hasil analisis file.
            </p>
            <Link
              to="/upload"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-primary shadow-soft transition hover:bg-lilac/40"
            >
              <span>Coba deteksi & kirim laporan</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((r) => {
              const busy = busyId === r.id
              const reporter = r.profiles?.full_name || r.profiles?.email || 'Pengguna'
              return (
                <li
                  key={r.id}
                  className="flex flex-col gap-3 rounded-[22px] border-2 border-line bg-white p-5 transition hover:border-primary/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted">
                      <span className="rounded-full bg-page px-2.5 py-1 text-ink">{reporter}</span>
                      <span>·</span>
                      <span>{formatTime(r.created_at)}</span>
                      {typeof r.confidence === 'number' && (
                        <>
                          <span>·</span>
                          <span>Keyakinan awal: {Math.round(r.confidence * 100)}%</span>
                        </>
                      )}
                    </div>
                    <StatusBadge status={r.status} />
                  </div>

                  <p className="rounded-2xl bg-page/80 px-4 py-3 text-[15px] leading-relaxed font-medium text-ink">
                    “{r.text}”
                  </p>

                  {r.note && (
                    <p className="text-xs font-semibold text-muted">
                      Catatan pelapor: <span className="text-ink">{r.note}</span>
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold text-muted">
                      <span>Prediksi sistem:</span>
                      <EmotionChip emotion={r.predicted_emotion} />
                      <ArrowRight size={15} className="text-muted" />
                      <span>Koreksi pengguna:</span>
                      <EmotionChip emotion={r.correct_emotion} />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {r.status !== 'diterima' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setStatus(r, 'diterima')}
                          className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-mint px-3.5 text-xs font-extrabold text-[#22684A] transition hover:opacity-90 disabled:opacity-50"
                        >
                          <Check size={14} /> Terima
                        </button>
                      )}
                      {r.status !== 'ditolak' && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setStatus(r, 'ditolak')}
                          className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-pink px-3.5 text-xs font-extrabold text-[#A3324F] transition hover:opacity-90 disabled:opacity-50"
                        >
                          <X size={14} /> Tolak
                        </button>
                      )}
                      {busy && <Loader2 size={16} className="animate-spin text-primary" />}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}