import { useEffect, useState } from 'react'
import { site } from '@/data/site'
import { SocialIcon } from '@/components/social-icons'
import { cn } from '@/lib/utils'

function ordinal(n: number) {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  switch (n % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}

function useLocalTime() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const format = () =>
      new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(new Date())

    setTime(format())
    const id = window.setInterval(() => setTime(format()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return time
}

function useVisitorLabel() {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Count once per browser session; otherwise just read the shared total.
      const sessionKey = 'sm-visit-hit'
      const shouldHit = !sessionStorage.getItem(sessionKey)
      if (shouldHit) sessionStorage.setItem(sessionKey, '1')

      try {
        const res = await fetch(`/api/visits${shouldHit ? '?hit=1' : ''}`, {
          cache: 'no-store',
        })
        if (!res.ok) return
        const data = (await res.json()) as { count?: number }
        if (
          !cancelled &&
          typeof data.count === 'number' &&
          Number.isFinite(data.count) &&
          data.count > 0
        ) {
          setLabel(`${ordinal(data.count)} visitor`)
        }
      } catch {
        // Keep footer quiet if the counter is down — never show a fake local count.
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return label
}

export function ConnectFooter() {
  const time = useLocalTime()
  const visitor = useVisitorLabel()

  return (
    <footer className="relative z-10 w-full pt-8 pb-20 sm:pt-10 sm:pb-12">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col items-start">
          <span className="mb-3 font-mono text-[11px] tracking-[0.16em] text-muted-foreground uppercase select-none">
            Connect
          </span>
          <div className="flex flex-wrap items-center gap-3.5">
            {site.social.map((item) => {
              const external = !item.href.startsWith('mailto:')
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener' : undefined}
                  aria-label={item.title}
                  title={`${item.title} (${item.handle})`}
                  className="text-foreground/80 transition-opacity hover:opacity-80"
                >
                  <SocialIcon name={item.name} className="size-[18px]" />
                </a>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col items-start gap-1 font-mono text-sm text-foreground sm:items-end">
          <p className="text-muted-foreground">
            {site.location}
            {time ? ` · ${time}` : null}
          </p>
          {visitor ? <p>{visitor}</p> : null}
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs text-muted-foreground">
          Designed & developed by{' '}
          <span className="text-foreground">{site.name}</span>
          {' · '}©{new Date().getFullYear()}
        </p>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className={cn(
            'inline-flex w-fit items-center rounded-full border border-border bg-muted/40 px-3 py-1.5',
            'font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          )}
        >
          Back to top ↑
        </button>
      </div>
    </footer>
  )
}
