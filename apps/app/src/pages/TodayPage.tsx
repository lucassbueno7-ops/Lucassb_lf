import { Link } from 'react-router-dom'
import { plannedDaysForDate } from '@trainer/shared/domain'
import { toISODate } from '@trainer/shared/domain'
import { ExerciseImage } from '@trainer/shared/charts'
import { fetchActiveRoutine } from '@trainer/shared/data-api'
import { Card, ErrorMessage, Spinner } from '@trainer/shared/ui'
import { useAsync } from '@trainer/shared/ui'
import { useAuth } from '@trainer/shared/auth'

/** Client landing: what is scheduled for today. */
export function TodayPage() {
  const { profile } = useAuth()
  const clientId = profile?.id ?? ''
  const { data, loading, error } = useAsync(() => fetchActiveRoutine(clientId), [clientId])

  if (loading) return <Spinner />
  const todays = data ? plannedDaysForDate(data.routine_days, toISODate()) : []

  return (
    <>
      <ErrorMessage message={error} />
      {!data ? (
        <Card>
          <p className="text-sm text-slate-600">Tu entrenador todavía no te asignó una rutina.</p>
        </Card>
      ) : todays.length === 0 ? (
        <Card>
          <h1 className="text-lg font-semibold">Hoy es día de descanso</h1>
          <p className="mt-1 text-sm text-slate-600">
            Mirá tu <Link to="/week" className="text-teal-700 underline">semana</Link> o tu{' '}
            <Link to="/routine" className="text-teal-700 underline">rutina completa</Link>.
          </p>
        </Card>
      ) : (
        todays.map((day) => (
          <Card key={day.id}>
            <h1 className="text-lg font-semibold">Hoy te toca: {day.name}</h1>
            <ul className="mt-3 space-y-2">
              {day.routine_exercises.map((re) => (
                <li key={re.id} className="flex items-center gap-3 text-sm">
                  <ExerciseImage url={re.exercises?.image_url} alt={re.exercises?.name ?? 'Ejercicio'} className="h-12 w-12 shrink-0" />
                  <div>
                    <p className="font-medium">{re.exercises?.name}</p>
                    <p className="text-slate-500">
                      {re.sets} x {re.reps}
                      {re.target_weight_kg !== null && ` @ ${re.target_weight_kg} kg`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              to={`/day/${day.id}`}
              className="mt-4 flex min-h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-medium text-white"
            >
              Empezar entrenamiento
            </Link>
          </Card>
        ))
      )}
    </>
  )
}
