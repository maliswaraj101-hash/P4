import { useEffect, useState } from 'react'
import { useMotionValueEvent, useScroll } from 'motion/react'
import { cn } from '@/lib/utils'

/** Adapted from chanhdai scroll-to-top (MIT). */
export function ScrollToTop({ className }: { className?: string }) {
  const { scrollY } = useScroll()
  const [visible, setVisible] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('down')

  useEffect(() => {
    setVisible(window.scrollY > 80)
  }, [])

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrollDirection(latest - prev > 0 ? 'down' : 'up')
    setVisible(latest > 80)
  })

  return (
    <button
      type="button"
      data-visible={visible}
      data-scroll-direction={scrollDirection}
      aria-label="Scroll to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn(
        /* Clear mobile bottom nav (~3.25rem) — same idea as chanhdai.com */
        '[--bottom:3.75rem] sm:[--bottom:1rem] lg:[--bottom:2rem]',
        'fixed right-4 bottom-[calc(var(--bottom,0.5rem)+env(safe-area-inset-bottom,0))] z-50 size-8 lg:right-8',
        'inline-flex items-center justify-center rounded-md bg-muted text-muted-foreground',
        'shadow-[inset_0_0_0_1px] shadow-foreground/20',
        'transition-[background-color,opacity,visibility,color] duration-300',
        'hover:bg-muted/80 hover:text-foreground',
        'data-[scroll-direction=down]:opacity-30 data-[scroll-direction=up]:opacity-100',
        'data-[scroll-direction=down]:hover:opacity-100',
        'data-[visible=false]:invisible data-[visible=false]:opacity-0',
        className,
      )}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 19V5M5 12l7-7 7 7"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
