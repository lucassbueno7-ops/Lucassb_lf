import { describe, expect, it } from 'vitest'
import { buildSetDrafts, planSetSave } from './set-entry'
import type { WorkoutLog } from './types'

const log = (set_number: number, weight_kg: number, reps: number): WorkoutLog => ({
  id: `log-${set_number}`,
  exercise_id: 'ex',
  routine_exercise_id: 're',
  performed_at: '2026-11-19',
  set_number,
  weight_kg,
  reps,
})

describe('planSetSave', () => {
  it('inserts every filled set when nothing was logged yet', () => {
    const plan = planSetSave(
      [
        { setNumber: 1, weight: '11,5', reps: '10' },
        { setNumber: 2, weight: '11.5', reps: '8' },
      ],
      [],
    )
    expect(plan).toEqual({
      ok: true,
      inserts: [
        { set_number: 1, weight_kg: 11.5, reps: 10 },
        { set_number: 2, weight_kg: 11.5, reps: 8 },
      ],
      updates: [],
    })
  })

  it('skips sets left completely empty', () => {
    const plan = planSetSave(
      [
        { setNumber: 1, weight: '20', reps: '10' },
        { setNumber: 2, weight: '', reps: '' },
      ],
      [],
    )
    expect(plan).toEqual({ ok: true, inserts: [{ set_number: 1, weight_kg: 20, reps: 10 }], updates: [] })
  })

  it('updates only logged sets whose values changed', () => {
    const plan = planSetSave(
      [
        { setNumber: 1, weight: '20', reps: '10' },
        { setNumber: 2, weight: '22,5', reps: '8' },
      ],
      [log(1, 20, 10), log(2, 225, 8)],
    )
    expect(plan).toEqual({ ok: true, inserts: [], updates: [{ id: 'log-2', weight_kg: 22.5, reps: 8 }] })
  })

  it('keeps a logged set untouched when its inputs are cleared', () => {
    const plan = planSetSave([{ setNumber: 1, weight: '', reps: '' }], [log(1, 20, 10)])
    expect(plan).toEqual({ ok: true, inserts: [], updates: [] })
  })

  it('rejects a half-filled set', () => {
    expect(planSetSave([{ setNumber: 2, weight: '20', reps: '' }], [])).toEqual({
      ok: false,
      error: 'Serie 2: completá kg y reps.',
    })
  })

  it('rejects invalid weight or reps', () => {
    expect(planSetSave([{ setNumber: 1, weight: 'abc', reps: '10' }], [])).toEqual({
      ok: false,
      error: 'Serie 1: el peso no es válido.',
    })
    expect(planSetSave([{ setNumber: 1, weight: '10', reps: '0' }], [])).toEqual({
      ok: false,
      error: 'Serie 1: las reps tienen que ser un número entero mayor a 0.',
    })
    expect(planSetSave([{ setNumber: 1, weight: '10', reps: '8,5' }], [])).toEqual({
      ok: false,
      error: 'Serie 1: las reps tienen que ser un número entero mayor a 0.',
    })
  })
})

describe('buildSetDrafts', () => {
  const target = { sets: 3, reps: '10', targetWeightKg: 20 }

  it('uses the routine target when there is no history', () => {
    expect(buildSetDrafts(target, [], [])).toEqual([
      { setNumber: 1, weight: '20', reps: '10' },
      { setNumber: 2, weight: '20', reps: '10' },
      { setNumber: 3, weight: '20', reps: '10' },
    ])
  })

  it('prefers the last session as reference over the routine target', () => {
    expect(buildSetDrafts(target, [], [log(1, 11.5, 12), log(2, 12.5, 9)])).toEqual([
      { setNumber: 1, weight: '11.5', reps: '12' },
      { setNumber: 2, weight: '12.5', reps: '9' },
      { setNumber: 3, weight: '20', reps: '10' },
    ])
  })

  it("shows today's logged values so an edit starts from what was saved", () => {
    expect(buildSetDrafts(target, [log(1, 25, 8)], [log(1, 11.5, 12)])[0]).toEqual({ setNumber: 1, weight: '25', reps: '8' })
  })

  it('leaves fields empty when the target is missing or reps are a range', () => {
    expect(buildSetDrafts({ sets: 1, reps: '8-12', targetWeightKg: null }, [], [])).toEqual([
      { setNumber: 1, weight: '', reps: '' },
    ])
  })

  it('round-trips into a save plan without changes when nothing was edited', () => {
    const todays = [log(1, 11.5, 10), log(2, 11.5, 10), log(3, 11.5, 10)]
    expect(planSetSave(buildSetDrafts(target, todays, []), todays)).toEqual({ ok: true, inserts: [], updates: [] })
  })
})
