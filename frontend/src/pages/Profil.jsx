import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  BookOpen, BrainCircuit, Check, ChevronRight, Eye, EyeOff,
  Flag, KeyRound, LayoutDashboard, Loader2, Lock, LogOut,
  ShieldCheck, UserCheck, Users,
} from 'lucide-react'
import { Card, PageHeader } from '../components/ui.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { pesanError } from '../lib/supabase.js'
import { formatTime } from '../lib/social.js'

export function RoleBadge({ role }) {
  return role === 'admin' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-black text-white">
      <ShieldCheck size={13} aria-hidden="true" /> Admin
    </span>
  ) : (
    <span className="inline-flex rounded-full bg-lilac px-2.5 py-1 text-xs font-black text-primary">
      Pengguna
    </span>
  )
}

const INPUT = 'min-h-12 w-full rounded-2xl border-2 border-line bg-white px-4 font-semibold outline-none transition focus:border-primary'

function Message({ ok, text }) {
  if (!text) return null
  return (
    <p
      role={ok ? 'status' : 'alert'}
      className={`rounded-2xl px-4 py-3 text-sm font-bold ${
        ok ? 'bg-mint text-[#22684A]' : 'bg-pink text-[#A3324F]'
      }`}
    >
      {text}
    </p>
  )
}

function MobileMenu({ isAdmin }) {
  const items = [
    { to: '/panduan', icon: BookOpen, label: 'Panduan' },
    ...(isAdmin
      ? [
          { to: '/admin', icon: LayoutDashboard, label: 'Dashboard Admin' },
          { to: '/admin/pengguna', icon: Users, label: 'Kelola Pengguna' },
          { to: '/admin/laporan', icon: Flag, label: 'Laporan Prediksi Salah' },
          { to: '/admin/model', icon: BrainCircuit, label: 'Info Model' },
        ]
      : []),
  ]
  return (
    <Card className="flex flex-col gap-1 p-3 lg:hidden">
      {items.map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          className="flex min-h-13 items-center gap-3 rounded-2xl px-3 font-extrabold text-ink no-underline hover:bg-page"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-lilac text-primary">
            <Icon size={18} aria-hidden="true" />
          </span>
          <span className="flex-1">{label}</span>
          <ChevronRight size={18} className="text-muted" aria-hidden="true" />
        </Link>
      ))}
    </Card>
  )
}

export default function Profil() {
  const { user, profile, isAdmin, displayName, updateName, updatePassword, signOut } = useAuth()
  const [params] = useSearchParams()
  const fromReset = params.get('ganti-password') === '1'

  const [name, setName] = useState(profile?.full_name ?? '')
  const [nameMsg, setNameMsg] = useState({})
  const [savingName, setSavingName] = useState(false)

  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [pwMsg, setPwMsg] = useState({})
  const [savingPw, setSavingPw] = useState(false)

  useEffect(() => {
    if (profile?.full_name && !name) {
      setName(profile.full_name)
    }
  }, [profile?.full_name])

  const trimmedName = name.trim()
  const isNameUnchanged = trimmedName === (profile?.full_name ?? '').trim()

  async function saveName(e) {
    e.preventDefault()
    if (!trimmedName || isNameUnchanged) return
    setSavingName(true)
    setNameMsg({})
    try {
      await updateName(trimmedName)
      setNameMsg({ ok: true, text: 'Nama berhasil disimpan.' })
    } catch (err) {
      setNameMsg({ ok: false, text: pesanError(err, 'Nama gagal disimpan.') })
    } finally {
      setSavingName(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    setPwMsg({})
    if (pw.length < 8) return setPwMsg({ ok: false, text: 'Password minimal 8 karakter.' })
    if (pw !== pw2) return setPwMsg({ ok: false, text: 'Kedua password tidak sama.' })
    setSavingPw(true)
    try {
      await updatePassword(pw)
      setPw('')
      setPw2('')
      setShowPw(false)
      setShowPw2(false)
      setPwMsg({ ok: true, text: 'Password berhasil diganti.' })
    } catch (err) {
      setPwMsg({ ok: false, text: pesanError(err, 'Password gagal diganti.') })
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-8">
      <PageHeader title="Profil" subtitle="Atur nama dan password akunmu." />

      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span className="flex size-16 shrink-0 items-center justify-center rounded-[22px] bg-lilac text-2xl font-black text-primary uppercase">
            {displayName.slice(0, 1)}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-2 text-xl font-black">
              {displayName} <RoleBadge role={profile?.role} />
            </span>
            <span className="truncate text-sm font-medium text-muted">{user?.email}</span>
            {profile?.created_at && (
              <span className="text-xs font-semibold text-muted">
                Bergabung {formatTime(profile.created_at)}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-pink px-5 font-extrabold text-[#A3324F] transition hover:opacity-90"
        >
          <LogOut size={17} aria-hidden="true" /> Keluar
        </button>
      </Card>

      <MobileMenu isAdmin={isAdmin} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Kartu 1: Data Akun */}
        <Card className="flex flex-col">
          <form onSubmit={saveName} className="flex h-full flex-col justify-between gap-5">
            <div className="flex flex-col gap-4">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <UserCheck size={20} className="text-primary" aria-hidden="true" /> Data akun
              </h2>

              <label className="flex flex-col gap-1.5 text-sm font-extrabold">
                Nama lengkap
                <input
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={INPUT}
                />
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-extrabold">
                <span className="flex items-center gap-1.5">
                  Email
                  <span className="inline-flex items-center gap-1 rounded-full bg-page px-2 py-0.5 text-[11px] font-bold text-muted">
                    <Lock size={11} aria-hidden="true" /> Terkunci
                  </span>
                </span>
                <input
                  value={user?.email ?? ''}
                  readOnly
                  className={`${INPUT} cursor-not-allowed bg-page/80 text-muted focus:border-line`}
                />
              </label>

              <p className="text-xs font-medium text-muted">
                Email dan role akun hanya dapat diubah melalui manajemen pengguna oleh admin.
              </p>
              <Message {...nameMsg} />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={savingName || !trimmedName || isNameUnchanged}
                className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 font-black text-white shadow-button transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {savingName ? (
                  <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Check size={17} aria-hidden="true" />
                )}
                <span>Simpan nama</span>
              </button>
            </div>
          </form>
        </Card>

        {/* Kartu 2: Ganti Password */}
        <Card className={`flex flex-col ${fromReset ? 'ring-4 ring-primary/30' : ''}`}>
          <form onSubmit={savePassword} className="flex h-full flex-col justify-between gap-5">
            <div className="flex flex-col gap-4">
              <h2 className="flex items-center gap-2 text-xl font-black">
                <KeyRound size={19} className="text-primary" aria-hidden="true" /> Ganti password
              </h2>

              {fromReset && (
                <p className="rounded-2xl bg-butter px-4 py-3 text-sm font-bold">
                  Buat password baru untuk akunmu di sini.
                </p>
              )}

              <label className="flex flex-col gap-1.5 text-sm font-extrabold">
                Password baru
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    placeholder="Minimal 8 karakter"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    className={`${INPUT} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Sembunyikan password' : 'Lihat password'}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-xl p-1.5 text-muted hover:bg-page hover:text-ink"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <label className="flex flex-col gap-1.5 text-sm font-extrabold">
                Ulangi password baru
                <div className="relative">
                  <input
                    type={showPw2 ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    required
                    placeholder="Ketik ulang password baru"
                    value={pw2}
                    onChange={(e) => setPw2(e.target.value)}
                    className={`${INPUT} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw2((v) => !v)}
                    aria-label={showPw2 ? 'Sembunyikan ulangi password' : 'Lihat ulangi password'}
                    className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-xl p-1.5 text-muted hover:bg-page hover:text-ink"
                  >
                    {showPw2 ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              <p className="text-xs font-medium text-muted">
                Gunakan minimal 8 karakter kombinasi huruf dan angka agar akun tetap aman.
              </p>
              <Message {...pwMsg} />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={savingPw || !pw || !pw2}
                className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 font-black text-white shadow-button transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {savingPw ? (
                  <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                ) : (
                  <KeyRound size={17} aria-hidden="true" />
                )}
                <span>Ganti password</span>
              </button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}