import { useState, type FormEvent } from 'react'
import { parseDecimal, toISODate } from '@trainer/shared/domain'
import { BodyMetricsPanel } from '@trainer/shared/charts'
import { fetchBodyMetrics } from '@trainer/shared/data-api'
import { useAuth } from '@trainer/shared/auth'
import { Button, ErrorMessage, PageHeader, Section, Spinner, SuccessMessage, TextField, useAsync } from '@trainer/shared/ui'
import { insertBodyWeight, updateOwnProfile } from '../api'
import { useViewedClient } from '../viewed-client'

function HeightForm({ userId, heightCm, onSaved }: { userId: string; heightCm: number | null; onSaved: () => Promise<void> }) {
  const [height, setHeight] = useState(heightCm?.toString() ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    const heightCm = height.trim() ? parseDecimal(height) : null
    if (height.trim() && !heightCm) return setError('La altura no es válida.')
    try {
      await updateOwnProfile(userId, { height_cm: heightCm })
      await onSaved()
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    }
  }

  return (
    <Section title="Mi altura">
      <form onSubmit={onSubmit} className="space-y-3">
        <TextField label="Altura (cm)" type="text" inputMode="decimal" autoComplete="off" value={height} onChange={(e) => setHeight(e.target.value)} />
        <ErrorMessage message={error} />
        <SuccessMessage message={saved ? 'Guardado.' : null} />
        <Button type="submit">Guardar altura</Button>
      </form>
    </Section>
  )
}

export function BodyWeightPage() {
  const { profile, refreshProfile } = useAuth()
  const { clientId, client, readOnly } = useViewedClient()
  const metrics = useAsync(() => fetchBodyMetrics(clientId), [clientId])
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(toISODate())
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const weightKg = parseDecimal(weight)
    if (!weightKg) return setError('El peso no es válido.')
    try {
      // Upserts on (client_id, measured_at): saving again for the same day updates it.
      await insertBodyWeight(clientId, weightKg, date, null)
      setWeight('')
      metrics.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    }
  }

  if (metrics.loading) return <Spinner />
  return (
    <>
      <PageHeader title="Peso" subtitle={readOnly ? 'Vista de solo lectura' : undefined} />
      <ErrorMessage message={metrics.error} />
      <BodyMetricsPanel metrics={metrics.data ?? []} heightCm={client?.height_cm ?? null} />
      {!readOnly && (
        <>
          <Section title="Registrar peso">
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <TextField label="Peso (kg)" type="text" inputMode="decimal" autoComplete="off" required value={weight} onChange={(e) => setWeight(e.target.value)} />
                <TextField label="Fecha" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <p className="text-xs text-muted-foreground">Si ya cargaste tu peso ese día, se actualiza.</p>
              <ErrorMessage message={error} />
              <Button type="submit">Guardar</Button>
            </form>
          </Section>
          {profile && <HeightForm userId={profile.id} heightCm={profile.height_cm} onSaved={refreshProfile} />}
        </>
      )}
    </>
  )
}
