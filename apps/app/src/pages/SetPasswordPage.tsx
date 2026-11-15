import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AuthShell, updatePassword, useAuth } from '@trainer/shared/auth'
import { parseInviteParams } from '@trainer/shared/domain'
import { supabase } from '@trainer/shared/supabase'
import { Button, ErrorMessage, Spinner, TextField } from '@trainer/shared/ui'

/**
 * Landing page for invite and password recovery links: `?token_hash=...&type=invite|recovery`.
 * The one-time token is verified only when the person presses "Activar cuenta", so chat
 * link previews (WhatsApp) and mail scanners that open the URL cannot consume it.
 */
export function SetPasswordPage() {
  const { session, loading, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const { search } = useLocation()
  const [invite] = useState(() => parseInviteParams(search))
  const [verified, setVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [linkError, setLinkError] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) return <Spinner />

  const activate = async () => {
    if (!invite) return
    setVerifying(true)
    // Replaces any session already open in this browser with the invited user's one.
    const { error: verifyError } = await supabase.auth.verifyOtp({ token_hash: invite.tokenHash, type: invite.type })
    setVerifying(false)
    if (verifyError) return setLinkError(true)
    setVerified(true)
    navigate('/set-password', { replace: true })
  }

  const expired = (
    <AuthShell title="Link inválido o vencido">
      <p className="text-center text-sm text-muted-foreground">El link venció o ya fue usado. Pedile a tu entrenador uno nuevo.</p>
    </AuthShell>
  )

  if (linkError) return expired

  // A link with a token always requires an explicit click before a password can be set,
  // even if another session is open in this browser.
  if (invite && !verified) {
    return (
      <AuthShell title={invite.type === 'invite' ? 'Activá tu cuenta' : 'Recuperá tu acceso'} subtitle="Tocá el botón para continuar y elegir tu contraseña.">
        <Button size="lg" className="w-full" onClick={activate} disabled={verifying}>
          {verifying ? 'Verificando...' : 'Activar cuenta'}
        </Button>
      </AuthShell>
    )
  }

  if (!session) return expired

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
