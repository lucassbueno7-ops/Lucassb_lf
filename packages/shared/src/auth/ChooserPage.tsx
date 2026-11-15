import type { ReactNode } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, Smartphone } from 'lucide-react'
import type { AppTarget } from '../domain/handoff'
import { isStaff } from '../domain/roles'
import { Button } from '../ui/button'
import { Spinner } from '../ui/ui'
import { cn } from '../ui/utils'
import { useAuth } from './auth-context'
import { AuthShell } from './AuthShell'
import { useSwitchApp } from './useSwitchApp'

function DestinationCard({
  icon,
  title,
  description,
  disabled,
  onClick,
}: {
  icon: ReactNode
  title: string
  description: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group flex min-h-40 flex-col items-start gap-3 rounded-2xl border bg-background/50 p-5 text-left transition-all outline-none',
        'hover:border-primary/60 hover:bg-accent hover:shadow-glow focus-visible:ring-[3px] focus-visible:ring-ring/50',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none',
      )}
    >
      <span className="grid size-12 place-items-center rounded-xl bg-primary/15 text-link [&_svg]:size-6">{icon}</span>
      <span className="text-lg font-bold">{title}</span>
      <span className="text-sm text-muted-foreground">{description}</span>
      {disabled && <span className="text-xs text-warning-foreground">No disponible: falta configurar la URL de esta app.</span>}
    </button>
  )
}

/**
 * Shown after login to trainers and admins: pick the panel or the client app.
 * `current` is the app this page is running in; the other destination does a session handoff.
 */
export function ChooserPage({ current, appName }: { current: AppTarget; appName?: string }) {
  const { profile, loading, signOut } = useAuth()
  const navigate = useNavigate()
  const toPanel = useSwitchApp('panel')
  const toApp = useSwitchApp('app')

  if (loading || !profile) return <Spinner />
  if (!isStaff(profile.role)) return <Navigate to="/" replace />

  const openPanel = () => (current === 'panel' ? navigate('/') : void toPanel.go('/'))
  const openApp = () => (current === 'app' ? navigate('/enter') : void toApp.go('/enter'))

  return (
    <AuthShell
      wide
      appName={appName}
      title="¿A dónde querés entrar?"
      subtitle={profile.full_name ? `Hola, ${profile.full_name}.` : undefined}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <DestinationCard
          icon={<LayoutDashboard aria-hidden />}
          title="Panel"
          description="Gestionar clientes, rutinas y ejercicios."
          disabled={current !== 'panel' && !toPanel.available}
          onClick={openPanel}
        />
        <DestinationCard
          icon={<Smartphone aria-hidden />}
          title="App"
          description="Tu rutina o la vista previa de un cliente."
          disabled={current !== 'app' && !toApp.available}
          onClick={openApp}
        />
      </div>
      <div className="mt-6 flex justify-center">
        <Button variant="ghost" onClick={() => void signOut()}>
          <LogOut aria-hidden />
          Cerrar sesión
        </Button>
      </div>
    </AuthShell>
  )
}
