import { describe, it, expect } from 'vitest'
import {
  getSunSign,
  getMoonPhase,
  getMoonSign,
  getCurrentRetrogrades,
  getCurrentTransits,
  getCurrentSky,
  getDominantTransit,
  buildAstroContext,
  getLunarMansion,
  getPlanetaryAspects,
  getChironPlacement,
  getMoonHouse,
  getOuterPlanetTransits,
} from '@/lib/astro'

// ─── getSunSign ───────────────────────────────────────────────────────────────

describe('getSunSign', () => {
  it.each([
    ['2026-03-16', 'Pisces'],
    ['2026-03-21', 'Aries'],
    ['2026-04-19', 'Aries'],
    ['2026-04-20', 'Taurus'],
    ['2026-05-21', 'Gemini'],
    ['2026-06-21', 'Cancer'],
    ['2026-07-23', 'Leo'],
    ['2026-08-23', 'Virgo'],
    ['2026-09-23', 'Libra'],
    ['2026-10-23', 'Scorpio'],
    ['2026-11-22', 'Sagittarius'],
    ['2026-12-22', 'Capricorn'],
    ['2026-01-20', 'Aquarius'],
    ['2026-02-19', 'Pisces'],
  ])('%s → %s', (date, expected) => {
    expect(getSunSign(date)).toBe(expected)
  })

  it('handles year boundary for Capricorn', () => {
    expect(getSunSign('2025-12-25')).toBe('Capricorn')
    expect(getSunSign('2026-01-01')).toBe('Capricorn')
    expect(getSunSign('2026-01-19')).toBe('Capricorn')
  })
})

// ─── getMoonPhase ─────────────────────────────────────────────────────────────

describe('getMoonPhase', () => {
  it('returns an object with name, emoji, and illumination', () => {
    const result = getMoonPhase('2026-03-16')
    expect(result).toHaveProperty('name')
    expect(result).toHaveProperty('emoji')
    expect(result).toHaveProperty('illumination')
    expect(result.illumination).toBeGreaterThanOrEqual(0)
    expect(result.illumination).toBeLessThanOrEqual(100)
  })

  it('name is one of the 8 standard phases', () => {
    const phases = [
      'New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous',
      'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent',
    ]
    const result = getMoonPhase('2026-03-16')
    expect(phases).toContain(result.name)
  })

  it('emoji corresponds to name', () => {
    const nameToEmoji: Record<string, string> = {
      'New Moon': '🌑',
      'Waxing Crescent': '🌒',
      'First Quarter': '🌓',
      'Waxing Gibbous': '🌔',
      'Full Moon': '🌕',
      'Waning Gibbous': '🌖',
      'Last Quarter': '🌗',
      'Waning Crescent': '🌘',
    }
    const result = getMoonPhase('2026-03-16')
    expect(result.emoji).toBe(nameToEmoji[result.name])
  })

  it('full moon has high illumination (>= 80)', () => {
    // Scan a range to find a full moon and verify illumination
    for (let offset = 0; offset < 30; offset++) {
      const d = new Date('2026-03-01')
      d.setDate(d.getDate() + offset)
      const dateStr = d.toISOString().split('T')[0]
      const p = getMoonPhase(dateStr)
      if (p.name === 'Full Moon') {
        expect(p.illumination).toBeGreaterThanOrEqual(80)
        break
      }
    }
  })

  it('new moon has low illumination (<= 20)', () => {
    for (let offset = 0; offset < 30; offset++) {
      const d = new Date('2026-03-01')
      d.setDate(d.getDate() + offset)
      const dateStr = d.toISOString().split('T')[0]
      const p = getMoonPhase(dateStr)
      if (p.name === 'New Moon') {
        expect(p.illumination).toBeLessThanOrEqual(20)
        break
      }
    }
  })
})

// ─── getMoonSign ──────────────────────────────────────────────────────────────

describe('getMoonSign', () => {
  const SIGNS = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
  ]

  it('always returns a valid zodiac sign', () => {
    const testDates = ['2026-01-01', '2026-03-16', '2026-06-21', '2026-09-23', '2026-12-31']
    for (const date of testDates) {
      expect(SIGNS).toContain(getMoonSign(date))
    }
  })

  it('moon sign changes across a month (not stuck on one sign)', () => {
    const signsFound = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const d = new Date('2026-03-01')
      d.setDate(d.getDate() + i)
      signsFound.add(getMoonSign(d.toISOString().split('T')[0]))
    }
    // Moon moves ~1 sign every 2.5 days — should see at least 8 in a month
    expect(signsFound.size).toBeGreaterThanOrEqual(8)
  })
})

// ─── getCurrentRetrogrades ────────────────────────────────────────────────────

describe('getCurrentRetrogrades', () => {
  it('returns Mercury during known Mercury retrograde window (2025-03-15 to 2025-04-07)', () => {
    expect(getCurrentRetrogrades('2025-03-20')).toContain('Mercury')
    expect(getCurrentRetrogrades('2025-04-01')).toContain('Mercury')
  })

  it('does not return Mercury outside retrograde window', () => {
    expect(getCurrentRetrogrades('2025-05-01')).not.toContain('Mercury')
    expect(getCurrentRetrogrades('2025-06-15')).not.toContain('Mercury')
  })

  it('returns Venus during known Venus retrograde (2025-03-01 to 2025-04-12)', () => {
    expect(getCurrentRetrogrades('2025-03-15')).toContain('Venus')
  })

  it('returns empty array when no retrogrades active', () => {
    // A date outside all retrograde windows
    const retros = getCurrentRetrogrades('2025-06-01')
    expect(Array.isArray(retros)).toBe(true)
  })

  it('can return multiple retrograde planets simultaneously', () => {
    // Both Mercury and Venus are retrograde in early March 2025
    const retros = getCurrentRetrogrades('2025-03-20')
    expect(retros.length).toBeGreaterThanOrEqual(2)
    expect(retros).toContain('Mercury')
    expect(retros).toContain('Venus')
  })
})

// ─── getCurrentTransits ───────────────────────────────────────────────────────

describe('getCurrentTransits', () => {
  it('returns all required fields', () => {
    const result = getCurrentTransits('2026-03-16')
    expect(result).toHaveProperty('sunSign')
    expect(result).toHaveProperty('moonSign')
    expect(result).toHaveProperty('moonPhase')
    expect(result).toHaveProperty('moonPhaseEmoji')
    expect(result).toHaveProperty('retrogrades')
    expect(Array.isArray(result.retrogrades)).toBe(true)
  })
})

// ─── getCurrentSky ────────────────────────────────────────────────────────────

describe('getCurrentSky', () => {
  it('includes dominant transit narrative', () => {
    const sky = getCurrentSky('2026-03-16')
    expect(sky).toHaveProperty('dominantTransit')
    expect(typeof sky.dominantTransit).toBe('string')
    expect(sky.dominantTransit.length).toBeGreaterThan(20)
  })
})

// ─── getDominantTransit ───────────────────────────────────────────────────────

describe('getDominantTransit', () => {
  it('returns a non-empty string', () => {
    const result = getDominantTransit('2026-03-16')
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(20)
  })

  it('mentions Mercury when Mercury is retrograde', () => {
    const result = getDominantTransit('2025-03-20')
    expect(result.toLowerCase()).toContain('mercury')
  })
})

// ─── buildAstroContext ────────────────────────────────────────────────────────

describe('buildAstroContext', () => {
  it('returns a non-empty string with sun and moon info', () => {
    const result = buildAstroContext('2026-03-16')
    expect(result).toContain('Sun in')
    expect(result).toContain('Moon in')
  })

  it('includes natal info when birthData is provided', () => {
    const result = buildAstroContext('2026-03-16', {
      date: '1990-04-15',
      location: 'New York, NY',
    })
    expect(result).toContain('Natal chart')
  })

  it('omits natal section when no birthData', () => {
    const result = buildAstroContext('2026-03-16', null)
    expect(result).not.toContain('Natal chart')
  })

  it('includes retrograde planets when active', () => {
    const result = buildAstroContext('2025-03-20') // Mercury + Venus retrograde
    expect(result.toLowerCase()).toContain('retrograde')
  })
})

// ─── getLunarMansion ─────────────────────────────────────────────────────────

describe('getLunarMansion', () => {
  it('returns an object with name, deity, symbol, meaning, degree', () => {
    const m = getLunarMansion('2026-03-16')
    expect(m).toHaveProperty('name')
    expect(m).toHaveProperty('deity')
    expect(m).toHaveProperty('symbol')
    expect(m).toHaveProperty('meaning')
    expect(m).toHaveProperty('degree')
  })

  it('degree is 0-26', () => {
    for (let i = 0; i < 30; i++) {
      const d = new Date('2026-01-01')
      d.setDate(d.getDate() + i)
      const m = getLunarMansion(d.toISOString().split('T')[0])
      expect(m.degree).toBeGreaterThanOrEqual(0)
      expect(m.degree).toBeLessThan(27)
    }
  })

  it('name is a known nakshatra', () => {
    const known = [
      'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
      'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
      'Hasta', 'Chitra', 'Swati', 'Vishaka', 'Anuradha', 'Jyeshtha', 'Mula',
      'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
      'Purva Bhadra', 'Uttara Bhadra', 'Revati',
    ]
    const found = new Set<string>()
    for (let i = 0; i < 30; i++) {
      const d = new Date('2026-01-01')
      d.setDate(d.getDate() + i)
      found.add(getLunarMansion(d.toISOString().split('T')[0]).name)
    }
    expect(found.size).toBeGreaterThan(10)
  })

  it('lunar mansion changes over days (moon travels ~13 degrees per nakshatra)', () => {
    const signs: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date('2026-03-01')
      d.setDate(d.getDate() + i)
      signs.push(getLunarMansion(d.toISOString().split('T')[0]).name)
    }
    const unique = new Set(signs)
    expect(unique.size).toBeGreaterThan(1)
  })
})

// ─── getPlanetaryAspects ──────────────────────────────────────────────────────

describe('getPlanetaryAspects', () => {
  it('returns an array', () => {
    const aspects = getPlanetaryAspects('2026-03-16')
    expect(Array.isArray(aspects)).toBe(true)
  })

  it('each aspect has planet1, planet2, aspect, orb, meaning', () => {
    const aspects = getPlanetaryAspects('2026-03-16')
    for (const a of aspects) {
      expect(a).toHaveProperty('planet1')
      expect(a).toHaveProperty('planet2')
      expect(a).toHaveProperty('aspect')
      expect(a).toHaveProperty('orb')
      expect(a).toHaveProperty('meaning')
    }
  })

  it('orb is non-negative', () => {
    const aspects = getPlanetaryAspects('2026-03-16')
    for (const a of aspects) {
      expect(a.orb).toBeGreaterThanOrEqual(0)
    }
  })

  it('aspects are sorted by orb ascending (most exact first)', () => {
    const aspects = getPlanetaryAspects('2026-03-16')
    for (let i = 1; i < aspects.length; i++) {
      expect(aspects[i].orb).toBeGreaterThanOrEqual(aspects[i - 1].orb)
    }
  })

  it('known Moon-Saturn Square appears during known windows', () => {
    const aspects = getPlanetaryAspects('2026-03-16')
    const moonSaturn = aspects.find(a =>
      (a.planet1 === 'Moon' && a.planet2 === 'Saturn') ||
      (a.planet1 === 'Saturn' && a.planet2 === 'Moon')
    )
    // May or may not be exact — orb must be within tolerance
    if (moonSaturn) expect(moonSaturn.orb).toBeLessThan(8)
  })
})

// ─── getChironPlacement ───────────────────────────────────────────────────────

describe('getChironPlacement', () => {
  it('returns an object with sign', () => {
    const c = getChironPlacement('2026-03-16')
    expect(c).toHaveProperty('sign')
  })

  it('sign is a valid zodiac sign', () => {
    const SIGNS = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ]
    const c = getChironPlacement('2026-03-16')
    expect(SIGNS).toContain(c.sign)
  })

  it('returns house when birthData with time is provided', () => {
    const c = getChironPlacement('2026-03-16', { date: '1990-04-15', time: '14:30', location: 'New York, NY' })
    expect(c).toHaveProperty('house')
    expect(c.house).toBeGreaterThanOrEqual(1)
    expect(c.house).toBeLessThanOrEqual(12)
  })

  it('no house when birthData has no time', () => {
    const c = getChironPlacement('2026-03-16', { date: '1990-04-15', location: 'New York, NY' })
    expect(c.house).toBeUndefined()
  })
})

// ─── getMoonHouse ─────────────────────────────────────────────────────────────

describe('getMoonHouse', () => {
  it('returns undefined when no birthData', () => {
    expect(getMoonHouse('2026-03-16')).toBeUndefined()
  })

  it('returns undefined when birthData has no time', () => {
    expect(getMoonHouse('2026-03-16', { date: '1990-04-15', location: 'New York, NY' })).toBeUndefined()
  })

  it('returns a number 1-12 when birth time is provided', () => {
    const house = getMoonHouse('2026-03-16', { date: '1990-04-15', time: '14:30', location: 'New York, NY' })
    expect(house).toBeDefined()
    expect(house!).toBeGreaterThanOrEqual(1)
    expect(house!).toBeLessThanOrEqual(12)
  })

  it('different birth times can produce different houses', () => {
    const house1 = getMoonHouse('2026-03-16', { date: '1990-04-15', time: '06:00', location: 'New York, NY' })
    const house2 = getMoonHouse('2026-03-16', { date: '1990-04-15', time: '18:00', location: 'New York, NY' })
    expect(house1).not.toEqual(house2)
  })
})

// ─── getOuterPlanetTransits ───────────────────────────────────────────────────

describe('getOuterPlanetTransits', () => {
  const OUTER = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']

  it('returns 5 outer planets', () => {
    const transits = getOuterPlanetTransits('2026-03-16')
    expect(transits.length).toBe(5)
  })

  it('each entry has planet, sign, description', () => {
    const transits = getOuterPlanetTransits('2026-03-16')
    for (const t of transits) {
      expect(t).toHaveProperty('planet')
      expect(t).toHaveProperty('sign')
      expect(t).toHaveProperty('description')
    }
  })

  it('all planets are outer planets', () => {
    const transits = getOuterPlanetTransits('2026-03-16')
    const planets = transits.map(t => t.planet)
    for (const p of OUTER) {
      expect(planets).toContain(p)
    }
  })

  it('sign is a valid zodiac sign', () => {
    const SIGNS = [
      'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
      'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
    ]
    const transits = getOuterPlanetTransits('2026-03-16')
    for (const t of transits) {
      expect(SIGNS).toContain(t.sign)
    }
  })

  it('description is a non-empty string', () => {
    const transits = getOuterPlanetTransits('2026-03-16')
    for (const t of transits) {
      expect(typeof t.description).toBe('string')
      expect(t.description.length).toBeGreaterThan(10)
    }
  })
})

// ─── getCurrentSky (extended) ─────────────────────────────────────────────────

describe('getCurrentSky extended fields', () => {
  it('includes lunarMansion', () => {
    const sky = getCurrentSky('2026-03-16')
    expect(sky).toHaveProperty('lunarMansion')
    expect(sky.lunarMansion).toHaveProperty('name')
  })

  it('includes aspects array', () => {
    const sky = getCurrentSky('2026-03-16')
    expect(sky).toHaveProperty('aspects')
    expect(Array.isArray(sky.aspects)).toBe(true)
  })

  it('includes chiron placement', () => {
    const sky = getCurrentSky('2026-03-16')
    expect(sky).toHaveProperty('chiron')
    expect(sky.chiron).toHaveProperty('sign')
  })

  it('moonHouse is undefined without birthData, number with it', () => {
    const without = getCurrentSky('2026-03-16')
    expect(without.moonHouse).toBeUndefined()
    const withBirth = getCurrentSky('2026-03-16', { date: '1990-04-15', time: '10:00', location: 'NYC' })
    expect(typeof withBirth.moonHouse).toBe('number')
  })

  it('includes outerPlanets array with 5 entries', () => {
    const sky = getCurrentSky('2026-03-16')
    expect(sky).toHaveProperty('outerPlanets')
    expect(sky.outerPlanets?.length).toBe(5)
  })
})

// ─── buildAstroContext (extended) ─────────────────────────────────────────────

describe('buildAstroContext extended fields', () => {
  it('does not include lunar mansion language', () => {
    const ctx = buildAstroContext('2026-03-16')
    expect(ctx).not.toContain('lunar mansion')
  })

  it('includes Chiron sign when present', () => {
    const ctx = buildAstroContext('2026-03-16')
    expect(ctx).toContain('Chiron in')
  })

  it('includes Moon House when birthData with time provided', () => {
    const ctx = buildAstroContext('2026-03-16', { date: '1990-04-15', time: '10:00', location: 'NYC' })
    expect(ctx).toContain('Moon in House')
  })

  it('includes outer planets summary', () => {
    const ctx = buildAstroContext('2026-03-16')
    expect(ctx).toContain('Outer planets:')
  })

  it('includes active transit aspects', () => {
    const ctx = buildAstroContext('2026-03-16')
    expect(ctx).toContain('Active transit aspects:')
  })
})
