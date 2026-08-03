/** Phase T0 — Product consumption path (Fabrique → bibliothèque → Reader produit). */
import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  openProductChapter,
  resetCatalogOfflineStatus,
  waitForProductBootstrap,
  productChapterUrl,
  RELEASE_ID_234,
} from "./product-helpers.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.."
);
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
    await expect(page.locator("#specialty, #chapter-title").first()).not.toHaveText("…", {
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

    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
    const entry = catalog.entries.find((e) => e.release_id === RELEASE_ID_234);
    expect(entry?.offline_status).toBe("offline_ready");
    expect(entry?.content_digest).toBe(catalogDigest);
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
});

/** @param {string | null} digest */
function assertDigest(digest) {
  if (!digest || !digest.startsWith("sha256:")) {
    throw new Error("fixture catalog missing content_digest");
  }
}
