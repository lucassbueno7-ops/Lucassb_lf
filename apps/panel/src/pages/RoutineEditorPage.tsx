import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, TriangleAlert } from 'lucide-react'
import { catalogTrainerForClient, nextPosition } from '@trainer/shared/domain'
import type { Exercise, Routine, RoutineDay } from '@trainer/shared/domain'
import { fetchActiveRoutine } from '@trainer/shared/data-api'
import { ExerciseImage } from '@trainer/shared/charts'
import { Button, Card, CardContent, ErrorMessage, PageHeader, Section, SelectField, Skeleton, TextField, cn, useAsync } from '@trainer/shared/ui'
import { useAuth } from '@trainer/shared/auth'
import { ConfirmButton } from '../ConfirmButton'
import {
  addDay,
  addRoutineExercise,
  createRoutine,
  deleteDay,
  deleteRoutine,
  deleteRoutineExercise,
  getClient,
  listExercises,
  renameDay,
  setDayWeekdays,
} from '../api'

function AddExerciseForm({ day, catalog, onAdded }: { day: RoutineDay; catalog: Exercise[]; onAdded: () => void }) {
  const [exerciseId, setExerciseId] = useState('')
  const [sets, setSets] = useState('3')
  const [reps, setReps] = useState('10')
  const [weight, setWeight] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!exerciseId) return setError('Elegí un ejercicio.')
    try {
      await addRoutineExercise(day.id, nextPosition(day.routine_exercises), {
        exercise_id: exerciseId,
        sets: Number(sets),
        reps: reps.trim(),
        target_weight_kg: weight ? Number(weight) : null,
        notes: notes.trim() || null,
      })
      setNotes('')
      onAdded()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agregar.')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl bg-muted/60 p-3 sm:p-4">
      <p className="text-sm font-semibold">Agregar ejercicio</p>
      <SelectField label="Ejercicio" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
        <option value="">Elegir...</option>
        {catalog.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </SelectField>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <TextField label="Series" type="number" min="1" required value={sets} onChange={(e) => setSets(e.target.value)} />
        <TextField label="Reps" required value={reps} onChange={(e) => setReps(e.target.value)} />
        <TextField label="Kg" type="number" step="0.5" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
      </div>
      <TextField label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <ErrorMessage message={error} />
      <Button type="submit" className="w-full sm:w-auto">
        <Plus aria-hidden />
        Agregar ejercicio
      </Button>
    </form>
  )
}

const WEEKDAY_LABELS = [
  { value: 1, label: 'L', title: 'Lunes' },
  { value: 2, label: 'M', title: 'Martes' },
  { value: 3, label: 'X', title: 'Miércoles' },
  { value: 4, label: 'J', title: 'Jueves' },
  { value: 5, label: 'V', title: 'Viernes' },
  { value: 6, label: 'S', title: 'Sábado' },
  { value: 7, label: 'D', title: 'Domingo' },
]

/** Presentational: seven ISO-weekday toggles (Monday=1 ... Sunday=7). */
function WeekdayPicker({ value, onToggle }: { value: number[]; onToggle: (weekday: number, checked: boolean) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">Días de la semana</legend>
      <div className="grid max-w-sm grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((w) => {
          const checked = value.includes(w.value)
          return (
            <label
              key={w.value}
              title={w.title}
              className={cn(
                'flex min-h-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold transition-colors',
                'has-[:focus-visible]:ring-[3px] has-[:focus-visible]:ring-ring/50',
                checked ? 'border-primary bg-primary text-primary-foreground shadow-glow' : 'border-input bg-background/60 text-foreground hover:bg-accent',
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                aria-label={w.title}
                checked={checked}
                onChange={(e) => onToggle(w.value, e.target.checked)}
              />
              <span aria-hidden>{w.label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

function DayEditor({ day, catalog, onChange }: { day: RoutineDay; catalog: Exercise[]; onChange: () => void }) {
  const [name, setName] = useState(day.name)
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    try {
      await fn()
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    }
  }

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <TextField label="Nombre del día" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => void run(() => renameDay(day.id, name.trim()))}>
              Guardar nombre
            </Button>
            <ConfirmButton
              variant="ghost"
              className="text-danger-foreground hover:text-danger-foreground"
              title="¿Borrar este día?"
              description="Se borran también sus ejercicios. Esta acción no se puede deshacer."
              confirmLabel="Borrar día"
              onConfirm={() => void run(() => deleteDay(day.id))}
            >
              <Trash2 aria-hidden />
              Borrar día
            </ConfirmButton>
          </div>
        </div>
        <WeekdayPicker
          value={day.weekdays}
          onToggle={(weekday, checked) =>
            void run(() =>
              setDayWeekdays(
                day.id,
                (checked ? [...day.weekdays, weekday] : day.weekdays.filter((w) => w !== weekday)).sort((a, b) => a - b),
              ),
            )
          }
        />
        <ErrorMessage message={error} />
        {day.routine_exercises.length > 0 && (
          <ol className="divide-y">
            {day.routine_exercises.map((re) => (
              <li key={re.id} className="flex items-center gap-3 py-3 text-sm">
                <ExerciseImage url={re.exercises?.image_url} alt={re.exercises?.name ?? 'Ejercicio'} className="size-12 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold break-words">{re.exercises?.name}</p>
                  <p className="text-muted-foreground">
                    {re.sets} x {re.reps}
                    {re.target_weight_kg !== null && ` @ ${re.target_weight_kg} kg`}
                  </p>
                  {re.notes && <p className="text-xs text-muted-foreground">{re.notes}</p>}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar ${re.exercises?.name ?? 'ejercicio'}`}
                  title="Quitar"
                  onClick={() => void run(() => deleteRoutineExercise(re.id))}
                >
                  <Trash2 aria-hidden className="size-5" />
                </Button>
              </li>
            ))}
          </ol>
        )}
        <AddExerciseForm day={day} catalog={catalog} onAdded={onChange} />
      </CardContent>
    </Card>
  )
}

function RoutineEditor({ routine, catalog, onChange }: { routine: Routine; catalog: Exercise[]; onChange: () => void }) {
  const [newDay, setNewDay] = useState('')
  const [error, setError] = useState<string | null>(null)

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    try {
      await fn()
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar.')
    }
  }

  return (
    <>
      <PageHeader
        title={routine.name}
        subtitle={`${routine.routine_days.length} días`}
        actions={
          <ConfirmButton
            variant="outline"
            title="¿Eliminar la rutina?"
            description="Se borran sus días y ejercicios. El historial de entrenamientos del cliente no se modifica."
            confirmLabel="Eliminar rutina"
            onConfirm={() => void run(() => deleteRoutine(routine.id))}
          >
            <Trash2 aria-hidden />
            Eliminar rutina
          </ConfirmButton>
        }
      />
      <ErrorMessage message={error} />
      <div className="grid gap-4 xl:grid-cols-2 xl:items-start">
        {routine.routine_days.map((day) => (
          <DayEditor key={day.id} day={day} catalog={catalog} onChange={onChange} />
        ))}
      </div>
      <Section title="Agregar día">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              await addDay(routine, newDay.trim())
              setNewDay('')
            })
          }}
        >
          <TextField label="Nombre (ej. Día A - Pierna)" required value={newDay} onChange={(e) => setNewDay(e.target.value)} />
          <Button type="submit">
            <Plus aria-hidden />
            Agregar día
          </Button>
        </form>
      </Section>
    </>
  )
}

export function RoutineEditorPage() {
  const { clientId = '' } = useParams()
  const { profile } = useAuth()
  const viewerId = profile?.id ?? ''
  const role = profile?.role ?? 'trainer'
  const routine = useAsync(() => fetchActiveRoutine(clientId), [clientId])
  // The picker lists the exercises of the CLIENT's trainer (an admin is not that trainer).
  const catalog = useAsync(async () => {
    const client = role === 'admin' ? await getClient(clientId) : null
    const trainerId = catalogTrainerForClient({ id: viewerId, role }, client)
    return trainerId ? listExercises(trainerId) : []
  }, [clientId, viewerId, role])
  const [name, setName] = useState('Rutina')
  const [error, setError] = useState<string | null>(null)

  if (routine.loading || catalog.loading) {
    return (
      <div className="space-y-4" role="status" aria-label="Cargando rutina">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      await createRoutine(clientId, name.trim())
      routine.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la rutina.')
    }
  }

  return (
    <>
      <Link to={`/clients/${clientId}`} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-link hover:underline">
        <ArrowLeft aria-hidden className="size-4" />
        Volver al cliente
      </Link>
      <ErrorMessage message={routine.error ?? catalog.error} />
      {catalog.data?.length === 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-warning-border bg-warning-muted px-3 py-2 text-sm text-warning-foreground">
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          {role === 'admin'
            ? 'El entrenador de este cliente no tiene ejercicios (o el cliente no tiene entrenador asignado).'
            : 'Tu catálogo está vacío. Cargá ejercicios en la sección Ejercicios.'}
        </p>
      )}
      {routine.data ? (
        <RoutineEditor routine={routine.data} catalog={catalog.data ?? []} onChange={routine.reload} />
      ) : (
        <Section title="Crear rutina" className="max-w-xl">
          <form onSubmit={onCreate} className="space-y-3">
            <TextField label="Nombre" required value={name} onChange={(e) => setName(e.target.value)} />
            <ErrorMessage message={error} />
            <Button type="submit">Crear rutina</Button>
          </form>
        </Section>
      )}
    </>
  )
}
