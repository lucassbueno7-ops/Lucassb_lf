import { describe, expect, it } from 'vitest'
import { attendanceBadge, displayPersonName, filterClientsByName, isStaff, isTrainee, landingPathForRole, mergeById, resolveAppMode } from './roles'

describe('isStaff', () => {
  it('is true for trainers and admins only', () => {
    expect(isStaff('trainer')).toBe(true)
    expect(isStaff('admin')).toBe(true)
    expect(isStaff('client')).toBe(false)
    expect(isStaff(undefined)).toBe(false)
  })
})

describe('landingPathForRole', () => {
  it('sends staff to the chooser and clients straight in', () => {
    expect(landingPathForRole('trainer')).toBe('/choose')
    expect(landingPathForRole('admin')).toBe('/choose')
    expect(landingPathForRole('client')).toBe('/')
  })
})

describe('filterClientsByName', () => {
  const clients = [
    { id: '1', full_name: 'Martín Pérez' },
    { id: '2', full_name: 'Ana Gómez' },
    { id: '3', full_name: null },
  ]

  it('returns everything for an empty query', () => {
    expect(filterClientsByName(clients, '  ')).toHaveLength(3)
  })

  it('ignores case and accents', () => {
    expect(filterClientsByName(clients, 'martin').map((c) => c.id)).toEqual(['1'])
    expect(filterClientsByName(clients, 'GOMEZ').map((c) => c.id)).toEqual(['2'])
  })

  it('never matches clients without a name unless the query is empty', () => {
    expect(filterClientsByName(clients, 'sin').map((c) => c.id)).toEqual([])
  })
})

describe('attendanceBadge', () => {
  const base = { daysSince: 1, needsAttention: false }
  it('flags clients needing attention', () => {
    expect(attendanceBadge({ ...base, daysSince: 5, needsAttention: true })).toBe('attention')
  })
  it('marks clients that never trained', () => {
    expect(attendanceBadge({ daysSince: null, needsAttention: false })).toBe('none')
  })
  it('marks the rest as on track', () => {
    expect(attendanceBadge(base)).toBe('ok')
  })
})

describe('isTrainee', () => {
  it('is based on trainer_id, whatever the role', () => {
    expect(isTrainee({ trainer_id: 'abc' })).toBe(true)
    expect(isTrainee({ trainer_id: null })).toBe(false)
    expect(isTrainee(null)).toBe(false)
    expect(isTrainee(undefined)).toBe(false)
  })
})

describe('resolveAppMode', () => {
  it('always uses the own routine for clients', () => {
    expect(resolveAppMode({ role: 'client', trainer_id: 't' }, 'preview')).toBe('self')
  })
  it('previews only for staff without a routine of their own', () => {
    expect(resolveAppMode({ role: 'trainer', trainer_id: null }, null)).toBe('preview')
    expect(resolveAppMode({ role: 'admin', trainer_id: null }, 'self')).toBe('preview')
  })
  it('asks trainee staff until they pick, then honours the stored mode', () => {
    expect(resolveAppMode({ role: 'admin', trainer_id: 't' }, null)).toBe('choose')
    expect(resolveAppMode({ role: 'trainer', trainer_id: 't' }, 'self')).toBe('self')
    expect(resolveAppMode({ role: 'trainer', trainer_id: 't' }, 'preview')).toBe('preview')
  })
})

describe('displayPersonName', () => {
  it('labels the viewer as Vos', () => {
    expect(displayPersonName({ id: 'a', full_name: 'Lucas' }, 'a')).toBe('Vos')
  })
  it('uses the name or a fallback for others', () => {
    expect(displayPersonName({ id: 'b', full_name: 'Ana' }, 'a')).toBe('Ana')
    expect(displayPersonName({ id: 'b', full_name: ' ' }, 'a')).toBe('Sin nombre')
  })
})

describe('mergeById', () => {
  it('dedupes keeping the first occurrence and order', () => {
    const out = mergeById([{ id: '1', n: 'a' }, { id: '2', n: 'b' }], [{ id: '2', n: 'x' }, { id: '3', n: 'c' }])
    expect(out.map((x) => x.id)).toEqual(['1', '2', '3'])
    expect(out[1].n).toBe('b')
  })
})
