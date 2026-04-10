import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('_ui_guardrails')) {
      sessionStorage.setItem('_ui_guardrails', '1')
      localStorage.clear()
      localStorage.setItem('dreamscape_birth_dismissed', '1')
    }
  })
})

test('provider settings show top models and allow a custom OpenRouter id', async ({ page }) => {
  await page.route('**/api/openrouter/models', async (route) => {
    await route.fulfill({
      json: {
        models: [
          'google/gemma-4-31b-it:free',
          'anthropic/claude-opus-4.1',
          'anthropic/claude-sonnet-4',
          'google/gemini-2.5-pro',
          'google/gemini-2.5-flash',
          'openai/gpt-4.1',
          'openai/gpt-4.1-mini',
          'openai/o4-mini',
          'openai/gpt-oss-120b:free',
          'deepseek/deepseek-chat-v3.1',
        ],
      },
    })
  })

  await page.goto('/log')
  await page.getByRole('button', { name: 'Model provider settings' }).click()

  await expect(page.getByRole('button', { name: 'OpenAI' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Anthropic' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Groq' })).toBeVisible()

  const select = page.getByRole('combobox', { name: 'OpenRouter model' })
  await expect(select).toHaveValue('google/gemma-4-31b-it:free')
  await expect(select.locator('option')).toHaveCount(11)

  await select.selectOption('__custom__')
  const customInput = page.getByRole('textbox', { name: 'Custom OpenRouter model' })
  await customInput.fill('deepseek/deepseek-chat-v3.1')
  await expect(customInput).toHaveValue('deepseek/deepseek-chat-v3.1')

  await page.getByRole('button', { name: 'OpenAI' }).click()
  const provider = await page.evaluate(() => localStorage.getItem('dreamscape_provider'))
  expect(provider).toBe('openai')

  await page.getByRole('button', { name: 'OpenRouter' }).click()
  const stored = await page.evaluate(() => localStorage.getItem('dreamscape_or_model'))
  expect(stored).toBe('deepseek/deepseek-chat-v3.1')
})

test('account page model defaults include provider choice and OpenRouter top models', async ({ page }) => {
  await page.route('**/api/openrouter/models', async (route) => {
    await route.fulfill({ json: { models: ['google/gemma-4-31b-it:free', 'openai/gpt-oss-20b:free'] } })
  })

  await page.goto('/account')
  await expect(page.getByText('Choose the default provider Dreamscape should prefer.')).toBeVisible()
  await expect(page.getByLabel('Default provider')).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'OpenRouter model' })).toBeVisible()

  await page.getByLabel('Default provider').selectOption('groq')
  await expect(page.getByText('Default model for Groq:')).toBeVisible()
})

test('shared dream detail preserves long multi-paragraph text without horizontal overflow', async ({ page }) => {
  await page.route('**/api/similar/test-long?limit=5', async (route) => {
    await route.fulfill({
      json: {
        dreams: [
          {
            id: 'test-long',
            share_handle: 'oracle',
            created_at: new Date().toISOString(),
            symbols: ['moon', 'river'],
            reactions: [],
            my_reactions: [],
            interpretation_count: 0,
            dream_data: {
              transcript: [
                'First paragraph opens beneath a bright moon and keeps unfolding across several sentences so the card needs real room.',
                'Second paragraph begins here with more texture, more symbols, and enough words to expose any clipping or hidden overflow issues in the reader.',
                'Third paragraph lands softly with a long reflective close about rivers, windows, and remembering what the body felt before waking.',
              ].join('\n\n'),
              extraction: {
                interpretation: 'A spacious dream wants a spacious reading.',
                symbols: [{ name: 'moon', salience: 0.8, category: 'symbol', meaning: 'intuition' }],
                emotions: [{ name: 'awe', intensity: 0.9, valence: 1 }],
              },
            },
          },
        ],
      },
    })
  })

  await page.goto('/dream/test-long')
  await expect(page.getByText('Second paragraph begins here')).toBeVisible()

  const transcript = page.locator('div.whitespace-pre-wrap').first()
  await expect(transcript).toBeVisible()
  const whiteSpace = await transcript.evaluate((el) => getComputedStyle(el).whiteSpace)
  expect(whiteSpace).toBe('pre-wrap')

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})

test('bottom nav icon containers are rectangular', async ({ page }) => {
  await page.goto('/log')
  const clipPath = await page.locator('nav a[href="/"] > div').evaluate((el) => getComputedStyle(el).clipPath)
  expect(clipPath).toBe('none')
})
