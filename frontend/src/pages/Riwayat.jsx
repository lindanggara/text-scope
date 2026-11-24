import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Flag, FolderOpen, Loader2, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react'
import { Card, EmotionChip, PageHeader } from '../components/ui.jsx'
import { useAnalysis } from '../context/AnalysisContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { deleteAnalysis, getAnalysis, listAnalyses, listMyReports } from '../lib/db.js'
import { EMOTIONS, emotionInfo, formatNumber } from '../lib/emotions.js'
import { formatTime } from '../lib/social.js'
import { pesanError } from '../lib/supabase.js'

const STATUS = {
  menunggu: { label: 'Menunggu', cls: 'bg-butter text-[#8A6100]' },
  diterima: { label: 'Diterima', cls: 'bg-mint text-[#22684A]' },
  ditolak: { label: 'Ditolak', cls: 'bg-pink text-[#A3324F]' },
}

export function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.menunggu
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-extrabold ${s.cls}`}>{s.label}</span>
}

// Bar kecil berisi proporsi tiap emosi.
function MiniBar({ distribution }) {
  const total = distribution.reduce((s, d) => s + (d.count ?? 0), 0) || 1
  const byKey = Object.fromEntries(distribution.map((d) => [d.emotion, d.count ?? 0]))
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-page" aria-hidden="true">
      {EMOTIONS.map((e) => (byKey[e] ? <span key={e} style={{ width: `${(byKey[e] / total) * 100}%`, background: emotionInfo(e).color }} /> : null))}
    </div>
  )
}

function AnalysisItem({ item, onOpen, onDelete, opening }) {
  const [confirm, setConfirm] = useState(false)
  return (
    <li className="lift flex flex-col gap-3 rounded-[22px] border-2 border-line bg-white p-4 sm:flex-row sm:items-center sm:gap-5">
      <span className="hidden size-12 shrink-0 items-center justify-center rounded-2xl bg-lilac text-primary sm:flex">
        <FileText size={22} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="min-w-0 truncate font-black">{item.file_name || 'Tanpa nama'}</span>
          {item.privacy_shield && (
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#2E8A62]"><ShieldCheck size={13} aria-hidden="true" /> Disensor</span>
          )}
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>{formatTime(item.created_at)}</span>
          <span>· {formatNumber(item.total_texts)} komentar</span>
          {item.avg_confidence != null && <span>· keyakinan {Math.round(item.avg_confidence * 100)}%</span>}
        </p>
        <MiniBar distribution={item.distribution ?? []} />
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        {item.dominant_emotion && <EmotionChip emotion={item.dominant_emotion} />}
        <div className="flex items-center gap-1.5">
          {confirm ? (
            <>
              <span className="text-sm font-bold text-muted">Hapus?</span>
              <button type="button" onClick={() => onDelete(item.id)} className="min-h-10 cursor-pointer rounded-full bg-pink px-3.5 text-sm font-extrabold text-[#A3324F]">Ya, hapus</button>
              <button type="button" onClick={() => setConfirm(false)} className="min-h-10 cursor-pointer rounded-full px-3 text-sm font-extrabold text-muted hover:bg-page">Batal</button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpen(item.id)}
                disabled={opening}
                className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-black text-white disabled:opacity-60"
              >
                {opening ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <FolderOpen size={15} aria-hidden="true" />} Buka
              </button>
              <button
                type="button"
                onClick={() => setConfirm(true)}
                aria-label={`Hapus riwayat ${item.file_name}`}
                className="flex size-10 cursor-pointer items-center justify-center rounded-full text-muted hover:bg-pink hover:text-[#A3324F]"
              >
                <Trash2 size={17} aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  )
}

export default function Riwayat() {
  const { user } = useAuth()
  const { setResult } = useAnalysis()
  const navigate = useNavigate()
  const [items, setItems] = useState(null)
  const [reports, setReports] = useState([])
  const [error, setError] = useState('')
  const [openingId, setOpeningId] = useState(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const [a, r] = await Promise.all([listAnalyses(), listMyReports(user.id)])
      setItems(a)
      setReports(r)
    } catch (err) {
      setError(pesanError(err, 'Riwayat tidak bisa dimuat. Coba lagi.'))
      setItems([])
    }
  }, [user.id])

  useEffect(() => {
    load()
  }, [load])

  async function handleOpen(id) {
    setOpeningId(id)
    try {
      const row = await getAnalysis(id)
      setResult({ ...row.result, analysisId: row.id })
      navigate('/hasil')
    } catch (err) {
      setError(pesanError(err, 'Hasil analisis tidak bisa dibuka.'))
    } finally {
      setOpeningId(null)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteAnalysis(id)
      setItems((list) => list.filter((x) => x.id !== id))
    } catch (err) {
      setError(pesanError(err, 'Riwayat gagal dihapus.'))
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Riwayat"
        subtitle="Analisis file yang pernah kamu jalankan. Hanya kamu yang bisa melihatnya."
        actions={
          <button type="button" onClick={load} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-white px-4 font-extrabold text-primary shadow-soft">
            <RefreshCw size={16} aria-hidden="true" /> Muat ulang
          </button>
        }
      />

      {error && <p role="alert" className="rounded-2xl bg-pink px-4 py-3 font-bold text-[#A3324F]">{error}</p>}

      <Card className="flex flex-col gap-4">
        <h2 className="text-xl font-black">Analisis file</h2>
        {items === null ? (
          <p className="flex items-center gap-2 font-bold text-muted"><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Memuat riwayat…</p>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-page p-5">
            <p className="font-bold text-muted">Belum ada riwayat. Hasil setiap analisis file akan tersimpan di sini secara otomatis.</p>
            <Link to="/upload" className="flex min-h-11 items-center rounded-full bg-primary px-5 font-black text-white no-underline">Mulai analisis</Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <AnalysisItem key={item.id} item={item} onOpen={handleOpen} onDelete={handleDelete} opening={openingId === item.id} />
            ))}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-xl font-black"><Flag size={19} className="text-primary" aria-hidden="true" /> Laporan saya</h2>
        {reports.length === 0 ? (
          <p className="text-muted">
            Belum ada laporan. Kalau menemukan emosi yang keliru, tekan <b className="text-ink">Emosinya salah?</b> di tabel hasil atau di mode Ketik teks.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-line">
            {reports.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
                <p className="min-w-0 flex-1 truncate text-[15px]">“{r.text}”</p>
                <span className="flex flex-wrap items-center gap-2 text-sm font-bold text-muted">
                  {emotionInfo(r.predicted_emotion).nama} → <b className="text-ink">{emotionInfo(r.correct_emotion).nama}</b>
                  <StatusBadge status={r.status} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
