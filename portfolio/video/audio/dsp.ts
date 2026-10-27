export const SR = 48000

export type Stereo = { L: Float32Array; R: Float32Array }

export const dbToGain = (db: number) => Math.pow(10, db / 20)
export const gainToDb = (g: number) => 20 * Math.log10(Math.max(g, 1e-12))
export const midiToHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12)
export const secondsToSamples = (s: number) => Math.round(s * SR)

export function stereo(length: number): Stereo {
  return { L: new Float32Array(length), R: new Float32Array(length) }
}

/** Equal-power pan; pan in [-1, 1]. Samples before 0 or past the end are dropped. */
export function addMono(bus: Stereo, src: Float32Array, startSample: number, gain = 1, pan = 0) {
  const angle = ((pan + 1) * Math.PI) / 4
  const gl = Math.cos(angle) * gain * Math.SQRT2
  const gr = Math.sin(angle) * gain * Math.SQRT2
  const n = bus.L.length
  for (let i = 0; i < src.length; i++) {
    const j = startSample + i
    if (j < 0) continue
    if (j >= n) break
    bus.L[j]! += src[i]! * gl
    bus.R[j]! += src[i]! * gr
  }
}

export function addStereo(bus: Stereo, src: Stereo, startSample: number, gain = 1) {
  const n = bus.L.length
  for (let i = 0; i < src.L.length; i++) {
    const j = startSample + i
    if (j < 0) continue
    if (j >= n) break
    bus.L[j]! += src.L[i]! * gain
    bus.R[j]! += src.R[i]! * gain
  }
}

export function mixInto(dst: Stereo, src: Stereo, gain = 1) {
  addStereo(dst, src, 0, gain)
}

export function scale(buf: Float32Array, gain: number) {
  for (let i = 0; i < buf.length; i++) buf[i]! *= gain
  return buf
}

export function reversed(buf: Float32Array) {
  return Float32Array.from(buf).reverse()
}

/* ---------- oscillators ---------- */

function polyBlep(t: number, dt: number) {
  if (t < dt) {
    t /= dt
    return t + t - t * t - 1
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt
    return t * t + t + t + 1
  }
  return 0
}

export type Wave = 'sine' | 'saw' | 'square' | 'triangle'

/** Band-limited oscillator with per-sample frequency. */
export class Osc {
  phase: number
  constructor(
    private wave: Wave,
    phase = 0,
  ) {
    this.phase = phase
  }
  next(freq: number) {
    const dt = freq / SR
    const t = this.phase
    let v: number
    switch (this.wave) {
      case 'sine':
        v = Math.sin(2 * Math.PI * t)
        break
      case 'saw':
        v = 2 * t - 1 - polyBlep(t, dt)
        break
      case 'square':
        v = t < 0.5 ? 1 : -1
        v += polyBlep(t, dt)
        v -= polyBlep((t + 0.5) % 1, dt)
        break
      case 'triangle':
        // Harmonics fall off at 1/n², so the naive form aliases very little.
        v = 1 - 4 * Math.abs(t - 0.5)
        break
    }
    this.phase = (t + dt) % 1
    return v
  }
}

/* ---------- filters ---------- */

/** Topology-preserving state-variable filter (Simper); stable under fast modulation. */
export class SVF {
  private ic1 = 0
  private ic2 = 0
  low = 0
  band = 0
  high = 0
  process(x: number, cutoff: number, q = 0.707) {
    const fc = Math.min(Math.max(cutoff, 10), SR * 0.49)
    const g = Math.tan((Math.PI * fc) / SR)
    const k = 1 / q
    const a1 = 1 / (1 + g * (g + k))
    const a2 = g * a1
    const a3 = g * a2
    const v3 = x - this.ic2
    const v1 = a1 * this.ic1 + a2 * v3
    const v2 = this.ic2 + a2 * this.ic1 + a3 * v3
    this.ic1 = 2 * v1 - this.ic1
    this.ic2 = 2 * v2 - this.ic2
    this.low = v2
    this.band = v1
    this.high = x - k * v1 - v2
    return v2
  }
}

export type BiquadType = 'lowpass' | 'highpass' | 'bandpass' | 'peaking' | 'lowshelf' | 'highshelf'

/** RBJ cookbook biquad, transposed direct form II. */
export class Biquad {
  private b0 = 1
  private b1 = 0
  private b2 = 0
  private a1 = 0
  private a2 = 0
  private z1 = 0
  private z2 = 0
  constructor(type: BiquadType, freq: number, q = 0.707, gainDb = 0) {
    const w = (2 * Math.PI * freq) / SR
    const cos = Math.cos(w)
    const alpha = Math.sin(w) / (2 * q)
    const A = Math.pow(10, gainDb / 40)
    let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number
    switch (type) {
      case 'lowpass':
        b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = b0
        a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha
        break
      case 'highpass':
        b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = b0
        a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha
        break
      case 'bandpass':
        b0 = alpha; b1 = 0; b2 = -alpha
        a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha
        break
      case 'peaking':
        b0 = 1 + alpha * A; b1 = -2 * cos; b2 = 1 - alpha * A
        a0 = 1 + alpha / A; a1 = -2 * cos; a2 = 1 - alpha / A
        break
      case 'lowshelf':
      case 'highshelf': {
        const s = type === 'lowshelf' ? 1 : -1
        const sq = 2 * Math.sqrt(A) * alpha
        b0 = A * (A + 1 - s * (A - 1) * cos + sq)
        b1 = 2 * s * A * (A - 1 - s * (A + 1) * cos)
        b2 = A * (A + 1 - s * (A - 1) * cos - sq)
        a0 = A + 1 + s * (A - 1) * cos + sq
        a1 = -2 * s * (A - 1 + s * (A + 1) * cos)
        a2 = A + 1 + s * (A - 1) * cos - sq
        break
      }
    }
    this.b0 = b0 / a0
    this.b1 = b1 / a0
    this.b2 = b2 / a0
    this.a1 = a1 / a0
    this.a2 = a2 / a0
  }
  process(x: number) {
    const y = this.b0 * x + this.z1
    this.z1 = this.b1 * x - this.a1 * y + this.z2
    this.z2 = this.b2 * x - this.a2 * y
    return y
  }
  run(buf: Float32Array) {
    for (let i = 0; i < buf.length; i++) buf[i] = this.process(buf[i]!)
    return buf
  }
}

export function filterStereo(bus: Stereo, make: () => Biquad) {
  make().run(bus.L)
  make().run(bus.R)
  return bus
}

/* ---------- envelopes & shaping ---------- */

/** Linear attack, exponential decay; `tau` is the decay time constant in seconds. */
export function attackDecay(t: number, attack: number, tau: number) {
  if (t < 0) return 0
  if (t < attack) return t / attack
  return Math.exp(-(t - attack) / tau)
}

/** ADSR with linear segments; `hold` is the note length before release. */
export function adsr(t: number, a: number, d: number, s: number, r: number, hold: number) {
  if (t < 0) return 0
  let level: number
  if (t < a) level = t / a
  else if (t < a + d) level = 1 - ((t - a) / d) * (1 - s)
  else level = s
  if (t > hold) {
    const held = hold < a ? hold / a : hold < a + d ? 1 - ((hold - a) / d) * (1 - s) : s
    level = held * Math.max(0, 1 - (t - hold) / r)
  }
  return level
}

export const softClip = (x: number, drive = 1) => Math.tanh(x * drive) / Math.tanh(drive)

/** Short fades so no rendered voice starts or ends on a discontinuity. */
export function declick(buf: Float32Array, fadeSamples = 96) {
  const n = Math.min(fadeSamples, Math.floor(buf.length / 2))
  for (let i = 0; i < n; i++) {
    const g = i / n
    buf[i]! *= g
    buf[buf.length - 1 - i]! *= g
  }
  return buf
}

/* ---------- time-based effects ---------- */

class Comb {
  private buf: Float32Array
  private idx = 0
  private store = 0
  constructor(size: number, private feedback: number, private damp: number) {
    this.buf = new Float32Array(size)
  }
  process(x: number) {
    const out = this.buf[this.idx]!
    this.store = out * (1 - this.damp) + this.store * this.damp
    this.buf[this.idx] = x + this.store * this.feedback
    this.idx = (this.idx + 1) % this.buf.length
    return out
  }
}

class Allpass {
  private buf: Float32Array
  private idx = 0
  constructor(size: number) {
    this.buf = new Float32Array(size)
  }
  process(x: number) {
    const b = this.buf[this.idx]!
    this.buf[this.idx] = x + b * 0.5
    this.idx = (this.idx + 1) % this.buf.length
    return b - x
  }
}

const COMB_TUNING = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617]
const ALLPASS_TUNING = [556, 441, 341, 225]

/** Freeverb (Jezar), tunings scaled from 44.1k. Returns a 100% wet stereo signal. */
export function reverb(
  input: Stereo,
  { room = 0.84, damp = 0.35, width = 1, preDelay = 0.012 }: { room?: number; damp?: number; width?: number; preDelay?: number } = {},
): Stereo {
  const k = SR / 44100
  const spread = 23
  const make = (offset: number) => ({
    combs: COMB_TUNING.map((t) => new Comb(Math.round((t + offset) * k), room, damp)),
    allpasses: ALLPASS_TUNING.map((t) => new Allpass(Math.round((t + offset) * k))),
  })
  const left = make(0)
  const right = make(spread)
  const n = input.L.length
  const out = stereo(n)
  const pd = Math.round(preDelay * SR)
  const wet1 = width / 2 + 0.5
  const wet2 = (1 - width) / 2
  for (let i = 0; i < n; i++) {
    const src = i - pd
    const x = src >= 0 ? (input.L[src]! + input.R[src]!) * 0.015 : 0
    let l = 0
    let r = 0
    for (const c of left.combs) l += c.process(x)
    for (const c of right.combs) r += c.process(x)
    for (const a of left.allpasses) l = a.process(l)
    for (const a of right.allpasses) r = a.process(r)
    out.L[i] = l * wet1 + r * wet2
    out.R[i] = r * wet1 + l * wet2
  }
  return out
}

/** Tempo-synced ping-pong delay with a darkening feedback path. Returns 100% wet. */
export function pingPong(input: Stereo, delaySeconds: number, feedback = 0.42, toneHz = 4500): Stereo {
  const d = Math.round(delaySeconds * SR)
  const n = input.L.length
  const out = stereo(n)
  const bufL = new Float32Array(d)
  const bufR = new Float32Array(d)
  const lpL = new Biquad('lowpass', toneHz)
  const lpR = new Biquad('lowpass', toneHz)
  let idx = 0
  for (let i = 0; i < n; i++) {
    const dl = bufL[idx]!
    const dr = bufR[idx]!
    const mono = (input.L[i]! + input.R[i]!) * 0.5
    bufL[idx] = mono + lpR.process(dr) * feedback
    bufR[idx] = lpL.process(dl) * feedback
    out.L[i] = dl
    out.R[i] = dr
    idx = (idx + 1) % d
  }
  return out
}

/**
 * Trigger-driven sidechain: gain dips at each trigger time and recovers exponentially.
 * Deterministic, and phase-locked to the grid instead of an envelope follower.
 */
export function sidechainCurve(length: number, triggers: number[], depth: number, release: number, attack = 0.004) {
  const curve = new Float32Array(length).fill(1)
  for (const t of triggers) {
    const start = Math.round((t - attack) * SR)
    const end = Math.min(length, Math.round((t + release * 5) * SR))
    for (let i = Math.max(0, start); i < end; i++) {
      const dt = i / SR - t
      const env = dt < 0 ? 1 + dt / attack : Math.exp(-dt / release)
      const g = 1 - depth * Math.max(0, env)
      if (g < curve[i]!) curve[i] = g
    }
  }
  return curve
}

export function applyCurve(bus: Stereo, curve: Float32Array) {
  for (let i = 0; i < bus.L.length; i++) {
    bus.L[i]! *= curve[i]!
    bus.R[i]! *= curve[i]!
  }
  return bus
}
