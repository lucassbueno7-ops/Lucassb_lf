import type { ProgressPoint, VolumePoint, WorkoutLog } from './types'

/** Epley formula. Returns 0 for invalid input. */
export function estimateOneRepMax(weightKg: number, reps: number): number {
  if (!(weightKg > 0) || !(reps > 0)) return 0
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}

export function groupLogsByExercise<T extends { exercise_id: string }>(logs: T[]): Record<string, T[]> {
  const out: Record<string, T[]> = {}
  for (const log of logs) {
    ;(out[log.exercise_id] ??= []).push(log)
  }
  return out
}

/** Total volume (sum of weight x reps over all sets) per date, ascending by date. */
export function volumePerDate(logs: WorkoutLog[]): VolumePoint[] {
  const totals = new Map<string, number>()
  for (const log of logs) {
    totals.set(log.performed_at, (totals.get(log.performed_at) ?? 0) + log.weight_kg * log.reps)
  }
  return [...totals.entries()]
    .map(([date, volume]) => ({ date, volume }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Best set (highest estimated 1RM) of each date, ascending by date. */
export function bestSetPerDate(logs: WorkoutLog[]): ProgressPoint[] {
  const best = new Map<string, ProgressPoint>()
  for (const log of logs) {
    const e1rm = estimateOneRepMax(log.weight_kg, log.reps)
    const current = best.get(log.performed_at)
    if (!current || e1rm > current.estimated_1rm) {
      best.set(log.performed_at, {
        date: log.performed_at,
        weight_kg: log.weight_kg,
        reps: log.reps,
        estimated_1rm: e1rm,
      })
    }
  }
  return [...best.values()].sort((a, b) => a.date.localeCompare(b.date))
}
