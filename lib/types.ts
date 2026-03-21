export interface DreamExtraction {
  symbols: { name: string; salience: number; category: string; meaning: string }[]
  emotions: { name: string; intensity: number; valence: number }[]
  themes: { name: string; confidence: number; category: string }[]
  characters: { label: string; known: boolean; archetype?: string }[]
  setting: { type: string; quality: string; time: string }
  narrative_arc: 'ascending' | 'descending' | 'cyclical' | 'fragmented' | 'liminal'
  lucidity: number // 0–3
  tone: string
  interpretation: string // 2-3 sentences of psychological insight
  astro_context: {
    moon_phase: string
    moon_sign: string
    cosmic_themes: string[]
    transit_note: string
    natal_aspects: string[]
  }
  recommendations: { action: string; timing: string; why: string }[]
  goetic_resonance?: {
    spirit: string    // e.g. "Dantalion"
    reason: string    // 1 sentence: why this spirit resonates with this dream
    barbarous: string // the invocation words
  }
}

export interface DreamLog {
  id: string
  date: string // YYYY-MM-DD
  transcript: string
  extraction?: DreamExtraction
  isExample?: boolean
  createdAt: number
}

export interface BiometricData {
  date: string // YYYY-MM-DD
  sleepScore: number // 0-100
  hrv: number // milliseconds
  deepSleepMinutes: number
  restfulnessIndex: number // 0-100
}

export interface JournalExtraction {
  mood_emotions: string[]
  intentions: string[]
  gratitude_moments: string[]
  themes: string[]
  reflection: string // 2-3 sentences of concise insight
  astro_context: {
    moon_phase: string
    moon_sign: string
    cosmic_themes: string[]
    transit_note: string
    natal_aspects: string[]
  }
}

export interface JournalLog {
  id: string
  date: string // YYYY-MM-DD
  transcript: string
  extraction?: JournalExtraction
  createdAt: number
  entryType: 'evening' | 'morning'
}

export interface BirthData {
  date: string // YYYY-MM-DD
  time?: string // HH:MM
  location: string
  lat?: number
  lng?: number
}

export interface NatalPlacements {
  sunSign: string
  moonSign: string
  risingSign?: string
}

export interface CurrentSky {
  sunSign: string
  moonSign: string
  moonPhase: string
  moonPhaseEmoji: string
  retrogrades: string[]
  dominantTransit: string
  lunarMansion?: LunarMansion
  aspects?: PlanetaryAspect[]
  chiron?: ChironPlacement
  moonHouse?: number
  outerPlanets?: OuterPlanetTransit[]
}

export interface LunarMansion {
  name: string
  degree: number
  deity: string
  symbol: string
  meaning: string
}

export interface PlanetaryAspect {
  planet1: string
  planet2: string
  aspect: string
  orb: number
  meaning: string
}

export interface ChironPlacement {
  sign: string
  house?: number
}

export interface OuterPlanetTransit {
  planet: string
  sign: string
  description: string
}
