/**
 * Maze generator — recursive backtracker (DFS).
 * Produces a grid of cells with walls between them.
 * Deterministic when given a numeric seed.
 */

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface MazeCell {
  x: number
  y: number
  /** Which walls are present: [top, right, bottom, left] */
  walls: [boolean, boolean, boolean, boolean]
  /** Has the player visited this cell? (used by minimap) */
  visited: boolean
  /** Index of the polytope placed here, or -1 */
  polytopeIndex: number
}

export interface MazeGrid {
  width: number
  height: number
  cells: MazeCell[][]
  /** Coordinates of the 4 polytope nodes */
  polytopeNodes: { x: number; y: number }[]
  /** Starting cell */
  start: { x: number; y: number }
}

// ─── SEEDED PRNG ─────────────────────────────────────────────────────────────

/** Simple seeded PRNG (mulberry32) */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Hash a string to a 32-bit integer for seeding */
export function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    hash = ((hash << 5) - hash + ch) | 0
  }
  return hash
}

// ─── MAZE GENERATION ─────────────────────────────────────────────────────────

const DIR = [
  { dx: 0, dy: -1, wall: 0, opposite: 2 }, // top
  { dx: 1, dy: 0, wall: 1, opposite: 3 },  // right
  { dx: 0, dy: 1, wall: 2, opposite: 0 },  // bottom
  { dx: -1, dy: 0, wall: 3, opposite: 1 }, // left
] as const

export function generateMaze(
  width = 12,
  height = 12,
  seed = 42,
): MazeGrid {
  const rng = mulberry32(seed)

  // Initialize grid with all walls
  const cells: MazeCell[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => ({
      x,
      y,
      walls: [true, true, true, true] as [boolean, boolean, boolean, boolean],
      visited: false,
      polytopeIndex: -1,
    })),
  )

  // Track which cells have been carved during generation
  const carved: boolean[][] = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => false),
  )

  // Recursive backtracker (iterative stack for safety)
  const stack: { x: number; y: number }[] = []
  const startX = 0
  const startY = 0
  carved[startY][startX] = true
  stack.push({ x: startX, y: startY })

  while (stack.length > 0) {
    const current = stack[stack.length - 1]
    const { x, y } = current

    // Find unvisited neighbors
    const neighbors: (typeof DIR)[number][] = []
    for (const d of DIR) {
      const nx = x + d.dx
      const ny = y + d.dy
      if (nx >= 0 && nx < width && ny >= 0 && ny < height && !carved[ny][nx]) {
        neighbors.push(d)
      }
    }

    if (neighbors.length === 0) {
      stack.pop()
      continue
    }

    // Pick random neighbor
    const chosen = neighbors[Math.floor(rng() * neighbors.length)]
    const nx = x + chosen.dx
    const ny = y + chosen.dy

    // Remove walls between current and chosen
    cells[y][x].walls[chosen.wall] = false
    cells[ny][nx].walls[chosen.opposite] = false

    carved[ny][nx] = true
    stack.push({ x: nx, y: ny })
  }

  // ─── PLACE POLYTOPE NODES ──────────────────────────────────────────────────
  // Find dead-ends and long-corridor junctions, pick 4 spread across the maze

  const deadEnds: { x: number; y: number }[] = []
  const junctions: { x: number; y: number }[] = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const wallCount = cells[y][x].walls.filter(Boolean).length
      if (wallCount === 3) deadEnds.push({ x, y })
      else if (wallCount <= 1) junctions.push({ x, y })
    }
  }

  // Prefer dead-ends, fill with junctions if needed
  const candidates = [...deadEnds, ...junctions]

  // Pick 4 well-spread nodes using greedy farthest-point
  const polytopeNodes: { x: number; y: number }[] = []
  if (candidates.length > 0) {
    // Start with a random candidate away from start
    const farCandidates = candidates.filter(
      c => Math.abs(c.x - startX) + Math.abs(c.y - startY) > Math.floor(Math.min(width, height) / 3),
    )
    const pool = farCandidates.length > 0 ? farCandidates : candidates
    polytopeNodes.push(pool[Math.floor(rng() * pool.length)])

    for (let i = 1; i < 4 && candidates.length > 0; i++) {
      // Pick candidate farthest from all existing nodes
      let bestDist = -1
      let bestIdx = 0
      for (let j = 0; j < candidates.length; j++) {
        const c = candidates[j]
        // Skip if already a node
        if (polytopeNodes.some(n => n.x === c.x && n.y === c.y)) continue
        // Min distance to any existing node
        const minDist = polytopeNodes.reduce(
          (min, n) => Math.min(min, Math.abs(n.x - c.x) + Math.abs(n.y - c.y)),
          Infinity,
        )
        if (minDist > bestDist) {
          bestDist = minDist
          bestIdx = j
        }
      }
      polytopeNodes.push(candidates[bestIdx])
    }
  }

  // Assign polytope indices
  polytopeNodes.forEach((node, i) => {
    cells[node.y][node.x].polytopeIndex = i
  })

  return {
    width,
    height,
    cells,
    polytopeNodes,
    start: { x: startX, y: startY },
  }
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

/** Convert grid coordinates to world position (center of cell). 
 *  Each cell is CELL_SIZE × CELL_SIZE in world units. */
export const CELL_SIZE = 3
export const WALL_HEIGHT = 3.5
export const WALL_THICKNESS = 0.15

export function gridToWorld(gx: number, gy: number): [number, number] {
  return [gx * CELL_SIZE + CELL_SIZE / 2, gy * CELL_SIZE + CELL_SIZE / 2]
}

export function worldToGrid(wx: number, wz: number): [number, number] {
  return [Math.floor(wx / CELL_SIZE), Math.floor(wz / CELL_SIZE)]
}

/** Check if movement from (wx,wz) by (dx,dz) is blocked by walls.
 *  Returns the clamped position. */
export function clampMovement(
  maze: MazeGrid,
  wx: number, wz: number,
  dx: number, dz: number,
  playerRadius = 0.3,
): [number, number] {
  let nx = wx + dx
  let nz = wz + dz

  // Grid indices
  const gx = Math.floor(nx / CELL_SIZE)
  const gz = Math.floor(nz / CELL_SIZE)

  // Clamp to maze bounds
  const minW = playerRadius
  const maxW = maze.width * CELL_SIZE - playerRadius
  const minH = playerRadius
  const maxH = maze.height * CELL_SIZE - playerRadius
  nx = Math.max(minW, Math.min(maxW, nx))
  nz = Math.max(minH, Math.min(maxH, nz))

  // Position within current cell
  const localX = nx - gx * CELL_SIZE
  const localZ = nz - gz * CELL_SIZE

  if (gx >= 0 && gx < maze.width && gz >= 0 && gz < maze.height) {
    const cell = maze.cells[gz][gx]

    // Top wall (gz boundary, low Z side)
    if (cell.walls[0] && localZ < playerRadius) {
      nz = gz * CELL_SIZE + playerRadius
    }
    // Bottom wall (gz boundary, high Z side)
    if (cell.walls[2] && localZ > CELL_SIZE - playerRadius) {
      nz = gz * CELL_SIZE + CELL_SIZE - playerRadius
    }
    // Left wall (gx boundary, low X side)
    if (cell.walls[3] && localX < playerRadius) {
      nx = gx * CELL_SIZE + playerRadius
    }
    // Right wall (gx boundary, high X side)
    if (cell.walls[1] && localX > CELL_SIZE - playerRadius) {
      nx = gx * CELL_SIZE + CELL_SIZE - playerRadius
    }
  }

  return [nx, nz]
}
