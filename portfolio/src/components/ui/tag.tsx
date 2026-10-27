import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Tag({ className, ...props }: ComponentProps<'span'>) {
  return (
    <span
      data-slot="tag"
      className={cn(
        'inline-flex items-center rounded-full border bg-zinc-50 px-1.5 py-0.5 font-mono text-xs text-muted-foreground dark:bg-zinc-900',
        className,
      )}
      {...props}
    />
  )
}
