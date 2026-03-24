import { getCurrentSky, getMoonPhase, getMoonSign, getNatalPlacements } from '@/lib/astro'
import type { BirthData } from '@/lib/types'

export type TransitAlert = {
  type: 'retrograde_start' | 'retrograde_end' | 'eclipse' | 'major_aspect' | 'moon_sign_change'
  title: string
  body: string
  significance: 'high' | 'medium'
}

type RetrogradeWindow = {
  planet: 'Mercury' | 'Venus' | 'Mars'
  start: string
  end: string
}

const RETROGRADE_WINDOWS: RetrogradeWindow[] = [
  { planet: 'Mercury', start: '2025-03-15', end: '2025-04-07' },
  { planet: 'Mercury', start: '2025-07-18', end: '2025-08-11' },
  { planet: 'Mercury', start: '2025-11-09', end: '2025-11-29' },
  { planet: 'Mercury', start: '2026-03-15', end: '2026-04-07' },
  { planet: 'Venus', start: '2025-03-01', end: '2025-04-12' },
  { planet: 'Venus', start: '2026-07-22', end: '2026-09-03' },
  { planet: 'Mars', start: '2024-12-06', end: '2025-02-23' },
  { planet: 'Mars', start: '2026-12-09', end: '2027-02-28' },
]

const ZODIAC_SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
]

const PERSONAL_PLANETS = ['Sun', 'Mercury', 'Venus', 'Mars'] as const

const PLANET_MEAN_RATE: Record<(typeof PERSONAL_PLANETS)[number], number> = {
  Sun: 0.9856474,
  Mercury: 4.0932,
  Venus: 1.6021,
  Mars: 0.524,
}

const PLANET_MEAN_LONG: Record<(typeof PERSONAL_PLANETS)[number], number> = {
  Sun: 280.46646,
  Mercury: 252.2509,
  Venus: 181.9798,
  Mars: 355.433,
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setUTCDate(d.getUTCDate() + days)
  return d
}

function getPlanetSign(date: Date, planet: (typeof PERSONAL_PLANETS)[number]): string {
  const j2000 = new Date('2000-01-01T12:00:00Z')
  const days = (date.getTime() - j2000.getTime()) / (1000 * 60 * 60 * 24)
  const lon = ((PLANET_MEAN_LONG[planet] + PLANET_MEAN_RATE[planet] * days) % 360 + 360) % 360
  return ZODIAC_SIGNS[Math.floor(lon / 30) % 12]
}

function natalFlavor(birthData?: BirthData): string {
  if (!birthData) return 'Let this be a week to record dreams immediately on waking and watch for repeating symbols.'

  const natal = getNatalPlacements(birthData)
  const rising = natal.risingSign ? ` and rising in ${natal.risingSign}` : ''
  return `With your natal Sun in ${natal.sunSign}, Moon in ${natal.moonSign}${rising}, track where this transit echoes old emotional scripts and where it opens new choices.`
}

function truncateAlerts(alerts: TransitAlert[]): TransitAlert[] {
  return alerts
    .sort((a, b) => {
      if (a.significance === b.significance) return 0
      return a.significance === 'high' ? -1 : 1
    })
    .slice(0, 6)
}

export function getNotableTransits(date: string, birthData?: BirthData): TransitAlert[] {
  const baseDate = new Date(`${date}T12:00:00Z`)
  if (Number.isNaN(baseDate.getTime())) return []

  const tomorrow = addDays(baseDate, 1)
  const todayStr = formatDate(baseDate)
  const tomorrowStr = formatDate(tomorrow)
  const alerts: TransitAlert[] = []

  for (const window of RETROGRADE_WINDOWS) {
    if (window.start === tomorrowStr || window.start === todayStr) {
      const sign = getPlanetSign(new Date(`${window.start}T12:00:00Z`), window.planet)
      alerts.push({
        type: 'retrograde_start',
        significance: 'high',
        title: `${window.planet} stations retrograde in ${sign}`,
        body: `${window.planet} stations retrograde ${window.start === tomorrowStr ? 'tomorrow' : 'today'} in ${sign}. Your dreams may revisit unfinished threads tied to this planet's themes, asking for reflection instead of force. ${natalFlavor(birthData)}`,
      })
    }

    if (window.end === tomorrowStr || window.end === todayStr) {
      const sign = getPlanetSign(new Date(`${window.end}T12:00:00Z`), window.planet)
      alerts.push({
        type: 'retrograde_end',
        significance: 'medium',
        title: `${window.planet} stations direct in ${sign}`,
        body: `${window.planet} turns direct ${window.end === tomorrowStr ? 'tomorrow' : 'today'} in ${sign}. Dream material can shift from review to action, so note which symbols now feel clarified or ready to move forward. ${natalFlavor(birthData)}`,
      })
    }
  }

  const todayPhase = getMoonPhase(todayStr).name
  const tomorrowPhase = getMoonPhase(tomorrowStr).name
  const eclipseSigns = new Set(['Aries', 'Libra', 'Pisces', 'Virgo'])
  const sky = getCurrentSky(tomorrowStr, birthData)

  if ((todayPhase !== 'New Moon' && tomorrowPhase === 'New Moon') || (todayPhase !== 'Full Moon' && tomorrowPhase === 'Full Moon')) {
    const eclipseLike = eclipseSigns.has(sky.sunSign)
    alerts.push({
      type: 'eclipse',
      significance: eclipseLike ? 'high' : 'medium',
      title: `${tomorrowPhase}${eclipseLike ? ' (eclipse season)' : ''} in ${sky.moonSign}`,
      body: `A ${tomorrowPhase.toLowerCase()} peaks tomorrow in ${sky.moonSign}${eclipseLike ? ', during eclipse season' : ''}. Dreams can feel louder, symbolic, and emotionally precise around lunations, so capture details before they fade. ${natalFlavor(birthData)}`,
    })
  }

  const todayMoon = getMoonSign(todayStr)
  const tomorrowMoon = getMoonSign(tomorrowStr)
  if (todayMoon !== tomorrowMoon) {
    alerts.push({
      type: 'moon_sign_change',
      significance: 'medium',
      title: `Moon shifts from ${todayMoon} to ${tomorrowMoon}`,
      body: `The Moon changes signs by tomorrow, moving from ${todayMoon} into ${tomorrowMoon}. Emotional tone in dreams can pivot quickly, so compare tonight's symbols with tomorrow's to spot what your psyche is re-prioritizing. ${natalFlavor(birthData)}`,
    })
  }

  for (const planet of PERSONAL_PLANETS) {
    const signToday = getPlanetSign(baseDate, planet)
    const signTomorrow = getPlanetSign(tomorrow, planet)
    if (signToday !== signTomorrow) {
      alerts.push({
        type: 'major_aspect',
        significance: planet === 'Sun' ? 'high' : 'medium',
        title: `${planet} enters ${signTomorrow}`,
        body: `${planet} ingresses into ${signTomorrow} tomorrow, shifting the atmospheric tone of your inner life. Dreams often preview this shift through new characters, settings, or repeated motifs. ${natalFlavor(birthData)}`,
      })
    }
  }

  const majorAspects = (sky.aspects ?? []).filter((aspect) => {
    const isTight = aspect.orb <= 1.2
    const involvesPersonal = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].includes(aspect.planet1)
      || ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars'].includes(aspect.planet2)
    return isTight && involvesPersonal
  })

  for (const aspect of majorAspects.slice(0, 2)) {
    alerts.push({
      type: 'major_aspect',
      significance: aspect.orb <= 0.5 ? 'high' : 'medium',
      title: `Major transit: ${aspect.planet1} ${aspect.aspect} ${aspect.planet2}`,
      body: `${aspect.planet1} ${aspect.aspect.toLowerCase()} ${aspect.planet2} is exacting now (orb ${aspect.orb.toFixed(1)}°). This can amplify dream intensity and symbolic contrast, especially around the themes of agency, intimacy, and truth-telling. ${natalFlavor(birthData)}`,
    })
  }

  const unique = new Map<string, TransitAlert>()
  for (const alert of alerts) {
    const key = `${alert.type}:${alert.title}`
    if (!unique.has(key)) unique.set(key, alert)
  }

  return truncateAlerts(Array.from(unique.values()))
}
