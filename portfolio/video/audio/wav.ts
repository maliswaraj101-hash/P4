import { writeFile } from 'node:fs/promises'
import { rng } from './prng'
import type { Stereo } from './dsp'

/** 24-bit PCM with seeded TPDF dither. */
export async function writeWav24(path: string, { L, R }: Stereo, sampleRate: number) {
  const frames = L.length
  const bytesPerSample = 3
  const dataSize = frames * 2 * bytesPerSample
  const buf = Buffer.alloc(44 + dataSize)

  buf.write('RIFF', 0)
  buf.writeUInt32LE(36 + dataSize, 4)
  buf.write('WAVE', 8)
  buf.write('fmt ', 12)
  buf.writeUInt32LE(16, 16)
  buf.writeUInt16LE(1, 20)
  buf.writeUInt16LE(2, 22)
  buf.writeUInt32LE(sampleRate, 24)
  buf.writeUInt32LE(sampleRate * 2 * bytesPerSample, 28)
  buf.writeUInt16LE(2 * bytesPerSample, 32)
  buf.writeUInt16LE(24, 34)
  buf.write('data', 36)
  buf.writeUInt32LE(dataSize, 40)

  const dither = rng('wav/dither')
  const max = 8388607
  let offset = 44
  for (let i = 0; i < frames; i++) {
    for (const ch of [L, R]) {
      const tpdf = (dither() - dither()) / max
      const v = Math.max(-1, Math.min(1, ch[i]! + tpdf))
      buf.writeIntLE(Math.round(v * max), offset, 3)
      offset += 3
    }
  }
  await writeFile(path, buf)
}
