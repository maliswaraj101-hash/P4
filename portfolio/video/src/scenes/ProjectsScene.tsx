import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { projects, type Project } from '@/data/projects'
import { clamp, colors, fonts, useIsPortrait } from '../theme'
import { PROJECTS } from '../timeline'

const { cardStagger: CARD_STAGGER, cardsStart: CARDS_START } = PROJECTS

function linkLabel(project: Project) {
  if (project.href) return new URL(project.href).host
  if (project.repo) return new URL(project.repo).pathname.slice(1)
  return null
}

export function ProjectsScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const portrait = useIsPortrait()

  const heading = spring({ frame, fps, config: { damping: 18 } })
  const pushIn = interpolate(frame, [0, duration], [1, 1.035], clamp)

  const cardWidth = portrait ? 450 : 404
  const imageHeight = Math.round(cardWidth * 0.625)

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: portrait ? 72 : 56,
        transform: `scale(${pushIn})`,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          opacity: heading,
          transform: `translateY(${(1 - heading) * 30}px)`,
        }}
      >
        <div style={{ fontFamily: fonts.mono, fontSize: portrait ? 32 : 26, color: colors.mutedForeground }}>
          # work
        </div>
        <div style={{ fontSize: portrait ? 84 : 76, fontWeight: 600, letterSpacing: '-0.04em' }}>
          Selected projects
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${portrait ? 2 : 4}, ${cardWidth}px)`,
          gap: portrait ? 36 : 28,
        }}
      >
        {projects.map((project, i) => {
          const p = spring({
            frame: frame - CARDS_START - i * CARD_STAGGER,
            fps,
            config: { damping: 16, mass: 0.8 },
          })
          const link = linkLabel(project)
          return (
            <div
              key={project.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 20,
                overflow: 'hidden',
                backgroundColor: colors.card,
                border: `1px solid ${colors.border}`,
                boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
                opacity: p,
                transform: `translateY(${(1 - p) * 70}px) scale(${interpolate(p, [0, 1], [0.95, 1])})`,
              }}
            >
              <Img
                src={staticFile(`site${project.image}`)}
                style={{
                  width: cardWidth,
                  height: imageHeight,
                  objectFit: 'cover',
                  objectPosition: 'top',
                  borderBottom: `1px solid ${colors.border}`,
                }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '22px 24px 24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: portrait ? 34 : 30, fontWeight: 600, letterSpacing: '-0.02em' }}>
                    {project.title}
                  </div>
                  {link ? (
                    <div style={{ fontFamily: fonts.mono, fontSize: portrait ? 18 : 15, color: colors.mutedForeground }}>
                      {link}
                    </div>
                  ) : null}
                </div>
                <div
                  style={{
                    fontSize: portrait ? 21 : 18,
                    lineHeight: 1.45,
                    color: colors.mutedForeground,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {project.description}
                </div>
                <div style={{ display: 'flex', gap: 14, marginTop: 6 }}>
                  {project.tech.map((t) => (
                    <Img
                      key={t.slug}
                      src={staticFile(`icons/${t.slug}.svg`)}
                      style={{ width: 26, height: 26 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
