import { site } from '@/data/site'
import { HandwrittenArrow, HandwrittenNote } from '@/components/handwritten-note'
import { Panel, PanelContent } from '@/components/panel'
import { SocialIcon } from '@/components/social-icons'
import { cn } from '@/lib/utils'

const socialButtonClassName = cn(
  'inline-flex size-8 shrink-0 items-center justify-center rounded-[min(var(--radius-lg),10px)] border border-border bg-background text-foreground/80 shadow-none transition-all outline-none select-none',
  'hover:bg-muted hover:text-foreground active:scale-[0.98]',
  'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
  'dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
  "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4.5",
)

export function SocialLinks() {
  return (
    <Panel id="contact" className="relative screen-line-bottom-line">
      <h2 className="sr-only">Social links</h2>
      <PanelContent>
        <ul className="flex flex-wrap gap-2">
          {site.social.map((item) => {
            const external = !item.href.startsWith('mailto:')
            return (
              <li key={item.name}>
                <a
                  href={item.href}
                  title={`${item.title} (${item.handle})`}
                  aria-label={`${item.title} (${item.handle})`}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener' : undefined}
                  className={socialButtonClassName}
                >
                  <SocialIcon name={item.name} />
                  <span className="sr-only">{item.title}</span>
                </a>
              </li>
            )
          })}
        </ul>
      </PanelContent>

      <HandwrittenNote className="-top-4 right-full mr-4 hidden w-20 flex-col items-end lg:flex">
        <span className="-rotate-6">follow me</span>
        <HandwrittenArrow className="size-7 translate-x-3 -scale-x-100 -rotate-6" />
      </HandwrittenNote>
    </Panel>
  )
}
