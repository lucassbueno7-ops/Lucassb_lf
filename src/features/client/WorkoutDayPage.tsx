import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toISODate } from '../../domain/dates'
import type { RoutineExercise, WorkoutLog } from '../../domain/types'
import { ExerciseImage } from '../../shared/ExerciseImage'
import { fetchActiveRoutine, fetchWorkoutLogs } from '../../shared/data-api'
import { Button, Card, ErrorMessage, Input, Spinner } from '../../shared/ui'
import { useAsync } from '../../shared/useAsync'
import { useAuth } from '../auth/auth-context'
import { insertWorkoutLog } from './api'

interface SetRowProps {
  setNumber: number
  loggedToday: WorkoutLog | undefined
  suggestedWeight: number | null
  suggestedReps: string
  onSave: (weight: number, reps: number) => Promise<void>
}

/** Presentational row: one set, either already logged today (read-only) or an input pair. */
function SetRow({ setNumber, loggedToday, suggestedWeight, suggestedReps, onSave }: SetRowProps) {
  const [weight, setWeight] = useState(suggestedWeight?.toString() ?? '')
  const [reps, setReps] = useState(/^\d+$/.test(suggestedReps) ? suggestedReps : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loggedToday) {
    return (
      <li className="flex items-center justify-between rounded-lg bg-teal-50 px-3 py-2 text-sm">
        <span>Serie {setNumber}</span>
        <span className="font-medium text-teal-800">
          {loggedToday.weight_kg} kg x {loggedToday.reps} - registrada
        </span>
      </li>
    )
  }

  const save = async () => {
    setError(null)
    setSaving(true)
    try {
      await onSave(Number(weight), Number(reps))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  const invalid = weight === '' || Number(weight) < 0 || !(Number(reps) > 0)

  return (
    <li className="space-y-1">
      <div className="flex items-end gap-2">
        <span className="w-14 pb-3 text-sm">Serie {setNumber}</span>
        <Input label="Kg" type="number" inputMode="decimal" step="0.5" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <Input label="Reps" type="number" inputMode="numeric" min="1" value={reps} onChange={(e) => setReps(e.target.value)} />
        <Button disabled={saving || invalid} onClick={() => void save()}>
          Guardar
        </Button>
      </div>
      <ErrorMessage message={error} />
    </li>
  )
}

function ExerciseLogger({
  re,
  clientId,
  today,
  history,
  onSaved,
}: {
  re: RoutineExercise
  clientId: string
  today: string
  history: WorkoutLog[]
  onSaved: () => void
}) {
  const mine = history.filter((l) => l.exercise_id === re.exercise_id)
  const todays = mine.filter((l) => l.performed_at === today)
  const previous = mine.filter((l) => l.performed_at < today)
  const lastDate = previous.length ? previous[previous.length - 1].performed_at : null
  const lastSets = lastDate ? previous.filter((l) => l.performed_at === lastDate) : []

  return (
    <Card>
      <ExerciseImage url={re.exercises?.image_url} alt={re.exercises?.name ?? 'Ejercicio'} className="mb-2 h-40 w-full" />
      <p className="font-medium">{re.exercises?.name}</p>
      <p className="text-sm text-slate-500">
        Objetivo: {re.sets} x {re.reps}
        {re.target_weight_kg !== null && ` @ ${re.target_weight_kg} kg`}
      </p>
      {re.notes && <p className="text-xs text-slate-400">{re.notes}</p>}
      {re.exercises?.video_url && (
        <a href={re.exercises.video_url} target="_blank" rel="noreferrer" className="text-sm text-teal-700 underline">
          Ver video
        </a>
      )}
      {lastSets.length > 0 && (
        <p className="mt-1 text-xs text-slate-500">
          Última vez ({lastDate}): {lastSets.map((s) => `${s.weight_kg}x${s.reps}`).join(', ')}
        </p>
      )}
      <ul className="mt-3 space-y-2">
        {Array.from({ length: re.sets }, (_, i) => i + 1).map((n) => {
          const last = lastSets.find((s) => s.set_number === n)
          return (
            <SetRow
              key={n}
              setNumber={n}
              loggedToday={todays.find((l) => l.set_number === n)}
              suggestedWeight={last?.weight_kg ?? re.target_weight_kg}
              suggestedReps={last ? String(last.reps) : re.reps}
              onSave={async (weight, reps) => {
                await insertWorkoutLog({
                  client_id: clientId,
                  routine_exercise_id: re.id,
                  exercise_id: re.exercise_id,
                  performed_at: today,
                  set_number: n,
                  weight_kg: weight,
                  reps,
                })
                onSaved()
              }}
            />
          )
        })}
      </ul>
    </Card>
  )
}

export function WorkoutDayPage() {
  const { dayId } = useParams()
  const { profile } = useAuth()
  const clientId = profile?.id ?? ''
  const routine = useAsync(() => fetchActiveRoutine(clientId), [clientId])
  const logs = useAsync(() => fetchWorkoutLogs(clientId), [clientId])
  const today = toISODate()

  if (routine.loading || logs.loading) return <Spinner />
  const day = routine.data?.routine_days.find((d) => d.id === dayId)
  if (!day) return <ErrorMessage message={routine.error ?? 'No encontramos ese día.'} />

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">{day.name}</h1>
        <Link to="/app" className="text-sm text-teal-700">
          Volver
        </Link>
      </div>
      <ErrorMessage message={logs.error} />
      {day.routine_exercises.map((re) => (
        <ExerciseLogger key={re.id} re={re} clientId={clientId} today={today} history={logs.data ?? []} onSaved={logs.reload} />
      ))}
    </>
  )
}
