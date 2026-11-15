import type { ComponentProps } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from './utils'

/**
 * shadcn "native select" pattern: the platform picker is the best UX on phones,
 * so we style the real <select> instead of using a Radix listbox.
 */
export function NativeSelect({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className="relative w-full">
      <select
        data-slot="native-select"
        className={cn(
          'h-11 w-full min-w-0 appearance-none rounded-lg border border-input bg-background/60 py-2 pr-9 pl-3 text-base text-foreground shadow-xs outline-none md:text-sm',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}
