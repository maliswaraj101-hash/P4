import { useEffect } from 'react'
import { site } from '@/data/site'
import { SiteHeader } from '@/components/site-header'
import { SiteBottomNav } from '@/components/site-bottom-nav'
import { ProfileHeader } from '@/components/profile-header'
import { About } from '@/components/about'
import { SocialLinks } from '@/components/social-links'
import { Activity } from '@/components/activity'
import { Experience } from '@/components/experience'
import { Projects } from '@/components/projects'
import { Articles } from '@/components/articles'
import { FightFooter } from '@/components/fight-footer'
import { ConnectFooter } from '@/components/connect-footer'
import { ScrollToTop } from '@/components/scroll-to-top'
import { Separator } from '@/components/separator'

export function HomePage() {
  useEffect(() => {
    document.title = site.name
    if (!window.location.hash) return
    const id = window.location.hash.slice(1)
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    })
  }, [])

  return (
    <div id="top" className="group/layout relative isolate">
      <SiteHeader />
      <main className="max-w-screen overflow-x-clip px-2">
        <div className="[--separator-height:--spacing(8)] **:data-[slot=panel]:scroll-mt-[calc(var(--header-height)+var(--separator-height))]">
          <div className="mx-auto md:max-w-3xl">
            <ProfileHeader />
            <Separator />

            <SocialLinks />
            <About />

            <Separator />

            <Activity />

            <Separator />

            <Experience />

            <Separator />

            <Projects />

            <Separator />

            <Articles />

            <FightFooter />
            <ConnectFooter />

            {/* Space so last content clears the fixed bottom fade */}
            <div className="h-(--fade-bottom-height)" aria-hidden />
          </div>
        </div>
      </main>

      {/* Fixed bottom fade — same pattern as chanhdai.com (MIT) */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
        aria-hidden
      >
        <div
          className="h-(--fade-bottom-height) bg-linear-to-b from-transparent to-background backdrop-blur-[1px]"
          style={{
            maskImage:
              'linear-gradient(to top, var(--background) 25%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to top, var(--background) 25%, transparent)',
          }}
        />
        <div className="bg-background pb-[env(safe-area-inset-bottom,0)]" />
      </div>

      <SiteBottomNav />
      <ScrollToTop />
    </div>
  )
}
