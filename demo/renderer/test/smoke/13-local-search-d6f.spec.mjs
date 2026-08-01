/** D6-F — Local Search end-to-end, offline, cache and acceptance (package 234). */
import { test, expect } from "@playwright/test";
import {
  openProductChapter,
  clearSearchCacheDb,
  openSearchPanel,
  openSearchPanelViaKeyboard,
  closeSearchPanel,
  runSearchQuery,
  waitForSearchState,
  selectSearchResultByView,
  selectSearchResultByAnchorKind,
  activeTabViewId,
  countSearchHighlights,
  exportLearnerSnapshot,
  resetCatalogOfflineStatus,
  SEARCH_QUERIES,
  VIEW_LABELS,
  SEARCH_CACHE_DB,
} from "./local-search-helpers.mjs";

test.describe("D6-F — Local Search acceptance", () => {
  test.describe.configure({ timeout: 180_000 });

  test.beforeEach(() => {
    resetCatalogOfflineStatus("not_prepared");
  });

  test("LS-F-01 product search on package 234 returns ordered hits", async ({
    page,
  }) => {
    await openProductChapter(page);
    await openSearchPanel(page);
    await runSearchQuery(page, "insuffisance");

    const hits = await page.evaluate(() => window.LouLocalSearch.ui.getHits());
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.release_id === "cardio__234__2022__1")).toBe(true);

    const runtimeHits = await page.evaluate(async () => {
      return (await window.LouLocalSearch.runtime.search("insuffisance")).hits;
    });
    expect(hits.map((h) => h.unitId)).toEqual(runtimeHits.map((h) => h.unitId));
  });

  test("LS-F-02 first index build in product mode persists search cache", async ({
    page,
  }) => {
    await openProductChapter(page);
    await clearSearchCacheDb(page);
    await openSearchPanel(page);
    await runSearchQuery(page, "insuffisance");

    const hasCache = await page.evaluate(async () => {
      return new Promise((resolve) => {
        const req = indexedDB.open("lou-local-search-v1");
        req.onsuccess = () => {
          const db = req.result;
          const tx = db.transaction("index_cache", "readonly");
          const getReq = tx.objectStore("index_cache").get("cardio__234__2022__1");
          getReq.onsuccess = () => resolve(Boolean(getReq.result));
        };
        req.onerror = () => resolve(false);
      });
    });
    expect(hasCache).toBe(true);
  });

  test("LS-F-03 reuses valid search cache on second query", async ({ page }) => {
    await openProductChapter(page);
    await clearSearchCacheDb(page);
    await openSearchPanel(page);
    await runSearchQuery(page, "insuffisance");

    const firstStatus = await page.evaluate(async () => {
      return window.LouLocalSearch.runtime.getStatus();
    });

    await runSearchQuery(page, "cardiaque");
    const secondEnsure = await page.evaluate(async () => {
      return window.LouLocalSearch.runtime.ensureIndex();
    });

    expect(firstStatus.hasIndex).toBe(true);
    expect(secondEnsure.indexBuilt).toBeFalsy();
    expect(secondEnsure.cacheStatus).toBe("valid");
  });

  test("LS-F-04 rebuilds after manual cache purge", async ({ page }) => {
    await openProductChapter(page);
    await openSearchPanel(page);
    await runSearchQuery(page, "insuffisance");

    await page.evaluate(async () => {
      await window.LouLocalSearch.runtime.purge("cardio__234__2022__1");
    });
    await clearSearchCacheDb(page);

    await runSearchQuery(page, "cardiaque");
    const hits = await page.evaluate(() => window.LouLocalSearch.ui.getHits());
    expect(hits.length).toBeGreaterThan(0);
  });

  test("LS-F-05 offline search builds index without pre-existing search cache", async ({
    page,
    context,
  }) => {
    await openProductChapter(page);
    await clearSearchCacheDb(page);
    await context.setOffline(true);

    await openSearchPanel(page);
    await runSearchQuery(page, "insuffisance");

    const hits = await page.evaluate(() => window.LouLocalSearch.ui.getHits());
    expect(hits.length).toBeGreaterThan(0);

    const manifestOffline = await page.evaluate(async () => {
      const res = await fetch(
        "/library/releases/cardio__234__2022__1/manifest.json"
      );
      return res.ok;
    });
    expect(manifestOffline).toBe(true);
  });

  test("LS-F-06 offline search and navigation without network dependency", async ({
    page,
    context,
  }) => {
    await openProductChapter(page);
    await clearSearchCacheDb(page);
    await context.setOffline(true);

    await openSearchPanel(page);
    await runSearchQuery(page, "cardiaque");
    await selectSearchResultByAnchorKind(
      page,
      "element_block",
      "insuffisance"
    );

    expect(await activeTabViewId(page)).toBe("mental-model");
    await expect(page.locator(".search-hit-highlight")).toHaveCount(1, {
      timeout: 15_000,
    });
  });

  test("LS-F-07 navigate element_block in Modèle mental", async ({ page }) => {
    await openProductChapter(page);
    await openSearchPanel(page);
    await selectSearchResultByAnchorKind(
      page,
      "element_block",
      SEARCH_QUERIES.element_block
    );

    expect(await activeTabViewId(page)).toBe("mental-model");
    await expect(page.locator("#MM-pump-decompensation.search-hit-highlight")).toHaveCount(1, {
      timeout: 15_000,
    });
  });

  test("LS-F-08 navigate section_path in Collège officiel", async ({ page }) => {
    await openProductChapter(page);
    await openSearchPanel(page);
    await selectSearchResultByAnchorKind(
      page,
      "section_path",
      SEARCH_QUERIES.section_path
    );

    expect(await activeTabViewId(page)).toBe("college-official");
    await expect(page.locator(".college-official-body .search-hit-highlight")).toHaveCount(1);
  });

  test("LS-F-09 navigate question_id in QCM list", async ({ page }) => {
    await openProductChapter(page);
    await openSearchPanel(page);
    await selectSearchResultByAnchorKind(
      page,
      "question_id",
      SEARCH_QUERIES.question_id
    );

    expect(await activeTabViewId(page)).toBe("qcm");
    await expect(page.locator(".view-qcm-item.search-hit-highlight")).toHaveCount(1);
  });

  test("LS-F-10 navigate scenario_scroll in Cas cliniques", async ({ page }) => {
    await openProductChapter(page);
    await openSearchPanel(page);
    await selectSearchResultByAnchorKind(
      page,
      "scenario_scroll",
      SEARCH_QUERIES.scenario_scroll
    );

    expect(await activeTabViewId(page)).toBe("clinical-cases");
    await expect(page.locator("[data-scenario-id].search-hit-highlight")).toHaveCount(1);
  });

  test("LS-F-11 navigate manifest_alt alt text hit in Notions", async ({ page }) => {
    await openProductChapter(page);
    await openSearchPanel(page);
    await selectSearchResultByAnchorKind(
      page,
      "manifest_alt",
      SEARCH_QUERIES.manifest_alt
    );

    expect(await activeTabViewId(page)).toBe("notions");
    await expect(
      page.locator(
        '#MEC-oap.search-hit-highlight, .pedagogical-block[data-element="MEC-oap"].search-hit-highlight'
      )
    ).toHaveCount(1, { timeout: 15_000 });
  });

  test("LS-F-12 orphan anchor shows diagnostic without approximate navigation", async ({
    page,
  }) => {
    await openProductChapter(page);
    const result = await page.evaluate(async () => {
      return window.LouSearchNavigation.navigateToSearchHit(
        {
          release_id: "cardio__234__2022__1",
          viewId: "mental-model",
          anchor: { kind: "element_block", elementId: "does-not-exist-xyz" },
        },
        {
          releaseId: "cardio__234__2022__1",
          tabs: [...document.querySelectorAll(".tab")].map((tab) => ({
            viewId: tab.dataset.viewId,
            label: tab.textContent,
          })),
          showTab: async () => {},
        }
      );
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("LS-READER-ANCHOR-MISSING");
  });

  test("LS-F-13 rejects SearchHit from another release", async ({ page }) => {
    await openProductChapter(page);
    const result = await page.evaluate(async () => {
      return window.LouSearchNavigation.navigateToSearchHit(
        {
          release_id: "other__release__id",
          viewId: "mental-model",
          anchor: { kind: "element_block", elementId: "MM-pump-decompensation" },
        },
        {
          releaseId: "cardio__234__2022__1",
          tabs: [{ viewId: "mental-model", label: "Modèle mental" }],
          showTab: async () => {},
        }
      );
    });
    expect(result.ok).toBe(false);
    expect(result.code).toBe("LS-READER-RELEASE-MISMATCH");
  });

  test("LS-F-14 highlight clears on tab change", async ({ page }) => {
    await openProductChapter(page);
    await openSearchPanel(page);
    await selectSearchResultByAnchorKind(page, "element_block", "insuffisance");
    expect(await countSearchHighlights(page)).toBeGreaterThan(0);

    await closeSearchPanel(page);
    await page.evaluate(() => {
      const tab = [...document.querySelectorAll(".tab")].find((el) =>
        el.textContent.includes("Notions")
      );
      if (tab) {
        tab.click();
      }
    });
    await page.waitForFunction(() => window.LouApp?.whenTabReady);
    await page.evaluate(async () => {
      if (window.LouApp?.whenTabReady) {
        await window.LouApp.whenTabReady();
      }
    });
    expect(await countSearchHighlights(page)).toBe(0);
  });

  test("LS-F-15 search panel and query not restored after reload", async ({
    page,
  }) => {
    await openProductChapter(page);
    await openSearchPanel(page);
    await runSearchQuery(page, "insuffisance");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForSelector("#local-search-trigger:not([hidden])", {
      timeout: 30_000,
    });

    const state = await page.evaluate(() => window.LouLocalSearch?.ui?.getState?.());
    const inputValue = await page.locator("#local-search-input").inputValue();
    expect(state).toBe("closed");
    expect(inputValue).toBe("");
    await expect(page.locator("#local-search-root")).toBeHidden();
  });

  test("LS-F-16 learner snapshot export excludes Search domain", async ({
    page,
  }) => {
    await openProductChapter(page);
    await openSearchPanel(page);
    await runSearchQuery(page, "insuffisance");

    const snapshot = await exportLearnerSnapshot(page);
    const serialized = JSON.stringify(snapshot);
    expect(serialized.toLowerCase()).not.toContain("searchhit");
    expect(serialized.toLowerCase()).not.toContain("local-search");
    for (const domain of snapshot.body.domains) {
      expect(domain.domain_id).not.toMatch(/search/i);
    }
  });

  test("LS-F-17 keyboard and accessible status announcements", async ({ page }) => {
    await openProductChapter(page);
    await openSearchPanelViaKeyboard(page);
    await expect(page.locator("#local-search-input")).toBeFocused();

    await page.locator("#local-search-input").fill("a");
    await waitForSearchState(page, "empty");
    await expect(page.locator("#local-search-status")).toContainText("2 caractères");

    await runSearchQuery(page, "insuffisance");
    await expect(page.locator("#local-search-status")).toHaveAttribute(
      "aria-live",
      "polite"
    );

    await page.locator("#local-search-input").fill("zzzznotfound999");
    await waitForSearchState(page, "no-results");
    await expect(page.locator("#local-search-status")).toContainText("Aucun résultat");

    await closeSearchPanel(page);
    await expect(page.locator("#local-search-root")).toBeHidden();
  });

  test("LS-F-18 open search via header button", async ({ page }) => {
    await openProductChapter(page);
    await page.locator("#local-search-trigger").click();
    await expect(page.locator("#local-search-root")).toBeVisible();
  });

  test("LS-F-19 keyboard arrow navigates results list", async ({ page }) => {
    await openProductChapter(page);
    await openSearchPanel(page);
    await runSearchQuery(page, "insuffisance");
    expect(await page.evaluate(() => window.LouLocalSearch.ui.getSelectedIndex())).toBe(0);
    await page.locator("#local-search-input").press("ArrowDown");
    expect(await page.evaluate(() => window.LouLocalSearch.ui.getSelectedIndex())).toBe(1);
    await page.locator("#local-search-input").press("ArrowUp");
    expect(await page.evaluate(() => window.LouLocalSearch.ui.getSelectedIndex())).toBe(0);
  });
});
