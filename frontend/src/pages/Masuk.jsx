import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, MailCheck, Settings } from 'lucide-react'
import Logo from '../components/Logo.jsx'
import Owl from '../components/Owl.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { pesanError } from '../lib/supabase.js'

const MIN_PASSWORD = 8
const INPUT = 'min-h-12 w-full rounded-2xl border-2 border-line bg-white px-4 text-base font-semibold outline-none transition placeholder:font-normal placeholder:text-muted/55 focus:border-primary'

function Field({ label, id, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-extrabold">{label}</label>
      {children}
      {hint && <p className="text-[13px] text-muted">{hint}</p>}
    </div>
  )
}

function PasswordInput({ id, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  function checkCaps(e) {
    if (typeof e.getModifierState === 'function') {
      setCapsLock(e.getModifierState('CapsLock'))
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required
          minLength={MIN_PASSWORD}
          autoComplete={autoComplete}
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={checkCaps}
          onKeyDown={checkCaps}
          onBlur={() => setCapsLock(false)}
          className={`${INPUT} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
          className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-lilac"
        >
          {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>
      {capsLock && (
        <p className="text-xs font-bold text-[#B57B00]">
          Caps Lock sedang aktif. Pastikan huruf besar/kecil password sesuai.
        </p>
      )}
    </div>
  )
}

function NotConfigured() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-butter p-4 text-[15px] leading-relaxed">
      <span className="flex items-center gap-2 font-black"><Settings size={18} aria-hidden="true" /> Login belum diatur</span>
      <p>
        Isi <code className="rounded bg-white px-1.5">VITE_SUPABASE_URL</code> dan{' '}
        <code className="rounded bg-white px-1.5">VITE_SUPABASE_ANON_KEY</code> di file <code className="rounded bg-white px-1.5">frontend/.env</code>,
        lalu jalankan ulang <code className="rounded bg-white px-1.5">npm run dev</code>. Langkah lengkapnya ada di <b>supabase/README.md</b>.
      </p>
    </div>
  )
}

export default function Masuk() {
  const { ready, loading, user, signIn, signUp, resetPassword } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const from = location.state?.from && location.state.from !== '/masuk' ? location.state.from : '/upload'

  const [mode, setMode] = useState('masuk') // masuk | daftar | lupa
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  if (!loading && user) return <Navigate to={from} replace />

  function switchMode(next) {
    setMode(next)
    setError('')
    setNotice('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (mode !== 'lupa' && password.length < MIN_PASSWORD) {
      setError(`Password minimal ${MIN_PASSWORD} karakter.`)
      return
    }
    setBusy(true)
    try {
      if (mode === 'masuk') {
        await signIn(email.trim(), password)
        navigate(from, { replace: true })
      } else if (mode === 'daftar') {
        const { needsConfirmation } = await signUp(email.trim(), password, name.trim())
        if (needsConfirmation) {
          setNotice(`Akun dibuat. Kami mengirim link konfirmasi ke ${email.trim()}. Buka link itu, lalu masuk di sini.`)
          setMode('masuk')
          setPassword('')
        } else {
          navigate('/upload', { replace: true })
        }
      } else {
        await resetPassword(email.trim())
        setNotice(`Kalau ${email.trim()} terdaftar, link untuk membuat password baru sudah dikirim ke email tersebut.`)
      }
    } catch (err) {
      setError(pesanError(err))
    } finally {
      setBusy(false)
    }
  }

  const title = { masuk: 'Masuk ke TextScope', daftar: 'Buat akun baru', lupa: 'Lupa password' }[mode]
  const button = { masuk: 'Masuk', daftar: 'Daftar', lupa: 'Kirim link reset' }[mode]

  const highlights = [
    'Riwayat analisis tersimpan otomatis di akunmu',
    'Hanya kamu yang bisa melihat data analisis milikmu',
    'Laporkan prediksi keliru untuk membantu evaluasi model',
  ]

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="mx-auto flex w-full max-w-[1100px] items-center justify-between px-4 py-4 sm:px-8">
        <Link to="/" aria-label="TextScope, ke halaman utama" className="no-underline"><Logo size={30} /></Link>
        <div className="flex items-center gap-1.5">
          <Link to="/" className="flex min-h-11 items-center rounded-full px-4 font-extrabold text-muted no-underline transition hover:bg-white hover:text-ink">
            Beranda
          </Link>
          <Link to="/panduan" className="flex min-h-11 items-center rounded-full px-4 font-extrabold text-[#4A4360] no-underline transition hover:bg-white">
            Panduan
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1100px] flex-1 items-center gap-10 px-4 pb-10 sm:px-8">
        <section className="hidden flex-1 flex-col gap-5 lg:flex">
          <Owl size={200} />
          <h2 className="text-4xl leading-tight font-black tracking-tight text-ink">
            Pahami emosi di balik komentar audiensmu.
          </h2>
          <ul className="flex flex-col gap-3 text-[16px] font-medium text-muted">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-lilac text-primary">
                  <CheckCircle2 size={16} aria-hidden="true" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card-glow mx-auto flex w-full max-w-[440px] flex-col gap-5 rounded-[28px] bg-white p-6 shadow-soft sm:p-8">
          {mode === 'lupa' ? (
            <button type="button" onClick={() => switchMode('masuk')} className="flex cursor-pointer items-center gap-1.5 self-start text-sm font-extrabold text-primary">
              <ArrowLeft size={16} aria-hidden="true" /> Kembali ke Masuk
            </button>
          ) : (
            <div role="tablist" aria-label="Pilih masuk atau daftar" className="grid grid-cols-2 rounded-full bg-page p-1">
              {[['masuk', 'Masuk'], ['daftar', 'Daftar']].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={mode === key}
                  onClick={() => switchMode(key)}
                  className={`min-h-11 cursor-pointer rounded-full font-extrabold transition ${mode === key ? 'bg-white text-primary shadow-soft' : 'text-muted'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <div>
            <h1 className="text-[26px] font-black tracking-tight">{title}</h1>
            <p className="mt-1 text-muted">
              {mode === 'masuk' && 'Masuk untuk menganalisis komentar dan membuka riwayatmu.'}
              {mode === 'daftar' && 'Gratis. Akun baru otomatis menjadi Pengguna.'}
              {mode === 'lupa' && 'Masukkan email akunmu. Kami kirim link untuk membuat password baru.'}
            </p>
          </div>

          {!ready ? (
            <NotConfigured />
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate={false}>
              {mode === 'daftar' && (
                <Field label="Nama lengkap" id="nama">
                  <input
                    id="nama"
                    required
                    maxLength={80}
                    autoComplete="name"
                    placeholder="Contoh: Linda Anggara"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={INPUT}
                  />
                </Field>
              )}
              <Field label="Email" id="email">
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={INPUT}
                />
              </Field>
              {mode !== 'lupa' && (
                <Field label="Password" id="password" hint={mode === 'daftar' ? `Minimal ${MIN_PASSWORD} karakter.` : undefined}>
                  <PasswordInput id="password" value={password} onChange={setPassword} autoComplete={mode === 'daftar' ? 'new-password' : 'current-password'} />
                </Field>
              )}
              {mode === 'masuk' && (
                <button type="button" onClick={() => switchMode('lupa')} className="-mt-2 cursor-pointer self-end text-sm font-extrabold text-primary">
                  Lupa password?
                </button>
              )}

              {error && <p role="alert" className="rounded-2xl bg-pink px-4 py-3 text-sm font-bold text-[#A3324F]">{error}</p>}
              {notice && (
                <p role="status" className="flex gap-2 rounded-2xl bg-mint px-4 py-3 text-sm font-bold text-[#22684A]">
                  <MailCheck size={18} className="shrink-0" aria-hidden="true" /> {notice}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="flex min-h-13 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary text-lg font-black text-white shadow-button transition hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70"
              >
                {busy && <Loader2 size={20} className="animate-spin" aria-hidden="true" />} {button}
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}