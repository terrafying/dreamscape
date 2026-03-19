import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    // Clear localStorage before each test
    storageState: undefined,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: ['**/mobile.spec.ts'],
    },
    {
      name: 'desktop-screenshots',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
      testMatch: ['**/screenshots.spec.ts'],
    },
    {
      name: 'mobile-screenshots',
      use: { ...devices['Pixel 7'] },
      testMatch: ['**/screenshots.spec.ts'],
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
      testMatch: ['**/mobile.spec.ts'],
    },

    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
      testMatch: ['**/mobile.spec.ts'],
    },
    {
      name: 'tablet',
      use: { ...devices['iPad (gen 7)'] },
      testMatch: ['**/mobile.spec.ts'],
    },
    {
      name: 'video-iphone',
      use: {
        ...devices['iPhone 14 Pro'],
        video: { mode: 'on', size: { width: 393, height: 852 } },
        launchOptions: { slowMo: 120 },
      },
      testMatch: ['**/demo-videos.spec.ts'],
    },
  ],
  webServer: {
    command: 'npm run dev -- --port 3001',
    url: 'http://localhost:3001',
    reuseExistingServer: true,
    timeout: 30000,
  },
})
