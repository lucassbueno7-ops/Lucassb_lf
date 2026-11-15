import { describe, expect, it } from 'vitest'
import { calculateBmi, bmiCategory } from './bmi'

describe('calculateBmi', () => {
  it('computes BMI from kg and cm, rounded to 1 decimal', () => {
    expect(calculateBmi(70, 175)).toBe(22.9)
  })
  it('returns null when data is missing or invalid', () => {
    expect(calculateBmi(null, 175)).toBeNull()
    expect(calculateBmi(70, null)).toBeNull()
    expect(calculateBmi(70, 0)).toBeNull()
    expect(calculateBmi(0, 175)).toBeNull()
  })
})

describe('bmiCategory', () => {
  it.each([
    [17, 'underweight'],
    [22, 'normal'],
    [27, 'overweight'],
    [32, 'obese'],
  ])('classifies %s as %s', (bmi, cat) => {
    expect(bmiCategory(bmi)).toBe(cat)
  })
})
