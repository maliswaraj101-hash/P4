import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { articles, mediumProfileUrl, type Article } from '@/data/articles'
import { Panel, PanelContent, PanelHeader } from '@/components/panel'
import { cn } from '@/lib/utils'

export function Articles() {
  return (
    <Panel id="articles">
      <PanelHeader className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
        <h2 className="text-2xl font-medium tracking-tight text-foreground">
          articles.
        </h2>
        <a
          href={mediumProfileUrl}
          target="_blank"
          rel="noopener"
          className="font-mono text-xs tracking-tight text-muted-foreground transition-colors hover:text-foreground"
        >
          @swarajmali31 →
        </a>
      </PanelHeader>

      <PanelContent className="p-0">
        <ul>
          {articles.map((article) => (
            <li key={article.id} className="px-2 py-1">
              <ArticleListItem article={article} />
            </li>
          ))}
        </ul>
      </PanelContent>
    </Panel>
  )
}

function ArticleListItem({ article }: { article: Article }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div
      ref={rootRef}
      className={cn(
        'group relative space-y-3 rounded-xl px-3 py-5 transition-colors duration-200 ease-out sm:px-4',
        'hover:bg-muted/80',
        open && 'bg-muted/80',
      )}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
          className="text-left text-base font-medium tracking-tight text-balance text-foreground transition-colors hover:underline hover:decoration-current/30 hover:underline-offset-3"
        >
          {article.title}
        </button>
        <time
          dateTime={article.date}
          className="shrink-0 font-mono text-xs tracking-tight text-muted-foreground tabular-nums"
        >
          {article.date}
        </time>
      </div>

      <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {article.summary}
      </p>

      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center text-sm text-muted-foreground transition-colors group-hover:text-foreground"
      >
        Read more →
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'absolute top-[4.5rem] left-4 z-30 w-56 overflow-hidden rounded-lg border border-border bg-background p-1 shadow-xl ring-1 ring-foreground/10',
          )}
        >
          <p className="px-2.5 py-1.5 font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
            Open article
          </p>
          <Link
            role="menuitem"
            to={`/articles/${article.slug}`}
            onClick={() => setOpen(false)}
            className="flex w-full items-center rounded-md px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            Read on portfolio
          </Link>
          <a
            role="menuitem"
            href={article.mediumHref}
            target="_blank"
            rel="noopener"
            onClick={() => setOpen(false)}
            className="flex w-full items-center rounded-md px-2.5 py-2 text-sm text-foreground transition-colors hover:bg-muted"
          >
            Open on Medium
          </a>
        </div>
      )}
    </div>
  )
}
