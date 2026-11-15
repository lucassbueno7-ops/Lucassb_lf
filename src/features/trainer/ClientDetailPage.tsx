import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { attendanceSummary } from '../../domain/attendance'
import { toISODate } from '../../domain/dates'
import { AttendanceSummary } from '../../shared/AttendanceSummary'
import { BodyMetricsPanel } from '../../shared/BodyMetricsPanel'
import { ExerciseProgress } from '../../shared/ExerciseProgress'
import { fetchActiveRoutine, fetchBodyMetrics, fetchExercisesByIds, fetchWorkoutLogs } from '../../shared/data-api'
import { Button, Card, ErrorMessage, Input, Spinner } from '../../shared/ui'
import { useAsync } from '../../shared/useAsync'
import type { Profile } from '../auth/auth-context'
import { addBodyMetric, getClient, updateClientProfile } from './api'

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
    <Card title="Perfil">
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="Nombre" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input label="Altura (cm)" type="number" inputMode="decimal" min="1" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} />
        <ErrorMessage message={error} />
        {saved && <p className="text-sm text-teal-700">Guardado.</p>}
        <Button type="submit">Guardar</Button>
      </form>
    </Card>
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
    <form onSubmit={onSubmit} className="mt-3 flex flex-wrap items-end gap-2">
      <Input label="Peso (kg)" type="number" inputMode="decimal" step="0.1" min="1" required value={weight} onChange={(e) => setWeight(e.target.value)} className="w-28" />
      <Input label="Fecha" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      <Button type="submit">Agregar</Button>
      <ErrorMessage message={error} />
    </form>
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

  if (client.loading) return <Spinner />
  if (!client.data) return <ErrorMessage message={client.error ?? 'Cliente no encontrado.'} />

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{client.data.full_name || 'Cliente'}</h1>
        <Link to="/trainer" className="text-sm text-teal-700">
          Volver
        </Link>
      </div>
      <ClientProfileForm client={client.data} onSaved={client.reload} />
      <Link
        to={`/trainer/clients/${clientId}/routine`}
        className="flex min-h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-medium text-white"
      >
        Editar rutina
      </Link>
      {logs.data && !routine.loading && (
        <AttendanceSummary
          summary={attendanceSummary(
            logs.data.map((l) => l.performed_at),
            routine.data?.routine_days ?? [],
            toISODate(),
          )}
        />
      )}
      <div>
        <BodyMetricsPanel metrics={metrics.data ?? []} heightCm={client.data.height_cm} />
        <AddWeightForm clientId={clientId} onAdded={metrics.reload} />
      </div>
      <ExerciseProgress logs={logs.data ?? []} exerciseNames={names} />
    </>
  )
}
