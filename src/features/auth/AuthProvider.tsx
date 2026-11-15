import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../lib/supabase'
import { AuthContext, type AuthState, type Profile } from './auth-context'
import { fetchProfile, signOut as apiSignOut } from './api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // getSession also processes the invite/recovery tokens present in the URL hash.
    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (!data.session) setLoading(false)
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
