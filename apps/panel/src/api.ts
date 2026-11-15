import { supabase } from '@trainer/shared/supabase'
import { nextPosition } from '@trainer/shared/domain'
import type { Exercise, Role, Routine } from '@trainer/shared/domain'
import type { Profile } from '@trainer/shared/auth'

/**
 * People with a routine. Trainers: every profile with trainer_id = them (themselves included).
 * Admins: every trainee (trainer_id not null, any role) plus role='client' profiles.
 */
export async function listClients(viewer: { id: string; role: Role }): Promise<Profile[]> {
  let query = supabase.from('profiles').select('id, role, full_name, height_cm, trainer_id')
  query = viewer.role === 'admin' ? query.or('role.eq.client,trainer_id.not.is.null') : query.eq('trainer_id', viewer.id)
  const { data, error } = await query.order('full_name')
  if (error) throw error
  return (data ?? []) as Profile[]
}

/** Admin-only in practice: RLS hides other trainers' profiles from trainers. */
export async function listTrainers(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, height_cm, trainer_id')
    .eq('role', 'trainer')
    .order('full_name')
  if (error) throw error
  return (data ?? []) as Profile[]
}

export async function getClient(clientId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, full_name, height_cm, trainer_id')
    .eq('id', clientId)
    .maybeSingle()
  if (error) throw error
  return data as Profile | null
}

export async function updateClientProfile(clientId: string, patch: { full_name: string; height_cm: number | null }) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', clientId)
  if (error) throw error
}

export async function inviteClient(email: string, fullName: string) {
  const { data, error } = await supabase.functions.invoke('invite-client', {
    body: { email, full_name: fullName },
  })
  if (error) {
    // FunctionsHttpError carries the response; try to surface the server message.
    const ctx = (error as { context?: Response }).context
    if (ctx && typeof ctx.json === 'function') {
      const body = (await ctx.json().catch(() => null)) as { error?: string } | null
      if (body?.error) throw new Error(body.error)
    }
    throw error
  }
  return data as { user_id: string | null }
}

export async function addBodyMetric(clientId: string, weightKg: number, measuredAt: string) {
  const { error } = await supabase
    .from('body_metrics')
    .upsert({ client_id: clientId, weight_kg: weightKg, measured_at: measuredAt }, { onConflict: 'client_id,measured_at' })
  if (error) throw error
}

// ---- Exercise catalog

/** Exercises of one trainer, or every exercise when `trainerId` is null (admin catalog view). */
export async function listExercises(trainerId: string | null): Promise<Exercise[]> {
  let query = supabase.from('exercises').select('*')
  if (trainerId) query = query.eq('trainer_id', trainerId)
  const { data, error } = await query.order('name')
  if (error) throw error
  return (data ?? []) as Exercise[]
}

export type ExerciseInput = {
  name: string
  muscle_group: string | null
  video_url: string | null
  image_url: string | null
}

export async function createExercise(trainerId: string, input: ExerciseInput) {
  const { error } = await supabase.from('exercises').insert({ trainer_id: trainerId, ...input })
  if (error) throw error
}

export async function updateExercise(id: string, input: ExerciseInput) {
  const { error } = await supabase.from('exercises').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteExercise(id: string) {
  const { error } = await supabase.from('exercises').delete().eq('id', id)
  if (error) throw error
}

const IMAGE_BUCKET = 'exercise-images'

/** Uploads to exercise-images/{trainerId}/{uuid}.{ext} and returns the public URL. */
export async function uploadExerciseImage(trainerId: string, file: File): Promise<string> {
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${trainerId}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type })
  if (error) throw error
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}

/** Best-effort removal of a previously uploaded image given its public URL. */
export async function removeExerciseImage(publicUrl: string) {
  const marker = `/${IMAGE_BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return
  const path = decodeURIComponent(publicUrl.slice(idx + marker.length))
  await supabase.storage.from(IMAGE_BUCKET).remove([path])
}

// ---- Attendance

export interface ClientScheduledDay {
  id: string
  name: string
  weekdays: number[]
}

/** Distinct (client, date) training rows since `since`, scoped to the trainer's clients by RLS. */
export async function listTrainingDates(since: string): Promise<Array<{ client_id: string; performed_at: string }>> {
  const { data, error } = await supabase.rpc('client_training_dates', { since })
  if (error) throw error
  return (data ?? []) as Array<{ client_id: string; performed_at: string }>
}

/** Scheduled days of each client's active routine, keyed by client id. */
export async function listScheduledDays(clientIds: string[]): Promise<Record<string, ClientScheduledDay[]>> {
  if (clientIds.length === 0) return {}
  const { data, error } = await supabase
    .from('routines')
    .select('client_id, routine_days(id, name, weekdays)')
    .eq('active', true)
    .in('client_id', clientIds)
  if (error) throw error
  const out: Record<string, ClientScheduledDay[]> = {}
  for (const r of (data ?? []) as unknown as Array<{ client_id: string; routine_days: ClientScheduledDay[] }>) {
    ;(out[r.client_id] ??= []).push(...r.routine_days)
  }
  return out
}

// ---- Routine editing

export async function createRoutine(clientId: string, name: string) {
  const { error } = await supabase.from('routines').insert({ client_id: clientId, name, active: true })
  if (error) throw error
}

export async function deleteRoutine(id: string) {
  const { error } = await supabase.from('routines').delete().eq('id', id)
  if (error) throw error
}

export async function addDay(routine: Routine, name: string) {
  const { error } = await supabase
    .from('routine_days')
    .insert({ routine_id: routine.id, name, position: nextPosition(routine.routine_days) })
  if (error) throw error
}

export async function renameDay(id: string, name: string) {
  const { error } = await supabase.from('routine_days').update({ name }).eq('id', id)
  if (error) throw error
}

export async function setDayWeekdays(id: string, weekdays: number[]) {
  const { error } = await supabase.from('routine_days').update({ weekdays }).eq('id', id)
  if (error) throw error
}

export async function deleteDay(id: string) {
  const { error } = await supabase.from('routine_days').delete().eq('id', id)
  if (error) throw error
}

export interface RoutineExerciseInput {
  exercise_id: string
  sets: number
  reps: string
  target_weight_kg: number | null
  notes: string | null
}

export async function addRoutineExercise(dayId: string, position: number, input: RoutineExerciseInput) {
  const { error } = await supabase.from('routine_exercises').insert({ routine_day_id: dayId, position, ...input })
  if (error) throw error
}

export async function updateRoutineExercise(id: string, input: Partial<RoutineExerciseInput> & { position?: number }) {
  const { error } = await supabase.from('routine_exercises').update(input).eq('id', id)
  if (error) throw error
}

export async function deleteRoutineExercise(id: string) {
  const { error } = await supabase.from('routine_exercises').delete().eq('id', id)
  if (error) throw error
}
