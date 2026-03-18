// 4D geometry helpers for polytope visualization

export type Vec4 = [number, number, number, number]
export type Vec3 = [number, number, number]
export type Vec2 = [number, number]

// ─── 24-cell (icositetrachoron) ───────────────────────────────────────────────
// Vertices: all permutations of (±1, ±1, 0, 0) across 4 axes = 24 vertices

export function gen24CellVerts(): Vec4[] {
  const verts: Vec4[] = []
  for (let a = 0; a < 4; a++) {
    for (let b = a + 1; b < 4; b++) {
      for (const sa of [-1, 1] as const) {
        for (const sb of [-1, 1] as const) {
          const v: Vec4 = [0, 0, 0, 0]
          v[a] = sa
          v[b] = sb
          verts.push(v)
        }
      }
    }
  }
  return verts
}

// Edges: pairs of vertices at 4D Euclidean distance √2
export function gen24CellEdges(verts: Vec4[]): [number, number][] {
  const edges: [number, number][] = []
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const v = verts[i], w = verts[j]
      const d2 = v.reduce((s, c, k) => s + (c - w[k]) ** 2, 0)
      if (Math.abs(d2 - 2) < 0.001) edges.push([i, j])
    }
  }
  return edges // 96 edges
}

// ─── 16-cell (cross-polytope) ─────────────────────────────────────────────────
// Vertices: ±1 on each axis = 8 vertices, edges connect all non-antipodal pairs

export function gen16CellVerts(): Vec4[] {
  const verts: Vec4[] = []
  for (let a = 0; a < 4; a++) {
    for (const s of [-1, 1] as const) {
      const v: Vec4 = [0, 0, 0, 0]
      v[a] = s
      verts.push(v)
    }
  }
  return verts // 8 vertices
}

export function gen16CellEdges(verts: Vec4[]): [number, number][] {
  const edges: [number, number][] = []
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const v = verts[i], w = verts[j]
      const d2 = v.reduce((s, c, k) => s + (c - w[k]) ** 2, 0)
      if (Math.abs(d2 - 2) < 0.001) edges.push([i, j]) // distance √2 = adjacent
    }
  }
  return edges // 24 edges
}

// ─── Transformations ──────────────────────────────────────────────────────────

// Rotate in the (i, j) coordinate plane by angle
export function rotate4D(v: Vec4, angle: number, i: number, j: number): Vec4 {
  const r = [...v] as Vec4
  const cos = Math.cos(angle), sin = Math.sin(angle)
  r[i] = v[i] * cos - v[j] * sin
  r[j] = v[i] * sin + v[j] * cos
  return r
}

// Perspective project 4D → 3D  (camera looking along -w, at w = camDist)
export function proj4to3(v: Vec4, camDist = 3.0): Vec3 {
  const d = Math.max(camDist - v[3], 0.15)
  return [v[0] / d, v[1] / d, v[2] / d]
}

// Perspective project 3D → canvas (camera looking along -z, at z = camDist)
export function proj3to2(v: Vec3, camDist = 3.5, scale: number, cx: number, cy: number): Vec2 {
  const d = Math.max(camDist - v[2], 0.15)
  return [cx + (v[0] * scale) / d, cy + (v[1] * scale) / d]
}

// ─── 8-cell (tesseract / hypercube) ──────────────────────────────────────────
// Vertices: all (±1, ±1, ±1, ±1) = 16 vertices, edges connect pairs differing in one coord

export function genTesseractVerts(): Vec4[] {
  const verts: Vec4[] = []
  for (const a of [-1, 1] as const)
    for (const b of [-1, 1] as const)
      for (const c of [-1, 1] as const)
        for (const d of [-1, 1] as const)
          verts.push([a, b, c, d])
  return verts // 16 vertices
}

export function genTesseractEdges(verts: Vec4[]): [number, number][] {
  const edges: [number, number][] = []
  for (let i = 0; i < verts.length; i++) {
    for (let j = i + 1; j < verts.length; j++) {
      const d2 = verts[i].reduce((s, c, k) => s + (c - verts[j][k]) ** 2, 0)
      if (Math.abs(d2 - 4) < 0.001) edges.push([i, j]) // distance 2 = one coord differs
    }
  }
  return edges // 32 edges
}

// ─── 5-cell (pentachoron / 4D simplex) ───────────────────────────────────────
// 5 vertices, all pairs connected = 10 edges
// Vertices projected from the hyperplane x0+x1+x2+x3+x4=0 in R^5 → R^4

export function gen5CellVerts(): Vec4[] {
  const s5 = Math.sqrt(5)
  const s10 = Math.sqrt(10)
  const s30 = Math.sqrt(30)
  const s6 = Math.sqrt(6)
  // Normalised regular 4-simplex with circumradius 1
  return [
    [1, 1, 1, -1 / s5],
    [1, -1, -1, -1 / s5],
    [-1, 1, -1, -1 / s5],
    [-1, -1, 1, -1 / s5],
    [0, 0, 0, 4 / s5],
  ].map((v) => {
    const len = Math.sqrt(v.reduce((s, c) => s + c * c, 0))
    return v.map((c) => c / len) as Vec4
  })
}

export function gen5CellEdges(verts: Vec4[]): [number, number][] {
  // All pairs (complete graph K5)
  const edges: [number, number][] = []
  for (let i = 0; i < verts.length; i++)
    for (let j = i + 1; j < verts.length; j++)
      edges.push([i, j])
  return edges // 10 edges
}

// ─── Pre-computed geometry (module-level, computed once) ──────────────────────

export const VERTS_24 = gen24CellVerts()
export const EDGES_24 = gen24CellEdges(VERTS_24)
export const VERTS_16 = gen16CellVerts()
export const EDGES_16 = gen16CellEdges(VERTS_16)
export const VERTS_TESSERACT = genTesseractVerts()
export const EDGES_TESSERACT = genTesseractEdges(VERTS_TESSERACT)
export const VERTS_5CELL = gen5CellVerts()
export const EDGES_5CELL = gen5CellEdges(VERTS_5CELL)
