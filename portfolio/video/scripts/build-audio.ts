import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// All noise must come from seeded mulberry32 streams; fail loudly if anything reaches for Math.random.
Math.random = () => {
  throw new Error('Math.random is forbidden in the audio build; use audio/prng.ts')
}

const { analyseBeats } = await import('../audio/beats')
const { buildCues } = await import('../audio/cues')
const { SR, applyCurve, dbToGain, mixInto, sidechainCurve, stereo } = await import('../audio/dsp')
const { fitTempo, gridTime } = await import('../audio/grid')
const { integratedLufs, shortTermCurve } = await import('../audio/loudness')
const { master } = await import('../audio/master')
const { SECTIONS, renderScore } = await import('../audio/score')
const { renderSfx } = await import('../audio/sfx')
const { writeWav24 } = await import('../audio/wav')
const { DURATION, FPS } = await import('../src/timeline')

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/audio')
const TARGET_LUFS = -14
// Headroom for AAC encoding, which overshoots peaks by a few tenths of a dB.
const MAX_TRUE_PEAK = -1.5
const MUSIC_LUFS = -18
const SFX_BELOW_MUSIC_LU = 6

const log = (msg: string) => console.log(`  ${msg}`)
const time = async <T>(label: string, fn: () => T | Promise<T>) => {
  const start = performance.now()
  const result = await fn()
  log(`${label} (${((performance.now() - start) / 1000).toFixed(1)}s)`)
  return result
}

async function main() {
  await mkdir(path.join(OUT, 'stems'), { recursive: true })
  const length = Math.round((DURATION / FPS) * SR)
  console.log(`Building soundtrack: ${DURATION / FPS}s @ ${SR} Hz`)

  const cues = buildCues()
  const design = fitTempo(cues)
  log(`tempo fit: ${design.bpm} BPM, downbeat anchored at ${design.origin.toFixed(3)}s (${cues.length} cues)`)

  const score = await time('score synthesized', () => renderScore(design, length))
  for (const [name, stem] of Object.entries(score.stems)) {
    await writeWav24(path.join(OUT, 'stems', `${name}.wav`), stem, SR)
  }
  await writeWav24(path.join(OUT, 'stems', 'score.wav'), score.bus, SR)

  const beats = await time('beats measured from the rendered score', () => analyseBeats(score.bus))
  const designOffsetMs = (() => {
    const k = Math.round((beats.grid.origin - design.origin) / design.period)
    return Math.round((beats.grid.origin - (design.origin + k * design.period)) * 1e5) / 100
  })()
  await writeFile(
    path.join(OUT, 'beats.json'),
    JSON.stringify({ ...beats, validation: { designBpm: design.bpm, measuredVsDesignOffsetMs: designOffsetMs } }, null, 2),
  )
  log(
    `beats.json: ${beats.beats.length} beats, ${beats.tempo.fittedBpm} BPM measured, ` +
      `residual ${beats.fit.residualRmsMs} ms RMS, grid ${designOffsetMs} ms from design`,
  )

  // SFX are placed on the measured grid, never on the design grid.
  const measured = JSON.parse(await readFile(path.join(OUT, 'beats.json'), 'utf8')).grid
  const sfx = await time('sfx placed on measured grid', () => renderSfx(cues, measured, length))
  await writeWav24(path.join(OUT, 'stems', 'sfx.wav'), sfx.bus, SR)

  // Gain staging: music bus to MUSIC_LUFS, sfx SFX_BELOW_MUSIC_LU under it, before any dynamics.
  const scoreLufs = integratedLufs(score.bus)
  const sfxLufs = integratedLufs(sfx.bus)
  const scoreTrim = dbToGain(MUSIC_LUFS - scoreLufs)
  const sfxTrim = dbToGain(MUSIC_LUFS - SFX_BELOW_MUSIC_LU - sfxLufs)
  log(`gain staging: score ${scoreLufs.toFixed(1)} → ${MUSIC_LUFS} LUFS, sfx ${sfxLufs.toFixed(1)} → ${MUSIC_LUFS - SFX_BELOW_MUSIC_LU} LUFS`)

  const duck = sidechainCurve(length, sfx.impacts, 0.35, 0.25)
  const mix = stereo(length)
  mixInto(mix, applyCurve({ L: Float32Array.from(score.bus.L), R: Float32Array.from(score.bus.R) }, duck), scoreTrim)
  mixInto(mix, sfx.bus, sfxTrim)

  // Fade the final 0.35 s so the last chord doesn't truncate.
  const fade = Math.round(0.35 * SR)
  for (let i = 0; i < fade; i++) {
    const g = Math.cos(((i / fade) * Math.PI) / 2)
    mix.L[length - fade + i]! *= g
    mix.R[length - fade + i]! *= g
  }

  const mastered = await time('mastered', () => master(mix, TARGET_LUFS, MAX_TRUE_PEAK))
  const wavPath = path.join(OUT, 'soundtrack.wav')
  await writeWav24(wavPath, mastered.bus, SR)
  const sha256 = createHash('sha256').update(await readFile(wavPath)).digest('hex')

  const worst = sfx.placements.reduce((m, p) => Math.max(m, Math.abs(p.offsetMs)), 0)
  const report = {
    durationSeconds: DURATION / FPS,
    sampleRate: SR,
    tempoFit: design,
    sections: {
      intro: { bars: [SECTIONS.firstBar, SECTIONS.siteBars[0]], from: 0, to: gridTime(design, SECTIONS.siteBars[0]) },
      site: { bars: SECTIONS.siteBars, from: gridTime(design, SECTIONS.siteBars[0]), to: gridTime(design, SECTIONS.siteBars[1]) },
      projects: { bars: SECTIONS.projectBars, from: gridTime(design, SECTIONS.projectBars[0]), to: gridTime(design, SECTIONS.projectBars[1]) },
      outro: { bars: SECTIONS.outroBars, from: gridTime(design, SECTIONS.outroBars[0]), to: gridTime(design, SECTIONS.outroBars[1]) },
    },
    beats: { ...beats.tempo, ...beats.fit, measuredVsDesignOffsetMs: designOffsetMs },
    placements: sfx.placements,
    worstSnapOffsetMs: worst,
    loudness: {
      ...mastered.report,
      stemsRaw: { score: Math.round(scoreLufs * 10) / 10, sfx: Math.round(sfxLufs * 10) / 10 },
      stemsStaged: { score: MUSIC_LUFS, sfx: MUSIC_LUFS - SFX_BELOW_MUSIC_LU },
      shortTermPerSecond: shortTermCurve(mastered.bus),
    },
    sha256,
  }
  await writeFile(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2))

  log(`hits: ${sfx.placements.length}, worst visual-to-beat offset ${worst} ms`)
  log(
    `master: ${mastered.report.integratedLufs} LUFS integrated, ${mastered.report.truePeakDbtp} dBTP ` +
      `(gain ${mastered.report.gainDb} dB, ceiling ${mastered.report.ceilingDb} dB, ${mastered.report.iterations} passes)`,
  )
  log(`soundtrack.wav sha256 ${sha256}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
