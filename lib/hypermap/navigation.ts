import type { Vec4 } from '@/lib/geometry4d'
import { buildAdjacency } from '@/lib/manifold'
import { relativeProjection } from '@/lib/hypermap/projection'

function normalize3(v: [number, number, number]): [number, number, number] {
  const len = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / len, v[1] / len, v[2] / len]
}

function projectToControlPlane(v: [number, number, number], yaw: number): [number, number] {
  const cos = Math.cos(-yaw)
  const sin = Math.sin(-yaw)
  const x = v[0] * cos - v[2] * sin
  const z = v[0] * sin + v[2] * cos
  const len = Math.hypot(x, z) || 1
  return [x / len, -z / len]
}

/**
 * Pick the graph neighbor that best matches a screen-space direction (for keyboard steering).
 */
export function getDirectionalNeighbor(
  verts: Vec4[],
  edges: [number, number][],
  current: number,
  plane: number,
  slice: number,
  yaw: number,
  direction: 'w' | 'a' | 's' | 'd',
): number | null {
  const neighbors = buildAdjacency(verts, edges).get(current) ?? []
  if (neighbors.length === 0) return null
  const targets: Record<'w' | 'a' | 's' | 'd', [number, number]> = {
    w: [0, 1],
    a: [-1, 0],
    s: [0, -1],
    d: [1, 0],
  }
  const wanted = targets[direction]
  let best = neighbors[0]
  let bestScore = -Infinity
  for (const neighbor of neighbors) {
    const rel = normalize3(relativeProjection(verts, current, neighbor, plane, slice, 0))
    const [sx, sy] = projectToControlPlane(rel, yaw)
    const score = sx * wanted[0] + sy * wanted[1]
    if (score > bestScore) {
      bestScore = score
      best = neighbor
    }
  }
  return best
}
