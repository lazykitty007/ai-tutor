import { defineConfig, devices } from "@playwright/test";

const chromePath = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [["html", { outputFolder: "playwright-report", open: "never" }], ["list"]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    navigationTimeout: 45_000,
    launchOptions: {
      executablePath: chromePath,
    },
  },
  projects: [
    {
      name: "ipad-landscape",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 1024 },
      },
    },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
    url: "http://127.0.0.1:3000/learn",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
