import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

export interface ChartPoint {
  date: string
  value: number
}

export function ProgressChart({
  data,
  unit = 'kg',
  height = 200,
  color = '#0f766e',
}: {
  data: ChartPoint[]
  unit?: string
  height?: number
  color?: string
}) {
  if (data.length === 0) return <p className="text-sm text-slate-500">Todavía no hay datos.</p>
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
          <Tooltip formatter={(v) => `${v} ${unit}`} />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
