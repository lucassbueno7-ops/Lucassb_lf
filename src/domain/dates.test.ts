import { describe, expect, it } from 'vitest'
import { toISODate } from './dates'

describe('toISODate', () => {
  it('formats using local date parts, zero padded', () => {
    expect(toISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})
