import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthShell, updatePassword, useAuth } from '@trainer/shared/auth'
import { Button, ErrorMessage, Spinner, TextField } from '@trainer/shared/ui'

/**
 * Landing page for invite and password recovery links. supabase-js consumes the auth
 * fragment/code on load (see AuthProvider); an expired or used link leaves no session.
 */
export function SetPasswordPage() {
  const { session, loading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <Spinner />
  if (!session) {
    return (
      <AuthShell title="Link inválido o vencido">
        <p className="text-center text-sm text-muted-foreground">El link venció o ya fue usado. Pedile a tu entrenador uno nuevo.</p>
      </AuthShell>
    )
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.')
    if (password !== confirm) return setError('Las contraseñas no coinciden.')
    setSubmitting(true)
    try {
      await updatePassword(password)
      await refreshProfile()
      navigate('/', { replace: true })
    } catch {
      setError('No pudimos guardar la contraseña. Probá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthShell title="Elegí tu contraseña" subtitle="Mínimo 8 caracteres.">
      <form onSubmit={onSubmit} className="space-y-4">
        <TextField label="Contraseña nueva" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <TextField label="Repetir contraseña" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        <ErrorMessage message={error} />
        <Button type="submit" size="lg" className="w-full" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Guardar y entrar'}
        </Button>
      </form>
    </AuthShell>
  )
}
