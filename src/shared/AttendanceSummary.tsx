import type { AttendanceSummary as Summary } from '../domain/attendance'
import { Card } from './ui'

export function lastWorkoutLabel(s: Summary): string {
  if (s.daysSince === null) return 'Sin entrenamientos'
  if (s.daysSince === 0) return 'Hoy'
  if (s.daysSince === 1) return 'Ayer'
  return `Hace ${s.daysSince} días`
}

/** Presentational: last workout, days without logging and this week's attendance. */
export function AttendanceSummary({ summary }: { summary: Summary }) {
  const { week } = summary
  return (
    <Card title="Asistencia" className={summary.needsAttention ? 'border-amber-400 bg-amber-50' : undefined}>
      <dl className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <dt className="text-slate-500">Último entrenamiento</dt>
          <dd className="font-medium">{summary.lastDate ? `${summary.lastDate} (${lastWorkoutLabel(summary)})` : lastWorkoutLabel(summary)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Días sin cargar</dt>
          <dd className="font-medium">{summary.daysSince ?? '-'}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Esta semana</dt>
          <dd className="font-medium">
            {week.done}/{week.planned}
            {week.extra > 0 && ` (+${week.extra} extra)`}
          </dd>
        </div>
      </dl>
      {summary.needsAttention && (
        <p className="mt-2 text-sm text-amber-800">3 o más días sin cargar entrenamientos.</p>
      )}
    </Card>
  )
}
