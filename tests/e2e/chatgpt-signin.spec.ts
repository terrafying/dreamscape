import { test, expect } from '@playwright/test'

const MOCK_SESSION = {
  accessToken: 'at-e2e',
  accountId: 'acct-e2e-1',
  refreshToken: 'rt-e2e',
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem('_chatgpt_signin')) {
      sessionStorage.setItem('_chatgpt_signin', '1')
      localStorage.clear()
      localStorage.setItem('dreamscape_birth_dismissed', '1')
    }
    // Never actually leave the page for the OAuth authorize URL
    window.open = () => null
  })

  await page.route('**/api/auth/openai/start', (route) =>
    route.fulfill({
      json: {
        authorizationUrl: 'https://auth.openai.com/oauth/authorize?fake=1',
        state: 'state-e2e',
        codeVerifier: 'verifier-e2e',
      },
    }),
  )
  await page.route('**/api/auth/openai/exchange', (route) => route.fulfill({ json: { session: MOCK_SESSION } }))
  await page.route('**/api/openai/oauth-models', (route) =>
    route.fulfill({ json: { models: [{ slug: 'gpt-5.4-mini' }, { slug: 'gpt-5.6-terra' }] } }),
  )
})

test('per-user ChatGPT sign-in flow: start → paste → connected → pick model → disconnect', async ({ page }) => {
  await page.goto('/account')
  await page.getByRole('button', { name: 'Edit' }).click()
  await page.getByRole('button', { name: 'Sign in with ChatGPT' }).click()

  // Pending state: paste field appears
  const paste = page.getByRole('textbox', { name: 'Paste the sign-in redirect URL' })
  await expect(paste).toBeVisible()
  await paste.fill('http://localhost:1455/auth/callback?code=fakecode12345&state=state-e2e')
  await page.getByRole('button', { name: 'Complete sign-in' }).click()

  // Connected state with account + model picker
  await expect(page.getByText('Signed in with ChatGPT')).toBeVisible()
  await expect(page.getByText('acct-e2e-1')).toBeVisible()
  const modelSelect = page.getByRole('combobox', { name: 'ChatGPT model' })
  await expect(modelSelect).toBeVisible()
  await modelSelect.selectOption('gpt-5.6-terra')

  // Session + model persisted
  const storedSession = await page.evaluate(() => JSON.parse(localStorage.getItem('dreamscape_openai_oauth') || 'null'))
  expect(storedSession?.accountId).toBe('acct-e2e-1')
  await expect(page.evaluate(() => localStorage.getItem('dreamscape_openai_oauth_model'))).resolves.toBe('gpt-5.6-terra')

  // Disconnect returns to the idle state
  await page.getByRole('button', { name: 'Disconnect' }).click()
  await expect(page.getByRole('button', { name: 'Sign in with ChatGPT' })).toBeVisible()
  await expect(page.evaluate(() => localStorage.getItem('dreamscape_openai_oauth'))).resolves.toBeNull()
})
