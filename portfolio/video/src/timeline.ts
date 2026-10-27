export const FPS = 30
export const DURATION = 30 * FPS

/** Scenes overlap by 15 frames so their fades cross-dissolve. */
export const SCENES = {
  intro: { from: 0, duration: 145 },
  site: { from: 130, duration: 425 },
  projects: { from: 540, duration: 220 },
  outro: { from: 745, duration: DURATION - 745 },
} as const

/** Frame numbers below are relative to the start of their scene. */

export const INTRO = {
  typeStart: 12,
  typeEnd: 36,
  sentenceStart: 40,
  sentenceLength: 30,
} as const

export const SITE = {
  aboutScroll: [45, 85],
  activityScroll: [115, 155],
  experienceScroll: [185, 230],
  focus: 235,
  callouts: [262, 292, 322],
  labels: [
    { text: '# about', from: 55, to: 115 },
    { text: '# activity', from: 125, to: 185 },
    { text: '# experience', from: 195, to: 240 },
  ],
} as const

export const PROJECTS = {
  cardsStart: 18,
  cardStagger: 10,
} as const

export const OUTRO = {
  mark: 0,
  title: 8,
  url: 18,
  urlReveal: [22, 46],
  socialsStart: 36,
  socialStagger: 6,
  footer: 62,
} as const
