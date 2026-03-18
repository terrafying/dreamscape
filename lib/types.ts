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
}

export interface DreamLog {
  id: string
  date: string // YYYY-MM-DD
  transcript: string
  extraction?: DreamExtraction
  isExample?: boolean
  createdAt: number
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
}
