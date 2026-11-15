import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Role } from '../domain/types'

export interface Profile {
  id: string
  role: Role
  full_name: string | null
  height_cm: number | null
  trainer_id: string | null
}

export interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
