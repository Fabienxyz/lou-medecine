/** D7-F — Display Preferences end-to-end acceptance (package 234, product mode). */
import { test, expect } from "@playwright/test";
import {
  openProductChapterWithPreferences,
  readDpAttributes,
  readRuntimePreferences,
  listDisplayPreferencesRecords,
  clearDisplayPreferencesRecords,
  setDisplayPreference,
  resetDisplayPreferences,
  reloadProductChapter,
  snapshotDisplayPreferencesDomain,
  readContentFontSizePx,
  readContainerMaxWidthPx,
  searchHitsForQuery,
  captureViewModelOnce,
  readViewModelSnapshot,
  readOfflineStatus,
  DP_SELECTORS,
  DP_DEFAULTS,
} from "./display-preferences-helpers.mjs";

test.describe("D7-F — Display Preferences acceptance", () => {
  test.describe.configure({ timeout: 180_000 });

  test("DP-F-01 defaults on first boot without persisted record", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await clearDisplayPreferencesRecords(page);
    await reloadProductChapter(page);

    expect(await readDpAttributes(page)).toEqual(DP_DEFAULTS);
    expect(await readRuntimePreferences(page)).toMatchObject(DP_DEFAULTS);
    expect(await listDisplayPreferencesRecords(page)).toEqual([]);

    const domain = await snapshotDisplayPreferencesDomain(page);
    expect(domain.records).toEqual([]);
  });

  test("DP-F-02 theme change persists after reload", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await clearDisplayPreferencesRecords(page);
    await reloadProductChapter(page);

    await setDisplayPreference(page, "theme", "dark");
    const afterChange = await readDpAttributes(page);
    expect(afterChange.theme).toBe("dark");
    expect(afterChange.fontSize).toBe("medium");
    expect(afterChange.readingWidth).toBe("standard");

    await reloadProductChapter(page);
    expect((await readDpAttributes(page)).theme).toBe("dark");
    expect((await listDisplayPreferencesRecords(page)).length).toBe(1);
  });

  test("DP-F-03 fontSize change persists after reload", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await clearDisplayPreferencesRecords(page);
    await reloadProductChapter(page);

    await setDisplayPreference(page, "fontSize", "large");
    expect((await readDpAttributes(page)).fontSize).toBe("large");

    await reloadProductChapter(page);
    expect((await readDpAttributes(page)).fontSize).toBe("large");
  });

  test("DP-F-04 readingWidth change persists after reload", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await clearDisplayPreferencesRecords(page);
    await reloadProductChapter(page);

    await setDisplayPreference(page, "readingWidth", "narrow");
    expect((await readDpAttributes(page)).readingWidth).toBe("narrow");

    await reloadProductChapter(page);
    expect((await readDpAttributes(page)).readingWidth).toBe("narrow");
  });

  test("DP-F-05 successive modifications and singleton", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await clearDisplayPreferencesRecords(page);
    await reloadProductChapter(page);

    await setDisplayPreference(page, "theme", "dark");
    await setDisplayPreference(page, "fontSize", "large");
    await setDisplayPreference(page, "readingWidth", "narrow");
    await setDisplayPreference(page, "theme", "light");
    await setDisplayPreference(page, "readingWidth", "wide");

    const attrs = await readDpAttributes(page);
    expect(attrs).toEqual({
      theme: "light",
      fontSize: "large",
      readingWidth: "wide",
    });

    const rows = await listDisplayPreferencesRecords(page);
    expect(rows.length).toBe(1);
    expect(rows[0].record_id).toBe("display-preferences-v1");
    expect(rows[0].release_id).toBeUndefined();

    await reloadProductChapter(page);
    expect(await readDpAttributes(page)).toEqual(attrs);
  });

  test("DP-F-06 reset removes record and restores defaults", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await setDisplayPreference(page, "theme", "dark");
    await setDisplayPreference(page, "fontSize", "large");

    await resetDisplayPreferences(page);
    expect(await readDpAttributes(page)).toEqual(DP_DEFAULTS);
    expect(await listDisplayPreferencesRecords(page)).toEqual([]);

    const domain = await snapshotDisplayPreferencesDomain(page);
    expect(domain.records).toEqual([]);

    await reloadProductChapter(page);
    expect(await readDpAttributes(page)).toEqual(DP_DEFAULTS);
  });

  test("DP-F-07 snapshot export with record", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await setDisplayPreference(page, "theme", "dark");

    const domain = await snapshotDisplayPreferencesDomain(page);
    expect(domain.records.length).toBe(1);
    expect(domain.records[0].release_id).toBeUndefined();
    expect(domain.records[0].payload.theme).toBe("dark");
    expect(JSON.stringify(domain).includes("viewId")).toBe(false);
  });

  test("DP-F-08 import idempotent via runtime reload", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await setDisplayPreference(page, "theme", "dark");
    await setDisplayPreference(page, "fontSize", "small");

    const exported = await page.evaluate(async () =>
      window.LouLearnerSnapshot.exportSnapshot()
    );
    await clearDisplayPreferencesRecords(page);
    await reloadProductChapter(page);
    expect(await readDpAttributes(page)).toEqual(DP_DEFAULTS);

    const first = await page.evaluate(async (snap) => {
      return window.LouLearnerSnapshot.importSnapshot(snap);
    }, exported);
    expect(first.success).toBe(true);

    await page.evaluate(async () => {
      await window.LouDisplayPreferences.runtime.loadAndApply({ source: "import" });
    });

    expect(await readDpAttributes(page)).toMatchObject({
      theme: "dark",
      fontSize: "small",
    });

    const second = await page.evaluate(async (snap) => {
      return window.LouLearnerSnapshot.importSnapshot(snap);
    }, exported);
    expect(second.success).toBe(true);
    expect((await listDisplayPreferencesRecords(page)).length).toBe(1);
  });

  test("DP-F-09 empty snapshot domain does not delete local record", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await setDisplayPreference(page, "theme", "dark");

    const emptyDomainSnapshot = await page.evaluate(async () => {
      const snap = await window.LouLearnerSnapshot.exportSnapshot();
      const dp = snap.body.domains.find((d) => d.domain_id === "display_preferences");
      dp.records = [];
      const body = { domains: snap.body.domains };
      const digest = await window.LouLearnerSnapshot.computeBodyDigest(body);
      snap.body = window.LouLearnerSnapshot.canonicalizeBody(body);
      snap.integrity.digest = digest;
      return snap;
    });

    const result = await page.evaluate(async (snap) => {
      return window.LouLearnerSnapshot.importSnapshot(snap);
    }, emptyDomainSnapshot);
    expect(result.success).toBe(true);
    expect((await listDisplayPreferencesRecords(page)).length).toBe(1);
  });

  test("DP-F-10 preferences global across reload (no release_id)", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await setDisplayPreference(page, "theme", "dark");
    const rows = await listDisplayPreferencesRecords(page);
    expect(rows[0].release_id).toBeUndefined();
    expect(rows[0].chapter).toBeUndefined();
    await reloadProductChapter(page);
    expect((await readDpAttributes(page)).theme).toBe("dark");
  });

  test("DP-F-11 boot loads preferences before session restore is usable", async ({
    page,
  }) => {
    await openProductChapterWithPreferences(page);
    expect(await page.evaluate(() => window.LouApp.wasDisplayPreferencesLoaded())).toBe(
      true
    );
    expect(documentAttrsPresent(await readDpAttributes(page))).toBe(true);
    await page.locator(".tab").first().click();
    await page.waitForFunction(() => Boolean(document.querySelector(".content")));
  });

  test("DP-F-12 SearchHit order unchanged across theme", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    const hitsLight = await searchHitsForQuery(page, "insuffisance");
    expect(hitsLight.length).toBeGreaterThan(0);

    await setDisplayPreference(page, "theme", "dark");
    const hitsDark = await searchHitsForQuery(page, "insuffisance");
    expect(hitsDark.map((h) => h.unitId)).toEqual(hitsLight.map((h) => h.unitId));
    expect(hitsDark.map((h) => h.snippet)).toEqual(hitsLight.map((h) => h.snippet));
  });

  test("DP-F-13 ViewModel unchanged after preference changes", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await captureViewModelOnce(page);
    const before = await readViewModelSnapshot(page);

    await setDisplayPreference(page, "theme", "dark");
    await setDisplayPreference(page, "fontSize", "large");
    await setDisplayPreference(page, "readingWidth", "wide");
    await resetDisplayPreferences(page);

    const after = await readViewModelSnapshot(page);
    expect(after).toBe(before);
  });

  test("DP-F-14 offline_status unchanged", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    const before = await readOfflineStatus(page);
    await setDisplayPreference(page, "theme", "dark");
    const after = await readOfflineStatus(page);
    expect(after).toBe(before);
  });

  test("DP-F-15 observable font sizes differ", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await clearDisplayPreferencesRecords(page);
    await reloadProductChapter(page);

    await setDisplayPreference(page, "fontSize", "small");
    const small = await readContentFontSizePx(page);
    await setDisplayPreference(page, "fontSize", "large");
    const large = await readContentFontSizePx(page);
    expect(large).toBeGreaterThan(small);
  });

  test("DP-F-16 observable reading widths differ", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await clearDisplayPreferencesRecords(page);
    await reloadProductChapter(page);

    await setDisplayPreference(page, "readingWidth", "narrow");
    const narrow = await readContainerMaxWidthPx(page);
    await setDisplayPreference(page, "readingWidth", "wide");
    const wide = await readContainerMaxWidthPx(page);
    expect(wide).toBeGreaterThan(narrow);
  });

  test("DP-F-17 keyboard access to controls and reset", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await clearDisplayPreferencesRecords(page);
    await reloadProductChapter(page);

    const themeSelect = page.locator(DP_SELECTORS.theme);
    await themeSelect.focus();
    await themeSelect.press("ArrowDown");
    await page.waitForFunction(
      () => window.LouDisplayPreferences.runtime.getCurrentPreferences().theme === "dark",
      null,
      { timeout: 15_000 }
    );

    const resetButton = page.locator(DP_SELECTORS.reset);
    await resetButton.focus();
    await resetButton.press("Enter");
    await page.waitForFunction(
      () => window.LouDisplayPreferences.runtime.getCurrentPreferences().theme === "light",
      null,
      { timeout: 15_000 }
    );
  });

  test("DP-F-18 dark theme applies to shell", async ({ page }) => {
    await openProductChapterWithPreferences(page);
    await setDisplayPreference(page, "theme", "dark");
    const bg = await page.evaluate(() =>
      getComputedStyle(document.body).backgroundColor
    );
    expect(bg).not.toBe("rgb(245, 247, 251)");
  });
});

function documentAttrsPresent(attrs) {
  return Boolean(attrs.theme && attrs.fontSize && attrs.readingWidth);
}
