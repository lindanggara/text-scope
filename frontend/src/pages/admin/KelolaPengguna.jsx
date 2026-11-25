import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity, Check, Download, Edit3, Loader2, RefreshCw, Search,
  ShieldCheck, UserCheck, UserPlus, Users, X,
} from 'lucide-react'
import { Card } from '../../components/ui.jsx'
import { RoleBadge } from '../Profil.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { adminCreateUser, adminListUsers, adminUpdateUser } from '../../lib/db.js'
import { formatNumber } from '../../lib/emotions.js'
import { formatTime } from '../../lib/social.js'
import { pesanError } from '../../lib/supabase.js'

function StatusPill({ active }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2.5 py-1 text-xs font-extrabold text-[#22684A]">
      <span className="size-1.5 rounded-full bg-[#22684A]" /> Aktif
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-pink px-2.5 py-1 text-xs font-extrabold text-[#A3324F]">
      <span className="size-1.5 rounded-full bg-[#A3324F]" /> Nonaktif
    </span>
  )
}

function Actions({ u, isSelf, busy, onChange, onEditName }) {
  const btn = 'min-h-8 cursor-pointer rounded-full px-3 text-xs font-extrabold transition disabled:cursor-not-allowed disabled:opacity-45'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        disabled={busy}
        onClick={() => onEditName(u)}
        title="Ubah nama lengkap"
        className={`${btn} inline-flex items-center gap-1 border border-line bg-white text-ink hover:bg-lilac/40`}
      >
        <Edit3 size={12} /> Edit Nama
      </button>

      {u.role === 'admin' ? (
        <button
          type="button"
          disabled={busy || isSelf}
          onClick={() => onChange(u, { role: 'pengguna' })}
          className={`${btn} bg-page text-ink hover:bg-line/60`}
          title={isSelf ? 'Tidak bisa menurunkan role akunmu sendiri' : undefined}
        >
          Jadikan Pengguna
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => onChange(u, { role: 'admin' })}
          className={`${btn} bg-lilac text-primary hover:opacity-90`}
        >
          Jadikan Admin
        </button>
      )}

      {u.is_active ? (
        <button
          type="button"
          disabled={busy || isSelf}
          onClick={() => onChange(u, { is_active: false })}
          className={`${btn} bg-pink text-[#A3324F] hover:opacity-90`}
          title={isSelf ? 'Tidak bisa menonaktifkan akunmu sendiri' : undefined}
        >
          Nonaktifkan
        </button>
      ) : (
        <button
          type="button"
          disabled={busy}
          onClick={() => onChange(u, { is_active: true })}
          className={`${btn} bg-mint text-[#22684A] hover:opacity-90`}
        >
          Aktifkan
        </button>
      )}

      {busy && <Loader2 size={15} className="animate-spin text-primary" aria-label="Menyimpan" />}
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

  // State modal tambah pengguna baru
  const [showAdd, setShowAdd] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formNew, setFormNew] = useState({ full_name: '', email: '', password: '', role: 'pengguna' })

  // State inline edit nama
  const [editingId, setEditingId] = useState(null)
  const [editNameVal, setEditNameVal] = useState('')

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

  function startEditName(u) {
    setEditingId(u.id)
    setEditNameVal(u.full_name || '')
  }

  async function saveEditName(u) {
    const clean = editNameVal.trim()
    if (!clean || clean === u.full_name) {
      setEditingId(null)
      return
    }
    setBusyId(u.id)
    setMessage({})
    try {
      await adminUpdateUser(u.id, { full_name: clean })
      setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, full_name: clean } : x)))
      setMessage({ ok: true, text: `Nama lengkap diperbarui menjadi "${clean}".` })
    } catch (err) {
      setMessage({ ok: false, text: pesanError(err, 'Gagal memperbarui nama.') })
    } finally {
      setBusyId(null)
      setEditingId(null)
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault()
    if (!formNew.full_name.trim() || !formNew.email.trim() || formNew.password.length < 8) {
      setMessage({ ok: false, text: 'Isi nama lengkap, email valid, dan password minimal 8 karakter.' })
      return
    }
    setCreating(true)
    setMessage({})
    try {
      await adminCreateUser(formNew)
      setMessage({ ok: true, text: `Akun baru ${formNew.email} berhasil dibuat!` })
      setFormNew({ full_name: '', email: '', password: '', role: 'pengguna' })
      setShowAdd(false)
      await load()
    } catch (err) {
      setMessage({ ok: false, text: pesanError(err, 'Gagal menambahkan pengguna baru.') })
    } finally {
      setCreating(false)
    }
  }

  function exportCsv() {
    if (!users?.length) return
    const header = ['Nama Lengkap', 'Email', 'Role', 'Status', 'Jumlah Analisis', 'Total Komentar', 'Terakhir Aktif']
    const rows = users.map((u) => [
      `"${(u.full_name || '').replaceAll('"', '""')}"`,
      u.email,
      u.role,
      u.is_active ? 'Aktif' : 'Nonaktif',
      u.analyses_count ?? 0,
      u.comments_count ?? 0,
      u.last_analysis_at || 'Belum pernah',
    ])
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pengguna_textscope_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (users ?? []).filter(
      (u) =>
        (roleFilter === 'semua' || u.role === roleFilter || (roleFilter === 'nonaktif' && !u.is_active)) &&
        (!q || u.email.toLowerCase().includes(q) || (u.full_name || '').toLowerCase().includes(q)),
    )
  }, [users, query, roleFilter])

  const stats = useMemo(() => {
    const list = users ?? []
    return {
      semua: list.length,
      admin: list.filter((u) => u.role === 'admin').length,
      pengguna: list.filter((u) => u.role === 'pengguna').length,
      nonaktif: list.filter((u) => !u.is_active).length,
      totalAnalisis: list.reduce((acc, u) => acc + (Number(u.analyses_count) || 0), 0),
      totalKomentar: list.reduce((acc, u) => acc + (Number(u.comments_count) || 0), 0),
    }
  }, [users])

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-8">
      {/* Header + Tombol Aksi */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] leading-tight font-black tracking-tight text-ink">
            Kelola Pengguna
          </h1>
          <p className="mt-1 text-sm font-medium text-muted">
            Atur role, status akses, profil akun, dan pantau aktivitas analisis setiap pengguna.
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
            onClick={exportCsv}
            disabled={!users?.length}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-white px-4 py-2.5 text-sm font-extrabold text-ink shadow-soft transition hover:bg-lilac/40 disabled:opacity-45"
          >
            <Download size={15} />
            <span>Unduh CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAdd((v) => !v)}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-white shadow-button transition hover:opacity-95"
          >
            <UserPlus size={16} />
            <span>Tambah Pengguna</span>
          </button>
        </div>
      </div>

      {/* 4 Kartu Ringkasan Pengguna */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center justify-between rounded-[24px] bg-[#ECE6FB] p-5">
          <div>
            <span className="text-xs font-extrabold tracking-wide text-[#4A4360] uppercase">Total Akun</span>
            <p className="mt-1 text-3xl font-black text-ink tabular-nums">{stats.semua}</p>
            <span className="text-xs font-semibold text-muted">{stats.nonaktif} nonaktif</span>
          </div>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/85 text-primary">
            <Users size={21} />
          </span>
        </div>

        <div className="flex items-center justify-between rounded-[24px] bg-[#DFF3EA] p-5">
          <div>
            <span className="text-xs font-extrabold tracking-wide text-[#4A4360] uppercase">Admin</span>
            <p className="mt-1 text-3xl font-black text-ink tabular-nums">{stats.admin}</p>
            <span className="text-xs font-semibold text-muted">Akses penuh sistem</span>
          </div>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/85 text-[#237451]">
            <ShieldCheck size={21} />
          </span>
        </div>

        <div className="flex items-center justify-between rounded-[24px] bg-[#FDE7DC] p-5">
          <div>
            <span className="text-xs font-extrabold tracking-wide text-[#4A4360] uppercase">Pengguna Reguler</span>
            <p className="mt-1 text-3xl font-black text-ink tabular-nums">{stats.pengguna}</p>
            <span className="text-xs font-semibold text-muted">Akses analisis emosi</span>
          </div>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/85 text-[#C85A28]">
            <UserCheck size={21} />
          </span>
        </div>

        <div className="flex items-center justify-between rounded-[24px] bg-[#FFF2D2] p-5">
          <div>
            <span className="text-xs font-extrabold tracking-wide text-[#4A4360] uppercase">Total Analisis</span>
            <p className="mt-1 text-3xl font-black text-ink tabular-nums">{formatNumber(stats.totalAnalisis)}</p>
            <span className="text-xs font-semibold text-muted">{formatNumber(stats.totalKomentar)} komentar diproses</span>
          </div>
          <span className="flex size-11 items-center justify-center rounded-2xl bg-white/85 text-[#B57B00]">
            <Activity size={21} />
          </span>
        </div>
      </div>

      {/* Form Tambah Pengguna Baru (Collapsible Panel) */}
      {showAdd && (
        <Card className="border-2 border-primary/25 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-ink">Daftarkan Pengguna Baru</h2>
              <p className="text-xs text-muted">Buat akun baru untuk anggota tim atau pengguna tanpa keluar dari sesi admin.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-page text-muted hover:text-ink"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-xs font-extrabold text-muted">
              <span>Nama Lengkap</span>
              <input
                type="text"
                required
                placeholder="Contoh: Hanidz Habibah"
                value={formNew.full_name}
                onChange={(e) => setFormNew((p) => ({ ...p, full_name: e.target.value }))}
                className="min-h-11 rounded-2xl border-2 border-line px-3.5 text-sm font-bold text-ink outline-none focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-extrabold text-muted">
              <span>Alamat Email</span>
              <input
                type="email"
                required
                placeholder="nama@email.com"
                value={formNew.email}
                onChange={(e) => setFormNew((p) => ({ ...p, email: e.target.value }))}
                className="min-h-11 rounded-2xl border-2 border-line px-3.5 text-sm font-bold text-ink outline-none focus:border-primary"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-extrabold text-muted">
              <span>Password (min. 8 karakter)</span>
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                value={formNew.password}
                onChange={(e) => setFormNew((p) => ({ ...p, password: e.target.value }))}
                className="min-h-11 rounded-2xl border-2 border-line px-3.5 text-sm font-bold text-ink outline-none focus:border-primary"
              />
            </label>

            <div className="flex flex-col justify-between gap-1 text-xs font-extrabold text-muted">
              <span>Role & Simpan</span>
              <div className="flex gap-2">
                <select
                  value={formNew.role}
                  onChange={(e) => setFormNew((p) => ({ ...p, role: e.target.value }))}
                  className="min-h-11 rounded-2xl border-2 border-line bg-white px-3 text-sm font-bold text-ink outline-none focus:border-primary"
                >
                  <option value="pengguna">Pengguna</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-2xl bg-primary px-4 text-sm font-black text-white shadow-button transition hover:opacity-95 disabled:opacity-50"
                >
                  {creating ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </form>
        </Card>
      )}

      {/* Tabel & Pencarian Pengguna */}
      <Card className="flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-[1_1_260px]">
            <span className="sr-only">Cari pengguna</span>
            <Search size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau email"
              className="min-h-11 w-full rounded-full border-2 border-line pr-4 pl-10 text-sm font-semibold outline-none focus:border-primary"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {[['semua', 'Semua'], ['admin', 'Admin'], ['pengguna', 'Pengguna'], ['nonaktif', 'Nonaktif']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={roleFilter === key}
                onClick={() => setRoleFilter(key)}
                className={`min-h-10 cursor-pointer rounded-full px-3.5 text-sm font-extrabold transition ${
                  roleFilter === key ? 'bg-primary text-white' : 'bg-page text-muted hover:text-ink'
                }`}
              >
                {label} ({stats[key]})
              </button>
            ))}
          </div>
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

        {users === null ? (
          <p className="flex items-center gap-2 font-bold text-muted">
            <Loader2 size={18} className="animate-spin" aria-hidden="true" /> Memuat pengguna…
          </p>
        ) : (
          <>
            {/* Desktop: tabel */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left text-[15px]">
                <thead>
                  <tr className="border-b-2 border-line text-xs tracking-wider text-muted uppercase">
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
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center font-semibold text-muted">
                        Tidak ada pengguna yang cocok.
                      </td>
                    </tr>
                  )}
                  {filtered.map((u) => (
                    <tr key={u.id} className="border-b border-line/70 align-middle hover:bg-page/50">
                      <td className="px-3 py-3.5">
                        {editingId === u.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editNameVal}
                              onChange={(e) => setEditNameVal(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEditName(u)}
                              autoFocus
                              className="rounded-xl border-2 border-primary px-2.5 py-1 text-sm font-bold text-ink outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => saveEditName(u)}
                              className="flex size-7 cursor-pointer items-center justify-center rounded-lg bg-primary text-white"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="flex size-7 cursor-pointer items-center justify-center rounded-lg bg-page text-muted"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="block font-extrabold text-ink">
                              {u.full_name || '—'}
                              {u.id === user.id && (
                                <span className="ml-1.5 rounded-full bg-lilac px-2 py-0.5 text-[11px] font-black text-primary">
                                  kamu
                                </span>
                              )}
                            </span>
                            <span className="text-xs font-medium text-muted">{u.email}</span>
                          </>
                        )}
                      </td>
                      <td className="px-3 py-3.5"><RoleBadge role={u.role} /></td>
                      <td className="px-3 py-3.5"><StatusPill active={u.is_active} /></td>
                      <td className="px-3 py-3.5 tabular-nums">
                        <span className="font-bold text-ink">{formatNumber(u.analyses_count)}</span>
                        <span className="block text-xs text-muted">{formatNumber(u.comments_count)} komentar</span>
                      </td>
                      <td className="px-3 py-3.5 text-xs font-medium text-muted">
                        {u.last_analysis_at ? formatTime(u.last_analysis_at) : 'Belum pernah'}
                      </td>
                      <td className="px-3 py-3.5">
                        <Actions
                          u={u}
                          isSelf={u.id === user.id}
                          busy={busyId === u.id}
                          onChange={handleChange}
                          onEditName={startEditName}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* HP: kartu */}
            <ul className="flex flex-col gap-3 lg:hidden">
              {filtered.length === 0 && (
                <li className="py-6 text-center font-semibold text-muted">Tidak ada pengguna yang cocok.</li>
              )}
              {filtered.map((u) => (
                <li key={u.id} className="flex flex-col gap-2.5 rounded-[20px] border-2 border-line p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold">{u.full_name || '—'}</span>
                    {u.id === user.id && <span className="text-xs font-bold text-primary">(kamu)</span>}
                    <RoleBadge role={u.role} />
                    <StatusPill active={u.is_active} />
                  </div>
                  <span className="truncate text-sm text-muted">{u.email}</span>
                  <span className="text-sm text-muted">
                    {formatNumber(u.analyses_count)} analisis ·{' '}
                    {u.last_analysis_at ? `terakhir ${formatTime(u.last_analysis_at)}` : 'belum pernah menganalisis'}
                  </span>
                  <Actions
                    u={u}
                    isSelf={u.id === user.id}
                    busy={busyId === u.id}
                    onChange={handleChange}
                    onEditName={startEditName}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </div>
  )
}