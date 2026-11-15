import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ClipboardList } from 'lucide-react'
import { attendanceSummary, toISODate } from '@trainer/shared/domain'
import { AttendanceSummary, BodyMetricsPanel, ExerciseProgress } from '@trainer/shared/charts'
import { fetchActiveRoutine, fetchBodyMetrics, fetchExercisesByIds, fetchWorkoutLogs } from '@trainer/shared/data-api'
import {
  Button,
  ErrorMessage,
  PageHeader,
  Section,
  Skeleton,
  SuccessMessage,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextField,
  useAsync,
} from '@trainer/shared/ui'
import type { Profile } from '@trainer/shared/auth'
import { addBodyMetric, getClient, updateClientProfile } from '../api'

function ClientProfileForm({ client, onSaved }: { client: Profile; onSaved: () => void }) {
  const [fullName, setFullName] = useState(client.full_name ?? '')
  const [height, setHeight] = useState(client.height_cm?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    try {
      await updateClientProfile(client.id, {
        full_name: fullName.trim(),
        height_cm: height ? Number(height) : null,
      })
      setSaved(true)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    }
  }

  return (
    <Section title="Perfil" className="max-w-xl">
      <form onSubmit={onSubmit} className="space-y-3">
        <TextField label="Nombre" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <TextField label="Altura (cm)" type="number" inputMode="decimal" min="1" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} />
        <ErrorMessage message={error} />
        <SuccessMessage message={saved ? 'Guardado.' : null} />
        <Button type="submit">Guardar</Button>
      </form>
    </Section>
  )
}

function AddWeightForm({ clientId, onAdded }: { clientId: string; onAdded: () => void }) {
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(toISODate())
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await addBodyMetric(clientId, Number(weight), date)
      setWeight('')
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    }
  }

  return (
    <Section title="Registrar peso">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Peso (kg)" type="number" inputMode="decimal" step="0.1" min="1" required value={weight} onChange={(e) => setWeight(e.target.value)} />
          <TextField label="Fecha" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <ErrorMessage message={error} />
        <Button type="submit">Agregar</Button>
      </form>
    </Section>
  )
}

export function ClientDetailPage() {
  const { clientId = '' } = useParams()
  const client = useAsync(() => getClient(clientId), [clientId])
  const metrics = useAsync(() => fetchBodyMetrics(clientId), [clientId])
  const logs = useAsync(() => fetchWorkoutLogs(clientId), [clientId])
  const routine = useAsync(() => fetchActiveRoutine(clientId), [clientId])
  const [names, setNames] = useState<Record<string, string>>({})

  const exerciseIds = logs.data ? [...new Set(logs.data.map((l) => l.exercise_id))] : []
  const idsKey = exerciseIds.join(',')
  useEffect(() => {
    if (!idsKey) return
    let cancelled = false
    fetchExercisesByIds(idsKey.split(',')).then((list) => {
      if (!cancelled) setNames(Object.fromEntries(list.map((x) => [x.id, x.name])))
    })
    return () => {
      cancelled = true
    }
  }, [idsKey])

  if (client.loading) {
    return (
      <div className="space-y-4" role="status" aria-label="Cargando cliente">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-28" />
        <Skeleton className="h-64" />
      </div>
    )
  }
  if (!client.data) return <ErrorMessage message={client.error ?? 'Cliente no encontrado.'} />

  return (
    <>
      <PageHeader
        title={client.data.full_name || 'Cliente'}
        subtitle={client.data.height_cm ? `${client.data.height_cm} cm` : undefined}
        back={
          <Link to="/" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-link hover:underline">
            <ArrowLeft aria-hidden className="size-4" />
            Clientes
          </Link>
        }
        actions={
          <Button asChild>
            <Link to={`/clients/${clientId}/routine`}>
              <ClipboardList aria-hidden />
              Editar rutina
            </Link>
          </Button>
        }
      />
      <ErrorMessage message={logs.error ?? metrics.error ?? routine.error} />

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Resumen</TabsTrigger>
          <TabsTrigger value="progress">Progreso</TabsTrigger>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          {logs.data && !routine.loading ? (
            <AttendanceSummary
              summary={attendanceSummary(
                logs.data.map((l) => l.performed_at),
                routine.data?.routine_days ?? [],
                toISODate(),
              )}
            />
          ) : (
            <Skeleton className="h-28" />
          )}
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <BodyMetricsPanel metrics={metrics.data ?? []} heightCm={client.data.height_cm} />
            <AddWeightForm clientId={clientId} onAdded={metrics.reload} />
          </div>
        </TabsContent>

        <TabsContent value="progress">
          <ExerciseProgress logs={logs.data ?? []} exerciseNames={names} />
        </TabsContent>

        <TabsContent value="profile">
          <ClientProfileForm client={client.data} onSaved={client.reload} />
        </TabsContent>
      </Tabs>
    </>
  )
}
