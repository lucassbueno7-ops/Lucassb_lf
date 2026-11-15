import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CircleCheck, PlayCircle } from 'lucide-react'
import { toISODate } from '@trainer/shared/domain'
import type { RoutineExercise, WorkoutLog } from '@trainer/shared/domain'
import { ExerciseImage } from '@trainer/shared/charts'
import { fetchActiveRoutine, fetchWorkoutLogs } from '@trainer/shared/data-api'
import { Badge, Button, Card, CardContent, ErrorMessage, PageHeader, Spinner, TextField, useAsync } from '@trainer/shared/ui'
import { insertWorkoutLog } from '../api'
import { useViewedClient } from '../viewed-client'

interface SetRowProps {
  setNumber: number
  loggedToday: WorkoutLog | undefined
  suggestedWeight: number | null
  suggestedReps: string
  readOnly: boolean
  onSave: (weight: number, reps: number) => Promise<void>
}

/** Presentational row: one set, either already logged today, an input pair, or (preview) read-only. */
function SetRow({ setNumber, loggedToday, suggestedWeight, suggestedReps, readOnly, onSave }: SetRowProps) {
  const [weight, setWeight] = useState(suggestedWeight?.toString() ?? '')
  const [reps, setReps] = useState(/^\d+$/.test(suggestedReps) ? suggestedReps : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loggedToday) {
    return (
      <li className="flex items-center justify-between gap-2 rounded-lg bg-success-muted px-3 py-3 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <CircleCheck aria-hidden className="size-4 text-success-foreground" />
          Serie {setNumber}
        </span>
        <span className="font-semibold text-success-foreground">
          {loggedToday.weight_kg} kg x {loggedToday.reps}
        </span>
      </li>
    )
  }

  if (readOnly) {
    return (
      <li className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
        <span className="font-medium">Serie {setNumber}</span>
        <span>Sin registrar hoy</span>
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
    <li className="space-y-2 rounded-lg bg-muted/60 p-3">
      <p className="text-sm font-semibold">Serie {setNumber}</p>
      <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
        <TextField label="Kg" type="number" inputMode="decimal" step="0.5" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
        <TextField label="Reps" type="number" inputMode="numeric" min="1" value={reps} onChange={(e) => setReps(e.target.value)} />
        <Button disabled={saving || invalid} onClick={() => void save()} aria-label={`Guardar serie ${setNumber}`}>
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
  readOnly,
  onSaved,
}: {
  re: RoutineExercise
  clientId: string
  today: string
  history: WorkoutLog[]
  readOnly: boolean
  onSaved: () => void
}) {
  const mine = history.filter((l) => l.exercise_id === re.exercise_id)
  const todays = mine.filter((l) => l.performed_at === today)
  const previous = mine.filter((l) => l.performed_at < today)
  const lastDate = previous.length ? previous[previous.length - 1].performed_at : null
  const lastSets = lastDate ? previous.filter((l) => l.performed_at === lastDate) : []

  return (
    <Card className="overflow-hidden pt-0">
      <ExerciseImage url={re.exercises?.image_url} alt={re.exercises?.name ?? 'Ejercicio'} className="h-44 w-full rounded-none" />
      <CardContent className="space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-lg leading-tight font-bold break-words">{re.exercises?.name}</p>
          <Badge variant="default">
            {re.sets} x {re.reps}
            {re.target_weight_kg !== null && ` @ ${re.target_weight_kg} kg`}
          </Badge>
        </div>
        {re.notes && <p className="text-sm text-muted-foreground">{re.notes}</p>}
        {re.exercises?.video_url && (
          <a
            href={re.exercises.video_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-link hover:underline"
          >
            <PlayCircle aria-hidden className="size-4" />
            Ver video
          </a>
        )}
        {lastSets.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Última vez ({lastDate}): {lastSets.map((s) => `${s.weight_kg}x${s.reps}`).join(', ')}
          </p>
        )}
        <ul className="space-y-2 pt-3">
          {Array.from({ length: re.sets }, (_, i) => i + 1).map((n) => {
            const last = lastSets.find((s) => s.set_number === n)
            return (
              <SetRow
                key={n}
                setNumber={n}
                readOnly={readOnly}
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
      </CardContent>
    </Card>
  )
}

export function WorkoutDayPage() {
  const { dayId } = useParams()
  const { clientId, readOnly } = useViewedClient()
  const routine = useAsync(() => fetchActiveRoutine(clientId), [clientId])
  const logs = useAsync(() => fetchWorkoutLogs(clientId), [clientId])
  const today = toISODate()

  if (routine.loading || logs.loading) return <Spinner />
  const day = routine.data?.routine_days.find((d) => d.id === dayId)
  if (!day) return <ErrorMessage message={routine.error ?? 'No encontramos ese día.'} />

  return (
    <>
      <PageHeader
        title={day.name}
        subtitle={readOnly ? 'Vista de solo lectura' : undefined}
        back={
          <Link to="/" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-link hover:underline">
            <ArrowLeft aria-hidden className="size-4" />
            Volver
          </Link>
        }
      />
      <ErrorMessage message={logs.error} />
      {day.routine_exercises.map((re) => (
        <ExerciseLogger key={re.id} re={re} clientId={clientId} today={today} history={logs.data ?? []} readOnly={readOnly} onSaved={logs.reload} />
      ))}
    </>
  )
}
