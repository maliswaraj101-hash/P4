import { SR, type Stereo } from './dsp'
import { BEATS_PER_BAR, type Grid } from './grid'

const NFFT = 512
const HOP = 120
const OUTLIER_MS = 20
const ENV_RATE = SR / HOP

function fft(re: Float64Array, im: Float64Array) {
  const n = re.length
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j]!, re[i]!]
      ;[im[i], im[j]] = [im[j]!, im[i]!]
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len
    const wr = Math.cos(ang)
    const wi = Math.sin(ang)
    for (let i = 0; i < n; i += len) {
      let cr = 1
      let ci = 0
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k]!, ai = im[i + k]!
        const br = re[i + k + len / 2]!, bi = im[i + k + len / 2]!
        const tr = br * cr - bi * ci
        const ti = br * ci + bi * cr
        re[i + k] = ar + tr; im[i + k] = ai + ti
        re[i + k + len / 2] = ar - tr; im[i + k + len / 2] = ai - ti
        const ncr = cr * wr - ci * wi
        ci = cr * wi + ci * wr
        cr = ncr
      }
    }
  }
}

/** Log-magnitude spectral flux (full band and kick band), centred frames at HOP spacing. */
function onsetEnvelopes(bus: Stereo) {
  const n = bus.L.length
  const frames = Math.floor(n / HOP)
  const window = Float64Array.from({ length: NFFT }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / NFFT))
  const bins = NFFT / 2
  const maxBin = Math.floor((8000 / SR) * NFFT)
  const kickBin = Math.ceil((150 / SR) * NFFT)
  let prev = new Float64Array(bins)
  const flux = new Float64Array(frames)
  const lowFlux = new Float64Array(frames)
  const re = new Float64Array(NFFT)
  const im = new Float64Array(NFFT)
  for (let f = 0; f < frames; f++) {
    const center = f * HOP
    for (let i = 0; i < NFFT; i++) {
      const j = center - NFFT / 2 + i
      re[i] = j >= 0 && j < n ? ((bus.L[j]! + bus.R[j]!) / 2) * window[i]! : 0
      im[i] = 0
    }
    fft(re, im)
    const cur = new Float64Array(bins)
    let sum = 0
    let low = 0
    for (let k = 1; k < maxBin; k++) {
      cur[k] = Math.log1p(1000 * Math.hypot(re[k]!, im[k]!))
      const d = cur[k]! - prev[k]!
      if (d > 0) {
        sum += d
        if (k <= kickBin) low += d
      }
    }
    flux[f] = sum
    lowFlux[f] = low
    prev = cur
  }
  return { flux, lowFlux }
}

/** Remove the local mean, half-wave rectify, normalise to unit standard deviation. */
function normalise(env: Float64Array) {
  const w = Math.round(ENV_RATE * 0.25)
  const out = new Float64Array(env.length)
  let acc = 0
  for (let i = 0; i < env.length; i++) {
    acc += env[i]!
    if (i >= 2 * w + 1) acc -= env[i - 2 * w - 1]!
    const centre = i - w
    if (centre >= 0) out[centre] = Math.max(0, env[centre]! - acc / Math.min(i + 1, 2 * w + 1))
  }
  const mean = out.reduce((s, v) => s + v, 0) / out.length
  const sd = Math.sqrt(out.reduce((s, v) => s + (v - mean) ** 2, 0) / out.length) || 1
  return out.map((v) => v / sd)
}

/**
 * Tempo by harmonic-sum autocorrelation: each lag is scored with its multiples (1, 2, 3, 4),
 * which resolves half-time grooves to the pulse instead of the backbeat. A log-Gaussian
 * prior (centre 120 BPM, 1 octave) breaks remaining ties. The peak is refined to sub-lag.
 */
function estimatePeriod(env: Float64Array) {
  const minLag = Math.floor((60 / 200) * ENV_RATE)
  const maxLag = Math.ceil((60 / 60) * ENV_RATE)
  const acLimit = maxLag * 4 + 2
  const ac = new Float64Array(acLimit + 1)
  for (let lag = 1; lag <= acLimit; lag++) {
    let sum = 0
    for (let i = lag; i < env.length; i++) sum += env[i]! * env[i - lag]!
    ac[lag] = sum / (env.length - lag)
  }
  const acAt = (x: number) => {
    const i = Math.floor(x)
    const f = x - i
    return ac[i]! * (1 - f) + ac[Math.min(i + 1, acLimit)]! * f
  }
  const scores = new Float64Array(maxLag + 2)
  for (let lag = minLag - 1; lag <= maxLag + 1; lag++) {
    let salience = 0
    for (let h = 1; h <= 4; h++) salience += acAt(lag * h) / h
    const bpm = (60 * ENV_RATE) / lag
    const prior = Math.exp(-0.5 * Math.log2(bpm / 120) ** 2)
    scores[lag] = salience * prior
  }
  let best = minLag
  for (let lag = minLag; lag <= maxLag; lag++) if (scores[lag]! > scores[best]!) best = lag
  const a = scores[best - 1]!, b = scores[best]!, c = scores[best + 1]!
  const offset = a - 2 * b + c !== 0 ? (0.5 * (a - c)) / (a - 2 * b + c) : 0
  return best + offset
}

/** Dynamic-programming beat tracker (Ellis 2007). Returns beat positions in envelope frames. */
function trackBeats(env: Float64Array, period: number, tightness = 400) {
  const sigma = period / 32
  const radius = Math.ceil(sigma * 4)
  const local = new Float64Array(env.length)
  for (let i = 0; i < env.length; i++) {
    let s = 0
    for (let k = -radius; k <= radius; k++) {
      const j = i + k
      if (j >= 0 && j < env.length) s += env[j]! * Math.exp(-0.5 * (k / sigma) ** 2)
    }
    local[i] = s
  }
  const cum = new Float64Array(env.length)
  const back = new Int32Array(env.length).fill(-1)
  for (let i = 0; i < env.length; i++) {
    let best = 0
    let arg = -1
    for (let j = i - Math.round(2 * period); j <= i - Math.round(period / 2); j++) {
      if (j < 0) continue
      const s = cum[j]! - tightness * Math.log((i - j) / period) ** 2
      if (arg === -1 || s > best) {
        best = s
        arg = j
      }
    }
    cum[i] = local[i]! + (arg >= 0 ? best : 0)
    back[i] = arg
  }
  let last = env.length - 1
  for (let i = env.length - Math.round(period); i < env.length; i++) if (cum[i]! > cum[last]!) last = i
  const beats: number[] = []
  for (let i = last; i >= 0; i = back[i]!) beats.unshift(i)

  const median = [...local].sort((x, y) => x - y)[Math.floor(local.length / 2)]!
  const strong = (b: number) => local[b]! > median
  while (beats.length && !strong(beats[0]!)) beats.shift()
  while (beats.length && !strong(beats[beats.length - 1]!)) beats.pop()
  return { beats, local }
}

/** Parabolic peak refinement within one frame of each tracked beat. */
function refine(env: Float64Array, frame: number) {
  let peak = frame
  for (let k = -2; k <= 2; k++) {
    const j = frame + k
    if (j > 0 && j < env.length - 1 && env[j]! > env[peak]!) peak = j
  }
  if (peak <= 0 || peak >= env.length - 1) return peak
  const a = env[peak - 1]!, b = env[peak]!, c = env[peak + 1]!
  const denom = a - 2 * b + c
  return peak + (denom !== 0 ? (0.5 * (a - c)) / denom : 0)
}

export type BeatAnalysis = {
  method: string
  analysis: { sampleRate: number; nfft: number; hop: number; envelopeRate: number }
  tempo: { autocorrelationBpm: number; fittedBpm: number }
  beats: number[]
  /** Tracked beats excluded from the grid fit (more than 20 ms off the line). */
  outliers: number[]
  downbeats: number[]
  grid: Grid
  fit: { inliers: number; residualRmsMs: number; residualMaxMs: number; downbeatPhase: number }
}

export function analyseBeats(bus: Stereo): BeatAnalysis {
  const { flux, lowFlux } = onsetEnvelopes(bus)
  const env = normalise(flux)
  const low = normalise(lowFlux)
  const periodFrames = estimatePeriod(env)
  const { beats: beatFrames } = trackBeats(env, periodFrames)
  const beats = beatFrames.map((f) => refine(env, f) / ENV_RATE)

  // Least-squares line through the measured beats gives the grid used for snapping.
  // Beats more than OUTLIER_MS off the line are dropped and the line refit, twice.
  const p0 = periodFrames / ENV_RATE
  const idx = beats.map((b) => Math.round((b - beats[0]!) / p0))
  const fitLine = (use: boolean[]) => {
    const pts = beats.map((b, i) => [idx[i]!, b] as const).filter((_, i) => use[i])
    const mx = pts.reduce((s, [x]) => s + x, 0) / pts.length
    const my = pts.reduce((s, [, y]) => s + y, 0) / pts.length
    let sxy = 0, sxx = 0
    for (const [x, y] of pts) {
      sxy += (x - mx) * (y - my)
      sxx += (x - mx) ** 2
    }
    const slope = sxy / sxx
    return { period: slope, intercept: my - slope * mx }
  }
  let inlier = beats.map(() => true)
  let line = fitLine(inlier)
  for (let pass = 0; pass < 2; pass++) {
    inlier = beats.map((b, i) => Math.abs(b - (line.intercept + line.period * idx[i]!)) * 1000 <= OUTLIER_MS)
    line = fitLine(inlier)
  }
  const { period, intercept } = line
  const residuals = beats.map((b, i) => b - (intercept + period * idx[i]!)).filter((_, i) => inlier[i])
  const n = residuals.length

  // Downbeat phase: which of the four beat positions carries the most kick-band flux.
  const phaseEnergy = Array.from({ length: BEATS_PER_BAR }, (_, phase) =>
    idx.reduce((s, k, i) => (((k - phase) % BEATS_PER_BAR) + BEATS_PER_BAR) % BEATS_PER_BAR === 0 ? s + low[beatFrames[i]!]! : s, 0),
  )
  const downbeatPhase = phaseEnergy.indexOf(Math.max(...phaseEnergy))
  const origin = intercept + downbeatPhase * period

  const ms = (s: number) => Math.round(s * 1e5) / 100
  return {
    method: 'log spectral flux onset envelope → autocorrelation tempo → DP beat tracking (Ellis 2007) → least-squares grid',
    analysis: { sampleRate: SR, nfft: NFFT, hop: HOP, envelopeRate: ENV_RATE },
    tempo: {
      autocorrelationBpm: Math.round(((60 * ENV_RATE) / periodFrames) * 1000) / 1000,
      fittedBpm: Math.round((60 / period) * 1000) / 1000,
    },
    beats: beats.map((b) => Math.round(b * 1e5) / 1e5),
    outliers: beats.filter((_, i) => !inlier[i]).map((b) => Math.round(b * 1e5) / 1e5),
    downbeats: beats.filter((_, i) => (((idx[i]! - downbeatPhase) % BEATS_PER_BAR) + BEATS_PER_BAR) % BEATS_PER_BAR === 0).map((b) => Math.round(b * 1e5) / 1e5),
    grid: { bpm: 60 / period, period, origin },
    fit: {
      inliers: n,
      residualRmsMs: ms(Math.sqrt(residuals.reduce((s, r) => s + r * r, 0) / n)),
      residualMaxMs: ms(Math.max(...residuals.map(Math.abs))),
      downbeatPhase,
    },
  }
}
