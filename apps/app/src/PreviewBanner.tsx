import { useNavigate } from 'react-router-dom'
import { Eye } from 'lucide-react'
import { useSwitchApp } from '@trainer/shared/auth'
import { Button } from '@trainer/shared/ui'
import { useViewedClient } from './viewed-client'

/** Persistent strip shown while a trainer/admin previews a client's app. */
export function PreviewBanner() {
  const { client, clear } = useViewedClient()
  const navigate = useNavigate()
  const panel = useSwitchApp('panel')

  return (
    <div role="region" aria-label="Vista previa" className="border-t border-warning-border bg-warning-muted px-4 py-2">
      <p className="flex items-center gap-2 text-sm font-semibold text-warning-foreground">
        <Eye aria-hidden className="size-4 shrink-0" />
        <span className="min-w-0 truncate">Vista previa: {client?.full_name || 'Cliente'}</span>
      </p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="min-h-11 sm:min-h-9"
          onClick={() => {
            clear()
            navigate('/preview')
          }}
        >
          Cambiar cliente
        </Button>
        <Button variant="outline" size="sm" className="min-h-11 sm:min-h-9" disabled={!panel.available} onClick={() => void panel.go('/')}>
          Volver al panel
        </Button>
      </div>
    </div>
  )
}
