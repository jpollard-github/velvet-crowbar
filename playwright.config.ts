import { defineConfig, devices } from "@playwright/test";

const testPort = 3100;

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${testPort}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `pnpm next dev --hostname 127.0.0.1 --port ${testPort}`,
    url: `http://127.0.0.1:${testPort}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      DATABASE_URL:
        process.env.DATABASE_URL ??
        "postgresql://velvet_crowbar:velvet_crowbar@localhost:54329/velvet_crowbar",
      BETTER_AUTH_SECRET:
        process.env.BETTER_AUTH_SECRET ??
        "e2e-only-secret-with-at-least-thirty-two-characters",
      BETTER_AUTH_URL: `http://127.0.0.1:${testPort}`,
      ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "editor@example.test",
      NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${testPort}`,
      VERCEL_ENV: "development",
    },
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
