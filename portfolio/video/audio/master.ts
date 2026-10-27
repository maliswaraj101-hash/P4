import { Biquad, SR, dbToGain, filterStereo, stereo, type Stereo } from './dsp'
import { integratedLufs, truePeakDb } from './loudness'

function copy(bus: Stereo): Stereo {
  return { L: Float32Array.from(bus.L), R: Float32Array.from(bus.R) }
}

/** Stereo-linked feed-forward compressor for gentle bus glue. */
function glue(bus: Stereo, { thresholdDb = -12, ratio = 2, attack = 0.01, release = 0.15 } = {}) {
  const out = copy(bus)
  const aC = Math.exp(-1 / (attack * SR))
  const rC = Math.exp(-1 / (release * SR))
  let env = 0
  for (let i = 0; i < out.L.length; i++) {
    const level = Math.max(Math.abs(out.L[i]!), Math.abs(out.R[i]!))
    env = level > env ? aC * env + (1 - aC) * level : rC * env + (1 - rC) * level
    const levelDb = 20 * Math.log10(Math.max(env, 1e-9))
    const over = levelDb - thresholdDb
    const g = over > 0 ? dbToGain(-over * (1 - 1 / ratio)) : 1
    out.L[i]! *= g
    out.R[i]! *= g
  }
  return out
}

/**
 * Lookahead brickwall limiter. Gain is the boxcar average of a sliding minimum,
 * which guarantees the gain has fully settled by the time each peak arrives.
 */
function limit(bus: Stereo, ceilingDb: number, lookahead = 0.003, release = 0.08) {
  const n = bus.L.length
  const ceiling = dbToGain(ceilingDb)
  const la = Math.round(lookahead * SR)
  const target = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(bus.L[i]!), Math.abs(bus.R[i]!))
    target[i] = p > ceiling ? ceiling / p : 1
  }
  const slidingMin = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    let m = 1
    for (let j = i; j <= Math.min(n - 1, i + la); j++) if (target[j]! < m) m = target[j]!
    slidingMin[i] = m
  }
  const out = stereo(n)
  const rel = 1 - Math.exp(-1 / (release * SR))
  let acc = 0
  let g = 1
  for (let i = 0; i < n; i++) {
    acc += slidingMin[i]!
    if (i > la) acc -= slidingMin[i - la - 1]!
    const avg = acc / Math.min(i + 1, la + 1)
    g = Math.min(avg, g + (1 - g) * rel)
    out.L[i] = bus.L[i]! * g
    out.R[i] = bus.R[i]! * g
  }
  return out
}

export type MasterReport = {
  preMasterLufs: number
  gainDb: number
  ceilingDb: number
  integratedLufs: number
  truePeakDbtp: number
  iterations: number
}

/** EQ + glue, then iterate gain/ceiling until integrated loudness and true peak both hit target. */
export function master(mix: Stereo, targetLufs = -14, maxTruePeak = -1): { bus: Stereo; report: MasterReport } {
  const toned = copy(mix)
  filterStereo(toned, () => new Biquad('highpass', 28, 0.707))
  filterStereo(toned, () => new Biquad('peaking', 320, 0.9, -1.5))
  filterStereo(toned, () => new Biquad('highshelf', 9000, 0.707, 1.5))
  const glued = glue(toned)

  const preMasterLufs = integratedLufs(glued)
  let gainDb = targetLufs - preMasterLufs
  let ceilingDb = maxTruePeak - 0.6
  let result = glued
  let lufs = preMasterLufs
  let tp = 0
  let iterations = 0
  let applied = { gainDb, ceilingDb }
  for (; iterations < 8; iterations++) {
    applied = { gainDb, ceilingDb }
    const g = dbToGain(gainDb)
    const driven: Stereo = { L: glued.L.map((v) => v * g), R: glued.R.map((v) => v * g) }
    result = limit(driven, ceilingDb)
    lufs = integratedLufs(result)
    tp = truePeakDb(result)
    const loudOk = Math.abs(lufs - targetLufs) <= 0.05
    const peakOk = tp <= maxTruePeak
    if (loudOk && peakOk) break
    if (!peakOk) ceilingDb -= tp - maxTruePeak + 0.05
    gainDb += targetLufs - lufs
  }

  const round = (v: number) => Math.round(v * 100) / 100
  return {
    bus: result,
    report: {
      preMasterLufs: round(preMasterLufs),
      gainDb: round(applied.gainDb),
      ceilingDb: round(applied.ceilingDb),
      integratedLufs: round(lufs),
      truePeakDbtp: round(tp),
      iterations: iterations + 1,
    },
  }
}
