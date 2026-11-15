import { Link } from 'react-router-dom'
import { ExerciseImage } from '@trainer/shared/charts'
import { fetchActiveRoutine } from '@trainer/shared/data-api'
import { Card, ErrorMessage, Spinner } from '@trainer/shared/ui'
import { useAsync } from '@trainer/shared/ui'
import { useAuth } from '@trainer/shared/auth'

export function MyRoutinePage() {
  const { profile } = useAuth()
  const clientId = profile?.id ?? ''
  const { data, loading, error } = useAsync(() => fetchActiveRoutine(clientId), [clientId])

  if (loading) return <Spinner />
  return (
    <>
      <ErrorMessage message={error} />
      {!data ? (
        <Card>
          <p className="text-sm text-slate-600">Tu entrenador todavía no te asignó una rutina.</p>
        </Card>
      ) : (
        <>
          <h1 className="text-lg font-semibold">{data.name}</h1>
          {data.routine_days.map((day) => (
            <Link key={day.id} to={`/day/${day.id}`} className="block">
              <Card>
                <p className="font-medium">{day.name}</p>
                <p className="text-sm text-slate-500">{day.routine_exercises.length} ejercicios</p>
                <ul className="mt-2 space-y-2">
                  {day.routine_exercises.map((re) => (
                    <li key={re.id} className="flex items-center gap-3 text-sm">
                      <ExerciseImage url={re.exercises?.image_url} alt={re.exercises?.name ?? 'Ejercicio'} className="h-12 w-12 shrink-0" />
                      <span>{re.exercises?.name}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </Link>
          ))}
        </>
      )}
    </>
  )
}
