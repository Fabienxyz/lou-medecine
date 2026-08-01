/** D7-F — Display Preferences smoke helpers (package 234, product mode). */

import {
  openProductChapter,
  exportLearnerSnapshot,
  runSearchQuery,
  waitForSearchState,
  openSearchPanel,
  closeSearchPanel,
  getSearchHits,
} from "./local-search-helpers.mjs";
import { DB_NAME, RELEASE_ID_234 } from "./fixtures.mjs";

export { openProductChapter, exportLearnerSnapshot, RELEASE_ID_234 };

export const DP_SELECTORS = {
  theme: "#display-preferences-theme",
  fontSize: "#display-preferences-font-size",
  readingWidth: "#display-preferences-reading-width",
  reset: ".display-preferences-reset",
  root: "#display-preferences-root",
};

export const DP_DEFAULTS = {
  theme: "light",
  fontSize: "medium",
  readingWidth: "standard",
};

export async function waitForDisplayPreferences(page) {
  await page.waitForFunction(
    () =>
      Boolean(window.LouDisplayPreferences?.runtime) &&
      Boolean(window.LouApp?.wasDisplayPreferencesLoaded?.()),
    { timeout: 30_000 }
  );
  await page.waitForSelector(`${DP_SELECTORS.root}:not([hidden])`, {
    timeout: 15_000,
  });
}

export async function openProductChapterWithPreferences(page) {
  await openProductChapter(page);
  await waitForDisplayPreferences(page);
}

export async function readDpAttributes(page) {
  return page.evaluate(() => ({
    theme: document.documentElement.getAttribute("data-dp-theme"),
    fontSize: document.documentElement.getAttribute("data-dp-font-size"),
    readingWidth: document.documentElement.getAttribute("data-dp-reading-width"),
  }));
}

export async function readRuntimePreferences(page) {
  return page.evaluate(() =>
    window.LouDisplayPreferences.runtime.getCurrentPreferences()
  );
}

export async function listDisplayPreferencesRecords(page) {
  return page.evaluate(async () => {
    await window.LouLearnerStore.open();
    return window.LouLearnerStore.listDisplayPreferencesRecords();
  });
}

export async function clearDisplayPreferencesRecords(page) {
  await page.evaluate(async () => {
    await window.LouLearnerStore.open();
    await window.LouLearnerStore.deleteDisplayPreferencesRecords();
  });
}

export async function setDisplayPreference(page, field, value) {
  const selector =
    DP_SELECTORS[
      field === "fontSize"
        ? "fontSize"
        : field === "readingWidth"
          ? "readingWidth"
          : "theme"
    ];
  await page.locator(selector).selectOption(value);
  await page.waitForFunction(
    ({ fieldKey, expected }) => {
      const runtime = window.LouDisplayPreferences?.runtime;
      if (!runtime) {
        return false;
      }
      const prefs = runtime.getCurrentPreferences();
      return prefs[fieldKey] === expected;
    },
    { fieldKey: field, expected: value },
    { timeout: 10_000 }
  );
}

export async function resetDisplayPreferences(page) {
  await page.locator(DP_SELECTORS.reset).click();
  await page.waitForFunction(
    () =>
      window.LouDisplayPreferences?.runtime?.getCurrentPreferences()?.theme ===
      "light",
    { timeout: 10_000 }
  );
}

export async function reloadProductChapter(page) {
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForDisplayPreferences(page);
}

export async function snapshotDisplayPreferencesDomain(page) {
  const snapshot = await exportLearnerSnapshot(page);
  return snapshot.body.domains.find((d) => d.domain_id === "display_preferences");
}

export async function readContentFontSizePx(page) {
  return page.evaluate(() => {
    const el = document.querySelector(".content");
    return el ? parseFloat(getComputedStyle(el).fontSize) : null;
  });
}

export async function readContainerMaxWidthPx(page) {
  return page.evaluate(() => {
    const el = document.querySelector(".container");
    return el ? parseFloat(getComputedStyle(el).maxWidth) : null;
  });
}

export async function searchHitsForQuery(page, query) {
  const isOpen = await page.evaluate(
    () => window.LouLocalSearch?.ui?.getState?.() !== "closed"
  );
  if (!isOpen) {
    await openSearchPanel(page);
  }
  await runSearchQuery(page, query);
  await waitForSearchState(page, "results");
  const hits = await getSearchHits(page);
  await closeSearchPanel(page);
  return hits;
}

export async function readViewModelSnapshot(page) {
  return page.evaluate(() => {
    if (!window.LouComposition?.buildReadingViewModel) {
      return null;
    }
    return window.__LOU_D7F_VIEWMODEL_SNAPSHOT__ || null;
  });
}

export async function captureViewModelOnce(page) {
  await page.evaluate(async () => {
    if (window.__LOU_D7F_VIEWMODEL_SNAPSHOT__) {
      return;
    }
    const manifest = await fetch(
      "/library/releases/cardio__234__2022__1/manifest.json"
    ).then((r) => r.json());
    const composed = await window.LouComposition.buildReadingViewModel(manifest);
    window.__LOU_D7F_VIEWMODEL_SNAPSHOT__ = JSON.stringify(
      composed.readingViewModel
    );
  });
}

export async function readOfflineStatus(page) {
  return page.evaluate(async () => {
    if (!window.LouProductBootstrap?.readOfflineStatus) {
      return null;
    }
    return window.LouProductBootstrap.readOfflineStatus("cardio__234__2022__1");
  });
}

export async function keyboardFocusPreferencesControl(page, selector) {
  await page.locator(selector).focus();
}

export { DB_NAME };
