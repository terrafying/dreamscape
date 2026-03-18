import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('_init')) {
      sessionStorage.setItem('_init', '1')
      localStorage.clear()
      localStorage.setItem('dreamscape_birth_dismissed', '1')
    }
  })
})

test('shows zero dreams count on fresh visit', async ({ page }) => {
  await page.goto('/strata')
  await expect(page.getByText('0 analyzed dreams')).toBeVisible()
})

test('"Load demo dreams" button is visible when no dreams', async ({ page }) => {
  await page.goto('/strata')
  await expect(page.getByRole('button', { name: /load demo dreams/i })).toBeVisible()
})

test('loading demo dreams populates the count', async ({ page }) => {
  await page.goto('/strata')
  await page.getByRole('button', { name: /load demo dreams/i }).click()
  await expect(page.getByText('7 analyzed dreams')).toBeVisible()
})

test('"Load demo dreams" disappears after loading', async ({ page }) => {
  await page.goto('/strata')
  await page.getByRole('button', { name: /load demo dreams/i }).click()
  await expect(page.getByRole('button', { name: /load demo dreams/i })).not.toBeVisible()
})

test('charts are present after loading demo data', async ({ page }) => {
  await page.goto('/strata')
  await page.getByRole('button', { name: /load demo dreams/i }).click()

  await expect(page.getByText('Lunar Calendar')).toBeVisible()
  await expect(page.getByText('Emotion Timeline')).toBeVisible()
  await expect(page.getByText('Theme Radar')).toBeVisible()
  await expect(page.getByText('Lucidity Trend')).toBeVisible()
  await expect(page.getByText('Top Symbols')).toBeVisible()
})

test('astro panel shows moon phase info', async ({ page }) => {
  await page.goto('/strata')
  await expect(page.getByText('Moon')).toBeVisible()
  await expect(page.getByText('Celestial Context')).toBeVisible()
})

test('birth chart prompt appears when no natal data', async ({ page }) => {
  await page.goto('/strata')
  await expect(page.getByText(/add birth chart/i)).toBeVisible()
})

test('birth chart prompt disappears after saving natal data', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('dreamscape_birth', JSON.stringify({
      date: '1990-04-15',
      location: 'New York, NY',
    }))
  })
  await page.goto('/strata')
  await expect(page.getByText(/add birth chart/i)).not.toBeVisible()
})

test('demo dreams persist on page reload', async ({ page }) => {
  await page.goto('/strata')
  await page.getByRole('button', { name: /load demo dreams/i }).click()
  await page.reload()
  await expect(page.getByText('7 analyzed dreams')).toBeVisible()
})
