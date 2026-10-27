import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  getArticleBySlug,
  type ArticleBlock,
  type ArticleSection,
} from '@/data/articles'
import { cn } from '@/lib/utils'

export function ArticlePage() {
  const { slug } = useParams()
  const article = slug ? getArticleBySlug(slug) : undefined
  const tocSections = article?.sections.filter((s) => s.title) ?? []
  const [activeId, setActiveId] = useState(
    tocSections[0]?.id ?? article?.sections[0]?.id ?? '',
  )

  useEffect(() => {
    if (!article) return
    document.title = `${article.title} · Swaraj`

    const headings = article.sections
      .map((s) => document.getElementById(s.id))
      .filter(Boolean) as HTMLElement[]

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: [0, 0.25, 0.5, 1] },
    )

    headings.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [article])

  if (!article) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20">
        <p className="text-muted-foreground">Post not found.</p>
        <Link to="/#articles" className="mt-4 inline-block text-sm hover:underline">
          ← Back to all posts
        </Link>
      </div>
    )
  }

  return (
    <div className="group/layout relative isolate min-h-svh bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/#articles"
          className="inline-flex text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          ← Back to all posts
        </Link>

        <div
          className={cn(
            'mt-10 grid gap-12',
            tocSections.length > 0 && 'lg:grid-cols-[minmax(0,1fr)_220px]',
          )}
        >
          <article className="min-w-0">
            <header className="space-y-4 border-b border-line pb-8">
              <h1 className="text-3xl font-medium tracking-tight text-balance sm:text-4xl">
                {article.title}
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                {article.summary}
              </p>
              <p className="font-mono text-xs tracking-tight text-muted-foreground">
                {article.dateLabel} · {article.readingTime}
              </p>
              <a
                href={article.mediumHref}
                target="_blank"
                rel="noopener"
                className="inline-flex text-sm text-muted-foreground underline decoration-current/30 underline-offset-3 transition-colors hover:text-foreground hover:decoration-current"
              >
                Also on Medium →
              </a>
            </header>

            <div className="prose-article mt-10 space-y-10">
              {article.sections.map((section) => (
                <SectionBlock key={section.id} section={section} />
              ))}
            </div>
          </article>

          {tocSections.length > 0 && (
            <aside className="hidden lg:block">
              <ArticleToc
                sections={tocSections}
                activeId={activeId}
                onSelect={setActiveId}
              />
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}

function ArticleToc({
  sections,
  activeId,
  onSelect,
}: {
  sections: ArticleSection[]
  activeId: string
  onSelect: (id: string) => void
}) {
  const listRef = useRef<HTMLUListElement>(null)
  const itemRefs = useRef<Array<HTMLLIElement | null>>([])
  const [hook, setHook] = useState({ midY: 12, height: 24 })

  useLayoutEffect(() => {
    function measure() {
      const list = listRef.current
      const idx = Math.max(
        0,
        sections.findIndex((s) => s.id === activeId),
      )
      const item = itemRefs.current[idx]
      if (!list || !item) return

      const listTop = list.getBoundingClientRect().top
      const rect = item.getBoundingClientRect()
      const midY = rect.top - listTop + rect.height / 2
      setHook({ midY, height: Math.max(midY + 8, 24) })
    }

    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [activeId, sections])

  return (
    <nav aria-label="On this page" className="sticky top-24 space-y-4">
      <p className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
        On this page
      </p>

      <div className="relative">
        <svg
          aria-hidden
          className="pointer-events-none absolute top-0 left-0 z-0 overflow-visible text-foreground"
          width="14"
          height={hook.height}
        >
          <path
            d={`M 1 0 L 1 ${Math.max(hook.midY - 8, 0)} Q 1 ${hook.midY} 10 ${hook.midY}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeDasharray="2.5 3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <ul ref={listRef} className="relative z-10 space-y-0.5">
          {sections.map((section, index) => {
            const active = section.id === activeId
            return (
              <li
                key={section.id}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
              >
                <a
                  href={`#${section.id}`}
                  onClick={() => onSelect(section.id)}
                  className={cn(
                    'block py-2 pl-5 text-[13px] leading-snug transition-colors',
                    section.level === 3 && 'pl-7 text-xs',
                    active
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground/70 hover:text-muted-foreground',
                  )}
                >
                  {section.title}
                </a>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

function SectionBlock({ section }: { section: ArticleSection }) {
  const Heading = section.level === 3 ? 'h3' : 'h2'
  return (
    <section id={section.id} className="scroll-mt-24 space-y-4">
      {section.title ? (
        <Heading
          className={cn(
            'font-medium tracking-tight text-balance',
            section.level === 2 ? 'text-xl sm:text-2xl' : 'text-lg',
          )}
        >
          {section.title}
        </Heading>
      ) : null}
      <div className="space-y-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base [&_code]:rounded [&_code]:border [&_code]:bg-muted/50 [&_code]:px-1 [&_code]:py-px [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-foreground [&_em]:italic [&_strong]:font-medium [&_strong]:text-foreground">
        {section.blocks.map((block, i) => (
          <ContentBlock key={i} block={block} />
        ))}
      </div>
    </section>
  )
}

function ContentBlock({ block }: { block: ArticleBlock }) {
  switch (block.type) {
    case 'img':
      return (
        <figure className="my-2 overflow-hidden rounded-sm border border-line/60 bg-white">
          <img
            src={block.src}
            alt={block.alt ?? ''}
            className="mx-auto h-auto w-full max-w-2xl object-contain"
            loading="lazy"
          />
        </figure>
      )
    case 'quote':
      return (
        <blockquote className="border-l border-line pl-4 italic">
          {inline(block.text)}
        </blockquote>
      )
    case 'ol':
      return (
        <ol className="list-decimal space-y-2 ps-5">
          {block.items.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ol>
      )
    case 'ul':
      return (
        <ul className="list-disc space-y-2 ps-5">
          {block.items.map((item, i) => (
            <li key={i}>{inline(item)}</li>
          ))}
        </ul>
      )
    case 'p':
    default:
      return <p>{inline(block.text)}</p>
  }
}

function inline(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const re =
    /(\[([^\]]+)\]\(([^)]+)\)|`([^`]+)`|\*\*([^*]+)\*\*|_([^_]+)_)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    if (match[2] && match[3]) {
      parts.push(
        <a
          key={key++}
          href={match[3]}
          target="_blank"
          rel="noopener"
          className="font-medium text-foreground underline decoration-current/30 underline-offset-3 hover:decoration-current"
        >
          {match[2]}
        </a>,
      )
    } else if (match[4]) {
      parts.push(<code key={key++}>{match[4]}</code>)
    } else if (match[5]) {
      parts.push(<strong key={key++}>{inline(match[5])}</strong>)
    } else if (match[6]) {
      parts.push(<em key={key++}>{match[6]}</em>)
    }
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts
}
