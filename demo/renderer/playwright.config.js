/** @type {import('@playwright/test').PlaywrightTestConfig} */
const PORT = Number(process.env.LOU_LIBRARY_SERVER_PORT || 8765);
const BASE = `http://127.0.0.1:${PORT}`;

export default {
  testDir: "./test/smoke",
  testMatch: "**/*.spec.mjs",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["json", { outputFile: "test/smoke/results.json" }]],
  use: {
    baseURL: BASE,
    headless: true,
    viewport: { width: 1280, height: 900 },
    serviceWorkers: "allow",
  },
  webServer: {
    command: "node test/library-server.mjs",
    cwd: ".",
    url: `${BASE}/demo/renderer/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      LOU_LIBRARY_SERVER_PORT: String(PORT),
    },
  },
  projects: [
    {
      name: "product",
      testMatch: [
        "**/12-offline-d2g.spec.mjs",
        "**/13-local-search-d6f.spec.mjs",
        "**/14-display-preferences-d7f.spec.mjs",
        "**/15-cognitive-priming-apf.spec.mjs",
        "**/16-product-consumption.spec.mjs",
        "**/17-product-composition-navigation.spec.mjs",
      ],
    },
    {
      name: "engineering",
      testMatch: [
        "**/0[1-9]-*.spec.mjs",
        "**/10-composition-navigation.spec.mjs",
        "**/11-offline-dev.spec.mjs",
      ],
    },
  ],
};
