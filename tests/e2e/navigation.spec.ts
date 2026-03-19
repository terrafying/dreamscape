import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // addInitScript runs before page JS on next goto — avoids about:blank SecurityError
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('_init')) {
      sessionStorage.setItem('_init', '1')
      localStorage.clear()
      localStorage.setItem('dreamscape_birth_dismissed', '1')
    }
  })
})

test('loads ritual hub at /', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL('/')
  await expect(page.getByRole('heading', { name: 'The last 10 and first 10 minutes of your day.' })).toBeVisible()
})

test('all nav tabs are present', async ({ page }) => {
  await page.goto('/log')
  const nav = page.locator('nav')
  await expect(nav.getByText('Altar')).toBeVisible()
  await expect(nav.getByText('Dawn')).toBeVisible()
  await expect(nav.getByText('Journal')).toBeVisible()
  await expect(nav.getByText('Strata')).toBeVisible()
  await expect(nav.getByText('Letters')).toBeVisible()
  await expect(nav.getByText('Sleep')).toBeVisible()
})

test('navigates to /strata via nav', async ({ page }) => {
  await page.goto('/log')
  await page.locator('nav').getByText('Strata').click()
  await expect(page).toHaveURL('/strata')
  await expect(page.getByRole('heading', { name: 'Strata' })).toBeVisible()
})

test('navigates to /letters via nav', async ({ page }) => {
  await page.goto('/log')
  await page.locator('nav').getByText('Letters').click()
  await expect(page).toHaveURL('/letters')
})

test('navigates to /dreamscape via nav', async ({ page }) => {
  await page.goto('/log')
  await page.locator('nav').getByText('Sleep').click()
  await expect(page).toHaveURL('/dreamscape')
  await expect(page.getByRole('heading', { name: 'Sleep' })).toBeVisible()
})

test('active tab is visually distinct', async ({ page }) => {
  await page.goto('/strata')
  const strataLink = page.locator('nav a[href="/strata"]')
  // Active tab uses violet color (var(--violet) = #a78bfa)
  const color = await strataLink.evaluate((el) => getComputedStyle(el).color)
  // Should not be the muted grey (#475569 = rgb(71, 85, 105))
  expect(color).not.toBe('rgb(71, 85, 105)')
})
