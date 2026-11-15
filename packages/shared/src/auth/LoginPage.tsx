import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { landingPathForRole } from '../domain/roles'
import { Button } from '../ui/button'
import { ErrorMessage, Spinner, TextField } from '../ui/ui'
import { signInWithPassword } from './api'
import { useAuth } from './auth-context'
import { AuthShell } from './AuthShell'

export function LoginPage({ appName }: { appName?: string }) {
  const { session, profile, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <Spinner />
  // Trainers and admins pick a destination first; clients go straight in.
  if (session && profile) return <Navigate to={landingPathForRole(profile.role)} replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signInWithPassword(email.trim(), password)
    } catch {
      setError('Email o contraseña incorrectos.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Ingresar" subtitle="Usá tu email y contraseña para continuar." appName={appName}>
      <form onSubmit={onSubmit} className="space-y-4">
        <TextField label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <ErrorMessage message={error} />
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Ingresando...' : 'Ingresar'}
        </Button>
      </form>
    </AuthShell>
  )
}
