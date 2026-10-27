import { frameToSeconds, type Cue, type Resolution } from './cues'

export const BEATS_PER_BAR = 4

/** Beats per grid step at each resolution. */
const STEP_BEATS: Record<Resolution, number> = {
  bar: BEATS_PER_BAR,
  beat: 1,
  '8th': 0.5,
  '16th': 0.25,
  '32nd': 0.125,
}

/** A linear beat grid: beat k sits at `origin + k * period`, and beat 0 is a downbeat. */
export type Grid = { bpm: number; period: number; origin: number }

export function gridTime(grid: Grid, bar: number, sixteenth = 0) {
  return grid.origin + (bar * BEATS_PER_BAR + sixteenth / 4) * grid.period
}

export function snap(grid: Grid, t: number, res: Resolution, { notBefore = 0 } = {}) {
  const step = STEP_BEATS[res] * grid.period
  let k = Math.round((t - grid.origin) / step)
  let snapped = grid.origin + k * step
  while (snapped < notBefore) snapped = grid.origin + ++k * step
  return snapped
}

export type TempoFit = Grid & { cost: number; candidates: number }

/**
 * Chooses the tempo whose grid best matches the visual accents.
 * The first bar-resolution cue anchors a downbeat; every cue pulls toward its own resolution.
 */
export function fitTempo(cues: Cue[], { minBpm = 96, maxBpm = 150, stepBpm = 0.005 } = {}): TempoFit {
  const anchorCue = cues.find((c) => c.res === 'bar')
  if (!anchorCue) throw new Error('Tempo fit needs at least one bar-resolution cue')
  const origin = frameToSeconds(anchorCue.frame)
  const points = cues.map((c) => ({ t: frameToSeconds(c.frame), step: STEP_BEATS[c.res], w: c.weight }))

  let best: TempoFit | null = null
  let candidates = 0
  for (let bpm = minBpm; bpm <= maxBpm; bpm += stepBpm) {
    candidates++
    const period = 60 / bpm
    let cost = 0
    for (const { t, step, w } of points) {
      const stepSec = step * period
      const x = (t - origin) / stepSec
      const d = (x - Math.round(x)) * stepSec
      cost += w * d * d
    }
    // Mild preference for tempos near 120 so near-ties resolve musically.
    cost += 1e-4 * Math.log2(bpm / 120) ** 2
    if (!best || cost < best.cost) best = { bpm, period, origin, cost, candidates: 0 }
  }
  return { ...best!, bpm: Math.round(best!.bpm * 1000) / 1000, candidates }
}
