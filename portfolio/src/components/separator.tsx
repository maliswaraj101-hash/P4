import { cn } from '@/lib/utils'

export function Separator({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'stripe-divider h-(--separator-height,2rem) w-full border-x',
        className,
      )}
    />
  )
}
