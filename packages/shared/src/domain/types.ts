export type Role = 'trainer' | 'client' | 'admin'

export interface WorkoutLog {
  id: string
  exercise_id: string
  routine_exercise_id: string | null
  performed_at: string // YYYY-MM-DD
  set_number: number
  weight_kg: number
  reps: number
}

export interface ProgressPoint {
  date: string
  weight_kg: number
  reps: number
  estimated_1rm: number
}

export interface VolumePoint {
  date: string
  volume: number
}

export interface Exercise {
  id: string
  trainer_id: string
  name: string
  muscle_group: string | null
  video_url: string | null
  image_url: string | null
}

export interface BodyMetric {
  id: string
  client_id: string
  measured_at: string
  weight_kg: number
  notes: string | null
}

export interface RoutineExercise {
  id: string
  routine_day_id: string
  exercise_id: string
  sets: number
  reps: string
  target_weight_kg: number | null
  notes: string | null
  position: number
  exercises: { name: string; video_url: string | null; image_url: string | null } | null
}

export interface RoutineDay {
  id: string
  routine_id: string
  name: string
  position: number
  weekdays: number[] // ISO: 1 = Monday ... 7 = Sunday
  routine_exercises: RoutineExercise[]
}

export interface Routine {
  id: string
  client_id: string
  name: string
  active: boolean
  routine_days: RoutineDay[]
}
