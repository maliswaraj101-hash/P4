import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { colors } from '../theme'

/** Site's `dot-grid` pattern with a slow-drifting glow. */
export function Background() {
  const frame = useCurrentFrame()
  const { durationInFrames } = useVideoConfig()
  const glowX = interpolate(frame, [0, durationInFrames], [30, 70])
  const glowY = interpolate(frame, [0, durationInFrames], [25, 60])

  return (
    <AbsoluteFill style={{ backgroundColor: colors.background }}>
      <AbsoluteFill
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1.5px, transparent 0)',
          backgroundSize: '16px 16px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,255,255,0.06), transparent 55%)`,
        }}
      />
    </AbsoluteFill>
  )
}
