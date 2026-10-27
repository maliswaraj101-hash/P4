import { useEffect, useId, useState } from 'react'
import { site } from '@/data/site'
import { cn } from '@/lib/utils'

/** Mobile-only bottom nav — same idea as chanhdai.com (MIT). */
export function SiteBottomNav() {
  const [open, setOpen] = useState(false)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div
      className={cn(
        'fixed bottom-[calc(0.5rem+env(safe-area-inset-bottom,0))] left-1/2 z-50 -translate-x-1/2 sm:hidden',
      )}
    >
      <div className="relative flex items-center rounded-xl bg-background/95 py-1 pr-1 pl-2.5 shadow-md ring-1 ring-foreground/10 backdrop-blur-md dark:ring-foreground/20">
        <span className="pr-2 font-mono text-xs tracking-tight text-muted-foreground">
          {site.name}
        </span>
        <div className="mx-1 h-6 w-px bg-line" />
        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'group relative flex size-8 touch-manipulation flex-col items-center justify-center gap-1 rounded-lg',
            'text-foreground transition-colors hover:bg-muted',
            open && 'bg-muted',
          )}
        >
          <span
            className={cn(
              'h-0.5 w-4 rounded-[1px] bg-current transition-transform',
              open && 'translate-y-[3px] rotate-45',
            )}
          />
          <span
            className={cn(
              'h-0.5 w-4 rounded-[1px] bg-current transition-transform',
              open && '-translate-y-[3px] -rotate-45',
            )}
          />
        </button>

        {open && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setOpen(false)}
            />
            <nav
              id={menuId}
              className="absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-background p-1 shadow-xl ring-1 ring-foreground/10"
            >
              {site.nav.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </>
        )}
      </div>
    </div>
  )
}
