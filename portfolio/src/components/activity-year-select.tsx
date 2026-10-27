import { cn } from '@/lib/utils'

export function ActivityYearSelect({
  years,
  value,
  onChange,
}: {
  years: number[]
  value: number
  onChange: (year: number) => void
}) {
  return (
    <div
      role="tablist"
      aria-label="Contribution year"
      className="flex items-center gap-1.5 font-mono text-sm tracking-tight text-muted-foreground"
    >
      {years.map((year, index) => (
        <span key={year} className="contents">
          {index > 0 && <span aria-hidden>/</span>}
          <button
            type="button"
            role="tab"
            aria-selected={year === value}
            onClick={() => onChange(year)}
            className={cn(
              'transition-colors',
              year === value
                ? 'font-medium text-foreground'
                : 'hover:text-foreground/80',
            )}
          >
            {year}
          </button>
        </span>
      ))}
    </div>
  )
}
