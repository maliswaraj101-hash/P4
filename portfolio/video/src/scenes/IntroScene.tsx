import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import { SMMark } from '@/components/sm-mark'
import { site } from '@/data/site'
import { clamp, colors, fonts, useIsPortrait } from '../theme'
import { INTRO } from '../timeline'

const {
  typeStart: TYPE_START,
  typeEnd: TYPE_END,
  sentenceStart: SENTENCE_START,
  sentenceLength: SENTENCE_LENGTH,
} = INTRO

export function IntroScene({ duration }: { duration: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const portrait = useIsPortrait()

  const markIn = spring({ frame, fps, config: { damping: 14, mass: 0.7 } })
  const markReveal = interpolate(frame, [0, 18], [100, 0], clamp)

  const name = site.fullName
  const typedCount = Math.round(interpolate(frame, [TYPE_START, TYPE_END], [0, name.length], clamp))
  const caretVisible = frame < TYPE_END + 16 && Math.floor(frame / 8) % 2 === 0

  const exitScale = interpolate(frame, [duration - 30, duration], [1, 1.06], clamp)

  const nameSize = portrait ? 124 : 132
  const sentenceSize = portrait ? 34 : 40

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        gap: portrait ? 56 : 48,
        transform: `scale(${exitScale})`,
      }}
    >
      <SMMark
        style={{
          width: portrait ? 220 : 180,
          color: colors.foreground,
          transform: `scale(${interpolate(markIn, [0, 1], [0.6, 1])})`,
          opacity: markIn,
          clipPath: `inset(0 ${markReveal}% 0 0)`,
        }}
      />

      <div
        style={{
          fontSize: nameSize,
          fontWeight: 600,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          whiteSpace: 'pre',
        }}
      >
        {name.slice(0, typedCount)}
        <span
          style={{
            display: 'inline-block',
            width: nameSize * 0.06,
            height: nameSize * 0.9,
            marginLeft: nameSize * 0.06,
            verticalAlign: 'bottom',
            backgroundColor: colors.foreground,
            opacity: caretVisible ? 1 : 0,
          }}
        />
      </div>

      <div
        style={{
          position: 'relative',
          height: sentenceSize * 1.4,
          width: '100%',
          fontFamily: fonts.mono,
          fontSize: sentenceSize,
          color: colors.mutedForeground,
          letterSpacing: '-0.02em',
        }}
      >
        {site.flipSentences.map((sentence, i) => {
          const isLast = i === site.flipSentences.length - 1
          const local = frame - (SENTENCE_START + i * SENTENCE_LENGTH)
          const enter = interpolate(local, [0, 8], [0, 1], clamp)
          const exit = isLast ? 0 : interpolate(local, [SENTENCE_LENGTH - 6, SENTENCE_LENGTH], [0, 1], clamp)
          return (
            <div
              key={sentence}
              style={{
                position: 'absolute',
                inset: 0,
                textAlign: 'center',
                opacity: enter * (1 - exit),
                transform: `translateY(${(1 - enter) * 16 - exit * 16}px)`,
              }}
            >
              {sentence}
            </div>
          )
        })}
      </div>
    </AbsoluteFill>
  )
}
