import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { SUPABASE_READY, supabase } from '../lib/supabase.js'

const AuthContext = createContext(null)

// Data yang tersimpan di browser dan harus dihapus saat keluar,
// supaya pengguna berikutnya di komputer yang sama tidak melihatnya.
const PRIVATE_KEYS = ['textscope:result']

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_active, created_at')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(SUPABASE_READY)
  const [profileError, setProfileError] = useState('')

  const loadProfile = useCallback(async (user) => {
    if (!user) {
      setProfile(null)
      return
    }
    try {
      setProfile(await fetchProfile(user.id))
      setProfileError('')
    } catch {
      setProfileError('Data akun tidak bisa dimuat. Coba muat ulang halaman.')
    }
  }, [])

  useEffect(() => {
    if (!SUPABASE_READY) return
    let active = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      await loadProfile(data.session?.user)
      if (active) setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (event === 'SIGNED_OUT') {
        setProfile(null)
        PRIVATE_KEYS.forEach((k) => sessionStorage.removeItem(k))
      }
      // Jangan memanggil Supabase langsung di dalam callback ini (bisa macet); tunda sebentar.
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setTimeout(() => loadProfile(next?.user), 0)
      }
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = useMemo(() => {
    const user = session?.user ?? null
    return {
      ready: SUPABASE_READY,
      loading,
      session,
      user,
      profile,
      profileError,
      isAdmin: profile?.role === 'admin' && profile?.is_active,
      isActive: Boolean(profile?.is_active),
      displayName: profile?.full_name || user?.email?.split('@')[0] || '',
      refreshProfile: () => loadProfile(user),
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      },
      async signUp(email, password, fullName) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/masuk`,
          },
        })
        if (error) throw error
        // Kalau konfirmasi email aktif, session masih kosong sampai email dikonfirmasi.
        return { needsConfirmation: !data.session }
      },
      async signOut() {
        PRIVATE_KEYS.forEach((k) => sessionStorage.removeItem(k))
        await supabase.auth.signOut()
      },
      async resetPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/profil?ganti-password=1`,
        })
        if (error) throw error
      },
      async updatePassword(password) {
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
      },
      async updateName(fullName) {
        const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id)
        if (error) throw error
        await loadProfile(user)
      },
    }
  }, [session, profile, loading, profileError, loadProfile])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}

// Token untuk dikirim ke backend (Authorization: Bearer ...).
export async function getAccessToken() {
  if (!SUPABASE_READY) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}
