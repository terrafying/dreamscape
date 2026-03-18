/**
 * Marketing screenshot capture — run with:
 *   npx playwright test tests/e2e/screenshots.spec.ts --project=desktop
 *   npx playwright test tests/e2e/screenshots.spec.ts --project=mobile-chrome
 *
 * Outputs to tests/screenshots/{device}/{name}.png
 */
import { test } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const SCREENSHOT_DIR = path.join(__dirname, '../screenshots')

test.beforeEach(async ({ page }, testInfo) => {
  // Clear any birth modal
  await page.addInitScript(() => {
    localStorage.setItem('dreamscape_birth_dismissed', '1')
    localStorage.setItem('dreamscape_birth', JSON.stringify({
      date: '1990-06-21', location: 'San Francisco, CA',
    }))
  })

  // Seed demo dreams so charts and letters look populated
  await page.addInitScript(() => {
    // Minimal seed — real seed happens via store.ts but we just need data to render
  })

  const device = testInfo.project.name
  const dir = path.join(SCREENSHOT_DIR, device)
  fs.mkdirSync(dir, { recursive: true })
})

async function shot(page: import('@playwright/test').Page, name: string, testInfo: import('@playwright/test').TestInfo) {
  const device = testInfo.project.name
  const outPath = path.join(SCREENSHOT_DIR, device, `${name}.png`)
  await page.screenshot({ path: outPath, fullPage: false })
  console.log(`  → ${outPath}`)
}

// ─── Dream Log ────────────────────────────────────────────────────────────────

test('01-dream-log-empty', async ({ page }, testInfo) => {
  await page.goto('/log')
  await page.waitForLoadState('networkidle')
  await shot(page, '01-dream-log-empty', testInfo)
})

test('02-dream-log-filled', async ({ page }, testInfo) => {
  await page.goto('/log')
  await page.waitForLoadState('networkidle')
  await page.getByPlaceholder(/describe your dream/i).fill(
    'I was floating above a vast ocean at night. The stars reflected perfectly in the still water, and I couldn\'t tell which was up or down. A whale surfaced silently beneath me — enormous, luminescent — and seemed to look directly into my eyes.'
  )
  await shot(page, '02-dream-log-filled', testInfo)
})

// ─── Strata charts ────────────────────────────────────────────────────────────

test('03-strata-load-demo', async ({ page }, testInfo) => {
  await page.goto('/strata')
  await page.waitForLoadState('networkidle')
  // Seed demo data if button present
  const btn = page.getByRole('button', { name: /load demo/i })
  if (await btn.isVisible()) await btn.click()
  await page.waitForTimeout(800) // let charts render
  await shot(page, '03-strata-overview', testInfo)
})

test('04-strata-emotion-chart', async ({ page }, testInfo) => {
  await page.goto('/strata')
  await page.waitForLoadState('networkidle')
  const btn = page.getByRole('button', { name: /load demo/i })
  if (await btn.isVisible()) await btn.click()
  await page.waitForTimeout(600)
  // Scroll to the emotion timeline if needed
  const chart = page.locator('.recharts-wrapper').first()
  if (await chart.isVisible()) await chart.scrollIntoViewIfNeeded()
  await shot(page, '04-strata-charts', testInfo)
})

// ─── Letters ──────────────────────────────────────────────────────────────────

test('05-letters-page', async ({ page }, testInfo) => {
  await page.goto('/letters')
  await page.waitForLoadState('networkidle')
  await shot(page, '05-letters', testInfo)
})

// ─── Sleep / Breathwork ───────────────────────────────────────────────────────

test('06-sleep-breathwork', async ({ page }, testInfo) => {
  await page.goto('/dreamscape')
  await page.waitForLoadState('networkidle')
  await shot(page, '06-sleep-breathwork', testInfo)
})

test('07-sleep-breathwork-wim-hof', async ({ page }, testInfo) => {
  await page.goto('/dreamscape')
  await page.waitForLoadState('networkidle')
  // Select Wim Hof pattern
  await page.getByText('Wim Hof').click()
  await shot(page, '07-sleep-breathwork-wim-hof-selected', testInfo)
})

test('08-sleep-binaural', async ({ page }, testInfo) => {
  await page.goto('/dreamscape')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Binaural' }).click()
  await page.waitForTimeout(300)
  await shot(page, '08-sleep-binaural', testInfo)
})
