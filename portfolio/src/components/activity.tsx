import { useEffect, useState } from 'react'
import { site } from '@/data/site'
import { Panel, PanelContent } from '@/components/panel'
import {
  ContributionGraph,
  ContributionGraphCalendar,
  ContributionGraphFooter,
  ContributionGraphLegend,
  ContributionGraphTotalCount,
  type Activity,
} from '@/components/contribution-graph'
import { ActivityYearSelect } from '@/components/activity-year-select'

const API_URL =
  import.meta.env.VITE_GITHUB_CONTRIBUTIONS_API_URL ??
  'https://github-contributions-api.jogruber.de/v4'

type ContributionsResponse = {
  contributions?: Activity[]
  total?: Record<string, number>
}

async function fetchContributionsMeta(username: string) {
  const res = await fetch(`${API_URL}/${username}`)
  if (!res.ok) throw new Error('Failed to load contribution years')
  const data = (await res.json()) as ContributionsResponse
  const years = Object.keys(data.total ?? {})
    .map(Number)
    .filter((y) => !Number.isNaN(y))
    .sort((a, b) => b - a)
  return { years, totals: data.total ?? {} }
}

async function fetchContributionsForYear(
  username: string,
  year: number,
): Promise<Activity[]> {
  const res = await fetch(`${API_URL}/${username}?y=${year}`)
  if (!res.ok) return []
  const data = (await res.json()) as ContributionsResponse
  return data.contributions ?? []
}

export function Activity() {
  const [years, setYears] = useState<number[]>([])
  const [year, setYear] = useState<number | null>(null)
  const [contributions, setContributions] = useState<Activity[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty'>('loading')

  useEffect(() => {
    let cancelled = false
    const username = site.githubUsername
    if (!username) {
      setStatus('empty')
      return
    }

    async function loadYears() {
      try {
        const { years: available } = await fetchContributionsMeta(username)
        if (cancelled) return
        if (available.length === 0) {
          setStatus('empty')
          return
        }
        setYears(available)
        setYear(available[0] ?? null)
      } catch {
        if (!cancelled) setStatus('empty')
      }
    }

    void loadYears()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (year == null) return

    const selectedYear = year
    let cancelled = false
    const username = site.githubUsername

    async function loadYear() {
      setStatus('loading')
      setContributions([])
      try {
        const data = await fetchContributionsForYear(username, selectedYear)
        if (cancelled) return
        setContributions(data)
        setStatus(data.length > 0 ? 'ready' : 'empty')
      } catch {
        if (!cancelled) setStatus('empty')
      }
    }

    void loadYear()
    return () => {
      cancelled = true
    }
  }, [year])

  return (
    <Panel id="activity" className="screen-line-top-border">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
        <h2 className="font-mono text-sm tracking-tight text-muted-foreground">
          # activity
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {years.length > 0 && year != null && (
            <ActivityYearSelect
              years={years}
              value={year}
              onChange={setYear}
            />
          )}
          <a
            href={`https://github.com/${site.githubUsername}`}
            target="_blank"
            rel="noopener"
            className="font-mono text-sm font-medium tracking-tight text-foreground transition-colors hover:text-foreground/80"
          >
            github
          </a>
        </div>
      </div>

      <PanelContent className="pt-3">
        {status === 'loading' && (
          <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
            Loading…
          </div>
        )}

        {status === 'empty' && (
          <div className="flex h-36 items-center justify-center text-sm text-muted-foreground">
            No contributions found.
          </div>
        )}

        {status === 'ready' && (
          <ContributionGraph data={contributions} className="w-full max-w-full">
            <ContributionGraphCalendar />
            <ContributionGraphFooter>
              <ContributionGraphTotalCount>
                {({ totalCount }) => (
                  <span className="text-muted-foreground">
                    <strong className="font-semibold text-foreground tabular-nums">
                      {totalCount.toLocaleString()}
                    </strong>{' '}
                    contributions · {year}
                  </span>
                )}
              </ContributionGraphTotalCount>
              <ContributionGraphLegend />
            </ContributionGraphFooter>
          </ContributionGraph>
        )}
      </PanelContent>
    </Panel>
  )
}
