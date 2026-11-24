import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { Card, PageHeader } from '../../components/ui.jsx'
import { RoleBadge } from '../Profil.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { adminListUsers, adminUpdateUser } from '../../lib/db.js'
import { formatNumber } from '../../lib/emotions.js'
import { formatTime } from '../../lib/social.js'
import { pesanError } from '../../lib/supabase.js'

function StatusPill({ active }) {
  return active ? (
    <span className="inline-flex rounded-full bg-mint px-2.5 py-1 text-xs font-extrabold text-[#22684A]">Aktif</span>
  ) : (
    <span className="inline-flex rounded-full bg-pink px-2.5 py-1 text-xs font-extrabold text-[#A3324F]">Nonaktif</span>
  )
}

function Actions({ u, isSelf, busy, onChange }) {
  const btn = 'min-h-9 cursor-pointer rounded-full px-3 text-[13px] font-extrabold disabled:cursor-not-allowed disabled:opacity-50'
  return (
    <div className="flex flex-wrap gap-1.5">
      {u.role === 'admin' ? (
        <button type="button" disabled={busy || isSelf} onClick={() => onChange(u, { role: 'pengguna' })} className={`${btn} bg-page text-ink`}
          title={isSelf ? 'Tidak bisa menurunkan role akunmu sendiri' : undefined}>
          Jadikan Pengguna
        </button>
      ) : (
        <button type="button" disabled={busy} onClick={() => onChange(u, { role: 'admin' })} className={`${btn} bg-lilac text-primary`}>
          Jadikan Admin
        </button>
      )}
      {u.is_active ? (
        <button type="button" disabled={busy || isSelf} onClick={() => onChange(u, { is_active: false })} className={`${btn} bg-pink text-[#A3324F]`}
          title={isSelf ? 'Tidak bisa menonaktifkan akunmu sendiri' : undefined}>
          Nonaktifkan
        </button>
      ) : (
        <button type="button" disabled={busy} onClick={() => onChange(u, { is_active: true })} className={`${btn} bg-mint text-[#22684A]`}>
          Aktifkan
        </button>
      )}
      {busy && <Loader2 size={16} className="animate-spin self-center text-muted" aria-label="Menyimpan" />}
    </div>
  )
}

export default function KelolaPengguna() {
  const { user } = useAuth()
  const [users, setUsers] = useState(null)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('semua')
  const [busyId, setBusyId] = useState(null)
  const [message, setMessage] = useState({})

  const load = useCallback(async () => {
    try {
      setUsers(await adminListUsers())
    } catch (err) {
      setMessage({ ok: false, text: pesanError(err, 'Daftar pengguna tidak bisa dimuat.') })
      setUsers([])
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function handleChange(u, changes) {
    const what = changes.role
      ? `Jadikan ${u.email} sebagai ${changes.role === 'admin' ? 'Admin' : 'Pengguna'}?`
      : changes.is_active
        ? `Aktifkan kembali akun ${u.email}?`
        : `Nonaktifkan akun ${u.email}? Orang ini tidak bisa menganalisis sampai diaktifkan lagi.`
    if (!window.confirm(what)) return
    setBusyId(u.id)
    setMessage({})
    try {
      await adminUpdateUser(u.id, changes)
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, ...changes } : x)))
      setMessage({ ok: true, text: `Perubahan untuk ${u.email} tersimpan.` })
    } catch (err) {
      setMessage({ ok: false, text: pesanError(err, 'Perubahan gagal disimpan.') })
    } finally {
      setBusyId(null)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (users ?? []).filter(
      (u) =>
        (roleFilter === 'semua' || u.role === roleFilter || (roleFilter === 'nonaktif' && !u.is_active)) &&
        (!q || u.email.toLowerCase().includes(q) || u.full_name.toLowerCase().includes(q)),
    )
  }, [users, query, roleFilter])

  const counts = useMemo(() => {
    const list = users ?? []
    return {
      semua: list.length,
      admin: list.filter((u) => u.role === 'admin').length,
      pengguna: list.filter((u) => u.role === 'pengguna').length,
      nonaktif: list.filter((u) => !u.is_active).length,
    }
  }, [users])

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Kelola Pengguna" subtitle="Atur role dan status akun. Akun baru otomatis menjadi Pengguna." />

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-[1_1_260px]">
            <span className="sr-only">Cari pengguna</span>
            <Search size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau email"
              className="min-h-11 w-full rounded-full border-2 border-line pr-4 pl-10 font-semibold outline-none focus:border-primary"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[['semua', 'Semua'], ['admin', 'Admin'], ['pengguna', 'Pengguna'], ['nonaktif', 'Nonaktif']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={roleFilter === key}
                onClick={() => setRoleFilter(key)}
                className={`min-h-10 cursor-pointer rounded-full px-3.5 text-sm font-extrabold ${roleFilter === key ? 'bg-primary text-white' : 'bg-page text-muted'}`}
              >
                {label} ({counts[key]})
              </button>
            ))}
          </div>
        </div>

        {message.text && (
          <p role={message.ok ? 'status' : 'alert'} className={`rounded-2xl px-4 py-3 text-sm font-bold ${message.ok ? 'bg-mint text-[#22684A]' : 'bg-pink text-[#A3324F]'}`}>
            {message.text}
          </p>
        )}

        {users === null ? (
          <p className="flex items-center gap-2 font-bold text-muted"><Loader2 size={18} className="animate-spin" aria-hidden="true" /> Memuat pengguna…</p>
        ) : (
          <>
            {/* Desktop: tabel */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-[15px]">
                <thead>
                  <tr className="border-b-2 border-line text-sm text-muted">
                    <th className="px-3 py-3 font-extrabold">Pengguna</th>
                    <th className="px-3 py-3 font-extrabold">Role</th>
                    <th className="px-3 py-3 font-extrabold">Status</th>
                    <th className="px-3 py-3 font-extrabold">Analisis</th>
                    <th className="px-3 py-3 font-extrabold">Terakhir aktif</th>
                    <th className="px-3 py-3 font-extrabold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-3 py-8 text-center font-semibold text-muted">Tidak ada pengguna yang cocok.</td></tr>
                  )}
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-line align-middle">
                      <td className="px-3 py-3">
                        <span className="block font-extrabold">{u.full_name || '—'}{u.id === user.id && <span className="ml-1.5 text-xs font-bold text-muted">(kamu)</span>}</span>
                        <span className="text-sm text-muted">{u.email}</span>
                      </td>
                      <td className="px-3 py-3"><RoleBadge role={u.role} /></td>
                      <td className="px-3 py-3"><StatusPill active={u.is_active} /></td>
                      <td className="px-3 py-3 tabular-nums">
                        {formatNumber(u.analyses_count)}
                        <span className="block text-xs text-muted">{formatNumber(u.comments_count)} komentar</span>
                      </td>
                      <td className="px-3 py-3 text-sm text-muted">{u.last_analysis_at ? formatTime(u.last_analysis_at) : 'Belum pernah'}</td>
                      <td className="px-3 py-3"><Actions u={u} isSelf={u.id === user.id} busy={busyId === u.id} onChange={handleChange} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* HP: kartu */}
            <ul className="flex flex-col gap-3 lg:hidden">
              {filtered.length === 0 && <li className="py-6 text-center font-semibold text-muted">Tidak ada pengguna yang cocok.</li>}
              {filtered.map((u) => (
                <li key={u.id} className="flex flex-col gap-2.5 rounded-[20px] border-2 border-line p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold">{u.full_name || '—'}</span>
                    {u.id === user.id && <span className="text-xs font-bold text-muted">(kamu)</span>}
                    <RoleBadge role={u.role} />
                    <StatusPill active={u.is_active} />
                  </div>
                  <span className="truncate text-sm text-muted">{u.email}</span>
                  <span className="text-sm text-muted">
                    {formatNumber(u.analyses_count)} analisis · {u.last_analysis_at ? `terakhir ${formatTime(u.last_analysis_at)}` : 'belum pernah menganalisis'}
                  </span>
                  <Actions u={u} isSelf={u.id === user.id} busy={busyId === u.id} onChange={handleChange} />
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  )
}
