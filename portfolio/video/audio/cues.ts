import { site } from '../../src/data/site'
import { projects } from '../../src/data/projects'
import { FPS, INTRO, OUTRO, PROJECTS, SCENES, SITE } from '../src/timeline'

export type Resolution = 'bar' | 'beat' | '8th' | '16th' | '32nd'

export type CueKind =
  | 'bloom'
  | 'key'
  | 'space'
  | 'tick'
  | 'impact'
  | 'whoosh'
  | 'swipe'
  | 'focus'
  | 'pop'
  | 'bell'

export type Cue = {
  id: string
  kind: CueKind
  /** Absolute video frame of the visual event this sound belongs to. */
  frame: number
  res: Resolution
  /** How much this cue pulls on the tempo fit. */
  weight: number
  /** MIDI note for tuned UI sounds. */
  note?: number
}

const A_MINOR_PENTATONIC = [69, 72, 74, 76, 79, 81, 84, 86, 88]

/** Every visual accent in the video, derived from the same constants the scenes animate with. */
export function buildCues(): Cue[] {
  const cues: Cue[] = []
  const push = (c: Cue) => cues.push(c)

  // Intro: mark reveal, typed name, flip sentences.
  push({ id: 'intro/mark', kind: 'bloom', frame: SCENES.intro.from, res: '16th', weight: 2 })
  const name = site.fullName
  for (let k = 1; k <= name.length; k++) {
    const frame = INTRO.typeStart + ((k - 0.5) / name.length) * (INTRO.typeEnd - INTRO.typeStart)
    push({
      id: `intro/key-${k}`,
      kind: name[k - 1] === ' ' ? 'space' : 'key',
      frame,
      res: '32nd',
      weight: 0.2,
    })
  }
  site.flipSentences.forEach((_, i) => {
    push({
      id: `intro/sentence-${i}`,
      kind: 'tick',
      frame: INTRO.sentenceStart + i * INTRO.sentenceLength,
      res: '16th',
      weight: 1,
      note: [88, 91, 93][i],
    })
  })

  // Site walkthrough.
  const s = SCENES.site.from
  push({ id: 'site/whoosh', kind: 'whoosh', frame: s, res: 'bar', weight: 100 })
  push({ id: 'site/impact', kind: 'impact', frame: s, res: 'bar', weight: 100 })
  SITE.labels.forEach((label, i) => {
    push({ id: `site/label-${i}`, kind: 'pop', frame: s + label.from - 6, res: '16th', weight: 1, note: [81, 84, 88][i] })
  })
  ;[SITE.aboutScroll, SITE.activityScroll, SITE.experienceScroll].forEach(([a, b], i) => {
    push({ id: `site/scroll-${i}`, kind: 'swipe', frame: s + (a + b) / 2, res: '8th', weight: 1 })
  })
  push({ id: 'site/focus', kind: 'focus', frame: s + SITE.focus + 6, res: '8th', weight: 2 })
  SITE.callouts.forEach((f, i) => {
    push({ id: `site/callout-${i}`, kind: 'pop', frame: s + f + 3, res: '16th', weight: 1.5, note: [76, 79, 81][i] })
  })

  // Projects.
  const p = SCENES.projects.from
  push({ id: 'projects/whoosh', kind: 'whoosh', frame: p, res: 'bar', weight: 100 })
  push({ id: 'projects/impact', kind: 'impact', frame: p, res: 'bar', weight: 100 })
  projects.forEach((project, i) => {
    push({
      id: `projects/card-${project.id}`,
      kind: 'pop',
      frame: p + PROJECTS.cardsStart + i * PROJECTS.cardStagger + 3,
      res: '16th',
      weight: 1,
      note: A_MINOR_PENTATONIC[2 + i],
    })
  })

  // Outro.
  const o = SCENES.outro.from
  push({ id: 'outro/impact', kind: 'impact', frame: o + OUTRO.mark, res: 'bar', weight: 100 })
  push({ id: 'outro/title', kind: 'pop', frame: o + OUTRO.title + 2, res: '16th', weight: 1, note: 69 })
  push({ id: 'outro/url', kind: 'pop', frame: o + OUTRO.url + 2, res: '16th', weight: 1, note: 76 })
  const [revealStart, revealEnd] = OUTRO.urlReveal
  for (let i = 0; i < 6; i++) {
    push({
      id: `outro/shimmer-${i}`,
      kind: 'bell',
      frame: o + revealStart + ((revealEnd - revealStart) * i) / 6,
      res: '16th',
      weight: 0.5,
      note: A_MINOR_PENTATONIC[3 + i],
    })
  }
  site.social
    .filter((x) => x.name !== 'email')
    .forEach((social, i) => {
      push({
        id: `outro/social-${social.name}`,
        kind: 'tick',
        frame: o + OUTRO.socialsStart + i * OUTRO.socialStagger + 2,
        res: '16th',
        weight: 0.5,
        note: [81, 84, 86, 88][i],
      })
    })
  push({ id: 'outro/footer', kind: 'tick', frame: o + OUTRO.footer + 2, res: '16th', weight: 0.5, note: 93 })

  return cues.map((c) => ({ ...c, frame: Math.round(c.frame * 100) / 100 }))
}

export const frameToSeconds = (frame: number) => frame / FPS
