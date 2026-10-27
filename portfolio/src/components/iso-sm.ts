/**
 * Isometric SM — Spotlight Logo interaction grid (same as ncdai CD).
 * Continuous chunky bars, minimal stroke (CD density) so it stays clear.
 * Guide lines (in mark-isometric) are untouched.
 */

export const ISO = {
  DX: 55.425,
  DY: 32,
  OX: 0.5,
  OY: 32.58,
  H: 1,
  VIEW_W: 556,
  VIEW_H: 354,
  PRESS_DROP: 0.5,
} as const

type Pt = { x: number; y: number }

function project(i: number, j: number, k: number): Pt {
  return {
    x: +(ISO.OX + (i - j) * ISO.DX).toFixed(2),
    y: +(ISO.OY + (i + j) * ISO.DY - k * ISO.DY).toFixed(2),
  }
}

function fmt(p: Pt) {
  return `${p.x} ${p.y}`
}

function P(i: number, j: number, k: number) {
  return project(i, j, k)
}

/** Polyline through grid points at height k (open). */
function poly(points: [number, number][], k: number) {
  return `M${points.map(([i, j]) => fmt(P(i, j, k))).join('L')}`
}

function closed(points: [number, number][], k: number) {
  return `${poly(points, k)}Z`
}

function vert(i: number, j: number, k: number) {
  return `M${fmt(P(i, j, k))}L${fmt(P(i, j, 0))}`
}

function side(
  a: [number, number],
  b: [number, number],
  k: number,
) {
  return `M${fmt(P(a[0], a[1], k))}L${fmt(P(b[0], b[1], k))}L${fmt(P(b[0], b[1], 0))}L${fmt(P(a[0], a[1], 0))}Z`
}

/**
 * Continuous SM — flowing bars, CD-level stroke count.
 *
 * S ribbon (5 abutting tops = seamless hatch).
 * M: 2 stems + 1 V join with top notch.
 */
function geometry(kDrop = 0) {
  const k = ISO.H - kDrop

  // Faces — abutting rects read as continuous solids (like CD's C arms)
  const faceFill = [
    // S
    closed(
      [
        [3, 1],
        [4, 1],
        [4, 3],
        [3, 3],
      ],
      k,
    ),
    closed(
      [
        [4, 3],
        [5, 3],
        [5, 4],
        [4, 4],
      ],
      k,
    ),
    closed(
      [
        [5, 1],
        [6, 1],
        [6, 3],
        [5, 3],
      ],
      k,
    ),
    closed(
      [
        [6, 0],
        [7, 0],
        [7, 1],
        [6, 1],
      ],
      k,
    ),
    closed(
      [
        [6, 1],
        [7, 1],
        [7, 3],
        [6, 3],
      ],
      k,
    ),
    // M
    closed(
      [
        [3, -1],
        [7, -1],
        [7, 0],
        [3, 0],
      ],
      k,
    ),
    closed(
      [
        [3, -3],
        [7, -3],
        [7, -2],
        [3, -2],
      ],
      k,
    ),
    closed(
      [
        [4, -2],
        [6, -2],
        [6, -1],
        [4, -1],
      ],
      k,
    ),
  ].join('')

  // Sides — outer walls only (axis-aligned)
  const sideFill = [
    side([3, 1], [3, 3], k),
    side([3, 3], [4, 3], k),
    side([4, 3], [4, 4], k),
    side([4, 4], [5, 4], k),
    side([5, 4], [5, 3], k),
    side([6, 0], [7, 0], k),
    side([7, 0], [7, 3], k),
    side([7, 3], [6, 3], k),
    side([3, 1], [4, 1], k),
    side([3, 0], [7, 0], k),
    side([7, 0], [7, -1], k),
    side([7, -2], [7, -3], k),
    side([7, -3], [3, -3], k),
    side([3, -3], [3, -2], k),
    side([3, 0], [3, -1], k),
  ].join('')

  // Stroke — CD / Spotlight Logo density
  const stroke = [
    // S silhouette (broken into CD-style runs)
    poly(
      [
        [3, 3],
        [3, 1],
        [4, 1],
        [4, 3],
        [5, 3],
        [5, 1],
        [6, 1],
        [6, 0],
        [7, 0],
        [7, 3],
        [6, 3],
        [4, 3],
        [3, 3],
      ],
      k,
    ),
    poly(
      [
        [4, 3],
        [4, 4],
        [5, 4],
        [5, 3],
      ],
      k,
    ),
    // S verticals
    vert(3, 1, k),
    vert(3, 3, k),
    vert(4, 4, k),
    vert(5, 4, k),
    vert(7, 0, k),
    vert(7, 3, k),
    // S ground
    poly(
      [
        [7, 0],
        [7, 3],
      ],
      0,
    ),

    // M silhouette
    poly(
      [
        [3, 0],
        [7, 0],
        [7, -1],
        [6, -1],
        [6, -2],
        [7, -2],
        [7, -3],
        [3, -3],
        [3, -2],
        [4, -2],
        [4, -1],
        [3, -1],
        [3, 0],
      ],
      k,
    ),
    // M verticals
    vert(3, 0, k),
    vert(7, 0, k),
    vert(3, -3, k),
    vert(7, -3, k),
    // M ground
    poly(
      [
        [7, 0],
        [7, -1],
      ],
      0,
    ),
    poly(
      [
        [7, -2],
        [7, -3],
      ],
      0,
    ),
  ].join('')

  return { faceFill, sideFill, stroke }
}

export type IsoMarkGeometry = {
  faceFill: string
  sideFill: string
  stroke: string
  faceFillPressed: string
  sideFillPressed: string
  strokePressed: string
}

export function buildSmIsometric(): IsoMarkGeometry {
  const normal = geometry(0)
  const pressed = geometry(ISO.PRESS_DROP)
  return {
    faceFill: normal.faceFill,
    sideFill: normal.sideFill,
    stroke: normal.stroke,
    faceFillPressed: pressed.faceFill,
    sideFillPressed: pressed.sideFill,
    strokePressed: pressed.stroke,
  }
}
