import { useState, type ReactNode, type SVGProps } from 'react'
import { differenceInMonths, parse } from 'date-fns'
import { cn } from '@/lib/utils'
import { IconTile } from '@/components/ui/icon-tile'
import { SimpleMarkdown } from '@/components/simple-markdown'
import { TechStackIcons } from '@/components/tech-stack-icons'
import type { ExperiencePosition } from '@/data/experience'

export function ExperiencePositionItem({
  position,
}: {
  position: ExperiencePosition
}) {
  const { start, end } = position.employmentPeriod
  const isOngoing = !end
  const duration = formatDuration(start, end)
  const [open, setOpen] = useState(Boolean(position.isExpanded))
  const canToggle = Boolean(position.description)

  return (
    <div className="group/experience-position relative">
      <div className="pointer-events-none absolute bottom-0 left-3 hidden size-4 bg-background group-last/experience-position:flex">
        <span className="size-full -translate-y-2.25 rounded-bl-sm border-b border-l" />
      </div>

      <button
        type="button"
        disabled={!canToggle}
        aria-expanded={canToggle ? open : undefined}
        onClick={() => {
          if (canToggle) setOpen((v) => !v)
        }}
        className={cn(
          'group block w-full text-left',
          'relative before:absolute before:-top-1 before:-right-1 before:-bottom-1.5 before:left-7 before:-z-1 before:rounded-lg before:transition-[background-color] before:ease-out hover:before:bg-muted/60',
          'outline-none focus-visible:before:inset-ring-2 focus-visible:before:inset-ring-ring/50',
          'disabled:before:content-none',
        )}
      >
        <div className="relative z-1 mb-1 flex items-start gap-3 text-base">
          <IconTile>
            <PositionIcon name={position.icon} />
          </IconTile>

          <h4 className="flex-1 font-medium text-balance">{position.title}</h4>

          {canToggle && (
            <div className="shrink-0 text-muted-foreground">
              <ChevronsUpDownIcon
                className={cn(
                  'size-4 transition-transform duration-150',
                  open && 'rotate-180',
                )}
              />
            </div>
          )}
        </div>

        <dl className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-9 text-sm text-muted-foreground">
          {position.employmentType && (
            <>
              <div>
                <dt className="sr-only">Employment Type</dt>
                <dd>{position.employmentType}</dd>
              </div>
              <span className="h-4 w-px bg-border" aria-hidden />
            </>
          )}

          <div>
            <dt className="sr-only">Employment Period</dt>
            <dd className="flex items-center gap-0.5 tabular-nums">
              <span>{start}</span>
              <span className="font-mono">—</span>
              {isOngoing ? (
                <span>Present</span>
              ) : (
                <span>{end}</span>
              )}
            </dd>
          </div>

          {duration && (
            <>
              <span className="h-4 w-px bg-border" aria-hidden />
              <div>
                <dt className="sr-only">Duration</dt>
                <dd className="tabular-nums">{duration}</dd>
              </div>
            </>
          )}
        </dl>
      </button>

      {canToggle && open && position.description && (
        <div className="pt-3 pb-1 pl-9">
          <SimpleMarkdown content={position.description} />
        </div>
      )}

      {Array.isArray(position.skills) && position.skills.length > 0 && (
        <TechStackIcons skills={position.skills} className="pt-3 pl-9" />
      )}
    </div>
  )
}

function PositionIcon({
  name,
}: {
  name?: ExperiencePosition['icon']
}): ReactNode {
  switch (name) {
    case 'lightbulb':
      return <LightbulbIcon />
    case 'briefcase':
      return <BriefcaseIcon />
    case 'code':
    default:
      return <CodeIcon />
  }
}

function formatDuration(start: string, end?: string): string {
  const startHasMonth = start.includes('.')
  const endHasMonth = end ? end.includes('.') : true

  if (!startHasMonth && end && !endHasMonth) {
    const years = parseInt(end, 10) - parseInt(start, 10)
    if (years <= 0) return ''
    return `${years}y`
  }

  const startDate = parsePeriodDate(start, 'first')
  const endDate = end ? parsePeriodDate(end, 'last') : new Date()
  const totalMonths = differenceInMonths(endDate, startDate) + 1
  if (totalMonths <= 0) return ''
  if (totalMonths < 12) return `${totalMonths}m`

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  if (months === 0) return `${years}y`
  return `${years}y ${months}m`
}

function parsePeriodDate(str: string, fallbackMonth: 'first' | 'last'): Date {
  if (str.includes('.')) {
    return parse(str, 'MM.yyyy', new Date())
  }
  return parse(
    `${fallbackMonth === 'last' ? '12' : '01'}.${str}`,
    'MM.yyyy',
    new Date(),
  )
}

function CodeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="m16 18 6-6-6-6" />
      <path d="m8 6-6 6 6 6" />
    </svg>
  )
}

function BriefcaseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      <rect width="20" height="14" x="2" y="6" rx="2" />
      <path d="M12 12v.01" />
    </svg>
  )
}

function LightbulbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  )
}

function ChevronsUpDownIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d="m7 15 5 5 5-5" />
      <path d="m7 9 5-5 5 5" />
    </svg>
  )
}
