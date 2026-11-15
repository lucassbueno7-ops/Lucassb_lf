import type { ReactNode } from 'react'
import { BrandMark } from '../ui/ui'
import { cn } from '../ui/utils'

/** Full-screen centered layout (logo + card) for login, chooser and notices. */
export function AuthShell({
  title,
  subtitle,
  children,
  wide = false,
  appName = 'Lucas Bueno',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  wide?: boolean
  appName?: string
}) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(ellipse_at_top,var(--glow),transparent_70%)] opacity-60"
      />
      <div className={cn('relative w-full space-y-6', wide ? 'max-w-2xl' : 'max-w-sm')}>
        <div className="flex justify-center">
          <BrandMark name={appName} className="text-lg" />
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-card sm:p-8">
          <div className="mb-6 space-y-1.5 text-center">
            <h1 className="text-title font-bold tracking-tight sm:text-display">{title}</h1>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
