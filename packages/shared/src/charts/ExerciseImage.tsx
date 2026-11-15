import { cn } from '../ui/utils'

/** Presentational: exercise photo (renders nothing when the exercise has no image). */
export function ExerciseImage({ url, alt, className = 'h-40 w-full' }: { url: string | null | undefined; alt: string; className?: string }) {
  if (!url) return null
  return <img src={url} alt={alt} loading="lazy" className={cn('rounded-lg bg-muted object-cover', className)} />
}
