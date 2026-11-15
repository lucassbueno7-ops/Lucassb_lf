import { Link } from 'react-router-dom'
import { dayStatus, weekCalendar, type DayStatus } from '@trainer/shared/domain'
import { toISODate } from '@trainer/shared/domain'
import { fetchActiveRoutine, fetchWorkoutLogs } from '@trainer/shared/data-api'
import { Card, ErrorMessage, Spinner } from '@trainer/shared/ui'
import { useAsync } from '@trainer/shared/ui'
import { useAuth } from '@trainer/shared/auth'

const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const STATUS_VIEW: Record<DayStatus, { label: string; className: string }> = {
  done: { label: '✓ Hecho', className: 'text-teal-700' },
  missed: { label: '✗ Perdido', className: 'text-red-600' },
  pending: { label: 'Hoy', className: 'text-amber-700' },
  upcoming: { label: 'Pendiente', className: 'text-slate-500' },
  extra: { label: '✓ Extra', className: 'text-teal-700' },
  rest: { label: 'Descanso', className: 'text-slate-400' },
}

/** Client weekly calendar (Mon..Sun): scheduled routine day and whether it was logged. */
export function WeekPage() {
  const { profile } = useAuth()
  const clientId = profile?.id ?? ''
  const routine = useAsync(() => fetchActiveRoutine(clientId), [clientId])
  const logs = useAsync(() => fetchWorkoutLogs(clientId), [clientId])
  const today = toISODate()

  if (routine.loading || logs.loading) return <Spinner />

  const logged = new Set((logs.data ?? []).map((l) => l.performed_at))
  const calendar = weekCalendar(today, routine.data?.routine_days ?? [])

  return (
    <>
      <ErrorMessage message={routine.error ?? logs.error} />
      <Card title="Mi semana">
        <ul className="divide-y divide-slate-100">
          {calendar.map((entry) => {
            const status = dayStatus(entry.date, today, entry.days.length > 0, logged.has(entry.date))
            const view = STATUS_VIEW[status]
            return (
              <li
                key={entry.date}
                className={`flex min-h-12 items-center justify-between gap-2 py-2 ${entry.date === today ? 'font-semibold' : ''}`}
              >
                <div>
                  <p className="text-sm">
                    {WEEKDAY_NAMES[entry.weekday - 1]} <span className="text-xs text-slate-400">{entry.date.slice(5)}</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {entry.days.length === 0
                      ? 'Sin entrenamiento programado'
                      : entry.days.map((d) => (
                          <Link key={d.id} to={`/day/${d.id}`} className="mr-2 text-teal-700 underline">
                            {d.name}
                          </Link>
                        ))}
                  </p>
                </div>
                <span className={`text-sm font-medium ${view.className}`}>{view.label}</span>
              </li>
            )
          })}
        </ul>
      </Card>
    </>
  )
}
