import type { Role } from './types'

/** Trainers and admins work in the panel and may preview the client app. */
export function isStaff(role: Role | undefined | null): boolean {
  return role === 'trainer' || role === 'admin'
}

/**
 * "Being trained" is decoupled from role: a profile is a trainee (has its own routine)
 * when it has a trainer, whatever its role. role = what you administer; trainer_id = who trains you.
 */
export function isTrainee(profile: { trainer_id: string | null } | null | undefined): boolean {
  return profile?.trainer_id != null
}

export type AppMode = 'self' | 'preview'

/**
 * How the client app should behave for this profile. Clients always see their own routine;
 * staff without a trainer can only preview; trainee staff pick (or have picked) between both.
 */
export function resolveAppMode(
  profile: { role: Role; trainer_id: string | null },
  stored: AppMode | null,
): AppMode | 'choose' {
  if (!isStaff(profile.role)) return 'self'
  if (!isTrainee(profile)) return 'preview'
  return stored ?? 'choose'
}

/** "Vos" for the viewer's own row, otherwise the name with a fallback. */
export function displayPersonName(person: { id: string; full_name: string | null }, viewerId: string): string {
  if (person.id === viewerId) return 'Vos'
  return person.full_name?.trim() || 'Sin nombre'
}

/** Union of lists deduped by id (first occurrence wins). */
export function mergeById<T extends { id: string }>(...lists: T[][]): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of lists.flat()) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
  }
  return out
}

/** Where to land right after signing in. */
export function landingPathForRole(role: Role): string {
  return isStaff(role) ? '/choose' : '/'
}

function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

/** Case- and accent-insensitive name filter. */
export function filterClientsByName<T extends { full_name: string | null }>(clients: T[], query: string): T[] {
  const q = normalize(query.trim())
  if (!q) return clients
  return clients.filter((c) => normalize(c.full_name ?? '').includes(q))
}

export type AttendanceBadge = 'attention' | 'none' | 'ok'

export function attendanceBadge(s: { daysSince: number | null; needsAttention: boolean }): AttendanceBadge {
  if (s.needsAttention) return 'attention'
  if (s.daysSince === null) return 'none'
  return 'ok'
}
