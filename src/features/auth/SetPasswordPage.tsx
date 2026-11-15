import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, ErrorMessage, Input, Spinner } from '../../shared/ui'
import { updatePassword } from './api'
import { useAuth } from './auth-context'
import { homePathForRole } from './routes'

/** Landing page for invite and password recovery links. */
export function SetPasswordPage() {
  const { session, profile, loading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <Spinner />
  if (!session) {
    return (
      <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-4">
        <Card title="Enlace inválido o vencido">
          <p className="text-sm text-slate-600">Pedile a tu entrenador que te envíe una nueva invitación.</p>
        </Card>
      </div>
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
      navigate(homePathForRole(profile?.role ?? 'client'), { replace: true })
    } catch {
      setError('No pudimos guardar la contraseña. Probá de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-4">
      <Card title="Elegí tu contraseña">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input label="Contraseña nueva" type="password" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Repetir contraseña" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          <ErrorMessage message={error} />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Guardar y entrar'}
          </Button>
        </form>
      </Card>
    </div>
  )
}
