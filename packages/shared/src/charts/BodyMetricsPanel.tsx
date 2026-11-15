import { bmiCategory, calculateBmi } from '../domain/bmi'
import type { BodyMetric } from '../domain/types'
import { ProgressChart } from './ProgressChart'
import { Badge } from '../ui/badge'
import { Section, StatTile } from '../ui/ui'

const CATEGORY_LABEL = {
  underweight: 'Bajo peso',
  normal: 'Peso normal',
  overweight: 'Sobrepeso',
  obese: 'Obesidad',
} as const

/** Presentational: latest weight / BMI tiles and the weight history chart. */
export function BodyMetricsPanel({ metrics, heightCm }: { metrics: BodyMetric[]; heightCm: number | null }) {
  const latest = metrics[metrics.length - 1]
  const bmi = calculateBmi(latest?.weight_kg ?? null, heightCm)

  return (
    <div className="space-y-4">
      {latest && (
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Último peso" value={`${latest.weight_kg} kg`} hint={latest.measured_at} />
          <StatTile
            label="IMC"
            value={bmi ?? '-'}
            hint={bmi !== null ? CATEGORY_LABEL[bmiCategory(bmi)] : 'Cargá la altura para calcularlo'}
          />
        </div>
      )}
      <Section title="Peso corporal" action={metrics.length > 0 ? <Badge variant="outline">{metrics.length} registros</Badge> : undefined}>
        <ProgressChart data={metrics.map((m) => ({ date: m.measured_at, value: Number(m.weight_kg) }))} />
      </Section>
    </div>
  )
}
