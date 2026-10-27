import { flushSync } from 'react-dom'
import { site } from '@/data/site'
import { SMMark } from '@/components/sm-mark'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 max-w-screen overflow-x-clip bg-background px-2">
      <div className="screen-line-top screen-line-bottom mx-auto flex h-14 items-center gap-2 border-x border-line pr-2 pl-4 sm:gap-4 md:max-w-3xl">
        <a href="#top" aria-label="Home" className="text-foreground">
          <SMMark className="h-6 w-12 shrink-0" />
        </a>

        <div className="flex-1" />

        <nav className="hidden items-center gap-4 text-sm text-foreground/80 sm:flex">
          {site.nav.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>

        <button
          type="button"
          className={headerBtnClass}
          aria-label="Toggle color theme"
          onClick={toggleTheme}
        >
          <ThemeIcon />
        </button>
      </div>
    </header>
  )
}

const headerBtnClass =
  'inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'

function toggleTheme() {
  const root = document.documentElement
  const nextDark = !root.classList.contains('dark')

  const apply = () => {
    flushSync(() => {
      root.classList.toggle('dark', nextDark)
      localStorage.setItem('theme', nextDark ? 'dark' : 'light')
    })
  }

  if (!document.startViewTransition) {
    apply()
    return
  }

  document.startViewTransition(apply)
}

/** Half-moon icon — rotates in dark mode (toggles.dev “Dark Side”). */
function ThemeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 32 32"
      fill="currentColor"
      aria-hidden
    >
      <path
        d="M16 .5C7.4.5.5 7.4.5 16S7.4 31.5 16 31.5 31.5 24.6 31.5 16 24.6.5 16 .5zm0 28.1V3.4C23 3.4 28.6 9 28.6 16S23 28.6 16 28.6z"
        className="origin-center motion-safe:transition-transform motion-safe:duration-500 motion-safe:ease-[ease] dark:rotate-180"
      />
    </svg>
  )
}
