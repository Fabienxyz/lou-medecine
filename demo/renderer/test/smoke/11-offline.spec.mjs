/** Offline support — Reader Acceptance V1 (PDR-D2). */
import { test, expect } from "@playwright/test";
import { chapterUrl, CHAPTER_ID } from "./fixtures.mjs";

const RUNTIME_CACHE = "lou-reader-runtime-v1";

async function registerServiceWorkerForTest(page) {
  await page.evaluate(async () => {
    if (!("serviceWorker" in navigator)) {
      throw new Error("serviceWorker unavailable");
    }
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  });
}

async function waitForServiceWorker(page) {
  await page.waitForFunction(async () => {
    if (!("serviceWorker" in navigator)) {
      return false;
    }
    const reg = await navigator.serviceWorker.getRegistration("/");
    return Boolean(reg && reg.active);
  });
}

async function waitForManifestCached(page) {
  await page.waitForFunction(async (cacheName) => {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    return keys.some((req) => req.url.includes("manifest.json"));
  }, RUNTIME_CACHE);
}

async function warmChapterCache(page) {
  await page.goto(chapterUrl(), { waitUntil: "domcontentloaded" });
  await registerServiceWorkerForTest(page);
  await page.reload({ waitUntil: "networkidle" });
  await waitForServiceWorker(page);
  await waitForManifestCached(page);
  await page.locator(".tab").nth(2).click();
  await page.waitForSelector("#content .pedagogical-block", { timeout: 15_000 });
  await page.locator(".tab").nth(4).click();
  await page.waitForSelector(".college-official-body", { timeout: 15_000 });
  await page.waitForFunction(async () => {
    if (window.LouApp && window.LouApp.whenTabReady) {
      await window.LouApp.whenTabReady();
    }
  });
}

test.describe("Offline — Reader shell and package cache", () => {
  test("OF-01 continues offline after warm cache without reload", async ({
    page,
    context,
  }) => {
    await warmChapterCache(page);
    await context.setOffline(true);
    await page.locator(".tab").nth(2).click();
    await expect(page.locator("#content .pedagogical-block").first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator("#content .block-walkthrough").first()).toContainText(
      "Commence par la définition"
    );
  });

  test("OF-02 reload works offline after warm cache", async ({ page, context }) => {
    await warmChapterCache(page);
    await context.setOffline(true);
    await page.goto(chapterUrl(), { waitUntil: "domcontentloaded" });
    await expect(page.locator(".tab")).toHaveCount(7, { timeout: 15_000 });
    await expect(page.locator("#specialty")).not.toHaveText("…");
  });

  test("OF-03 college view renders offline after warm cache", async ({
    page,
    context,
  }) => {
    await warmChapterCache(page);
    await context.setOffline(true);
    await page.locator(".tab").nth(4).click();
    await expect(page.locator(".college-official-body")).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.locator(".college-official-body")).toContainText(
      "Insuffisance cardiaque"
    );
  });

  test("OF-04 missing college source degrades without crash", async ({ page }) => {
    const pageErrors = [];
    page.on("pageerror", (err) => pageErrors.push(String(err)));

    await page.route(`**/chapters/${CHAPTER_ID}/source/official-college.md`, (route) =>
      route.fulfill({ status: 404, body: "missing" })
    );
    await page.goto(chapterUrl(), { waitUntil: "networkidle" });
    await page.locator(".tab").nth(4).click();
    await expect(page.locator("#content .content-status")).toBeVisible({
      timeout: 15_000,
    });
    expect(pageErrors).toEqual([]);
  });

  test("OF-05 no Google Fonts network dependency on load", async ({ page }) => {
    const fontRequests = [];
    page.on("request", (req) => {
      const url = req.url();
      if (url.includes("fonts.googleapis.com") || url.includes("fonts.gstatic.com")) {
        fontRequests.push(url);
      }
    });
    await page.goto(chapterUrl(), { waitUntil: "networkidle" });
    expect(fontRequests).toEqual([]);
  });
});
