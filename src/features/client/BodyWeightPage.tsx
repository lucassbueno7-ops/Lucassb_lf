import { useState, type FormEvent } from 'react'
import { toISODate } from '../../domain/dates'
import { BodyMetricsPanel } from '../../shared/BodyMetricsPanel'
import { fetchBodyMetrics } from '../../shared/data-api'
import { Button, Card, ErrorMessage, Input, Spinner } from '../../shared/ui'
import { useAsync } from '../../shared/useAsync'
import { useAuth } from '../auth/auth-context'
import { insertBodyWeight, updateOwnProfile } from './api'

function HeightForm({ userId, heightCm, onSaved }: { userId: string; heightCm: number | null; onSaved: () => Promise<void> }) {
  const [height, setHeight] = useState(heightCm?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    try {
      await updateOwnProfile(userId, { height_cm: height ? Number(height) : null })
      await onSaved()
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    }
  }

  return (
    <Card title="Mi altura">
      <form onSubmit={onSubmit} className="space-y-3">
        <Input label="Altura (cm)" type="number" inputMode="decimal" min="1" step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} />
        <ErrorMessage message={error} />
        {saved && <p className="text-sm text-teal-700">Guardado.</p>}
        <Button type="submit">Guardar altura</Button>
      </form>
    </Card>
  )
}

export function BodyWeightPage() {
  const { profile, refreshProfile } = useAuth()
  const clientId = profile?.id ?? ''
  const metrics = useAsync(() => fetchBodyMetrics(clientId), [clientId])
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(toISODate())
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      // Upserts on (client_id, measured_at): saving again for the same day updates it.
      await insertBodyWeight(clientId, Number(weight), date, null)
      setWeight('')
      metrics.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    }
  }

  if (metrics.loading) return <Spinner />
  return (
    <>
      <Card title="Registrar peso">
        <form onSubmit={onSubmit} className="space-y-3">
          <Input label="Peso (kg)" type="number" inputMode="decimal" step="0.1" min="1" required value={weight} onChange={(e) => setWeight(e.target.value)} />
          <Input label="Fecha" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          <p className="text-xs text-slate-500">Si ya cargaste tu peso ese día, se actualiza.</p>
          <ErrorMessage message={error} />
          <Button type="submit">Guardar</Button>
        </form>
      </Card>
      {profile && <HeightForm userId={profile.id} heightCm={profile.height_cm} onSaved={refreshProfile} />}
      <ErrorMessage message={metrics.error} />
      <BodyMetricsPanel metrics={metrics.data ?? []} heightCm={profile?.height_cm ?? null} />
    </>
  )
}
