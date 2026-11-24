import { useMemo } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Clock, Hash, Heart, TrendingUp } from 'lucide-react'
import { Card, Dot, EmotionPill } from './ui.jsx'
import { EMOTIONS, emotionInfo, formatNumber, tint } from '../lib/emotions.js'
import { buildTrend, emojiAndHashtags, formatTime, peakOf, topLiked } from '../lib/social.js'

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const rows = [...payload].sort((a, b) => b.value - a.value).filter((p) => p.value > 0)
  return (
    <div className="rounded-xl bg-white px-3 py-2 text-sm shadow-soft">
      <p className="mb-1 font-black">{label}</p>
      {rows.length === 0 && <p className="text-muted">Tidak ada komentar</p>}
      {rows.map((p) => (
        <p key={p.dataKey} className="flex items-center gap-2 font-bold">
          <Dot color={emotionInfo(p.dataKey).color} size={8} />
          {emotionInfo(p.dataKey).nama}: {p.value}
        </p>
      ))}
    </div>
  )
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[14px] bg-lilac text-primary">
        <Icon size={20} aria-hidden="true" />
      </span>
      <div>
        <h2 className="text-xl font-black">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function SocialInsights({ results, meta, activeEmotion, onSelectEmotion }) {
  const info = emotionInfo(activeEmotion)
  const nama = info.nama.toLowerCase()
  const trend = useMemo(() => (meta?.timeColumn ? buildTrend(results) : null), [results, meta])
  const peak = peakOf(trend, activeEmotion)
  const liked = meta?.likesColumn ? topLiked(results, activeEmotion) : []
  const { emoji, hashtags } = useMemo(() => emojiAndHashtags(results, activeEmotion), [results, activeEmotion])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-[24px] bg-white px-5 py-4 shadow-soft">
        <span className="text-sm font-extrabold text-muted">Tampilkan untuk emosi:</span>
        <div role="group" aria-label="Pilih emosi" className="flex flex-wrap gap-2">
          {EMOTIONS.map((e) => (
            <EmotionPill key={e} label={emotionInfo(e).nama} color={emotionInfo(e).color} active={activeEmotion === e} onClick={() => onSelectEmotion(e)} />
          ))}
        </div>
      </div>

      {trend ? (
        <Card className="flex flex-col gap-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <SectionTitle
              icon={TrendingUp}
              title="Tren emosi per waktu"
              subtitle={`Jumlah komentar tiap emosi per ${trend.unitName}, dari kolom “${meta.timeColumn}”`}
            />
            <span className="rounded-full bg-lilac px-3 py-1 text-[13px] font-extrabold text-primary">
              {formatNumber(trend.timedCount)} komentar bertanggal
            </span>
          </div>
          <div className="h-[300px] w-full" role="img" aria-label={`Grafik tren komentar per ${trend.unitName}. Emosi yang disorot: ${info.nama}.`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend.points} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid stroke="#F0ECF8" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: '#5F5875', fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#E6E0F5' }} minTickGap={24} />
                <YAxis allowDecimals={false} tick={{ fill: '#5F5875', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip content={<TrendTooltip />} />
                {EMOTIONS.filter((e) => e !== activeEmotion).map((e) => (
                  <Line key={e} type="monotone" dataKey={e} stroke={emotionInfo(e).color} strokeOpacity={0.25} strokeWidth={2} dot={false} isAnimationActive={false} />
                ))}
                <Line type="monotone" dataKey={activeEmotion} stroke={info.color} strokeWidth={4} dot={{ r: 3, fill: info.color }} activeDot={{ r: 6 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="rounded-2xl px-4 py-3 text-[15px]" style={{ background: tint(activeEmotion, '1F') }}>
            {peak
              ? <>Komentar <b>{nama}</b> paling banyak muncul pada <b>{peak.label}</b> ({peak.count} komentar).</>
              : <>Belum ada komentar <b>{nama}</b> yang bertanggal.</>}
          </p>
        </Card>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-muted shadow-soft">
          <Clock size={16} aria-hidden="true" />
          Tren emosi per waktu muncul kalau file punya kolom waktu dan kolom itu dipilih saat upload.
        </p>
      )}

      <div className="flex flex-wrap items-stretch gap-5">
        {meta?.likesColumn && (
          <Card className="flex min-w-0 flex-[1_1_440px] flex-col gap-4">
            <SectionTitle icon={Heart} title={`Komentar ${nama} paling disukai`} subtitle="Diurutkan dari jumlah likes terbanyak" />
            {liked.length === 0 ? (
              <p className="rounded-2xl bg-page px-4 py-6 text-center font-semibold text-muted">Belum ada komentar {nama} yang punya data likes.</p>
            ) : (
              <ol className="flex flex-col gap-2.5">
                {liked.map((r, i) => (
                  <li key={r.id} className="flex gap-3 rounded-2xl bg-page p-3.5">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-white text-sm font-black text-primary">{i + 1}</span>
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                      <p className="text-[15px] leading-relaxed">{r.text}</p>
                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-bold text-muted">
                        <span className="flex items-center gap-1 text-[#C2416F]">
                          <Heart size={14} fill="currentColor" aria-hidden="true" /> {formatNumber(r.likes)} likes
                        </span>
                        {r.time && <span>{formatTime(r.time)}</span>}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        )}

        <Card className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
          <SectionTitle icon={Hash} title="Emoji & hashtag" subtitle={`Yang paling sering dipakai di komentar ${nama}`} />
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-extrabold tracking-wide text-muted uppercase">Emoji</span>
            {emoji.length ? (
              <div className="flex flex-wrap gap-2">
                {emoji.map((e) => (
                  <span key={e.value} className="flex items-center gap-1.5 rounded-xl bg-page px-3 py-1.5">
                    <span className="text-xl leading-none" aria-hidden="true">{e.value}</span>
                    <span className="text-sm font-extrabold text-muted">×{e.count}</span>
                  </span>
                ))}
              </div>
            ) : <p className="text-sm text-muted">Tidak ada emoji di komentar {nama}.</p>}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-extrabold tracking-wide text-muted uppercase">Hashtag</span>
            {hashtags.length ? (
              <div className="flex flex-wrap gap-2">
                {hashtags.map((h) => (
                  <span key={h.value} className="rounded-xl px-3 py-1.5 text-sm font-extrabold" style={{ background: tint(activeEmotion, '24') }}>
                    {h.value} <span className="text-muted">×{h.count}</span>
                  </span>
                ))}
              </div>
            ) : <p className="text-sm text-muted">Tidak ada hashtag di komentar {nama}.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
