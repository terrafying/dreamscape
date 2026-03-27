/**
 * Thoth Tarot Archetypes (Crowley's System)
 * 22 Major Arcana with archetypal meanings for dream interpretation
 * Based on "The Book of Thoth" by Aleister Crowley
 */

export interface ThothArchetype {
  number: number
  name: string
  hebrewLetter: string
  path: string
  element?: string
  planet?: string
  meaning: string
  dreamResonance: string
  crowleyQuote?: string
}

export const THOTH_ARCHETYPES: Record<number, ThothArchetype> = {
  0: {
    number: 0,
    name: 'The Fool',
    hebrewLetter: 'Aleph',
    path: 'The Abyss',
    element: 'Air',
    meaning: 'The beginning, the leap into the unknown, the divine madness of creation',
    dreamResonance: 'Dreams of flying, falling, or stepping into void. The psyche taking a risk without knowing the outcome.',
    crowleyQuote: 'The Fool is the spirit of the Aether, the breath of life itself.',
  },
  1: {
    number: 1,
    name: 'The Magus',
    hebrewLetter: 'Beth',
    path: 'Mercury',
    element: 'Air',
    planet: 'Mercury',
    meaning: 'Will, manifestation, the power to create through intention and skill',
    dreamResonance: 'Dreams of tools, instruments, or discovering hidden abilities. The psyche claiming its creative power.',
    crowleyQuote: 'The Magus is the will in action, the word made flesh.',
  },
  2: {
    number: 2,
    name: 'The Priestess',
    hebrewLetter: 'Gimel',
    path: 'The Moon',
    element: 'Water',
    planet: 'Moon',
    meaning: 'Intuition, the hidden, the receptive wisdom of the unconscious',
    dreamResonance: 'Dreams of veils, mysteries, or receiving knowledge without words. The psyche speaking in its own language.',
    crowleyQuote: 'The Priestess is the gateway between worlds, the keeper of secrets.',
  },
  3: {
    number: 3,
    name: 'The Empress',
    hebrewLetter: 'Daleth',
    path: 'Venus',
    element: 'Water',
    planet: 'Venus',
    meaning: 'Creation, nurturing, the fertile ground of manifestation',
    dreamResonance: 'Dreams of gardens, growth, or being cared for. The psyche nurturing itself into wholeness.',
    crowleyQuote: 'The Empress is the mother of all things, the womb of creation.',
  },
  4: {
    number: 4,
    name: 'The Emperor',
    hebrewLetter: 'He',
    path: 'Aries',
    element: 'Fire',
    planet: 'Mars',
    meaning: 'Authority, structure, the will to order and command',
    dreamResonance: 'Dreams of power, leadership, or establishing boundaries. The psyche claiming its authority.',
    crowleyQuote: 'The Emperor is the will crystallized into form, the law made manifest.',
  },
  5: {
    number: 5,
    name: 'The Hierophant',
    hebrewLetter: 'Vav',
    path: 'Taurus',
    element: 'Earth',
    planet: 'Venus',
    meaning: 'Teaching, tradition, the transmission of sacred knowledge',
    dreamResonance: 'Dreams of learning, initiation, or receiving wisdom from a guide. The psyche integrating new understanding.',
    crowleyQuote: 'The Hierophant is the bridge between heaven and earth, the keeper of the mysteries.',
  },
  6: {
    number: 6,
    name: 'The Lovers',
    hebrewLetter: 'Zayin',
    path: 'Gemini',
    element: 'Air',
    planet: 'Mercury',
    meaning: 'Union, choice, the reconciliation of opposites',
    dreamResonance: 'Dreams of connection, choice, or integrating conflicting parts of self. The psyche seeking wholeness.',
    crowleyQuote: 'The Lovers is the choice that creates destiny, the union that transcends separation.',
  },
  7: {
    number: 7,
    name: 'The Chariot',
    hebrewLetter: 'Cheth',
    path: 'Cancer',
    element: 'Water',
    planet: 'Moon',
    meaning: 'Movement, control, the will directing the forces of the psyche',
    dreamResonance: 'Dreams of travel, vehicles, or gaining control over chaotic forces. The psyche directing its own journey.',
    crowleyQuote: 'The Chariot is the will in motion, the triumph of consciousness over the unconscious.',
  },
  8: {
    number: 8,
    name: 'Strength',
    hebrewLetter: 'Teth',
    path: 'Leo',
    element: 'Fire',
    planet: 'Sun',
    meaning: 'Inner strength, courage, the taming of wild forces through gentleness',
    dreamResonance: 'Dreams of wild animals, danger overcome, or discovering inner resilience. The psyche integrating its shadow.',
    crowleyQuote: 'Strength is not force, but the gentle mastery of what cannot be conquered.',
  },
  9: {
    number: 9,
    name: 'The Hermit',
    hebrewLetter: 'Yod',
    path: 'Virgo',
    element: 'Earth',
    planet: 'Mercury',
    meaning: 'Solitude, inner light, the search for truth within',
    dreamResonance: 'Dreams of isolation, inner guidance, or finding light in darkness. The psyche turning inward.',
    crowleyQuote: 'The Hermit is the light that illuminates the path, the wisdom found in solitude.',
  },
  10: {
    number: 10,
    name: 'The Wheel of Fortune',
    hebrewLetter: 'Kaph',
    path: 'Jupiter',
    element: 'Fire',
    planet: 'Jupiter',
    meaning: 'Cycles, destiny, the turning of fate and fortune',
    dreamResonance: 'Dreams of wheels, cycles, or sudden changes. The psyche recognizing its place in larger patterns.',
    crowleyQuote: 'The Wheel turns eternally; what rises must fall, what falls must rise.',
  },
  11: {
    number: 11,
    name: 'Justice',
    hebrewLetter: 'Lamed',
    path: 'Libra',
    element: 'Air',
    planet: 'Venus',
    meaning: 'Balance, truth, the law of cause and effect',
    dreamResonance: 'Dreams of weighing, judging, or finding equilibrium. The psyche seeking fairness and truth.',
    crowleyQuote: 'Justice is the balance of all forces, the law written in the stars.',
  },
  12: {
    number: 12,
    name: 'The Hanged Man',
    hebrewLetter: 'Mem',
    path: 'Water',
    element: 'Water',
    planet: 'Neptune',
    meaning: 'Suspension, sacrifice, the reversal of perspective',
    dreamResonance: 'Dreams of hanging, inversion, or seeing from a new angle. The psyche releasing control to gain insight.',
    crowleyQuote: 'The Hanged Man sees the world upside down and finds it makes more sense.',
  },
  13: {
    number: 13,
    name: 'Death',
    hebrewLetter: 'Nun',
    path: 'Scorpio',
    element: 'Water',
    planet: 'Mars',
    meaning: 'Transformation, ending, the death that precedes rebirth',
    dreamResonance: 'Dreams of death, decay, or profound change. The psyche releasing what no longer serves.',
    crowleyQuote: 'Death is not the end but the transformation; the caterpillar dies so the butterfly may live.',
  },
  14: {
    number: 14,
    name: 'Temperance',
    hebrewLetter: 'Samekh',
    path: 'Sagittarius',
    element: 'Fire',
    planet: 'Jupiter',
    meaning: 'Balance, moderation, the blending of opposites',
    dreamResonance: 'Dreams of mixing, blending, or finding the middle way. The psyche integrating extremes.',
    crowleyQuote: 'Temperance is the art of mixing fire and water without creating steam.',
  },
  15: {
    number: 15,
    name: 'The Devil',
    hebrewLetter: 'Ayin',
    path: 'Capricorn',
    element: 'Earth',
    planet: 'Saturn',
    meaning: 'Bondage, materialism, the shadow self demanding recognition',
    dreamResonance: 'Dreams of being trapped, confronting darkness, or meeting your shadow. The psyche integrating what it denies.',
    crowleyQuote: 'The Devil is not evil but the necessary force of manifestation and desire.',
  },
  16: {
    number: 16,
    name: 'The Tower',
    hebrewLetter: 'Pe',
    path: 'Mars',
    element: 'Fire',
    planet: 'Mars',
    meaning: 'Destruction, revelation, the breaking of false structures',
    dreamResonance: 'Dreams of collapse, lightning, or sudden upheaval. The psyche clearing away what was never true.',
    crowleyQuote: 'The Tower falls so that truth may stand. Destruction is the first act of creation.',
  },
  17: {
    number: 17,
    name: 'The Star',
    hebrewLetter: 'Tzade',
    path: 'Aquarius',
    element: 'Air',
    planet: 'Venus',
    meaning: 'Hope, inspiration, the guiding light of the soul',
    dreamResonance: 'Dreams of stars, light, or finding direction. The psyche reconnecting with its deepest purpose.',
    crowleyQuote: 'The Star is the hope that remains when all else is lost, the light that guides the lost.',
  },
  18: {
    number: 18,
    name: 'The Moon',
    hebrewLetter: 'Qoph',
    path: 'Pisces',
    element: 'Water',
    planet: 'Moon',
    meaning: 'Illusion, dreams, the realm of the unconscious',
    dreamResonance: 'Dreams of moonlight, illusion, or diving deep into the unconscious. The psyche exploring its own depths.',
    crowleyQuote: 'The Moon is the mirror of the soul, reflecting what the sun cannot see.',
  },
  19: {
    number: 19,
    name: 'The Sun',
    hebrewLetter: 'Resh',
    path: 'Sun',
    element: 'Fire',
    planet: 'Sun',
    meaning: 'Clarity, joy, the triumph of consciousness',
    dreamResonance: 'Dreams of sunlight, warmth, or sudden clarity. The psyche celebrating its own awakening.',
    crowleyQuote: 'The Sun is the source of all life, the light that dispels all shadows.',
  },
  20: {
    number: 20,
    name: 'Judgement',
    hebrewLetter: 'Shin',
    path: 'Fire',
    element: 'Fire',
    planet: 'Pluto',
    meaning: 'Awakening, calling, the moment of reckoning and renewal',
    dreamResonance: 'Dreams of being called, awakening, or being judged. The psyche answering a summons from within.',
    crowleyQuote: 'Judgement is not condemnation but the call to awaken to what you truly are.',
  },
  21: {
    number: 21,
    name: 'The World',
    hebrewLetter: 'Tau',
    path: 'Saturn',
    element: 'Earth',
    planet: 'Saturn',
    meaning: 'Completion, wholeness, the fulfillment of a cycle',
    dreamResonance: 'Dreams of completion, wholeness, or arriving home. The psyche recognizing its own integration.',
    crowleyQuote: 'The World is the completion of the Great Work, the return to the beginning transformed.',
  },
}

/**
 * Find the most resonant Thoth archetype for a dream symbol
 * Uses keyword matching and archetypal associations
 */
export function findThothArchetype(symbolName: string): ThothArchetype | null {
  const lowerSymbol = symbolName.toLowerCase()

  // Direct keyword matching
  const keywordMap: Record<string, number> = {
    fool: 0,
    leap: 0,
    void: 0,
    magus: 1,
    magician: 1,
    tool: 1,
    instrument: 1,
    priestess: 2,
    mystery: 2,
    veil: 2,
    hidden: 2,
    empress: 3,
    garden: 3,
    growth: 3,
    nurture: 3,
    emperor: 4,
    power: 4,
    authority: 4,
    hierophant: 5,
    teacher: 5,
    wisdom: 5,
    lovers: 6,
    union: 6,
    choice: 6,
    chariot: 7,
    movement: 7,
    travel: 7,
    strength: 8,
    courage: 8,
    animal: 8,
    hermit: 9,
    light: 9,
    solitude: 9,
    wheel: 10,
    cycle: 10,
    fortune: 10,
    justice: 11,
    balance: 11,
    truth: 11,
    hanged: 12,
    suspension: 12,
    inversion: 12,
    death: 13,
    transformation: 13,
    ending: 13,
    temperance: 14,
    blend: 14,
    moderation: 14,
    devil: 15,
    shadow: 15,
    bondage: 15,
    tower: 16,
    destruction: 16,
    collapse: 16,
    star: 17,
    hope: 17,
    inspiration: 17,
    moon: 18,
    illusion: 18,
    dream: 18,
    sun: 19,
    clarity: 19,
    joy: 19,
    judgement: 20,
    awakening: 20,
    calling: 20,
    world: 21,
    completion: 21,
    wholeness: 21,
  }

  // Check for exact keyword match
  for (const [keyword, number] of Object.entries(keywordMap)) {
    if (lowerSymbol.includes(keyword) || keyword.includes(lowerSymbol)) {
      return THOTH_ARCHETYPES[number] || null
    }
  }

  // Check for archetype name match
  for (const archetype of Object.values(THOTH_ARCHETYPES)) {
    if (
      lowerSymbol.includes(archetype.name.toLowerCase()) ||
      archetype.name.toLowerCase().includes(lowerSymbol)
    ) {
      return archetype
    }
  }

  return null
}

/**
 * Get archetypal meaning for a dream symbol
 * Returns Thoth archetype interpretation
 */
export function getArchetypalMeaning(symbolName: string): string {
  const archetype = findThothArchetype(symbolName)
  if (!archetype) return ''

  return `${archetype.name} (${archetype.hebrewLetter}): ${archetype.dreamResonance}`
}

/**
 * Select a Thoth archetype based on dream narrative arc
 * Maps emotional/narrative patterns to archetypal energies
 */
export function selectArchetypeByArc(arc: string): ThothArchetype {
  const arcToArchetype: Record<string, number> = {
    ascending: 19, // The Sun - rising consciousness
    descending: 18, // The Moon - descent into unconscious
    cyclical: 10, // The Wheel - cycles and patterns
    fragmented: 15, // The Devil - shadow and fragmentation
    liminal: 12, // The Hanged Man - threshold and suspension
  }

  const number = arcToArchetype[arc] || 21 // Default to The World
  return THOTH_ARCHETYPES[number] || THOTH_ARCHETYPES[21]
}

/**
 * Get a Crowley quote for a specific archetype
 */
export function getCrowleyQuote(archetypeNumber: number): string {
  const archetype = THOTH_ARCHETYPES[archetypeNumber]
  return archetype?.crowleyQuote || ''
}

/**
 * Build archetypal interpretation for oracle reading
 */
export function buildArchetypalInterpretation(
  symbolName: string,
  arc: string
): { archetype: ThothArchetype; interpretation: string } {
  const symbolArchetype = findThothArchetype(symbolName)
  const arcArchetype = selectArchetypeByArc(arc)

  const archetype = symbolArchetype || arcArchetype

  const interpretation = `
${archetype.name} (${archetype.hebrewLetter})
${archetype.meaning}

Dream Resonance:
${archetype.dreamResonance}

${archetype.crowleyQuote ? `"${archetype.crowleyQuote}"` : ''}
  `.trim()

  return { archetype, interpretation }
}
