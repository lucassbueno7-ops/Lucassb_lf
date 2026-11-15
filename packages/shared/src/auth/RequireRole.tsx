import type { ReactNode } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './auth-context'
import type { Role } from '../domain/types'
import { Spinner } from '../ui/ui'

interface Props {
  /** One allowed role, or several. */
  role: Role | Role[]
  /** Rendered when the user is signed in but has a different role (e.g. a "wrong app" message). */
  wrongRole: ReactNode
}

/** Route guard: only lets users with `role` through; anonymous users go to /login. */
export function RequireRole({ role, wrongRole }: Props) {
  const { session, profile, loading } = useAuth()

  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Spinner label="Cargando perfil..." />
  const allowed = Array.isArray(role) ? role : [role]
  if (!allowed.includes(profile.role)) return <>{wrongRole}</>
  return <Outlet />
}
