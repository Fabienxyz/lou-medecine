/** AP-F — Cognitive Priming end-to-end acceptance (package 234, AP-B §9.3). */
import { test, expect } from "@playwright/test";
import {
  openProductChapter,
  openAmorçageTab,
  waitForAmorçageContent,
  readAmorçageTabAvailability,
  readAmorçageDomSnapshot,
  routeArtifactWithEdnTarget,
  routeCatalogWithExtraChapter,
  routeManifestWithoutAmorçage,
  clickFirstNavigableEdn,
  waitForAmorçagePlannedMessage,
  selectAmorçageSearchHit,
  persistSessionOnAmorçage,
  waitForProductChapterReady,
  waitForSessionView,
  activeTabViewId,
  CP_LABEL,
  CP_VIEW_ID,
  CP_BADGE,
  CP_SUMMARY_SNIPPET,
  CP_AI_SNIPPET,
  CP_EDN_LABEL,
  CHAPTER_ID,
} from "./cognitive-priming-helpers.mjs";
import {
  openProductChapterWithPreferences,
  setDisplayPreference,
  readDpAttributes,
} from "./display-preferences-helpers.mjs";
import { resetCatalogOfflineStatus } from "./local-search-helpers.mjs";

test.describe("AP-F — Cognitive Priming acceptance", () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(() => {
    resetCatalogOfflineStatus("offline_ready");
  });

  test("AP-F-01 — package 234 Amorçage tab is published and visible", async ({
    page,
  }) => {
    await openProductChapter(page);
    const tab = readAmorçageTabAvailability(page);
    await expect(page.locator(".tab", { hasText: CP_LABEL })).toBeVisible();
    const state = await tab;
    expect(state.exists).toBe(true);
    expect(state.planned).toBe(false);

    await openAmorçageTab(page);
    expect(await activeTabViewId(page)).toBe(CP_VIEW_ID);
    await expect(page.locator(".cognitive-priming-view")).toBeVisible();
  });

  test("AP-F-02 — profile Compréhension / Mémorisation displayed", async ({
    page,
  }) => {
    await openProductChapter(page);
    await openAmorçageTab(page);
    const snap = await readAmorçageDomSnapshot(page);
    expect(snap.profile).toBe(true);
    expect(snap.comprehensionStars).toBe(4);
    expect(snap.memorizationStars).toBe(4);
    await expect(page.locator(".cp-profile-label", { hasText: "Compréhension" })).toBeVisible();
    await expect(page.locator(".cp-profile-label", { hasText: "Mémorisation" })).toBeVisible();
  });

  test("AP-F-03 — at least one summary bullet rendered", async ({ page }) => {
    await openProductChapter(page);
    await openAmorçageTab(page);
    const snap = await readAmorçageDomSnapshot(page);
    expect(snap.summaryBullets).toBeGreaterThan(0);
    await expect(page.locator(".cp-summary-list li").first()).toContainText(
      CP_SUMMARY_SNIPPET
    );
  });

  test("AP-F-04 — EDN references listed", async ({ page }) => {
    await openProductChapter(page);
    await openAmorçageTab(page);
    const snap = await readAmorçageDomSnapshot(page);
    expect(snap.ednCount).toBeGreaterThan(0);
    await expect(page.locator(".cp-edn-list")).toContainText(CP_EDN_LABEL);
  });

  test("AP-F-05 — AI complement with exact badge when present", async ({
    page,
  }) => {
    await openProductChapter(page);
    await openAmorçageTab(page);
    const snap = await readAmorçageDomSnapshot(page);
    expect(snap.aiBadge).toBe(CP_BADGE);
    await expect(page.locator(".cp-ai-sentence")).toContainText(CP_AI_SNIPPET);
  });

  test("AP-F-06 — no interactive Inter-EDN section", async ({ page }) => {
    await openProductChapter(page);
    await openAmorçageTab(page);
    const snap = await readAmorçageDomSnapshot(page);
    expect(snap.hasInterEdn).toBe(false);
    await expect(page.locator(".cp-inter-edn")).toHaveCount(0);
  });

  test("AP-F-07 — Local Search finds summary text and navigates to Amorçage", async ({
    page,
  }) => {
    await openProductChapter(page);
    const hit = await selectAmorçageSearchHit(page, CP_SUMMARY_SNIPPET);
    expect(hit.viewId).toBe(CP_VIEW_ID);
    expect(hit.anchor.kind).toBe("view_entry");
    expect(await activeTabViewId(page)).toBe(CP_VIEW_ID);
    await expect(page.locator(".cp-summary-list")).toContainText(CP_SUMMARY_SNIPPET);
  });

  test("AP-F-08 — session resume returns to published Amorçage after reload", async ({
    page,
  }) => {
    await openProductChapter(page);
    await persistSessionOnAmorçage(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForProductChapterReady(page);
    await waitForSessionView(page, CP_VIEW_ID, 30_000);
    await waitForAmorçageContent(page);
  });

  test("AP-F-09 — breadcrumb chapter segment opens Amorçage (CE-04)", async ({
    page,
  }) => {
    await openProductChapter(page);
    await page.locator(".tab", { hasText: "Notions" }).click();
    await waitForSessionView(page, "notions");
    await page
      .locator('.shell-breadcrumb-item[data-segment="chapter"] .shell-breadcrumb-link')
      .click();
    await waitForSessionView(page, CP_VIEW_ID);
    await waitForAmorçageContent(page);
  });

  test("AP-F-10 — Display Preferences dark theme keeps Amorçage readable", async ({
    page,
  }) => {
    await openProductChapterWithPreferences(page);
    await setDisplayPreference(page, "theme", "dark");
    expect((await readDpAttributes(page)).theme).toBe("dark");
    await openAmorçageTab(page);
    const snap = await readAmorçageDomSnapshot(page);
    expect(snap.profile).toBe(true);
    expect(snap.summaryBullets).toBeGreaterThan(0);
    await expect(page.locator(".cp-title, .cp-section-title").first()).toBeVisible();
  });

  test("AP-F-11 — offline warm cache serves Amorçage content", async ({
    page,
    context,
  }) => {
    await openProductChapter(page);
    await openAmorçageTab(page);
    await page.waitForFunction(async () => {
      const cache = await caches.open("lou-reader-runtime-v1");
      const keys = await cache.keys();
      return keys.some((req) => req.url.includes("cognitive-priming.v1.json"));
    });
    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForProductChapterReady(page);
    await page.locator(".tab", { hasText: CP_LABEL }).click();
    await waitForAmorçageContent(page);
    const snap = await readAmorçageDomSnapshot(page);
    expect(snap.summaryBullets).toBeGreaterThan(0);
  });

  test("AP-F-12 — package without Amorçage shows planned message", async ({
    page,
  }) => {
    await routeManifestWithoutAmorçage(page);
    await openProductChapter(page);
    await page.locator(".tab", { hasText: CP_LABEL }).click();
    await waitForAmorçagePlannedMessage(page);
    await expect(page.locator(".content-status")).toContainText(/prévu|planned/i);
  });

  test("AP-F-EDN-SAME — same-chapter EDN opens Amorçage in place", async ({
    page,
  }) => {
    await routeArtifactWithEdnTarget(page, CHAPTER_ID);
    await openProductChapter(page);
    await openAmorçageTab(page);
    const urlBefore = page.url();
    await clickFirstNavigableEdn(page);
    await waitForSessionView(page, CP_VIEW_ID);
    expect(page.url()).toBe(urlBefore);
  });

  test("AP-F-EDN-CROSS — cross-chapter EDN encodes view=cognitive-priming", async ({
    page,
  }) => {
    await routeCatalogWithExtraChapter(page, "cardio/220");
    await routeArtifactWithEdnTarget(page, "cardio/220");
    await openProductChapter(page);
    await openAmorçageTab(page);
    await Promise.all([
      page.waitForURL(/view=cognitive-priming/, { timeout: 15_000 }),
      clickFirstNavigableEdn(page),
    ]);
    expect(page.url()).toMatch(/chapter=cardio(%2F|\/)220/);
    expect(page.url()).toContain("view=cognitive-priming");
  });
});
