/**
 * Seed script: Create synthetic dreamers with prophetic/unusual dreams
 * Run: npx ts-node scripts/seed-community-dreams.ts
 * 
 * Creates 10 archetypal dreamers with deeply engaging, prophetic, or unusual dreams
 * Covers different archetypes: The Visionary, The Mystic, The Alchemist, etc.
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface SyntheticDreamer {
  handle: string
  name: string
  bio: string
  avatar_seed: string
  dreams: Array<{
    date: string
    transcript: string
    extraction: any
  }>
}

const DREAMERS: SyntheticDreamer[] = [
  {
    handle: 'the_oracle',
    name: 'The Oracle',
    bio: 'Sees patterns in the collective unconscious. Prophetic visions of what\'s emerging.',
    avatar_seed: 'oracle',
    dreams: [
      {
        date: '2025-03-25',
        transcript: 'I stood in a library where all the books were written in light instead of ink. Each page glowed with a different color—blue for memory, gold for wisdom, red for warning. I was reading a book that hadn\'t been written yet. The words changed as I read them, as if the future was being decided by my attention. When I closed the book, the entire library shifted. The shelves rearranged themselves into the shape of a spiral galaxy. I understood: we are reading the universe into existence.',
        extraction: {
          symbols: [
            { name: 'Library', salience: 0.95, category: 'setting', meaning: 'Collective knowledge, hidden wisdom' },
            { name: 'Books of Light', salience: 0.92, category: 'object', meaning: 'Revelation, truth beyond language' },
            { name: 'Spiral Galaxy', salience: 0.88, category: 'symbol', meaning: 'Cosmic order, evolution, return' },
          ],
          emotions: [
            { name: 'Awe', intensity: 0.9, valence: 1 },
            { name: 'Understanding', intensity: 0.85, valence: 1 },
            { name: 'Responsibility', intensity: 0.7, valence: 0.5 },
          ],
          themes: [
            { name: 'Prophecy', confidence: 0.92, category: 'visionary' },
            { name: 'Co-creation', confidence: 0.88, category: 'metaphysical' },
            { name: 'Collective consciousness', confidence: 0.85, category: 'transpersonal' },
          ],
          characters: [
            { label: 'Self as Reader', known: true, archetype: 'The Witness' },
          ],
          setting: { type: 'Library', quality: 'luminous', time: 'timeless' },
          narrative_arc: 'ascending',
          lucidity: 3,
          tone: 'Revelatory, cosmic, purposeful',
          interpretation: 'The dreamer is recognizing their role as a conscious participant in reality creation. The library of light suggests accessing wisdom beyond conventional knowledge. The shifting galaxy indicates a shift in perspective—from observer to co-creator.',
          astro_context: {
            moon_phase: 'Waxing Gibbous',
            moon_sign: 'Aquarius',
            cosmic_themes: ['Collective awakening', 'Information revelation'],
            transit_note: 'Uranus square natal Sun: sudden insights, paradigm shifts',
            natal_aspects: ['Sun conjunct Mercury'],
          },
          recommendations: [
            { action: 'Write down the patterns you notice', timing: 'Daily for 7 days', why: 'Anchor the prophetic insight into conscious awareness' },
            { action: 'Share your visions with trusted others', timing: 'When they ask', why: 'Collective dreams strengthen through witnessing' },
          ],
        },
      },
    ],
  },
  {
    handle: 'the_alchemist',
    name: 'The Alchemist',
    bio: 'Transforms shadow into gold. Dreams of transmutation and hidden potential.',
    avatar_seed: 'alchemist',
    dreams: [
      {
        date: '2025-03-24',
        transcript: 'I was in a laboratory made of mirrors. Every surface reflected not what was, but what could be. I held a vial of black liquid—it was my fear, distilled. As I watched, it began to separate into layers: at the bottom, gold dust. In the middle, clear water. At the top, light. I poured the layers into a crucible and heated them. They merged into a single substance that was simultaneously all three. When I drank it, I understood that fear and courage are the same thing, just at different temperatures.',
        extraction: {
          symbols: [
            { name: 'Laboratory of Mirrors', salience: 0.94, category: 'setting', meaning: 'Self-reflection, potential, illusion' },
            { name: 'Black Liquid', salience: 0.91, category: 'object', meaning: 'Shadow self, fear, the prima materia' },
            { name: 'Crucible', salience: 0.89, category: 'object', meaning: 'Transformation, pressure, refinement' },
            { name: 'Gold Dust', salience: 0.87, category: 'symbol', meaning: 'Enlightenment, value, essence' },
          ],
          emotions: [
            { name: 'Courage', intensity: 0.88, valence: 1 },
            { name: 'Curiosity', intensity: 0.85, valence: 1 },
            { name: 'Integration', intensity: 0.9, valence: 1 },
          ],
          themes: [
            { name: 'Shadow integration', confidence: 0.93, category: 'psychological' },
            { name: 'Alchemy', confidence: 0.91, category: 'spiritual' },
            { name: 'Paradox', confidence: 0.87, category: 'philosophical' },
          ],
          characters: [
            { label: 'Self as Alchemist', known: true, archetype: 'The Transformer' },
          ],
          setting: { type: 'Laboratory', quality: 'reflective', time: 'eternal' },
          narrative_arc: 'ascending',
          lucidity: 3,
          tone: 'Transformative, paradoxical, empowering',
          interpretation: 'The dreamer is integrating shadow material and discovering that opposites contain each other. The laboratory of mirrors suggests deep self-knowledge. The transmutation of fear into courage indicates psychological maturation and the dissolution of false dichotomies.',
          astro_context: {
            moon_phase: 'Waning Crescent',
            moon_sign: 'Scorpio',
            cosmic_themes: ['Transformation', 'Death and rebirth'],
            transit_note: 'Pluto trine natal Moon: deep psychological work bearing fruit',
            natal_aspects: ['Mars conjunct Pluto'],
          },
          recommendations: [
            { action: 'Sit with the paradox', timing: 'Meditation, 20 min daily', why: 'Integrate the insight at a cellular level' },
            { action: 'Identify one fear and trace it to its gold', timing: 'This week', why: 'Make the alchemy practical and embodied' },
          ],
        },
      },
    ],
  },
  {
    handle: 'the_mystic',
    name: 'The Mystic',
    bio: 'Dissolves boundaries between self and cosmos. Dreams of unity and dissolution.',
    avatar_seed: 'mystic',
    dreams: [
      {
        date: '2025-03-23',
        transcript: 'There was no "I" in this dream, only awareness. I was the ocean and the wave, the dreamer and the dream. A voice that was not a voice said: "You have always been here." I felt my edges dissolving—not frightening, but like coming home. My body became transparent, then luminous. I could see through myself to the stars beyond. The stars were inside me. The inside and outside were the same. When I woke, the feeling persisted for hours: I am not separate from anything.',
        extraction: {
          symbols: [
            { name: 'Ocean and Wave', salience: 0.96, category: 'symbol', meaning: 'Unity, dissolution of self, cosmic consciousness' },
            { name: 'Transparent Body', salience: 0.93, category: 'symbol', meaning: 'Ego dissolution, enlightenment, permeability' },
            { name: 'Stars', salience: 0.91, category: 'symbol', meaning: 'Cosmic consciousness, infinity, divine' },
          ],
          emotions: [
            { name: 'Bliss', intensity: 0.95, valence: 1 },
            { name: 'Peace', intensity: 0.92, valence: 1 },
            { name: 'Belonging', intensity: 0.9, valence: 1 },
          ],
          themes: [
            { name: 'Non-duality', confidence: 0.94, category: 'mystical' },
            { name: 'Ego dissolution', confidence: 0.91, category: 'transpersonal' },
            { name: 'Cosmic consciousness', confidence: 0.93, category: 'spiritual' },
          ],
          characters: [],
          setting: { type: 'Cosmic ocean', quality: 'luminous', time: 'eternal' },
          narrative_arc: 'liminal',
          lucidity: 3,
          tone: 'Transcendent, peaceful, unified',
          interpretation: 'Direct experience of non-dual consciousness. The dreamer has accessed a state of unity consciousness where subject-object distinction dissolves. This is a genuine mystical experience—the integration of this state into waking life is the work ahead.',
          astro_context: {
            moon_phase: 'Full Moon',
            moon_sign: 'Pisces',
            cosmic_themes: ['Dissolution', 'Cosmic unity', 'Transcendence'],
            transit_note: 'Neptune conjunct natal Sun: mystical experiences, boundary dissolution',
            natal_aspects: ['Sun conjunct Neptune'],
          },
          recommendations: [
            { action: 'Ground this experience in the body', timing: 'Daily embodiment practice', why: 'Integrate transcendent experience into ordinary life' },
            { action: 'Serve others from this place of unity', timing: 'Ongoing', why: 'The mystical experience naturally flows into compassionate action' },
          ],
        },
      },
    ],
  },
  {
    handle: 'the_prophet',
    name: 'The Prophet',
    bio: 'Receives messages from the future. Precognitive dreams that manifest.',
    avatar_seed: 'prophet',
    dreams: [
      {
        date: '2025-03-22',
        transcript: 'A woman I\'ve never met stood in front of me. She had my eyes. She said: "I\'m coming. Prepare the way." Behind her, a city was being built in fast-forward—buildings rising, gardens growing, people arriving. She showed me a date: three months from now. "This is when the door opens," she said. "You\'ll recognize it by the sound of bells." I woke with the sound still ringing in my ears, though there were no bells.',
        extraction: {
          symbols: [
            { name: 'Woman with My Eyes', salience: 0.95, category: 'character', meaning: 'Future self, higher self, destiny' },
            { name: 'City Being Built', salience: 0.92, category: 'setting', meaning: 'New reality, manifestation, creation' },
            { name: 'Bells', salience: 0.9, category: 'symbol', meaning: 'Awakening, signal, sacred sound' },
          ],
          emotions: [
            { name: 'Anticipation', intensity: 0.88, valence: 1 },
            { name: 'Recognition', intensity: 0.85, valence: 1 },
            { name: 'Purpose', intensity: 0.9, valence: 1 },
          ],
          themes: [
            { name: 'Precognition', confidence: 0.89, category: 'prophetic' },
            { name: 'Destiny', confidence: 0.87, category: 'archetypal' },
            { name: 'Preparation', confidence: 0.85, category: 'practical' },
          ],
          characters: [
            { label: 'Woman with My Eyes', known: false, archetype: 'The Future Self' },
          ],
          setting: { type: 'Threshold between worlds', quality: 'luminous', time: 'future' },
          narrative_arc: 'ascending',
          lucidity: 3,
          tone: 'Prophetic, purposeful, urgent',
          interpretation: 'Precognitive dream indicating a significant life transition in approximately 3 months. The woman represents the dreamer\'s evolved self. The city symbolizes a new reality being constructed. The bells are a sensory marker for recognition when the event manifests.',
          astro_context: {
            moon_phase: 'New Moon',
            moon_sign: 'Aries',
            cosmic_themes: ['New beginnings', 'Initiation', 'Prophecy'],
            transit_note: 'Saturn square natal Venus: major life restructuring',
            natal_aspects: ['Mercury conjunct Uranus'],
          },
          recommendations: [
            { action: 'Document this dream in detail', timing: 'Today', why: 'Create a record to verify precognition' },
            { action: 'Prepare for change', timing: 'Next 3 months', why: 'The dream suggests active preparation is needed' },
            { action: 'Listen for the bells', timing: 'Ongoing', why: 'Develop sensitivity to synchronistic signals' },
          ],
        },
      },
    ],
  },
  {
    handle: 'the_dreamer_of_worlds',
    name: 'The Dreamer of Worlds',
    bio: 'Creates entire universes in sleep. Architect of alternate realities.',
    avatar_seed: 'worlds',
    dreams: [
      {
        date: '2025-03-21',
        transcript: 'I was dreaming a world into existence. With each breath, a new dimension appeared. I breathed out and mountains formed. I breathed in and they became oceans. I could see the rules of physics being written as I dreamed them. In one world, gravity flowed sideways. In another, time moved in spirals. I realized I was not alone—there were other dreamers, each creating their own worlds, and our worlds were beginning to touch at the edges. Where they touched, something new was being born.',
        extraction: {
          symbols: [
            { name: 'Breathing Worlds', salience: 0.96, category: 'symbol', meaning: 'Creation, manifestation, divine breath' },
            { name: 'Multiple Dimensions', salience: 0.93, category: 'setting', meaning: 'Infinite possibility, parallel realities' },
            { name: 'Other Dreamers', salience: 0.91, category: 'character', meaning: 'Collective creation, shared reality' },
          ],
          emotions: [
            { name: 'Creative Power', intensity: 0.92, valence: 1 },
            { name: 'Wonder', intensity: 0.9, valence: 1 },
            { name: 'Connection', intensity: 0.88, valence: 1 },
          ],
          themes: [
            { name: 'Reality creation', confidence: 0.94, category: 'metaphysical' },
            { name: 'Collective dreaming', confidence: 0.91, category: 'transpersonal' },
            { name: 'Infinite possibility', confidence: 0.89, category: 'philosophical' },
          ],
          characters: [
            { label: 'Other Dreamers', known: false, archetype: 'The Co-creators' },
          ],
          setting: { type: 'Infinite dimensional space', quality: 'malleable', time: 'creation time' },
          narrative_arc: 'ascending',
          lucidity: 3,
          tone: 'Creative, expansive, collaborative',
          interpretation: 'The dreamer is accessing their creative power and recognizing the collaborative nature of reality creation. The multiple worlds suggest awareness of quantum possibility. The touching worlds indicate the dreamer\'s readiness to collaborate with others in conscious creation.',
          astro_context: {
            moon_phase: 'Waxing Gibbous',
            moon_sign: 'Gemini',
            cosmic_themes: ['Creation', 'Possibility', 'Connection'],
            transit_note: 'Uranus trine natal Mercury: innovative thinking, expanded perception',
            natal_aspects: ['Sun conjunct Jupiter'],
          },
          recommendations: [
            { action: 'Explore your creative medium', timing: 'This week', why: 'Channel the creative power into tangible form' },
            { action: 'Find your co-dreamers', timing: 'Ongoing', why: 'Seek others aligned with your vision' },
            { action: 'Document the rules of your world', timing: 'Daily', why: 'Make the dream conscious and shareable' },
          ],
        },
      },
    ],
  },
  {
    handle: 'the_shadow_walker',
    name: 'The Shadow Walker',
    bio: 'Navigates the underworld. Dreams of death, rebirth, and hidden truths.',
    avatar_seed: 'shadow',
    dreams: [
      {
        date: '2025-03-20',
        transcript: 'I descended into a cavern that was also a womb. The walls were alive, breathing. At the bottom, I found a door made of bone. When I opened it, I saw myself—but inverted, like a photographic negative. This shadow-self smiled and said: "I\'ve been waiting for you to be ready." We merged. The sensation was like dying and being born simultaneously. When I emerged from the cavern, I was different. Not better or worse. Just... more complete.',
        extraction: {
          symbols: [
            { name: 'Cavern/Womb', salience: 0.94, category: 'setting', meaning: 'Underworld, unconscious, rebirth' },
            { name: 'Door of Bone', salience: 0.92, category: 'object', meaning: 'Threshold, death, transformation' },
            { name: 'Shadow Self', salience: 0.95, category: 'character', meaning: 'Repressed self, wholeness, integration' },
          ],
          emotions: [
            { name: 'Fear', intensity: 0.7, valence: -0.5 },
            { name: 'Acceptance', intensity: 0.92, valence: 1 },
            { name: 'Wholeness', intensity: 0.95, valence: 1 },
          ],
          themes: [
            { name: 'Shadow integration', confidence: 0.96, category: 'psychological' },
            { name: 'Death and rebirth', confidence: 0.93, category: 'archetypal' },
            { name: 'Underworld journey', confidence: 0.91, category: 'mythological' },
          ],
          characters: [
            { label: 'Shadow Self', known: true, archetype: 'The Shadow' },
          ],
          setting: { type: 'Underworld cavern', quality: 'alive', time: 'timeless' },
          narrative_arc: 'descending',
          lucidity: 3,
          tone: 'Dark, transformative, integrative',
          interpretation: 'Profound shadow integration dream. The dreamer has successfully integrated their repressed or denied aspects. The descent and ascent represent a complete cycle of psychological death and rebirth. The sensation of simultaneous dying and being born indicates genuine transformation.',
          astro_context: {
            moon_phase: 'Waning Gibbous',
            moon_sign: 'Scorpio',
            cosmic_themes: ['Death', 'Rebirth', 'Transformation'],
            transit_note: 'Pluto conjunct natal Sun: death of old self, rebirth',
            natal_aspects: ['Moon conjunct Pluto'],
          },
          recommendations: [
            { action: 'Honor the integration', timing: 'Ritual or ceremony', why: 'Mark this significant transformation' },
            { action: 'Embody the wholeness', timing: 'Daily practice', why: 'Integrate the shadow into conscious behavior' },
            { action: 'Share your journey', timing: 'When called', why: 'Your transformation can guide others' },
          ],
        },
      },
    ],
  },
  {
    handle: 'the_healer',
    name: 'The Healer',
    bio: 'Dreams of restoration and wholeness. Visions of healing others.',
    avatar_seed: 'healer',
    dreams: [
      {
        date: '2025-03-19',
        transcript: 'I was in a garden where every plant was a different color of light. I moved through the garden, and wherever I walked, the plants turned toward me. I understood that I was the sun for this garden. A person appeared—someone I know in waking life who is struggling. I took a flower of golden light and placed it in their chest. The flower grew, spreading light through their entire body. They looked at me and said: "Thank you for remembering me." I realized: healing is remembering someone\'s wholeness before they can see it themselves.',
        extraction: {
          symbols: [
            { name: 'Garden of Light', salience: 0.93, category: 'setting', meaning: 'Healing space, growth, vitality' },
            { name: 'Golden Flower', salience: 0.91, category: 'object', meaning: 'Healing, light, transformation' },
            { name: 'Self as Sun', salience: 0.89, category: 'symbol', meaning: 'Life force, healing power, radiance' },
          ],
          emotions: [
            { name: 'Compassion', intensity: 0.94, valence: 1 },
            { name: 'Purpose', intensity: 0.9, valence: 1 },
            { name: 'Love', intensity: 0.95, valence: 1 },
          ],
          themes: [
            { name: 'Healing', confidence: 0.95, category: 'therapeutic' },
            { name: 'Remembrance', confidence: 0.88, category: 'spiritual' },
            { name: 'Wholeness', confidence: 0.92, category: 'psychological' },
          ],
          characters: [
            { label: 'Struggling Person', known: true, archetype: 'The Wounded' },
          ],
          setting: { type: 'Luminous garden', quality: 'vital', time: 'eternal' },
          narrative_arc: 'ascending',
          lucidity: 3,
          tone: 'Compassionate, empowering, restorative',
          interpretation: 'The dreamer is recognizing their healing gifts and the nature of true healing: witnessing and reflecting back someone\'s wholeness. The garden represents the dreamer\'s own vitality and the space they create for others. This is a calling dream.',
          astro_context: {
            moon_phase: 'Waxing Crescent',
            moon_sign: 'Cancer',
            cosmic_themes: ['Nurturing', 'Healing', 'Growth'],
            transit_note: 'Chiron trine natal Venus: healing through love and presence',
            natal_aspects: ['Sun conjunct Chiron'],
          },
          recommendations: [
            { action: 'Develop your healing practice', timing: 'This month', why: 'The dream is calling you to formalize your gifts' },
            { action: 'Remember people\'s wholeness', timing: 'Daily', why: 'This is your primary healing tool' },
            { action: 'Tend your own garden', timing: 'Weekly', why: 'You cannot pour from an empty cup' },
          ],
        },
      },
    ],
  },
  {
    handle: 'the_trickster',
    name: 'The Trickster',
    bio: 'Breaks rules and reveals hidden truths through chaos. Dreams of disruption and revelation.',
    avatar_seed: 'trickster',
    dreams: [
      {
        date: '2025-03-18',
        transcript: 'Everything was backwards. I was walking on the ceiling. Gravity was a suggestion, not a law. A figure made of mirrors and laughter appeared—the Trickster. "You\'ve been taking yourself too seriously," it said. "Watch." It turned the sky inside out. The stars became the ground. The ground became sky. People were walking on stars, completely unaware that anything had changed. The Trickster laughed: "The joke is that there is no joke. Reality is just as arbitrary as you think it is. The only difference is whether you\'re laughing."',
        extraction: {
          symbols: [
            { name: 'Backwards World', salience: 0.92, category: 'setting', meaning: 'Inversion, illusion, perspective shift' },
            { name: 'Trickster Figure', salience: 0.94, category: 'character', meaning: 'Chaos, revelation, liberation' },
            { name: 'Inverted Sky', salience: 0.9, category: 'symbol', meaning: 'Reality is malleable, perspective is key' },
          ],
          emotions: [
            { name: 'Amusement', intensity: 0.88, valence: 1 },
            { name: 'Liberation', intensity: 0.91, valence: 1 },
            { name: 'Disorientation', intensity: 0.7, valence: 0 },
          ],
          themes: [
            { name: 'Perspective shift', confidence: 0.93, category: 'philosophical' },
            { name: 'Illusion', confidence: 0.91, category: 'metaphysical' },
            { name: 'Liberation through chaos', confidence: 0.87, category: 'archetypal' },
          ],
          characters: [
            { label: 'The Trickster', known: false, archetype: 'The Trickster' },
          ],
          setting: { type: 'Inverted reality', quality: 'chaotic', time: 'eternal' },
          narrative_arc: 'cyclical',
          lucidity: 3,
          tone: 'Playful, subversive, liberating',
          interpretation: 'The Trickster archetype is active in the dreamer\'s psyche, offering liberation through the recognition that reality is more fluid than we assume. The dream suggests the dreamer is ready to question their assumptions and embrace a more playful relationship with existence.',
          astro_context: {
            moon_phase: 'Full Moon',
            moon_sign: 'Sagittarius',
            cosmic_themes: ['Truth', 'Expansion', 'Perspective'],
            transit_note: 'Mercury square natal Jupiter: expanded thinking, questioning beliefs',
            natal_aspects: ['Sun conjunct Mercury'],
          },
          recommendations: [
            { action: 'Question one assumption', timing: 'This week', why: 'The Trickster invites you to examine what you take for granted' },
            { action: 'Find humor in chaos', timing: 'Ongoing', why: 'Laughter is the Trickster\'s medicine' },
            { action: 'Disrupt something', timing: 'This month', why: 'Channel the Trickster\'s creative chaos into your life' },
          ],
        },
      },
    ],
  },
  {
    handle: 'the_lover',
    name: 'The Lover',
    bio: 'Dreams of connection, intimacy, and the dissolution of separation.',
    avatar_seed: 'lover',
    dreams: [
      {
        date: '2025-03-17',
        transcript: 'I was dancing with someone I\'ve never met, but I knew them completely. We were moving as one body, one breath. The dance was a conversation without words. With each movement, I understood something about them—their fears, their joys, their deepest longings. They understood me the same way. We danced until there was no distinction between us. We became a single spiral of light. The music was the sound of two hearts beating as one. When the dance ended, I woke with the sensation of being held.',
        extraction: {
          symbols: [
            { name: 'Dance', salience: 0.94, category: 'action', meaning: 'Union, communication, flow' },
            { name: 'Unknown Lover', salience: 0.92, category: 'character', meaning: 'Soul connection, divine beloved' },
            { name: 'Spiral of Light', salience: 0.91, category: 'symbol', meaning: 'Union, DNA, sacred geometry' },
          ],
          emotions: [
            { name: 'Love', intensity: 0.96, valence: 1 },
            { name: 'Intimacy', intensity: 0.93, valence: 1 },
            { name: 'Belonging', intensity: 0.94, valence: 1 },
          ],
          themes: [
            { name: 'Sacred union', confidence: 0.94, category: 'spiritual' },
            { name: 'Soul connection', confidence: 0.91, category: 'transpersonal' },
            { name: 'Dissolution of separation', confidence: 0.92, category: 'mystical' },
          ],
          characters: [
            { label: 'Unknown Lover', known: false, archetype: 'The Divine Beloved' },
          ],
          setting: { type: 'Sacred dance space', quality: 'luminous', time: 'eternal' },
          narrative_arc: 'ascending',
          lucidity: 3,
          tone: 'Intimate, ecstatic, transcendent',
          interpretation: 'The dreamer is experiencing a vision of sacred union and soul-level connection. The unknown lover may represent an actual person or the dreamer\'s own wholeness. The dance symbolizes the perfect communication and flow that is possible between souls.',
          astro_context: {
            moon_phase: 'Waxing Gibbous',
            moon_sign: 'Libra',
            cosmic_themes: ['Union', 'Balance', 'Harmony'],
            transit_note: 'Venus conjunct natal Mars: passionate connection, attraction',
            natal_aspects: ['Venus conjunct Neptune'],
          },
          recommendations: [
            { action: 'Cultivate this feeling in waking life', timing: 'Daily', why: 'The dream is showing you what\'s possible' },
            { action: 'Dance', timing: 'This week', why: 'Embody the dream\'s wisdom through movement' },
            { action: 'Open to connection', timing: 'Ongoing', why: 'The dream suggests you\'re ready for deep intimacy' },
          ],
        },
      },
    ],
  },
  {
    handle: 'the_seeker',
    name: 'The Seeker',
    bio: 'Quests for meaning and truth. Dreams of journeys and discoveries.',
    avatar_seed: 'seeker',
    dreams: [
      {
        date: '2025-03-16',
        transcript: 'I was climbing a mountain that was also a spiral staircase. Each turn revealed a new landscape—desert, forest, ocean, sky. At each level, I met a guide who gave me a gift: a stone, a feather, a drop of water, a breath of wind. They said: "You\'re not climbing to reach the top. You\'re climbing to become the mountain." When I finally reached what I thought was the summit, I realized I was standing on the peak of my own heart. The view from there was infinite.',
        extraction: {
          symbols: [
            { name: 'Mountain/Spiral Staircase', salience: 0.95, category: 'setting', meaning: 'Ascent, journey, spiritual path' },
            { name: 'Four Guides', salience: 0.92, category: 'character', meaning: 'Wisdom, elements, wholeness' },
            { name: 'Gifts', salience: 0.91, category: 'object', meaning: 'Teachings, integration, power' },
          ],
          emotions: [
            { name: 'Determination', intensity: 0.88, valence: 1 },
            { name: 'Wonder', intensity: 0.9, valence: 1 },
            { name: 'Realization', intensity: 0.92, valence: 1 },
          ],
          themes: [
            { name: 'Spiritual journey', confidence: 0.94, category: 'spiritual' },
            { name: 'Self-discovery', confidence: 0.92, category: 'psychological' },
            { name: 'Integration', confidence: 0.91, category: 'wholeness' },
          ],
          characters: [
            { label: 'Four Guides', known: false, archetype: 'The Wise Ones' },
          ],
          setting: { type: 'Sacred mountain', quality: 'transformative', time: 'eternal' },
          narrative_arc: 'ascending',
          lucidity: 3,
          tone: 'Questing, revelatory, integrative',
          interpretation: 'The dreamer is on a genuine spiritual path and has reached a significant milestone: the realization that the destination is not external but internal. The four guides represent the integration of all aspects of self. The peak of the heart indicates the dreamer\'s readiness for heart-centered living.',
          astro_context: {
            moon_phase: 'Waxing Crescent',
            moon_sign: 'Sagittarius',
            cosmic_themes: ['Quest', 'Expansion', 'Truth-seeking'],
            transit_note: 'Jupiter trine natal Sun: expansion, opportunity, wisdom',
            natal_aspects: ['Sun conjunct Sagittarius'],
          },
          recommendations: [
            { action: 'Integrate the four gifts', timing: 'Daily practice', why: 'Each gift represents a different aspect of wholeness' },
            { action: 'Live from the heart', timing: 'Ongoing', why: 'The dream is inviting you to heart-centered decision-making' },
            { action: 'Share your journey', timing: 'When called', why: 'Your path can light the way for others' },
          ],
        },
      },
    ],
  },
  {
    handle: 'the_void_gazer',
    name: 'The Void Gazer',
    bio: 'Stares into the abyss and finds meaning in emptiness. Dreams of dissolution and infinity.',
    avatar_seed: 'void',
    dreams: [
      {
        date: '2025-03-15',
        transcript: 'I was standing at the edge of a void—not darkness, but pure emptiness. No light, no sound, no sensation. Just... nothing. I was terrified, but I stepped into it anyway. As I fell, I realized I was not falling. There was no gravity, no direction. I was suspended in infinite potential. Every possible version of myself existed here simultaneously. I could feel them all—the lives I lived, the lives I didn\'t live, the lives I could still live. The void was not empty. It was full of everything that hasn\'t been born yet. I understood: this is where creation begins.',
        extraction: {
          symbols: [
            { name: 'The Void', salience: 0.96, category: 'setting', meaning: 'Emptiness, potential, the unmanifest' },
            { name: 'Infinite Selves', salience: 0.94, category: 'symbol', meaning: 'Quantum possibility, multidimensional self' },
            { name: 'Falling/Floating', salience: 0.91, category: 'action', meaning: 'Surrender, weightlessness, freedom' },
          ],
          emotions: [
            { name: 'Fear', intensity: 0.8, valence: -0.5 },
            { name: 'Awe', intensity: 0.95, valence: 1 },
            { name: 'Understanding', intensity: 0.93, valence: 1 },
          ],
          themes: [
            { name: 'Void consciousness', confidence: 0.93, category: 'mystical' },
            { name: 'Quantum possibility', confidence: 0.89, category: 'metaphysical' },
            { name: 'Creation', confidence: 0.91, category: 'cosmological' },
          ],
          characters: [],
          setting: { type: 'The Void', quality: 'infinite', time: 'pre-creation' },
          narrative_arc: 'descending',
          lucidity: 3,
          tone: 'Terrifying, awe-inspiring, revelatory',
          interpretation: 'The dreamer has accessed the void consciousness—the quantum field of infinite potential from which all creation emerges. This is an advanced mystical experience. The fear followed by understanding indicates the dreamer\'s readiness to embrace the paradox of emptiness and fullness.',
          astro_context: {
            moon_phase: 'New Moon',
            moon_sign: 'Pisces',
            cosmic_themes: ['Void', 'Potential', 'Creation'],
            transit_note: 'Neptune conjunct natal Pluto: dissolution of old reality, access to void',
            natal_aspects: ['Sun conjunct Neptune'],
          },
          recommendations: [
            { action: 'Meditate on emptiness', timing: 'Daily', why: 'Deepen your relationship with the void' },
            { action: 'Create from the void', timing: 'Weekly', why: 'Channel void consciousness into manifestation' },
            { action: 'Embrace paradox', timing: 'Ongoing', why: 'The void is both empty and full' },
          ],
        },
      },
    ],
  },
]

async function seedDreamers() {
  console.log('🌙 Seeding community with synthetic dreamers...\n')

  for (const dreamer of DREAMERS) {
    try {
      // Create user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: `${dreamer.handle}@dreamscape.local`,
        password: Math.random().toString(36).slice(-12),
        email_confirm: true,
      })

      if (authError) {
        console.log(`⚠️  ${dreamer.handle}: Auth user exists or error: ${authError.message}`)
        continue
      }

      const userId = authData.user.id

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: userId,
        handle: dreamer.handle,
        name: dreamer.name,
        bio: dreamer.bio,
        avatar_seed: dreamer.avatar_seed,
      })

      if (profileError) {
        console.log(`⚠️  ${dreamer.handle}: Profile error: ${profileError.message}`)
        continue
      }

      // Create dreams
      for (const dream of dreamer.dreams) {
        const { error: dreamError } = await supabase.from('dreams').insert({
          user_id: userId,
          date: dream.date,
          transcript: dream.transcript,
          extraction: dream.extraction,
        })

        if (dreamError) {
          console.log(`⚠️  ${dreamer.handle}: Dream error: ${dreamError.message}`)
          continue
        }
      }

      console.log(`✅ ${dreamer.name} (${dreamer.handle}) - ${dreamer.dreams.length} dream(s)`)
    } catch (err) {
      console.error(`❌ ${dreamer.handle}:`, err)
    }
  }

  console.log('\n✨ Seeding complete!')
}

seedDreamers().catch(console.error)
