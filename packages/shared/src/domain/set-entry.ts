import { parseDecimal } from './numbers'
import type { WorkoutLog } from './types'

/** Raw values a person typed for one set. */
export interface SetDraft {
  setNumber: number
  weight: string
  reps: string
}

export interface SetValues {
  set_number: number
  weight_kg: number
  reps: number
}

export type SetSavePlan =
  | { ok: true; inserts: SetValues[]; updates: { id: string; weight_kg: number; reps: number }[] }
  | { ok: false; error: string }

export interface SetTarget {
  sets: number
  /** Routine reps; may be a range like "8-12", which cannot prefill a field. */
  reps: string
  targetWeightKg: number | null
}

/**
 * Initial values for each set's fields: today's logged values when present, otherwise the
 * last session's values as reference, otherwise the routine target. The person edits them
 * only when they changed weight or reps.
 */
export function buildSetDrafts(target: SetTarget, loggedToday: WorkoutLog[], lastSession: WorkoutLog[]): SetDraft[] {
  return Array.from({ length: target.sets }, (_, i) => i + 1).map((n) => {
    const logged = loggedToday.find((l) => l.set_number === n)
    if (logged) return { setNumber: n, weight: String(logged.weight_kg), reps: String(logged.reps) }
    const last = lastSession.find((l) => l.set_number === n)
    const weight = last?.weight_kg ?? target.targetWeightKg
    const reps = last ? String(last.reps) : target.reps
    return { setNumber: n, weight: weight?.toString() ?? '', reps: /^\d+$/.test(reps) ? reps : '' }
  })
}

/**
 * Decides what saving an exercise's sets means: new sets are inserted, logged sets whose
 * values changed are updated, and fully empty rows are skipped (a logged set is never deleted).
 */
export function planSetSave(drafts: SetDraft[], loggedToday: WorkoutLog[]): SetSavePlan {
  const inserts: SetValues[] = []
  const updates: { id: string; weight_kg: number; reps: number }[] = []

  for (const draft of drafts) {
    const weightText = draft.weight.trim()
    const repsText = draft.reps.trim()
    if (weightText === '' && repsText === '') continue
    const label = `Serie ${draft.setNumber}`
    if (weightText === '' || repsText === '') return { ok: false, error: `${label}: completá kg y reps.` }

    const weight = parseDecimal(weightText)
    if (weight === null) return { ok: false, error: `${label}: el peso no es válido.` }
    const reps = /^\d+$/.test(repsText) ? Number(repsText) : 0
    if (reps < 1) return { ok: false, error: `${label}: las reps tienen que ser un número entero mayor a 0.` }

    const existing = loggedToday.find((l) => l.set_number === draft.setNumber)
    if (!existing) {
      inserts.push({ set_number: draft.setNumber, weight_kg: weight, reps })
    } else if (Number(existing.weight_kg) !== weight || existing.reps !== reps) {
      updates.push({ id: existing.id, weight_kg: weight, reps })
    }
  }

  return { ok: true, inserts, updates }
}
