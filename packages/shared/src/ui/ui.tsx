import { useId, type ComponentProps, type ReactNode } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Input } from './input'
import { Label } from './label'
import { NativeSelect } from './native-select'
import { cn } from './utils'

/** Labelled text input (label + control + optional hint wired with ids). */
export function TextField({
  label,
  hint,
  className,
  id,
  ...props
}: ComponentProps<'input'> & { label: string; hint?: string }) {
  const auto = useId()
  const inputId = id ?? auto
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <Input id={inputId} aria-describedby={hint ? `${inputId}-hint` : undefined} className={className} {...props} />
      {hint && (
        <p id={`${inputId}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  )
}

/** Labelled native select. */
export function SelectField({
  label,
  children,
  className,
  id,
  ...props
}: ComponentProps<'select'> & { label: string; children: ReactNode }) {
  const auto = useId()
  const selectId = id ?? auto
  return (
    <div className="grid min-w-0 gap-1.5">
      <Label htmlFor={selectId}>{label}</Label>
      <NativeSelect id={selectId} className={className} {...props}>
        {children}
      </NativeSelect>
    </div>
  )
}

/** Card with a title row (title, optional description and right-side action). */
export function Section({
  title,
  description,
  action,
  children,
  className,
  tone = 'default',
}: {
  title?: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  tone?: 'default' | 'warning'
}) {
  return (
    <Card className={cn(tone === 'warning' && 'border-warning-border bg-warning-muted', className)}>
      {(title || action) && (
        <CardHeader>
          <div className="min-w-0">
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}

export function ErrorMessage({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-danger-muted px-3 py-2 text-sm text-danger-foreground">
      <AlertCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
      <span>{message}</span>
    </p>
  )
}

export function SuccessMessage({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <p role="status" className="rounded-lg bg-success-muted px-3 py-2 text-sm text-success-foreground">
      {message}
    </p>
  )
}

export function Spinner({ label = 'Cargando...' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 p-8 text-sm text-muted-foreground">
      <Loader2 aria-hidden className="size-4 animate-spin text-link" />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center', className)}>
      {icon && <div className="mb-1 grid size-12 place-items-center rounded-full bg-primary/15 text-link [&_svg]:size-6">{icon}</div>}
      <p className="text-base font-semibold">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
  back,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
  /** Optional element rendered above the title, e.g. a "Volver" link. */
  back?: ReactNode
}) {
  return (
    <div className="space-y-2">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-title font-bold tracking-tight break-words sm:text-display">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  tone = 'default',
}: {
  label: string
  value: ReactNode
  hint?: string
  icon?: ReactNode
  tone?: 'default' | 'warning'
}) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-1 rounded-xl border bg-card p-4 shadow-card',
        tone === 'warning' && 'border-warning-border bg-warning-muted',
      )}
    >
      <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span>{label}</span>
        {icon && <span className="text-link [&_svg]:size-4">{icon}</span>}
      </div>
      <div className="text-xl font-bold tracking-tight sm:text-2xl">{value}</div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Logo (public/icon.svg) + app name. */
export function BrandMark({ name = 'Lucas Bueno', className }: { name?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 font-bold tracking-tight', className)}>
      <img src="/icon.svg" alt="" width={32} height={32} className="size-8 rounded-lg" />
      <span>{name}</span>
    </span>
  )
}
