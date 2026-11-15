import type { Role } from './types'

interface Viewer {
  id: string
  role: Role
}

/**
 * Trainer id that should own a newly created exercise: a trainer owns their own;
 * an admin must pick one (null until they do); clients never create exercises.
 */
export function exerciseOwnerId(viewer: Viewer, selectedTrainerId: string | null): string | null {
  if (viewer.role === 'trainer') return viewer.id
  if (viewer.role === 'admin') return selectedTrainerId || null
  return null
}

/** Trainer whose exercise catalog applies to a client's routine (null when an admin's client has no trainer). */
export function catalogTrainerForClient(viewer: Viewer, client: { trainer_id: string | null } | null): string | null {
  if (viewer.role === 'trainer') return viewer.id
  if (viewer.role === 'admin') return client?.trainer_id ?? null
  return null
}

/** Display name of a trainer from a list, with Spanish fallbacks. */
export function trainerName(trainers: Array<{ id: string; full_name: string | null }>, id: string | null): string {
  if (!id) return 'Sin entrenador'
  const t = trainers.find((x) => x.id === id)
  if (!t) return 'Sin entrenador'
  return t.full_name || 'Sin nombre'
}
