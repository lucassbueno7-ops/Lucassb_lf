import { describe, expect, it } from 'vitest'
import { sortByPosition, nextPosition } from './sorting'

describe('sortByPosition', () => {
  it('sorts ascending without mutating the input', () => {
    const input = [{ position: 2 }, { position: 0 }, { position: 1 }]
    const out = sortByPosition(input)
    expect(out.map((i) => i.position)).toEqual([0, 1, 2])
    expect(input[0].position).toBe(2)
  })
})

describe('nextPosition', () => {
  it('returns 0 for an empty list', () => {
    expect(nextPosition([])).toBe(0)
  })
  it('returns max + 1', () => {
    expect(nextPosition([{ position: 0 }, { position: 4 }, { position: 2 }])).toBe(5)
  })
})
