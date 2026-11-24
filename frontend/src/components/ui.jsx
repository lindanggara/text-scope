import { emotionInfo, tint } from '../lib/emotions.js'

export function Card({ className = '', children, ...props }) {
  return (
    <section className={`card-glow rounded-[24px] bg-white p-5 shadow-soft sm:rounded-[28px] sm:p-6 ${className}`} {...props}>
      {children}
    </section>
  )
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[28px] font-black tracking-tight sm:text-[34px]">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2.5">{actions}</div>}
    </header>
  )
}

export function Dot({ color, size = 10 }) {
  return <span className="inline-block shrink-0 rounded-full" style={{ width: size, height: size, background: color }} />
}

export function EmotionChip({ emotion }) {
  const info = emotionInfo(emotion)
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-extrabold" style={{ background: tint(emotion, '1F') }}>
      <Dot color={info.color} size={9} />
      {info.nama}
    </span>
  )
}

// Tombol pil untuk memilih emosi (Topic Radar dan filter tabel).
export function EmotionPill({ label, color, active, onClick }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex min-h-[42px] cursor-pointer items-center gap-2 rounded-full px-4 text-sm transition ${active ? 'font-black' : 'font-bold hover:brightness-95'}`}
      style={{
        background: active ? color + '2E' : '#F7F4FC',
        boxShadow: active ? `inset 0 0 0 2px ${color}` : 'none',
      }}
    >
      <Dot color={color} />
      {label}
    </button>
  )
}

/**
 * Ikon ⓘ kecil dengan penjelasan singkat.
 * Muncul saat kursor diarahkan, saat difokus dengan keyboard, atau saat disentuh di HP.
 */
export function InfoTip({ text, label = 'Penjelasan', align = 'center' }) {
  const pos = align === 'left' ? 'left-0' : align === 'right' ? 'right-0' : 'left-1/2 -translate-x-1/2'
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={label}
        className="flex size-6 cursor-help items-center justify-center rounded-full text-[#8A84A0] transition hover:bg-lilac hover:text-primary focus-visible:bg-lilac focus-visible:text-primary"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5" />
          <path d="M12 7.5v.01" />
        </svg>
      </button>
      <span
        role="tooltip"
        className={`pointer-events-none invisible absolute top-full z-30 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl bg-ink px-3.5 py-2.5 text-left text-[13px] leading-relaxed font-semibold tracking-normal normal-case text-white opacity-0 shadow-soft transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 ${pos}`}
      >
        {text}
      </span>
    </span>
  )
}
