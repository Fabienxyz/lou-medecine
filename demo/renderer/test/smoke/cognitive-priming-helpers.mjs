/** AP-F — Cognitive Priming smoke helpers (package 234, product mode). */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  openProductChapter,
  runSearchQuery,
  openSearchPanel,
  waitForSearchState,
  getSearchHits,
  activeTabViewId,
} from "./local-search-helpers.mjs";
import {
  productChapterUrl,
  RELEASE_ID_234,
  CHAPTER_ID,
  RENDERER_PATH,
} from "./fixtures.mjs";

export {
  openProductChapter,
  runSearchQuery,
  openSearchPanel,
  waitForSearchState,
  getSearchHits,
  activeTabViewId,
  productChapterUrl,
  RELEASE_ID_234,
  CHAPTER_ID,
};

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.join(
  HERE,
  "../fixtures/product-library/library.json"
);
export const CP_ARTIFACT_PATH = path.join(
  HERE,
  "../fixtures/product-library/packages/cardio__234__2022__1/build/cognitive-priming.v1.json"
);

export const CP_LABEL = "Amorçage cognitif";
export const CP_VIEW_ID = "cognitive-priming";
export const CP_BADGE =
  "Complément pédagogique (IA) — non issu du Collège";
export const CP_SUMMARY_SNIPPET = "débit insuffisant";
export const CP_AI_SNIPPET = "compensation utile";
export const CP_EDN_LABEL = "Hypertension artérielle";

export function loadPublishedArtifact() {
  return JSON.parse(fs.readFileSync(CP_ARTIFACT_PATH, "utf8"));
}

export async function openAmorçageTab(page) {
  await page.locator(".tab", { hasText: CP_LABEL }).click();
  await waitForAmorçageContent(page);
}

export async function waitForAmorçageContent(page) {
  await page.waitForFunction(
    () => {
      const body = document.querySelector(".cognitive-priming-body");
      return body && body.querySelector(".cp-profile");
    },
    { timeout: 30_000 }
  );
  await page.evaluate(async () => {
    if (window.LouApp?.whenTabReady) {
      await window.LouApp.whenTabReady();
    }
  });
}

export async function readAmorçageTabAvailability(page) {
  return page.evaluate((viewId) => {
    const tab = document.querySelector(`.tab[data-view-id="${viewId}"]`);
    return {
      exists: Boolean(tab),
      isActive: tab?.classList.contains("active") ?? false,
      planned: tab?.classList.contains("tab-planned") ?? false,
    };
  }, CP_VIEW_ID);
}

export async function readAmorçageDomSnapshot(page) {
  return page.evaluate(() => {
    const body = document.querySelector(".cognitive-priming-body");
    if (!body) {
      return null;
    }
    return {
      profile: Boolean(body.querySelector(".cp-profile")),
      comprehensionStars: body.querySelectorAll(".cp-profile-row")[0]
        ? body
            .querySelectorAll(".cp-profile-row")[0]
            .querySelectorAll(".cp-star--filled").length
        : 0,
      memorizationStars: body.querySelectorAll(".cp-profile-row")[1]
        ? body
            .querySelectorAll(".cp-profile-row")[1]
            .querySelectorAll(".cp-star--filled").length
        : 0,
      ednCount: body.querySelectorAll(".cp-edn-list li").length,
      navigableEdn: body.querySelectorAll(".cp-edn-ref--navigable").length,
      unavailableEdn: body.querySelectorAll(".cp-edn-ref--unavailable").length,
      aiBadge: body.querySelector(".cp-ai-badge")?.textContent?.trim() || null,
      summaryBullets: body.querySelectorAll(".cp-summary-list li").length,
      hasInterEdn: body.textContent.includes("Inter-EDN"),
      textSample: body.textContent.slice(0, 500),
    };
  });
}

export async function routeArtifactWithEdnTarget(page, chapterId) {
  const artifact = loadPublishedArtifact();
  artifact.prerequisites.edn_references = [
    {
      reference_id: "edn-smoke-target",
      chapter_id: chapterId,
      label: "Item smoke — cible EDN",
      item_label: "SMK",
    },
  ];
  artifact.prerequisites.ai_complements = [];
  const body = JSON.stringify(artifact);
  await page.route("**/*cognitive-priming.v1.json*", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body,
    })
  );
}

export async function routeCatalogWithExtraChapter(page, chapterId) {
  await page.route("**/library/library.json", async (route) => {
    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
    catalog.active_by_chapter = Object.assign({}, catalog.active_by_chapter, {
      [chapterId]: RELEASE_ID_234,
    });
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(catalog),
    });
  });
}

export async function routeManifestWithoutAmorçage(page) {
  await page.route(
    `**/library/releases/${RELEASE_ID_234}/manifest.json`,
    async (route) => {
      const response = await route.fetch();
      const manifest = await response.json();
      delete manifest.cognitive_priming_path;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(manifest),
      });
    }
  );
}

export async function clickFirstNavigableEdn(page) {
  const btn = page.locator(".cp-edn-ref--navigable").first();
  await btn.waitFor({ state: "visible", timeout: 15_000 });
  await btn.click();
}

export async function waitForAmorçagePlannedMessage(page) {
  await page.waitForFunction(() => {
    const status = document.querySelector(".content-status");
    return status && status.dataset.state === "planned";
  });
}

export async function selectAmorçageSearchHit(page, query) {
  await openSearchPanel(page);
  await runSearchQuery(page, query);
  await waitForSearchState(page, "results");
  const meta = await page.evaluate((q) => {
    const hits = window.LouLocalSearch?.ui?.getHits?.() || [];
    const index = hits.findIndex(
      (hit) =>
        hit.viewId === "cognitive-priming" &&
        hit.anchor?.kind === "view_entry"
    );
    return index >= 0 ? { index, hit: hits[index] } : null;
  }, query);
  if (!meta) {
    throw new Error(`No cognitive-priming view_entry hit for query: ${query}`);
  }
  await page.evaluate(async (index) => {
    await window.LouLocalSearch.ui.selectHit(index);
  }, meta.index);
  await page.waitForFunction(
    () =>
      document.querySelector(".tab.active")?.dataset?.viewId ===
      "cognitive-priming",
    { timeout: 30_000 }
  );
  await waitForAmorçageContent(page);
  return meta.hit;
}

export async function waitForProductChapterReady(page) {
  await page.waitForSelector(".tab", { timeout: 30_000 });
  await page.waitForFunction(
    () => document.querySelectorAll(".tab").length >= 7,
    { timeout: 30_000 }
  );
  await page.waitForFunction(() => Boolean(window.LouApp?.whenTabReady), {
    timeout: 30_000,
  });
  await page.evaluate(async () => {
    if (window.LouApp?.whenTabReady) {
      await window.LouApp.whenTabReady();
    }
  });
}

export async function waitForSessionView(page, viewId, timeoutMs = 15_000) {
  await page.waitForFunction(
    (targetViewId) =>
      document.querySelector(".tab.active")?.dataset?.viewId === targetViewId,
    viewId,
    { timeout: timeoutMs }
  );
}

export async function waitForPersistedSessionView(page, viewId, timeoutMs = 10_000) {
  await page.waitForFunction(
    async (args) => {
      const session = await window.LouLearnerStore?.getSessionForRelease?.(
        args.releaseId
      );
      return session?.viewId === args.viewId;
    },
    { releaseId: RELEASE_ID_234, viewId },
    { timeout: timeoutMs }
  );
}

export async function persistSessionOnAmorçage(page) {
  await page.locator(".tab", { hasText: CP_LABEL }).click();
  await waitForSessionView(page, CP_VIEW_ID);
  await waitForAmorçageContent(page);
  // CE-04 breadcrumb UI is deferred in Shell S1 — same commit event as D4 CE-04.
  await page.evaluate(async () => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (window.LouSessionResume?.persistCommitEvent) {
      await window.LouSessionResume.persistCommitEvent("INTERNAL_NAV_VALIDATED", {});
    }
  });
  await waitForPersistedSessionView(page, CP_VIEW_ID);
}

export function chapterUrlWithView(viewId) {
  return `${productChapterUrl()}&view=${encodeURIComponent(viewId)}`;
}
