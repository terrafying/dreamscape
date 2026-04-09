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
  modelName?: string
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

export interface SigilRecipe {
  source_phrase: string
  normalized_phrase: string
  removed_characters: string[]
  glyph_letters: string[]
  seed: number
  geometry: {
    symmetry: 4 | 6 | 8 | 12
    rings: number
    spokes: number
    polygon_sides: number
    polygon_skip: number
    line_weight: number
    rotation: number
  }
  style: {
    palette: string[]
    glow: number
    roughness: number
    border_mode: 'none' | 'circle' | 'double-circle' | 'seal'
  }
}

export interface VisionExtraction {
  title: string
  distilled_intention: string
  invocation: string
  symbols: { name: string; salience: number; category: string; meaning: string }[]
  emotions: { name: string; intensity: number; valence: number }[]
  themes: string[]
  blockers: { name: string; reframing: string; action: string }[]
  visual_motifs: string[]
  color_palette: string[]
  ritual_steps: { action: string; timing: string; why: string }[]
  sigil_recipe: SigilRecipe
}

export interface VisionLog {
  id: string
  date: string
  transcript: string
  extraction?: VisionExtraction
  boardImageUrl?: string
  createdAt: number
  published?: boolean
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

export interface NatalPlanetPosition {
  planet: string
  sign: string
  degree: number
  longitude: number
  symbol: string
}

export interface NatalAspect {
  planet1: string
  planet2: string
  aspect: string
  orb: number
}

export interface NatalChartData {
  planets: NatalPlanetPosition[]
  aspects: NatalAspect[]
  houseCusps: number[]
  ascendant: number
}

export interface UserProfile {
  id: string
  user_id: string
  handle: string
  avatar_seed?: string
  sun_sign?: string
  moon_sign?: string
  rising_sign?: string
  created_at: string
}

export interface SharedDream {
  id: string
  user_id: string
  dream_id: string
  dream_data: DreamLog
  symbols: string[]
  themes: string[]
  emotions: string[]
  share_handle: string
  created_at: string
}

export interface SharedDreamWithCounts extends SharedDream {
  reactions: { emoji: string; count: number }[]
  interpretation_count: number
  is_following: boolean
  my_reactions: string[]
}

export interface SharedVision {
  id: string
  user_id: string
  vision_id: string
  vision_data: VisionLog
  title: string
  distilled_intention: string
  symbols: string[]
  themes: string[]
  share_handle: string
  board_image_url?: string
  created_at: string
}

export interface SharedVisionWithCounts extends SharedVision {
  reactions: { emoji: string; count: number }[]
  interpretation_count: number
  preview_interpretations?: VisionInterpretation[]
  my_reactions: string[]
}

export interface DreamReaction {
  id: string
  dream_id: string
  user_id: string
  emoji: string
  created_at: string
}

export interface DreamInterpretation {
  id: string
  dream_id: string
  user_id: string
  handle: string
  text: string
  created_at: string
}

export interface VisionInterpretation {
  id: string
  vision_id: string
  user_id: string
  handle: string
  text: string
  created_at: string
}

export interface DreamwalkExtraction {
  archetype: string
  meaning: string // 1-2 sentences
  insight: string // A deeper connection between intention and what they found
}

export interface DreamwalkLog {
  id: string
  date: string // YYYY-MM-DD
  intention: string
  coordinates: { lat: number; lng: number }
  radius: number
  extraction?: DreamwalkExtraction
  journal?: string
  createdAt: number
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}
