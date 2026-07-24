import { test, expect, type Page } from '@playwright/test'

// Known-benign console noise; anything else fails the test.
// The two /api/* entries are pre-existing app-shell calls made while logged
// out (billing status 400, notifications 401) — unrelated to the flows under
// test. TODO: app should skip these fetches when there is no session.
const IGNORE_PATTERNS = [
  /favicon/i,
  /React DevTools/i,
  /third-?party cookie/i,
  /\/api\/billing\/status/,
  /\/api\/notifications/,
]

function collectErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const url = msg.location()?.url
    const line = url ? `${msg.text()} [${url}]` : msg.text()
    if (IGNORE_PATTERNS.some((re) => re.test(line))) return
    errors.push(line)
  })
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`))
  return errors
}

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
    `event: extraction\ndata: ${JSON.stringify({ data: MOCK_EXTRACTION })}`,
    'event: done\ndata: {}',
  ]
  return lines.join('\n\n') + '\n\n'
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('_console_health')) {
      sessionStorage.setItem('_console_health', '1')
      localStorage.clear()
      localStorage.setItem('dreamscape_birth_dismissed', '1')
    }
  })
})

test('model/provider selection produces no console errors', async ({ page }) => {
  const errors = collectErrors(page)

  await page.route('**/api/openrouter/models', async (route) => {
    await route.fulfill({
      json: {
        models: [
          'openai/gpt-oss-20b:free',
          'nvidia/nemotron-3-super-120b-a12b:free',
          'google/gemma-4-31b-it:free',
        ],
      },
    })
  })

  await page.goto('/log')
  await page.getByRole('button', { name: 'Model provider settings' }).click()

  // Switch through every provider
  for (const name of ['OpenAI', 'Anthropic', 'Groq', 'OpenRouter']) {
    await page.getByRole('button', { name }).click()
  }

  // Change the OpenRouter model selection
  const select = page.getByRole('combobox', { name: 'OpenRouter model' })
  await select.selectOption('nvidia/nemotron-3-super-120b-a12b:free')
  await expect(
    page.evaluate(() => localStorage.getItem('dreamscape_or_model')),
  ).resolves.toBe('nvidia/nemotron-3-super-120b-a12b:free')

  expect(errors, `console errors during model selection:\n${errors.join('\n')}`).toEqual([])
})

test('dream capture + analyze produces no console errors', async ({ page }) => {
  const errors = collectErrors(page)
  let extractCalled = false

  await page.route('/api/extract', (route) => {
    extractCalled = true
    route.fulfill({
      status: 200,
      contentType: 'text/event-stream',
      body: makeMockSSE(),
    })
  })

  await page.goto('/log')
  await page.getByPlaceholder(/capture the dream/i).fill('I was swimming in a warm ocean, weightless and calm.')
  await page.getByRole('button', { name: /capture \+ interpret/i }).click()

  // Full analyze pipeline renders
  await expect(page.getByText('Dream Analysis')).toBeVisible()
  await expect(page.getByText('A dream about depth and peace.')).toBeVisible()
  expect(extractCalled, '/api/extract was never called').toBe(true)

  // Saved dream round-trips into localStorage
  const dreams = await page.evaluate(() => JSON.parse(localStorage.getItem('dreamscape_dreams') || '[]'))
  expect(dreams).toHaveLength(1)

  expect(errors, `console errors during dream capture/analyze:\n${errors.join('\n')}`).toEqual([])
})
