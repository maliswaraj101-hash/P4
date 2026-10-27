import { SR, gainToDb, type Stereo } from './dsp'

/** ITU-R BS.1770-4 K-weighting coefficients for 48 kHz. */
const PRE = { b: [1.53512485958697, -2.69169618940638, 1.19839281085285], a: [-1.69065929318241, 0.73248077421585] }
const RLB = { b: [1.0, -2.0, 1.0], a: [-1.99004745483398, 0.99007225036621] }

function biquad(x: Float32Array, { b, a }: { b: number[]; a: number[] }) {
  const y = new Float64Array(x.length)
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0
  for (let i = 0; i < x.length; i++) {
    const v = b[0]! * x[i]! + b[1]! * x1 + b[2]! * x2 - a[0]! * y1 - a[1]! * y2
    x2 = x1; x1 = x[i]!
    y2 = y1; y1 = v
    y[i] = v
  }
  return y
}

function kWeighted(ch: Float32Array) {
  const pre = biquad(ch, PRE)
  return biquad(Float32Array.from(pre), RLB)
}

/** Integrated loudness (LUFS) with absolute (-70) and relative (-10 LU) gating. */
export function integratedLufs(bus: Stereo) {
  if (SR !== 48000) throw new Error('K-weighting coefficients are for 48 kHz')
  const channels = [kWeighted(bus.L), kWeighted(bus.R)]
  const block = Math.round(0.4 * SR)
  const step = Math.round(0.1 * SR)
  const powers: number[] = []
  for (let start = 0; start + block <= bus.L.length; start += step) {
    let sum = 0
    for (const ch of channels) {
      let ms = 0
      for (let i = start; i < start + block; i++) ms += ch[i]! * ch[i]!
      sum += ms / block
    }
    powers.push(sum)
  }
  const lufs = (p: number) => -0.691 + 10 * Math.log10(p)
  const absGated = powers.filter((p) => lufs(p) > -70)
  if (absGated.length === 0) return -Infinity
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length
  const relThreshold = lufs(mean(absGated)) - 10
  const gated = absGated.filter((p) => lufs(p) > relThreshold)
  return lufs(mean(gated))
}

/** Short-term (3 s) loudness curve, one value per second, for the report. */
export function shortTermCurve(bus: Stereo) {
  const channels = [kWeighted(bus.L), kWeighted(bus.R)]
  const win = 3 * SR
  const out: number[] = []
  for (let end = SR; end <= bus.L.length; end += SR) {
    const start = Math.max(0, end - win)
    let sum = 0
    for (const ch of channels) {
      let ms = 0
      for (let i = start; i < end; i++) ms += ch[i]! * ch[i]!
      sum += ms / (end - start)
    }
    out.push(Math.round((-0.691 + 10 * Math.log10(sum)) * 10) / 10)
  }
  return out
}

const OVERSAMPLE = 4
const HALF_TAPS = 16

/** Windowed-sinc polyphase taps for 4x interpolation. */
const PHASES = Array.from({ length: OVERSAMPLE - 1 }, (_, p) => {
  const frac = (p + 1) / OVERSAMPLE
  const taps = new Float64Array(HALF_TAPS * 2)
  for (let k = -HALF_TAPS + 1; k <= HALF_TAPS; k++) {
    const t = k - frac
    const sinc = t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t)
    const w = 0.42 + 0.5 * Math.cos((Math.PI * t) / HALF_TAPS) + 0.08 * Math.cos((2 * Math.PI * t) / HALF_TAPS)
    taps[k + HALF_TAPS - 1] = sinc * w
  }
  return taps
})

/** True peak in dBTP via 4x oversampling. */
export function truePeakDb(bus: Stereo) {
  let peak = 0
  for (const ch of [bus.L, bus.R]) {
    const n = ch.length
    for (let i = 0; i < n; i++) {
      const s = Math.abs(ch[i]!)
      if (s > peak) peak = s
      for (const taps of PHASES) {
        let acc = 0
        for (let k = -HALF_TAPS + 1; k <= HALF_TAPS; k++) {
          const j = i + k
          if (j >= 0 && j < n) acc += ch[j]! * taps[k + HALF_TAPS - 1]!
        }
        const a = Math.abs(acc)
        if (a > peak) peak = a
      }
    }
  }
  return gainToDb(peak)
}
