import { useMemo, useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { bestSetPerDate, groupLogsByExercise, volumePerDate } from '../domain/progression'
import type { WorkoutLog } from '../domain/types'
import { ProgressChart } from './ProgressChart'
import { EmptyState, Section, SelectField, StatTile } from '../ui/ui'

interface Props {
  logs: WorkoutLog[]
  exerciseNames: Record<string, string>
}

/** Presentational: per-exercise progression (estimated 1RM of the best set per day, and total volume per day). */
export function ExerciseProgress({ logs, exerciseNames }: Props) {
  const grouped = useMemo(() => groupLogsByExercise(logs), [logs])
  const ids = Object.keys(grouped).sort((a, b) => (exerciseNames[a] ?? '').localeCompare(exerciseNames[b] ?? ''))
  const [selected, setSelected] = useState<string>('')
  const current = selected && grouped[selected] ? selected : ids[0]

  if (ids.length === 0) {
    return (
      <Section title="Progreso por ejercicio">
        <EmptyState
          icon={<TrendingUp aria-hidden />}
          title="Todavía no hay registros"
          description="Cuando se carguen series de entrenamiento, vas a ver acá la evolución de cada ejercicio."
        />
      </Section>
    )
  }

  const points = bestSetPerDate(grouped[current])
  const volume = volumePerDate(grouped[current])
  const last = points[points.length - 1]

  return (
    <div className="space-y-4">
      <Section title="Progreso por ejercicio">
        <SelectField label="Ejercicio" value={current} onChange={(e) => setSelected(e.target.value)}>
          {ids.map((id) => (
            <option key={id} value={id}>
              {exerciseNames[id] ?? 'Ejercicio'}
            </option>
          ))}
        </SelectField>
        {last && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatTile label="Mejor set reciente" value={`${last.weight_kg} kg x ${last.reps}`} hint={last.date} />
            <StatTile label="1RM estimado" value={`${Math.round(last.estimated_1rm * 10) / 10} kg`} />
          </div>
        )}
      </Section>
      <div className="grid gap-4 lg:grid-cols-2">
      <Section title="1RM estimado">
        <ProgressChart data={points.map((p) => ({ date: p.date, value: Math.round(p.estimated_1rm * 10) / 10 }))} unit="kg" />
      </Section>
      <Section title="Volumen por día" description="kg x reps">
        <ProgressChart data={volume.map((v) => ({ date: v.date, value: Math.round(v.volume) }))} unit="kg" series="chart-2" />
      </Section>
      </div>
      <Section title="Últimos registros">
        <ul className="divide-y text-sm">
          {[...points].reverse().slice(0, 8).map((p) => (
            <li key={p.date} className="flex justify-between gap-2 py-2">
              <span className="text-muted-foreground">{p.date}</span>
              <span className="font-semibold">
                {p.weight_kg} kg x {p.reps}
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}
