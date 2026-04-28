// Universal Spiritual Entities for Invocation
// Sephirotic archangels drawn from Hermetic / Qabalistic tradition,
// with Tibetan Buddhist correspondences and cross-tradition dream resonance.
// Replaces the Ars Goetia spirits for a more universally accessible invocation system.

export interface Entity {
  id: string
  name: string
  sephirah: string        // Qabalistic sphere
  number: number          // Sephirotic number (1-10) or extended (11-12)
  planet: string          // Planetary / elemental association
  domains: string[]
  invocation: string      // Barbarous / invocation words (Western · Tibetan seed)
  dream_resonance: string[]
  appearance: string
  color: string           // Hex — matches traditional Qabalistic King Scale
  tibetan: string         // Tibetan Buddhist correspondence and seed syllable
}

export const ENTITIES: Entity[] = [
  {
    id: 'metatron',
    name: 'Metatron',
    sephirah: 'Kether',
    number: 1,
    planet: 'Primum Mobile',
    domains: ['divine union', 'the crown', 'silence', 'beginning and end', 'the Presence'],
    invocation: 'METATRON · METATETRON · BITATYON · AIN SOPH AUR',
    dream_resonance: ['blinding white light', 'a pillar of fire', 'divine voice from above', 'the crown', 'vast formless silence', 'the face that cannot be seen'],
    appearance: 'An immense being of white fire standing at the threshold of the unmanifest; the Angel of the Presence; twin of Sandalphon',
    color: '#f0f0ff',
    tibetan: 'Samantabhadra · AH (white) · Dharmakaya — the ground of being',
  },
  {
    id: 'raziel',
    name: 'Raziel',
    sephirah: 'Chokmah',
    number: 2,
    planet: 'Fixed Stars',
    domains: ['cosmic secrets', 'primordial wisdom', 'the hidden Book', 'the Veil', 'divine law'],
    invocation: 'RAZIEL · RATZIEL · RAZEEL · YAH',
    dream_resonance: ['a luminous open scroll', 'stars forming patterns', 'ancient unknowable script', 'the veil suddenly lifted', 'galaxies seen from outside'],
    appearance: 'A robed figure of electric-blue light holding a luminous scroll; the keeper of all divine secrets since before creation',
    color: '#c8d8ff',
    tibetan: 'Vairochana · OM · The cosmic mirror; primordial clarity of the Dharmakaya',
  },
  {
    id: 'tzaphkiel',
    name: 'Tzaphkiel',
    sephirah: 'Binah',
    number: 3,
    planet: 'Saturn',
    domains: ['understanding', 'contemplation', 'sorrow as teacher', 'the great sea', 'time', 'the womb of forms'],
    invocation: 'TZAPHKIEL · ZAPHKIEL · JAPHKIEL · YHVH ELOHIM',
    dream_resonance: ['a boundless dark ocean', 'Saturn and its rings', 'an ancient weeping woman', 'pregnant darkness before a form', 'form dissolving back into sea'],
    appearance: 'A vast dark feminine presence; the divine mother of understanding; immovable, silent, immense; the container of all that becomes',
    color: '#2a1a3e',
    tibetan: 'Akshobhya · HUM · Mirror-like wisdom; immovable as the dark ground',
  },
  {
    id: 'tzadkiel',
    name: 'Tzadkiel',
    sephirah: 'Chesed',
    number: 4,
    planet: 'Jupiter',
    domains: ['mercy', 'loving-kindness', 'expansion', 'divine law', 'abundance', 'compassion', 'grace'],
    invocation: 'TZADKIEL · ZADKIEL · ZACHIEL · EL',
    dream_resonance: ['deep blue robes', 'an abundant overflowing hall', 'a merciful king with open hands', 'rivers of blessing', 'law given with love not fear'],
    appearance: 'A majestic blue-robed king bearing a scepter; overflowing with grace; the angel who stayed Abraham\'s hand',
    color: '#4169e1',
    tibetan: 'Ratnasambhava · TRAM · Equanimity wisdom; the jewel family — intrinsic worth of all beings',
  },
  {
    id: 'kamael',
    name: 'Kamael',
    sephirah: 'Geburah',
    number: 5,
    planet: 'Mars',
    domains: ['strength', 'purification', 'divine will', 'courage', 'severity', 'breaking what must break'],
    invocation: 'KAMAEL · CHAMAEL · CAMAEL · ELOHIM GIBOR',
    dream_resonance: ['red flames', 'a warrior whose fire purifies', 'lightning striking what is false', 'the forge and the hammer', 'a sword of light cleaving shadow'],
    appearance: 'A warrior in red armor carrying a great spear; pure will made manifest; the fire that burns clean; the angel of divine severity',
    color: '#cc2200',
    tibetan: 'Amoghasiddhi · AH (green) · All-accomplishing wisdom; fearless action without hesitation',
  },
  {
    id: 'michael',
    name: 'Michael',
    sephirah: 'Tiphareth',
    number: 6,
    planet: 'Sun',
    domains: ['beauty', 'solar light', 'the heart center', 'healing', 'harmony', 'the Holy Guardian Angel', 'sacrifice and redemption'],
    invocation: 'MIKHAEL · MI-KHA-EL · IAO MIKHAEL · HU',
    dream_resonance: ['the sun at noon', 'golden radiance filling a room', 'a winged solar figure', 'the heart opening like a flower', 'perfect balance', 'beauty recognized everywhere'],
    appearance: 'A solar angel in gold and white, carrying scales and a sword of light; the face of divine beauty; the angel most associated with the Holy Guardian Angel in Western practice',
    color: '#fbbf24',
    tibetan: 'Amitabha · HRIH · Discriminating-awareness wisdom; the discerning red wisdom of the heart',
  },
  {
    id: 'haniel',
    name: 'Haniel',
    sephirah: 'Netzach',
    number: 7,
    planet: 'Venus',
    domains: ['desire', 'love', 'beauty in nature', 'the unseen world', 'art', 'deep emotion', 'instinct'],
    invocation: 'HANIEL · ANAEL · ANIEL · YHVH TZABAOTH',
    dream_resonance: ['rose gardens at dusk', 'Venus at the horizon', 'waterfalls into deep pools', 'overwhelming emotion', 'an otherworldly beloved seen across water'],
    appearance: 'A luminous green and rose figure dancing in a forest; fierce with love; the angel of beauty\'s wild side; the raw force of desire before thought',
    color: '#16a34a',
    tibetan: 'Green Tara · TAM · Fearless compassion; swift action born of love',
  },
  {
    id: 'raphael',
    name: 'Raphael',
    sephirah: 'Hod',
    number: 8,
    planet: 'Mercury',
    domains: ['healing', 'intellect', 'communication', 'magic', 'the wind', 'science', 'the caduceus', 'travellers'],
    invocation: 'RAPHAEL · REPHAEL · RAPHU · ELOHIM TZABAOTH',
    dream_resonance: ['the caduceus staff', 'orange dawn light', 'a message received', 'a physician with golden hands', 'swift wind through trees', 'books opening to the needed page'],
    appearance: 'A quicksilver messenger bearing the caduceus and traveller\'s staff; healer; the angel of the East Wind; also attributed to the East in the LBRP',
    color: '#f97316',
    tibetan: 'Manjushri · DHIH · Wisdom of discernment; the flaming sword that cuts delusion',
  },
  {
    id: 'gabriel',
    name: 'Gabriel',
    sephirah: 'Yesod',
    number: 9,
    planet: 'Moon',
    domains: ['dreams', 'the unconscious', 'the gate of vision', 'cycles', 'reflection', 'annunciation', 'the threshold'],
    invocation: 'GABRIEL · GABRI-EL · JIBREEL · SHADDAI EL CHAI',
    dream_resonance: ['the full moon', 'silver pools of still water', 'a messenger at the threshold', 'dreams within dreams', 'tides turning', 'the veil thinning at dusk'],
    appearance: 'A silver-robed figure holding a lily; the angel of the threshold between worlds; the gate of dreams; the bringer of annunciations',
    color: '#a78bfa',
    tibetan: 'Chandra / Vajrayogini · OM (silver) · The dream-body; the subtle channel of the moon',
  },
  {
    id: 'sandalphon',
    name: 'Sandalphon',
    sephirah: 'Malkuth',
    number: 10,
    planet: 'Earth',
    domains: ['the body', 'the earth', 'prayers ascending', 'completion of the Work', 'grounding', 'the kingdom'],
    invocation: 'SANDALPHON · SANDOLPHON · ADONAI HA-ARETZ',
    dream_resonance: ['roots growing deep', 'the earth breathing', 'a vast twin standing far below', 'prayers becoming birds and rising', 'the ground opening gently'],
    appearance: 'The earthly twin of Metatron; a vast calm presence beneath all things; the angel who gathers all prayers and carries them to the throne; stands with both feet on the ground',
    color: '#a16207',
    tibetan: 'White Tara · TAM (white) · The earth-mother; the completion that holds all',
  },
  {
    id: 'uriel',
    name: 'Uriel',
    sephirah: 'Daath / North',
    number: 11,
    planet: 'Earth / Outer Planets',
    domains: ['the abyss', 'wisdom through loss', 'alchemy of darkness', 'hidden knowledge', 'the North Wind', 'enlightenment through descent'],
    invocation: 'URIEL · AURIEL · PHANUEL · ADONAI',
    dream_resonance: ['a black sun', 'the abyss that is not empty', 'dark flame that illuminates', 'the north wind', 'descent into depths followed by return', 'the void that gives birth'],
    appearance: 'A figure of dark flame; the Light of God in the abyss; the angel of regret and enlightenment through loss; stands in the North in the LBRP',
    color: '#312e81',
    tibetan: 'Ekajati · HUM (dark blue) · Wrathful protector; one-eyed, one-fanged; transforms all into dharma',
  },
  {
    id: 'hga',
    name: 'Holy Guardian Angel',
    sephirah: 'Tiphareth / Atman',
    number: 6,
    planet: 'Sun',
    domains: ['true will', 'one\'s highest nature', 'knowledge and conversation', 'personal divinity', 'the real self', 'the summum bonum'],
    invocation: 'HEAR ME · COME FORTH · I ASPIRE · HU · OM · WHO IS LIKE GOD?',
    dream_resonance: ['your face in a mirror becoming luminous', 'a guide who knows your truest name', 'golden warmth from no particular direction', 'the feeling of being completely known and loved', 'wholeness recognized'],
    appearance: 'Your own highest nature; the solar self you have always been; appears in whatever form is most true and most meaningful to the seeker alone',
    color: '#ffd700',
    tibetan: 'Rigpa · EVAM · The nature of mind itself; one\'s own buddha-nature recognizing itself',
  },
]

// Universal opening/closing framing — replaces PGM_INVOCATION
export const UNIVERSAL_INVOCATION = {
  opening: 'IAO · AUM · I ASPIRE · WHO IS LIKE GOD?',
  closing: 'OM AH HUM · AEĒIOUŌ · THIS WORK IS SEALED',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getEntityById(id: string): Entity | undefined {
  return ENTITIES.find(e => e.id === id)
}

// Find entities resonant with given dream themes/symbols (mirrors goetia.findResonantSpirits)
export function findResonantEntities(themes: string[], symbols: string[], limit = 3): Entity[] {
  const query = [...themes, ...symbols].map(s => s.toLowerCase())
  const scored = ENTITIES.map(entity => {
    const resonance = entity.dream_resonance.map(r => r.toLowerCase())
    const domainWords = entity.domains.join(' ').toLowerCase()
    let score = 0
    for (const q of query) {
      for (const r of resonance) {
        if (r.includes(q) || q.includes(r)) score += 2
      }
      if (domainWords.includes(q)) score += 1
    }
    return { entity, score }
  })
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.entity)
}
