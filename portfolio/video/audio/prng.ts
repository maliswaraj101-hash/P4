export type Rng = () => number

/** mulberry32: the only noise source in the audio build. Returns floats in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const ROOT_SEED = 'swaraj-portfolio/v1'

/** FNV-1a, so every named stream gets a stable, independent seed. */
function hashSeed(label: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function rng(label: string): Rng {
  return mulberry32(hashSeed(`${ROOT_SEED}/${label}`))
}

export function bipolar(r: Rng): number {
  return r() * 2 - 1
}

export function range(r: Rng, min: number, max: number): number {
  return min + r() * (max - min)
}

/** Fill a buffer with seeded white noise in [-1, 1). */
export function noise(length: number, label: string): Float32Array {
  const r = rng(label)
  const out = new Float32Array(length)
  for (let i = 0; i < length; i++) out[i] = bipolar(r)
  return out
}
