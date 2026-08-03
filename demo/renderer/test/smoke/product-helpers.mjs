/**
 * Shared helpers — Reader Product validation (mode produit, bibliothèque installée).
 * Référence : docs/testing/TEST_ARCHITECTURE_V1.md § Validation Reader Produit
 */

export {
  openProductChapter,
  waitForOfflineReady,
  waitForServiceWorker,
  ensureServiceWorkerOnPage,
  resetCatalogOfflineStatus,
} from "./local-search-helpers.mjs";

export { productChapterUrl, RELEASE_ID_234, CHAPTER_SLUG, VIEWS } from "./fixtures.mjs";

import { RELEASE_ID_234 as RELEASE_ID } from "./fixtures.mjs";

/** Wait for product bootstrap without requiring Local Search (consumption-path tests). */
export async function waitForProductBootstrap(page, timeoutMs = 120_000) {
  await page.waitForFunction(
    async (releaseId) => {
      if (!window.LouProductBootstrap?.readOfflineStatus) {
        return false;
      }
      const status = await window.LouProductBootstrap.readOfflineStatus(releaseId);
      return status === "offline_ready";
    },
    RELEASE_ID,
    { timeout: timeoutMs }
  );
  await page.waitForSelector(".tab", { timeout: 15_000 });
}
