// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir:   './',
  testMatch: 'phase*.test.js',
  timeout:   30_000,
  retries:   0,
  workers:   1,        // run tests sequentially (shared server)
  reporter:  [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],

  use: {
    baseURL:            'http://localhost:3000',
    headless:           false,   // MUST be headed — screenshots must show the browser chrome
    viewport:           { width: 1280, height: 800 },
    screenshot:         'on',
    trace:              'retain-on-failure',
    // Inject dev mode flag before page load
    launchOptions: {
      args: ['--disable-web-security'],  // needed for local file fetch in some envs
    },
  },

  // Start local server automatically
  webServer: {
    command: 'npx serve . -p 3000 --no-clipboard',
    port:    3000,
    reuseExistingServer: true,
    timeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use:  { ...devices['Desktop Chrome'] },
    },
  ],

  // Where to save screenshots
  snapshotDir: './snapshots',
  snapshotPathTemplate: 'snapshots/{testFilePath}/{arg}{ext}',
});
