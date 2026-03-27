/**
 * Dream Alchemy - Combine dream symbols with friends for "alchemical fusions"
 * Creates shareable transmutation cards showing symbol combinations
 */

import type { DreamExtraction } from './types'

export interface SymbolFusion {
  id: string
  symbol1: string
  symbol2: string
  user1Id: string
  user2Id: string
  user1Name: string
  user2Name: string
  fusionName: string
  fusionMeaning: string
  archetypeNumber?: number
  archetypeEmoji?: string
  archetypeName?: string
  createdAt: Date
  shareUrl: string
}

export interface AlchemyCard {
  symbol1: string
  symbol2: string
  fusionName: string
  fusionMeaning: string
  archetypeEmoji: string
  archetypeName: string
}

/**
 * Generate alchemical fusion from two symbols
 * Uses archetypal combination rules
 */
export function generateFusion(
  symbol1: string,
  symbol2: string,
  user1Name: string,
  user2Name: string
): AlchemyCard {
  // Archetypal fusion rules (simplified Hermetic alchemy)
  const fusionRules: Record<string, Record<string, { name: string; meaning: string; emoji: string; archetype: string }>> = {
    // Water + Fire = Steam (transformation)
    water: {
      fire: {
        name: 'Vapor of Becoming',
        meaning: 'The meeting of emotion and will creates transformation. What was solid becomes fluid, what was separate becomes unified.',
        emoji: '☁️',
        archetype: 'Temperance',
      },
      // Water + Air = Mist (mystery)
      air: {
        name: 'Veil of Knowing',
        meaning: 'Intuition meets intellect. The unconscious speaks in the language of the conscious mind.',
        emoji: '🌫️',
        archetype: 'The High Priestess',
      },
      // Water + Earth = Mud (grounding)
      earth: {
        name: 'Fertile Ground',
        meaning: 'Emotion finds form. What was felt becomes real, what was dreamed becomes manifest.',
        emoji: '🌱',
        archetype: 'The Empress',
      },
    },
    fire: {
      water: {
        name: 'Vapor of Becoming',
        meaning: 'The meeting of will and emotion creates transformation. What was separate becomes unified.',
        emoji: '☁️',
        archetype: 'Temperance',
      },
      air: {
        name: 'Lightning of Insight',
        meaning: 'Will meets intellect. Action becomes illuminated, intention becomes clear.',
        emoji: '⚡',
        archetype: 'The Magus',
      },
      earth: {
        name: 'Forge of Creation',
        meaning: 'Will shapes matter. The impossible becomes possible through focused intention.',
        emoji: '🔥',
        archetype: 'The Emperor',
      },
    },
    air: {
      water: {
        name: 'Veil of Knowing',
        meaning: 'Intellect meets intuition. The conscious mind learns the language of dreams.',
        emoji: '🌫️',
        archetype: 'The High Priestess',
      },
      fire: {
        name: 'Lightning of Insight',
        meaning: 'Intellect meets will. Clarity becomes action, understanding becomes power.',
        emoji: '⚡',
        archetype: 'The Magus',
      },
      earth: {
        name: 'Crystalline Truth',
        meaning: 'Thought becomes form. Ideas solidify into reality, concepts become tangible.',
        emoji: '💎',
        archetype: 'Justice',
      },
    },
    earth: {
      water: {
        name: 'Fertile Ground',
        meaning: 'Matter receives emotion. The physical world becomes alive with feeling.',
        emoji: '🌱',
        archetype: 'The Empress',
      },
      fire: {
        name: 'Forge of Creation',
        meaning: 'Matter receives will. The material world becomes a canvas for intention.',
        emoji: '🔥',
        archetype: 'The Emperor',
      },
      air: {
        name: 'Crystalline Truth',
        meaning: 'Matter receives thought. The physical becomes a mirror of the mental.',
        emoji: '💎',
        archetype: 'Justice',
      },
    },
  }

  // Classify symbols by element (simplified)
  const elementMap: Record<string, string> = {
    water: 'water',
    ocean: 'water',
    rain: 'water',
    river: 'water',
    sea: 'water',
    flood: 'water',
    wave: 'water',
    fire: 'fire',
    flame: 'fire',
    burn: 'fire',
    heat: 'fire',
    sun: 'fire',
    lightning: 'fire',
    storm: 'fire',
    air: 'air',
    wind: 'air',
    sky: 'air',
    cloud: 'air',
    breath: 'air',
    flight: 'air',
    earth: 'earth',
    ground: 'earth',
    mountain: 'earth',
    stone: 'earth',
    root: 'earth',
    soil: 'earth',
    tree: 'earth',
  }

  const element1 = elementMap[symbol1.toLowerCase()] || 'air'
  const element2 = elementMap[symbol2.toLowerCase()] || 'air'

  // Get fusion from rules, default to generic fusion
  const fusion =
    fusionRules[element1]?.[element2] ||
    fusionRules[element2]?.[element1] || {
      name: 'Alchemical Union',
      meaning: `${symbol1} and ${symbol2} merge into something entirely new. The combination reveals what neither could alone.`,
      emoji: '✨',
      archetype: 'The World',
    }

  return {
    symbol1,
    symbol2,
    fusionName: fusion.name,
    fusionMeaning: fusion.meaning,
    archetypeEmoji: fusion.emoji,
    archetypeName: fusion.archetype,
  }
}

/**
 * Create shareable fusion card
 */
export function createFusionCard(
  symbol1: string,
  symbol2: string,
  user1Id: string,
  user2Id: string,
  user1Name: string,
  user2Name: string
): SymbolFusion {
  const fusion = generateFusion(symbol1, symbol2, user1Name, user2Name)
  const id = `${user1Id}-${user2Id}-${Date.now()}`

  return {
    id,
    symbol1,
    symbol2,
    user1Id,
    user2Id,
    user1Name,
    user2Name,
    fusionName: fusion.fusionName,
    fusionMeaning: fusion.fusionMeaning,
    archetypeNumber: undefined,
    archetypeEmoji: fusion.archetypeEmoji,
    archetypeName: fusion.archetypeName,
    createdAt: new Date(),
    shareUrl: `/alchemy/${id}`,
  }
}

/**
 * Get fusion cards for a circle of dreamers
 * Shows all possible symbol combinations
 */
export function generateCircleFusions(
  dreamers: Array<{ id: string; name: string; symbols: string[] }>
): SymbolFusion[] {
  const fusions: SymbolFusion[] = []

  // Generate all pairwise combinations
  for (let i = 0; i < dreamers.length; i++) {
    for (let j = i + 1; j < dreamers.length; j++) {
      const dreamer1 = dreamers[i]
      const dreamer2 = dreamers[j]

      // Combine top symbols from each dreamer
      const topSymbol1 = dreamer1.symbols[0]
      const topSymbol2 = dreamer2.symbols[0]

      if (topSymbol1 && topSymbol2) {
        const fusion = createFusionCard(
          topSymbol1,
          topSymbol2,
          dreamer1.id,
          dreamer2.id,
          dreamer1.name,
          dreamer2.name
        )
        fusions.push(fusion)
      }
    }
  }

  return fusions
}

/**
 * Format fusion for display
 */
export function formatFusion(fusion: SymbolFusion): string {
  return `
${fusion.archetypeEmoji} ${fusion.fusionName}

${fusion.user1Name}'s ${fusion.symbol1} + ${fusion.user2Name}'s ${fusion.symbol2}

${fusion.fusionMeaning}

Archetype: ${fusion.archetypeNumber ? `#${fusion.archetypeNumber}` : 'The World'}
  `.trim()
}
