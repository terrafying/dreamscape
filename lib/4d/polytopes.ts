/**
 * 4D Polytope Definitions
 * Includes classical polytopes and special 4D structures
 */

import type { Hyperspace4DPoint } from './hyperspace-adapter'

export interface Polytope {
  name: string
  description: string
  vertices: Hyperspace4DPoint[]
  edges: [number, number][]
  color: string
  symbolism: string
}

/**
 * Clifford Torus
 * A flat torus embedded in 4D space
 * Parametrized as: (cos(u), sin(u), cos(v), sin(v))
 */
export function generateCliffordTorus(
  uSegments: number = 32,
  vSegments: number = 32
): Polytope {
  const vertices: Hyperspace4DPoint[] = []
  const edges: [number, number][] = []

  // Generate vertices
  for (let i = 0; i < uSegments; i++) {
    for (let j = 0; j < vSegments; j++) {
      const u = (i / uSegments) * Math.PI * 2
      const v = (j / vSegments) * Math.PI * 2

      vertices.push({
        x: Math.cos(u),
        y: Math.sin(u),
        z: Math.cos(v),
        w: Math.sin(v),
      })
    }
  }

  // Generate edges (connect adjacent vertices)
  for (let i = 0; i < uSegments; i++) {
    for (let j = 0; j < vSegments; j++) {
      const current = i * vSegments + j
      const nextU = ((i + 1) % uSegments) * vSegments + j
      const nextV = i * vSegments + ((j + 1) % vSegments)

      edges.push([current, nextU])
      edges.push([current, nextV])
    }
  }

  return {
    name: 'Clifford Torus',
    description: 'A flat torus embedded in 4D space, parametrized as (cos(u), sin(u), cos(v), sin(v))',
    vertices,
    edges,
    color: '#a78bfa',
    symbolism: 'Duality, cycles, eternal return',
  }
}

/**
 * Hopf Fibration
 * Maps 3-sphere to 2-sphere with circle fibers
 * Parametrized using quaternions
 */
export function generateHopfFibration(
  latSegments: number = 16,
  lonSegments: number = 32,
  fiberSegments: number = 8
): Polytope {
  const vertices: Hyperspace4DPoint[] = []
  const edges: [number, number][] = []

  // Generate vertices using Hopf fibration
  for (let i = 0; i < latSegments; i++) {
    for (let j = 0; j < lonSegments; j++) {
      for (let k = 0; k < fiberSegments; k++) {
        const theta = (i / latSegments) * Math.PI
        const phi = (j / lonSegments) * Math.PI * 2
        const psi = (k / fiberSegments) * Math.PI * 2

        // Hopf fibration coordinates
        const x = Math.sin(theta) * Math.cos(phi)
        const y = Math.sin(theta) * Math.sin(phi)
        const z = Math.cos(theta) * Math.cos(psi)
        const w = Math.cos(theta) * Math.sin(psi)

        vertices.push({ x, y, z, w })
      }
    }
  }

  // Generate edges
  const fiberSize = fiberSegments
  const lonSize = lonSegments * fiberSize
  const totalVerts = latSegments * lonSize

  for (let i = 0; i < totalVerts; i++) {
    // Connect along fiber
    const nextFiber = (i + 1) % fiberSize
    if (nextFiber !== 0) {
      edges.push([i, i + 1])
    }

    // Connect along longitude
    const nextLon = (i + lonSize) % totalVerts
    if (nextLon > i) {
      edges.push([i, nextLon])
    }
  }

  return {
    name: 'Hopf Fibration',
    description: 'A mapping from 3-sphere to 2-sphere with circle fibers, fundamental in topology',
    vertices,
    edges,
    color: '#f59e0b',
    symbolism: 'Transformation, fiber bundles, hidden structure',
  }
}

/**
 * 5-Cell (Pentachoron)
 * Simplest 4D polytope, 5 vertices
 */
export function generate5Cell(): Polytope {
  const phi = (1 + Math.sqrt(5)) / 2 // golden ratio

  const vertices: Hyperspace4DPoint[] = [
    { x: 1, y: 1, z: 1, w: 1 },
    { x: 1, y: -1, z: -1, w: 1 },
    { x: -1, y: 1, z: -1, w: 1 },
    { x: -1, y: -1, z: 1, w: 1 },
    { x: 0, y: 0, z: 0, w: -phi },
  ]

  const edges: [number, number][] = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 3],
    [2, 4],
    [3, 4],
  ]

  return {
    name: '5-Cell',
    description: 'The simplest 4D polytope, with 5 vertices and 10 edges',
    vertices,
    edges,
    color: '#06b6d4',
    symbolism: 'Foundation, simplicity, beginning',
  }
}

/**
 * Tesseract (8-Cell / Hypercube)
 * 4D analog of a cube, 16 vertices
 */
export function generateTesseract(): Polytope {
  const vertices: Hyperspace4DPoint[] = []

  // Generate all 16 vertices (all combinations of ±1)
  for (let i = 0; i < 16; i++) {
    vertices.push({
      x: i & 1 ? 1 : -1,
      y: (i >> 1) & 1 ? 1 : -1,
      z: (i >> 2) & 1 ? 1 : -1,
      w: (i >> 3) & 1 ? 1 : -1,
    })
  }

  // Generate edges (connect vertices differing in exactly one coordinate)
  const edges: [number, number][] = []
  for (let i = 0; i < 16; i++) {
    for (let j = i + 1; j < 16; j++) {
      const xor = i ^ j
      // Check if xor is a power of 2 (only one bit different)
      if ((xor & (xor - 1)) === 0) {
        edges.push([i, j])
      }
    }
  }

  return {
    name: 'Tesseract',
    description: '4D hypercube with 16 vertices and 32 edges',
    vertices,
    edges,
    color: '#ec4899',
    symbolism: 'Structure, order, infinite extension',
  }
}

/**
 * 24-Cell (Icositetrachoron)
 * Self-dual polytope, 24 vertices
 */
export function generate24Cell(): Polytope {
  const vertices: Hyperspace4DPoint[] = []

  // All permutations of (±1, ±1, 0, 0)
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      for (const sa of [-1, 1]) {
        for (const sb of [-1, 1]) {
          const v: Hyperspace4DPoint = { x: 0, y: 0, z: 0, w: 0 }
          ;(v as any)[['x', 'y', 'z', 'w'][a]] = sa
          ;(v as any)[['x', 'y', 'z', 'w'][b]] = sb
          vertices.push(v)
        }
      }
    }
  }

  // Edges connect vertices at distance √2
  const edges: [number, number][] = []
  for (let i = 0; i < vertices.length; i++) {
    for (let j = i + 1; j < vertices.length; j++) {
      const v1 = vertices[i]
      const v2 = vertices[j]
      const d2 =
        (v1.x - v2.x) ** 2 +
        (v1.y - v2.y) ** 2 +
        (v1.z - v2.z) ** 2 +
        (v1.w - v2.w) ** 2

      if (Math.abs(d2 - 2) < 0.001) {
        edges.push([i, j])
      }
    }
  }

  return {
    name: '24-Cell',
    description: 'Self-dual polytope with 24 vertices, 96 edges, and perfect symmetry',
    vertices,
    edges,
    color: '#8b5cf6',
    symbolism: 'Perfection, symmetry, balance',
  }
}

/**
 * 16-Cell (Cross-Polytope)
 * Dual of tesseract, 8 vertices
 */
export function generate16Cell(): Polytope {
  const vertices: Hyperspace4DPoint[] = [
    { x: 1, y: 0, z: 0, w: 0 },
    { x: -1, y: 0, z: 0, w: 0 },
    { x: 0, y: 1, z: 0, w: 0 },
    { x: 0, y: -1, z: 0, w: 0 },
    { x: 0, y: 0, z: 1, w: 0 },
    { x: 0, y: 0, z: -1, w: 0 },
    { x: 0, y: 0, z: 0, w: 1 },
    { x: 0, y: 0, z: 0, w: -1 },
  ]

  // Edges connect all non-antipodal pairs
  const edges: [number, number][] = []
  for (let i = 0; i < 8; i++) {
    for (let j = i + 1; j < 8; j++) {
      if (i !== j && i + j !== 7) {
        // Not antipodal
        edges.push([i, j])
      }
    }
  }

  return {
    name: '16-Cell',
    description: 'Cross-polytope with 8 vertices, dual of the tesseract',
    vertices,
    edges,
    color: '#10b981',
    symbolism: 'Opposition, duality, balance of forces',
  }
}

/**
 * Get all available polytopes
 */
export function getAllPolytopes(): Polytope[] {
  return [
    generate5Cell(),
    generateTesseract(),
    generate16Cell(),
    generate24Cell(),
    generateCliffordTorus(16, 16),
    generateHopfFibration(8, 16, 4),
  ]
}
