import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/components',
  use: {
    baseURL: 'http://127.0.0.1:4330/vb-design-system/',
  },
  webServer: {
    command: 'node tests/serve-docs.mjs',
    url: 'http://127.0.0.1:4330/vb-design-system/',
    reuseExistingServer: true,
    timeout: 30000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
