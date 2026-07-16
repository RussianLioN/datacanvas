import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const runtimeRoot = process.env.RUNNER_TEMP || os.tmpdir();

export default defineConfig({
  testDir: ".",
  testMatch: "presentation-link-lisa-user-journey.browser.spec.mjs",
  outputDir: path.join(runtimeRoot, "datacanvas-lisa-playwright-output"),
  reporter: [["line"], ["json", { outputFile: path.join(runtimeRoot, "datacanvas-lisa-playwright-report.json") }]],
  forbidOnly: true,
  failOnFlakyTests: true,
  retries: 0,
  workers: 2,
  fullyParallel: true,
  updateSnapshots: "none",
  use: {
    locale: "ru-RU",
    timezoneId: "UTC",
    colorScheme: "light",
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
    serviceWorkers: "block",
    acceptDownloads: false,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "webkit",
      use: {
        browserName: "webkit",
        viewport: { width: 390, height: 844 },
      },
    },
  ],
});
