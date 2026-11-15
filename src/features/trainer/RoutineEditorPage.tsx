import { useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { nextPosition } from '../../domain/sorting'
import type { Exercise, Routine, RoutineDay } from '../../domain/types'
import { fetchActiveRoutine } from '../../shared/data-api'
import { Button, Card, ErrorMessage, Input, Select, Spinner } from '../../shared/ui'
import { useAsync } from '../../shared/useAsync'
import { useAuth } from '../auth/auth-context'
import {
  addDay,
  addRoutineExercise,
  createRoutine,
  deleteDay,
  deleteRoutine,
  deleteRoutineExercise,
  listExercises,
  renameDay,
  setDayWeekdays,
} from './api'

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
    <form onSubmit={onSubmit} className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
      <Select label="Ejercicio" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
        <option value="">Elegir...</option>
        {catalog.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.name}
          </option>
        ))}
      </Select>
      <div className="grid grid-cols-3 gap-2">
        <Input label="Series" type="number" min="1" required value={sets} onChange={(e) => setSets(e.target.value)} />
        <Input label="Reps" required value={reps} onChange={(e) => setReps(e.target.value)} />
        <Input label="Peso (kg)" type="number" step="0.5" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} />
      </div>
      <Input label="Notas" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <ErrorMessage message={error} />
      <Button type="submit">Agregar ejercicio</Button>
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
    <fieldset className="mt-3">
      <legend className="mb-1 text-sm font-medium text-slate-700">Días de la semana</legend>
      <div className="flex gap-1">
        {WEEKDAY_LABELS.map((w) => {
          const checked = value.includes(w.value)
          return (
            <label
              key={w.value}
              title={w.title}
              className={`flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium ${
                checked ? 'border-teal-700 bg-teal-700 text-white' : 'border-slate-300 bg-white text-slate-700'
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                aria-label={w.title}
                checked={checked}
                onChange={(e) => onToggle(w.value, e.target.checked)}
              />
              {w.label}
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
      <div className="flex items-end gap-2">
        <Input label="Nombre del día" value={name} onChange={(e) => setName(e.target.value)} />
        <Button variant="secondary" onClick={() => void run(() => renameDay(day.id, name.trim()))}>
          Guardar
        </Button>
        <Button variant="danger" onClick={() => void run(() => deleteDay(day.id))}>
          Borrar
        </Button>
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
      <ol className="mt-3 divide-y divide-slate-100">
        {day.routine_exercises.map((re) => (
          <li key={re.id} className="flex items-start justify-between gap-2 py-2 text-sm">
            <div>
              <p className="font-medium">{re.exercises?.name}</p>
              <p className="text-slate-500">
                {re.sets} x {re.reps}
                {re.target_weight_kg !== null && ` @ ${re.target_weight_kg} kg`}
              </p>
              {re.notes && <p className="text-xs text-slate-400">{re.notes}</p>}
            </div>
            <Button variant="ghost" onClick={() => void run(() => deleteRoutineExercise(re.id))}>
              Quitar
            </Button>
          </li>
        ))}
      </ol>
      <AddExerciseForm day={day} catalog={catalog} onAdded={onChange} />
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
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{routine.name}</h2>
        <Button variant="danger" onClick={() => void run(() => deleteRoutine(routine.id))}>
          Eliminar rutina
        </Button>
      </div>
      <ErrorMessage message={error} />
      {routine.routine_days.map((day) => (
        <DayEditor key={day.id} day={day} catalog={catalog} onChange={onChange} />
      ))}
      <Card title="Agregar día">
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            void run(async () => {
              await addDay(routine, newDay.trim())
              setNewDay('')
            })
          }}
        >
          <Input label="Nombre (ej. Día A - Pierna)" required value={newDay} onChange={(e) => setNewDay(e.target.value)} />
          <Button type="submit">Agregar</Button>
        </form>
      </Card>
    </>
  )
}

export function RoutineEditorPage() {
  const { clientId = '' } = useParams()
  const { profile } = useAuth()
  const trainerId = profile?.id ?? ''
  const routine = useAsync(() => fetchActiveRoutine(clientId), [clientId])
  const catalog = useAsync(() => listExercises(trainerId), [trainerId])
  const [name, setName] = useState('Rutina')
  const [error, setError] = useState<string | null>(null)

  if (routine.loading || catalog.loading) return <Spinner />

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
      <Link to={`/trainer/clients/${clientId}`} className="text-sm text-teal-700">
        Volver al cliente
      </Link>
      <ErrorMessage message={routine.error ?? catalog.error} />
      {catalog.data?.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Tu catálogo está vacío. Cargá ejercicios en la pestaña Ejercicios.
        </p>
      )}
      {routine.data ? (
        <RoutineEditor routine={routine.data} catalog={catalog.data ?? []} onChange={routine.reload} />
      ) : (
        <Card title="Crear rutina">
          <form onSubmit={onCreate} className="space-y-3">
            <Input label="Nombre" required value={name} onChange={(e) => setName(e.target.value)} />
            <ErrorMessage message={error} />
            <Button type="submit">Crear rutina</Button>
          </form>
        </Card>
      )}
    </>
  )
}
