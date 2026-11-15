export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese'

export function calculateBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null
  const m = heightCm / 100
  return Math.round((weightKg / (m * m)) * 10) / 10
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight'
  if (bmi < 25) return 'normal'
  if (bmi < 30) return 'overweight'
  return 'obese'
}
