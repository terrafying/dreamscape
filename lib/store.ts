import { registerPlugin, Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import type { DreamLog, JournalLog, VisionLog, BirthData } from './types'

export interface CloudStorePlugin {
  get(options: { key: string }): Promise<{ value: string }>
  set(options: { key: string; value: string }): Promise<void>
  remove(options: { key: string }): Promise<void>
}

const CloudStore = registerPlugin<CloudStorePlugin>('CloudStore')

const DREAMS_KEY = 'dreamscape_dreams'
const JOURNALS_KEY = 'dreamscape_journals'
const VISIONS_KEY = 'dreamscape_visions'
const BIRTH_KEY = 'dreamscape_birth'

async function getStorageValue(key: string): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await CloudStore.get({ key })
      return value || null
    } catch {
      // Fallback if plugin isn't linked
      const { value } = await Preferences.get({ key })
      return value
    }
  } else {
    return localStorage.getItem(key)
  }
}

async function setStorageValue(key: string, value: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await CloudStore.set({ key, value })
    } catch {
      await Preferences.set({ key, value })
    }
  } else {
    localStorage.setItem(key, value)
  }
}

async function removeStorageValue(key: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await CloudStore.remove({ key })
    } catch {
      await Preferences.remove({ key })
    }
  } else {
    localStorage.removeItem(key)
  }
}

// ─── Dream Logs ───────────────────────────────────────────────────────────────

export async function getDreams(): Promise<DreamLog[]> {
  try {
    const raw = await getStorageValue(DREAMS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveDream(dream: DreamLog): Promise<void> {
  const dreams = await getDreams()
  const idx = dreams.findIndex((d) => d.id === dream.id)
  if (idx >= 0) {
    dreams[idx] = dream
  } else {
    dreams.unshift(dream)
  }
  await setStorageValue(DREAMS_KEY, JSON.stringify(dreams))
}

export async function deleteDream(id: string): Promise<void> {
  let dreams = await getDreams()
  dreams = dreams.filter((d) => d.id !== id)
  await setStorageValue(DREAMS_KEY, JSON.stringify(dreams))
}

export async function clearExampleDreams(): Promise<void> {
  let dreams = await getDreams()
  dreams = dreams.filter((d) => !d.isExample)
  await setStorageValue(DREAMS_KEY, JSON.stringify(dreams))
}

// ─── Journal Logs ─────────────────────────────────────────────────────────────

export async function getJournals(): Promise<JournalLog[]> {
  try {
    const raw = await getStorageValue(JOURNALS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveJournal(journal: JournalLog): Promise<void> {
  const journals = await getJournals()
  const idx = journals.findIndex((j) => j.id === journal.id)
  if (idx >= 0) {
    journals[idx] = journal
  } else {
    journals.unshift(journal)
  }
  await setStorageValue(JOURNALS_KEY, JSON.stringify(journals))
}

export async function deleteJournal(id: string): Promise<void> {
  let journals = await getJournals()
  journals = journals.filter((j) => j.id !== id)
  await setStorageValue(JOURNALS_KEY, JSON.stringify(journals))
}

// ─── Vision Rituals ───────────────────────────────────────────────────────────

export async function getVisions(): Promise<VisionLog[]> {
  try {
    const raw = await getStorageValue(VISIONS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveVision(vision: VisionLog): Promise<void> {
  const visions = await getVisions()
  const idx = visions.findIndex((v) => v.id === vision.id)
  if (idx >= 0) {
    visions[idx] = vision
  } else {
    visions.unshift(vision)
  }
  await setStorageValue(VISIONS_KEY, JSON.stringify(visions))
}

export async function deleteVision(id: string): Promise<void> {
  let visions = await getVisions()
  visions = visions.filter((v) => v.id !== id)
  await setStorageValue(VISIONS_KEY, JSON.stringify(visions))
}

// ─── Birth Data ───────────────────────────────────────────────────────────────

export async function getBirthData(): Promise<BirthData | null> {
  try {
    const raw = await getStorageValue(BIRTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function saveBirthData(data: BirthData): Promise<void> {
  await setStorageValue(BIRTH_KEY, JSON.stringify(data))
}

export async function clearBirthData(): Promise<void> {
  await removeStorageValue(BIRTH_KEY)
}

// ─── Dreamwalk Logs ────────────────────────────────────────────────────────────

const DREAMWALK_KEY = 'dreamscape_dreamwalks'

export async function getDreamwalks(): Promise<import('./types').DreamwalkLog[]> {
  try {
    const raw = await getStorageValue(DREAMWALK_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveDreamwalk(walk: import('./types').DreamwalkLog): Promise<void> {
  const walks = await getDreamwalks()
  const idx = walks.findIndex((w) => w.id === walk.id)
  if (idx >= 0) {
    walks[idx] = walk
  } else {
    walks.unshift(walk)
  }
  await setStorageValue(DREAMWALK_KEY, JSON.stringify(walks))
}

export async function deleteDreamwalk(id: string): Promise<void> {
  let walks = await getDreamwalks()
  walks = walks.filter((w) => w.id !== id)
  await setStorageValue(DREAMWALK_KEY, JSON.stringify(walks))
}

// ─── ID Generation ────────────────────────────────────────────────────────────

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ─── Demo Dreams ─────────────────────────────────────────────────────────────

export async function seedDemoDreams(): Promise<void> {
  const existing = await getDreams()
  const hasDemo = existing.some((d) => d.isExample)
  if (hasDemo) return

  const demos: DreamLog[] = [
    {
      id: 'demo-1',
      date: '2026-03-09',
      transcript: 'I was in a vast library where the books kept rearranging themselves. A woman in silver robes told me I had to find a specific red book before sunrise. I climbed ladders that extended into fog. When I found the book, it was blank inside but felt impossibly heavy.',
      isExample: true,
      createdAt: Date.now() - 7 * 86400000,
      extraction: {
        symbols: [
          { name: 'Library', salience: 0.9, category: 'Place', meaning: 'Repository of accumulated knowledge; the unconscious mind' },
          { name: 'Red Book', salience: 0.85, category: 'Object', meaning: 'Hidden wisdom; something sought but not yet understood' },
          { name: 'Ladder', salience: 0.7, category: 'Object', meaning: 'Ambition, ascent, striving toward higher understanding' },
          { name: 'Fog', salience: 0.6, category: 'Element', meaning: 'Obscured clarity; transition between known and unknown' },
          { name: 'Silver Robes', salience: 0.65, category: 'Appearance', meaning: 'Lunar wisdom; intuitive guidance' },
        ],
        emotions: [
          { name: 'Urgency', intensity: 0.82, valence: -0.3 },
          { name: 'Wonder', intensity: 0.75, valence: 0.8 },
          { name: 'Frustration', intensity: 0.45, valence: -0.6 },
        ],
        themes: [
          { name: 'Quest for Knowledge', confidence: 0.9, category: 'Archetypal' },
          { name: 'Hidden Truth', confidence: 0.8, category: 'Shadow' },
          { name: 'Time Pressure', confidence: 0.7, category: 'Anxiety' },
        ],
        characters: [
          { label: 'Silver-robed woman', known: false, archetype: 'Wise Guide' },
        ],
        setting: { type: 'Interior', quality: 'Labyrinthine', time: 'Pre-dawn' },
        narrative_arc: 'ascending',
        lucidity: 1,
        tone: 'mysterious, urgent',
        interpretation: 'The blank red book suggests that what you seek most urgently may not yet have content — the meaning is being written by the seeking itself. The silver guide represents an inner voice you haven\'t fully trusted yet. Libraries in dreams often signal that an important integration of past experiences is needed before moving forward.',
        astro_context: {
          moon_phase: 'Waxing Crescent',
          moon_sign: 'Gemini',
          cosmic_themes: ['Intellectual seeking', 'Dualities', 'Communication'],
          transit_note: 'Waxing Crescent in Gemini amplifies the mind\'s hunger for connection between disparate pieces of knowledge.',
          natal_aspects: [],
        },
        recommendations: [
          { action: 'Journal about unfinished intellectual projects', timing: 'This week', why: 'The blank book signals unexpressed ideas ready to be written' },
          { action: 'Seek out a mentor or trusted advisor', timing: 'Before the full moon', why: 'The silver guide represents wisdom available to you through real connection' },
        ],
      },
    },
    {
      id: 'demo-2',
      date: '2026-03-10',
      transcript: 'Flying over a city made of glass. Everything was transparent — I could see the people inside their homes going about routines but they couldn\'t see me. I felt both powerful and lonely. There was a storm coming from the east and I knew I had to warn someone but couldn\'t land.',
      isExample: true,
      createdAt: Date.now() - 6 * 86400000,
      extraction: {
        symbols: [
          { name: 'Glass City', salience: 0.88, category: 'Place', meaning: 'Illusion of transparency; seeing the hidden mechanisms of society' },
          { name: 'Flight', salience: 0.92, category: 'Action', meaning: 'Freedom, perspective, escape from earthly limitation' },
          { name: 'Storm from East', salience: 0.78, category: 'Element', meaning: 'Approaching change; news or forces from the outside world' },
          { name: 'Invisibility', salience: 0.7, category: 'Condition', meaning: 'Observer role; feeling unseen or disconnected from others' },
        ],
        emotions: [
          { name: 'Power', intensity: 0.8, valence: 0.6 },
          { name: 'Loneliness', intensity: 0.85, valence: -0.8 },
          { name: 'Urgency', intensity: 0.7, valence: -0.3 },
          { name: 'Helplessness', intensity: 0.65, valence: -0.7 },
        ],
        themes: [
          { name: 'Isolation vs Connection', confidence: 0.92, category: 'Relational' },
          { name: 'Warning Unheeded', confidence: 0.8, category: 'Prophetic' },
          { name: 'Observer Paradox', confidence: 0.75, category: 'Existential' },
        ],
        characters: [],
        setting: { type: 'Aerial', quality: 'Vast and transparent', time: 'Dusk' },
        narrative_arc: 'liminal',
        lucidity: 2,
        tone: 'expansive yet melancholic',
        interpretation: 'The glass city reflects a pattern of seeing others clearly while remaining emotionally removed — a protection mechanism that also creates the loneliness you feel. The inability to land mirrors a difficulty committing to full presence in situations where warning others is needed. The approaching storm may be a felt sense of real-world changes you\'re aware of but feel unable to address.',
        astro_context: {
          moon_phase: 'First Quarter',
          moon_sign: 'Cancer',
          cosmic_themes: ['Emotional transparency', 'Nurturing at a distance', 'Home and belonging'],
          transit_note: 'First Quarter Moon in Cancer creates tension between the desire for emotional safety and the call to act on what you sense.',
          natal_aspects: [],
        },
        recommendations: [
          { action: 'Reach out to someone you\'ve been observing from a distance', timing: 'Today', why: 'The dream\'s urgency suggests a real connection is waiting to be made' },
          { action: 'Identify one situation where you have valuable perspective to share', timing: 'This week', why: 'The warning you couldn\'t deliver may be wisdom someone needs from you' },
        ],
      },
    },
    {
      id: 'demo-3',
      date: '2026-03-11',
      transcript: 'I was in my childhood home but all the rooms were in different locations. The kitchen was at the top of a hill outside. My mother was there but younger than I remember, and she was painting a door that led nowhere. I tried to go through anyway and ended up in a white room with no windows.',
      isExample: true,
      createdAt: Date.now() - 5 * 86400000,
      extraction: {
        symbols: [
          { name: 'Childhood Home', salience: 0.95, category: 'Place', meaning: 'Foundational self; early conditioning and core beliefs' },
          { name: 'Door to Nowhere', salience: 0.85, category: 'Object', meaning: 'Threshold without destination; a transition whose outcome is undefined' },
          { name: 'Young Mother', salience: 0.8, category: 'Character', meaning: 'Anima/maternal complex in its formative state; early relationship templates' },
          { name: 'White Room', salience: 0.72, category: 'Place', meaning: 'Blank slate; necessary emptiness before a new beginning' },
          { name: 'Displaced Rooms', salience: 0.68, category: 'Condition', meaning: 'Core needs appearing in unexpected contexts; adaptability of psyche' },
        ],
        emotions: [
          { name: 'Nostalgia', intensity: 0.78, valence: 0.3 },
          { name: 'Disorientation', intensity: 0.72, valence: -0.4 },
          { name: 'Curiosity', intensity: 0.65, valence: 0.7 },
        ],
        themes: [
          { name: 'Origins and Roots', confidence: 0.9, category: 'Ancestral' },
          { name: 'Uncharted Threshold', confidence: 0.85, category: 'Archetypal' },
          { name: 'Maternal Archetype', confidence: 0.8, category: 'Relational' },
        ],
        characters: [
          { label: 'Young mother', known: true, archetype: 'Anima / Formative Caregiver' },
        ],
        setting: { type: 'Domestic/Surreal', quality: 'Familiar yet displaced', time: 'Daytime' },
        narrative_arc: 'cyclical',
        lucidity: 0,
        tone: 'dreamlike, quiet unease',
        interpretation: 'Childhood homes in dream consistently represent the architecture of the self built during formative years. The displaced rooms suggest that the foundations are stable but their expression is being renegotiated. The door to nowhere that you chose to walk through anyway is the most significant action — it indicates a readiness to move through transition even without a defined outcome.',
        astro_context: {
          moon_phase: 'Waxing Gibbous',
          moon_sign: 'Leo',
          cosmic_themes: ['Emotional inheritance', 'Creative self-expression', 'Courage in uncertainty'],
          transit_note: 'Waxing Gibbous Moon in Leo intensifies themes of identity formation and the courage required to be seen.',
          natal_aspects: [],
        },
        recommendations: [
          { action: 'Revisit a memory from your childhood home with fresh eyes', timing: 'This week', why: 'A belief formed there may be ready to be reframed' },
          { action: 'Take one step toward a transition you\'ve been postponing', timing: 'Before next full moon', why: 'The door you walked through signals readiness to move forward without certainty' },
        ],
      },
    },
    {
      id: 'demo-4',
      date: '2026-03-12',
      transcript: 'Ocean dream. I was swimming deeper and deeper and it kept getting lighter rather than darker. At the bottom was a sunlit meadow. A horse made of water was grazing there. I wasn\'t afraid, just peaceful. I woke up feeling rested for the first time in weeks.',
      isExample: true,
      createdAt: Date.now() - 4 * 86400000,
      extraction: {
        symbols: [
          { name: 'Deep Ocean', salience: 0.88, category: 'Element', meaning: 'Depth of the unconscious; going inward' },
          { name: 'Sunlit Meadow at Bottom', salience: 0.95, category: 'Place', meaning: 'Hidden nourishment; the illuminated unconscious; paradox resolved' },
          { name: 'Water Horse', salience: 0.9, category: 'Creature', meaning: 'Wild vitality tamed into beauty; natural power at peace with itself' },
        ],
        emotions: [
          { name: 'Peace', intensity: 0.95, valence: 0.95 },
          { name: 'Wonder', intensity: 0.85, valence: 0.9 },
          { name: 'Safety', intensity: 0.88, valence: 0.9 },
        ],
        themes: [
          { name: 'Descending into Light', confidence: 0.95, category: 'Archetypal' },
          { name: 'Integration', confidence: 0.88, category: 'Transformative' },
          { name: 'Restoration', confidence: 0.9, category: 'Healing' },
        ],
        characters: [
          { label: 'Water horse', known: false, archetype: 'Animal Guide / Wild Self' },
        ],
        setting: { type: 'Oceanic/Transcendent', quality: 'Paradoxically luminous', time: 'Timeless' },
        narrative_arc: 'descending',
        lucidity: 1,
        tone: 'serene, luminous',
        interpretation: 'This is a restorative dream — the psyche offering itself exactly what it needs. The inversion of ocean depth (darker → lighter) suggests that your deepest unconscious material is no longer threatening but generative. The water horse is a profound symbol of instinctual nature that has achieved peace, which mirrors something you are integrating in waking life.',
        astro_context: {
          moon_phase: 'Full Moon',
          moon_sign: 'Virgo',
          cosmic_themes: ['Emotional culmination', 'Integration of body and spirit', 'Healing'],
          transit_note: 'Full Moon in Virgo grounds emotional peaks in the body — the body in the dream knows how to rest.',
          natal_aspects: [],
        },
        recommendations: [
          { action: 'Note what allowed this restfulness and protect that condition', timing: 'Immediately', why: 'Your nervous system found something that works — identify it' },
          { action: 'Return to this dream image when anxious', timing: 'Ongoing', why: 'The water horse is an available inner resource' },
        ],
      },
    },
    {
      id: 'demo-5',
      date: '2026-03-13',
      transcript: 'A maze made of hedges but the paths kept rearranging. I had a compass but it kept pointing in different directions. I met another version of myself coming the opposite way, and we argued about which direction to go. Eventually we both sat down and the maze opened up.',
      isExample: true,
      createdAt: Date.now() - 3 * 86400000,
      extraction: {
        symbols: [
          { name: 'Rearranging Maze', salience: 0.88, category: 'Place', meaning: 'Shifting circumstances; the feeling that goals keep moving' },
          { name: 'Broken Compass', salience: 0.82, category: 'Object', meaning: 'Unreliable external guidance; need to develop inner navigation' },
          { name: 'Shadow Self', salience: 0.95, category: 'Character', meaning: 'Disowned perspective; alternate life path; inner conflict personified' },
          { name: 'Opening Maze', salience: 0.9, category: 'Event', meaning: 'Resolution through acceptance rather than force' },
        ],
        emotions: [
          { name: 'Frustration', intensity: 0.75, valence: -0.6 },
          { name: 'Defiance', intensity: 0.68, valence: -0.2 },
          { name: 'Relief', intensity: 0.88, valence: 0.9 },
          { name: 'Acceptance', intensity: 0.82, valence: 0.8 },
        ],
        themes: [
          { name: 'Inner Conflict', confidence: 0.95, category: 'Shadow' },
          { name: 'Resolution Through Surrender', confidence: 0.9, category: 'Transformative' },
          { name: 'Navigation Without Clear Path', confidence: 0.85, category: 'Existential' },
        ],
        characters: [
          { label: 'Other self', known: true, archetype: 'Shadow / Alternate Path' },
        ],
        setting: { type: 'Labyrinth', quality: 'Mutable', time: 'Unknown' },
        narrative_arc: 'cyclical',
        lucidity: 2,
        tone: 'tense resolving to peace',
        interpretation: 'Meeting an opposing version of yourself in a maze is the psyche staging its internal debate. The argument reflects a real decision where two parts of you hold incompatible views — and the resolution (sitting down together) reveals the answer: neither direction, but rest. The maze opening suggests that the situation will resolve itself when you stop fighting the ambiguity.',
        astro_context: {
          moon_phase: 'Waning Gibbous',
          moon_sign: 'Libra',
          cosmic_themes: ['Weighing options', 'Internal harmony', 'Decision fatigue'],
          transit_note: 'Waning Gibbous Moon in Libra invites releasing the need to decide and trusting that balance emerges naturally.',
          natal_aspects: [],
        },
        recommendations: [
          { action: 'Identify the internal conflict the two selves represent', timing: 'Today', why: 'The dream names a real dilemma — journal both perspectives without judgment' },
          { action: 'Pause a pending decision for 48 hours', timing: 'Now', why: 'The maze opened when effort stopped — the answer may need stillness, not force' },
        ],
      },
    },
    {
      id: 'demo-6',
      date: '2026-03-14',
      transcript: 'I was in a concert hall but the music was made of color rather than sound. The musicians were playing instruments that emitted light. I was the only one who could hear the sound underneath. After the concert, a musician handed me an instrument I\'d never seen before and said it was mine.',
      isExample: true,
      createdAt: Date.now() - 2 * 86400000,
      extraction: {
        symbols: [
          { name: 'Synesthetic Music', salience: 0.92, category: 'Experience', meaning: 'Integration of senses; perception beyond ordinary limitation' },
          { name: 'Hidden Sound', salience: 0.85, category: 'Experience', meaning: 'Access to a deeper layer of reality; unique perceptual gift' },
          { name: 'Unknown Instrument', salience: 0.95, category: 'Object', meaning: 'Ungiven gift; potential not yet expressed; your specific creative medium' },
          { name: 'Concert Hall', salience: 0.72, category: 'Place', meaning: 'Performance, shared artistic experience, audience and creator' },
        ],
        emotions: [
          { name: 'Awe', intensity: 0.9, valence: 0.9 },
          { name: 'Belonging', intensity: 0.78, valence: 0.85 },
          { name: 'Recognition', intensity: 0.88, valence: 0.9 },
        ],
        themes: [
          { name: 'Creative Calling', confidence: 0.95, category: 'Vocation' },
          { name: 'Unique Perception', confidence: 0.88, category: 'Gift' },
          { name: 'Inheritance of Gifts', confidence: 0.85, category: 'Archetypal' },
        ],
        characters: [
          { label: 'Musician', known: false, archetype: 'Artist / Animus' },
        ],
        setting: { type: 'Concert Hall', quality: 'Luminous', time: 'Evening' },
        narrative_arc: 'ascending',
        lucidity: 1,
        tone: 'transcendent, joyful',
        interpretation: 'The synesthetic concert is the unconscious generating a metaphor for your creative process — you perceive layers others don\'t. The fact that only you can hear the sound underneath the color suggests a private inner knowing that hasn\'t found external expression yet. The instrument being handed to you is the dream declaring: the medium for your particular gift exists and it is yours to claim.',
        astro_context: {
          moon_phase: 'Last Quarter',
          moon_sign: 'Scorpio',
          cosmic_themes: ['Creative depth', 'Hidden gifts surfacing', 'Transformative art'],
          transit_note: 'Last Quarter Moon in Scorpio supports releasing creative blocks and allowing hidden talents to surface.',
          natal_aspects: [],
        },
        recommendations: [
          { action: 'Explore one creative medium you\'ve dismissed as not for you', timing: 'This week', why: 'The unknown instrument awaits — it may be in a form you\'ve overlooked' },
          { action: 'Spend 20 minutes in a creative practice without audience', timing: 'Tomorrow morning', why: 'The hearing beneath the color happens in private before it can be shared' },
        ],
      },
    },
    {
      id: 'demo-7',
      date: '2026-03-15',
      transcript: 'Snake dream. A large golden snake was coiled in a garden, not threatening, just watching me. I sat next to it and it told me (without words) that I was afraid of the wrong things. When I woke up I felt changed somehow, more settled. The garden smelled like rain.',
      isExample: true,
      createdAt: Date.now() - 86400000,
      extraction: {
        symbols: [
          { name: 'Golden Snake', salience: 0.98, category: 'Creature', meaning: 'Kundalini, wisdom, transformation; the life force made visible' },
          { name: 'Garden', salience: 0.8, category: 'Place', meaning: 'The cultivated inner life; growth tended with intention' },
          { name: 'Rain Scent', salience: 0.72, category: 'Sensory', meaning: 'Renewal; the aftermath of release; petrichor as emotional catharsis' },
          { name: 'Wordless Communication', salience: 0.88, category: 'Event', meaning: 'Intuitive knowing; messages from the deeper self bypassing the intellect' },
        ],
        emotions: [
          { name: 'Stillness', intensity: 0.9, valence: 0.9 },
          { name: 'Recognition', intensity: 0.85, valence: 0.85 },
          { name: 'Groundedness', intensity: 0.92, valence: 0.95 },
        ],
        themes: [
          { name: 'Serpent Wisdom', confidence: 0.98, category: 'Archetypal' },
          { name: 'Misdirected Fear', confidence: 0.9, category: 'Shadow' },
          { name: 'Transformation', confidence: 0.92, category: 'Transformative' },
        ],
        characters: [
          { label: 'Golden snake', known: false, archetype: 'Chthonic Wisdom / Life Force' },
        ],
        setting: { type: 'Garden', quality: 'Sacred, rain-scented', time: 'Indeterminate' },
        narrative_arc: 'liminal',
        lucidity: 2,
        tone: 'numinous, grounding',
        interpretation: 'The golden snake is one of the most powerful archetypal dream figures — Asclepius, Kundalini, the caduceus. Its message (you fear the wrong things) is the unconscious correcting a conscious misalignment of attention. The settling feeling upon waking is diagnostic: this dream achieved something. The psyche used the night to reorganize your threat perception.',
        astro_context: {
          moon_phase: 'Waning Crescent',
          moon_sign: 'Pisces',
          cosmic_themes: ['Dissolution of illusion', 'Ancient wisdom', 'Pre-dawn insight'],
          transit_note: 'Waning Crescent in Pisces dissolves boundaries between the unconscious and conscious — the snake speaks directly.',
          natal_aspects: [],
        },
        recommendations: [
          { action: 'List 3 things you are currently afraid of, then identify which is the wrong fear', timing: 'Today', why: 'The snake\'s message was specific — your unconscious already knows the answer' },
          { action: 'Notice what you feel settled about after this dream', timing: 'Next 3 days', why: 'The reorganization the dream accomplished may show up as clarity in daily life' },
        ],
      },
    },
  ]

  for (const dream of demos) {
    await saveDream(dream)
  }
}
