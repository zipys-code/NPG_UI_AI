import { defineConfig } from "@playwright/test";

// Smoke tests run against the real TIBCO listener (proxied via vite: /api -> localhost:8085).
// Test-user credentials come from .env.test (git-ignored), see e2e/smoke.spec.ts.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:8081",
    channel: "msedge", // use the installed Edge; switch/remove to use Playwright's own browsers
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8081",
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
