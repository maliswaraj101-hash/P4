import { addMono, addStereo, mixInto, reverb, secondsToSamples, stereo, type Stereo } from './dsp'
import { frameToSeconds, type Cue } from './cues'
import { snap, type Grid } from './grid'
import { bell, crash, keyClick, kick, pop, subBoom, thump, tick, whoosh } from './instruments'

export type Placement = {
  id: string
  kind: Cue['kind']
  res: Cue['res']
  visualTime: number
  hitTime: number
  offsetMs: number
}

export type SfxResult = { bus: Stereo; placements: Placement[]; impacts: number[] }

/** Renders every cue at its snapped position on the measured grid. */
export function renderSfx(cues: Cue[], grid: Grid, lengthSamples: number): SfxResult {
  const dry = stereo(lengthSamples)
  const send = stereo(lengthSamples)
  const placements: Placement[] = []
  const impacts: number[] = []

  const mono = (buf: Float32Array, t: number, gain: number, pan = 0, wet = 0) => {
    addMono(dry, buf, secondsToSamples(t), gain, pan)
    if (wet) addMono(send, buf, secondsToSamples(t), gain * wet, pan)
  }
  const wide = (buf: Stereo, t: number, gain: number, wet = 0) => {
    addStereo(dry, buf, secondsToSamples(t), gain)
    if (wet) addStereo(send, buf, secondsToSamples(t), gain * wet)
  }

  for (const cue of cues) {
    const visualTime = frameToSeconds(cue.frame)
    const hit = snap(grid, visualTime, cue.res)
    placements.push({
      id: cue.id,
      kind: cue.kind,
      res: cue.res,
      visualTime: Math.round(visualTime * 1e4) / 1e4,
      hitTime: Math.round(hit * 1e4) / 1e4,
      offsetMs: Math.round((hit - visualTime) * 1e4) / 10,
    })

    const note = cue.note ?? 81
    switch (cue.kind) {
      case 'bloom':
        mono(bell(81, 2.6, 0.9), hit, 0.16, -0.15, 0.6)
        mono(bell(88, 2.6, 0.7), hit, 0.1, 0.2, 0.6)
        mono(subBoom(55, 1.1), hit, 0.18)
        break
      case 'key':
      case 'space':
        mono(keyClick(cue.id, cue.kind === 'space'), hit, 0.32, ((cue.frame % 7) - 3) * 0.08, 0.08)
        break
      case 'tick':
        mono(tick(note, cue.id), hit, 0.2, 0, 0.2)
        break
      case 'pop':
        mono(pop(note), hit, 0.26, 0, 0.25)
        mono(bell(note + 12, 0.8, 0.5), hit, 0.05, 0.3, 0.4)
        break
      case 'bell':
        mono(bell(note + 12, 1.8, 0.8), hit, 0.09, ((cue.frame % 5) - 2) * 0.25, 0.6)
        break
      case 'impact':
        impacts.push(hit)
        mono(subBoom(49, 2.4), hit, 0.55)
        mono(kick(`impact-${cue.id}`, 1), hit, 0.5)
        wide(crash(cue.id), hit, 0.2, 0.35)
        break
      case 'whoosh': {
        const w = whoosh(cue.id, { pre: 0.75, post: 0.6 })
        wide(w.buf, hit - w.peak, 0.3, 0.3)
        break
      }
      case 'swipe': {
        const w = whoosh(cue.id, { pre: 0.28, post: 0.3, fromHz: 700, toHz: 3800, panFrom: 0.2, panTo: -0.2, q: 2 })
        wide(w.buf, hit - w.peak, 0.16, 0.15)
        break
      }
      case 'focus': {
        const w = whoosh(cue.id, { pre: 0.4, post: 0.45, fromHz: 300, toHz: 2400, panFrom: 0.6, panTo: -0.4 })
        wide(w.buf, hit - w.peak, 0.2, 0.25)
        mono(thump(1), hit, 0.45)
        break
      }
    }
  }

  const verb = reverb(send, { room: 0.8, damp: 0.4, preDelay: 0.015 })
  const bus = stereo(lengthSamples)
  mixInto(bus, dry, 1)
  mixInto(bus, verb, 0.8)
  return { bus, placements, impacts }
}
