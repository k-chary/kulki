import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// End-to-end tests run against the web build with in-memory storage and the
// ?seed= / ?board= test hook, which only the e2e build contains (.env.e2e).
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    // Test by role and Polish label; the window is the desktop default.
    viewport: { width: 1280, height: 800 },
    locale: 'pl-PL',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
        // Lets a machine with a different pre-installed Chromium run the tests.
        launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH },
      },
    },
  ],
  webServer: {
    command: `npm run build:e2e && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
