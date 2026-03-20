import type { DreamLog } from './types'
import type { DreamExtraction } from './types'

export interface TarotCard {
  name: string
  number: string
  arc: string
  principle?: string
  meaning: string
}

export interface HermeticQuote {
  principle: string
  text: string
  source: string
}

export interface AstrologicalNote {
  moonSign: string
  arc: string
  note: string
}

const TARIFF_CARDS: Record<string, TarotCard> = {
  Library: { name: 'The Hierophant', number: 'V', arc: 'sacred-teaching', principle: 'Mentalism', meaning: 'The hidden teacher appears in the form of sacred knowledge — a book that cannot be read until the seeker is ready. Your unconscious has been compiling a library of symbolic wisdom, and tonight it offered you a key.' },
  'Red Book': { name: 'The Book of Secrets', number: 'Alt', arc: 'hidden-wisdom', principle: 'Mentalism', meaning: 'The unread book in a dream is the psyche pointing to knowledge not yet integrated. Its weight is the weight of unprocessed experience. When you find what you seek, it may be blank — meaning is not given, it is made.' },
  Ladder: { name: 'The Tower', number: 'XVI', arc: 'sudden-ascent', principle: 'Correspondence', meaning: 'Ladders dream of ascent. Every rung is a decision between known and unknown. Climbing a ladder in fog is the psyche naming a truth: you are moving toward something you cannot yet see, but which moves toward you equally.' },
  Fog: { name: 'The High Priestess', number: 'II', arc: 'veiled-reality', principle: 'Polarity', meaning: 'Fog in dreams is the space between knowing and not-knowing — the threshold state. It is not obscuring; it is softening. What is revealed all at once often wounds. What is approached through fog integrates gently.' },
  'Silver Robes': { name: 'The Moon', number: 'XVIII', arc: 'lunar-realm', principle: 'Rhythm', meaning: 'Silver is lunar. The guide in silver robes is your own lunar intelligence — the part of you that knows through dreaming, feeling, and receiving rather than grasping. Listen for what she says without words.' },
  'Glass City': { name: 'The Mirror', number: 'Alt', arc: 'clarity-through-seeing', principle: 'Correspondence', meaning: 'Cities of glass reveal what usually remains hidden — the structural truth beneath social performance. You see others\' routines clearly, yet they cannot see you. This is the analyst\'s position: seeing the system while remaining outside it.' },
  Flight: { name: 'The Fool', number: '0', arc: 'leap-of-faith', principle: 'Mentalism', meaning: 'Flying dreams grant a temporary escape from gravity — the law of consequences. But they also reveal the cost: you cannot warn anyone from the air. The dream may be asking whether your elevation comes at the cost of your belonging.' },
  'Storm from East': { name: 'The Tower', number: 'XVI', arc: 'disruption', principle: 'Cause and Effect', meaning: 'East is the direction of beginnings, and storms from the east carry news of what is being disrupted before it arrives. The warning you cannot deliver is a message meant for you. The storm is already inside you.' },
  Invisibility: { name: 'The Hermit', number: 'IX', arc: 'solitary-light', principle: 'Mentalism', meaning: 'To be unseen while seeing is the condition of the witness. You occupy the analyst\'s chair — present but not participating. The loneliness of this position is its gift: it produces clarity. The cost is belonging.' },
  'Childhood Home': { name: 'The Empress', number: 'III', arc: 'nurturing-origin', principle: 'Gender', meaning: 'The childhood home rearranges itself in dreams to show that the foundations are stable even when the rooms have moved. Your early architecture of self is intact. The displaced kitchen suggests that nourishment has been moved to an unfamiliar place — perhaps within yourself.' },
  'Door to Nowhere': { name: 'The Hanged Man', number: 'XII', arc: 'suspended-choice', principle: 'Rhythm', meaning: 'The door that leads nowhere is the door that leads inward. Walking through uncertainty without a destination is the highest form of faith — not belief in a result, but trust in the passage itself. The white room is the interior you could not see from outside.' },
  'Young Mother': { name: 'The Empress', number: 'III', arc: 'formative-nurture', principle: 'Gender', meaning: 'A younger mother in a dream returns you to the origin of your relational templates. She is painting — making meaning. The young mother is the psyche saying: the original care you received was creative, not fixed. It is still being made.' },
  'White Room': { name: 'The World', number: 'XXI', arc: 'completion-blank', principle: 'Correspondences', meaning: 'Blank spaces in dreams are not absences — they are potential. A white room with no windows is the psyche\'s invitation to begin filling it. Nothing was withheld; everything is waiting to be placed. This is the condition before the next act.' },
  'Displaced Rooms': { name: 'The Chariot', number: 'VII', arc: 'willful-arrangement', principle: 'Mentalism', meaning: 'Rooms that should be elsewhere are the psyche reorganizing its priorities. The kitchen at the top of a hill speaks to a hunger that cannot be satisfied where hunger is usually fed. Go to where nourishment has moved, even if it seems wrong.' },
  'Deep Ocean': { name: 'The Star', number: 'XVII', arc: 'hope-after-depth', principle: 'Rhythm', meaning: 'To descend and find light is the oldest symbol of the psyche\'s deepest capacity for self-restoration. The sunlit meadow at the ocean\'s floor is the unconscious offering exactly what the waking mind could not manufacture: trust that what is below can heal what is above.' },
  'Water Horse': { name: 'Strength', number: 'VIII', arc: 'wild-tamed-beauty', meaning: 'The water horse is instinctual nature that has found its own grace. To sit with it peacefully is the achievement of a long negotiation between wildness and gentleness. Rest here — this balance is rare and was not given; it was made.' },
  'Rearranging Maze': { name: 'The Wheel of Fortune', number: 'X', arc: 'changing-circumstances', principle: 'Rhythm', meaning: 'The maze that rearranges itself is the external world\'s mirror of an internal truth: goals that seemed fixed have moved because you have moved. The compass pointing different directions is the psyche saying: there is no wrong direction, only the direction you have not yet chosen.' },
  'Broken Compass': { name: 'The Hermit', number: 'IX', arc: 'inner-navigation', principle: 'Mentalism', meaning: 'The unreliable compass points to the necessity of inner guidance. External systems of direction have lost their authority for you — not as a loss, but as a liberation. The path you are on is not the one you planned. It is the one you need.' },
  'Shadow Self': { name: 'The Devil', number: 'XV', arc: 'shadow-integration', principle: 'Polarity', meaning: 'Meeting yourself as opposition is the psyche\'s most direct confrontation. The argument is internal — two truths held simultaneously. Sitting down together is not surrender; it is the highest negotiation. The maze opened because the conflict did.' },
  'Opening Maze': { name: 'Justice', number: 'VIII', arc: 'resolution-through-balance', principle: 'Cause and Effect', meaning: 'Mazes open when effort releases. This is the law of reverse effect operating in symbolic space: the harder you push against an internal conflict, the tighter it coils. Sitting still is not passivity — it is the action that the situation requires.' },
  'Synesthetic Music': { name: 'The Sun', number: 'XIX', arc: 'joy-clarity', principle: 'Mentalism', meaning: 'The dream of music made of color is a synesthetic gift — a perceiving beyond the usual gates of sense. You are receiving information that most people cannot access. The musician giving you an instrument you have never seen is the psyche saying: your medium exists and it is yours.' },
  'Hidden Sound': { name: 'The High Priestess', number: 'II', arc: 'unspoken-knowledge', principle: 'Correspondences', meaning: 'What lies beneath what is visible is the primary subject of all occult investigation. You hear what others cannot because you have learned to listen to layers. This gift is practical — trust what comes through the floor of ordinary perception.' },
  'Unknown Instrument': { name: 'The Magician', number: 'I', arc: 'tools-of-manifestation', principle: 'Mentalism', meaning: 'Receiving an instrument you have never seen is the psyche\'s declaration that your creative medium has not yet been named. It is waiting for you to discover it by playing. The musician handed it to you because the act of giving has already begun the process.' },
  Concert: { name: 'Judgement', number: 'XX', arc: 'awakening-call', principle: 'Rhythm', meaning: 'Concert halls dream of collective awakening. The musicians playing light are the forces of the unconscious offering themselves as a public performance for the first time. You were chosen as the sole audience for a reason — you are ready to receive what they have to offer.' },
  'Golden Snake': { name: 'The Empress', number: 'III', arc: 'life-force-wisdom', principle: 'Gender', meaning: 'The golden snake is one of the most powerful healing symbols the psyche can generate. Its message — you fear the wrong things — is the unconscious correcting a misalignment of attention that has been costing energy without producing insight. The garden where it coiled is where healing grows.' },
  Garden: { name: 'The Empress', number: 'III', arc: 'conscious-growth', principle: 'Gender', meaning: 'Gardens dream of the cultivated self. The condition of the garden — its layout, growth, decay — is a map of the psyche\'s relationship to its own development. Rain scent speaks of renewal, of the atmosphere that precedes and follows every significant internal change.' },
  'Rain Scent': { name: 'The Star', number: 'XVII', arc: 'post-storm-hope', principle: 'Rhythm', meaning: 'Petrichor — the smell of rain on dry earth — is the oldest olfactory memory, older than language. Dreams that include it are offering a return to pre-verbal wholeness. The settling you feel is the psyche saying: the release has happened, even if the situation has not changed yet.' },
  'Wordless Communication': { name: 'The High Priestess', number: 'II', arc: 'direct-knowing', principle: 'Correspondences', meaning: 'Communication without language is the dream\'s own medium. This is not metaphor — the psyche is showing that it knows things it cannot argue into words. Trust the message. The fact that it arrived wordlessly is what makes it true.' },
}

const HERMETIC_QUOTES: HermeticQuote[] = [
  { principle: 'Mentalism', source: 'The Kybalion', text: 'The lips of wisdom are closed, except to the ears of Understanding. What is above is like what is below, and what is below is like what is above — to accomplish the miracles of the One Thing.' },
  { principle: 'Correspondence', source: 'The Kybalion', text: 'As above, so below; as below, so above. The macrocosm and the microcosm are one. The patterns of the stars repeat in the patterns of your neurons; the movements of galaxies echo in the movements of your cells.' },
  { principle: 'Vibration', source: 'The Kybalion', text: 'Nothing rests; everything moves; everything vibrates. Your dreams are not separate from waking life — they are its hidden octave, its frequency too subtle for the ordinary ear to catch.' },
  { principle: 'Polarity', source: 'The Kybalion', text: 'Everything is dual; everything has poles; everything has its pair of opposites. The light you seek casts the shadow you deny. Both belong to you. Both are true. Both are the One Thing wearing different masks.' },
  { principle: 'Rhythm', source: 'The Kybalion', text: 'Everything flows out and in; everything has its tides; all things rise and fall. The swing of the pendulum is the law of the psyche: what you压抑 is what returns. What you release returns transformed.' },
  { principle: 'Cause and Effect', source: 'The Kybalion', text: 'Every cause has its effect; every effect has its cause. There is no such thing as chance. Your dreams are not accidents — they are causes you generated before you knew you had the power to generate causes.' },
  { principle: 'Gender', source: 'The Kybalion', text: 'Gender is in everything; everything has its masculine and feminine principles. The reconciliation of opposites is not the elimination of one — it is the embrace of both. The alchemical marriage is not a conquest; it is a meeting.' },
  { principle: 'Mentalism', source: 'Corpus Hermeticum I', text: 'Nature embraces the art of mind, and mind, co-embracing nature, weaves its forces through her — as a magnet draws iron filings — and shapes those things that are desired for its own use.' },
  { principle: 'Correspondences', source: 'Corpus Hermeticum II', text: 'The sun does not descend to earth, yet the earth brings forth by the sun\'s power. You do not need to climb to heaven; heaven descends into those who prepare themselves to receive it.' },
  { principle: 'Transformation', source: 'Corpus Hermeticum IV', text: 'Before the vessel is cleansed, it holds only what it has always held. Before the vessel is sanctified, its purpose is unknown. Cleansing and consecration are two acts of the same transformation.' },
  { principle: 'Emerald Tablet', source: 'Tabula Smaragdina', text: 'Its father is the Sun, its mother the Moon. The Wind carried it in its womb; its nurse is the Earth. This is the father of all perfection, the grandfather of all completion, throughout the whole world.' },
  { principle: 'Mentalism', source: 'The Corpus Hermeticum', text: 'God is not perceived — God is that by which perception itself is possible. You cannot see the eye with which you see. You cannot know the knower by whom you know. Rest in this paradox and you are closer than you think.' },
]

const MOON_SIGN_NOTES: AstrologicalNote[] = [
  { moonSign: 'Aries', arc: 'ascending', note: 'The Moon in Aries accelerates will. Tonight\'s dream asks: what do you want urgently, and is the urgency yours or borrowed from others? Aries Moon wants action — but the wisest action may be to observe before choosing.' },
  { moonSign: 'Aries', arc: 'descending', note: 'The Moon in Aries intensifies the will to grow. Your dreams are direct tonight — they will not disguise their messages in symbol. Take them literally. The desire that arose is real and yours.' },
  { moonSign: 'Aries', arc: 'liminal', note: 'The Moon in Aries is restlessness and beginning. Your liminal state is the threshold between who you were and who you are becoming. The impulse to act may be the very thing to refrain from — for now.' },
  { moonSign: 'Taurus', arc: 'ascending', note: 'The Moon in Taurus deepens into stability and beauty. Dreams tonight are earthy and honest. What they show you has weight — do not dismiss what feels comfortable as merely comfortable. Comfortable truths are the hardest truths to accept.' },
  { moonSign: 'Taurus', arc: 'descending', note: 'The Moon in Taurus grounds what has been unearthed. Your descending arc here is not a fall — it is a rooting. Let yourself arrive somewhere solid. The peace available tonight is earned.' },
  { moonSign: 'Taurus', arc: 'liminal', note: 'The Moon in Taurus holds. Your liminal state has the quality of waiting — not passive, but patient. Something is being allowed to settle before the next movement. Resist the urge to force the next step.' },
  { moonSign: 'Gemini', arc: 'ascending', note: 'The Moon in Gemini multiplies meanings. Dreams tonight will give you too much to process — which is the gift. Select one symbol and sit with it tomorrow. The others are backup; the one you chose is the one you needed.' },
  { moonSign: 'Gemini', arc: 'descending', note: 'The Moon in Gemini connects disparate threads. Your descending arc is revealing the pattern in things that seemed unrelated. Trust the link your dreaming mind made between X and Y. It is not arbitrary.' },
  { moonSign: 'Gemini', arc: 'liminal', note: 'The Moon in Gemini keeps the mind open. Your liminal state tonight is an invitation to not-know on purpose — a rare and valuable thing. Resist the compulsion to conclude. The openness is the medicine.' },
  { moonSign: 'Cancer', arc: 'ascending', note: 'The Moon in Cancer opens the realm of feeling and belonging. Dreams tonight carry an emotional charge — tend to it gently. What arose was not a wound; it was a reminder of what you carry that is worth protecting.' },
  { moonSign: 'Cancer', arc: 'descending', note: 'The Moon in Cancer is nurturing the part of you that was neglected. Your descending arc is restorative. Let yourself be cared for by the dream — you are receiving what you have been giving others.' },
  { moonSign: 'Cancer', arc: 'liminal', note: 'The Moon in Cancer makes the threshold between worlds soft and permeable. Your liminal state tonight is deeply felt — the movement between inside and outside, past and present, is where you have been living. Rest there.' },
  { moonSign: 'Leo', arc: 'ascending', note: 'The Moon in Leo amplifies creative will and the desire to be seen. Tonight\'s dream asks: are you performing your life or living it? The part of you that wants to be witnessed is also the part that knows how to be witnessed.' },
  { moonSign: 'Leo', arc: 'descending', note: 'The Moon in Leo is the heart asserting itself. Your descending arc is not a diminishing — it is a claiming. The light you dimmed to fit somewhere was always yours to keep. Tonight proved it.' },
  { moonSign: 'Leo', arc: 'liminal', note: 'The Moon in Leo holds creative power at the threshold. Your liminal state is between creation and audience — the artist and the viewer occupy the same space tonight. You are both.' },
  { moonSign: 'Virgo', arc: 'ascending', note: 'The Moon in Virgo sharpens perception and discrimination. Tonight\'s dream is precise — it will not waste your time with metaphor where plain speech will do. Pay attention to the literal content. It is exactly what it says it is.' },
  { moonSign: 'Virgo', arc: 'descending', note: 'The Moon in Virgo integrates the details into a working whole. Your descending arc is the completion of a practice — something you have been doing without knowing you were practicing. Tonight you know.' },
  { moonSign: 'Virgo', arc: 'liminal', note: 'The Moon in Virgo analyzes without judging. Your liminal state is the space between what is broken and what is whole — not a problem to fix, but a system to understand. Discernment without criticism is the tool.' },
  { moonSign: 'Libra', arc: 'ascending', note: 'The Moon in Libra weighs and balances. Tonight\'s dream shows both sides of something you have been treating as one-sided. The tension between the two truths is not a conflict — it is a necessary condition of the balance you seek.' },
  { moonSign: 'Libra', arc: 'descending', note: 'The Moon in Libra achieves a balance that did not exist before. Your descending arc is the resolution of a long negotiation. What tipped was not logic — it was the willingness to hold both sides without choosing one prematurely.' },
  { moonSign: 'Libra', arc: 'liminal', note: 'The Moon in Libra makes decisions that are not decisions. Your liminal state is a threshold you cross by standing still — the paradox of choosing peace. The choice is to stop choosing between the two sides for now.' },
  { moonSign: 'Scorpio', arc: 'ascending', note: 'The Moon in Scorpio deepens into what is hidden and transforming. Tonight\'s dream is not for everyone — it is for you. What was revealed was not meant for casual consumption. Treat it accordingly. Keep it close until you know what to do with it.' },
  { moonSign: 'Scorpio', arc: 'descending', note: 'The Moon in Scorpio is the underworld passage that precedes resurrection. Your descending arc is through the deep — not the shallow end of feeling, but the place where feeling becomes knowing. You went further than you usually allow.' },
  { moonSign: 'Scorpio', arc: 'liminal', note: 'The Moon in Scorpio holds power at the threshold. Your liminal state is between what you have been and what you are becoming — the between-state that Scorpio knows how to inhabit. You do not need to resolve it. You need to allow it.' },
  { moonSign: 'Sagittarius', arc: 'ascending', note: 'The Moon in Sagittarius seeks meaning and expansion. Tonight\'s dream pointed somewhere — not to a place but to a direction. The question you are carrying is the right question. Trust that the answer will arrive when you have finished forming it.' },
  { moonSign: 'Sagittarius', arc: 'descending', note: 'The Moon in Sagittarius receives the truth that completing the journey was the destination. Your descending arc reveals that what you sought was already inside you. The search was the finding.' },
  { moonSign: 'Sagittarius', arc: 'liminal', note: 'The Moon in Sagittarius holds the threshold between faith and knowledge. Your liminal state is between belief and understanding — not yet ready to declare either. The pause is not ignorance. It is the space where real conviction forms.' },
  { moonSign: 'Capricorn', arc: 'ascending', note: 'The Moon in Capricorn structures feeling into form. Tonight\'s dream offered a map for something you have been building. The path you saw — even if it seemed circuitous — is the structure that will hold. Follow it.' },
  { moonSign: 'Capricorn', arc: 'descending', note: 'The Moon in Capricorn consolidates what was gained. Your descending arc is the end of a phase of accumulation — not a loss of momentum, but the arrival at a place where what you have can finally be organized into what comes next.' },
  { moonSign: 'Capricorn', arc: 'liminal', note: 'The Moon in Capricorn builds at the threshold. Your liminal state is between two architectures — the old structure that no longer fits and the new one not yet built. Build anyway, even in the space between.' },
  { moonSign: 'Aquarius', arc: 'ascending', note: 'The Moon in Aquarius brings insight and unexpected connections. Tonight\'s dream linked two things that usually do not belong together — and the link was real. Follow the association. It knows something your waking mind has not yet articulated.' },
  { moonSign: 'Aquarius', arc: 'descending', note: 'The Moon in Aquarius releases the personal into the collective. Your descending arc connected your private experience to a larger pattern. You are not alone in what you are going through — and knowing that changes the quality of the journey.' },
  { moonSign: 'Aquarius', arc: 'liminal', note: 'The Moon in Aquarius observes without attachment. Your liminal state is an experiment in disengagement — not withdrawal, but the ability to witness your own experience from a slightly elevated position. Try it on.' },
  { moonSign: 'Pisces', arc: 'ascending', note: 'The Moon in Pisces dissolves the boundaries between self and other, waking and dreaming. Tonight\'s dream was both a message and a participation — you were the recipient and the sender. What you received, you also gave. What you gave, you also needed.' },
  { moonSign: 'Pisces', arc: 'descending', note: 'The Moon in Pisces receives what the ocean has been holding. Your descending arc is a return to the primordial — the place where individual self dissolves and becomes part of something larger. This is not loss. It is the oldest form of rest.' },
  { moonSign: 'Pisces', arc: 'liminal', note: 'The Moon in Pisces makes the threshold almost invisible. Your liminal state is between waking and dreaming, known and unknown, self and other. You have been living in the space where these distinctions become provisional. That is not confusion — it is advanced perception.' },
]

export function findTarotCard(symbolName: string): TarotCard | null {
  const key = Object.keys(TARIFF_CARDS).find(
    (k) => symbolName.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(symbolName.toLowerCase())
  )
  return key ? TARIFF_CARDS[key] : null
}

export function selectHermeticQuote(arc: string): HermeticQuote {
  const arcToPrinciple: Record<string, string> = {
    ascending: 'Mentalism',
    descending: 'Correspondences',
    liminal: 'Polarity',
    cyclical: 'Rhythm',
    fragmented: 'Vibration',
  }
  const preferred = arcToPrinciple[arc] || 'Mentalism'
  const matches = HERMETIC_QUOTES.filter((q) => q.principle === preferred)
  if (matches.length > 0) return matches[Math.floor(Math.random() * matches.length)]
  return HERMETIC_QUOTES[Math.floor(Math.random() * HERMETIC_QUOTES.length)]
}

export function selectAstrologicalNote(moonSign: string, arc: string): string {
  const sign = moonSign.split(' ')[0] || moonSign
  const match = MOON_SIGN_NOTES.find(
    (n) => n.moonSign.toLowerCase() === sign.toLowerCase() && n.arc === arc
  )
  if (match) return match.note
  const signMatch = MOON_SIGN_NOTES.find(
    (n) => n.moonSign.toLowerCase() === sign.toLowerCase()
  )
  return signMatch?.note || ''
}

export function buildSubtitle(extraction: DreamExtraction | undefined, arc: string): string {
  if (!extraction) return ''
  const dominant = extraction.symbols?.[0]?.name ?? ''
  const moonSign = extraction.astro_context?.moon_sign ?? ''
  const card = dominant ? findTarotCard(dominant) : null
  const hermetic = selectHermeticQuote(arc)
  const astro = selectAstrologicalNote(moonSign, arc)
  const parts: string[] = []
  if (card) parts.push(`${card.name} — ${card.meaning}`)
  if (hermetic) parts.push(`✦ ${hermetic.text} (${hermetic.source})`)
  if (astro) parts.push(`✦ ${astro}`)
  return parts.join('\n\n')
}

export function selectTarotForDreams(dreams: DreamLog[]): TarotCard | null {
  for (const dream of dreams) {
    const symbols = dream.extraction?.symbols ?? []
    for (const sym of symbols) {
      const card = findTarotCard(sym.name)
      if (card) return card
    }
  }
  return null
}
