import { execFileSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'

// Remotion's AAC output keeps the encoder priming samples as audio (~43 ms late).
// ffmpeg's encoder writes an edit list so players skip them, keeping hits on their frames.
const FILES = ['portfolio-16x9.mp4', 'portfolio-9x16.mp4']

await mkdir('out-sound', { recursive: true })
for (const file of FILES) {
  execFileSync(
    'ffmpeg',
    [
      '-v', 'error', '-y',
      '-i', `out-sound/.render/${file}`,
      '-i', 'public/audio/soundtrack.wav',
      '-map', '0:v:0', '-map', '1:a:0',
      '-c:v', 'copy',
      '-c:a', 'aac', '-b:a', '320k', '-ar', '48000',
      '-movflags', '+faststart',
      `out-sound/${file}`,
    ],
    { stdio: 'inherit' },
  )
  console.log(`muxed out-sound/${file}`)
}
