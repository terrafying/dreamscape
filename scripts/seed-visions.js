#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').replace(/^"/, '').replace(/"$/, '')
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const VISION_SEEDS = [
  {
    email: 'the_oracle@dreamscape.local',
    handle: 'the_oracle',
    avatar_seed: 'oracle',
    title: 'The House With Bells In Every Room',
    transcript: 'I am calling in a home that feels like a temple and a studio at once. Morning light pours across a long wooden table where I write, sketch, and receive clients. Every room has a bell tone when the air changes, like the house is blessing each threshold. Friends arrive for salons, tea, music, and future planning. I want beauty, sovereignty, and a home that amplifies my work rather than drains it.',
    distilled_intention: 'I inhabit a luminous home that blesses my work, nourishes community, and amplifies my future.',
    invocation: 'Let the true house reveal itself, room by room, bell by bell.',
    symbols: [
      ['Bell', 'Awakening, timing, sacred signal'],
      ['Long Table', 'Shared craft, hospitality, collaborative abundance'],
      ['Morning Light', 'Clarity, blessing, new chapter'],
      ['Temple House', 'Sanctuary fused with vocation'],
    ],
    themes: ['Sacred Home', 'Creative Sovereignty', 'Hospitality'],
    motifs: ['arched windows', 'honeyed wood', 'brass bells', 'altar flowers'],
    palette: ['#f4c95d', '#d8b4fe', '#f8fafc'],
    blockers: [
      ['Scarcity story', 'The right home is not fantasy; it is a frequency to practice now.', 'Begin a weekly house fund and collect image references.'],
      ['Fear of visibility', 'A welcoming space can hold your work without exposing your center.', 'Host one small salon this month in your current space.'],
    ],
    ritualSteps: [
      ['Ring a bell and name one quality of your future home aloud.', 'every morning', 'This teaches the body to expect resonance rather than compromise.'],
      ['Place a bowl of water by your workspace with a written address from the future tucked beneath it.', 'during the waxing moon', 'This turns desire into a directional ritual.'],
    ],
  },
  {
    email: 'the_alchemist@dreamscape.local',
    handle: 'the_alchemist',
    avatar_seed: 'alchemist',
    title: 'Studio Of Gold And Fire',
    transcript: 'I see myself running a studio where transformation is tangible. People arrive carrying old identities and leave with polished offerings, brave voices, and visible bodies of work. There is metal, velvet, candlelight, and a feeling that what happens here matters. My own art practice is no longer hidden behind service work. It burns at the center and pays me well.',
    distilled_intention: 'My studio transmutes hidden talent into visible work, wealth, and embodied confidence.',
    invocation: 'Feed the crucible. Let skill become gold in plain sight.',
    symbols: [
      ['Crucible', 'Transformation through heat and devotion'],
      ['Velvet Curtain', 'Threshold, theatrical reveal, earned mystery'],
      ['Gold Leaf', 'Value made visible'],
      ['Open Flame', 'Courage, risk, catalytic power'],
    ],
    themes: ['Alchemy', 'Creative Wealth', 'Visibility'],
    motifs: ['brass tools', 'charcoal sketches', 'molten gold', 'velvet drapery'],
    palette: ['#f59e0b', '#fb7185', '#c084fc'],
    blockers: [
      ['Over-identifying with service', 'Service can remain sacred without eclipsing authorship.', 'Reserve one protected maker day each week.'],
      ['Fear of charging fully', 'Price is part of the vessel that holds transformation.', 'Raise one offer this week and refine the language around outcomes.'],
    ],
    ritualSteps: [
      ['Light a candle before every work block and name what is being refined.', 'before work sessions', 'This marks the passage from effort into intentional transmutation.'],
      ['Photograph one finished detail from your practice every Friday.', 'weekly', 'Proof builds a new identity.'],
    ],
  },
  {
    email: 'the_mystic@dreamscape.local',
    handle: 'the_mystic',
    avatar_seed: 'mystic',
    title: 'Circle By The Sea',
    transcript: 'I am gathering a circle of people who meet beside the sea for deep practice, laughter, ritual, and mutual becoming. The work is intimate but not small. It nourishes the nervous system and sharpens perception. There are retreats, recordings, and quiet transmissions that travel far beyond the room. I want a life where community and devotion are the same gesture.',
    distilled_intention: 'I gather a devoted circle whose practice becomes both sanctuary and transmission.',
    invocation: 'Call the tide-bound circle. Let devotion travel farther than my voice.',
    symbols: [
      ['Tide Pool', 'Shared depth, rhythmic renewal'],
      ['Lantern', 'Held perception, inner guidance'],
      ['Circle', 'Reciprocity, containment, belonging'],
      ['Sea Wind', 'Transmission, blessing, unseen movement'],
    ],
    themes: ['Community Ritual', 'Devotion', 'Transmission'],
    motifs: ['moonlit sea', 'linen robes', 'glass lanterns', 'salt bowls'],
    palette: ['#7dd3fc', '#c084fc', '#f8fafc'],
    blockers: [
      ['Hesitation to lead', 'Leadership can be porous, invitational, and still fully real.', 'Invite three aligned people to a pilot gathering.'],
      ['Keeping work too private', 'Sacred work expands through witness.', 'Record one short teaching after your next ritual.'],
    ],
    ritualSteps: [
      ['Pour a small ring of salt and stand inside it while naming your ideal circle.', 'new moon nights', 'Containment clarifies invitation.'],
      ['Send one voice note invitation from the heart rather than over-editing it.', 'within 48 hours', 'The field responds to sincerity before polish.'],
    ],
  },
  {
    email: 'the_prophet@dreamscape.local',
    handle: 'the_prophet',
    avatar_seed: 'prophet',
    title: 'The Bell Tower Career',
    transcript: 'I can feel a public role approaching that blends foresight, synthesis, and practical strategy. I am not hidden behind other people anymore. My work becomes a signal people seek out when they need to orient to what is next. There is speaking, writing, advising, and a visible body of thought. It supports me materially and calls in the right collaborators at the right time.',
    distilled_intention: 'My public work becomes a trusted signal that guides people toward what is next.',
    invocation: 'Raise the tower. Let the clear note travel farther than fear.',
    symbols: [
      ['Bell Tower', 'Signal, broadcast, public role'],
      ['Printed Pages', 'Authorship, durable thought, transmission'],
      ['Compass', 'Orientation, strategic discernment'],
      ['Open Sky', 'Reach, permission, future horizon'],
    ],
    themes: ['Public Voice', 'Thought Leadership', 'Aligned Visibility'],
    motifs: ['high windows', 'wind lines', 'stacked journals', 'bronze bells'],
    palette: ['#f4c95d', '#94a3b8', '#e9d5ff'],
    blockers: [
      ['Waiting for permission', 'Authority coheres through repetition, not invitation.', 'Publish one clear thesis publicly this week.'],
      ['Splitting intuition from strategy', 'Your edge is the marriage of signal and structure.', 'Outline one offer that pairs foresight with action.'],
    ],
    ritualSteps: [
      ['Speak your central thesis into a recorder at sunrise.', 'three mornings in a row', 'Voice stabilizes the public self.'],
      ['Place a compass on top of your current notes and choose one direction to amplify.', 'weekly planning', 'This turns possibility into trajectory.'],
    ],
  },
]

function hashString(input) {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function createRng(seed) {
  let state = seed || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return ((state >>> 0) % 10000) / 10000
  }
}

function buildSigilRecipe(phrase, palette) {
  const normalized = phrase.toUpperCase().replace(/[^A-Z\s]/g, ' ').replace(/\s+/g, ' ').trim()
  const letters = normalized.replace(/[AEIOU\s]/g, '').split('')
  const glyphLetters = [...new Set(letters)].slice(0, 10)
  const seed = hashString(glyphLetters.join('') || normalized)
  const rng = createRng(seed)
  const symmetries = [4, 6, 8, 12]
  const sides = 5 + Math.floor(rng() * 4)
  return {
    source_phrase: normalized,
    normalized_phrase: glyphLetters.join(''),
    removed_characters: normalized.replace(/[BCDFGHJKLMNPQRSTVWXYZ\s]/g, '').split(''),
    glyph_letters: glyphLetters.length > 0 ? glyphLetters : ['V', 'S', 'N'],
    seed,
    geometry: {
      symmetry: symmetries[Math.floor(rng() * symmetries.length)],
      rings: 2 + Math.floor(rng() * 3),
      spokes: 4 + Math.floor(rng() * 5),
      polygon_sides: sides,
      polygon_skip: 2,
      line_weight: Number((1 + rng() * 1.3).toFixed(2)),
      rotation: Number((rng() * Math.PI * 2).toFixed(3)),
    },
    style: {
      palette,
      glow: Number((0.24 + rng() * 0.4).toFixed(2)),
      roughness: Number((0.1 + rng() * 0.2).toFixed(2)),
      border_mode: ['circle', 'double-circle', 'seal'][Math.floor(rng() * 3)],
    },
  }
}

function createBoardImage(title, motifs, palette) {
  const [a, b, c] = palette
  const motifText = motifs.slice(0, 4).join(' · ')
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#090910" />
          <stop offset="48%" stop-color="${b}" stop-opacity="0.25" />
          <stop offset="100%" stop-color="#130d24" />
        </linearGradient>
        <radialGradient id="halo" cx="30%" cy="20%" r="70%">
          <stop offset="0%" stop-color="${a}" stop-opacity="0.55" />
          <stop offset="55%" stop-color="${c}" stop-opacity="0.18" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="1200" height="900" fill="url(#bg)" rx="40" />
      <rect width="1200" height="900" fill="url(#halo)" rx="40" />
      <circle cx="930" cy="210" r="140" fill="${a}" fill-opacity="0.18" />
      <circle cx="260" cy="640" r="190" fill="${b}" fill-opacity="0.14" />
      <path d="M120 700 C340 420, 610 420, 980 650" fill="none" stroke="${c}" stroke-opacity="0.22" stroke-width="6" />
      <path d="M160 180 C420 80, 720 110, 1010 260" fill="none" stroke="${a}" stroke-opacity="0.18" stroke-width="4" />
      <rect x="86" y="76" width="1028" height="748" rx="34" fill="none" stroke="${b}" stroke-opacity="0.35" stroke-width="2" />
      <text x="110" y="150" fill="#f8fafc" font-family="Georgia, serif" font-size="54">${escapeXml(title)}</text>
      <text x="110" y="220" fill="#cbd5e1" font-family="Georgia, serif" font-size="28">${escapeXml(motifText)}</text>
    </svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function getOrCreateUser(seed) {
  const existingUsers = []
  let page = 1
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw error
    existingUsers.push(...data.users)
    if (data.users.length < 200) break
    page += 1
  }

  const existing = existingUsers.find((user) => user.email === seed.email)
  if (existing) return existing

  const { data, error } = await supabase.auth.admin.createUser({
    email: seed.email,
    password: Math.random().toString(36).slice(-12),
    email_confirm: true,
  })
  if (error) throw error
  return data.user
}

async function ensureProfile(userId, seed) {
  const { error } = await supabase.from('user_profiles').upsert({
    user_id: userId,
    handle: seed.handle,
    avatar_seed: seed.avatar_seed,
  }, { onConflict: 'user_id' })
  if (error) throw error
}

async function seedVisions() {
  console.log('Seeding shared visions...')

  for (const seed of VISION_SEEDS) {
    try {
      const user = await getOrCreateUser(seed)
      await ensureProfile(user.id, seed)

      const boardImageUrl = createBoardImage(seed.title, seed.motifs, seed.palette)
      const extraction = {
        title: seed.title,
        distilled_intention: seed.distilled_intention,
        invocation: seed.invocation,
        symbols: seed.symbols.map(([name, meaning], index) => ({
          name,
          salience: Number((0.9 - index * 0.08).toFixed(2)),
          category: index === 0 ? 'symbol' : 'motif',
          meaning,
        })),
        emotions: [
          { name: 'Devotion', intensity: 0.88, valence: 1 },
          { name: 'Anticipation', intensity: 0.74, valence: 0.85 },
          { name: 'Resolve', intensity: 0.79, valence: 0.92 },
        ],
        themes: seed.themes,
        blockers: seed.blockers.map(([name, reframing, action]) => ({ name, reframing, action })),
        visual_motifs: seed.motifs,
        color_palette: seed.palette,
        ritual_steps: seed.ritualSteps.map(([action, timing, why]) => ({ action, timing, why })),
        sigil_recipe: buildSigilRecipe(seed.invocation, seed.palette),
      }

      const visionId = `seed-${seed.handle}-vision`
      const visionData = {
        id: visionId,
        date: new Date().toISOString().slice(0, 10),
        transcript: seed.transcript,
        extraction,
        boardImageUrl,
        createdAt: Date.now(),
        published: true,
      }

      const { error } = await supabase.from('shared_visions').upsert({
        user_id: user.id,
        vision_id: visionId,
        vision_data: visionData,
        title: seed.title,
        distilled_intention: seed.distilled_intention,
        symbols: extraction.symbols.map((item) => item.name.toLowerCase()),
        themes: extraction.themes.map((item) => item.toLowerCase()),
        share_handle: seed.handle,
        board_image_url: boardImageUrl,
      }, { onConflict: 'user_id,vision_id' })

      if (error) throw error
      console.log(`  OK ${seed.handle} -> ${seed.title}`)
    } catch (error) {
      console.error(`  FAIL ${seed.handle}: ${error.message}`)
    }
  }

  console.log('Done.')
}

seedVisions().catch((error) => {
  console.error(error)
  process.exit(1)
})
