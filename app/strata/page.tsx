'use client'

import { useState, useEffect } from 'react'
import type { DreamLog, BirthData, BiometricData } from '@/lib/types'
import { getDreams, getBirthData, saveBirthData, seedDemoDreams } from '@/lib/store'
import { getBiometricData, saveBiometricDataBatch } from '@/lib/biometrics'
import { getNatalPlacements, getCurrentTransits, getDominantTransit } from '@/lib/astro'
import { getAppleHealthSampleData } from '@/lib/integrations/health'
import { isOverFreeLimits } from '@/lib/entitlements'
import EmotionTimeline from '@/components/charts/EmotionTimeline'
import ThemeRadar from '@/components/charts/ThemeRadar'
import SymbolFrequency from '@/components/charts/SymbolFrequency'
import LucidityTrend from '@/components/charts/LucidityTrend'
import LunarCalendar from '@/components/charts/LunarCalendar'
import BiometricChart from '@/components/BiometricChart'
import AstroPanel from '@/components/AstroPanel'
import BirthDataModal from '@/components/BirthDataModal'
import Paywall from '@/components/Paywall'

// ─── Archetype definitions ────────────────────────────────────────────────────

const ARCHETYPES = [
  {
    id: 'undertow',
    name: 'The Undertow',
    description: "You process grief and loss through transformation. Your dreams are a form of healing you don't give yourself credit for.",
    rarity: '18%',
    icon: '∿',
  },
  {
    id: 'cartographer',
    name: 'The Cartographer',
    description: "You are mapping unknown territories. Your unconscious is surveying ground you haven't consciously claimed yet.",
    rarity: '12%',
    icon: '◈',
  },
  {
    id: 'architect',
    name: 'The Architect',
    description: "You build worlds in sleep that reflect the structures you're constructing in waking life.",
    rarity: '21%',
    icon: '◇',
  },
  {
    id: 'witness',
    name: 'The Witness',
    description: "You observe more than you act in dreams — your unconscious is developing a capacity for radical self-awareness.",
    rarity: '9%',
    icon: '✦',
  },
  {
    id: 'alchemist',
    name: 'The Alchemist',
    description: "Transformation is your constant. Your dreams suggest a psyche that cannot stay still — always converting one thing into another.",
    rarity: '15%',
    icon: '⬡',
  },
  {
    id: 'archivist',
    name: 'The Archivist',
    description: "You are storing and cataloguing experience. Your dreams suggest a mind building a vast inner library of meaning.",
    rarity: '23%',
    icon: '◉',
  },
  {
    id: 'navigator',
    name: 'The Navigator',
    description: "You move through terrain with intention, even when the terrain shifts. Your dreams suggest deep inner directedness.",
    rarity: '17%',
    icon: '◎',
  },
  {
    id: 'oracle',
    name: 'The Oracle',
    description: "Your dreams reach toward revelation. The imagery you generate is charged with meaning that extends beyond the personal.",
    rarity: '14%',
    icon: '⬟',
  },
]

function computeArchetype(dreams: DreamLog[]): typeof ARCHETYPES[number] | null {
  if (dreams.length < 5) return null

  // Tally narrative arcs
  const arcCount: Record<string, number> = {}
  for (const d of dreams) {
    const arc = d.extraction?.narrative_arc
    if (arc) arcCount[arc] = (arcCount[arc] || 0) + 1
  }
  const dominantArc = Object.entries(arcCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  // Tally emotion valence (positive = valence > 0, negative = valence < 0)
  let positiveCount = 0
  let negativeCount = 0
  for (const d of dreams) {
    for (const em of d.extraction?.emotions || []) {
      if (em.valence > 0) positiveCount++
      else if (em.valence < 0) negativeCount++
    }
  }
  const dominantValence = positiveCount >= negativeCount ? 'positive' : 'negative'

  // Tally symbol categories
  const symCatCount: Record<string, number> = {}
  for (const d of dreams) {
    for (const s of d.extraction?.symbols || []) {
      const cat = (s.category || '').toLowerCase()
      symCatCount[cat] = (symCatCount[cat] || 0) + 1
    }
  }
  const dominantSymCat = Object.entries(symCatCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  // Tally theme categories
  const themeCatCount: Record<string, number> = {}
  for (const d of dreams) {
    for (const t of d.extraction?.themes || []) {
      const cat = (t.category || t.name || '').toLowerCase()
      themeCatCount[cat] = (themeCatCount[cat] || 0) + 1
    }
  }
  const dominantThemeCat = Object.entries(themeCatCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  // Average lucidity
  const avgLucidity =
    dreams.reduce((s, d) => s + (d.extraction?.lucidity || 0), 0) / dreams.length

  // Score each archetype
  const scores: Record<string, number> = {}
  ARCHETYPES.forEach((a) => { scores[a.id] = 0 })

  // Narrative arc matching
  if (dominantArc === 'descending') scores['undertow'] += 3
  if (dominantArc === 'liminal') scores['cartographer'] += 3
  if (dominantArc === 'ascending') {
    scores['architect'] += 3
    scores['navigator'] += 3
  }
  if (dominantArc === 'cyclical') scores['alchemist'] += 3
  if (dominantArc === 'fragmented') scores['archivist'] += 3

  // Valence matching
  if (dominantValence === 'negative') scores['undertow'] += 2
  if (dominantValence === 'positive') scores['navigator'] += 2

  // Symbol category matching
  if (dominantSymCat.includes('cosmic') || dominantSymCat.includes('archetypal')) scores['oracle'] += 2
  if (dominantSymCat.includes('knowledge')) scores['archivist'] += 2
  if (dominantSymCat.includes('architecture') || dominantSymCat.includes('building')) scores['architect'] += 2
  if (dominantSymCat.includes('elemental') || dominantSymCat.includes('transformation')) scores['alchemist'] += 2

  // Theme category matching
  if (dominantThemeCat.includes('knowledge') || dominantThemeCat.includes('intellectual')) scores['archivist'] += 2
  if (dominantThemeCat.includes('transform')) scores['alchemist'] += 2
  if (dominantThemeCat.includes('cosmic') || dominantThemeCat.includes('spirit')) scores['oracle'] += 2
  if (dominantThemeCat.includes('liminal') || dominantThemeCat.includes('threshold')) scores['cartographer'] += 2

  // Lucidity bonus
  if (avgLucidity > 1.5) scores['witness'] += 3

  // Pick highest score (first in case of tie)
  let best = ARCHETYPES[0]
  let bestScore = scores[ARCHETYPES[0].id]
  for (const archetype of ARCHETYPES) {
    if (scores[archetype.id] > bestScore) {
      bestScore = scores[archetype.id]
      best = archetype
    }
  }
  return best
}

// ─── Weekly summary helpers ───────────────────────────────────────────────────

function shouldShowSummary(): boolean {
  if (typeof window === 'undefined') return false
  const dismissed = localStorage.getItem('dreamscape_summary_dismissed')
  const lastShown = localStorage.getItem('dreamscape_last_summary')
  const today = new Date()
  const dayOfWeek = today.getDay() // 0 = Sunday

  if (dismissed) {
    // If dismissed today, don't show again today
    const dismissedDate = new Date(dismissed)
    if (dismissedDate.toDateString() === today.toDateString()) return false
  }

  if (!lastShown) return true // never shown, will check dream count at render time
  const lastDate = new Date(lastShown)
  const daysSince = (today.getTime() - lastDate.getTime()) / 86400000
  if (dayOfWeek === 0) return true // always show on Sundays
  if (daysSince >= 7) return true
  return false
}

function buildWeeklySummary(dreams: DreamLog[]) {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000)
  const recent = dreams.filter((d) => new Date(d.date) >= sevenDaysAgo)
  const analyzed = recent.filter((d) => d.extraction)

  // Top symbols
  const symCount: Record<string, number> = {}
  for (const d of analyzed) {
    for (const s of d.extraction!.symbols || []) {
      symCount[s.name] = (symCount[s.name] || 0) + 1
    }
  }
  const topSymbols = Object.entries(symCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)

  // Dominant emotion
  const emCount: Record<string, number> = {}
  for (const d of analyzed) {
    for (const em of d.extraction!.emotions || []) {
      emCount[em.name] = (emCount[em.name] || 0) + em.intensity
    }
  }
  const topEmotion = Object.entries(emCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // Top themes
  const themeCount: Record<string, number> = {}
  for (const d of analyzed) {
    for (const t of d.extraction!.themes || []) {
      themeCount[t.name] = (themeCount[t.name] || 0) + 1
    }
  }
  const topThemes = Object.entries(themeCount).sort((a, b) => b[1] - a[1]).map(([name]) => name)
  const topTheme = topThemes[0] ?? null
  const secondTheme = topThemes[1] ?? null

  // Dominant arc
  const arcCount: Record<string, number> = {}
  for (const d of analyzed) {
    const arc = d.extraction?.narrative_arc
    if (arc) arcCount[arc] = (arcCount[arc] || 0) + 1
  }
  const dominantArc = Object.entries(arcCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? ''

  // Valence
  let posV = 0, negV = 0
  for (const d of analyzed) {
    for (const em of d.extraction!.emotions || []) {
      if (em.valence > 0) posV++
      else if (em.valence < 0) negV++
    }
  }
  const valencePositive = posV >= negV

  // AI-style insight (template-based, no API)
  let insight = ''
  if (dominantArc === 'descending' && topSymbols[0]) {
    insight = `Your unconscious is processing something — the recurring ${topSymbols[0]} points toward unresolved material.`
  } else if (dominantArc === 'liminal' && topSymbols[0]) {
    insight = `You're in threshold space. The ${topSymbols[0]} imagery suggests a transition is underway.`
  } else if (valencePositive && topTheme) {
    insight = `Your dreams this week suggest ${topTheme} is active and generative.`
  } else if (topTheme && secondTheme) {
    insight = `Your dreamscape this week was shaped by ${topTheme} and ${secondTheme}.`
  } else if (topTheme) {
    insight = `Your dreamscape this week was shaped by ${topTheme}.`
  }

  // Date range label
  const weekStart = new Date(Date.now() - 6 * 86400000)
  const weekStartStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const dateRange = `${weekStartStr} – ${todayStr}`

  return {
    dateRange,
    totalRecent: recent.length,
    totalAnalyzed: analyzed.length,
    topSymbols,
    topEmotion,
    topTheme,
    insight,
  }
}

function getHealthInsights(dreams: DreamLog[], biometrics: BiometricData[]): string[] {
  if (!biometrics.length) {
    return ['Import or load sample biometric data to start seeing dream-health correlations.']
  }
  if (!dreams.length) {
    return ['Log a few analyzed dreams to generate correlation insights with your biometrics.']
  }

  const biometricByDate = new Map(biometrics.map((b) => [b.date, b]))
  const paired = dreams
    .map((dream) => ({ dream, bio: biometricByDate.get(dream.date) }))
    .filter((item): item is { dream: DreamLog; bio: BiometricData } => Boolean(item.bio))

  if (!paired.length) {
    return ['No same-date dream/biometric overlap yet. As overlap grows, correlation insights will appear here.']
  }

  const stressEmotionSet = new Set(['anxiety', 'fear', 'panic', 'urgency', 'frustration', 'dread'])
  const fragmentedOnLowHrv = paired.filter(({ dream, bio }) => {
    const arc = dream.extraction?.narrative_arc
    return bio.hrv < 50 && (arc === 'fragmented' || arc === 'liminal')
  }).length

  const stressOnLowHrv = paired.filter(({ dream, bio }) => {
    const emotions = dream.extraction?.emotions || []
    const hasStressEmotion = emotions.some((e) => stressEmotionSet.has(e.name.toLowerCase()))
    return hasStressEmotion && bio.hrv < 50
  }).length

  const lowSleepScoreNights = paired.filter(({ bio }) => bio.sleepScore < 70).length
  const stressOnLowSleep = paired.filter(({ dream, bio }) => {
    const emotions = dream.extraction?.emotions || []
    const hasStressEmotion = emotions.some((e) => stressEmotionSet.has(e.name.toLowerCase()))
    return hasStressEmotion && bio.sleepScore < 70
  }).length

  const insights: string[] = []
  if (fragmentedOnLowHrv >= 2 || fragmentedOnLowHrv >= Math.ceil(paired.length * 0.3)) {
    insights.push('Your most fragmented dream nights align with lower HRV readings.')
  }
  if (stressOnLowHrv >= 2 || stressOnLowHrv >= Math.ceil(paired.length * 0.35)) {
    insights.push('High stress dreams are clustering on low-HRV nights.')
  }
  if (lowSleepScoreNights > 0 && stressOnLowSleep / lowSleepScoreNights >= 0.5) {
    insights.push('Lower sleep score nights are more likely to include stress-heavy dream content.')
  }

  if (!insights.length) {
    insights.push('You have overlapping dream and biometric history now; patterns will sharpen as more nights are logged.')
  }

  return insights.slice(0, 2)
}

// ─── Page component ───────────────────────────────────────────────────────────

export default function StrataPage() {
  const [dreams, setDreams] = useState<DreamLog[]>([])
  const [biometrics, setBiometrics] = useState<BiometricData[]>([])
  const [birthData, setBirthData] = useState<BirthData | null>(null)
  const [showBirthModal, setShowBirthModal] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [archetypeCopied, setArchetypeCopied] = useState(false)
  const [summaryVisible, setSummaryVisible] = useState(false)
  const [summaryDismissed, setSummaryDismissed] = useState(false)

  useEffect(() => {
    Promise.all([getDreams(), getBirthData(), getBiometricData()]).then(([d, bd, bio]) => {
      setDreams(d)
      setBiometrics(bio)
      setBirthData(bd)
      setLoaded(true)

      // Determine summary visibility after dreams load
      const analyzed = d.filter((dream) => dream.extraction)
      const show = shouldShowSummary() && analyzed.length >= 3
      if (show) {
        setSummaryVisible(true)
        localStorage.setItem('dreamscape_last_summary', new Date().toISOString())
      }
    })
  }, [])

  const natal = birthData ? getNatalPlacements(birthData) : null
  const today = new Date().toISOString().split('T')[0]
  const transits = getCurrentTransits(today)
  const dominant = getDominantTransit(today)

  const currentSky = {
    sunSign: transits.sunSign,
    moonSign: transits.moonSign,
    moonPhase: transits.moonPhase,
    moonPhaseEmoji: transits.moonPhaseEmoji,
    retrogrades: transits.retrogrades,
    dominantTransit: dominant,
  }

  const handleLoadDemo = async () => {
    await seedDemoDreams()
    setDreams(await getDreams())
  }

  const handleLoadSampleBiometrics = async () => {
    const dates = (withExtraction.length ? withExtraction : dreams)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-21)
      .map((d) => d.date)
    const sampleDates = dates.length ? dates : [new Date().toISOString().split('T')[0]]
    await saveBiometricDataBatch(getAppleHealthSampleData(sampleDates))
    setBiometrics(await getBiometricData())
  }

  const handleSaveBirth = (data: BirthData) => {
    saveBirthData(data)
    setBirthData(data)
    setShowBirthModal(false)
  }

  const withExtraction = dreams.filter((d) => d.extraction)

  // Symbol of the Week: most frequent symbol from the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const recentDreams = withExtraction.filter((d) => d.date >= sevenDaysAgo)
  const symbolMap: Record<string, { count: number; meaning: string; category: string }> = {}
  for (const d of recentDreams) {
    for (const s of d.extraction!.symbols || []) {
      if (!symbolMap[s.name]) {
        symbolMap[s.name] = { count: 0, meaning: s.meaning, category: s.category }
      }
      symbolMap[s.name].count++
    }
  }
  const topWeekSymbol = Object.entries(symbolMap)
    .sort((a, b) => b[1].count - a[1].count)[0] ?? null

  const avgLucidity =
    withExtraction.length > 0
      ? (withExtraction.reduce((s, d) => s + (d.extraction!.lucidity || 0), 0) / withExtraction.length).toFixed(1)
      : null

  const emotionMap: Record<string, { sum: number; count: number }> = {}
  for (const d of withExtraction) {
    for (const em of d.extraction!.emotions || []) {
      if (!emotionMap[em.name]) emotionMap[em.name] = { sum: 0, count: 0 }
      emotionMap[em.name].sum += em.intensity
      emotionMap[em.name].count++
    }
  }
  const topEmotion = Object.entries(emotionMap)
    .map(([name, { sum, count }]) => ({ name, avg: sum / count }))
    .sort((a, b) => b.avg - a.avg)[0]

  // Archetype
  const archetype = computeArchetype(withExtraction)

  const handleArchetypeShare = async () => {
    if (!archetype) return
    const text = `✦ My Dreamscape Archetype ✦\n${archetype.name} (${archetype.rarity} of dreamers)\n"${archetype.description}"\n— dreamscape.quest`
    if (navigator.share) {
      try { await navigator.share({ text }) } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(text)
      setArchetypeCopied(true)
      setTimeout(() => setArchetypeCopied(false), 2000)
    }
  }

  const handleDismissSummary = () => {
    setSummaryDismissed(true)
    setSummaryVisible(false)
    localStorage.setItem('dreamscape_summary_dismissed', new Date().toISOString())
  }

  const summary = loaded && summaryVisible && !summaryDismissed
    ? buildWeeklySummary(dreams)
    : null
  const healthInsights = getHealthInsights(withExtraction, biometrics)

  return (
    <>
      {showBirthModal && (
        <BirthDataModal
          onSave={handleSaveBirth}
          onDismiss={() => setShowBirthModal(false)}
        />
      )}

      <div className="max-w-xl mx-auto px-4 pt-8 pb-4 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1
              className="text-2xl font-medium tracking-tight"
              style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
            >
              Strata
            </h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {withExtraction.length} analyzed dream{withExtraction.length !== 1 ? 's' : ''}
            </p>
          </div>
          {dreams.length === 0 && (
            <button
              onClick={handleLoadDemo}
              className="text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80"
              style={{ border: '1px solid rgba(167,139,250,0.3)', color: 'var(--violet)' }}
            >
              Load demo dreams
            </button>
          )}
        </div>

        {/* Weekly Summary Card — first card when visible */}
        {summary && (
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{
              background: 'rgba(15,15,26,0.7)',
              border: '1px solid var(--border)',
              borderLeft: '3px solid var(--violet)',
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--violet)', letterSpacing: '0.12em' }}>
                ◈ Dream Summary · Week of {summary.dateRange}
              </div>
              <button
                onClick={handleDismissSummary}
                className="shrink-0 text-sm leading-none transition-opacity hover:opacity-60"
                style={{ color: 'var(--muted)' }}
                aria-label="Dismiss summary"
              >
                ×
              </button>
            </div>

            <div className="text-xs space-y-1" style={{ color: 'var(--muted)', fontFamily: 'monospace' }}>
              <div>
                This week: <span style={{ color: 'var(--text)' }}>{summary.totalRecent} dream{summary.totalRecent !== 1 ? 's' : ''} logged</span>
                {' · '}
                <span style={{ color: 'var(--text)' }}>{summary.totalAnalyzed} analyzed</span>
              </div>
              {summary.topSymbols.length > 0 && (
                <div>
                  Top symbols: <span style={{ color: 'var(--text)' }}>{summary.topSymbols.join(', ')}</span>
                </div>
              )}
              {summary.topEmotion && (
                <div>
                  Emotional tone: <span style={{ color: 'var(--text)' }}>{summary.topEmotion}</span>
                </div>
              )}
              {summary.topTheme && (
                <div>
                  Recurring theme: <span style={{ color: 'var(--text)' }}>{summary.topTheme}</span>
                </div>
              )}
            </div>

            {summary.insight && (
              <p
                className="text-sm leading-relaxed italic"
                style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
              >
                {summary.insight}
              </p>
            )}
          </div>
        )}

        {/* Stats row */}
        {withExtraction.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Dreams" value={String(withExtraction.length)} />
            {avgLucidity && <StatCard label="Avg Lucidity" value={`${avgLucidity}/3`} />}
            {topEmotion && <StatCard label="Top Emotion" value={topEmotion.name} small />}
          </div>
        )}

        {/* Symbol of the Week */}
        {topWeekSymbol && (
          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between">
              <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
                Symbol of the Week
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(167,139,250,0.1)', color: 'var(--violet)', fontFamily: 'monospace' }}
              >
                {topWeekSymbol[1].category}
              </span>
            </div>
            <div className="space-y-1">
              <div
                className="text-xl font-medium"
                style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
              >
                {topWeekSymbol[0]}
              </div>
              <div className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'monospace' }}>
                appeared {topWeekSymbol[1].count} time{topWeekSymbol[1].count !== 1 ? 's' : ''} this week
              </div>
            </div>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
            >
              {topWeekSymbol[1].meaning}
            </p>
          </div>
        )}

        {/* Dream Archetype Card */}
        {withExtraction.length >= 5 ? (
          archetype && (
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
                  Your Dreamscape Archetype
                </div>
                <button
                  onClick={handleArchetypeShare}
                  className="shrink-0 text-xs px-2.5 py-1 rounded-full transition-opacity hover:opacity-70"
                  style={{ border: '1px solid rgba(167,139,250,0.4)', color: 'var(--violet)', fontFamily: 'monospace' }}
                >
                  {archetypeCopied ? '✓ Copied' : 'Share'}
                </button>
              </div>

              <div className="flex items-start gap-3">
                <div
                  className="text-3xl leading-none shrink-0"
                  style={{ color: 'var(--violet)', fontFamily: 'monospace' }}
                >
                  {archetype.icon}
                </div>
                <div className="space-y-1 min-w-0">
                  <div
                    className="text-xl font-medium"
                    style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}
                  >
                    {archetype.name}
                  </div>
                  <p
                    className="text-sm leading-relaxed italic"
                    style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif' }}
                  >
                    {archetype.description}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <span
                  className="text-xs"
                  style={{ color: 'var(--muted)', fontFamily: 'monospace' }}
                >
                  {archetype.rarity} of dreamers share this archetype
                </span>
              </div>
            </div>
          )
        ) : (
          withExtraction.length > 0 && withExtraction.length < 5 && (
            <div
              className="rounded-2xl p-5 text-center"
              style={{ background: 'rgba(15,15,26,0.7)', border: '1px dashed rgba(167,139,250,0.2)' }}
            >
              <div
                className="text-2xl mb-2"
                style={{ color: 'rgba(167,139,250,0.3)', fontFamily: 'monospace' }}
              >
                ◈
              </div>
              <p className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'Georgia, serif' }}>
                Log {5 - withExtraction.length} more analyzed dream{5 - withExtraction.length !== 1 ? 's' : ''} to unlock your archetype
              </p>
            </div>
          )
        )}

        {/* Astro Panel */}
        <AstroPanel natal={natal} currentSky={currentSky} />

        {/* Birth chart prompt */}
        {!birthData && (
          <button
            onClick={() => setShowBirthModal(true)}
            className="w-full py-2.5 rounded-xl text-sm transition-opacity hover:opacity-80"
            style={{ border: '1px dashed rgba(167,139,250,0.3)', color: 'var(--muted)' }}
          >
            ✦ Add birth chart for natal aspects
          </button>
        )}

        {/* Charts */}
        <div className="space-y-8">
          <ChartCard>
            <BiometricChart biometrics={biometrics} dreams={withExtraction} />
          </ChartCard>

          {/* Paywall: advanced insights beyond free limits */}
          {isOverFreeLimits(dreams) ? (
            <Paywall title="Unlock Health Correlation Insights" message="See how HRV, sleep score, and restfulness align with your dream patterns over weeks and months." />
          ) : (
            <div
              className="rounded-2xl p-5 space-y-3"
              style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}>
                  Health Correlation Insights
                </div>
                {biometrics.length === 0 && (
                  <button
                    onClick={handleLoadSampleBiometrics}
                    className="text-xs px-2.5 py-1 rounded-full transition-opacity hover:opacity-75"
                    style={{ border: '1px solid rgba(45,212,191,0.4)', color: '#2dd4bf', fontFamily: 'monospace' }}
                  >
                    Load sample data
                  </button>
                )}
              </div>
              <div className="space-y-2 text-sm" style={{ color: 'var(--text)', fontFamily: 'Georgia, serif' }}>
                {healthInsights.map((insight) => (
                  <p key={insight}>• {insight}</p>
                ))}
              </div>
            </div>
          )}

          <ChartCard>
            <LunarCalendar dreams={dreams} />
          </ChartCard>

          <ChartCard>
            <EmotionTimeline dreams={withExtraction} />
          </ChartCard>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <ChartCard>
              <ThemeRadar dreams={withExtraction} />
            </ChartCard>
            <ChartCard>
              <LucidityTrend dreams={withExtraction} />
            </ChartCard>
          </div>

          <ChartCard>
            <SymbolFrequency dreams={withExtraction} />
          </ChartCard>
        </div>

        {/* Load demo button (when has some dreams but wants more) */}
        {dreams.length > 0 && dreams.length < 7 && !dreams.some((d) => d.isExample) && (
          <button
            onClick={handleLoadDemo}
            className="w-full py-2.5 rounded-xl text-sm transition-opacity hover:opacity-80"
            style={{ border: '1px dashed rgba(255,255,255,0.08)', color: 'var(--muted)' }}
          >
            + Load demo dreams to see fuller charts
          </button>
        )}
      </div>
    </>
  )
}

function ChartCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid var(--border)' }}
    >
      {children}
    </div>
  )
}

function StatCard({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: 'rgba(15,15,26,0.7)', border: '1px solid var(--border)' }}
    >
      <div
        className={`font-medium ${small ? 'text-sm' : 'text-xl'} mb-0.5`}
        style={{ color: 'var(--violet)' }}
      >
        {value}
      </div>
      <div className="text-xs" style={{ color: 'var(--muted)' }}>{label}</div>
    </div>
  )
}
