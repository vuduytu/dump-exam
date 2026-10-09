import { defineConfig } from "@playwright/test";

// Run via `npm run e2e` (loads .env.test). Uses the _test database, so never run it together with `npm test`.
export default defineConfig({
  testDir: "e2e",
  globalSetup: "./e2e/global-setup.ts",
  workers: 1,
  use: { baseURL: "http://localhost:3123" },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: { command: "next dev -p 3123", url: "http://localhost:3123/login", reuseExistingServer: false, timeout: 120_000 },
});
