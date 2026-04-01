/**
 * Seeded procedural labels for tesseract vertices — gives each "room" of the 4D map a stable name.
 */

import { VERTS_TESSERACT } from '@/lib/geometry4d'

const EPITHETS = [
  'Veil', 'Nave', 'Spire', 'Well', 'Gate', 'Fold', 'Arc', 'Hollow',
  'Index', 'Chord', 'Mirror', 'Crown', 'Root', 'Bloom', 'Shard', 'Halo',
]

/** Mulberry32 — small fast PRNG for deterministic maps */
export function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function roomLabelsForSeed(seed: number): string[] {
  const rand = mulberry32(seed ^ 0x9e3779b9)
  const pool = [...EPITHETS]
  const labels: string[] = []
  for (let i = 0; i < VERTS_TESSERACT.length; i++) {
    if (pool.length === 0) {
      pool.push(...EPITHETS)
    }
    const j = Math.floor(rand() * pool.length)
    labels.push(pool.splice(j, 1)[0]!)
  }
  return labels
}

export function buildVistaPrompt(opts: {
  seed: number
  vertexIndex: number
  plane: number
  slice: number
  roomName: string
}): string {
  const { roomName, plane, slice } = opts
  const planeNames = ['XY', 'XZ', 'XW', 'YZ', 'YW', 'ZW']
  const p = planeNames[plane] ?? '??'
  return [
    `A single atmospheric square illustration, tarot-card border, no text in the image.`,
    `Subject: an impossible dream architecture chamber called "${roomName}" —`,
    `floating staircases, violet mist, faint golden sacred geometry, liminal twilight sky visible through arches.`,
    `The space should feel like a 3D slice of a higher-dimensional place: emphasize subtle wrong-angle connections and mirrored depth.`,
    `Projection hint (for mood only, do not render labels): rotating the ${p} plane, slice depth ${slice.toFixed(2)}.`,
    `Style: dark fantasy, painterly, soft bloom light, cinematic.`,
  ].join(' ')
}
