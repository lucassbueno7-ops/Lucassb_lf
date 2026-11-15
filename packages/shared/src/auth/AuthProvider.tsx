import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { takePendingHandoff } from '../domain/handoff'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthState, type Profile } from './auth-context'
import { fetchProfile, signOut as apiSignOut } from './api'

let initialSession: Promise<Session | null> | null = null

/**
 * Resolves the session once per page load. If the page was opened through a session
 * handoff, the tokens captured by handoff-boot are installed; otherwise the stored
 * session is read (getSession also processes invite/recovery tokens in the URL hash).
 * Cached at module level so React StrictMode's double effect cannot race two attempts.
 */
function loadInitialSession(): Promise<Session | null> {
  initialSession ??= (async () => {
    const handoff = takePendingHandoff()
    if (handoff) {
      const { data, error } = await supabase.auth.setSession({
        access_token: handoff.accessToken,
        refresh_token: handoff.refreshToken,
      })
      if (!error && data.session) return data.session
    }
    const { data } = await supabase.auth.getSession()
    return data.session
  })()
  return initialSession
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void loadInitialSession().then((initial) => {
      setSession(initial)
      if (!initial) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (!next) {
        setProfile(null)
        setLoading(false)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetchProfile(userId)
      .then((p) => !cancelled && setProfile(p))
      .catch(() => !cancelled && setProfile(null))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [userId])

  const refreshProfile = useCallback(async () => {
    if (userId) setProfile(await fetchProfile(userId))
  }, [userId])

  const value = useMemo<AuthState>(
    () => ({ session, profile, loading, signOut: apiSignOut, refreshProfile }),
    [session, profile, loading, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
