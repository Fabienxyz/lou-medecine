/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default {
  testDir: "./test/smoke",
  testMatch: "**/*.spec.mjs",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["json", { outputFile: "test/smoke/results.json" }]],
  use: {
    baseURL: "http://127.0.0.1:8765",
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: "python3 -m http.server 8765",
    cwd: "../..",
    url: "http://127.0.0.1:8765/demo/renderer/index.html",
    reuseExistingServer: true,
    timeout: 15_000,
  },
};
