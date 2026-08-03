/** D6-F — Local Search smoke helpers (package 234, product mode). */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { productChapterUrl, RELEASE_ID_234 } from "./fixtures.mjs";

export const SEARCH_CACHE_DB = "lou-local-search-v1";
export const SEARCH_CACHE_STORE = "index_cache";

export const VIEW_LABELS = {
  "mental-model": "Modèle mental",
  notions: "Notions",
  "clinical-cases": "Cas cliniques",
  "college-official": "Collège officiel",
  qcm: "QCM",
};

export const SEARCH_QUERIES = {
  element_block: "insuffisance",
  section_path: "insuffisance",
  question_id: "insuffisance",
  scenario_scroll: "insuffisance",
  manifest_alt: "transsudat",
};

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../.."
);
const CATALOG_PATH = path.join(
  REPO_ROOT,
  "demo/renderer/test/fixtures/product-library/library.json"
);

export function resetCatalogOfflineStatus(status = "not_prepared") {
  if (!fs.existsSync(CATALOG_PATH)) {
    return;
  }
  const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
  const entry = catalog.entries.find((e) => e.release_id === RELEASE_ID_234);
  if (entry) {
    entry.offline_status = status;
  }
  catalog.updated_at = new Date().toISOString();
  fs.writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + "\n");
}

export async function ensureServiceWorkerOnPage(page) {
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

export async function waitForServiceWorker(page) {
  await page.waitForFunction(async () => {
    const reg = await navigator.serviceWorker.getRegistration("/");
    return Boolean(reg && reg.active);
  });
}

export async function waitForOfflineReady(page, timeoutMs = 120_000) {
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
  await page.waitForFunction(() => Boolean(window.LouLocalSearch?.runtime), {
    timeout: 30_000,
  });
}

export async function purgeServiceWorkerCaches(page) {
  await page.goto("/demo/renderer/index.html", {
    waitUntil: "domcontentloaded",
  });
  await page.evaluate(async () => {
    if (!("caches" in window)) {
      return;
    }
    const keys = await caches.keys();
    await Promise.all(keys.map((key) => caches.delete(key)));
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration("/");
      if (reg) {
        await reg.unregister();
      }
    }
  });
}

export async function openProductChapter(page) {
  await purgeServiceWorkerCaches(page);
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
  await page.waitForSelector("#local-search-trigger:not([hidden])", {
    timeout: 15_000,
  });
}

export async function clearSearchCacheDb(page) {
  await page.evaluate(async ({ dbName }) => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(dbName);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => resolve();
    });
  }, { dbName: SEARCH_CACHE_DB });
}

export async function openSearchPanel(page) {
  await page.locator("#local-search-trigger").click();
  await page.waitForFunction(
    () => window.LouLocalSearch?.ui?.getState() !== "closed",
    { timeout: 15_000 }
  );
  await page.waitForSelector("#local-search-root:not([hidden])");
}

export async function openSearchPanelViaKeyboard(page) {
  const isMac = process.platform === "darwin";
  await page.keyboard.press(isMac ? "Meta+KeyK" : "Control+KeyK");
  await page.waitForSelector("#local-search-root:not([hidden])");
}

export async function closeSearchPanel(page) {
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => window.LouLocalSearch?.ui?.getState() === "closed",
    { timeout: 10_000 }
  );
}

export async function waitForSearchState(page, state, timeoutMs = 90_000) {
  await page.waitForFunction(
    (expected) => window.LouLocalSearch?.ui?.getState() === expected,
    state,
    { timeout: timeoutMs }
  );
}

export async function runSearchQuery(page, query) {
  await page.locator("#local-search-input").fill("");
  await page.locator("#local-search-input").fill(query);
  await page.waitForFunction(
    (q) => {
      const ui = window.LouLocalSearch?.ui;
      if (!ui) {
        return false;
      }
      const state = ui.getState();
      if (state === "searching" || state === "indexing") {
        return false;
      }
      if (state === "error") {
        return true;
      }
      if (state === "no-results") {
        return q.length >= 2;
      }
      if (state === "empty") {
        return q.length < 2;
      }
      return state === "results" && ui.getHits().length > 0;
    },
    query,
    { timeout: 90_000 }
  );
}

export async function getSearchHits(page) {
  return page.evaluate(() => window.LouLocalSearch?.ui?.getHits?.() || []);
}

export async function selectSearchResultByView(page, viewId) {
  const label = VIEW_LABELS[viewId];
  const item = page.locator(".local-search-result").filter({
    has: page.locator(".local-search-result-view", { hasText: label }),
  });
  await item.first().click();
  await page.waitForFunction(() => window.LouApp?.whenTabReady);
  await page.evaluate(async () => {
    if (window.LouApp?.whenTabReady) {
      await window.LouApp.whenTabReady();
    }
    if (window.LouRenderer?.flushPendingLearnerLayers) {
      await window.LouRenderer.flushPendingLearnerLayers();
    }
  });
}

export async function selectSearchResultByAnchorKind(page, anchorKind, query) {
  await runSearchQuery(page, query);
  const meta = await page.evaluate((kind) => {
    const hits = window.LouLocalSearch?.ui?.getHits?.() || [];
    const index = hits.findIndex((hit) => hit.anchor?.kind === kind);
    if (index < 0) {
      return null;
    }
    return { index, viewId: hits[index].viewId };
  }, anchorKind);
  if (!meta) {
    throw new Error(`No SearchHit with anchor kind ${anchorKind} for query ${query}`);
  }

  await page.evaluate(async (index) => {
    await window.LouLocalSearch.ui.selectHit(index);
  }, meta.index);

  await page.waitForFunction(
    (viewId) => document.querySelector(".tab.active")?.dataset?.viewId === viewId,
    meta.viewId,
    { timeout: 30_000 }
  );
  await page.evaluate(async () => {
    if (window.LouApp?.whenTabReady) {
      await window.LouApp.whenTabReady();
    }
    if (window.LouRenderer?.flushPendingLearnerLayers) {
      await window.LouRenderer.flushPendingLearnerLayers();
    }
  });
  return meta;
}

export function trackFailedLibraryReleaseRequests(page) {
  const urls = [];
  const handler = (req) => {
    const url = req.url();
    if (url.includes("/library/releases/")) {
      urls.push(url);
    }
  };
  page.on("requestfailed", handler);
  return {
    urls,
    stop() {
      page.off("requestfailed", handler);
    },
  };
}

export async function activeTabViewId(page) {
  return page.evaluate(() => {
    const active = document.querySelector(".tab.active");
    return active?.dataset?.viewId || null;
  });
}

export async function countSearchHighlights(page) {
  return page.locator(".search-hit-highlight").count();
}

export async function exportLearnerSnapshot(page) {
  return page.evaluate(async () => {
    if (!window.LouLearnerSnapshot?.exportSnapshot) {
      throw new Error("LouLearnerSnapshot unavailable");
    }
    return window.LouLearnerSnapshot.exportSnapshot();
  });
}
