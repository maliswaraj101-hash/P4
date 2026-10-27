import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { SMMark } from '@/components/sm-mark'
import { SocialIcon } from '@/components/social-icons'
import { site } from '@/data/site'
import { clamp, colors, fonts, useIsPortrait } from '../theme'
import { OUTRO } from '../timeline'

// social-icons.tsx colors the LinkedIn glyph with Tailwind classes, which don't exist in this bundle.
const SOCIAL_ICON_CSS = `
  [class="fill-[#0A66C2]"] { fill: #0A66C2; }
  [class="fill-white"] { fill: #ffffff; }
`

const SOCIALS = site.social.filter((s) => s.name !== 'email')
const SITE_HOST = 'swarajjj.vercel.app'

export function OutroScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const portrait = useIsPortrait()

  const enter = (delay: number) =>
    spring({ frame: frame - delay, fps, config: { damping: 16, mass: 0.7 } })

  const mark = enter(OUTRO.mark)
  const title = enter(OUTRO.title)
  const url = enter(OUTRO.url)
  const urlReveal = interpolate(frame, [...OUTRO.urlReveal], [100, 0], clamp)
  const footer = enter(OUTRO.footer)

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: portrait ? 64 : 44,
        textAlign: 'center',
      }}
    >
      <style>{SOCIAL_ICON_CSS}</style>

      <SMMark
        style={{
          width: portrait ? 160 : 120,
          color: colors.foreground,
          opacity: mark,
          transform: `scale(${interpolate(mark, [0, 1], [0.6, 1])})`,
        }}
      />

      <div
        style={{
          fontSize: portrait ? 104 : 96,
          fontWeight: 600,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          opacity: title,
          transform: `translateY(${(1 - title) * 30}px)`,
        }}
      >
        Let's talk.
      </div>

      <div
        style={{
          padding: portrait ? '22px 40px' : '18px 36px',
          borderRadius: 999,
          backgroundColor: colors.foreground,
          color: colors.background,
          fontFamily: fonts.mono,
          fontSize: portrait ? 50 : 44,
          fontWeight: 500,
          letterSpacing: '-0.02em',
          opacity: url,
          transform: `scale(${interpolate(url, [0, 1], [0.85, 1])})`,
        }}
      >
        <span style={{ clipPath: `inset(0 ${urlReveal}% 0 0)`, display: 'inline-block' }}>
          {SITE_HOST}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: portrait ? 'repeat(2, auto)' : `repeat(${SOCIALS.length}, auto)`,
          columnGap: portrait ? 56 : 52,
          rowGap: 32,
          marginTop: portrait ? 16 : 8,
        }}
      >
        {SOCIALS.map((social, i) => {
          const p = enter(OUTRO.socialsStart + i * OUTRO.socialStagger)
          return (
            <div
              key={social.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                opacity: p,
                transform: `translateY(${(1 - p) * 24}px)`,
              }}
            >
              <SocialIcon name={social.name} width={portrait ? 38 : 32} height={portrait ? 38 : 32} />
              <span style={{ fontFamily: fonts.mono, fontSize: portrait ? 30 : 26, color: colors.mutedForeground }}>
                {social.handle}
              </span>
            </div>
          )
        })}
      </div>

      <div
        style={{
          fontFamily: fonts.mono,
          fontSize: portrait ? 28 : 22,
          color: colors.mutedForeground,
          opacity: footer * 0.8,
        }}
      >
        {site.title.replace(/\.$/, '')} · {site.location}
      </div>
    </AbsoluteFill>
  )
}
