import type { BirthData, NatalPlacements, CurrentSky } from './types'

// ─── Sun Signs ───────────────────────────────────────────────────────────────

const SUN_SIGNS: { sign: string; start: [number, number]; end: [number, number] }[] = [
  { sign: 'Capricorn', start: [12, 22], end: [1, 19] },
  { sign: 'Aquarius', start: [1, 20], end: [2, 18] },
  { sign: 'Pisces', start: [2, 19], end: [3, 20] },
  { sign: 'Aries', start: [3, 21], end: [4, 19] },
  { sign: 'Taurus', start: [4, 20], end: [5, 20] },
  { sign: 'Gemini', start: [5, 21], end: [6, 20] },
  { sign: 'Cancer', start: [6, 21], end: [7, 22] },
  { sign: 'Leo', start: [7, 23], end: [8, 22] },
  { sign: 'Virgo', start: [8, 23], end: [9, 22] },
  { sign: 'Libra', start: [9, 23], end: [10, 22] },
  { sign: 'Scorpio', start: [10, 23], end: [11, 21] },
  { sign: 'Sagittarius', start: [11, 22], end: [12, 21] },
]

export function getSunSign(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  const m = d.getUTCMonth() + 1
  const day = d.getUTCDate()

  for (const { sign, start, end } of SUN_SIGNS) {
    const [sm, sd] = start
    const [em, ed] = end
    if (sm <= em) {
      if ((m === sm && day >= sd) || (m === em && day <= ed) || (m > sm && m < em)) return sign
    } else {
      // wraps year (Capricorn)
      if ((m === sm && day >= sd) || m > sm || m < em || (m === em && day <= ed)) return sign
    }
  }
  return 'Capricorn'
}

// ─── Moon Phase ───────────────────────────────────────────────────────────────

const MOON_PHASE_NAMES = [
  'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
  'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
]
const MOON_PHASE_EMOJIS = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘']

export function getMoonPhase(dateStr: string): { name: string; emoji: string; illumination: number } {
  const d = new Date(dateStr + 'T12:00:00Z')
  const known = new Date('2000-01-06T18:14:00Z') // known new moon
  const synodicMonth = 29.530588853
  const diff = (d.getTime() - known.getTime()) / (1000 * 60 * 60 * 24)
  const phase = ((diff % synodicMonth) + synodicMonth) % synodicMonth
  const idx = Math.floor((phase / synodicMonth) * 8) % 8
  const illumination = Math.round(50 * (1 - Math.cos((phase / synodicMonth) * 2 * Math.PI)))

  return {
    name: MOON_PHASE_NAMES[idx],
    emoji: MOON_PHASE_EMOJIS[idx],
    illumination,
  }
}

// ─── Moon Sign ───────────────────────────────────────────────────────────────

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

export function getMoonSign(dateStr: string): string {
  // Approximate moon longitude based on known reference
  const d = new Date(dateStr + 'T12:00:00Z')
  const J2000 = new Date('2000-01-01T12:00:00Z')
  const days = (d.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24)

  // Simplified moon longitude calculation
  const L = (218.316 + 13.176396 * days) % 360
  const M = (134.963 + 13.064993 * days) % 360
  const F = (93.272 + 13.229350 * days) % 360
  const toRad = (deg: number) => (deg * Math.PI) / 180

  const lambda = L + 6.289 * Math.sin(toRad(M))
  const normalized = ((lambda % 360) + 360) % 360
  const signIdx = Math.floor(normalized / 30) % 12

  return ZODIAC_SIGNS[signIdx]
}

// ─── Retrogrades ─────────────────────────────────────────────────────────────

interface RetrogradeWindow {
  planet: string
  start: string
  end: string
}

const RETROGRADE_WINDOWS: RetrogradeWindow[] = [
  // Mercury retrogrades 2025-2026
  { planet: 'Mercury', start: '2025-03-15', end: '2025-04-07' },
  { planet: 'Mercury', start: '2025-07-18', end: '2025-08-11' },
  { planet: 'Mercury', start: '2025-11-09', end: '2025-11-29' },
  { planet: 'Mercury', start: '2026-03-15', end: '2026-04-07' },
  // Venus
  { planet: 'Venus', start: '2025-03-01', end: '2025-04-12' },
  { planet: 'Venus', start: '2026-07-22', end: '2026-09-03' },
  // Mars
  { planet: 'Mars', start: '2024-12-06', end: '2025-02-23' },
  { planet: 'Mars', start: '2026-12-09', end: '2027-02-28' },
  // Saturn
  { planet: 'Saturn', start: '2025-07-13', end: '2025-11-27' },
  { planet: 'Saturn', start: '2026-07-23', end: '2026-12-05' },
  // Jupiter
  { planet: 'Jupiter', start: '2025-11-11', end: '2026-03-10' },
]

export function getCurrentRetrogrades(dateStr: string): string[] {
  const d = new Date(dateStr + 'T12:00:00Z')
  return RETROGRADE_WINDOWS
    .filter(({ start, end }) => {
      const s = new Date(start + 'T00:00:00Z')
      const e = new Date(end + 'T23:59:59Z')
      return d >= s && d <= e
    })
    .map(({ planet }) => planet)
}

// ─── Current Transits ─────────────────────────────────────────────────────────

export function getCurrentTransits(dateStr: string): {
  sunSign: string
  moonSign: string
  moonPhase: string
  moonPhaseEmoji: string
  retrogrades: string[]
} {
  const phase = getMoonPhase(dateStr)
  return {
    sunSign: getSunSign(dateStr),
    moonSign: getMoonSign(dateStr),
    moonPhase: phase.name,
    moonPhaseEmoji: phase.emoji,
    retrogrades: getCurrentRetrogrades(dateStr),
  }
}

// ─── Natal Placements ─────────────────────────────────────────────────────────

export function getNatalPlacements(birthData: BirthData): NatalPlacements {
  const sunSign = getSunSign(birthData.date)
  const moonSign = getMoonSign(birthData.date)

  // Rising sign requires birth time + location for accurate calc
  // Approximate: use birth time hour offset into zodiac cycle
  let risingSign: string | undefined
  if (birthData.time) {
    const [h, m] = birthData.time.split(':').map(Number)
    const hourFraction = h + m / 60
    // Each sign rises for ~2 hours; Aries rises at ~6am local
    const risingIdx = Math.floor(((hourFraction - 6 + 24) % 24) / 2) % 12
    risingSign = ZODIAC_SIGNS[risingIdx]
  }

  return { sunSign, moonSign, risingSign }
}

// ─── Dominant Transit Description ─────────────────────────────────────────────

export function getDominantTransit(dateStr: string): string {
  const retrogrades = getCurrentRetrogrades(dateStr)
  const moonSign = getMoonSign(dateStr)
  const moonPhase = getMoonPhase(dateStr)
  const sunSign = getSunSign(dateStr)

  if (retrogrades.includes('Mercury')) {
    return `Mercury retrograde invites revisiting old communications and thought patterns — dreams may surface unresolved conversations.`
  }
  if (retrogrades.includes('Venus')) {
    return `Venus retrograde turns attention inward to relationship values — dreams may illuminate what you truly desire from others.`
  }
  if (retrogrades.includes('Mars')) {
    return `Mars retrograde redirects energy inward — dreams may process frustration, drive, and unexpressed assertiveness.`
  }
  if (moonPhase.name === 'Full Moon') {
    return `The Full Moon in ${moonSign} amplifies emotional intensity — dreams tonight are likely vivid and symbolically charged.`
  }
  if (moonPhase.name === 'New Moon') {
    return `The New Moon in ${moonSign} opens a blank canvas for the subconscious — expect seed-planting or threshold dreams.`
  }
  return `Sun in ${sunSign}, Moon in ${moonSign} (${moonPhase.name}) — a ${moonSign.toLowerCase()}-tinted emotional landscape shapes tonight's dreamspace.`
}

export function buildAstroContext(dateStr: string, birthData?: BirthData | null): string {
  const transits = getCurrentTransits(dateStr)
  const dominant = getDominantTransit(dateStr)
  const natal = birthData ? getNatalPlacements(birthData) : null

  let ctx = `Current sky: Sun in ${transits.sunSign}, Moon in ${transits.moonSign} (${transits.moonPhase} ${transits.moonPhaseEmoji})`
  if (transits.retrogrades.length > 0) {
    ctx += `. Retrograde planets: ${transits.retrogrades.join(', ')}`
  }
  ctx += `\nDominant transit: ${dominant}`
  if (natal) {
    ctx += `\nNatal chart: Sun in ${natal.sunSign}, Moon in ${natal.moonSign}`
    if (natal.risingSign) ctx += `, Rising in ${natal.risingSign}`
  }
  return ctx
}
