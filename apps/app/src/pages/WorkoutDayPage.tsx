import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CircleCheck, Pencil, PlayCircle, Save } from 'lucide-react'
import { buildSetDrafts, planSetSave, toISODate } from '@trainer/shared/domain'
import type { RoutineExercise, SetDraft, WorkoutLog } from '@trainer/shared/domain'
import { ExerciseImage } from '@trainer/shared/charts'
import { fetchActiveRoutine, fetchWorkoutLogs } from '@trainer/shared/data-api'
import { Badge, Button, Card, CardContent, ErrorMessage, PageHeader, Spinner, TextField, useAsync } from '@trainer/shared/ui'
import { insertWorkoutLogs, updateWorkoutLog } from '../api'
import { useViewedClient } from '../viewed-client'

const formatKg = (kg: number) => Number(kg).toLocaleString('es-AR')

const setNumbers = (count: number) => Array.from({ length: count }, (_, i) => i + 1)

/** Presentational row: one set already logged today, or a placeholder when it was not. */
function SetSummaryRow({ setNumber, log }: { setNumber: number; log: WorkoutLog | undefined }) {
  if (!log) {
    return (
      <li className="flex items-center justify-between gap-2 rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
        <span className="font-medium">Serie {setNumber}</span>
        <span>Sin registrar hoy</span>
      </li>
    )
  }
  return (
    <li className="flex items-center justify-between gap-2 rounded-lg bg-success-muted px-3 py-3 text-sm">
      <span className="flex items-center gap-2 font-medium">
        <CircleCheck aria-hidden className="size-4 text-success-foreground" />
        Serie {setNumber}
      </span>
      <span className="font-semibold text-success-foreground">
        {formatKg(log.weight_kg)} kg x {log.reps}
      </span>
    </li>
  )
}

/** Presentational row: editable kg/reps pair for one set. */
function SetInputRow({
  draft,
  logged,
  onChange,
}: {
  draft: SetDraft
  logged: boolean
  onChange: (patch: Partial<SetDraft>) => void
}) {
  return (
    <li className="space-y-2 rounded-lg bg-muted/60 p-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        {logged && <CircleCheck aria-label="Registrada" className="size-4 text-success-foreground" />}
        Serie {draft.setNumber}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {/* type="text" + inputMode: type="number" drops the "," that Spanish keyboards emit. */}
        <TextField
          label="Kg"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={draft.weight}
          onChange={(e) => onChange({ weight: e.target.value })}
        />
        <TextField
          label="Reps"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          placeholder="0"
          value={draft.reps}
          onChange={(e) => onChange({ reps: e.target.value })}
        />
      </div>
    </li>
  )
}

const buildDrafts = (re: RoutineExercise, todays: WorkoutLog[], lastSets: WorkoutLog[]): SetDraft[] =>
  buildSetDrafts({ sets: re.sets, reps: re.reps, targetWeightKg: re.target_weight_kg }, todays, lastSets)

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
  const complete = setNumbers(re.sets).every((n) => todays.some((l) => l.set_number === n))

  const [editing, setEditing] = useState(false)
  const [drafts, setDrafts] = useState<SetDraft[]>(() => buildDrafts(re, todays, lastSets))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Incomplete exercises stay open for input; complete ones show a summary until "Editar".
  const showInputs = !readOnly && (editing || !complete)

  const startEditing = () => {
    setDrafts(buildDrafts(re, todays, lastSets))
    setError(null)
    setEditing(true)
  }

  const cancelEditing = () => {
    setError(null)
    setEditing(false)
  }

  const updateDraft = (setNumber: number, patch: Partial<SetDraft>) =>
    setDrafts((ds) => ds.map((d) => (d.setNumber === setNumber ? { ...d, ...patch } : d)))

  const save = async () => {
    setError(null)
    const plan = planSetSave(drafts, todays)
    if (!plan.ok) return setError(plan.error)
    if (plan.inserts.length === 0 && plan.updates.length === 0) {
      if (complete) setEditing(false)
      else setError('Completá al menos una serie para guardar.')
      return
    }
    setSaving(true)
    try {
      await insertWorkoutLogs(
        plan.inserts.map((s) => ({
          ...s,
          client_id: clientId,
          routine_exercise_id: re.id,
          exercise_id: re.exercise_id,
          performed_at: today,
        })),
      )
      await Promise.all(plan.updates.map(({ id, ...patch }) => updateWorkoutLog(id, patch)))
      setEditing(false)
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="overflow-hidden pt-0">
      <ExerciseImage url={re.exercises?.image_url} alt={re.exercises?.name ?? 'Ejercicio'} className="h-44 w-full rounded-none" />
      <CardContent className="space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-lg leading-tight font-bold break-words">{re.exercises?.name}</p>
          <Badge variant="default">
            {re.sets} x {re.reps}
            {re.target_weight_kg !== null && ` @ ${formatKg(re.target_weight_kg)} kg`}
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
            Última vez ({lastDate}): {lastSets.map((s) => `${formatKg(s.weight_kg)}x${s.reps}`).join(', ')}
          </p>
        )}

        {showInputs ? (
          <>
            <ul className="space-y-2 pt-3">
              {drafts.map((d) => (
                <SetInputRow
                  key={d.setNumber}
                  draft={d}
                  logged={todays.some((l) => l.set_number === d.setNumber)}
                  onChange={(patch) => updateDraft(d.setNumber, patch)}
                />
              ))}
            </ul>
            <p className="pt-1 text-xs text-muted-foreground">
              Ya tiene tu última marca: cambiala solo si subiste peso o reps. Dejá vacía una serie que no hiciste.
            </p>
            <ErrorMessage message={error} />
            <div className="flex gap-2 pt-2">
              {editing && (
                <Button variant="ghost" disabled={saving} onClick={cancelEditing}>
                  Cancelar
                </Button>
              )}
              <Button className="flex-1" disabled={saving} onClick={() => void save()}>
                <Save aria-hidden />
                {saving ? 'Guardando...' : 'Guardar ejercicio'}
              </Button>
            </div>
          </>
        ) : (
          <>
            <ul className="space-y-2 pt-3">
              {setNumbers(re.sets).map((n) => (
                <SetSummaryRow key={n} setNumber={n} log={todays.find((l) => l.set_number === n)} />
              ))}
            </ul>
            {!readOnly && (
              <Button variant="outline" className="mt-2 w-full" onClick={startEditing}>
                <Pencil aria-hidden />
                Editar
              </Button>
            )}
          </>
        )}
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
