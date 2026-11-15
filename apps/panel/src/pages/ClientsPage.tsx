import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight, CircleCheck, Copy, MessageCircle, TriangleAlert, UserPlus, Users } from 'lucide-react'
import { addDays, attendanceBadge, buildInviteMessage, whatsappShareUrl, attendanceSummary, displayPersonName, toISODate, trainerName, type AttendanceSummary, type Role } from '@trainer/shared/domain'
import { lastWorkoutLabel } from '@trainer/shared/charts'
import { useAuth, type Profile } from '@trainer/shared/auth'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorMessage,
  Label,
  NativeSelect,
  PageHeader,
  Section,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TextField,
  cn,
  useAsync,
} from '@trainer/shared/ui'
import { inviteClient, type InviteResult, listClients, listScheduledDays, listTrainers, listTrainingDates } from '../api'

function InviteResultCard({ name, result }: { name: string; result: InviteResult }) {
  const [copied, setCopied] = useState(false)
  const message = buildInviteMessage(name, result.link)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result.link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border bg-muted/40 p-3">
      <TextField label="Link de invitación" readOnly value={result.link} onFocus={(e) => e.currentTarget.select()} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={copy}>
          {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
          {copied ? '¡Copiado!' : 'Copiar'}
        </Button>
        <Button asChild>
          <a href={whatsappShareUrl(message)} target="_blank" rel="noreferrer">
            <MessageCircle aria-hidden />
            Enviar por WhatsApp
          </a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">El link vence en 24 horas y sirve una sola vez.</p>
      {result.existing && (
        <p className="text-xs text-muted-foreground">Este cliente ya existía: el link le permite restablecer su contraseña.</p>
      )}
    </div>
  )
}

function InviteClientForm({ isAdmin, onInvited }: { isAdmin: boolean; onInvited: () => void }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [trainerId, setTrainerId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ name: string; data: InviteResult } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const trainers = useAsync(() => (isAdmin ? listTrainers() : Promise.resolve([] as Profile[])), [isAdmin])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setResult(null)
    setSubmitting(true)
    try {
      const name = fullName.trim()
      const data = await inviteClient(email.trim(), name, isAdmin ? trainerId : undefined)
      setResult({ name, data })
      setEmail('')
      setFullName('')
      onInvited()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la invitación.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Section title="Invitar cliente" description="Generá un link y compartilo por WhatsApp para que elija su contraseña.">
      <form onSubmit={onSubmit} className="space-y-3">
        <TextField label="Nombre" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <TextField label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        {isAdmin && (
          <div className="grid gap-1.5">
            <Label htmlFor="invite-trainer">Entrenador</Label>
            <NativeSelect id="invite-trainer" required value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
              <option value="">Elegí un entrenador</option>
              {(trainers.data ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || 'Sin nombre'}
                </option>
              ))}
            </NativeSelect>
          </div>
        )}
        <ErrorMessage message={error} />
        <Button type="submit" className="w-full" disabled={submitting}>
          <UserPlus aria-hidden />
          {submitting ? 'Generando...' : 'Generar invitación'}
        </Button>
      </form>
      {result && <InviteResultCard name={result.name} result={result.data} />}
    </Section>
  )
}

const ACTIVITY_WINDOW_DAYS = 30

interface ClientRow {
  client: Profile
  summary: AttendanceSummary
  /** Only set for admins, who see clients of every trainer. */
  trainerLabel: string | null
}

/** Three queries total (clients, training dates, scheduled days), joined in memory with domain functions. */
async function loadClientRows(viewer: { id: string; role: Role }): Promise<ClientRow[]> {
  const isAdmin = viewer.role === 'admin'
  const clients = await listClients(viewer)
  const today = toISODate()
  const [dates, scheduled, trainers] = await Promise.all([
    listTrainingDates(addDays(today, -ACTIVITY_WINDOW_DAYS)),
    listScheduledDays(clients.map((c) => c.id)),
    isAdmin ? listTrainers() : Promise.resolve([]),
  ])
  const datesByClient: Record<string, string[]> = {}
  for (const row of dates) (datesByClient[row.client_id] ??= []).push(row.performed_at)
  return clients.map((client) => ({
    client,
    summary: attendanceSummary(datesByClient[client.id] ?? [], scheduled[client.id] ?? [], today),
    trainerLabel: isAdmin ? trainerName(trainers, client.trainer_id) : null,
  }))
}

function StatusBadge({ summary }: { summary: AttendanceSummary }) {
  const kind = attendanceBadge(summary)
  if (kind === 'attention') {
    return (
      <Badge variant="warning">
        <TriangleAlert aria-hidden />
        3+ días sin cargar
      </Badge>
    )
  }
  if (kind === 'none') return <Badge variant="outline">Sin registros</Badge>
  return (
    <Badge variant="success">
      <CircleCheck aria-hidden />
      Al día
    </Badge>
  )
}

function weekLabel(summary: AttendanceSummary): string {
  const { week } = summary
  return `${week.done}/${week.planned}${week.extra > 0 ? ` (+${week.extra} extra)` : ''}`
}

function ClientsList({ rows, isAdmin, viewerId }: { rows: ClientRow[]; isAdmin: boolean; viewerId: string }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<Users aria-hidden />}
        title={isAdmin ? 'Todavía no hay clientes' : 'Todavía no tenés clientes'}
        description={isAdmin ? undefined : 'Invitá al primero con el formulario.'}
      />
    )
  }
  return (
    <>
      {/* Phones and small tablets: one card per client. */}
      <ul className="space-y-3 md:hidden">
        {rows.map(({ client: c, summary, trainerLabel }) => (
          <li key={c.id}>
            <Link to={`/clients/${c.id}`} className="block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
              <Card
                className={cn(
                  'gap-2 px-4 py-4 transition-colors hover:border-primary/60',
                  summary.needsAttention && 'border-warning-border bg-warning-muted',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 font-semibold break-words">{displayPersonName(c, viewerId)}</p>
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
                </div>
                <StatusBadge summary={summary} />
                {trainerLabel && <p className="text-xs text-muted-foreground">Entrenador: {trainerLabel}</p>}
                <p className="text-sm text-muted-foreground">
                  Último: {lastWorkoutLabel(summary)} · Semana: {weekLabel(summary)}
                </p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: table. */}
      <Card className="hidden gap-0 overflow-hidden p-0 md:flex">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Cliente</TableHead>
              {isAdmin && <TableHead>Entrenador</TableHead>}
              <TableHead>Último entrenamiento</TableHead>
              <TableHead>Esta semana</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ client: c, summary, trainerLabel }) => (
              <TableRow key={c.id} className={cn(summary.needsAttention && 'bg-warning-muted hover:bg-warning-muted')}>
                <TableCell className="font-semibold">{displayPersonName(c, viewerId)}</TableCell>
                {isAdmin && <TableCell className="text-muted-foreground">{trainerLabel}</TableCell>}
                <TableCell className="text-muted-foreground">
                  {lastWorkoutLabel(summary)}
                  {summary.daysSince !== null && summary.daysSince > 1 && ` (${summary.daysSince} días sin cargar)`}
                </TableCell>
                <TableCell>{weekLabel(summary)}</TableCell>
                <TableCell>
                  <StatusBadge summary={summary} />
                </TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <Link to={`/clients/${c.id}`} aria-label={`Ver a ${c.id === viewerId ? 'tu rutina' : c.full_name || 'cliente sin nombre'}`}>
                      Ver
                      <ChevronRight aria-hidden />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  )
}

export function ClientsPage() {
  const { profile } = useAuth()
  const viewerId = profile?.id ?? ''
  const isAdmin = profile?.role === 'admin'
  const { data, loading, error, reload } = useAsync(
    () => loadClientRows({ id: viewerId, role: isAdmin ? 'admin' : 'trainer' }),
    [viewerId, isAdmin],
  )
  const attention = data?.filter((r) => r.summary.needsAttention).length ?? 0

  return (
    <>
      <PageHeader
        title={isAdmin ? 'Clientes' : 'Mis clientes'}
        subtitle={data ? `${data.length} en total${attention > 0 ? ` · ${attention} con atención` : ''}` : undefined}
      />
      <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
        <div className="min-w-0 space-y-3 lg:col-span-2">
          <ErrorMessage message={error} />
          {loading && (
            <div className="space-y-3" role="status" aria-label="Cargando clientes">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          )}
          {data && <ClientsList rows={data} isAdmin={isAdmin} viewerId={viewerId} />}
        </div>
        <InviteClientForm isAdmin={isAdmin} onInvited={reload} />
      </div>
    </>
  )
}
