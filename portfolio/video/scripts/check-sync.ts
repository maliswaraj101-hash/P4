import { execFileSync } from 'node:child_process'

/** Decodes a file's first audio stream to mono float32 at 48 kHz via ffmpeg. */
function decode(file: string) {
  const raw = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:a:0', '-ac', '1', '-ar', '48000', '-f', 'f32le', '-'], {
    maxBuffer: 1 << 28,
  })
  return new Float32Array(raw.buffer, raw.byteOffset, raw.byteLength / 4)
}

/** Lag (ms) that best aligns `test` to `ref` around `atSeconds`, searched over ±`rangeMs`. */
function offsetMs(ref: Float32Array, test: Float32Array, atSeconds: number, rangeMs = 60) {
  const sr = 48000
  const win = Math.round(0.5 * sr)
  const start = Math.round(atSeconds * sr)
  const range = Math.round((rangeMs / 1000) * sr)
  let best = { lag: 0, score: -Infinity }
  for (let lag = -range; lag <= range; lag++) {
    let dot = 0
    for (let i = 0; i < win; i++) dot += ref[start + i]! * (test[start + i + lag] ?? 0)
    if (dot > best.score) best = { lag, score: dot }
  }
  return (best.lag / sr) * 1000
}

const ref = decode('public/audio/soundtrack.wav')
for (const file of process.argv.slice(2)) {
  const test = decode(file)
  const checks = [4.2, 17.9, 24.7].map((t) => offsetMs(ref, test, t).toFixed(2))
  console.log(`${file}: audio offset vs soundtrack at 4.2s/17.9s/24.7s = ${checks.join(' / ')} ms`)
}
