import { Navigate, useNavigate } from 'react-router-dom'
import { Dumbbell, Eye } from 'lucide-react'
import { AuthShell, useAuth } from '@trainer/shared/auth'
import { isStaff } from '@trainer/shared/domain'
import { Spinner } from '@trainer/shared/ui'
import { useViewedClient } from '../viewed-client'

/**
 * Landing for staff entering the app. Trainee staff pick "Mi rutina" or a read-only client preview;
 * staff without a routine of their own go straight to the client picker.
 */
export function EnterPage() {
  const { profile, loading } = useAuth()
  const { canSwitchMode, setMode } = useViewedClient()
  const navigate = useNavigate()

  if (loading || !profile) return <Spinner />
  if (!isStaff(profile.role)) return <Navigate to="/" replace />
  if (!canSwitchMode) return <Navigate to="/preview" replace />

  const options = [
    {
      icon: <Dumbbell aria-hidden />,
      title: 'Mi rutina',
      description: 'Tu propia rutina: cargá entrenamientos y peso como cualquier cliente.',
      onClick: () => {
        setMode('self')
        navigate('/')
      },
    },
    {
      icon: <Eye aria-hidden />,
      title: 'Vista previa de un cliente',
      description: 'Mirá la app tal como la ve un cliente. Es solo lectura.',
      onClick: () => {
        setMode('preview')
        navigate('/preview')
      },
    },
  ]

  return (
    <AuthShell wide title="¿Qué querés ver?" subtitle={profile.full_name ? `Hola, ${profile.full_name}.` : undefined}>
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((o) => (
          <button
            key={o.title}
            type="button"
            onClick={o.onClick}
            className="flex min-h-40 flex-col items-start gap-3 rounded-2xl border bg-background/50 p-5 text-left outline-none transition-all hover:border-primary/60 hover:bg-accent hover:shadow-glow focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <span className="grid size-12 place-items-center rounded-xl bg-primary/15 text-link [&_svg]:size-6">{o.icon}</span>
            <span className="text-lg font-bold">{o.title}</span>
            <span className="text-sm text-muted-foreground">{o.description}</span>
          </button>
        ))}
      </div>
    </AuthShell>
  )
}
