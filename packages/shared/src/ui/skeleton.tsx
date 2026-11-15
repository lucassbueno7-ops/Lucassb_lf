import type { ComponentProps } from 'react'
import { cn } from './utils'

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div data-slot="skeleton" aria-hidden className={cn('animate-pulse rounded-lg bg-muted', className)} {...props} />
}
