import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Loader2, ShieldAlert, UserX } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import Owl from './Owl.jsx'

function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center gap-2 font-bold text-muted">
      <Loader2 size={20} className="animate-spin" aria-hidden="true" /> Memeriksa akun…
    </div>
  )
}

function Blocked({ icon: Icon, title, text, children }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-3 rounded-[28px] bg-white p-8 text-center shadow-soft">
      <Owl size={96} />
      <span className="flex items-center gap-2 text-xl font-black"><Icon size={22} className="text-primary" aria-hidden="true" /> {title}</span>
      <p className="leading-relaxed text-muted">{text}</p>
      {children}
    </div>
  )
}

// Halaman yang wajib login (semua role).
export function RequireAuth() {
  const { loading, user, profile, isActive, profileError, signOut } = useAuth()
  const location = useLocation()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/masuk" replace state={{ from: location.pathname }} />
  if (profileError) {
    return <Blocked icon={ShieldAlert} title="Akun belum bisa dimuat" text={profileError} />
  }
  if (!profile) return <Loading />
  if (!isActive) {
    return (
      <Blocked icon={UserX} title="Akun dinonaktifkan" text="Akun kamu sedang dinonaktifkan oleh admin TextScope. Hubungi admin kalau menurutmu ini keliru.">
        <button type="button" onClick={signOut} className="mt-2 min-h-11 cursor-pointer rounded-full bg-lilac px-5 font-extrabold text-primary">
          Keluar
        </button>
      </Blocked>
    )
  }
  return <Outlet />
}

// Halaman khusus admin. Database dan backend juga memeriksa role,
// jadi penjaga ini hanya untuk tampilan.
export function RequireAdmin() {
  const { isAdmin } = useAuth()
  if (!isAdmin) {
    return (
      <Blocked icon={ShieldAlert} title="Khusus admin" text="Halaman ini hanya bisa dibuka oleh admin TextScope.">
        <Link to="/upload" className="mt-2 flex min-h-11 items-center rounded-full bg-lilac px-5 font-extrabold text-primary no-underline">
          Kembali ke Analisis
        </Link>
      </Blocked>
    )
  }
  return <Outlet />
}
