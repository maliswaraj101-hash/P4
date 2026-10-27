import type { ReactNode } from 'react'
import { site } from '@/data/site'
import { Panel, PanelContent } from '@/components/panel'
import { cn } from '@/lib/utils'

function Strong({ children }: { children: ReactNode }) {
  return <strong className="font-medium text-foreground">{children}</strong>
}

export function About() {
  return (
    <Panel id="about" className="relative screen-line-bottom-none">
      <h2 className="sr-only">About</h2>
      <PanelContent className="space-y-4 text-base leading-relaxed text-muted-foreground sm:text-[1.05rem]">
        <p className="text-xl text-foreground sm:text-2xl">
          I&apos;m an <Strong>AI Engineer</Strong> who likes shipping systems,
          not just demos.
        </p>

        <p>
          I build <Strong>agentic workflows</Strong>,{' '}
          <Strong>RAG pipelines</Strong>, and real-time voice/avatar products —
          from retrieval and orchestration through to the UI people actually
          talk to. Lately that&apos;s meant LangGraph agents, hybrid search, and
          low-latency voice stacks.
        </p>

        <p>
          I write about ML & system design on{' '}
          <a
            href={site.mediumUrl}
            target="_blank"
            rel="noopener"
            className={cn(
              'font-medium text-foreground underline decoration-current/30 decoration-1 underline-offset-3',
              'transition-colors hover:decoration-current',
            )}
          >
            Medium
          </a>
          , and ship side projects on{' '}
          <a
            href="https://github.com/Swaraj07082"
            target="_blank"
            rel="noopener"
            className={cn(
              'font-medium text-foreground underline decoration-current/30 decoration-1 underline-offset-3',
              'transition-colors hover:decoration-current',
            )}
          >
            GitHub
          </a>
          .
        </p>

        <p>
          Mostly in <Strong>Python</Strong>, <Strong>TypeScript</Strong>,{' '}
          <Strong>Next.js</Strong>, and <Strong>PostgreSQL</Strong>.
        </p>

        <p>
          Want to work together?{' '}
          <a
            href={site.hireHref}
            className={cn(
              'font-medium text-foreground underline decoration-current/30 decoration-1 underline-offset-3',
              'transition-colors hover:decoration-current',
            )}
          >
            Let&apos;s talk
          </a>
          . Based in {site.location}.
        </p>
      </PanelContent>
    </Panel>
  )
}
