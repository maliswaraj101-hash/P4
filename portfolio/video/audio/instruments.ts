import {
  Biquad,
  Osc,
  SR,
  SVF,
  adsr,
  attackDecay,
  declick,
  midiToHz,
  softClip,
  stereo,
  type Stereo,
} from './dsp'
import { bipolar, noise, range, rng } from './prng'

const len = (seconds: number) => Math.round(seconds * SR)

/* ---------- drums ---------- */

export function kick(label: string, vel = 1) {
  const n = len(0.55)
  const out = new Float32Array(n)
  const body = new Osc('sine')
  const click = noise(len(0.01), `kick/${label}`)
  const clickHp = new Biquad('highpass', 2500)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const f = 46 + 120 * Math.exp(-t / 0.028) + 260 * Math.exp(-t / 0.004)
    const amp = attackDecay(t, 0.0015, 0.2) * (t < 0.3 ? 1 : Math.exp(-(t - 0.3) / 0.06))
    let v = body.next(f) * amp
    if (i < click.length) v += clickHp.process(click[i]!) * Math.exp(-t / 0.0025) * 0.35
    out[i] = softClip(v * 1.4, 1.6) * vel
  }
  return declick(out)
}

export function clap(label: string, vel = 1) {
  const n = len(0.5)
  const src = noise(n, `clap/${label}`)
  const bp = new SVF()
  const body = new Osc('sine')
  const out = new Float32Array(n)
  const bursts = [0, 0.0105, 0.0215, 0.031]
  for (let i = 0; i < n; i++) {
    const t = i / SR
    let env = 0
    for (let b = 0; b < bursts.length - 1; b++) {
      const dt = t - bursts[b]!
      if (dt >= 0) env = Math.max(env, Math.exp(-dt / 0.0045))
    }
    const tailT = t - bursts[bursts.length - 1]!
    if (tailT >= 0) env = Math.max(env, Math.exp(-tailT / 0.14) * 0.85)
    bp.process(src[i]!, 1350, 1.1)
    const tone = body.next(195 - 30 * Math.min(1, t / 0.05)) * Math.exp(-t / 0.045) * 0.35
    out[i] = (bp.band * 2.2 * env + tone) * vel
  }
  return declick(out)
}

export function snare(label: string, vel = 1) {
  const n = len(0.3)
  const src = noise(n, `snare/${label}`)
  const hp = new Biquad('highpass', 1800)
  const body = new Osc('triangle')
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const tone = body.next(185 + 60 * Math.exp(-t / 0.01)) * Math.exp(-t / 0.05) * 0.6
    const rattle = hp.process(src[i]!) * attackDecay(t, 0.001, 0.09)
    out[i] = (tone + rattle) * vel * 0.8
  }
  return declick(out)
}

const HAT_RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21]

export function hat(label: string, open: boolean, vel = 1) {
  const n = len(open ? 0.6 : 0.12)
  const src = noise(n, `hat/${label}`)
  const oscs = HAT_RATIOS.map((r, i) => new Osc('square', i / HAT_RATIOS.length))
  const bp = new Biquad('bandpass', 10000, 0.9)
  const hp = new Biquad('highpass', 7200)
  const tau = open ? 0.22 : 0.028
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    let metal = 0
    for (let k = 0; k < oscs.length; k++) metal += oscs[k]!.next(HAT_RATIOS[k]! * 410)
    const v = bp.process(metal / oscs.length) * 0.7 + src[i]! * 0.5
    out[i] = hp.process(v) * attackDecay(t, 0.0008, tau) * vel
  }
  return declick(out)
}

export function shaker(label: string, vel = 1) {
  const n = len(0.09)
  const src = noise(n, `shaker/${label}`)
  const bp = new Biquad('bandpass', 5600, 1.4)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    out[i] = bp.process(src[i]!) * attackDecay(t, 0.012, 0.025) * vel
  }
  return declick(out)
}

export function crash(label: string, seconds = 2.6): Stereo {
  const n = len(seconds)
  const out = stereo(n)
  for (const [side, ch] of [['l', out.L], ['r', out.R]] as const) {
    const src = noise(n, `crash/${label}/${side}`)
    const r = rng(`crash/${label}/${side}/partials`)
    const partials = Array.from({ length: 9 }, () => ({ osc: new Osc('square', r()), f: range(r, 380, 1400) }))
    const hp = new Biquad('highpass', 4200)
    const shelf = new Biquad('highshelf', 9000, 0.7, 3)
    for (let i = 0; i < n; i++) {
      const t = i / SR
      let metal = 0
      for (const p of partials) metal += p.osc.next(p.f)
      const v = hp.process(src[i]! * 0.8 + (metal / partials.length) * 0.5)
      ch[i] = shelf.process(v) * attackDecay(t, 0.001, 0.75)
    }
    declick(ch)
  }
  return out
}

/* ---------- tonal instruments ---------- */

export function bassNote(midi: number, seconds: number, vel = 1) {
  const n = len(seconds + 0.08)
  const f = midiToHz(midi)
  const sub = new Osc('sine')
  const saw = new Osc('saw')
  const lp = new SVF()
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const env = adsr(t, 0.004, 0.12, 0.75, 0.06, seconds)
    const cutoff = 180 + 1400 * Math.exp(-t / 0.07)
    const growl = lp.process(saw.next(f), cutoff, 0.9)
    const v = sub.next(f / 2) * 0.9 + growl * 0.55
    out[i] = softClip(v * env * 1.3, 1.8) * vel
  }
  return declick(out, 48)
}

/** Detuned 4-voice supersaw pad with a slowly breathing filter. */
export function padChord(label: string, notes: number[], seconds: number, { attack = 0.6, release = 0.9, brightness = 1 } = {}): Stereo {
  const n = len(seconds + release)
  const out = stereo(n)
  const r = rng(`pad/${label}`)
  for (const midi of notes) {
    for (let v = 0; v < 4; v++) {
      const detune = Math.pow(2, range(r, -11, 11) / 1200)
      const f = midiToHz(midi) * detune
      const osc = new Osc('saw', r())
      const lp = new SVF()
      const pan = v % 2 === 0 ? range(r, -0.9, -0.3) : range(r, 0.3, 0.9)
      const gl = Math.cos(((pan + 1) * Math.PI) / 4)
      const gr = Math.sin(((pan + 1) * Math.PI) / 4)
      const lfoPhase = r() * Math.PI * 2
      for (let i = 0; i < n; i++) {
        const t = i / SR
        const env = adsr(t, attack, 0.8, 0.8, release, seconds)
        if (env === 0 && t > attack) continue
        const cutoff = (900 + 700 * Math.sin(lfoPhase + t * 2 * Math.PI * 0.13)) * brightness
        const s = lp.process(osc.next(f), cutoff, 0.8) * env * 0.12
        out.L[i]! += s * gl
        out.R[i]! += s * gr
      }
    }
  }
  return out
}

/** Two-operator FM electric piano. */
export function epNote(midi: number, seconds: number, vel = 1) {
  const n = len(seconds + 0.6)
  const f = midiToHz(midi)
  const out = new Float32Array(n)
  let cPhase = 0
  let mPhase = 0
  let tPhase = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const index = 1.6 * Math.exp(-t / 0.3) * vel + 0.2
    const mod = Math.sin(2 * Math.PI * mPhase) * index
    const tine = Math.sin(2 * Math.PI * tPhase) * 0.12 * Math.exp(-t / 0.012)
    const env = attackDecay(t, 0.002, 0.9) * (t > seconds ? Math.max(0, 1 - (t - seconds) / 0.5) : 1)
    out[i] = (Math.sin(2 * Math.PI * cPhase + mod) + tine) * env * vel
    cPhase = (cPhase + f / SR) % 1
    mPhase = (mPhase + f / SR) % 1
    tPhase = (tPhase + (f * 14) / SR) % 1
  }
  return declick(out)
}

/** Karplus-Strong plucked string with a seeded noise excitation. */
export function pluck(label: string, midi: number, seconds = 1.4, bright = 0.55) {
  const n = len(seconds)
  const f = midiToHz(midi)
  const delay = SR / f
  const size = Math.ceil(delay) + 2
  const line = new Float32Array(size)
  const r = rng(`pluck/${label}`)
  const lp = new Biquad('lowpass', 1500 + bright * 7000)
  for (let i = 0; i < size; i++) line[i] = lp.process(bipolar(r))
  const out = new Float32Array(n)
  let w = 0
  let prev = 0
  const decay = 0.9965
  for (let i = 0; i < n; i++) {
    const readPos = (w - delay + size * 4) % size
    const i0 = Math.floor(readPos)
    const frac = readPos - i0
    const s = line[i0 % size]! * (1 - frac) + line[(i0 + 1) % size]! * frac
    const filtered = (s + prev) * 0.5 * decay
    prev = s
    line[w] = filtered
    w = (w + 1) % size
    out[i] = s
  }
  return declick(out, 480)
}

export function leadNote(label: string, midi: number, seconds: number, vel = 1) {
  const n = len(seconds + 0.25)
  const f = midiToHz(midi)
  const r = rng(`lead/${label}`)
  const a = new Osc('saw', r())
  const b = new Osc('saw', r())
  const sq = new Osc('square', r())
  const lp = new SVF()
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const vibrato = 1 + 0.003 * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, t / 0.3)
    const env = adsr(t, 0.006, 0.18, 0.55, 0.2, seconds)
    const osc = a.next(f * 1.004 * vibrato) + b.next(f * 0.996 * vibrato) + sq.next((f / 2) * vibrato) * 0.35
    const cutoff = 900 + 3800 * Math.exp(-t / 0.12)
    out[i] = lp.process(osc * 0.4, cutoff, 1.1) * env * vel
  }
  return declick(out)
}

/* ---------- sound design ---------- */

export function subBoom(f0 = 55, seconds = 2.2) {
  const n = len(seconds)
  const osc = new Osc('sine')
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const f = f0 * (1 + 1.4 * Math.exp(-t / 0.05))
    out[i] = softClip(osc.next(f) * attackDecay(t, 0.002, 0.55) * 1.2, 1.4)
  }
  return declick(out)
}

/** Band-passed noise sweep that swells into `peak` seconds, panning across the field. */
export function whoosh(
  label: string,
  { pre = 0.7, post = 0.5, fromHz = 250, toHz = 5200, panFrom = -0.7, panTo = 0.7, q = 1.4 } = {},
): { buf: Stereo; peak: number } {
  const n = len(pre + post)
  const src = noise(n, `whoosh/${label}`)
  const svf = new SVF()
  const out = stereo(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const x = t < pre ? t / pre : 1 + (t - pre) / post
    const f = x <= 1 ? fromHz * Math.pow(toHz / fromHz, x * x) : toHz * Math.pow(0.5, x - 1)
    const env = t < pre ? Math.pow(t / pre, 2.4) : Math.exp(-(t - pre) / (post * 0.3))
    svf.process(src[i]!, f, q)
    const v = (svf.band * 1.2 + svf.low * 0.25) * env
    const pan = panFrom + (panTo - panFrom) * Math.min(1, t / (pre + post * 0.5))
    const angle = ((pan + 1) * Math.PI) / 4
    out.L[i] = v * Math.cos(angle) * Math.SQRT2
    out.R[i] = v * Math.sin(angle) * Math.SQRT2
  }
  declick(out.L)
  declick(out.R)
  return { buf: out, peak: pre }
}

/** Noise + saw riser that ends exactly at its last sample. */
export function riser(label: string, seconds: number): Stereo {
  const n = len(seconds)
  const out = stereo(n)
  for (const [side, ch] of [['l', out.L], ['r', out.R]] as const) {
    const src = noise(n, `riser/${label}/${side}`)
    const svf = new SVF()
    const saw = new Osc('saw', side === 'l' ? 0 : 0.5)
    const lp = new SVF()
    for (let i = 0; i < n; i++) {
      const x = i / n
      svf.process(src[i]!, 400 * Math.pow(22, x), 2.2)
      const pitch = midiToHz(45 + 24 * x * x) * (side === 'l' ? 0.997 : 1.003)
      const tone = lp.process(saw.next(pitch), 600 + 5000 * x, 0.9)
      ch[i] = (svf.band * 0.9 + tone * 0.25) * Math.pow(x, 2.2)
    }
    declick(ch, 240)
  }
  return out
}

/** Tuned UI pop: short pitch-dropping sine with a transient. */
export function pop(midi: number, vel = 1) {
  const n = len(0.35)
  const f = midiToHz(midi)
  const osc = new Osc('sine')
  const harm = new Osc('sine')
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const bend = 1 + 0.5 * Math.exp(-t / 0.012)
    const env = attackDecay(t, 0.0015, 0.07)
    out[i] = (osc.next(f * bend) + harm.next(f * 2 * bend) * 0.25 * Math.exp(-t / 0.02)) * env * vel
  }
  return declick(out, 24)
}

export function tick(midi: number, label: string, vel = 1) {
  const n = len(0.08)
  const f = midiToHz(midi)
  const osc = new Osc('sine')
  const src = noise(n, `tick/${label}`)
  const hp = new Biquad('highpass', 5000)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    out[i] = (osc.next(f) * Math.exp(-t / 0.014) + hp.process(src[i]!) * Math.exp(-t / 0.0018) * 0.6) * vel
  }
  return declick(out, 24)
}

/** Mechanical key: seeded click + thock body, with per-key variation. */
export function keyClick(label: string, space = false) {
  const n = len(0.07)
  const r = rng(`key/${label}`)
  const src = noise(n, `key/${label}/noise`)
  const bp = new Biquad('bandpass', space ? 1700 : range(r, 2600, 3800), 1.6)
  const body = new Osc('sine')
  const bodyHz = space ? 150 : range(r, 210, 270)
  const vel = range(r, 0.75, 1)
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const clickPart = bp.process(src[i]!) * Math.exp(-t / 0.004) * 1.4
    const thock = body.next(bodyHz * (1 + 0.3 * Math.exp(-t / 0.004))) * Math.exp(-t / (space ? 0.02 : 0.011)) * 0.7
    out[i] = (clickPart + thock) * vel
  }
  return declick(out, 24)
}

/** FM bell for shimmer and reveals. */
export function bell(midi: number, seconds = 2.2, vel = 1) {
  const n = len(seconds)
  const f = midiToHz(midi)
  const out = new Float32Array(n)
  let c = 0
  let m = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const index = 3.2 * Math.exp(-t / 0.25)
    out[i] = Math.sin(2 * Math.PI * c + Math.sin(2 * Math.PI * m) * index) * attackDecay(t, 0.002, 0.7) * vel
    c = (c + f / SR) % 1
    m = (m + (f * 3.5) / SR) % 1
  }
  return declick(out)
}

export function thump(vel = 1) {
  const n = len(0.35)
  const osc = new Osc('sine')
  const out = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    out[i] = osc.next(48 + 60 * Math.exp(-t / 0.03)) * attackDecay(t, 0.003, 0.1) * vel
  }
  return declick(out)
}
