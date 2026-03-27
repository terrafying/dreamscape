import type { DreamExtraction } from './types'

export interface SymbolFrequency {
  symbol: string
  count: number
  percentage: number
  archetype?: string
  category?: string
  trend?: 'rising' | 'stable' | 'falling'
}

export interface ZeitgeistSnapshot {
  date: string
  topSymbols: SymbolFrequency[]
  trendingThemes: string[]
  astrologicalContext: {
    moonPhase: string
    dominantSign: string
    transitNote: string
  }
  totalDreams: number
  uniqueDreamers: number
}

export interface CollectivePattern {
  symbol: string
  frequency: number
  emotionalTone: 'positive' | 'neutral' | 'negative'
  archetypeConnection: string
  culturalResonance: string
}

/**
 * Analyze dream symbols across all users to find collective patterns
 */
export function analyzeCollectiveSymbols(
  extractions: DreamExtraction[]
): SymbolFrequency[] {
  const symbolCounts: Record<string, { count: number; archetype?: string; category?: string }> = {}

  for (const extraction of extractions) {
    const symbols = extraction.symbols ?? []
    for (const symbol of symbols) {
      const key = symbol.name.toLowerCase()
      if (!symbolCounts[key]) {
        symbolCounts[key] = {
          count: 0,
          archetype: symbol.category,
          category: symbol.category,
        }
      }
      symbolCounts[key].count += 1
    }
  }

  const total = extractions.length
  const frequencies: SymbolFrequency[] = Object.entries(symbolCounts)
    .map(([symbol, data]) => ({
      symbol,
      count: data.count,
      percentage: (data.count / total) * 100,
      archetype: data.archetype,
      category: data.category,
    }))
    .sort((a, b) => b.count - a.count)

  return frequencies
}

/**
 * Identify trending themes from collective symbols
 */
export function identifyTrendingThemes(
  frequencies: SymbolFrequency[]
): string[] {
  const themeMap: Record<string, number> = {
    'Water & Depth': 0,
    'Fire & Transformation': 0,
    'Air & Communication': 0,
    'Earth & Grounding': 0,
    'Light & Clarity': 0,
    'Shadow & Integration': 0,
    'Movement & Change': 0,
    'Stillness & Rest': 0,
    'Connection & Belonging': 0,
    'Solitude & Reflection': 0,
  }

  const waterSymbols = ['water', 'ocean', 'river', 'rain', 'sea', 'flood', 'wave', 'drowning']
  const fireSymbols = ['fire', 'flame', 'burn', 'heat', 'sun', 'explosion', 'light']
  const airSymbols = ['wind', 'storm', 'sky', 'flying', 'breath', 'air', 'cloud']
  const earthSymbols = ['earth', 'ground', 'mountain', 'stone', 'root', 'soil', 'cave']
  const lightSymbols = ['light', 'sun', 'star', 'glow', 'bright', 'clarity', 'vision']
  const shadowSymbols = ['shadow', 'dark', 'night', 'fear', 'monster', 'demon', 'hidden']
  const movementSymbols = ['running', 'flying', 'falling', 'climbing', 'moving', 'journey', 'chase']
  const stillnessSymbols = ['stillness', 'peace', 'rest', 'sleep', 'meditation', 'quiet', 'calm']
  const connectionSymbols = ['love', 'friend', 'family', 'embrace', 'together', 'community', 'circle']
  const solitudeSymbols = ['alone', 'solitude', 'isolation', 'hermit', 'wilderness', 'empty']

  for (const freq of frequencies) {
    const sym = freq.symbol.toLowerCase()
    if (waterSymbols.some((w) => sym.includes(w))) themeMap['Water & Depth'] += freq.count
    if (fireSymbols.some((f) => sym.includes(f))) themeMap['Fire & Transformation'] += freq.count
    if (airSymbols.some((a) => sym.includes(a))) themeMap['Air & Communication'] += freq.count
    if (earthSymbols.some((e) => sym.includes(e))) themeMap['Earth & Grounding'] += freq.count
    if (lightSymbols.some((l) => sym.includes(l))) themeMap['Light & Clarity'] += freq.count
    if (shadowSymbols.some((s) => sym.includes(s))) themeMap['Shadow & Integration'] += freq.count
    if (movementSymbols.some((m) => sym.includes(m))) themeMap['Movement & Change'] += freq.count
    if (stillnessSymbols.some((st) => sym.includes(st))) themeMap['Stillness & Rest'] += freq.count
    if (connectionSymbols.some((c) => sym.includes(c))) themeMap['Connection & Belonging'] += freq.count
    if (solitudeSymbols.some((so) => sym.includes(so))) themeMap['Solitude & Reflection'] += freq.count
  }

  return Object.entries(themeMap)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme]) => theme)
}

/**
 * Build collective interpretation based on zeitgeist
 */
export function buildZeitgeistInterpretation(
  topSymbols: SymbolFrequency[],
  themes: string[],
  totalDreams: number
): string {
  if (topSymbols.length === 0) {
    return 'The collective dream is still forming. More dreamers needed to reveal the pattern.'
  }

  const topSymbol = topSymbols[0]
  const topTheme = themes[0] || 'Transformation'

  const interpretations: Record<string, string> = {
    'Water & Depth':
      'Humanity is diving deep. The collective unconscious is surfacing emotions and intuitions that have been held beneath the surface. This is a time of emotional reckoning and psychological depth.',
    'Fire & Transformation':
      'The collective is burning away what no longer serves. Transformation is in the air — what is being destroyed is making space for what is being born.',
    'Air & Communication':
      'The collective mind is active and seeking connection. Ideas are flying, conversations are happening, and the need to be heard is strong. This is a time of intellectual awakening.',
    'Earth & Grounding':
      'The collective is seeking stability and grounding. After upheaval, there is a need to return to what is solid, real, and tangible. This is a time of building foundations.',
    'Light & Clarity':
      'The collective is moving toward understanding. What was hidden is becoming visible. This is a time of revelation and the emergence of truth.',
    'Shadow & Integration':
      'The collective is facing what it has denied. The shadow is being acknowledged and integrated. This is a time of psychological maturation and wholeness.',
    'Movement & Change':
      'The collective is in motion. Stagnation is being broken, and momentum is building. This is a time of progress and forward movement.',
    'Stillness & Rest':
      'The collective is pausing to integrate. After activity, there is a need for rest and reflection. This is a time of consolidation and inner work.',
    'Connection & Belonging':
      'The collective is seeking unity and belonging. The need for community and connection is strong. This is a time of coming together and shared purpose.',
    'Solitude & Reflection':
      'The collective is turning inward. There is a need for solitude and self-reflection. This is a time of individual work and inner discovery.',
  }

  const baseInterpretation = interpretations[topTheme] || 'The collective dream is shifting.'

  return `${baseInterpretation}\n\nThe most common symbol is "${topSymbol.symbol}" (appearing in ${topSymbol.count} dreams, ${topSymbol.percentage.toFixed(1)}% of all dreams). This suggests a collective focus on ${topSymbol.category || 'this archetype'}.\n\nAcross ${totalDreams} dreams, humanity is exploring: ${themes.join(', ')}.`
}

/**
 * Calculate trend direction for a symbol
 */
export function calculateTrend(
  currentCount: number,
  previousCount: number
): 'rising' | 'stable' | 'falling' {
  const change = currentCount - previousCount
  if (change > previousCount * 0.1) return 'rising'
  if (change < -previousCount * 0.1) return 'falling'
  return 'stable'
}

/**
 * Format zeitgeist snapshot for display
 */
export function formatZeitgeistSnapshot(snapshot: ZeitgeistSnapshot): string {
  const lines: string[] = [
    `═══ Collective Dream Zeitgeist ═══`,
    `Date: ${snapshot.date}`,
    `Total Dreams: ${snapshot.totalDreams}`,
    `Unique Dreamers: ${snapshot.uniqueDreamers}`,
    ``,
    `🔮 Top Symbols:`,
    ...snapshot.topSymbols.slice(0, 5).map((s, i) => `  ${i + 1}. ${s.symbol} (${s.count} dreams, ${s.percentage.toFixed(1)}%)`),
    ``,
    `🌊 Trending Themes:`,
    ...snapshot.trendingThemes.map((t) => `  • ${t}`),
    ``,
    `✨ Astrological Context:`,
    `  Moon Phase: ${snapshot.astrologicalContext.moonPhase}`,
    `  Dominant Sign: ${snapshot.astrologicalContext.dominantSign}`,
    `  Transit Note: ${snapshot.astrologicalContext.transitNote}`,
  ]

  return lines.join('\n')
}
