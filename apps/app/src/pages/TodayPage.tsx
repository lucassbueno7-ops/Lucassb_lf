import { Link } from 'react-router-dom'
import { Moon, Play, ClipboardList } from 'lucide-react'
import { plannedDaysForDate, toISODate } from '@trainer/shared/domain'
import { ExerciseImage } from '@trainer/shared/charts'
import { fetchActiveRoutine } from '@trainer/shared/data-api'
import { Button, EmptyState, ErrorMessage, PageHeader, Section, Spinner, useAsync } from '@trainer/shared/ui'
import { useViewedClient } from '../viewed-client'

/** Client landing: what is scheduled for today. */
export function TodayPage() {
  const { clientId, readOnly } = useViewedClient()
  const { data, loading, error } = useAsync(() => fetchActiveRoutine(clientId), [clientId])

  if (loading) return <Spinner />
  const todays = data ? plannedDaysForDate(data.routine_days, toISODate()) : []

  return (
    <>
      <PageHeader title="Hoy" subtitle={data?.name} />
      <ErrorMessage message={error} />
      {!data ? (
        <EmptyState
          icon={<ClipboardList aria-hidden />}
          title="Todavía no hay rutina"
          description={readOnly ? 'Este cliente todavía no tiene una rutina asignada.' : 'Tu entrenador todavía no te asignó una rutina.'}
        />
      ) : todays.length === 0 ? (
        <EmptyState
          icon={<Moon aria-hidden />}
          title="Hoy es día de descanso"
          description="Aprovechá para recuperarte. Mirá la semana o la rutina completa cuando quieras."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button asChild variant="secondary">
                <Link to="/week">Ver semana</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link to="/routine">Ver rutina</Link>
              </Button>
            </div>
          }
        />
      ) : (
        todays.map((day) => (
          <Section key={day.id} title={day.name} description={`${day.routine_exercises.length} ejercicios`}>
            <ul className="space-y-3">
              {day.routine_exercises.map((re) => (
                <li key={re.id} className="flex items-center gap-3">
                  <ExerciseImage url={re.exercises?.image_url} alt={re.exercises?.name ?? 'Ejercicio'} className="size-16 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold break-words">{re.exercises?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {re.sets} x {re.reps}
                      {re.target_weight_kg !== null && ` @ ${re.target_weight_kg} kg`}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="mt-5 w-full">
              <Link to={`/day/${day.id}`}>
                <Play aria-hidden />
                {readOnly ? 'Ver entrenamiento' : 'Empezar entrenamiento'}
              </Link>
            </Button>
          </Section>
        ))
      )}
    </>
  )
}
