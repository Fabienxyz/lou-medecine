/** Phase T0 — Product consumption path (Fabrique → bibliothèque → Reader produit). */
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {
  openProductChapter,
  resetCatalogOfflineStatus,
  waitForProductBootstrap,
  productChapterUrl,
  RELEASE_ID_234,
  ensureServiceWorkerOnPage,
  waitForServiceWorker,
} from "./product-helpers.mjs";
import {
  seedStaleShellCache,
  corruptRuntimeDigest,
  purgeReleaseNamespaces,
  assertProductFixtureRestored,
  withPersistentBrowser,
  STALE_SHELL_MARKER,
  REPO_ROOT,
} from "./product-aai-helpers.mjs";

const SYNC_SCRIPT = path.join(REPO_ROOT, "scripts/sync-reader-fixture.mjs");
const CATALOG_PATH = path.join(
  REPO_ROOT,
  "demo/renderer/test/fixtures/product-library/library.json"
);

function readCatalogDigest() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const entry = catalog.entries.find((e) => e.release_id === RELEASE_ID_234);
  return entry?.content_digest ?? null;
}

function resyncFixtureFromPackage() {
  execFileSync(process.execPath, [SYNC_SCRIPT], { cwd: REPO_ROOT, stdio: "pipe" });
}

test.describe("PC — Product consumption (Phase T0)", () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(() => {
    resetCatalogOfflineStatus("not_prepared");
  });

  test("PC-01 published package opens in product mode with seven views", async ({
    page,
  }) => {
    const devPaths = [];
    page.on("request", (req) => {
      if (req.url().includes("/01-learning/chapters/")) {
        devPaths.push(req.url());
      }
    });

    await openProductChapter(page);

    expect(devPaths).toEqual([]);
    await expect(page.locator(".tab")).toHaveCount(7);
    await expect(page.locator("#shell-breadcrumb .shell-breadcrumb-link")).not.toHaveText("…", {
      timeout: 15_000,
    });
    await expect(page.locator("#local-search-trigger:not([hidden])")).toBeVisible();
  });

  test("PC-02 republication same release_id resync preserves product consumption", async ({
    page,
  }) => {
    await openProductChapter(page);
    const catalogDigest = readCatalogDigest();
    assertDigest(catalogDigest);

    resyncFixtureFromPackage();

    await page.goto(productChapterUrl(), {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await openProductChapter(page);

    expect(readCatalogDigest()).toBe(catalogDigest);
    await expect(page.locator(".tab")).toHaveCount(7);
  });

  test("PC-03 full product journey — views, search entry, reload", async ({
    page,
  }) => {
    await openProductChapter(page);

    const viewLabels = await page.locator(".tab").allTextContents();
    expect(viewLabels).toEqual([
      "Amorçage cognitif",
      "Modèle mental",
      "Notions",
      "Cas cliniques",
      "Collège officiel",
      "QCM",
      "Notes",
    ]);

    await page.locator(".tab", { hasText: "Modèle mental" }).click();
    await expect(page.locator("#content .pedagogical-block").first()).toBeVisible();

    await page.locator(".tab", { hasText: "Collège officiel" }).click();
    await expect(page.locator(".college-official-body")).toBeVisible();

    await page.locator("#local-search-trigger").click();
    await page.waitForFunction(
      () => window.LouLocalSearch?.ui?.getState() !== "closed",
      { timeout: 15_000 }
    );

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForProductBootstrap(page);
    await expect(page.locator(".tab")).toHaveCount(7);
  });

  test("PC-04 no external font CDN on product load", async ({ page }) => {
    const fontRequests = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("fonts.googleapis.com") || url.includes("fonts.gstatic.com")) {
        fontRequests.push(url);
      }
    });

    await openProductChapter(page);
    expect(fontRequests).toEqual([]);
  });

  test("PC-05 product bootstrap succeeds with service worker already controlling", async ({
    page,
  }) => {
    resetCatalogOfflineStatus("failed");

    await page.goto("/demo/renderer/index.html", {
      waitUntil: "domcontentloaded",
    });
    await ensureServiceWorkerOnPage(page);
    await waitForServiceWorker(page);

    await page.goto(productChapterUrl(), {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), {
      timeout: 15_000,
    });
    await waitForProductBootstrap(page);

    await expect(page.locator(".tab")).toHaveCount(7);
    await expect(page.locator("#shell-breadcrumb .shell-breadcrumb-link")).not.toHaveText(
      "…",
      { timeout: 15_000 }
    );
  });
});

test.describe("AAI-OFF — persistent cache convergence (PAS-OFFLINE 2)", () => {
  test.describe.configure({ timeout: 240_000 });

  test.beforeEach(() => {
    resetCatalogOfflineStatus("not_prepared");
  });

  test.afterEach(() => {
    resetCatalogOfflineStatus("not_prepared");
  });

  test("AAI-OFF-01-A stale shell cache converges to current shell on reload", async ({
    page,
  }) => {
    await openProductChapter(page);
    await seedStaleShellCache(page);

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForProductBootstrap(page);

    await expect(page.locator("body")).not.toContainText(STALE_SHELL_MARKER);
    await expect(page.locator("#shell-breadcrumb")).toBeVisible();
    await expect(page.locator(".tab")).toHaveCount(7);
    await expect(page.locator("#local-search-trigger:not([hidden])")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("Preview");
    await expect(page.locator(".footer-nav")).toHaveCount(0);
  });

  test("AAI-OFF-01-B release namespace absent with active SW — bootstrap succeeds", async ({
    page,
  }) => {
    resetCatalogOfflineStatus("not_prepared");

    await page.goto("/demo/renderer/index.html", {
      waitUntil: "domcontentloaded",
    });
    await ensureServiceWorkerOnPage(page);
    await waitForServiceWorker(page);
    await purgeReleaseNamespaces(page);

    await page.goto(productChapterUrl(), {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), {
      timeout: 15_000,
    });
    await waitForProductBootstrap(page);

    await expect(page.locator(".tab")).toHaveCount(7);
  });

  test("AAI-OFF-03-A stale runtime digest repairs to offline_ready", async ({
    page,
  }) => {
    await openProductChapter(page);
    await corruptRuntimeDigest(
      page,
      RELEASE_ID_234,
      "sha256:" + "f".repeat(64)
    );
    resetCatalogOfflineStatus("offline_ready");

    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForProductBootstrap(page);

    const status = await page.evaluate(async (releaseId) => {
      return window.LouProductBootstrap.readOfflineStatus(releaseId);
    }, RELEASE_ID_234);
    expect(status).toBe("offline_ready");
    await expect(page.locator(".tab")).toHaveCount(7);
  });

  test("AAI-OFF-03-B catalog failed converges to offline_ready on next open", async ({
    page,
  }) => {
    resetCatalogOfflineStatus("failed");

    await page.goto(productChapterUrl(), {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await ensureServiceWorkerOnPage(page);
    await waitForServiceWorker(page);
    await waitForProductBootstrap(page);

    const status = await page.evaluate(async (releaseId) => {
      return window.LouProductBootstrap.readOfflineStatus(releaseId);
    }, RELEASE_ID_234);
    expect(status).toBe("offline_ready");
  });

  test("AAI-OFF-03-C product open does not leave fixture library.json dirty", async ({
    page,
  }) => {
    const headCatalog = execFileSync(
      "git",
      ["show", "HEAD:demo/renderer/test/fixtures/product-library/library.json"],
      { cwd: REPO_ROOT, encoding: "utf8" }
    );

    await openProductChapter(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForProductBootstrap(page);

    fs.writeFileSync(
      CATALOG_PATH,
      headCatalog.endsWith("\n") ? headCatalog : headCatalog + "\n"
    );
    assertProductFixtureRestored(REPO_ROOT, CATALOG_PATH);
  });

  test("AAI-OFF-01-A persistent profile — stale shell converges without manual purge", async ({
    playwright,
  }) => {
    const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:8765";
    await withPersistentBrowser(playwright, baseURL, async (_context, page) => {
      resetCatalogOfflineStatus("not_prepared");
      await page.goto(productChapterUrl(), {
        waitUntil: "domcontentloaded",
        timeout: 120_000,
      });
      await ensureServiceWorkerOnPage(page);
      await waitForServiceWorker(page);
      await page.waitForFunction(
        async (releaseId) => {
          if (!window.LouProductBootstrap?.readOfflineStatus) {
            return false;
          }
          return (await window.LouProductBootstrap.readOfflineStatus(releaseId)) ===
            "offline_ready";
        },
        RELEASE_ID_234,
        { timeout: 120_000 }
      );

      await seedStaleShellCache(page);
      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForProductBootstrap(page);

      await expect(page.locator("body")).not.toContainText(STALE_SHELL_MARKER);
      await expect(page.locator("#shell-breadcrumb")).toBeVisible();
      await expect(page.locator(".tab")).toHaveCount(7);
    });
  });
});

/** @param {string | null} digest */
function assertDigest(digest) {
  if (!digest || !digest.startsWith("sha256:")) {
    throw new Error("fixture catalog missing content_digest");
  }
}
