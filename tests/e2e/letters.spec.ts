import { test, expect, type Page } from '@playwright/test'

const MOCK_LETTER_SSE = [
  'event: status\ndata: {"message":"Gathering your dream threads..."}',
  'event: status\ndata: {"message":"Finding the patterns..."}',
  'event: status\ndata: {"message":"Writing your letter..."}',
  `event: letter\ndata: ${JSON.stringify({
    prose: 'Dear dreamer,\n\nYour dreams this week have circled water and light.\n\nThe ocean knows you.',
    structured: {
      key_patterns: [{ pattern: 'Water', frequency: 4, significance: 'The unconscious is active' }],
      emotional_arc: 'From anxiety toward serenity.',
      dominant_symbol: { name: 'Ocean', meaning: 'The depths' },
      recommendations: [{ action: 'Spend time near water', timing: 'This week', why: 'Reinforce integration' }],
      closing_theme: 'Trust what lies beneath.',
    },
  })}`,
  'event: done\ndata: {}',
].join('\n\n') + '\n\n'

// Seed N dreams with extractions via addInitScript (runs before page JS)
async function seedDreams(page: Page, count: number) {
  await page.addInitScript((n: number) => {
    const dreams = Array.from({ length: n }, (_, i) => ({
      id: `d${i}`,
      date: `2026-03-${String(i + 10).padStart(2, '0')}`,
      transcript: `Dream ${i + 1}`,
      createdAt: Date.now() - i * 86400000,
      extraction: {
        symbols: [], emotions: [], themes: [], characters: [],
        setting: { type: 'Indoor', quality: 'Plain', time: 'Night' },
        narrative_arc: 'ascending',
        lucidity: 0,
        tone: 'neutral',
        interpretation: 'A test dream.',
        astro_context: {
          moon_phase: 'Full Moon', moon_sign: 'Pisces',
          cosmic_themes: [], transit_note: '', natal_aspects: [],
        },
        recommendations: [],
      },
    }))
    localStorage.setItem('dreamscape_dreams', JSON.stringify(dreams))
  }, count)
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('_init')) {
      sessionStorage.setItem('_init', '1')
      localStorage.clear()
      localStorage.setItem('dreamscape_birth_dismissed', '1')
    }
  })
})

test('generate button is disabled with fewer than 3 analyzed dreams', async ({ page }) => {
  await page.goto('/letters')
  await expect(page.getByRole('button', { name: /generate letter/i })).toBeDisabled()
})

test('shows how many more dreams are needed', async ({ page }) => {
  await page.goto('/letters')
  await expect(page.getByText(/log 3 more dream/i)).toBeVisible()
})

test('generate button enables with 3+ analyzed dreams', async ({ page }) => {
  await seedDreams(page, 3)
  await page.goto('/letters')
  await expect(page.getByRole('button', { name: /generate letter/i })).toBeEnabled()
})

test('generates and displays the letter', async ({ page }) => {
  await page.route('/api/letter', (route) =>
    route.fulfill({ status: 200, contentType: 'text/event-stream', body: MOCK_LETTER_SSE })
  )
  await seedDreams(page, 3)
  await page.goto('/letters')
  await page.getByRole('button', { name: /generate letter/i }).click()

  await expect(page.getByText('Your Dream Letter')).toBeVisible()
  await expect(page.getByText('Dear dreamer,')).toBeVisible()
})

test('structured patterns appear after generation', async ({ page }) => {
  await page.route('/api/letter', (route) =>
    route.fulfill({ status: 200, contentType: 'text/event-stream', body: MOCK_LETTER_SSE })
  )
  await seedDreams(page, 3)
  await page.goto('/letters')
  await page.getByRole('button', { name: /generate letter/i }).click()

  await expect(page.getByText('Recurring Patterns')).toBeVisible()
  await expect(page.getByText('Emotional Arc')).toBeVisible()
  await expect(page.getByText('Waking Actions')).toBeVisible()
})

test('regenerate button resets to generate state', async ({ page }) => {
  await page.route('/api/letter', (route) =>
    route.fulfill({ status: 200, contentType: 'text/event-stream', body: MOCK_LETTER_SSE })
  )
  await seedDreams(page, 3)
  await page.goto('/letters')
  await page.getByRole('button', { name: /generate letter/i }).click()
  await expect(page.getByText('Your Dream Letter')).toBeVisible()

  await page.getByRole('button', { name: /regenerate/i }).click()
  await expect(page.getByRole('button', { name: /generate letter/i })).toBeVisible()
})
