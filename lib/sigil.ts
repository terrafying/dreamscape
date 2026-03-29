import type { SigilRecipe } from '@/lib/types'

const VOWELS = new Set(['A', 'E', 'I', 'O', 'U'])
const DEFAULT_PALETTE = ['#f4c95d', '#c084fc', '#94a3b8']

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function hashString(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRng(seed: number): () => number {
  let state = seed || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 10000) / 10000
  }
}

export function normalizeSigilPhrase(phrase: string): string {
  return phrase
    .toUpperCase()
    .normalize('NFKD')
    .replace(/[^A-Z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function condenseSigilPhrase(phrase: string): {
  normalized: string
  removed: string[]
  glyphLetters: string[]
} {
  const normalized = normalizeSigilPhrase(phrase)
  const letters = normalized.replace(/\s+/g, '').split('')
  const removed: string[] = []
  const seen = new Set<string>()
  const glyphLetters: string[] = []

  for (const letter of letters) {
    if (VOWELS.has(letter)) {
      removed.push(letter)
      continue
    }
    if (seen.has(letter)) continue
    seen.add(letter)
    glyphLetters.push(letter)
  }

  if (glyphLetters.length === 0) {
    for (const letter of letters) {
      if (!seen.has(letter)) {
        seen.add(letter)
        glyphLetters.push(letter)
      }
    }
  }

  return {
    normalized,
    removed,
    glyphLetters: glyphLetters.slice(0, 18),
  }
}

function pickSymmetry(rng: () => number): 4 | 6 | 8 | 12 {
  const options: Array<4 | 6 | 8 | 12> = [4, 6, 8, 12]
  return options[Math.floor(rng() * options.length)]
}

export function buildSigilRecipe(phrase: string, palette: string[] = DEFAULT_PALETTE): SigilRecipe {
  const condensed = condenseSigilPhrase(phrase)
  const source = condensed.normalized || 'VISION BECOMES FORM'
  const letters = condensed.glyphLetters.length > 0 ? condensed.glyphLetters : ['V', 'S', 'N']
  const seed = hashString(letters.join('') || source)
  const rng = createRng(seed)
  const polygonSides = 5 + Math.floor(rng() * 5)
  const polygonSkip = clamp(1 + Math.floor(rng() * Math.max(2, Math.floor(polygonSides / 2))), 1, polygonSides - 2)

  return {
    source_phrase: source,
    normalized_phrase: letters.join(''),
    removed_characters: condensed.removed,
    glyph_letters: letters,
    seed,
    geometry: {
      symmetry: pickSymmetry(rng),
      rings: 2 + Math.floor(rng() * 3),
      spokes: 3 + Math.floor(rng() * 6),
      polygon_sides: polygonSides,
      polygon_skip: polygonSkip,
      line_weight: Number((1 + rng() * 1.5).toFixed(2)),
      rotation: Number((rng() * Math.PI * 2).toFixed(3)),
    },
    style: {
      palette: palette.length > 0 ? palette.slice(0, 4) : DEFAULT_PALETTE,
      glow: Number((0.2 + rng() * 0.5).toFixed(2)),
      roughness: Number((0.05 + rng() * 0.35).toFixed(2)),
      border_mode: ['none', 'circle', 'double-circle', 'seal'][Math.floor(rng() * 4)] as SigilRecipe['style']['border_mode'],
    },
  }
}

function polar(cx: number, cy: number, radius: number, angle: number) {
  return {
    x: cx + Math.cos(angle) * radius,
    y: cy + Math.sin(angle) * radius,
  }
}

export interface SigilRenderData {
  rings: Array<{ radius: number }>
  spokes: Array<{ x1: number; y1: number; x2: number; y2: number }>
  starPath: string
  glyphPath: string
  runeMarks: Array<{ x1: number; y1: number; x2: number; y2: number }>
}

export function createSigilRenderData(recipe: SigilRecipe, size = 240): SigilRenderData {
  const cx = size / 2
  const cy = size / 2
  const outerRadius = size * 0.36
  const innerRadius = outerRadius * 0.18
  const rings = Array.from({ length: recipe.geometry.rings }, (_, index) => ({
    radius: innerRadius + ((outerRadius - innerRadius) * (index + 1)) / recipe.geometry.rings,
  }))

  const spokes = Array.from({ length: recipe.geometry.spokes }, (_, index) => {
    const angle = recipe.geometry.rotation + (index / recipe.geometry.spokes) * Math.PI * 2
    const p1 = polar(cx, cy, innerRadius * 0.5, angle)
    const p2 = polar(cx, cy, outerRadius, angle)
    return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y }
  })

  const starPoints = Array.from({ length: recipe.geometry.polygon_sides }, (_, index) => {
    const angle = recipe.geometry.rotation + (index / recipe.geometry.polygon_sides) * Math.PI * 2
    return polar(cx, cy, outerRadius * 0.72, angle)
  })
  const starPathPoints: string[] = []
  const visited = new Set<number>()
  let current = 0
  while (!visited.has(current)) {
    visited.add(current)
    const point = starPoints[current]
    starPathPoints.push(`${point.x},${point.y}`)
    current = (current + recipe.geometry.polygon_skip) % recipe.geometry.polygon_sides
  }
  if (starPathPoints.length > 0) {
    starPathPoints.push(starPathPoints[0])
  }

  const letterValues = recipe.glyph_letters.map((letter) => (letter.charCodeAt(0) - 64) / 26)
  const glyphPoints = letterValues.map((value, index) => {
    const angle = recipe.geometry.rotation + value * Math.PI * 2 + (index / Math.max(1, recipe.glyph_letters.length)) * 0.35
    const radius = innerRadius + (outerRadius - innerRadius) * (0.2 + value * 0.45)
    return polar(cx, cy, radius, angle)
  })
  const glyphPath = glyphPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ')

  const runeMarks = Array.from({ length: recipe.geometry.symmetry / 2 }, (_, index) => {
    const angle = recipe.geometry.rotation + (index / (recipe.geometry.symmetry / 2)) * Math.PI * 2 + Math.PI / recipe.geometry.symmetry
    const center = polar(cx, cy, outerRadius * 1.08, angle)
    const dx = Math.cos(angle + Math.PI / 2) * size * 0.018
    const dy = Math.sin(angle + Math.PI / 2) * size * 0.018
    return {
      x1: center.x - dx,
      y1: center.y - dy,
      x2: center.x + dx,
      y2: center.y + dy,
    }
  })

  return {
    rings,
    spokes,
    starPath: starPathPoints.length > 1 ? `M ${starPathPoints.join(' L ')}` : '',
    glyphPath,
    runeMarks,
  }
}

export function buildVisionImagePrompt(title: string, intention: string, motifs: string[], palette: string[]): string {
  const motifLine = motifs.length > 0 ? motifs.slice(0, 5).join(', ') : 'altar cloth, candle glow, sacred geometry'
  const paletteLine = palette.length > 0 ? palette.join(', ') : DEFAULT_PALETTE.join(', ')
  return [
    `Create a mystical vision board illustration titled "${title}".`,
    `The central future-facing intention is: ${intention}.`,
    `Visual motifs: ${motifLine}.`,
    `Color palette: ${paletteLine}.`,
    'Style: ceremonial collage, esoteric dream-board, luminous textures, sacred geometry, elegant occult symbolism, atmospheric but hopeful, richly layered, no readable text.',
  ].join(' ')
}
