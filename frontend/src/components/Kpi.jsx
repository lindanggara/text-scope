import { useCountUp } from '../lib/useCountUp.js'
import { InfoTip } from './ui.jsx'

// Kotak angka ringkasan (dipakai di Hasil Analisis dan Dashboard Admin).
export default function Kpi({ bg, iconColor, icon: Icon, label, value, count, suffix = '', decimals = 0, note, tip }) {
  const n = useCountUp(count ?? 0)
  const shown = count !== undefined
    ? `${n.toLocaleString('id-ID', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
    : value
  return (
    <div className="lift relative flex flex-col gap-2 rounded-[22px] p-4 sm:rounded-[26px] sm:p-5" style={{ background: bg }}>
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true"><span className="tile-blob" /></span>
      <div className="relative flex items-center justify-between gap-2">
        <span className="flex items-center gap-0.5 text-sm font-extrabold text-muted">{label}{tip && <InfoTip label={`Apa itu ${label.toLowerCase()}?`} text={tip} />}</span>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[15px] bg-white shadow-soft" style={{ color: iconColor }}>
          <Icon size={22} aria-hidden="true" />
        </span>
      </div>
      <span className="relative text-[26px] leading-tight font-black tabular-nums sm:text-[32px]">{shown}</span>
      <span className="relative text-[13px] text-muted">{note}</span>
    </div>
  )
}
