import { test, expect } from '@playwright/test'

// Outer beforeEach: clear storage and dismiss birth modal for most tests
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('_init')) {
      sessionStorage.setItem('_init', '1')
      localStorage.clear()
      localStorage.setItem('dreamscape_birth_dismissed', '1')
    }
  })
})

// ─── Layout: no horizontal overflow ──────────────────────────────────────────

const ROUTES = ['/log', '/strata', '/letters', '/dreamscape'] as const

for (const route of ROUTES) {
  test(`no horizontal overflow on ${route}`, async ({ page }) => {
    await page.goto(route)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    // Allow 1px for sub-pixel rounding
    expect(overflow).toBeLessThanOrEqual(1)
  })
}

// ─── Navigation ───────────────────────────────────────────────────────────────

test('bottom nav is visible', async ({ page }) => {
  await page.goto('/log')
  await expect(page.locator('nav')).toBeVisible()
})

test('all nav tabs are present', async ({ page }) => {
  await page.goto('/log')
  const nav = page.locator('nav')
  for (const label of ['Log', 'Strata', 'Letters', 'Stories']) {
    await expect(nav.getByText(label)).toBeVisible()
  }
})

test('nav tab tap targets are at least 44px tall', async ({ page }) => {
  await page.goto('/log')
  const tabs = page.locator('nav a')
  const count = await tabs.count()
  for (let i = 0; i < count; i++) {
    const box = await tabs.nth(i).boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  }
})

test('tap navigation visits all sections', async ({ page }) => {
  await page.goto('/log')

  await page.locator('nav').getByText('Strata').click()
  await expect(page).toHaveURL('/strata')

  await page.locator('nav').getByText('Letters').click()
  await expect(page).toHaveURL('/letters')

  await page.locator('nav').getByText('Stories').click()
  await expect(page).toHaveURL('/dreamscape')

  await page.locator('nav').getByText('Log').click()
  await expect(page).toHaveURL('/log')
})

// ─── Dream log ────────────────────────────────────────────────────────────────

test('dream log page loads correctly', async ({ page }) => {
  await page.goto('/log')
  await expect(page.getByRole('heading', { name: 'Dream Log' })).toBeVisible()
})

test('textarea is focusable and accepts input', async ({ page }) => {
  await page.goto('/log')
  const textarea = page.getByPlaceholder(/describe your dream/i)
  await textarea.click()
  await textarea.fill('Floating above soft white clouds, weightless and warm.')
  await expect(textarea).toHaveValue('Floating above soft white clouds, weightless and warm.')
})

test('analyze button tap target is at least 44px tall', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder(/describe your dream/i).fill('Ocean dream')
  const btn = page.getByRole('button', { name: /analyze dream/i })
  await expect(btn).toBeEnabled()
  const box = await btn.boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44)
})

test('provider settings toggle is tappable', async ({ page }) => {
  await page.goto('/log')
  // ProviderSettings collapsed summary — just check it renders
  const summary = page.locator('details summary').first()
  if (await summary.isVisible()) {
    await summary.click()
    // Should expand without error
  }
})

// ─── Sleep / Breathwork page ──────────────────────────────────────────────────

test('sleep page loads with Sleep heading', async ({ page }) => {
  await page.goto('/dreamscape')
  await expect(page.getByRole('heading', { name: 'Sleep' })).toBeVisible()
})

test('breathwork and binaural tabs are visible', async ({ page }) => {
  await page.goto('/dreamscape')
  await expect(page.getByRole('button', { name: 'Breathwork' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Binaural' })).toBeVisible()
})

test('breathwork canvas is visible and fits viewport', async ({ page }) => {
  await page.goto('/dreamscape')
  const canvas = page.locator('canvas').first()
  await expect(canvas).toBeVisible()
  const box = await canvas.boundingBox()
  const vp = page.viewportSize()!
  expect(box!.width).toBeGreaterThan(0)
  expect(box!.height).toBeGreaterThan(0)
  // Canvas must not overflow viewport
  expect(box!.x + box!.width).toBeLessThanOrEqual(vp.width + 1)
})

test('breathwork pattern grid shows all 8 patterns', async ({ page }) => {
  await page.goto('/dreamscape')
  for (const name of [
    'Physiological Sigh', 'Box Breathing', '4-7-8',
    'Coherent', 'Wim Hof', 'Holotropic', 'Tummo', 'Kapalabhati',
  ]) {
    await expect(page.getByText(name)).toBeVisible()
  }
})

test('begin breathwork button tap target is at least 44px', async ({ page }) => {
  await page.goto('/dreamscape')
  const btn = page.getByRole('button', { name: /begin/i })
  const box = await btn.boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44)
})

test('can switch to binaural tab and see frequency presets', async ({ page }) => {
  await page.goto('/dreamscape')
  await page.getByRole('button', { name: 'Binaural' }).click()
  await expect(page.getByText('Deep Sleep')).toBeVisible()
  await expect(page.getByText('Dream Gate')).toBeVisible()
  await expect(page.getByText('Frequency Preset')).toBeVisible()
})

test('binaural start button tap target is at least 44px', async ({ page }) => {
  await page.goto('/dreamscape')
  await page.getByRole('button', { name: 'Binaural' }).click()
  const btn = page.getByRole('button', { name: /start/i })
  const box = await btn.boundingBox()
  expect(box!.height).toBeGreaterThanOrEqual(44)
})

// ─── Birth modal ──────────────────────────────────────────────────────────────

test.describe('birth modal', () => {
  // Inner beforeEach: clear LS WITHOUT setting dismissed — modal will show.
  // Uses a different sessionStorage key so it runs after (and overwrites) the outer beforeEach.
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('_init_modal')) {
        sessionStorage.setItem('_init_modal', '1')
        localStorage.clear() // clears dismissed flag set by outer beforeEach
      }
    })
  })

  test('modal appears and save button has adequate tap target', async ({ page }) => {
    await page.goto('/log')
    const saveBtn = page.getByRole('button', { name: 'Save Chart' })
    await expect(saveBtn).toBeVisible()
    const box = await saveBtn.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })

  test('skip button has adequate tap target', async ({ page }) => {
    await page.goto('/log')
    const skipBtn = page.getByRole('button', { name: 'Skip' })
    await expect(skipBtn).toBeVisible()
    const box = await skipBtn.boundingBox()
    expect(box!.height).toBeGreaterThanOrEqual(44)
  })

  test('form fields are fillable on mobile', async ({ page }) => {
    await page.goto('/log')
    await page.getByPlaceholder('MM/DD/YYYY').click()
    await page.getByPlaceholder('MM/DD/YYYY').fill('06/21/1992')
    await page.getByPlaceholder('e.g. New York, NY').click()
    await page.getByPlaceholder('e.g. New York, NY').fill('London, UK')
    await page.getByRole('button', { name: 'Save Chart' }).click()
    // Modal should dismiss after save
    await expect(page.getByRole('button', { name: 'Save Chart' })).not.toBeVisible()
  })

  test('modal does not overflow viewport width', async ({ page }) => {
    await page.goto('/log')
    await expect(page.getByRole('button', { name: 'Save Chart' })).toBeVisible()
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
    expect(overflow).toBeLessThanOrEqual(1)
  })
})
