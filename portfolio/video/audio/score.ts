import {
  SR,
  SVF,
  addMono,
  addStereo,
  applyCurve,
  mixInto,
  pingPong,
  reverb,
  reversed,
  secondsToSamples,
  sidechainCurve,
  stereo,
  type Stereo,
} from './dsp'
import { gridTime, type Grid } from './grid'
import {
  bassNote,
  clap,
  epNote,
  hat,
  kick,
  leadNote,
  padChord,
  pluck,
  riser,
  shaker,
  snare,
} from './instruments'
import { range, rng } from './prng'

type Chord = { name: string; bass: number; voicing: number[]; arp: number[] }

const CHORDS: Record<string, Chord> = {
  Am9: { name: 'Am9', bass: 45, voicing: [57, 60, 64, 67, 71], arp: [69, 72, 76, 79, 83, 79, 76, 72] },
  Fmaj9: { name: 'Fmaj9', bass: 41, voicing: [53, 57, 60, 64, 67], arp: [65, 69, 72, 76, 79, 76, 72, 69] },
  Cmaj9: { name: 'Cmaj9', bass: 48, voicing: [52, 55, 59, 62, 64], arp: [67, 71, 72, 76, 79, 76, 72, 71] },
  G69: { name: 'G6/9', bass: 43, voicing: [55, 59, 62, 64, 69], arp: [67, 69, 71, 74, 76, 74, 71, 69] },
}

const LOOP = [CHORDS.Am9!, CHORDS.Fmaj9!, CHORDS.Cmaj9!, CHORDS.G69!]
const OUTRO_CHORDS = [CHORDS.Fmaj9!, CHORDS.G69!, CHORDS.Am9!]

/** Lead motif, one bar per chord: [16th step, MIDI note, length in 16ths]. */
const MOTIF: Array<Array<[number, number, number]>> = [
  [[0, 76, 3], [3, 79, 3], [6, 81, 2], [8, 79, 2], [10, 76, 2], [12, 74, 4]],
  [[0, 72, 6], [6, 74, 2], [8, 76, 4], [12, 69, 4]],
  [[0, 79, 3], [3, 76, 3], [6, 74, 2], [8, 76, 4], [12, 79, 4]],
  [[0, 81, 6], [6, 79, 2], [8, 76, 2], [10, 74, 2], [12, 76, 4]],
]

/** Bass rhythm per bar: [16th step, length in 16ths, octave up]. */
const BASS_RHYTHM: Array<[number, number, boolean]> = [
  [0, 3, false], [3, 2, false], [6, 2, false], [10, 3, false], [14, 2, true],
]

export type ScoreSections = {
  firstBar: number
  siteBars: [number, number]
  projectBars: [number, number]
  outroBars: [number, number]
}

export const SECTIONS: ScoreSections = {
  firstBar: -3,
  siteBars: [0, 8],
  projectBars: [8, 12],
  outroBars: [12, 15],
}

export type ScoreResult = { bus: Stereo; kicks: number[]; stems: Record<string, Stereo> }

export function renderScore(grid: Grid, lengthSamples: number): ScoreResult {
  const stepSec = grid.period / 4
  const at = (bar: number, step = 0) => gridTime(grid, bar, step)
  const s = (t: number) => secondsToSamples(t)
  const inRange = (t: number) => t >= 0 && t < lengthSamples / SR

  const drums = stereo(lengthSamples)
  const bass = stereo(lengthSamples)
  const keys = stereo(lengthSamples)
  const pads = stereo(lengthSamples)
  const leads = stereo(lengthSamples)
  const fx = stereo(lengthSamples)
  const reverbSend = stereo(lengthSamples)
  const delaySend = stereo(lengthSamples)
  const kicks: number[] = []
  const vel = rng('score/velocity')

  const place = (bus: Stereo, buf: Float32Array, t: number, gain: number, pan = 0, send = 0, delay = 0) => {
    if (t + buf.length / SR < 0) return
    addMono(bus, buf, s(t), gain, pan)
    if (send) addMono(reverbSend, buf, s(t), gain * send, pan)
    if (delay) addMono(delaySend, buf, s(t), gain * delay, pan)
  }

  const [siteStart, siteEnd] = SECTIONS.siteBars
  const [projStart, projEnd] = SECTIONS.projectBars
  const [outroStart, outroEnd] = SECTIONS.outroBars

  /* ----- intro: pad bloom, arp, build ----- */
  const introPad = padChord('intro', CHORDS.Am9!.voicing, at(siteStart) + 0.2, { attack: 2.4, release: 1.2, brightness: 0.8 })
  addStereo(pads, introPad, 0, 0.9)
  addStereo(reverbSend, introPad, 0, 0.5)

  for (let bar = SECTIONS.firstBar; bar < siteStart; bar++) {
    for (let step = 0; step < 16; step += 2) {
      const t = at(bar, step)
      if (!inRange(t) || t < 0.35) continue
      const note = CHORDS.Am9!.arp[(step / 2) % 8]!
      const rise = Math.min(1, t / at(siteStart))
      place(leads, pluck(`intro-${bar}-${step}`, note, 1.2, 0.35 + rise * 0.3), t, 0.28 * (0.5 + rise * 0.5) * range(vel, 0.85, 1), step % 4 === 0 ? -0.35 : 0.35, 0.35, 0.4)
    }
  }
  // Snare build over the last beat into the site reveal.
  for (let k = 0; k < 8; k++) {
    const t = at(siteStart - 1, 12 + k * 0.5)
    place(drums, snare(`build-intro-${k}`, 0.35 + k * 0.08), t, 0.5, 0, 0.3)
  }
  const introRiserStart = at(siteStart - 1)
  addStereo(fx, riser('intro', at(siteStart) - introRiserStart), s(introRiserStart), 0.22)

  /* ----- groove: site walkthrough and projects ----- */
  const grooveBars = { from: siteStart, to: projEnd }
  for (let bar = grooveBars.from; bar < grooveBars.to; bar++) {
    const chord = LOOP[(bar - siteStart) % LOOP.length]!
    const inProjects = bar >= projStart
    const isFillBar = bar === projStart - 1 || bar === projEnd - 1
    const energy = inProjects ? 1 : bar >= 4 ? 0.85 : 0.7

    // Kick: half-time with a pickup variation every fourth bar.
    const kickSteps = bar % 4 === 3 ? [0, 7, 10] : [0, 10]
    for (const step of kickSteps) {
      if (isFillBar && step > 8) continue
      const t = at(bar, step)
      place(drums, kick(`${bar}-${step}`, step === 0 ? 1 : 0.85), t, 0.95)
      kicks.push(t)
    }

    // Clap on beat 3, with a snare layer in the projects section.
    place(drums, clap(`${bar}`), at(bar, 8), 0.55, 0, 0.3)
    if (inProjects) place(drums, snare(`layer-${bar}`, 0.6), at(bar, 8), 0.35, 0, 0.2)

    // Hats: 8ths, ghost 16ths, open hat on the off-beat in projects.
    for (let step = 0; step < 16; step++) {
      if (isFillBar && step >= 12) break
      const offbeat = step % 4 === 2
      const eighth = step % 2 === 0
      const t = at(bar, step)
      const jitter = range(vel, 0.85, 1.05)
      const pan = eighth ? 0.25 : -0.3
      if (eighth) place(drums, hat(`${bar}-${step}`, false, offbeat ? 0.9 : 0.6), t, 0.26 * jitter * energy, pan)
      else if (step % 4 === 3 || inProjects) place(drums, hat(`${bar}-${step}-ghost`, false, 0.35), t, 0.2 * jitter * energy, pan)
      if (inProjects && offbeat) place(drums, hat(`${bar}-${step}-open`, true, 0.5), t, 0.12 * jitter, 0.4, 0.15)
      if (bar >= 4) place(drums, shaker(`${bar}-${step}`, eighth ? 0.6 : 1), t + stepSec * 0.04, 0.09 * jitter, -0.5)
    }

    // Fills into bars 8 and 12.
    if (isFillBar) {
      for (let k = 0; k < 8; k++) {
        const t = at(bar, 12 + k * 0.5)
        place(drums, snare(`fill-${bar}-${k}`, 0.4 + k * 0.08), t, 0.55, (k % 2 ? 0.2 : -0.2), 0.3)
      }
      const riserStart = at(bar, 8)
      addStereo(fx, riser(`fill-${bar}`, at(bar + 1) - riserStart), s(riserStart), 0.18)
    }

    // Bass.
    for (const [step, length, up] of BASS_RHYTHM) {
      if (isFillBar && step >= 12) continue
      const note = chord.bass + (up ? 12 : 0)
      place(bass, bassNote(note, length * stepSec * 0.92, step === 0 ? 1 : 0.85), at(bar, step), 0.55)
    }

    // Keys: off-beat chord stabs.
    for (const step of [2, 7, 11]) {
      const t = at(bar, step)
      for (const [i, midi] of chord.voicing.entries()) {
        place(keys, epNote(midi + 12, stepSec * 1.6, 0.7), t, 0.07 * energy, (i - 2) * 0.25, 0.25, 0.1)
      }
    }

    // Pad bed.
    const pad = padChord(`bar-${bar}`, chord.voicing, grid.period * 4, { attack: 0.08, release: 0.5, brightness: inProjects ? 1.5 : 1.1 })
    addStereo(pads, pad, s(at(bar)), 0.5)
    addStereo(reverbSend, pad, s(at(bar)), 0.25)

    // Arp from bar 4, lead motif in projects.
    if (bar >= 4) {
      for (let step = 0; step < 16; step++) {
        const note = chord.arp[step % 8]! + (step >= 8 ? 12 : 0)
        const t = at(bar, step)
        place(leads, pluck(`arp-${bar}-${step}`, note, 0.9, inProjects ? 0.7 : 0.5), t, 0.16 * range(vel, 0.8, 1), step % 2 ? 0.45 : -0.45, 0.25, 0.35)
      }
    }
    if (inProjects) {
      for (const [step, note, length] of MOTIF[(bar - projStart) % MOTIF.length]!) {
        place(leads, leadNote(`${bar}-${step}`, note, length * stepSec * 0.95), at(bar, step), 0.16, 0, 0.3, 0.3)
      }
    }
  }

  // Reverse swell into the outro downbeat.
  {
    const swellSrc = stereo(secondsToSamples(2.4))
    for (const midi of CHORDS.Fmaj9!.voicing) addMono(swellSrc, epNote(midi + 12, 0.3, 0.9), 0, 0.2)
    const tail = reverb(swellSrc, { room: 0.9, damp: 0.25 })
    const end = at(outroStart)
    const revL = reversed(tail.L)
    const revR = reversed(tail.R)
    addStereo(fx, { L: revL, R: revR }, s(end) - revL.length, 1.4)
  }

  /* ----- outro: resolution with a closing filter ----- */
  for (let bar = outroStart; bar < outroEnd; bar++) {
    const chord = OUTRO_CHORDS[bar - outroStart]!
    const last = bar === outroEnd - 1
    const t0 = at(bar)
    const kickT = t0
    place(drums, kick(`outro-${bar}`, last ? 0.8 : 1), kickT, 0.9)
    kicks.push(kickT)
    if (!last) {
      place(drums, clap(`outro-${bar}`), at(bar, 8), 0.4, 0, 0.4)
      for (let step = 0; step < 16; step += 2) place(drums, hat(`outro-${bar}-${step}`, false, 0.6), at(bar, step), 0.18, 0.25)
      for (const [step, length, up] of BASS_RHYTHM.slice(0, 3)) {
        place(bass, bassNote(chord.bass + (up ? 12 : 0), length * stepSec * 0.92), at(bar, step), 0.5)
      }
    } else {
      place(bass, bassNote(chord.bass, grid.period * 3), t0, 0.5)
    }
    const hold = last ? grid.period * 4 + 0.4 : grid.period * 4
    const pad = padChord(`outro-${bar}`, chord.voicing, hold, { attack: 0.05, release: last ? 1.0 : 0.5, brightness: 1.2 })
    addStereo(pads, pad, s(t0), 0.6)
    addStereo(reverbSend, pad, s(t0), 0.4)
    for (const [i, midi] of chord.voicing.entries()) {
      place(keys, epNote(midi + 12, last ? 1.6 : stepSec * 6, 0.8), t0, 0.08, (i - 2) * 0.3, 0.4, 0.2)
    }
    for (let step = 0; step < 16; step += last ? 4 : 2) {
      const note = chord.arp[(step / 2) % 8]!
      place(leads, pluck(`outro-${bar}-${step}`, note + 12, 1.2, 0.4), at(bar, step), 0.14, step % 4 ? 0.4 : -0.4, 0.4, 0.4)
    }
  }

  /* ----- buses ----- */
  const pumpBass = sidechainCurve(lengthSamples, kicks, 0.65, 0.09)
  const pumpMusic = sidechainCurve(lengthSamples, kicks, 0.3, 0.14)
  applyCurve(bass, pumpBass)
  applyCurve(pads, pumpMusic)
  applyCurve(keys, pumpMusic)

  const verb = reverb(reverbSend, { room: 0.86, damp: 0.3, preDelay: 0.02 })
  const echoes = pingPong(delaySend, grid.period * 0.75, 0.4)

  const bus = stereo(lengthSamples)
  mixInto(bus, drums, 1)
  mixInto(bus, bass, 1)
  mixInto(bus, keys, 1)
  mixInto(bus, pads, 1)
  mixInto(bus, leads, 1)
  mixInto(bus, fx, 1)
  mixInto(bus, verb, 0.9)
  mixInto(bus, echoes, 0.5)

  closeFilter(bus, at(outroStart), lengthSamples / SR)

  return { bus, kicks, stems: { drums, bass, keys, pads, leads, fx } }
}

/**
 * Low-pass the music bus from `from` to the end: 18 kHz down to 1.2 kHz on an exponential curve.
 * The filter runs (wide open) from sample 0 so its state is settled when the sweep begins.
 */
function closeFilter(bus: Stereo, from: number, to: number) {
  const start = Math.max(0, secondsToSamples(from))
  const end = bus.L.length
  const left = new SVF()
  const right = new SVF()
  for (let i = 0; i < end; i++) {
    const x = Math.max(0, (i - start) / (secondsToSamples(to) - start))
    const cutoff = i < start ? 22000 : 18000 * Math.pow(1200 / 18000, x * x)
    bus.L[i] = left.process(bus.L[i]!, cutoff, 0.6)
    bus.R[i] = right.process(bus.R[i]!, cutoff, 0.6)
  }
}
