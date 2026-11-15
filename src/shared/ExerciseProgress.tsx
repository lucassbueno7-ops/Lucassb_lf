import { useMemo, useState } from 'react'
import { bestSetPerDate, groupLogsByExercise, volumePerDate } from '../domain/progression'
import type { WorkoutLog } from '../domain/types'
import { ProgressChart } from './ProgressChart'
import { Card, Select } from './ui'

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
      <Card title="Progreso por ejercicio">
        <p className="text-sm text-slate-500">Todavía no hay registros de entrenamiento.</p>
      </Card>
    )
  }

  const points = bestSetPerDate(grouped[current])
  const volume = volumePerDate(grouped[current])
  const last = points[points.length - 1]

  return (
    <Card title="Progreso por ejercicio">
      <Select label="Ejercicio" value={current} onChange={(e) => setSelected(e.target.value)}>
        {ids.map((id) => (
          <option key={id} value={id}>
            {exerciseNames[id] ?? 'Ejercicio'}
          </option>
        ))}
      </Select>
      <div className="mt-3">
        <ProgressChart
          data={points.map((p) => ({ date: p.date, value: Math.round(p.estimated_1rm * 10) / 10 }))}
          unit="kg (1RM est.)"
        />
      </div>
      <h3 className="mt-4 text-sm font-medium text-slate-700">Volumen por día (kg x reps)</h3>
      <div className="mt-1">
        <ProgressChart
          data={volume.map((v) => ({ date: v.date, value: Math.round(v.volume) }))}
          unit="kg (volumen)"
          color="#b45309"
        />
      </div>
      {last && (
        <p className="mt-2 text-sm text-slate-600">
          Último mejor set: {last.weight_kg} kg x {last.reps} ({last.date})
        </p>
      )}
      <ul className="mt-3 divide-y divide-slate-100 text-sm">
        {[...points].reverse().slice(0, 8).map((p) => (
          <li key={p.date} className="flex justify-between py-1">
            <span>{p.date}</span>
            <span>
              {p.weight_kg} kg x {p.reps}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
