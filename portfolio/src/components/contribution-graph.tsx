// Credit: https://www.kibo-ui.com/components/contribution-graph

import {
  createContext,
  useContext,
  useMemo,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import type { Day as WeekDay } from 'date-fns'
import {
  differenceInCalendarDays,
  eachDayOfInterval,
  formatISO,
  getDay,
  getMonth,
  getYear,
  nextDay,
  parseISO,
  subWeeks,
} from 'date-fns'
import { cn } from '@/lib/utils'

export type Activity = {
  date: string
  count: number
  level: number
}

type Week = Array<Activity | undefined>

type MonthLabel = {
  weekIndex: number
  label: string
}

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const LEVEL_FILL = cn(
  'data-[level="0"]:fill-muted-foreground/10',
  'data-[level="1"]:fill-[#033a16]',
  'data-[level="2"]:fill-[#196c2e]',
  'data-[level="3"]:fill-[#2ea043]',
  'data-[level="4"]:fill-[#56d364]',
)

type ContributionGraphContextType = {
  weeks: Week[]
  blockMargin: number
  blockRadius: number
  blockSize: number
  labelHeight: number
  maxLevel: number
  totalCount: number
  year: number
  width: number
  height: number
}

const ContributionGraphContext =
  createContext<ContributionGraphContextType | null>(null)

function useContributionGraph() {
  const context = useContext(ContributionGraphContext)
  if (!context) {
    throw new Error('ContributionGraph components must be used within ContributionGraph')
  }
  return context
}

function fillHoles(activities: Activity[]): Activity[] {
  if (activities.length === 0) return []

  const sorted = [...activities].sort((a, b) => a.date.localeCompare(b.date))
  const calendar = new Map(activities.map((a) => [a.date, a]))
  const first = sorted[0]
  const last = sorted.at(-1)
  if (!first || !last) return []

  return eachDayOfInterval({
    start: parseISO(first.date),
    end: parseISO(last.date),
  }).map((day) => {
    const date = formatISO(day, { representation: 'date' })
    return (
      calendar.get(date) ?? {
        date,
        count: 0,
        level: 0,
      }
    )
  })
}

function groupByWeeks(activities: Activity[], weekStart: WeekDay = 0): Week[] {
  if (activities.length === 0) return []

  const normalized = fillHoles(activities)
  const first = normalized[0]
  if (!first) return []

  const firstDate = parseISO(first.date)
  const firstCalendarDate =
    getDay(firstDate) === weekStart
      ? firstDate
      : subWeeks(nextDay(firstDate, weekStart), 1)

  const padded: Array<Activity | undefined> = [
    ...new Array(differenceInCalendarDays(firstDate, firstCalendarDate)).fill(
      undefined,
    ),
    ...normalized,
  ]

  const weekCount = Math.ceil(padded.length / 7)
  return Array.from({ length: weekCount }, (_, i) =>
    padded.slice(i * 7, i * 7 + 7),
  )
}

function getMonthLabels(weeks: Week[]): MonthLabel[] {
  return weeks
    .reduce<MonthLabel[]>((labels, week, weekIndex) => {
      const firstActivity = week.find((a) => a !== undefined)
      if (!firstActivity) return labels

      const month = MONTH_LABELS[getMonth(parseISO(firstActivity.date))]
      if (!month) return labels

      const prev = labels.at(-1)
      if (weekIndex === 0 || !prev || prev.label !== month) {
        return labels.concat({ weekIndex, label: month })
      }
      return labels
    }, [])
    .filter(({ weekIndex }, index, labels) => {
      const minWeeks = 3
      if (index === 0) {
        return labels[1] && labels[1].weekIndex - weekIndex >= minWeeks
      }
      if (index === labels.length - 1) {
        return weeks.slice(weekIndex).length >= minWeeks
      }
      return true
    })
}

export function ContributionGraph({
  data,
  blockMargin = 2,
  blockRadius = 2,
  blockSize = 11,
  maxLevel = 4,
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  data: Activity[]
  blockMargin?: number
  blockRadius?: number
  blockSize?: number
  maxLevel?: number
  children: ReactNode
}) {
  const weeks = useMemo(() => groupByWeeks(data), [data])
  const labelHeight = 18
  const totalCount = data.reduce((sum, a) => sum + a.count, 0)
  const year = data.length > 0 ? getYear(parseISO(data[0].date)) : new Date().getFullYear()
  const width = weeks.length * (blockSize + blockMargin) - blockMargin
  const height = labelHeight + (blockSize + blockMargin) * 7 - blockMargin

  if (data.length === 0) return null

  return (
    <ContributionGraphContext.Provider
      value={{
        weeks,
        blockMargin,
        blockRadius,
        blockSize,
        labelHeight,
        maxLevel,
        totalCount,
        year,
        width,
        height,
      }}
    >
      <div
        className={cn('flex w-max max-w-full flex-col gap-3', className)}
        {...props}
      >
        {children}
      </div>
    </ContributionGraphContext.Provider>
  )
}

export function ContributionGraphCalendar({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { weeks, width, height, blockSize, blockMargin, blockRadius, labelHeight } =
    useContributionGraph()
  const monthLabels = useMemo(() => getMonthLabels(weeks), [weeks])

  return (
    <div
      className={cn('max-w-full overflow-x-auto overflow-y-hidden', className)}
      {...props}
    >
      <svg
        className="block overflow-visible"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        role="img"
        aria-label="Contribution activity graph"
      >
        <g
          data-slot="month-labels"
          className="fill-muted-foreground text-[10px]"
        >
          {monthLabels.map(({ label, weekIndex }) => (
            <text
              key={`${label}-${weekIndex}`}
              dominantBaseline="hanging"
              x={(blockSize + blockMargin) * weekIndex}
              y={0}
            >
              {label}
            </text>
          ))}
        </g>
        {weeks.map((week, weekIndex) =>
          week.map((activity, dayIndex) => {
            if (!activity) return null
            return (
              <rect
                key={activity.date}
                className={LEVEL_FILL}
                data-level={activity.level}
                height={blockSize}
                rx={blockRadius}
                ry={blockRadius}
                width={blockSize}
                x={(blockSize + blockMargin) * weekIndex}
                y={labelHeight + (blockSize + blockMargin) * dayIndex}
              >
                <title>
                  {activity.count} contribution{activity.count === 1 ? '' : 's'}{' '}
                  on {activity.date}
                </title>
              </rect>
            )
          }),
        )}
      </svg>
    </div>
  )
}

export function ContributionGraphFooter({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] tracking-wide text-muted-foreground uppercase',
        className,
      )}
      {...props}
    />
  )
}

export function ContributionGraphTotalCount({
  children,
}: {
  children?: (props: { totalCount: number; year: number }) => ReactNode
}) {
  const { totalCount, year } = useContributionGraph()
  if (children) return <>{children({ totalCount, year })}</>
  return (
    <span>
      {totalCount} contributions · {year}
    </span>
  )
}

export function ContributionGraphLegend({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { maxLevel, blockSize, blockRadius, blockMargin } = useContributionGraph()

  return (
    <div
      className={cn('ml-auto flex items-center', className)}
      style={{ gap: blockMargin }}
      {...props}
    >
      <span className="mr-1">Less</span>
      {Array.from({ length: maxLevel + 1 }, (_, level) => (
        <svg key={level} height={blockSize} width={blockSize} aria-hidden>
          <rect
            className={LEVEL_FILL}
            data-level={level}
            height={blockSize}
            rx={blockRadius}
            ry={blockRadius}
            width={blockSize}
          />
        </svg>
      ))}
      <span className="ml-1">More</span>
    </div>
  )
}
