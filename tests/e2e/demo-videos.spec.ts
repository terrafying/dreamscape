/**
 * Demo video capture — 7-second product clips for App Store / social
 * Run: npx playwright test tests/e2e/demo-videos.spec.ts --project=video-iphone
 * Output: tests/videos/{page}-raw.webm  →  trimmed to 7s MP4 via npm run videos:trim
 */
import { test, Page } from '@playwright/test'
import path from 'path'

const OUT = path.join(process.cwd(), 'tests', 'videos')

// Seed a few demo dreams into localStorage before each video
async function seedDreams(page: Page) {
  await page.evaluate(() => {
    const dreams = [
      {
        id: 'demo1',
        date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
        transcript: 'I was flying over an ocean made of stars, then descended into a library beneath the waves. A silver fox handed me a book I could not open.',
        createdAt: Date.now() - 86400000,
        extraction: {
          symbols: [
            { name: 'Ocean of Stars', salience: 0.9, category: 'cosmic', meaning: 'Vast unconscious potential; the liminal space between waking and deep sleep.' },
            { name: 'Submerged Library', salience: 0.85, category: 'knowledge', meaning: 'Hidden wisdom accessible only through surrender to the depths.' },
            { name: 'Silver Fox', salience: 0.75, category: 'animal guide', meaning: 'Cunning guide to threshold knowledge; trickster wisdom.' },
          ],
          emotions: [
            { name: 'Wonder', intensity: 0.9, valence: 0.8 },
            { name: 'Longing', intensity: 0.6, valence: -0.2 },
          ],
          themes: [
            { name: 'Hidden Knowledge', confidence: 0.9, category: 'intellectual' },
            { name: 'Transformation', confidence: 0.8, category: 'psychological' },
          ],
          characters: [{ label: 'Silver Fox', known: false, archetype: 'Trickster' }],
          setting: { type: 'underwater library', quality: 'luminous', time: 'timeless' },
          narrative_arc: 'descending',
          lucidity: 1,
          tone: 'numinous',
          interpretation: 'The descent beneath the star-ocean suggests an invitation to access wisdom normally submerged beneath conscious awareness. The sealed book is not a refusal—it is a reminder that the knowledge you seek requires a different kind of opening.',
          astro_context: {
            moon_phase: 'Waning Gibbous',
            moon_sign: 'Scorpio',
            cosmic_themes: ['hidden depths', 'emotional revelation'],
            transit_note: 'Moon in Scorpio deepens the water imagery, amplifying themes of hidden knowledge and emotional truth.',
            natal_aspects: [],
          },
          recommendations: [
            { action: 'Spend 10 minutes in silent meditation before sleep', timing: 'Tonight', why: 'The sealed book suggests the answer comes through receptivity, not effort.' },
          ],
          goetic_resonance: { spirit: 'Vassago', reason: 'Vassago governs finding lost things and revealing hidden knowledge — resonant with the sealed book and submerged library.', barbarous: 'VASSAGO · USAGOO · VASSAGOO' },
        },
      },
      {
        id: 'demo2',
        date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
        transcript: 'Running through a burning forest but the flames were cold and violet. Found a door in a tree that led to my childhood bedroom but everything was upside down.',
        createdAt: Date.now() - 172800000,
        extraction: {
          symbols: [
            { name: 'Violet Flames', salience: 0.88, category: 'elemental', meaning: 'Transformation without destruction; purification of a familiar pattern.' },
            { name: 'Door in Tree', salience: 0.82, category: 'threshold', meaning: 'Passage through the natural world into personal history.' },
            { name: 'Inverted Room', salience: 0.79, category: 'architecture', meaning: 'Childhood framework now seen from a reversed vantage.' },
          ],
          emotions: [
            { name: 'Urgency', intensity: 0.75, valence: -0.3 },
            { name: 'Curiosity', intensity: 0.85, valence: 0.7 },
          ],
          themes: [
            { name: 'Inversion', confidence: 0.88, category: 'psychological' },
            { name: 'Return', confidence: 0.82, category: 'emotional' },
          ],
          characters: [],
          setting: { type: 'burning forest into childhood room', quality: 'surreal', time: 'dusk' },
          narrative_arc: 'cyclical',
          lucidity: 0,
          tone: 'urgent-curious',
          interpretation: 'The cold violet fire suggests that what you fear is already transformed — the urgency of running is the dream testing whether you will stop and enter. The inverted bedroom is your origin story, rearranged for you to see it anew.',
          astro_context: {
            moon_phase: 'First Quarter',
            moon_sign: 'Aries',
            cosmic_themes: ['action', 'initiation'],
            transit_note: 'Mars square Saturn echoes the paradox of urgent movement meeting a frozen structure.',
            natal_aspects: [],
          },
          recommendations: [
            { action: 'Write a letter to your 10-year-old self without editing', timing: 'This week', why: 'The inverted childhood room asks you to reframe, not revisit.' },
          ],
          goetic_resonance: { spirit: 'Phenex', reason: 'Phenex the phoenix governs transformation and rebirth — the cold violet flames are the mark of Phenex\'s domain.', barbarous: 'PHENEX · PHOENIX · PHEYNIX' },
        },
      },
      {
        id: 'demo3',
        date: new Date().toISOString().split('T')[0],
        transcript: 'Walking through an empty city at dawn, every building made of glass. Could see all the rooms but they were filled with sleeping figures I recognized but could not name.',
        createdAt: Date.now() - 3600000,
        extraction: {
          symbols: [
            { name: 'Glass City', salience: 0.9, category: 'architecture', meaning: 'Total transparency; the self as a structure seen from outside.' },
            { name: 'Sleeping Figures', salience: 0.85, category: 'collective', meaning: 'Unactivated aspects of self that appear familiar but unnamed.' },
            { name: 'Dawn Light', salience: 0.7, category: 'temporal', meaning: 'The liminal moment of emergence; threshold of consciousness.' },
          ],
          emotions: [
            { name: 'Solitude', intensity: 0.8, valence: -0.1 },
            { name: 'Recognition', intensity: 0.7, valence: 0.4 },
          ],
          themes: [
            { name: 'Witness Consciousness', confidence: 0.9, category: 'psychological' },
            { name: 'Collective Shadow', confidence: 0.75, category: 'archetypal' },
          ],
          characters: [{ label: 'Unnamed Sleepers', known: false, archetype: 'Shadow Collective' }],
          setting: { type: 'glass city at dawn', quality: 'transparent', time: 'dawn' },
          narrative_arc: 'liminal',
          lucidity: 2,
          tone: 'contemplative',
          interpretation: 'The glass city is a dream of radical transparency — you are seeing the interior lives of all the unlived versions of yourself. The sleeping figures are not strangers; they are dormant identities waiting for a name you must give them.',
          astro_context: {
            moon_phase: 'New Moon',
            moon_sign: 'Pisces',
            cosmic_themes: ['new beginnings', 'dissolution', 'emergence'],
            transit_note: 'New Moon in Pisces perfectly mirrors the dawn-city imagery — an empty canvas of possibility.',
            natal_aspects: [],
          },
          recommendations: [
            { action: 'Name three of the sleeping figures — give each an identity', timing: 'Morning', why: 'The dream asks you to call forward dormant aspects of yourself.' },
          ],
          goetic_resonance: { spirit: 'Dantalion', reason: 'Dantalion holds the faces of all humans and reads minds — he is the dream itself, showing you the faces of unactivated selves.', barbarous: 'DANTALION · DANTALIAN · DANTAYION' },
        },
      },
    ]
    localStorage.setItem('dreamscape_dreams', JSON.stringify(dreams))
  })
}

// ─── Log page — type dream, show extraction reveal ────────────────────────────

test('demo-log', async ({ page }) => {
  await page.goto('/log')
  await seedDreams(page)
  await page.reload()

  // Show the already-extracted most recent dream
  await page.waitForSelector('textarea', { timeout: 5000 }).catch(() => {})
  await page.waitForTimeout(500)

  // Scroll to show the extraction display if visible
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'smooth' }))
  await page.waitForTimeout(500)
  await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'smooth' }))
  await page.waitForTimeout(1200)
  await page.evaluate(() => window.scrollTo({ top: 1100, behavior: 'smooth' }))
  await page.waitForTimeout(1200)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await page.waitForTimeout(1500)
})

// ─── Strata — charts scrolling ────────────────────────────────────────────────

test('demo-strata', async ({ page }) => {
  await page.goto('/strata')
  await seedDreams(page)
  await page.reload()
  await page.waitForTimeout(1000)

  // Pan down through charts
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForTimeout(600)
  await page.evaluate(() => window.scrollTo({ top: 350, behavior: 'smooth' }))
  await page.waitForTimeout(1000)
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'smooth' }))
  await page.waitForTimeout(1000)
  await page.evaluate(() => window.scrollTo({ top: 1100, behavior: 'smooth' }))
  await page.waitForTimeout(1000)
  await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'smooth' }))
  await page.waitForTimeout(800)
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  await page.waitForTimeout(600)
})

// ─── Sleep — breathwork tab with 4D shape animation ──────────────────────────

test('demo-sleep', async ({ page }) => {
  await page.goto('/dreamscape')
  await page.waitForTimeout(800)

  // Start on breathwork tab (default) — let the 4D shape animate
  await page.waitForTimeout(1500)

  // Tap "Start" button
  const startBtn = page.getByRole('button').filter({ hasText: /start|begin|inhale/i }).first()
  await startBtn.click().catch(() => {})
  await page.waitForTimeout(2000)

  // Switch to binaural tab briefly
  await page.getByText('Binaural').click().catch(() => {})
  await page.waitForTimeout(1200)

  // Back to breathwork
  await page.getByText('Breathwork').click().catch(() => {})
  await page.waitForTimeout(1000)
})

// ─── Invoke — spirit selection + invocation ───────────────────────────────────

test('demo-invoke', async ({ page }) => {
  await page.goto('/invoke')
  await seedDreams(page)
  await page.reload()
  await page.waitForTimeout(1000)

  // Wait for suggested spirits to load
  await page.waitForTimeout(600)

  // Click a suggested spirit if visible
  const spiritBtn = page.getByRole('button').filter({ hasText: /dantalion|vassago|phenex/i }).first()
  await spiritBtn.click().catch(() => {})
  await page.waitForTimeout(800)

  // Begin invocation
  await page.getByRole('button').filter({ hasText: /invoke/i }).first().click().catch(() => {})
  await page.waitForTimeout(2000)

  // Show barbarous words appearing
  await page.waitForTimeout(1500)

  // Close the gate
  await page.getByRole('button').filter({ hasText: /close/i }).first().click().catch(() => {})
  await page.waitForTimeout(600)
})

// ─── Letters — generation reveal ─────────────────────────────────────────────

test('demo-letters', async ({ page }) => {
  await page.goto('/letters')
  await seedDreams(page)
  await page.reload()
  await page.waitForTimeout(800)

  // Show the generate button active
  await page.waitForTimeout(1000)

  // Scroll to show status
  await page.evaluate(() => window.scrollTo({ top: 100, behavior: 'smooth' }))
  await page.waitForTimeout(500)

  // Tap generate (will hit real API — for demo we just show the UI)
  const genBtn = page.getByRole('button').filter({ hasText: /generate/i })
  await genBtn.click().catch(() => {})
  await page.waitForTimeout(2500)

  // Show loading state (status messages)
  await page.evaluate(() => window.scrollTo({ top: 200, behavior: 'smooth' }))
  await page.waitForTimeout(1500)
})
