import type { ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { clamp } from '../theme'

export function SceneFade({
  duration,
  fadeIn = 15,
  fadeOut = 15,
  children,
}: {
  duration: number
  fadeIn?: number
  fadeOut?: number
  children: ReactNode
}) {
  const frame = useCurrentFrame()
  const fadeInOpacity = fadeIn > 0 ? interpolate(frame, [0, fadeIn], [0, 1], clamp) : 1
  const fadeOutOpacity =
    fadeOut > 0 ? interpolate(frame, [duration - fadeOut, duration], [1, 0], clamp) : 1

  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeInOpacity, fadeOutOpacity) }}>
      {children}
    </AbsoluteFill>
  )
}
