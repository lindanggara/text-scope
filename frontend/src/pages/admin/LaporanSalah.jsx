import { useCallback, useEffect, useState } from 'react'
import Papa from 'papaparse'
import { ArrowRight, Check, Download, Loader2, X } from 'lucide-react'
import { Card, EmotionChip, PageHeader } from '../../components/ui.jsx'
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

// Unduh laporan yang diterima sebagai data latih: kolom text,label (sama dengan format dataset tim).
function downloadTrainingData(rows) {
  const csv = Papa.unparse(rows.map((r) => ({ text: r.text, label: r.correct_emotion })))
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `data_latih_tambahan_${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function LaporanSalah() {
  const [tab, setTab] = useState('menunggu')
  const [rows, setRows] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setRows(null)
    setError('')
    try {
      setRows(await adminListReports(tab))
    } catch (err) {
      setError(pesanError(err, 'Laporan tidak bisa dimuat.'))
      setRows([])
    }
  }, [tab])

  useEffect(() => {
    load()
  }, [load])

  async function setStatus(r, status) {
    setBusyId(r.id)
    setError('')
    try {
      await adminSetReportStatus(r.id, status)
      setRows((list) => (tab === 'semua' ? list.map((x) => (x.id === r.id ? { ...x, status } : x)) : list.filter((x) => x.id !== r.id)))
    } catch (err) {
      setError(pesanError(err, 'Status laporan gagal diubah.'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleExport() {
    setExporting(true)
    setError('')
    try {
      const accepted = await adminListReports('diterima')
      if (accepted.length === 0) setError('Belum ada laporan yang diterima.')
      else downloadTrainingData(accepted)
    } catch (err) {
      setError(pesanError(err, 'Data latih gagal diunduh.'))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Laporan Prediksi Salah"
        subtitle="Komentar yang menurut pengguna salah dideteksi. Terima laporan yang benar untuk dijadikan data latih tambahan."
        actions={
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-primary px-5 font-black text-white shadow-button disabled:opacity-60"
          >
            {exporting ? <Loader2 size={17} className="animate-spin" aria-hidden="true" /> : <Download size={17} aria-hidden="true" />} Unduh data latih (.csv)
          </button>
        }
      />

      <Card className="flex flex-col gap-4">
        <div role="tablist" aria-label="Status laporan" className="flex flex-wrap gap-1.5">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`min-h-10 cursor-pointer rounded-full px-4 text-sm font-extrabold ${tab === key ? 'bg-primary text-white' : 'bg-page text-muted'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <p role="alert" className="rounded-2xl bg-pink px-4 py-3 text-sm font-bold text-[#A3324F]">{error}</p>}

        {rows === null ? (
          <p className="flex items-center gap-2 font-bold text-muted"><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Memuat laporan…</p>
        ) : rows.length === 0 ? (
          <p className="rounded-2xl bg-page px-4 py-6 text-center font-bold text-muted">Tidak ada laporan di sini.</p>
        ) : (
          <>
            <p className="text-sm font-bold text-muted">{formatNumber(rows.length)} laporan</p>
            <ul className="flex flex-col gap-3">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-col gap-3 rounded-[20px] border-2 border-line p-4">
                  <p className="text-[15px] leading-relaxed">“{r.text}”</p>
                  <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
                    <EmotionChip emotion={r.predicted_emotion} />
                    <ArrowRight size={16} aria-label="seharusnya" />
                    <EmotionChip emotion={r.correct_emotion} />
                    {r.confidence != null && <span>· keyakinan model {Math.round(r.confidence * 100)}%</span>}
                    <StatusBadge status={r.status} />
                  </div>
                  {r.note && <p className="rounded-2xl bg-page px-3 py-2 text-sm"><b>Catatan:</b> {r.note}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[13px] text-muted">
                      {r.profiles?.full_name || r.profiles?.email || 'Pengguna'} · {r.source === 'teks' ? 'Ketik teks' : 'Analisis file'} · {formatTime(r.created_at)}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {busyId === r.id && <Loader2 size={16} className="animate-spin text-muted" aria-label="Menyimpan" />}
                      {r.status !== 'diterima' && (
                        <button type="button" disabled={busyId === r.id} onClick={() => setStatus(r, 'diterima')} className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full bg-mint px-4 text-sm font-extrabold text-[#22684A] disabled:opacity-50">
                          <Check size={15} aria-hidden="true" /> Terima
                        </button>
                      )}
                      {r.status !== 'ditolak' && (
                        <button type="button" disabled={busyId === r.id} onClick={() => setStatus(r, 'ditolak')} className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full bg-pink px-4 text-sm font-extrabold text-[#A3324F] disabled:opacity-50">
                          <X size={15} aria-hidden="true" /> Tolak
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  )
}
