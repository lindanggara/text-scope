import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, Flag, Gauge, Loader2, MessageSquareText, Users } from 'lucide-react'
import Kpi from '../../components/Kpi.jsx'
import { Card, Dot, PageHeader } from '../../components/ui.jsx'
import { adminStats } from '../../lib/db.js'
import { EMOTIONS, emotionInfo, formatNumber, formatPercent } from '../../lib/emotions.js'
import { pesanError } from '../../lib/supabase.js'

const PERIODS = [7, 14, 30]

function shortDate(iso) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function DailyTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-sm shadow-soft">
      <p className="mb-1 font-black">{label}</p>
      <p className="font-bold">{formatNumber(d.analyses)} analisis</p>
      <p className="text-muted">{formatNumber(d.comments)} komentar · {formatNumber(d.users)} pengguna</p>
    </div>
  )
}

export default function AdminDashboard() {
  const [days, setDays] = useState(14)
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setStats(null)
    setError('')
    adminStats(days)
      .then((s) => active && setStats(s))
      .catch((err) => active && setError(pesanError(err, 'Statistik tidak bisa dimuat.')))
    return () => {
      active = false
    }
  }, [days])

  const daily = (stats?.daily ?? []).map((d) => ({ ...d, label: shortDate(d.date) }))
  const periodAnalyses = daily.reduce((s, d) => s + d.analyses, 0)
  const emotionTotal = EMOTIONS.reduce((s, e) => s + (stats?.emotions?.[e] ?? 0), 0)
  const emotions = EMOTIONS.map((e) => ({ emotion: e, count: stats?.emotions?.[e] ?? 0 }))
    .map((x) => ({ ...x, pct: emotionTotal ? (x.count / emotionTotal) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard Admin"
        subtitle="Gambaran penggunaan TextScope oleh semua pengguna."
        actions={
          <div role="group" aria-label="Periode" className="flex rounded-full bg-white p-1 shadow-soft">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={days === p}
                onClick={() => setDays(p)}
                className={`min-h-10 cursor-pointer rounded-full px-4 text-sm font-extrabold ${days === p ? 'bg-primary text-white' : 'text-muted'}`}
              >
                {p} hari
              </button>
            ))}
          </div>
        }
      />

      {error && <p role="alert" className="rounded-2xl bg-pink px-4 py-3 font-bold text-[#A3324F]">{error}</p>}
      {!stats && !error && (
        <p className="flex items-center gap-2 font-bold text-muted"><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Memuat statistik…</p>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <Kpi bg="#ECE6FB" iconColor="#6B5DC2" icon={Users} label="Pengguna" count={stats.total_users} note={`${formatNumber(stats.new_users_period)} baru dalam ${days} hari · ${formatNumber(stats.admin_count)} admin`} />
            <Kpi bg="#FDE7DC" iconColor="#B4532A" icon={MessageSquareText} label="Komentar diproses" count={stats.total_comments} note={`dari ${formatNumber(stats.total_analyses)} analisis file`} />
            <Kpi
              bg="#DFF3EA"
              iconColor="#2E8A62"
              icon={Gauge}
              label="Rata-rata keyakinan"
              count={Math.round((stats.avg_confidence ?? 0) * 100)}
              suffix="%"
              note="seluruh komentar di sistem"
              tip="Rata-rata keyakinan model untuk semua komentar yang pernah dianalisis. Kalau terus turun, model mungkin perlu dilatih ulang."
            />
            <Kpi bg="#FFF2D2" iconColor="#8A6100" icon={Flag} label="Laporan menunggu" count={stats.pending_reports} note="prediksi salah yang belum ditinjau" />
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
            <Card className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black">Analisis per hari</h2>
                <p className="text-sm text-muted">{formatNumber(periodAnalyses)} analisis dalam {days} hari terakhir (WIB)</p>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                    <CartesianGrid stroke="#F0ECF8" vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: '#5F5875', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#E6E0F5' }} minTickGap={16} />
                    <YAxis allowDecimals={false} tick={{ fill: '#5F5875', fontSize: 12 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<DailyTooltip />} cursor={{ fill: '#F4F0FC' }} />
                    <Bar dataKey="analyses" fill="#6B5DC2" radius={[8, 8, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-black">Emosi di seluruh sistem</h2>
                <p className="text-sm text-muted">Gabungan semua komentar yang pernah dianalisis</p>
              </div>
              {emotionTotal === 0 ? (
                <p className="text-muted">Belum ada data.</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {emotions.map(({ emotion, count, pct }) => (
                    <li key={emotion} className="flex flex-col gap-1.5">
                      <span className="flex items-center justify-between gap-2 text-sm font-bold">
                        <span className="flex items-center gap-2"><Dot color={emotionInfo(emotion).color} /> {emotionInfo(emotion).nama}</span>
                        <span className="tabular-nums text-muted">{formatNumber(count)} · {formatPercent(pct)}%</span>
                      </span>
                      <span className="h-2.5 overflow-hidden rounded-full bg-page">
                        <span className="block h-full rounded-full" style={{ width: `${pct}%`, background: emotionInfo(emotion).color }} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { to: '/admin/pengguna', label: 'Kelola Pengguna', note: 'Ubah role dan status akun' },
              { to: '/admin/laporan', label: 'Laporan Prediksi Salah', note: `${formatNumber(stats.pending_reports)} menunggu ditinjau` },
              { to: '/admin/model', label: 'Info Model', note: 'Skor dan detail model aktif' },
            ].map((x) => (
              <Link key={x.to} to={x.to} className="lift flex items-center justify-between gap-3 rounded-[22px] bg-white p-5 text-ink no-underline shadow-soft">
                <span className="flex flex-col">
                  <span className="font-black">{x.label}</span>
                  <span className="text-sm text-muted">{x.note}</span>
                </span>
                <ArrowRight size={19} className="shrink-0 text-primary" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
