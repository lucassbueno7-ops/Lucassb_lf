import { CalendarCheck, Clock, TriangleAlert } from 'lucide-react'
import type { AttendanceSummary as Summary } from '../domain/attendance'
import { StatTile } from '../ui/ui'

export function lastWorkoutLabel(s: Summary): string {
  if (s.daysSince === null) return 'Sin entrenamientos'
  if (s.daysSince === 0) return 'Hoy'
  if (s.daysSince === 1) return 'Ayer'
  return `Hace ${s.daysSince} días`
}

/** Presentational: last workout, days without logging and this week's attendance as stat tiles. */
export function AttendanceSummary({ summary }: { summary: Summary }) {
  const { week } = summary
  return (
    <section aria-label="Asistencia" className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Último entrenamiento"
          value={lastWorkoutLabel(summary)}
          hint={summary.lastDate ?? undefined}
          icon={<Clock aria-hidden />}
          tone={summary.needsAttention ? 'warning' : 'default'}
        />
        <StatTile label="Días sin cargar" value={summary.daysSince ?? '-'} tone={summary.needsAttention ? 'warning' : 'default'} />
        <StatTile
          label="Esta semana"
          value={`${week.done}/${week.planned}`}
          hint={week.extra > 0 ? `+${week.extra} extra` : undefined}
          icon={<CalendarCheck aria-hidden />}
        />
      </div>
      {summary.needsAttention && (
        <p className="flex items-center gap-2 rounded-lg border border-warning-border bg-warning-muted px-3 py-2 text-sm text-warning-foreground">
          <TriangleAlert aria-hidden className="size-4 shrink-0" />3 o más días sin cargar entrenamientos.
        </p>
      )}
    </section>
  )
}
