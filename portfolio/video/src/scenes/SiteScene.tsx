import type { ReactNode } from 'react'
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import meta from '../../public/captures/meta.json'
import { clamp, colors, easeInOut, fonts, useIsPortrait } from '../theme'
import { SITE as T } from '../timeline'

type Capture = typeof meta.desktop | typeof meta.mobile

const SECTION_LABELS = T.labels

type Geometry = {
  /** Outer device frame, in composition pixels, before the focus zoom. */
  frame: { left: number; top: number; width: number; height: number }
  /** Height of the browser/URL bar above the page. */
  barHeight: number
  /** Inner padding between the device edge and the screen (phone bezel). */
  bezel: number
  /** Composition pixels per CSS pixel of the captured page. */
  scale: number
  /** CSS px cropped off each side of the capture (desktop only). */
  cropLeft: number
  screenHeight: number
}

function getGeometry(portrait: boolean, capture: Capture): Geometry {
  if (portrait) {
    const bezel = 18
    const width = 900
    const screenWidth = width - bezel * 2
    const screenHeight = 1500
    const height = screenHeight + bezel * 2
    return {
      frame: { left: (1080 - width) / 2, top: (1920 - height) / 2, width, height },
      barHeight: 84,
      bezel,
      scale: screenWidth / capture.viewport.width,
      cropLeft: 0,
      screenHeight,
    }
  }

  const width = 1600
  const barHeight = 52
  const screenHeight = 880
  const visibleCssWidth = 1152
  const height = barHeight + screenHeight
  return {
    frame: { left: (1920 - width) / 2, top: (1080 - height) / 2, width, height },
    barHeight,
    bezel: 0,
    scale: width / visibleCssWidth,
    cropLeft: (capture.viewport.width - visibleCssWidth) / 2,
    screenHeight,
  }
}

function useScrollY(capture: Capture, visibleCssHeight: number) {
  const frame = useCurrentFrame()
  const gap = capture.headerHeight + 12
  const top = (id: keyof Capture['sections']) => Math.max(0, capture.sections[id] - gap)
  const experienceSpan = capture.sections.work - capture.sections.experience - visibleCssHeight
  const drift = Math.max(0, Math.min(700, experienceSpan))

  return interpolate(
    frame,
    [
      0,
      T.aboutScroll[0],
      T.aboutScroll[1],
      T.activityScroll[0],
      T.activityScroll[1],
      T.experienceScroll[0],
      T.experienceScroll[1],
      T.focus,
      T.focus + 170,
    ],
    [
      0,
      0,
      top('about'),
      top('about'),
      top('activity'),
      top('activity'),
      top('experience'),
      top('experience'),
      top('experience') + drift,
    ],
    easeInOut,
  )
}

export function SiteScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const portrait = useIsPortrait()
  const capture: Capture = portrait ? meta.mobile : meta.desktop
  const kind = portrait ? 'mobile' : 'desktop'
  const g = getGeometry(portrait, capture)

  const pageHeight = g.screenHeight - g.barHeight
  const visibleCssHeight = pageHeight / g.scale
  const scrollY = useScrollY(capture, visibleCssHeight)

  const enter = spring({ frame, fps, config: { damping: 18, mass: 0.9 } })
  const focus = spring({ frame: frame - T.focus, fps, config: { damping: 20, mass: 1 } })
  const drift = interpolate(frame, [0, duration], [0, 1])

  // Landscape: frame slides left to make room for callouts. Portrait: frame moves up.
  const focusScale = interpolate(focus, [0, 1], [1, portrait ? 0.78 : 0.74])
  const focusShift = portrait
    ? interpolate(focus, [0, 1], [0, 80 - g.frame.top])
    : interpolate(focus, [0, 1], [0, 80 - g.frame.left])

  const frameTransform = [
    portrait ? `translateY(${focusShift}px)` : `translateX(${focusShift}px)`,
    `translateY(${interpolate(enter, [0, 1], [80, 0])}px)`,
    `scale(${interpolate(enter, [0, 1], [0.92, 1]) * focusScale * (1 + drift * 0.01)})`,
  ].join(' ')

  const pageWidthPx = capture.viewport.width * g.scale
  const headerPx = capture.headerHeight * g.scale
  const fadeCssHeight = portrait ? 120 : 96

  return (
    <AbsoluteFill>
      <div
        style={{
          position: 'absolute',
          ...g.frame,
          transform: frameTransform,
          transformOrigin: portrait ? 'top center' : 'left center',
          opacity: enter,
          borderRadius: portrait ? 72 : 18,
          padding: g.bezel,
          backgroundColor: portrait ? '#1c1c1f' : colors.chrome,
          border: `2px solid ${portrait ? '#3f3f46' : '#2e2e33'}`,
          boxShadow: '0 50px 140px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.04)',
          overflow: 'hidden',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: portrait ? 56 : 0,
            backgroundColor: colors.background,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: g.barHeight,
              left: 0,
              right: 0,
              height: pageHeight,
              overflow: 'hidden',
            }}
          >
            {/* Clipped below the header so no page pixels sit behind its antialiased edges. */}
            <div style={{ position: 'absolute', top: headerPx, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
              <Img
                src={staticFile(`captures/${kind}-page.jpg`)}
                style={{
                  position: 'absolute',
                  left: -g.cropLeft * g.scale,
                  top: -scrollY * g.scale - headerPx,
                  width: pageWidthPx,
                }}
              />
            </div>
            <Img
              src={staticFile(`captures/${kind}-header.png`)}
              style={{
                position: 'absolute',
                left: -g.cropLeft * g.scale,
                top: 0,
                width: pageWidthPx,
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: fadeCssHeight * g.scale,
                background: `linear-gradient(to bottom, transparent, ${colors.background})`,
              }}
            />
            {capture.bottomNav ? (
              <Img
                src={staticFile(`captures/${kind}-bottom-nav.png`)}
                style={{
                  position: 'absolute',
                  left: '50%',
                  bottom: capture.bottomNav.bottom * g.scale,
                  width: capture.bottomNav.width * g.scale,
                  transform: 'translateX(-50%)',
                }}
              />
            ) : null}
          </div>

          <BrowserBar height={g.barHeight} portrait={portrait} />
        </div>
      </div>

      <SectionLabel portrait={portrait} frameBottom={g.frame.top + g.frame.height} />
      <Callouts portrait={portrait} />
    </AbsoluteFill>
  )
}

function BrowserBar({ height, portrait }: { height: number; portrait: boolean }) {
  const url = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        height: portrait ? 56 : 32,
        width: portrait ? 560 : 520,
        borderRadius: portrait ? 18 : 9,
        backgroundColor: portrait ? colors.chrome : colors.background,
        border: `1px solid ${colors.border}`,
        fontFamily: fonts.mono,
        fontSize: portrait ? 26 : 17,
        color: colors.mutedForeground,
      }}
    >
      <LockIcon size={portrait ? 22 : 14} />
      swarajjj.vercel.app
    </div>
  )

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: portrait ? colors.background : colors.chrome,
        borderBottom: `1px solid ${colors.border}`,
      }}
    >
      {portrait ? null : (
        <div style={{ position: 'absolute', left: 22, display: 'flex', gap: 10 }}>
          {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
            <div key={c} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: c }} />
          ))}
        </div>
      )}
      {url}
    </div>
  )
}

function LockIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function SectionLabel({ portrait, frameBottom }: { portrait: boolean; frameBottom: number }) {
  const frame = useCurrentFrame()
  const active = SECTION_LABELS.find((l) => frame >= l.from - 10 && frame <= l.to)
  if (!active) return null

  const opacity = interpolate(frame, [active.from - 10, active.from, active.to - 10, active.to], [0, 1, 1, 0], clamp)
  const y = interpolate(frame, [active.from - 10, active.from], [16, 0], clamp)
  const height = portrait ? 76 : 60

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: frameBottom - height / 2,
        height,
        padding: `0 ${portrait ? 36 : 28}px`,
        display: 'flex',
        alignItems: 'center',
        transform: `translateX(-50%) translateY(${y}px)`,
        opacity,
        borderRadius: height / 2,
        backgroundColor: colors.foreground,
        color: colors.background,
        fontFamily: fonts.mono,
        fontSize: portrait ? 34 : 26,
        fontWeight: 500,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}
    >
      {active.text}
    </div>
  )
}

type CalloutItem = {
  badge: ReactNode
  title: string
  subtitle: string
}

const CALLOUTS: CalloutItem[] = [
  {
    badge: <LogoBadge src="site/companies/streamoji.png" />,
    title: 'AI/3D Intern · Streamoji',
    subtitle: 'RAG agents · voice AI · 3D avatars',
  },
  {
    badge: <TextBadge text="<300ms" />,
    title: 'Real-time voice AI',
    subtitle: 'Pipecat · viseme lipsync · Recall.ai',
  },
  {
    badge: <LogoBadge src="site/companies/deloitte.png" />,
    title: 'Deloitte Capstone',
    subtitle: 'LangGraph compliance-audit agent',
  },
]

function Callouts({ portrait }: { portrait: boolean }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <div
      style={{
        position: 'absolute',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
        ...(portrait
          ? { left: 90, right: 90, top: 1330 }
          : { left: 1310, right: 60, top: 0, bottom: 0, justifyContent: 'center' }),
      }}
    >
      {CALLOUTS.map((item, i) => {
        const p = spring({ frame: frame - T.callouts[i]!, fps, config: { damping: 16, mass: 0.7 } })
        return (
          <div
            key={item.title}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              padding: portrait ? '26px 30px' : '24px 26px',
              borderRadius: 22,
              backgroundColor: colors.card,
              border: `1px solid ${colors.border}`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
              opacity: p,
              transform: portrait
                ? `translateY(${(1 - p) * 40}px)`
                : `translateX(${(1 - p) * 60}px)`,
            }}
          >
            {item.badge}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
              <div style={{ fontSize: portrait ? 36 : 28, fontWeight: 600, letterSpacing: '-0.02em' }}>
                {item.title}
              </div>
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: portrait ? 24 : 18,
                  color: colors.mutedForeground,
                }}
              >
                {item.subtitle}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

const BADGE_SIZE = 64

function LogoBadge({ src }: { src: string }) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Img src={staticFile(src)} style={{ width: 42, height: 42, objectFit: 'contain' }} />
    </div>
  )
}

function TextBadge({ text }: { text: string }) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        borderRadius: 16,
        backgroundColor: colors.muted,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: fonts.mono,
        fontSize: 15,
        fontWeight: 500,
        color: colors.foreground,
      }}
    >
      {text}
    </div>
  )
}
