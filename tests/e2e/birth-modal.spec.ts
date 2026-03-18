import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Only clear on first load per test (sessionStorage is fresh per page)
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('_init')) {
      sessionStorage.setItem('_init', '1')
      localStorage.clear()
    }
  })
})

// Use 'Save Chart' button as proxy for modal visibility — unique to the modal,
// avoids the case-insensitive getByText match against the "Add birth chart" prompt button

test('birth modal appears on first visit', async ({ page }) => {
  await page.goto('/log')
  await expect(page.getByRole('button', { name: 'Save Chart' })).toBeVisible()
})

test('modal does not appear after dismissal', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('dreamscape_birth_dismissed', '1'))
  await page.goto('/log')
  await expect(page.getByRole('button', { name: 'Save Chart' })).not.toBeVisible()
})

test('Skip button dismisses modal without saving', async ({ page }) => {
  await page.goto('/log')
  await page.getByRole('button', { name: 'Skip' }).click()
  await expect(page.getByRole('button', { name: 'Save Chart' })).not.toBeVisible()

  const bd = await page.evaluate(() => localStorage.getItem('dreamscape_birth'))
  expect(bd).toBeNull()
})

test('accepts MM/DD/YYYY date format', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder('MM/DD/YYYY').fill('04/15/1990')
  await page.getByPlaceholder('4:30 AM').fill('7:00 AM')
  await page.getByPlaceholder('e.g. New York, NY').fill('Portland, OR')
  await page.getByRole('button', { name: 'Save Chart' }).click()

  await expect(page.getByText('Birth Chart')).not.toBeVisible()

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dreamscape_birth') || 'null'))
  expect(saved.date).toBe('1990-04-15')
  expect(saved.time).toBe('07:00')
  expect(saved.location).toBe('Portland, OR')
})

test('accepts YYYY-MM-DD date format', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder('MM/DD/YYYY').fill('1990-04-15')
  await page.getByPlaceholder('e.g. New York, NY').fill('Tokyo')
  await page.getByRole('button', { name: 'Save Chart' }).click()

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dreamscape_birth') || 'null'))
  expect(saved.date).toBe('1990-04-15')
})

test('accepts 12-hour time with AM', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder('MM/DD/YYYY').fill('04/15/1990')
  await page.getByPlaceholder('4:30 AM').fill('4:30 AM')
  await page.getByPlaceholder('e.g. New York, NY').fill('Austin, TX')
  await page.getByRole('button', { name: 'Save Chart' }).click()

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dreamscape_birth') || 'null'))
  expect(saved.time).toBe('04:30')
})

test('accepts 12-hour time with PM', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder('MM/DD/YYYY').fill('04/15/1990')
  await page.getByPlaceholder('4:30 AM').fill('10:45 PM')
  await page.getByPlaceholder('e.g. New York, NY').fill('London')
  await page.getByRole('button', { name: 'Save Chart' }).click()

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dreamscape_birth') || 'null'))
  expect(saved.time).toBe('22:45')
})

test('shows error for invalid date', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder('MM/DD/YYYY').fill('not-a-date')
  await page.getByPlaceholder('e.g. New York, NY').fill('Paris')
  await page.getByRole('button', { name: 'Save Chart' }).click()

  await expect(page.getByText('Use MM/DD/YYYY or YYYY-MM-DD')).toBeVisible()
  // Modal stays open
  await expect(page.getByText('Birth Chart')).toBeVisible()
})

test('shows error for invalid time', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder('MM/DD/YYYY').fill('04/15/1990')
  await page.getByPlaceholder('4:30 AM').fill('banana')
  await page.getByPlaceholder('e.g. New York, NY').fill('Paris')
  await page.getByRole('button', { name: 'Save Chart' }).click()

  await expect(page.getByText('Use H:MM AM/PM or HH:MM')).toBeVisible()
})

test('time field is optional — saves without it', async ({ page }) => {
  await page.goto('/log')
  await page.getByPlaceholder('MM/DD/YYYY').fill('1985-11-20')
  await page.getByPlaceholder('e.g. New York, NY').fill('Chicago, IL')
  // Leave time blank
  await page.getByRole('button', { name: 'Save Chart' }).click()

  await expect(page.getByText('Birth Chart')).not.toBeVisible()
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('dreamscape_birth') || 'null'))
  expect(saved.time).toBeUndefined()
})
