import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "browser-native-phone-prototype.browser.spec.mjs",
  outputDir: path.join(process.env.RUNNER_TEMP || os.tmpdir(), "datacanvas-browser-native-phone-output"),
  reporter: "line",
  forbidOnly: true,
  failOnFlakyTests: true,
  retries: 0,
  workers: 1,
  use: {
    locale: "ru-RU",
    colorScheme: "light",
    deviceScaleFactor: 1,
    serviceWorkers: "block",
    acceptDownloads: false,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium", viewport: { width: 1440, height: 900 } } },
    { name: "webkit", use: { browserName: "webkit", viewport: { width: 1440, height: 900 } } },
  ],
});
