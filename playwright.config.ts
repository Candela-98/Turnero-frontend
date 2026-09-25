import { defineConfig, devices } from "@playwright/test";

process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ??= "test-google-client-id";

const playwrightPort = process.env.PLAYWRIGHT_PORT ?? "3100";
const playwrightBaseUrl = `http://127.0.0.1:${playwrightPort}`;

export default defineConfig({
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: playwrightBaseUrl,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run dev -- --port ${playwrightPort}`,
    env: { NEXT_DIST_DIR: ".next-e2e" },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: playwrightBaseUrl,
  },
  projects: [
    {
      name: "desktop",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { height: 900, width: 1440 },
      },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 5"],
        viewport: { height: 844, width: 390 },
      },
    },
    {
      name: "mobile-large",
      use: {
        ...devices["Pixel 5"],
        viewport: { height: 915, width: 412 },
      },
    },
  ],
});
