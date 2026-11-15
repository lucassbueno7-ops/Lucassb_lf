import { supabase } from '@trainer/shared/supabase'

export interface NewWorkoutLog {
  client_id: string
  routine_exercise_id: string
  exercise_id: string
  performed_at: string
  set_number: number
  weight_kg: number
  reps: number
}

/** History is append-only: this always inserts, never updates. */
export async function insertWorkoutLog(log: NewWorkoutLog) {
  const { error } = await supabase.from('workout_logs').insert(log)
  if (error) throw error
}

/** One weight per day: saving again for the same date updates it. */
export async function insertBodyWeight(clientId: string, weightKg: number, measuredAt: string, notes: string | null) {
  const { error } = await supabase
    .from('body_metrics')
    .upsert(
      { client_id: clientId, weight_kg: weightKg, measured_at: measuredAt, notes },
      { onConflict: 'client_id,measured_at' },
    )
  if (error) throw error
}

export async function updateOwnProfile(userId: string, patch: { full_name?: string; height_cm?: number | null }) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) throw error
}
