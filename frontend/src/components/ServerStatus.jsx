import { Loader2 } from 'lucide-react'

const STYLE = {
  checking: { bg: '#ECE6FB', dot: '#6B5DC2', text: 'Mengecek server...' },
  ready: { bg: '#DFF3EA', dot: '#1BAF7A', text: 'Server siap' },
  waking: { bg: '#FFF2D2', dot: '#C98A00', text: 'Menyiapkan server, bisa butuh hingga 1 menit...' },
  offline: { bg: '#FDE3E3', dot: '#E34948', text: 'Server belum bisa dihubungi. Coba muat ulang halaman nanti.' },
}

export default function ServerStatus({ status }) {
  const s = STYLE[status] ?? STYLE.checking
  const busy = status === 'checking' || status === 'waking'
  return (
    <span role="status" className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[13px] font-extrabold text-ink" style={{ background: s.bg }}>
      {busy ? (
        <Loader2 size={14} className="animate-spin" style={{ color: s.dot }} aria-hidden="true" />
      ) : (
        <span className="size-2.5 rounded-full" style={{ background: s.dot }} aria-hidden="true" />
      )}
      {s.text}
    </span>
  )
}