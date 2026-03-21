import type { BirthData, NatalPlacements, CurrentSky, LunarMansion, PlanetaryAspect, ChironPlacement } from './types'

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

export function getCurrentSky(dateStr: string, birthData?: BirthData | null): CurrentSky {
  const transits = getCurrentTransits(dateStr)
  return {
    ...transits,
    dominantTransit: getDominantTransit(dateStr),
    lunarMansion: getLunarMansion(dateStr),
    aspects: getPlanetaryAspects(dateStr),
    chiron: getChironPlacement(dateStr, birthData),
    moonHouse: getMoonHouse(dateStr, birthData),
    outerPlanets: getOuterPlanetTransits(dateStr),
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
  const sky = getCurrentSky(dateStr, birthData)
  const natal = birthData ? getNatalPlacements(birthData) : null

  let ctx = `Current sky: Sun in ${sky.sunSign}, Moon in ${sky.moonSign} (${sky.moonPhase} ${sky.moonPhaseEmoji})`
  if (sky.retrogrades.length > 0) {
    ctx += `. Retrograde planets: ${sky.retrogrades.join(', ')}`
  }
  ctx += `\nDominant transit: ${sky.dominantTransit}`
  ctx += `\nMoon in ${sky.lunarMansion!.name} lunar mansion — ${sky.lunarMansion!.meaning}`

  if (sky.aspects!.length > 0) {
    const top = sky.aspects!.slice(0, 5)
    ctx += `\nActive transit aspects: ${top.map(a => `${a.planet1} ${a.aspect} ${a.planet2}`).join('; ')}`
  }
  if (sky.chiron) ctx += `\nChiron in ${sky.chiron.sign}`
  if (sky.moonHouse) ctx += `\nMoon in House ${sky.moonHouse}`

  if (sky.outerPlanets!.length > 0) {
    ctx += `\nOuter planets: ${sky.outerPlanets!.map(o => `${o.planet} in ${o.sign}`).join(', ')}`
  }
  if (natal) {
    ctx += `\nNatal chart: Sun in ${natal.sunSign}, Moon in ${natal.moonSign}`
    if (natal.risingSign) ctx += `, Rising in ${natal.risingSign}`
  }
  return ctx
}

// ─── Lunar Mansions (28 Nakshatras) ───────────────────────────────────────────

const NAKSHATRAS = [
  { name: 'Ashwini', deity: 'Ashwini Kumaras', symbol: '🐴', meaning: 'Swift healer energy — sudden beginnings, rapid movement' },
  { name: 'Bharani', deity: 'Yama', symbol: '🩸', meaning: 'The bearer — transformation, creative potential, birth' },
  { name: 'Krittika', deity: 'Agni', symbol: '🪓', meaning: 'The cutter — discrimination, purification through fire' },
  { name: 'Rohini', deity: 'Brahma', symbol: '🛕', meaning: 'The growing one — beauty, attraction, cultivation' },
  { name: 'Mrigashira', deity: 'Soma', symbol: '🦌', meaning: 'The searcher — curiosity, wandering, seeking' },
  { name: 'Ardra', deity: 'Rudra', symbol: '💧', meaning: 'The storm god — renovation, destruction preceding renewal' },
  { name: 'Punarvasu', deity: 'Aditi', symbol: '🏹', meaning: 'The bow-bearer — return, restoration, abundance' },
  { name: 'Pushya', deity: 'Brihaspati', symbol: '🐐', meaning: 'The nourisher — nurturing, protection, spiritual growth' },
  { name: 'Ashlesha', deity: 'Sarpa', symbol: '🐍', meaning: 'The embracing — hidden depths, mysteries, coiled power' },
  { name: 'Magha', deity: 'Pitris', symbol: '🦁', meaning: 'The mighty — ancestral legacy, authority, glory' },
  { name: 'Purva Phalguni', deity: 'Aryaman', symbol: '🏹', meaning: 'Former red one — love, pleasure, friendship' },
  { name: 'Uttara Phalguni', deity: 'Aryaman', symbol: '🛏', meaning: 'Latter red one — friendship, alliances, generosity' },
  { name: 'Hasta', deity: 'Savitar', symbol: '🤲', meaning: 'The hand-maker — craftsmanship, skill, dexterity' },
  { name: 'Chitra', deity: 'Tvastar', symbol: '💎', meaning: 'The bright one — beauty, uniqueness, creative design' },
  { name: 'Swati', deity: 'Vayu', symbol: '🌬', meaning: 'The independent — self-reliance, freedom, gentle movement' },
  { name: 'Vishaka', deity: 'Indra/Agni', symbol: '⚓', meaning: 'The forked — ambition, duality, multi-directional energy' },
  { name: 'Anuradha', deity: 'Mitra', symbol: '🏹', meaning: 'The follower — devotion, friendship, balanced ambition' },
  { name: 'Jyeshtha', deity: 'Indra', symbol: '🛡', meaning: 'The eldest — protection, leadership, responsibility' },
  { name: 'Mula', deity: 'Nirriti', symbol: '⛓', meaning: 'The root — digging deep, uncovering hidden truths, foundation' },
  { name: 'Purva Ashadha', deity: 'Apas', symbol: '🐘', meaning: 'Former unconquered — victory, water element, purification' },
  { name: 'Uttara Ashadha', deity: 'Vishwa Devas', symbol: '🐘', meaning: 'Latter unconquered — truth, righteousness, divine support' },
  { name: 'Shravana', deity: 'Vishnu', symbol: '🦅', meaning: 'The hearing — listening, learning, divine connection' },
  { name: 'Dhanishta', deity: 'Vasus', symbol: '🚣', meaning: 'The richest — abundance, wealth, musical rhythm' },
  { name: 'Shatabhisha', deity: 'Varuna', symbol: '🦷', meaning: 'Hundred healers — secrecy, occult knowledge, healing' },
  { name: 'Purva Bhadra', deity: 'Aja Ekapada', symbol: '🐟', meaning: 'Former blessed — spiritual initiation, kundalini' },
  { name: 'Uttara Bhadra', deity: 'Aja Ekapada', symbol: '🐉', meaning: 'Latter blessed — steady spiritual progress' },
  { name: 'Revati', deity: 'Pushani', symbol: '🐟', meaning: 'The wealth — journeys, nourishment, Piscean protection' },
]

const NAKSHATRA_DEG = 360 / 27 // ~13°20' per nakshatra

function moonEclipticLongitude(dateStr: string): number {
  const d = new Date(dateStr + 'T12:00:00Z')
  const J2000 = new Date('2000-01-01T12:00:00Z')
  const days = (d.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24)
  const L = (218.316 + 13.176396 * days) % 360
  const M = (134.963 + 13.064993 * days) % 360
  return (L + 6.289 * Math.sin((M * Math.PI) / 180) + 360) % 360
}

export function getLunarMansion(dateStr: string): LunarMansion {
  const lambda = moonEclipticLongitude(dateStr)
  const idx = Math.floor(lambda / NAKSHATRA_DEG) % 27
  return { ...NAKSHATRAS[idx], degree: idx }
}

// ─── Planet Longitudes ─────────────────────────────────────────────────────────

const PLANET_MEAN_RATE: Record<string, number> = {
  Sun: 0.9856474,
  Moon: 13.176396,
  Mercury: 4.0932,
  Venus: 1.6021,
  Mars: 0.5240,
  Jupiter: 0.0831,
  Saturn: 0.0334,
  Uranus: 0.0117,
  Neptune: 0.0059,
  Pluto: 0.00397,
  Chiron: 0.0035,
}

const PLANET_MEAN_LONG: Record<string, number> = {
  Sun: 280.46646,
  Moon: 218.3165,
  Mercury: 252.2509,
  Venus: 181.9798,
  Mars: 355.4330,
  Jupiter: 34.3516,
  Saturn: 50.0774,
  Uranus: 314.0550,
  Neptune: 304.3487,
  Pluto: 238.9290,
  Chiron: 310.180,
}

function getPlanetLongitude(date: Date, planet: string): number {
  const J2000 = new Date('2000-01-01T12:00:00Z')
  const days = (date.getTime() - J2000.getTime()) / (1000 * 60 * 60 * 24)
  const rate = PLANET_MEAN_RATE[planet] ?? 0
  const base = PLANET_MEAN_LONG[planet] ?? 0
  return ((base + rate * days) % 360 + 360) % 360
}

function planetSign(deg: number): string {
  const idx = Math.floor(deg / 30) % 12
  return ZODIAC_SIGNS[idx]
}

// ─── Planetary Aspects ─────────────────────────────────────────────────────────

const ASPECT_DEFINITIONS = [
  { name: 'Conjunction', angle: 0, orb: 10 },
  { name: 'Sextile', angle: 60, orb: 6 },
  { name: 'Square', angle: 90, orb: 8 },
  { name: 'Trine', angle: 120, orb: 8 },
  { name: 'Opposition', angle: 180, orb: 10 },
]

const PLANET_PAIRS: [string, string][] = [
  ['Moon', 'Sun'], ['Moon', 'Mercury'], ['Moon', 'Venus'], ['Moon', 'Mars'],
  ['Moon', 'Jupiter'], ['Moon', 'Saturn'], ['Moon', 'Uranus'], ['Moon', 'Neptune'], ['Moon', 'Pluto'],
  ['Sun', 'Mercury'], ['Sun', 'Venus'], ['Sun', 'Mars'], ['Sun', 'Jupiter'],
  ['Sun', 'Saturn'], ['Sun', 'Uranus'], ['Sun', 'Neptune'], ['Sun', 'Pluto'],
  ['Venus', 'Mars'], ['Venus', 'Jupiter'], ['Venus', 'Saturn'], ['Mars', 'Jupiter'],
]

const ASPECT_MEANINGS: Record<string, Record<string, string>> = {
  'Moon-Saturn': { Square: 'The Moon-Saturn square brings a weight to the unconscious — dreams may confront limitations, grief, or structures that feel confining.', Opposition: 'The Moon-Saturn opposition amplifies feelings of restriction or burden — dreams may revisit themes of responsibility, duty, or unfulfilled obligations.', Trine: 'The Moon-Saturn trine provides a grounded emotional landscape — dreams may offer practical wisdom or a sense of earned security.' },
  'Moon-Mars': { Square: 'The Moon-Mars square stirs restless, reactive energy — dreams may feature conflict, impatience, or suppressed anger surfacing.', Trine: 'The Moon-Mars trine fuels instinctive action — dreams may show bold, directed energy or the courage to confront what has been avoided.', Opposition: 'The Moon-Mars opposition creates tension between emotional impulse and assertiveness — dreams may dramatize inner conflict or reactive encounters.' },
  'Moon-Neptune': { Square: 'The Moon-Neptune square dissolves emotional boundaries — dreams may be hyper-vivid, surreal, or blur the line between self and other.', Trine: 'The Moon-Neptune trine opens a channel to the collective unconscious — expect symbolic, prophetic, or spiritually rich dreams.', Opposition: 'The Moon-Neptune opposition heightens sensitivity and imagination — dreams may feel telepathic, compensatory, or haunted by dissolving realities.' },
  'Moon-Uranus': { Square: 'The Moon-Uranus square brings sudden emotional shifts — dreams may be erratic, surprising, or reveal sudden insights.', Trine: 'The Moon-Uranus trine sparks intuitive breakthroughs — expect illuminating, unconventional dreams that defy ordinary logic.', Opposition: 'The Moon-Uranus opposition creates emotional volatility — dreams may feature breakthrough moments, shocking revelations, or rebellious impulses.' },
  'Sun-Neptune': { Square: 'The Sun-Neptune square dissolves the boundary between inner and outer — dreams may be hyper-vivid, prophetic, or blur the line between waking and sleeping.', Trine: 'The Sun-Neptune trine connects the conscious self to collective wisdom — expect inspired, spiritual, or artistically charged dreams.', Opposition: 'The Sun-Neptune opposition heightens idealism and sensitivity — dreams may confront illusions, escapism, or visionary truths.' },
  'Sun-Pluto': { Square: 'The Sun-Pluto square intensifies the will — dreams may confront themes of power, control, mortality, or deep transformation.', Trine: 'The Sun-Pluto trine grants access to deep regenerative power — expect transformative, psychologically piercing dreams.', Opposition: 'The Sun-Pluto opposition draws power dynamics into the unconscious — dreams may surface themes of manipulation, vulnerability, or enforced surrender.' },
  'Sun-Mars': { Square: 'The Sun-Mars square ignites assertiveness and tension — dreams may feature conflict, competition, or blocked energy.', Trine: 'The Sun-Mars trine channels energy powerfully — dreams may feature heroic action, bold decisions, or physical prowess.' },
  'Moon-Jupiter': { Square: 'The Moon-Jupiter square expands emotional horizons — dreams may feature excess, overconfidence, or restless seeking.', Trine: 'The Moon-Jupiter trine blesses emotional intuition — expect optimistic, expansive, meaningful dreams with spiritual depth.' },
  'Venus-Neptune': { Square: 'The Venus-Neptune square heightens idealization — dreams may confront illusions in love, beauty, or relationships.', Trine: 'The Venus-Neptune trine opens the heart to transcendent beauty — expect romantic, artistic, or spiritually nourishing dreams.' },
  'Mars-Saturn': { Square: 'The Mars-Saturn square creates friction between drive and limitation — dreams may confront frustration, obstacles, or suppressed ambition.', Trine: 'The Mars-Saturn trine channels disciplined energy — dreams may feature structured action, mastery, or productive perseverance.' },
}

export function getPlanetaryAspects(dateStr: string): PlanetaryAspect[] {
  const d = new Date(dateStr + 'T12:00:00Z')
  const aspects: PlanetaryAspect[] = []

  for (const [p1, p2] of PLANET_PAIRS) {
    const l1 = getPlanetLongitude(d, p1)
    const l2 = getPlanetLongitude(d, p2)
    const diff = Math.abs(l1 - l2)
    const normDiff = Math.min(diff, 360 - diff)

    for (const asp of ASPECT_DEFINITIONS) {
      const orb = Math.abs(normDiff - asp.angle)
      if (orb <= asp.orb) {
        const key = `${p1}-${p2}`
        const meaningMap = ASPECT_MEANINGS[key]
        let meaning = `The ${p1} ${asp.name} ${p2} creates ${asp.name === 'Conjunction' ? 'merged energy' : asp.name === 'Square' ? 'tension that asks for integration' : asp.name === 'Trine' ? 'harmonious flow' : asp.name === 'Opposition' ? 'polarized energy seeking balance' : 'flexible opportunity'} — dreams reflect this dynamic.`
        if (meaningMap?.[asp.name]) meaning = meaningMap[asp.name]
        aspects.push({ planet1: p1, planet2: p2, aspect: asp.name, orb: Math.round(orb * 10) / 10, meaning })
      }
    }
  }

  // Sort by exactness (smallest orb first), limit to 8
  aspects.sort((a, b) => a.orb - b.orb)
  return aspects.slice(0, 8)
}

// ─── Chiron ───────────────────────────────────────────────────────────────────

export function getChironPlacement(dateStr: string, birthData?: BirthData | null): ChironPlacement {
  const d = new Date(dateStr + 'T12:00:00Z')
  const lon = getPlanetLongitude(d, 'Chiron')
  const sign = planetSign(lon)
  let house: number | undefined
  if (birthData?.time) {
    house = getMoonHouse(dateStr, birthData)
  }
  return { sign, house }
}

// ─── House System ─────────────────────────────────────────────────────────────

const HOUSE_MEANINGS: Record<number, string> = {
  1: 'Self — identity, the dreamer, appearance, the mask',
  2: 'Resources — values, possessions, self-worth, what you hold dear',
  3: 'Communication — siblings, short journeys, daily mind, learning',
  4: 'Home — roots, family, the unconscious, endings, foundation',
  5: 'Creativity — children, play, romance, creative expression, joy',
  6: 'Health — daily work, service, illness, routines, health',
  7: 'Partnership — marriage, open enemies, one-to-one relationships',
  8: 'Transformation — shared resources, occult, depth, death/rebirth',
  9: 'Philosophy — higher mind, travel, spirituality, dreams, wisdom',
  10: 'Vocation — career, public image, authority, ambition',
  11: 'Community — friends, hopes, wishes, group identity',
  12: 'Unconscious — hidden self, institutions, self-undoing, secrets',
}

export function getMoonHouse(dateStr: string, birthData?: BirthData | null): number | undefined {
  if (!birthData?.time) return undefined
  const [h, m] = birthData.time.split(':').map(Number)
  const hourFraction = h + m / 60
  const asc = ((hourFraction - 6 + 24) % 24) * 15
  const d = new Date(dateStr + 'T12:00:00Z')
  const moonLon = getPlanetLongitude(d, 'Moon')
  const moonHouse = Math.floor(((moonLon - asc + 360) % 360) / 30) + 1
  return moonHouse
}

export function getMoonHouseMeaning(house: number): string {
  return HOUSE_MEANINGS[house] ?? ''
}

// ─── Outer Planet Transits ─────────────────────────────────────────────────────

const OUTER_DESCRIPTIONS: Record<string, Record<string, string>> = {
  Jupiter: {
    Aries: 'Jupiter in Aries expands the spirit of new beginnings — dreams may feature bold journeys, pioneering themes, or a sense of first-energy.',
    Taurus: 'Jupiter in Taurus expands values and material world — dreams may feature abundance, growth, or the cultivation of what is beautiful and lasting.',
    Gemini: 'Jupiter in Gemini expands the curious mind — dreams may feature learning, communication, diverse perspectives, or restless intellectual exploration.',
    Cancer: 'Jupiter in Cancer expands emotional and familial roots — dreams may feature home, ancestors, nurturing, or deep emotional growth.',
    Leo: 'Jupiter in Leo expands creative self-expression — dreams may feature performance, children, romance, or a spotlight on personal creativity.',
    Virgo: 'Jupiter in Virgo expands through refinement — dreams may feature health, daily rituals, work, or the integration of analysis and meaning.',
    Libra: 'Jupiter in Libra expands relationships and justice — dreams may feature partnerships, legal matters, beauty, or the balance of give and take.',
    Scorpio: 'Jupiter in Scorpio expands through transformation — dreams may feature intense depth, shared resources, occult knowledge, or regenerative power.',
    Sagittarius: 'Jupiter in Sagittarius expands through adventure — dreams may feature travel, philosophy, spiritual quest, or the search for ultimate meaning.',
    Capricorn: 'Jupiter in Capricorn expands through discipline — dreams may feature ambition, career, structures, or the tension between vision and reality.',
    Aquarius: 'Jupiter in Aquarius expands through innovation — dreams may feature collective ideas, humanitarian ideals, or the tension between individual and group.',
    Pisces: 'Jupiter in Pisces expands through transcendence — dreams may feature mystical experiences, compassion, spirituality, or dissolution of boundaries.',
  },
  Saturn: {
    Aries: 'Saturn in Aries confronts issues of self-assertion — dreams may feature battles with ego, impatience, or the cost of self-centered action.',
    Taurus: 'Saturn in Taurus confronts values and resources — dreams may feature financial pressure, possessiveness, or the slow cultivation of lasting worth.',
    Gemini: 'Saturn in Gemini challenges communication — dreams may feature miscommunication, learning obstacles, or the weight of daily responsibilities.',
    Cancer: 'Saturn in Cancer confronts emotional and familial bonds — dreams may feature ancestral patterns, home pressures, or the weight of caretaking.',
    Leo: 'Saturn in Leo challenges creative self-expression — dreams may feature blocked creativity, ego pride, or the weight of being seen and recognized.',
    Virgo: 'Saturn in Virgo demands perfection in health and work — dreams may feature health anxieties, perfectionism, or the weight of daily responsibility.',
    Libra: 'Saturn in Libra demands balance in relationships — dreams may feature marriage pressures, legal challenges, or the weight of fairness.',
    Scorpio: 'Saturn in Scorpio intensifies transformative power — dreams may feature deep psychological work, shared secrets, or mortality themes.',
    Sagittarius: 'Saturn in Sagittarius tests belief systems — dreams may feature conflicts of faith, philosophical challenges, or restricted travel.',
    Capricorn: 'Saturn in Capricorn builds structures — dreams may feature career ambition, authority figures, or the long road to mastery and achievement.',
    Aquarius: 'Saturn in Aquarius challenges collective ideals — dreams may feature tension between personal freedom and group responsibility, or unconventional authority.',
    Pisces: 'Saturn in Pisces dissolves boundaries carefully — dreams may feature spiritual materialism, addiction, escape, or the need for compassionate limits.',
  },
  Uranus: {
    Taurus: 'Uranus in Taurus disrupts established values — dreams may feature sudden changes in possessions, finances, or what you consider beautiful and valuable.',
    Gemini: 'Uranus in Gemini accelerates the mind — dreams may feature sudden insights, unusual ideas, or the shattering of conventional thought patterns.',
    Cancer: 'Uranus in Cancer uproots the home — dreams may feature sudden moves, family upheaval, or unexpected emotional revelations.',
    Leo: 'Uranus in Leo sparks creative rebellion — dreams may feature artistic breakthroughs, sudden self-expression, or the demand for authentic individuality.',
    Virgo: 'Uranus in Virgo disrupts health routines — dreams may feature sudden health awareness, unusual treatments, or radical approaches to daily life.',
    Libra: 'Uranus in Libra challenges relationships — dreams may feature sudden attractions, unconventional partnerships, or relationship experiments.',
    Scorpio: 'Uranus in Scorpio intensifies transformation — dreams may feature profound psychological revolutions, occult insights, or deep regeneration.',
    Sagittarius: 'Uranus in Sagittarius liberates belief systems — dreams may feature sudden paradigm shifts, spiritual revelations, or unconventional truth-seeking.',
    Capricorn: 'Uranus in Capricorn disrupts structures — dreams may feature sudden changes in authority, career upheaval, or the collapse of established institutions.',
    Aquarius: 'Uranus in Aquarius accelerates collective change — dreams may feature visionary ideas, group movements, or the tension between individuality and community.',
    Pisces: 'Uranus in Pisces dissolves the boundaries between worlds — dreams may feature mystical experiences, channeling, or profound spiritual disruption.',
  },
  Neptune: {
    Aries: 'Neptune in Aries dissolves certain aspects of ego-identity — dreams may feature identity confusion, spiritual warfare, or the search for authentic self.',
    Taurus: 'Neptune in Taurus dissolves material certainties — dreams may feature financial confusion, romantic idealization, or the search for true value.',
    Gemini: 'Neptune in Gemini dissolves clarity of thought — dreams may feature deception, confusion, telepathy, or the blending of fact and fantasy.',
    Cancer: 'Neptune in Cancer dissolves emotional boundaries — dreams may feature ancestral karma, emotional fog, or profound empathy with suffering.',
    Leo: 'Neptune in Leo dissolves ego boundaries — dreams may feature grandiosity, artistic inspiration, or the pull between spiritual humility and personal glory.',
    Virgo: 'Neptune in Virgo dissolves certain standards — dreams may feature health confusion, mystical healing, or the challenge of discriminating truth from illusion.',
    Libra: 'Neptune in Libra dissolves relational boundaries — dreams may feature karmic relationships, romantic fantasies, or indecision between partners.',
    Scorpio: 'Neptune in Scorpio deepens transformative power — dreams may feature profound psychological depth, psychic experiences, or contact with collective unconscious.',
    Sagittarius: 'Neptune in Sagittarius expands spiritual horizons — dreams may feature mystical travel, religious experiences, or profound philosophical revelations.',
    Capricorn: 'Neptune in Capricorn dissolves institutional authority — dreams may feature disillusionment with structures, spiritual ambition, or deceptive power.',
    Aquarius: 'Neptune in Aquarius dissolves collective boundaries — dreams may feature utopian visions, collective consciousness, or the blurring of individual and group.',
    Pisces: 'Neptune in Pisces dissolves all boundaries — dreams may feature deep spiritual experiences, unity consciousness, or profound dissolution of the self.',
  },
  Pluto: {
    Taurus: 'Pluto in Taurus transforms material values — dreams may feature intense financial changes, shifts in self-worth, or the rebuilding of foundations.',
    Gemini: 'Pluto in Gemini transforms communication — dreams may feature intense dialogue, hidden information surfacing, or psychological pressure from media.',
    Cancer: 'Pluto in Cancer transforms the family — dreams may feature ancestral healing, deep emotional transformation, or confronting family karma.',
    Leo: 'Pluto in Leo transforms personal power — dreams may feature power struggles, ego death and rebirth, or the demand for authentic creative expression.',
    Virgo: 'Pluto in Virgo transforms health and service — dreams may feature intense health confrontations, radical self-improvement, or deep service to others.',
    Libra: 'Pluto in Libra transforms relationships — dreams may feature power dynamics in partnerships, deep confrontations, or profound relational transformation.',
    Scorpio: 'Pluto in Scorpio drives deep transformation — dreams may feature intense psychological depth, occult knowledge, death and rebirth themes, or regenerative power.',
    Sagittarius: 'Pluto in Sagittarius transforms beliefs — dreams may feature paradigm destruction, spiritual warfare, or the search for ultimate truth.',
    Capricorn: 'Pluto in Capricorn transforms institutions — dreams may feature power struggles with authority, career earthquakes, or the dismantling of old structures.',
    Aquarius: 'Pluto in Aquarius transforms collective consciousness — dreams may feature revolutionary ideas, deep societal transformation, or the emergence of new collective forms.',
    Pisces: 'Pluto in Pisces dissolves the boundaries of self — dreams may feature deep spiritual death and rebirth, unity experiences, or profound collective unconscious contact.',
  },
}

const OUTER_PLANETS = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']

export function getOuterPlanetTransits(dateStr: string): { planet: string; sign: string; description: string }[] {
  const d = new Date(dateStr + 'T12:00:00Z')
  return OUTER_PLANETS.map(planet => {
    const lon = getPlanetLongitude(d, planet)
    const sign = planetSign(lon)
    const desc = OUTER_DESCRIPTIONS[planet]?.[sign] ?? `The ${planet} in ${sign} marks a significant generational transit.`
    return { planet, sign, description: desc }
  })
}


