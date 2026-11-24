import { lazy } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout.jsx'
import { RequireAdmin, RequireAuth } from './components/guards.jsx'
import Landing from './pages/Landing.jsx'
import { useAnalysis } from './context/AnalysisContext.jsx'

// Halaman dashboard dimuat saat dibuka saja, supaya landing page lebih cepat (terutama di HP).
const Masuk = lazy(() => import('./pages/Masuk.jsx'))
const Upload = lazy(() => import('./pages/Upload.jsx'))
const Hasil = lazy(() => import('./pages/Hasil.jsx'))
const Sosial = lazy(() => import('./pages/Sosial.jsx'))
const Riwayat = lazy(() => import('./pages/Riwayat.jsx'))
const Profil = lazy(() => import('./pages/Profil.jsx'))
const Panduan = lazy(() => import('./pages/Panduan.jsx'))
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'))
const KelolaPengguna = lazy(() => import('./pages/admin/KelolaPengguna.jsx'))
const LaporanSalah = lazy(() => import('./pages/admin/LaporanSalah.jsx'))
const InfoModel = lazy(() => import('./pages/admin/InfoModel.jsx'))

// Halaman Hasil hanya bisa dibuka kalau sudah ada hasil analisis.
function RequireResult({ children }) {
  const { result } = useAnalysis()
  return result ? children : <Navigate to="/upload" replace />
}

export default function App() {
  return (
    <Routes>
      {/* Publik */}
      <Route path="/" element={<Landing />} />
      <Route path="/masuk" element={<Masuk />} />

      <Route element={<DashboardLayout />}>
        <Route path="/panduan" element={<Panduan />} />

        {/* Wajib login: Pengguna dan Admin */}
        <Route element={<RequireAuth />}>
          <Route path="/upload" element={<Upload />} />
          <Route path="/hasil" element={<RequireResult><Hasil /></RequireResult>} />
          <Route path="/sosial" element={<RequireResult><Sosial /></RequireResult>} />
          <Route path="/riwayat" element={<Riwayat />} />
          <Route path="/profil" element={<Profil />} />

          {/* Khusus Admin */}
          <Route path="/admin" element={<RequireAdmin />}>
            <Route index element={<AdminDashboard />} />
            <Route path="pengguna" element={<KelolaPengguna />} />
            <Route path="laporan" element={<LaporanSalah />} />
            <Route path="model" element={<InfoModel />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
