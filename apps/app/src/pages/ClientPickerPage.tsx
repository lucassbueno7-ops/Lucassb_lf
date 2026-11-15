import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, Search, Users } from 'lucide-react'
import { filterClientsByName } from '@trainer/shared/domain'
import { useAuth, type Profile } from '@trainer/shared/auth'
import { Card, EmptyState, ErrorMessage, PageHeader, Spinner, TextField, useAsync } from '@trainer/shared/ui'
import { listPreviewClients } from '../api'
import { useViewedClient } from '../viewed-client'

/** Trainers/admins: choose which client's app to preview. */
export function ClientPickerPage() {
  const { profile } = useAuth()
  const { select, canSwitchMode, setMode } = useViewedClient()
  const navigate = useNavigate()
  const clients = useAsync(() => listPreviewClients(profile?.id ?? ''), [profile?.id])
  const [query, setQuery] = useState('')

  const choose = (c: Profile) => {
    select(c)
    navigate('/')
  }

  const visible = filterClientsByName(clients.data ?? [], query)

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
      <PageHeader
        title="Vista previa de la app"
        subtitle={`Elegí un cliente para ver su app tal como la ve él. Es solo lectura.`}
        back={
          canSwitchMode ? (
            <Link to="/" onClick={() => setMode('self')} className="text-sm font-medium text-link hover:underline">
              ← Volver a Mi rutina
            </Link>
          ) : (
            <Link to="/choose" className="text-sm font-medium text-link hover:underline">
              ← Cambiar de destino
            </Link>
          )
        }
      />
      <TextField
        label="Buscar cliente"
        type="search"
        placeholder="Nombre"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ErrorMessage message={clients.error} />
      {clients.loading ? (
        <Spinner />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={query ? <Search aria-hidden /> : <Users aria-hidden />}
          title={query ? 'No encontramos clientes' : 'Todavía no hay clientes'}
          description={query ? 'Probá con otro nombre.' : profile?.role === 'admin' ? 'Cuando haya clientes registrados, van a aparecer acá.' : 'Invitá a tu primer cliente desde el panel.'}
        />
      ) : (
        <ul className="space-y-2">
          {visible.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => choose(c)} className="block w-full text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 rounded-xl">
                <Card className="flex-row items-center justify-between gap-3 px-4 py-3 transition-colors hover:border-primary/60 hover:bg-accent">
                  <span className="flex min-w-0 items-center gap-3">
                    <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-link">
                      {(c.full_name?.trim()[0] ?? '?').toUpperCase()}
                    </span>
                    <span className="truncate font-semibold">{c.full_name || 'Sin nombre'}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                </Card>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
