import { supabase } from '../lib/supabase'
import { sortByPosition } from '../domain/sorting'
import type { BodyMetric, Exercise, Routine, WorkoutLog } from '../domain/types'

/** Queries used by both the trainer and the client features (RLS scopes the results). */

export async function fetchActiveRoutine(clientId: string): Promise<Routine | null> {
  const { data, error } = await supabase
    .from('routines')
    .select('*, routine_days(*, routine_exercises(*, exercises(name, video_url, image_url)))')
    .eq('client_id', clientId)
    .eq('active', true)
    .order('id')
    .limit(1)
    .maybeSingle()
  if (error) throw error
  if (!data) return null
  const routine = data as Routine
  return {
    ...routine,
    routine_days: sortByPosition(routine.routine_days).map((d) => ({
      ...d,
      routine_exercises: sortByPosition(d.routine_exercises),
    })),
  }
}

export async function fetchBodyMetrics(clientId: string): Promise<BodyMetric[]> {
  const { data, error } = await supabase
    .from('body_metrics')
    .select('*')
    .eq('client_id', clientId)
    .order('measured_at', { ascending: true })
  if (error) throw error
  return (data ?? []) as BodyMetric[]
}

export async function fetchWorkoutLogs(clientId: string): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('id, exercise_id, routine_exercise_id, performed_at, set_number, weight_kg, reps')
    .eq('client_id', clientId)
    .order('performed_at', { ascending: true })
    .order('set_number', { ascending: true })
  if (error) throw error
  return (data ?? []) as WorkoutLog[]
}

export async function fetchExercisesByIds(ids: string[]): Promise<Exercise[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase.from('exercises').select('*').in('id', ids)
  if (error) throw error
  return (data ?? []) as Exercise[]
}
