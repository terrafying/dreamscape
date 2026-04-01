// 4D polytope manifold navigation
// Movement follows the manifold graph (faces/edges), not 2.5D maze grid

import type { Vec4 } from './geometry4d'

export interface Vertex {
  id: number
  pos: Vec4
}

export interface Edge {
  a: number  // vertex index
  b: number  // vertex index
}

export interface Face {
  vertices: number[]
  edges: [number, number][]
  centroid: Vec4
}

export interface ManifoldState {
  current: number       // current vertex id
  target: number        // target vertex id
  plane: number         // which SO(4) rotation plane (0-5 for 6 independent planes)
}

// ─── Graph construction ────────────────────────────────────────────────────────

export function buildAdjacency(verts: Vec4[], edges: [number, number][]): Map<number, number[]> {
  const adj = new Map<number, number[]>()
  for (let i = 0; i < verts.length; i++) adj.set(i, [])
  for (const [a, b] of edges) {
    adj.get(a)!.push(b)
    adj.get(b)!.push(a)
  }
  return adj
}

export function buildFaces(verts: Vec4[], edges: [number, number][]): Face[] {
  const adj = buildAdjacency(verts, edges)
  const visited = new Set<string>()

  function edgeKey(a: number, b: number): string {
    return a < b ? `${a}-${b}` : `${b}-${a}`
  }

  function triangleArea(a: Vec4, b: Vec4, c: Vec4): number {
    const ab = b.map((v, i) => v - a[i]) as Vec4
    const ac = c.map((v, i) => v - a[i]) as Vec4
    const lab = Math.sqrt(ab.reduce((s, v, i) => s + v * v, 0))
    const lac = Math.sqrt(ac.reduce((s, v, i) => s + v * v, 0))
    const lbc = Math.sqrt(
      (b[0] - c[0]) ** 2 + (b[1] - c[1]) ** 2 + (b[2] - c[2]) ** 2 + (b[3] - c[3]) ** 2)
    const s = (lab + lac + lbc) / 2
    return Math.sqrt(Math.max(0, s * (s - lab) * (s - lac) * (s - lbc)))
  }

  const faces: Face[] = []

  // Find triangular faces: sets of 3 vertices all connected by edges
  for (let i = 0; i < verts.length; i++) {
    for (let j of adj.get(i) || []) {
      if (j <= i) continue
      for (let k of adj.get(j) || []) {
        if (k <= j || !adj.get(k)?.includes(i)) continue
        const key = edgeKey(i, j) + edgeKey(j, k) + edgeKey(k, i)
        if (visited.has(key)) continue
        visited.add(key)
        const vtx = [i, j, k]
        const edgeList: [number, number][] = [[i, j], [j, k], [k, i]]
        const centroid: Vec4 = [
          (verts[i][0] + verts[j][0] + verts[k][0]) / 3,
          (verts[i][1] + verts[j][1] + verts[k][1]) / 3,
          (verts[i][2] + verts[j][2] + verts[k][2]) / 3,
          (verts[i][3] + verts[j][3] + verts[k][3]) / 3,
        ]
        faces.push({ vertices: vtx, edges: edgeList, centroid })
      }
    }
  }

  return faces
}

// ─── A* pathfinding on manifold ───────────────────────────────────────────────

export function manifoldDistance(
  adj: Map<number, number[]>,
  from: number,
  to: number
): number {
  if (from === to) return 0
  const queue: [number, number][] = [[from, 0]]
  const visited = new Set<number>([from])
  while (queue.length > 0) {
    const [cur, dist] = queue.shift()!
    for (const nb of adj.get(cur) || []) {
      if (nb === to) return dist + 1
      if (!visited.has(nb)) { visited.add(nb); queue.push([nb, dist + 1]) }
    }
  }
  return Infinity
}

export function findPath(
  adj: Map<number, number[]>,
  verts: Vec4[],
  from: number,
  to: number
): number[] {
  if (from === to) return [from]
  const queue: [number, number[]][] = [[from, [from]]]
  const visited = new Set<number>([from])
  while (queue.length > 0) {
    const [cur, path] = queue.shift()!
    for (const nb of adj.get(cur) || []) {
      if (nb === to) return [...path, nb]
      if (!visited.has(nb)) {
        visited.add(nb)
        queue.push([nb, [...path, nb]])
      }
    }
  }
  return []
}

// ─── Navigation actions ───────────────────────────────────────────────────────

export function stepAlong(
  adj: Map<number, number[]>,
  verts: Vec4[],
  current: number,
  target: number
): number {
  if (current === target) return current
  const path = findPath(adj, verts, current, target)
  return path.length > 1 ? path[1] : current
}

// Cross from current face into an adjacent face across an edge
// Returns the new vertex on the far side of the crossing
export function pivotTo(
  adj: Map<number, number[]>,
  verts: Vec4[],
  current: number,
  edgeVertex: number
): number {
  // Find a neighbor of current that's not edgeVertex and not the previous vertex
  const nbs = adj.get(current) || []
  for (const nb of nbs) {
    if (nb === edgeVertex) continue
    // Choose the one closest to edgeVertex in the 3D projection
    return nb
  }
  return current
}

// SO(4) rotation planes: pairs of 4D axes
// (0,1), (0,2), (0,3), (1,2), (1,3), (2,3) — independent SO(4) rotation planes
export const SO4_PLANES: [number, number][] = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]]

export function flipPlane(state: ManifoldState): ManifoldState {
  return { ...state, plane: (state.plane + 1) % SO4_PLANES.length }
}

export function planeLabel(plane: number): string {
  const labels = ['XY', 'XZ', 'XW', 'YZ', 'YW', 'ZW']
  return labels[plane] ?? '??'
}

// ─── Guidance ────────────────────────────────────────────────────────────────

export interface Guidance {
  direction: number      // vertex id to move toward
  distance: number       // manifold graph distance
  bearing: number        // bearing angle in radians (for audio quantization)
  pulseRate: number      // angel pulse rate (higher = closer)
  plane: number          // recommended rotation plane
}

export function getGuidance(
  adj: Map<number, number[]>,
  verts: Vec4[],
  faces: Face[],
  current: number,
  targets: number[]
): Guidance {
  // Find nearest undiscovered target
  let nearestTarget = -1
  let minDist = Infinity
  for (const t of targets) {
    const d = manifoldDistance(adj, current, t)
    if (d < minDist) { minDist = d; nearestTarget = t }
  }

  if (nearestTarget === -1) {
    return { direction: current, distance: 0, bearing: 0, pulseRate: 0, plane: 0 }
  }

  const path = findPath(adj, verts, current, nearestTarget)
  const nextVertex = path.length > 1 ? path[1] : current

  // Bearing: angle from current to next vertex projected onto primary rotation plane
  const v0 = verts[current]
  const v1 = verts[nextVertex]
  const dx = v1[0] - v0[0]
  const dy = v1[1] - v0[1]
  const bearing = Math.atan2(dy, dx)

  // Pulse rate: closer = faster (0.5Hz far, 3Hz very close)
  const pulseRate = Math.max(0.5, Math.min(3, 0.5 + (20 - minDist) * 0.13))

  // Choose rotation plane based on which plane the displacement lies in
  let bestPlane = 0
  let bestScore = 0
  for (let p = 0; p < SO4_PLANES.length; p++) {
    const [a, b] = SO4_PLANES[p]
    const displacement = Math.abs(v1[a] - v0[a]) + Math.abs(v1[b] - v0[b])
    if (displacement > bestScore) { bestScore = displacement; bestPlane = p }
  }

  return {
    direction: nextVertex,
    distance: minDist,
    bearing,
    pulseRate,
    plane: bestPlane,
  }
}

// ─── Quantization ─────────────────────────────────────────────────────────────

export function quantizationStepSize(distance: number): number {
  // Closer to target → smaller step = more consonant (31-EDO microsteps)
  // Far from target → larger steps = coarser quantization
  if (distance <= 1) return 1
  if (distance <= 3) return 2
  if (distance <= 6) return 3
  return 5
}
