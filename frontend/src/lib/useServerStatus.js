import { useEffect, useState } from 'react'
import { checkHealth, USE_MOCK } from './api.js'

/**
 * Status server: 'checking' | 'ready' | 'waking' | 'offline'.
 * Kalau cek pertama gagal, dicoba lagi tiap 5 detik (server gratis butuh waktu untuk bangun).
 */
export function useServerStatus() {
  const [status, setStatus] = useState(USE_MOCK ? 'ready' : 'checking')

  useEffect(() => {
    if (USE_MOCK) return undefined
    let cancelled = false
    let timer
    let tries = 0
    async function ping() {
      const ok = await checkHealth()
      if (cancelled) return
      if (ok) {
        setStatus('ready')
        return
      }
      tries += 1
      setStatus(tries >= 18 ? 'offline' : 'waking') // ±90 detik
      if (tries < 18) timer = setTimeout(ping, 5000)
    }
    ping()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  return status
}
