import { useId } from 'react'
import { Area, AreaChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '../ui/chart'

export interface ChartPoint {
  date: string
  value: number
}

/** '2026-03-07' -> '07/03' (compact axis labels). */
function shortDate(date: string): string {
  const [, m, d] = date.split('-')
  return d && m ? `${d}/${m}` : date
}

export function ProgressChart({
  data,
  unit = 'kg',
  height = 220,
  series = 'chart-1',
}: {
  data: ChartPoint[]
  unit?: string
  height?: number
  /** Which chart token to use (chart-1 .. chart-5). */
  series?: 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'
}) {
  const gradientId = useId()
  const config: ChartConfig = { value: { label: unit, color: `var(--${series})` } }
  if (data.length === 0) return <p className="text-sm text-muted-foreground">Todavía no hay datos.</p>
  return (
    <ChartContainer config={config} height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} width={44} tick={{ fontSize: 12 }} domain={['auto', 'auto']} />
        <Tooltip content={<ChartTooltipContent unit={unit} />} cursor={{ stroke: 'var(--border)' }} />
        <Area
          type="monotone"
          dataKey="value"
          stroke="var(--color-value)"
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={{ r: 3, fill: 'var(--color-value)', strokeWidth: 0 }}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ChartContainer>
  )
}
