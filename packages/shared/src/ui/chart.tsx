import { createContext, useContext, type CSSProperties, type ReactElement } from 'react'
import { ResponsiveContainer } from 'recharts'
import { cn } from './utils'

/** shadcn chart pattern: series colors come from the config as `--color-<key>` CSS variables. */
export type ChartConfig = Record<string, { label?: string; color?: string }>

const ChartContext = createContext<{ config: ChartConfig } | null>(null)

function useChart() {
  const ctx = useContext(ChartContext)
  if (!ctx) throw new Error('Chart components must be used inside <ChartContainer>')
  return ctx
}

export function ChartContainer({
  config,
  className,
  children,
  height = 220,
}: {
  config: ChartConfig
  className?: string
  /** A single recharts chart element. */
  children: ReactElement
  height?: number
}) {
  const style: Record<string, string | number> = { height }
  for (const [key, value] of Object.entries(config)) {
    if (value.color) style[`--color-${key}`] = value.color
  }
  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        style={style as CSSProperties}
        className={cn(
          'w-full text-xs',
          '[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground',
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border",
          '[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border',
          '[&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden',
          className,
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

interface TooltipPayloadItem {
  dataKey?: unknown
  value?: unknown
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean
  payload?: ReadonlyArray<TooltipPayloadItem>
  label?: unknown
  unit?: string
}) {
  const { config } = useChart()
  if (!active || !payload?.length) return null
  return (
    <div className="grid min-w-32 gap-1.5 rounded-lg border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-pop">
      <p className="font-semibold">{String(label ?? '')}</p>
      {payload.map((item) => {
        const key = String(item.dataKey ?? 'value')
        const entry = config[key]
        return (
          <div key={key} className="flex items-center gap-2">
            <span aria-hidden className="size-2.5 shrink-0 rounded-sm" style={{ background: `var(--color-${key})` }} />
            <span className="text-muted-foreground">{entry?.label ?? key}</span>
            <span className="ml-auto font-mono font-semibold tabular-nums">
              {String(item.value)}
              {unit ? ` ${unit}` : ''}
            </span>
          </div>
        )
      })}
    </div>
  )
}
