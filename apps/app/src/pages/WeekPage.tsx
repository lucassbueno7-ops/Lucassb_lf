import { Link } from 'react-router-dom'
import { dayStatus, toISODate, weekCalendar, type DayStatus } from '@trainer/shared/domain'
import { fetchActiveRoutine, fetchWorkoutLogs } from '@trainer/shared/data-api'
import { Badge, ErrorMessage, PageHeader, Section, Spinner, cn, useAsync } from '@trainer/shared/ui'
import { useViewedClient } from '../viewed-client'

const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const STATUS_VIEW: Record<DayStatus, { label: string; variant: 'success' | 'destructive' | 'warning' | 'outline' | 'default' }> = {
  done: { label: 'Hecho', variant: 'success' },
  missed: { label: 'Perdido', variant: 'destructive' },
  pending: { label: 'Hoy', variant: 'default' },
  upcoming: { label: 'Pendiente', variant: 'outline' },
  extra: { label: 'Extra', variant: 'success' },
  rest: { label: 'Descanso', variant: 'outline' },
}

/** Client weekly calendar (Mon..Sun): scheduled routine day and whether it was logged. */
export function WeekPage() {
  const { clientId } = useViewedClient()
  const routine = useAsync(() => fetchActiveRoutine(clientId), [clientId])
  const logs = useAsync(() => fetchWorkoutLogs(clientId), [clientId])
  const today = toISODate()

  if (routine.loading || logs.loading) return <Spinner />

  const logged = new Set((logs.data ?? []).map((l) => l.performed_at))
  const calendar = weekCalendar(today, routine.data?.routine_days ?? [])

  return (
    <>
      <PageHeader title="Semana" subtitle="Lunes a domingo" />
      <ErrorMessage message={routine.error ?? logs.error} />
      <Section>
        <ul className="-my-2 divide-y">
          {calendar.map((entry) => {
            const status = dayStatus(entry.date, today, entry.days.length > 0, logged.has(entry.date))
            const view = STATUS_VIEW[status]
            const isToday = entry.date === today
            return (
              <li key={entry.date} className={cn('flex min-h-16 items-center gap-3 py-3', isToday && '-mx-2 rounded-lg bg-primary/10 px-2')}>
                <div
                  aria-hidden
                  className={cn(
                    'grid size-12 shrink-0 place-items-center rounded-xl border text-center leading-tight',
                    isToday ? 'border-primary bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
                  )}
                >
                  <div>
                    <p className="text-[10px] font-bold uppercase">{WEEKDAY_NAMES[entry.weekday - 1].slice(0, 3)}</p>
                    <p className="text-base font-bold">{entry.date.slice(8)}</p>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{WEEKDAY_NAMES[entry.weekday - 1]}</p>
                  <p className="text-sm text-muted-foreground">
                    {entry.days.length === 0
                      ? 'Sin entrenamiento programado'
                      : entry.days.map((d) => (
                          <Link key={d.id} to={`/day/${d.id}`} className="mr-2 inline-block py-1 font-medium text-link hover:underline">
                            {d.name}
                          </Link>
                        ))}
                  </p>
                </div>
                <Badge variant={view.variant}>{view.label}</Badge>
              </li>
            )
          })}
        </ul>
      </Section>
    </>
  )
}
