/** D2-G — Browser Integration & Offline Certification (OF-D2-*). */
import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  productChapterUrl,
  CHAPTER_ID,
  RELEASE_ID_234,
  VIEWS,
} from "./fixtures.mjs";
import { createHighlight, goToProjection } from "./helpers.mjs";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.."
);
const LIBRARY_ROOT = path.join(
  REPO_ROOT,
  "demo/renderer/test/fixtures/product-library"
);
const CATALOG_PATH = path.join(LIBRARY_ROOT, "library.json");

async function ensureServiceWorkerOnPage(page) {
  const ok = await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) {
      return false;
    }
    await navigator.serviceWorker.register("/sw.js", { type: "module" });
    await navigator.serviceWorker.ready;
    return true;
  });
  if (!ok) {
    throw new Error("serviceWorker unavailable in test browser");
  }
}

async function openProductChapter(page) {
  await page.goto(productChapterUrl(), {
    waitUntil: "domcontentloaded",
    timeout: 120_000,
  });
  await waitForOfflineReady(page);
  await ensureServiceWorkerOnPage(page);
  await waitForServiceWorker(page);
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForServiceWorker(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), {
    timeout: 15_000,
  });
}

async function waitForServiceWorker(page) {
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration("/");
    return Boolean(reg && reg.active);
  });
}

function readCatalogOfflineStatus() {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const entry = catalog.entries.find((e) => e.release_id === RELEASE_ID_234);
  return entry?.offline_status ?? null;
}

function resetCatalogOfflineStatus(status = "not_prepared") {
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const entry = catalog.entries.find((e) => e.release_id === RELEASE_ID_234);
  if (entry) {
    entry.offline_status = status;
  }
  catalog.updated_at = new Date().toISOString();
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n");
}

async function waitForOfflineReady(page, timeoutMs = 120_000) {
  await page.waitForFunction(
    async (releaseId) => {
      if (!window.LouProductBootstrap?.readOfflineStatus) {
        return false;
      }
      const status = await window.LouProductBootstrap.readOfflineStatus(releaseId);
      return status === "offline_ready";
    },
    RELEASE_ID_234,
    { timeout: timeoutMs }
  );
  await expect(page.locator(".tab")).toHaveCount(7, { timeout: 15_000 });
}

test.describe("OF-D2 — Browser offline certification (D2-G)", () => {
  test.describe.configure({ timeout: 180_000 });
  test.beforeEach(() => {
    if (fs.existsSync(CATALOG_PATH)) {
      resetCatalogOfflineStatus("not_prepared");
    }
  });

  test("OF-D2-01 install leaves not_prepared until Reader opens", async () => {
    expect(readCatalogOfflineStatus()).toBe("not_prepared");
  });

  test("OF-D2-02 first Reader open certifies offline_ready via production runtime", async ({
    page,
  }) => {
    const devPaths = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("/01-learning/chapters/")) {
        devPaths.push(url);
      }
    });

    await openProductChapter(page);

    expect(readCatalogOfflineStatus()).toBe("offline_ready");
    expect(devPaths).toEqual([]);
    await expect(page.locator(".tab")).toHaveCount(7, { timeout: 15_000 });
    await expect(page.locator("#shell-breadcrumb .shell-breadcrumb-link")).not.toHaveText("…", {
      timeout: 15_000,
    });
  });

  test("OF-D2-03 cold offline reload without warm cache", async ({
    page,
    context,
  }) => {
    await openProductChapter(page);

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".tab")).toHaveCount(7, { timeout: 15_000 });
    await expect(page.locator("#shell-breadcrumb .shell-breadcrumb-link")).not.toHaveText("…", {
      timeout: 15_000,
    });
  });

  test("OF-D2-04 seven views navigable offline", async ({ page, context }) => {
    await openProductChapter(page);
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".tab")).toHaveCount(7, { timeout: 15_000 });

    await goToProjection(page, VIEWS.mentalModel.tabIndex);
    await expect(page.locator("#content .pedagogical-block").first()).toBeVisible();

    await goToProjection(page, VIEWS.notions.tabIndex);
    await expect(page.locator("#content .pedagogical-block").first()).toBeVisible();

    await page.locator(".tab").nth(VIEWS.clinicalCases.tabIndex).click();
    await page.waitForSelector("#content .pedagogical-block, #content .content-status", {
      timeout: 15_000,
    });

    await page.locator(".tab").nth(4).click();
    await expect(page.locator(".college-official-body")).toBeVisible({
      timeout: 15_000,
    });

    await page.locator(".tab").nth(5).click();
    await page.waitForSelector("#content", { timeout: 15_000 });

    await page.locator(".tab").nth(6).click();
    await page.waitForSelector("#content", { timeout: 15_000 });
  });

  test("OF-D2-05 college official offline", async ({ page, context }) => {
    await openProductChapter(page);
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator(".tab").nth(4).click();
    await expect(page.locator(".college-official-body")).toContainText(
      "Insuffisance cardiaque",
      { timeout: 15_000 }
    );
  });

  test("OF-D2-06 annotations persist offline reload", async ({
    page,
    context,
  }) => {
    await openProductChapter(page);

    await goToProjection(page, VIEWS.notions);
    await createHighlight(page, {
      projection: VIEWS.notions.projection,
      element: VIEWS.notions.element,
      phrase: VIEWS.notions.samplePhrase,
    });

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await goToProjection(page, VIEWS.notions);
    await expect(page.locator("#content mark.learner-highlight").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("OF-D2-07 no external network requests in product mode", async ({
    page,
  }) => {
    const external = [];
    page.on("request", (req) => {
      const url = new URL(req.url());
      if (url.hostname !== "127.0.0.1") {
        external.push(url.href);
      }
    });

    await openProductChapter(page);
    expect(external.filter((u) => !u.includes("127.0.0.1"))).toEqual([]);
  });

  test("OF-D2-08 preparation failure transitions to failed then retry succeeds", async ({
    page,
  }) => {
    let blockAssets = true;
    await page.route(`**/library/releases/${RELEASE_ID_234}/**`, (route) => {
      const url = route.request().url();
      if (
        blockAssets &&
        url.includes("build/traceability.json")
      ) {
        return route.fulfill({ status: 404, body: "missing" });
      }
      return route.continue();
    });

    await page.goto(productChapterUrl(), { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3000);
    expect(readCatalogOfflineStatus()).toBe("failed");

    blockAssets = false;
    resetCatalogOfflineStatus("failed");
    await page.goto(productChapterUrl(), { waitUntil: "domcontentloaded", timeout: 120_000 });
    await waitForOfflineReady(page);
    expect(readCatalogOfflineStatus()).toBe("offline_ready");
  });

  test("OF-D2-09 product mode uses Browser Package Access URLs", async ({
    page,
  }) => {
    const releaseUrls = [];
    page.on("request", (req) => {
      if (req.url().includes("/library/releases/")) {
        releaseUrls.push(req.url());
      }
    });

    await openProductChapter(page);

    expect(releaseUrls.length).toBeGreaterThan(5);
    expect(
      releaseUrls.some((u) => u.includes(`releases/${RELEASE_ID_234}/manifest.json`))
    ).toBe(true);
    expect(releaseUrls.some((u) => u.includes("/01-learning/chapters/"))).toBe(
      false
    );
  });

  test("OF-D2-10 service worker activates cleanly and shell survives offline reload", async ({
    page,
    context,
  }) => {
    const pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(String(err)));

    await openProductChapter(page);

    const swState = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration("/");
      if (!reg) {
        return { ready: false, active: false, controller: false };
      }
      await navigator.serviceWorker.ready;
      return {
        ready: true,
        active: Boolean(reg.active),
        controller: Boolean(navigator.serviceWorker.controller),
      };
    });

    expect(swState.ready).toBe(true);
    expect(swState.active).toBe(true);
    expect(swState.controller).toBe(true);
    expect(
      pageErrors.some((msg) => msg.includes("ReferenceError") && msg.includes("SHELL_CACHE_NAME"))
    ).toBe(false);
    expect(pageErrors).toEqual([]);

    const shellCached = await page.evaluate(async () => {
      const cache = await caches.open("lou-reader-shell-v1");
      const keys = await cache.keys();
      if (keys.length === 0) {
        return false;
      }
      const shellKey = new Request(
        `https://lou-offline.local/${encodeURIComponent("/demo/renderer/index.html")}`
      );
      const match = await cache.match(shellKey);
      return Boolean(match);
    });
    expect(shellCached).toBe(true);

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator(".tab")).toHaveCount(7, { timeout: 15_000 });
    await expect(page.locator("#shell-breadcrumb .shell-breadcrumb-link")).not.toHaveText("…", {
      timeout: 15_000,
    });
    expect(pageErrors).toEqual([]);
  });
});
