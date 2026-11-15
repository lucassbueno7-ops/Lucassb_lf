import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { addDays, attendanceSummary, type AttendanceSummary } from '@trainer/shared/domain'
import { toISODate } from '@trainer/shared/domain'
import { lastWorkoutLabel } from '@trainer/shared/charts'
import { useAuth } from '@trainer/shared/auth'
import { Button, Card, ErrorMessage, Input, Spinner } from '@trainer/shared/ui'
import { useAsync } from '@trainer/shared/ui'
import { inviteClient, listClients, listScheduledDays, listTrainingDates } from '../api'
import type { Profile } from '@trainer/shared/auth'

function InviteClientForm({ onInvited }: { onInvited: () => void }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      await inviteClient(email.trim(), fullName.trim())
      setSuccess(`Invitación enviada a ${email.trim()}.`)
      setEmail('')
      setFullName('')
      onInvited()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la invitación.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title="Invitar cliente">
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="Nombre" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <ErrorMessage message={error} />
        {success && <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">{success}</p>}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Enviando...' : 'Enviar invitación'}
        </Button>
      </form>
    </Card>
  )
}

const ACTIVITY_WINDOW_DAYS = 30

interface ClientRow {
  client: Profile
  summary: AttendanceSummary
}

/** Three queries total (clients, training dates, scheduled days), joined in memory with domain functions. */
async function loadClientRows(trainerId: string): Promise<ClientRow[]> {
  const clients = await listClients(trainerId)
  const today = toISODate()
  const [dates, scheduled] = await Promise.all([
    listTrainingDates(addDays(today, -ACTIVITY_WINDOW_DAYS)),
    listScheduledDays(clients.map((c) => c.id)),
  ])
  const datesByClient: Record<string, string[]> = {}
  for (const row of dates) (datesByClient[row.client_id] ??= []).push(row.performed_at)
  return clients.map((client) => ({
    client,
    summary: attendanceSummary(datesByClient[client.id] ?? [], scheduled[client.id] ?? [], today),
  }))
}

function ClientsList({ rows }: { rows: ClientRow[] }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-500">Todavía no tenés clientes. Invitá al primero.</p>
  }
  return (
    <ul className="divide-y divide-slate-100">
      {rows.map(({ client: c, summary }) => (
        <li key={c.id} className={summary.needsAttention ? 'rounded-lg bg-amber-50 px-2' : undefined}>
          <Link to={`/clients/${c.id}`} className="flex min-h-12 items-center justify-between gap-2 py-2">
            <div>
              <p className="font-medium">{c.full_name || 'Sin nombre'}</p>
              <p className="text-xs text-slate-500">
                Último entrenamiento: {lastWorkoutLabel(summary)}
                {summary.daysSince !== null && ` - ${summary.daysSince} días sin cargar`}
              </p>
              <p className="text-xs text-slate-500">
                Esta semana: {summary.week.done}/{summary.week.planned}
                {summary.week.extra > 0 && ` (+${summary.week.extra} extra)`}
              </p>
              {summary.needsAttention && <p className="text-xs font-medium text-amber-800">3 o más días sin cargar</p>}
            </div>
            <span className="text-sm text-teal-700">Ver</span>
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function ClientsPage() {
  const { profile } = useAuth()
  const trainerId = profile?.id ?? ''
  const { data, loading, error, reload } = useAsync(() => loadClientRows(trainerId), [trainerId])

  return (
    <>
      <Card title="Mis clientes">
        {loading && <Spinner />}
        <ErrorMessage message={error} />
        {data && <ClientsList rows={data} />}
      </Card>
      <InviteClientForm onInvited={reload} />
    </>
  )
}
