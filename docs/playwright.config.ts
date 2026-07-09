import { defineConfig, devices } from '@playwright/test';

/**
 * Scoped Playwright config for the docs site (kept separate from the root
 * `playwright.config.ts`, which drives the tanstack-start example on :3001).
 * Isolating it means running the docs e2e never has to build/serve the example.
 *
 * Serves the PRODUCTION build (`vocs build` → `vocs preview`), not `vocs dev`:
 * the dev server's SSR pass currently throws on the home page's OverviewMasonry
 * (a dev-only React-null-during-SSR issue), which would fail Playwright's `/`
 * readiness poll. `vocs build` statically generates every page (including the
 * demo) cleanly, and `build` also runs `panda codegen` so freshly-authored
 * Panda atomic classes (focus rings, overflow guards, …) are present at runtime.
 *
 * Run:  pnpm exec playwright test -c docs/playwright.config.ts
 * (Against an already-built dist, drop the `build &&` prefix from the command.)
 */

const PORT = 4300;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm --filter docs run build && pnpm --filter docs exec vocs preview --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 180_000,
  },
});
