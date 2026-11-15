import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/auth-context'
import { homePathForRole } from '../features/auth/routes'
import type { Role } from '../domain/types'
import { Spinner } from './ui'

/** Route guard: only lets users with `role` through; redirects everyone else. */
export function RequireRole({ role }: { role: Role }) {
  const { session, profile, loading } = useAuth()

  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (!profile) return <Spinner label="Cargando perfil..." />
  if (profile.role !== role) return <Navigate to={homePathForRole(profile.role)} replace />
  return <Outlet />
}
