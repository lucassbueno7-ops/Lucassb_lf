import { describe, expect, it } from 'vitest'
import { bestSetPerDate, estimateOneRepMax, groupLogsByExercise, volumePerDate } from './progression'
import type { WorkoutLog } from './types'

const log = (p: Partial<WorkoutLog>): WorkoutLog => ({
  id: 'x',
  exercise_id: 'e1',
  routine_exercise_id: 're1',
  performed_at: '2026-01-01',
  set_number: 1,
  weight_kg: 50,
  reps: 10,
  ...p,
})

describe('estimateOneRepMax', () => {
  it('returns the weight for a single rep', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100)
  })
  it('uses the Epley formula', () => {
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.67, 2)
  })
  it('returns 0 for invalid input', () => {
    expect(estimateOneRepMax(0, 5)).toBe(0)
    expect(estimateOneRepMax(50, 0)).toBe(0)
    expect(estimateOneRepMax(-5, 5)).toBe(0)
  })
})

describe('groupLogsByExercise', () => {
  it('groups logs by exercise id', () => {
    const grouped = groupLogsByExercise([
      log({ id: 'a', exercise_id: 'e1' }),
      log({ id: 'b', exercise_id: 'e2' }),
      log({ id: 'c', exercise_id: 'e1' }),
    ])
    expect(Object.keys(grouped).sort()).toEqual(['e1', 'e2'])
    expect(grouped.e1.map((l) => l.id)).toEqual(['a', 'c'])
  })
  it('returns an empty object for no logs', () => {
    expect(groupLogsByExercise([])).toEqual({})
  })
})

describe('bestSetPerDate', () => {
  it('picks the set with the highest estimated 1RM per date, sorted by date', () => {
    const points = bestSetPerDate([
      log({ performed_at: '2026-01-08', weight_kg: 60, reps: 8 }),
      log({ performed_at: '2026-01-01', weight_kg: 50, reps: 10 }),
      log({ performed_at: '2026-01-01', weight_kg: 70, reps: 3 }),
    ])
    expect(points.map((p) => p.date)).toEqual(['2026-01-01', '2026-01-08'])
    expect(points[0].weight_kg).toBe(70)
    expect(points[0].reps).toBe(3)
    expect(points[0].estimated_1rm).toBeCloseTo(77, 0)
  })
  it('returns an empty array for no logs', () => {
    expect(bestSetPerDate([])).toEqual([])
  })
})

describe('volumePerDate', () => {
  it('sums weight x reps of all sets per date, ascending by date', () => {
    const points = volumePerDate([
      log({ performed_at: '2026-01-08', weight_kg: 60, reps: 8 }),
      log({ performed_at: '2026-01-01', weight_kg: 50, reps: 10 }),
      log({ performed_at: '2026-01-01', weight_kg: 70, reps: 3 }),
    ])
    expect(points).toEqual([
      { date: '2026-01-01', volume: 710 },
      { date: '2026-01-08', volume: 480 },
    ])
  })
  it('returns an empty array for no logs', () => {
    expect(volumePerDate([])).toEqual([])
  })
})
