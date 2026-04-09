import { test, expect } from '@playwright/test'

// Mock extraction to avoid real Anthropic calls
const MOCK_EXTRACTION = {
  symbols: [{ name: 'Ocean', salience: 0.9, category: 'Element', meaning: 'The unconscious' }],
  emotions: [{ name: 'Peace', intensity: 0.8, valence: 0.9 }],
  themes: [{ name: 'Depth', confidence: 0.85, category: 'Archetypal' }],
  characters: [],
  setting: { type: 'Ocean', quality: 'Vast', time: 'Night' },
  narrative_arc: 'descending',
  lucidity: 1,
  tone: 'serene',
  interpretation: 'A dream about depth and peace.',
  astro_context: {
    moon_phase: 'Full Moon',
    moon_sign: 'Pisces',
    cosmic_themes: ['Healing'],
    transit_note: 'Full Moon amplifies depth.',
    natal_aspects: [],
  },
  recommendations: [{ action: 'Journal tonight', timing: 'Today', why: 'Images are fresh' }],
}

function makeMockSSE() {
  const lines = [
    'event: status\ndata: {"message":"Reading your dream..."}',
    'event: status\ndata: {"message":"Consulting the stars..."}',
    'event: status\ndata: {"message":"Weaving interpretation..."}',
    `event: extraction\ndata: ${JSON.stringify({ data: MOCK_EXTRACTION })}`,
    'event: done\ndata: {}',
  ]
  return lines.join('\n\n') + '\n\n'
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('_init')) {
      sessionStorage.setItem('_init', '1')
      localStorage.clear()
      localStorage.setItem('dreamscape_birth_dismissed', '1')
    }
  })

  // Intercept the extract API
  await page.route('/api/extract', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: makeMockSSE(),
    })
  })
})

test('shows the dream log heading', async ({ page }) => {
  await page.goto('/log')
  await expect(page.getByRole('heading', { name: 'Morning Ritual' })).toBeVisible()
})

test('submit button is disabled when textarea is empty', async ({ page }) => {
  await page.goto('/log')
  const btn = page.getByRole('button', { name: /capture \+ interpret/i })
  await expect(btn).toBeDisabled()
})

test('submit button enables after typing in textarea', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder(/capture the dream/i).fill('I was swimming in a warm ocean.')
  const btn = page.getByRole('button', { name: /capture \+ interpret/i })
  await expect(btn).toBeEnabled()
})

test('submitting a dream shows extraction sections', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder(/capture the dream/i).fill('I was swimming in a warm ocean.')
  await page.getByRole('button', { name: /capture \+ interpret/i }).click()

  await expect(page.getByText('Dream Analysis')).toBeVisible()
  await expect(page.getByText('Interpretation')).toBeVisible()
  await expect(page.getByText('Symbols')).toBeVisible()
})

test('extraction saves to localStorage', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder(/capture the dream/i).fill('I was swimming in a warm ocean.')
  await page.getByRole('button', { name: /capture \+ interpret/i }).click()

  await expect(page.getByText('Dream Analysis')).toBeVisible()

  const dreams = await page.evaluate(() => JSON.parse(localStorage.getItem('dreamscape_dreams') || '[]'))
  expect(dreams).toHaveLength(1)
  expect(dreams[0].transcript).toBe('I was swimming in a warm ocean.')
  expect(dreams[0].extraction).toBeDefined()
})

test('"New Dream" button resets to blank form', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder(/capture the dream/i).fill('Ocean dream.')
  await page.getByRole('button', { name: /capture \+ interpret/i }).click()
  await expect(page.getByText('Dream Analysis')).toBeVisible()

  await page.getByRole('button', { name: 'New Dream' }).click()
  await expect(page.getByPlaceholder(/capture the dream/i)).toBeVisible()
  await expect(page.getByText('Dream Analysis')).not.toBeVisible()
})

test('recent dreams list appears after logging a dream', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder(/capture the dream/i).fill('First dream entry.')
  await page.getByRole('button', { name: /capture \+ interpret/i }).click()
  await expect(page.getByText('Dream Analysis')).toBeVisible()

  await page.getByRole('button', { name: 'New Dream' }).click()
  await expect(page.getByText('Recent')).toBeVisible()
})

test('emotion and recommendation sections appear in extraction', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder(/capture the dream/i).fill('I was flying over mountains.')
  await page.getByRole('button', { name: /capture \+ interpret/i }).click()

  // Wait for staggered reveal to complete
  await expect(page.getByText('Emotional Signature')).toBeVisible({ timeout: 5000 })
  await expect(page.getByText('Waking Actions')).toBeVisible({ timeout: 5000 })
})
