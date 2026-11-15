import { describe, expect, it } from 'vitest'
import { catalogTrainerForClient, exerciseOwnerId, trainerName } from './ownership'

describe('exerciseOwnerId', () => {
  it('a trainer always owns their own exercises, ignoring any selection', () => {
    expect(exerciseOwnerId({ id: 't1', role: 'trainer' }, 't2')).toBe('t1')
    expect(exerciseOwnerId({ id: 't1', role: 'trainer' }, null)).toBe('t1')
  })
  it('an admin uses the selected trainer', () => {
    expect(exerciseOwnerId({ id: 'a1', role: 'admin' }, 't2')).toBe('t2')
  })
  it('an admin without a selection has no owner', () => {
    expect(exerciseOwnerId({ id: 'a1', role: 'admin' }, '')).toBeNull()
    expect(exerciseOwnerId({ id: 'a1', role: 'admin' }, null)).toBeNull()
  })
  it('a client can never own exercises', () => {
    expect(exerciseOwnerId({ id: 'c1', role: 'client' }, 't2')).toBeNull()
  })
})

describe('catalogTrainerForClient', () => {
  it('a trainer sees their own catalog', () => {
    expect(catalogTrainerForClient({ id: 't1', role: 'trainer' }, { trainer_id: 't1' })).toBe('t1')
  })
  it("an admin sees the client's trainer catalog", () => {
    expect(catalogTrainerForClient({ id: 'a1', role: 'admin' }, { trainer_id: 't9' })).toBe('t9')
  })
  it('an admin gets null when the client has no trainer', () => {
    expect(catalogTrainerForClient({ id: 'a1', role: 'admin' }, { trainer_id: null })).toBeNull()
    expect(catalogTrainerForClient({ id: 'a1', role: 'admin' }, null)).toBeNull()
  })
})

describe('trainerName', () => {
  const trainers = [{ id: 't1', full_name: 'Ana' }, { id: 't2', full_name: null }]
  it('resolves a name', () => expect(trainerName(trainers, 't1')).toBe('Ana'))
  it('falls back for unnamed trainers', () => expect(trainerName(trainers, 't2')).toBe('Sin nombre'))
  it('falls back for missing trainers', () => {
    expect(trainerName(trainers, null)).toBe('Sin entrenador')
    expect(trainerName(trainers, 'zzz')).toBe('Sin entrenador')
  })
})
