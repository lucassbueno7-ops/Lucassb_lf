import { describe, expect, it } from 'vitest'
import { parseDecimal } from './numbers'

describe('parseDecimal', () => {
  it('accepts a dot as decimal separator', () => {
    expect(parseDecimal('11.5')).toBe(11.5)
  })
  it('accepts a comma as decimal separator', () => {
    expect(parseDecimal('11,5')).toBe(11.5)
  })
  it('accepts integers and trims whitespace', () => {
    expect(parseDecimal(' 20 ')).toBe(20)
  })
  it('accepts a leading separator', () => {
    expect(parseDecimal(',5')).toBe(0.5)
  })
  it('returns null for empty or invalid input', () => {
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('   ')).toBeNull()
    expect(parseDecimal('abc')).toBeNull()
    expect(parseDecimal('1.2.3')).toBeNull()
    expect(parseDecimal('1,2,3')).toBeNull()
    expect(parseDecimal('-5')).toBeNull()
    expect(parseDecimal('1e3')).toBeNull()
  })
})
