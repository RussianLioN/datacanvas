import os from "node:os";
import path from "node:path";
import { defineConfig } from "@playwright/test";

const runtimeRoot = process.env.RUNNER_TEMP || os.tmpdir();

export default defineConfig({
  testDir: ".",
  testMatch: "presentation-link-lisa-seven-screen-prototype.browser.spec.mjs",
  outputDir: path.join(runtimeRoot, "datacanvas-lisa-playwright-output"),
  reporter: [["line"], ["json", { outputFile: path.join(runtimeRoot, "datacanvas-lisa-playwright-report.json") }]],
  forbidOnly: true,
  failOnFlakyTests: true,
  retries: 0,
  // Временная модель пути опирается на управляемые часы. Один исполнитель
  // исключает гонку между независимыми экземплярами статической демонстрации.
  workers: 1,
  fullyParallel: false,
  updateSnapshots: "none",
  use: {
    locale: "ru-RU",
    timezoneId: "UTC",
    colorScheme: "light",
    // Проверка режима уменьшенного движения задаёт это значение явно;
    // базовый прогон должен отражать обычную анимацию пользователя.
    reducedMotion: "no-preference",
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
