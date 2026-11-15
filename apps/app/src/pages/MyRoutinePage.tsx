import { Link } from 'react-router-dom'
import { ChevronRight, ClipboardList } from 'lucide-react'
import { ExerciseImage } from '@trainer/shared/charts'
import { fetchActiveRoutine } from '@trainer/shared/data-api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, ErrorMessage, PageHeader, Spinner, useAsync } from '@trainer/shared/ui'
import { useViewedClient } from '../viewed-client'

export function MyRoutinePage() {
  const { clientId, readOnly } = useViewedClient()
  const { data, loading, error } = useAsync(() => fetchActiveRoutine(clientId), [clientId])

  if (loading) return <Spinner />
  return (
    <>
      <PageHeader title={data?.name ?? 'Rutina'} subtitle={data ? `${data.routine_days.length} días` : undefined} />
      <ErrorMessage message={error} />
      {!data ? (
        <EmptyState
          icon={<ClipboardList aria-hidden />}
          title="Todavía no hay rutina"
          description={readOnly ? 'Este cliente todavía no tiene una rutina asignada.' : 'Tu entrenador todavía no te asignó una rutina.'}
        />
      ) : (
        data.routine_days.map((day) => (
          <Link key={day.id} to={`/day/${day.id}`} className="block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50">
            <Card className="transition-colors hover:border-primary/60">
              <CardHeader>
                <div className="min-w-0">
                  <CardTitle>{day.name}</CardTitle>
                  <CardDescription>{day.routine_exercises.length} ejercicios</CardDescription>
                </div>
                <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {day.routine_exercises.map((re) => (
                    <li key={re.id} className="flex items-center gap-3 text-sm">
                      <ExerciseImage url={re.exercises?.image_url} alt={re.exercises?.name ?? 'Ejercicio'} className="size-12 shrink-0" />
                      <span className="min-w-0 flex-1 break-words">{re.exercises?.name}</span>
                      <span className="shrink-0 text-muted-foreground">
                        {re.sets} x {re.reps}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Link>
        ))
      )}
    </>
  )
}
