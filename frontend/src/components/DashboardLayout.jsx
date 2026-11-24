import { Suspense, useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BarChart3, BookOpen, BrainCircuit, Flag, History, LayoutDashboard, Loader2, Lock, LogIn, LogOut,
  PanelLeftClose, PanelLeftOpen, TrendingUp, Upload, UserRound, Users,
} from 'lucide-react'
import Logo, { LensMark } from './Logo.jsx'
import { useAnalysis } from '../context/AnalysisContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const STORAGE_KEY = 'textscope:sidebar-collapsed'

function readCollapsed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

// true kalau layar selebar laptop (breakpoint lg Tailwind = 1024px).
function useIsDesktop() {
  const query = '(min-width: 1024px)'
  const [match, setMatch] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = (e) => setMatch(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return match
}

function NavItem({ to, icon: Icon, label, locked, collapsed, end }) {
  // Saat sidebar diciutkan, hanya ikon yang tampil; nama menu jadi tooltip.
  const tip = collapsed ? (locked ? `${label} (terkunci)` : label) : undefined

  if (locked) {
    return (
      <div
        aria-disabled="true"
        aria-label={collapsed ? `${label}, terkunci` : undefined}
        title={tip ?? 'Jalankan analisis terlebih dahulu'}
        className={`relative flex min-h-12 cursor-not-allowed items-center gap-3 rounded-[18px] font-bold text-[#7A7392] ${collapsed ? 'justify-center px-0' : 'px-2.5'}`}
      >
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#E2DBF3]">
          <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
        </span>
        {collapsed ? (
          <span className="absolute right-1.5 bottom-1.5 flex size-4 items-center justify-center rounded-full bg-white">
            <Lock size={10} strokeWidth={2.6} aria-hidden="true" />
          </span>
        ) : (
          <>
            <span className="flex-1">{label}</span>
            <Lock size={16} strokeWidth={2.2} aria-label="Terkunci" />
          </>
        )}
      </div>
    )
  }
  return (
    <NavLink
      to={to}
      end={end}
      title={tip}
      aria-label={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex min-h-12 items-center gap-3 rounded-[18px] no-underline transition ${collapsed ? 'justify-center px-0' : 'px-2.5'} ${
          isActive
            ? 'bg-white font-extrabold text-primary shadow-soft'
            : 'font-bold text-[#4A4360] hover:bg-white/60'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${isActive ? 'bg-lilac' : 'bg-[#E2DBF3]'}`}>
            <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
          </span>
          {!collapsed && label}
        </>
      )}
    </NavLink>
  )
}

function NavGroupLabel({ children, collapsed }) {
  if (collapsed) return <hr className="mx-3 my-1 border-[#D9D1F0]" />
  return <span className="px-3 pt-3 pb-1 text-[11px] font-black tracking-wider text-[#8A84A0] uppercase">{children}</span>
}

// Kotak akun di bawah sidebar: nama, role, Profil, dan Keluar.
function UserBox({ collapsed }) {
  const { user, profile, displayName, isAdmin, signOut } = useAuth()
  if (!user) {
    return (
      <Link
        to="/masuk"
        title={collapsed ? 'Masuk' : undefined}
        className={`mt-auto flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary font-black text-white no-underline shadow-button ${collapsed ? 'px-0' : 'px-5'}`}
      >
        <LogIn size={18} aria-hidden="true" /> {!collapsed && 'Masuk'}
      </Link>
    )
  }
  const initial = (displayName || '?').slice(0, 1).toUpperCase()
  if (collapsed) {
    return (
      <div className="mt-auto flex flex-col items-center gap-2">
        <Link to="/profil" title={`${displayName} (${isAdmin ? 'Admin' : 'Pengguna'})`} aria-label="Profil" className="flex size-11 items-center justify-center rounded-2xl bg-white font-black text-primary no-underline shadow-soft">
          {initial}
        </Link>
        <button type="button" onClick={signOut} title="Keluar" aria-label="Keluar" className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-white/70">
          <LogOut size={18} aria-hidden="true" />
        </button>
      </div>
    )
  }
  return (
    <div className="mt-auto flex items-center gap-3 rounded-3xl bg-white p-3 shadow-soft">
      <Link to="/profil" className="flex min-w-0 flex-1 items-center gap-3 text-ink no-underline" title="Buka profil">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-lilac font-black text-primary">{initial}</span>
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-extrabold">{displayName}</span>
          <span className={`text-xs font-black ${isAdmin ? 'text-primary' : 'text-muted'}`}>{profile ? (isAdmin ? 'Admin' : 'Pengguna') : '…'}</span>
        </span>
      </Link>
      <button type="button" onClick={signOut} title="Keluar" aria-label="Keluar" className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-pink hover:text-[#A3324F]">
        <LogOut size={18} aria-hidden="true" />
      </button>
    </div>
  )
}

// Navigasi bawah khusus HP (seperti aplikasi).
function BottomNav({ result }) {
  const items = [
    { to: '/upload', icon: Upload, label: 'Analisis' },
    { to: '/hasil', icon: BarChart3, label: 'Hasil', locked: !result },
    { to: '/sosial', icon: TrendingUp, label: 'Tren', locked: !result },
    { to: '/riwayat', icon: History, label: 'Riwayat' },
    { to: '/profil', icon: UserRound, label: 'Akun' },
  ]
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(107,93,194,0.08)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ to, icon: Icon, label, locked }) => (
          <li key={to}>
            {locked ? (
              <span aria-disabled="true" aria-label={`${label}, terkunci`} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-[#9A93B0]">
                <span className="relative">
                  <Icon size={22} aria-hidden="true" />
                  <Lock size={11} strokeWidth={2.6} className="absolute -right-2 -bottom-1 rounded-full bg-white" aria-hidden="true" />
                </span>
                {label}
              </span>
            ) : (
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-extrabold no-underline ${isActive ? 'text-primary' : 'text-[#5F5875]'}`
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${isActive ? 'bg-lilac' : ''}`}>
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    {label}
                  </>
                )}
              </NavLink>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function DashboardLayout() {
  const { result } = useAnalysis()
  const { user, isAdmin, displayName } = useAuth()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const isDesktop = useIsDesktop()
  const location = useLocation()

  function toggle() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? '0' : '1')
      } catch {
        // penyimpanan browser tidak tersedia: tetap jalan tanpa mengingat pilihan
      }
      return !c
    })
  }

  // Di layar kecil sidebar tampil sebagai bilah atas, jadi tidak perlu diciutkan.
  const isCollapsed = collapsed && isDesktop

  const toggleButton = (
    <button
      type="button"
      onClick={toggle}
      aria-label={isCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
      aria-expanded={!isCollapsed}
      title={isCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
      className="hidden size-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-primary transition hover:bg-white/70 lg:flex"
    >
      {isCollapsed ? <PanelLeftOpen size={20} aria-hidden="true" /> : <PanelLeftClose size={20} aria-hidden="true" />}
    </button>
  )

  return (
    <div className="flex min-h-screen flex-col bg-page lg:flex-row">
      {/* Header ringkas khusus HP */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-page/90 px-5 py-3 backdrop-blur lg:hidden">
        <Link to="/" aria-label="TextScope, ke halaman utama" className="no-underline"><Logo size={26} /></Link>
        {user ? (
          <Link to="/profil" aria-label="Akun saya" className="flex items-center gap-2 rounded-full bg-white py-1 pr-3 pl-1 text-sm font-extrabold text-ink no-underline shadow-soft">
            <span className="flex size-8 items-center justify-center rounded-full bg-lilac font-black text-primary">{(displayName || '?').slice(0, 1).toUpperCase()}</span>
            {isAdmin ? 'Admin' : 'Akun'}
          </Link>
        ) : (
          <Link to="/masuk" className="flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-black text-white no-underline">
            <LogIn size={16} aria-hidden="true" /> Masuk
          </Link>
        )}
      </header>

      <aside
        className={`hidden shrink-0 flex-col gap-5 bg-sidebar px-4 py-5 transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen lg:gap-5 lg:rounded-r-[32px] lg:py-6 ${
          isCollapsed ? 'lg:w-[88px] lg:px-3' : 'lg:w-[264px]'
        }`}
      >
        <div className={`flex items-center gap-2 ${isCollapsed ? 'lg:flex-col' : 'justify-between'}`}>
          <Link
            to="/"
            aria-label="TextScope, ke halaman utama"
            title={isCollapsed ? 'TextScope' : undefined}
            className="flex min-h-[52px] items-center px-2 no-underline"
          >
            {isCollapsed ? (
              <>
                <span className="hidden size-11 items-center justify-center rounded-2xl bg-white p-1.5 shadow-soft lg:flex">
                  <LensMark className="h-full w-full" />
                </span>
                <span className="lg:hidden"><Logo size={32} tagline /></span>
              </>
            ) : (
              <Logo size={32} tagline />
            )}
          </Link>
          {toggleButton}
        </div>

        <nav aria-label="Navigasi utama" className="-mx-1 flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-1">
          {user ? (
            <>
              <NavItem to="/upload" icon={Upload} label="Analisis" collapsed={isCollapsed} />
              <NavItem to="/hasil" icon={BarChart3} label="Hasil Analisis" locked={!result} collapsed={isCollapsed} />
              <NavItem to="/sosial" icon={TrendingUp} label="Tren & Sosial" locked={!result} collapsed={isCollapsed} />
              <NavItem to="/riwayat" icon={History} label="Riwayat" collapsed={isCollapsed} />
              <NavItem to="/panduan" icon={BookOpen} label="Panduan" collapsed={isCollapsed} />
              {isAdmin && (
                <>
                  <NavGroupLabel collapsed={isCollapsed}>Admin</NavGroupLabel>
                  <NavItem to="/admin" end icon={LayoutDashboard} label="Dashboard Admin" collapsed={isCollapsed} />
                  <NavItem to="/admin/pengguna" icon={Users} label="Kelola Pengguna" collapsed={isCollapsed} />
                  <NavItem to="/admin/laporan" icon={Flag} label="Laporan Salah" collapsed={isCollapsed} />
                  <NavItem to="/admin/model" icon={BrainCircuit} label="Info Model" collapsed={isCollapsed} />
                </>
              )}
            </>
          ) : (
            <NavItem to="/panduan" icon={BookOpen} label="Panduan" collapsed={isCollapsed} />
          )}
        </nav>

        <UserBox collapsed={isCollapsed} />
      </aside>
      <main className="min-w-0 flex-1 px-4 pt-5 pb-28 sm:px-8 lg:px-10 lg:py-9">
        <div key={location.pathname} className="page-enter">
          <Suspense
            fallback={
              <div className="flex min-h-[50vh] items-center justify-center gap-2 font-bold text-muted">
                <Loader2 size={20} className="animate-spin" aria-hidden="true" /> Memuat halaman…
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </div>
      </main>
      {user && <BottomNav result={result} />}
    </div>
  )
}
