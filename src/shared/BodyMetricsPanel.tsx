import { bmiCategory, calculateBmi } from '../domain/bmi'
import type { BodyMetric } from '../domain/types'
import { ProgressChart } from './ProgressChart'
import { Card } from './ui'

const CATEGORY_LABEL = {
  underweight: 'Bajo peso',
  normal: 'Peso normal',
  overweight: 'Sobrepeso',
  obese: 'Obesidad',
} as const

/** Presentational: weight history chart, latest weight and BMI. */
export function BodyMetricsPanel({ metrics, heightCm }: { metrics: BodyMetric[]; heightCm: number | null }) {
  const latest = metrics[metrics.length - 1]
  const bmi = calculateBmi(latest?.weight_kg ?? null, heightCm)

  return (
    <Card title="Peso corporal">
      <ProgressChart data={metrics.map((m) => ({ date: m.measured_at, value: Number(m.weight_kg) }))} />
      {latest && (
        <p className="mt-2 text-sm text-slate-600">
          Último registro: {latest.weight_kg} kg ({latest.measured_at})
          {bmi !== null && ` - IMC ${bmi} (${CATEGORY_LABEL[bmiCategory(bmi)]})`}
        </p>
      )}
    </Card>
  )
}
