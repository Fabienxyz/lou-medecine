/**
 * Product mode bootstrap (D2-G + Phase 0.1-B) — Browser Package Access + offline certification.
 *
 * Canonical consumption path: installed library, digest-aware auto-repair, no manual cache purge.
 */
import { createBrowserPackageAccess } from "./library/browser-package-access.js";
import { createBrowserOfflineManager } from "./library/browser-offline-manager.js";
import { buildReleaseScopedUrl } from "./library/package-access-shared.js";
import { loadCatalogFromLibrary } from "./library/library-catalog-browser.js";
import { OFFLINE_STATUS } from "./library/offline-state.js";
import { buildRestoreCatalogFacts } from "./library/restore-catalog-facts.js";
import {
  classifyProductBootstrapError,
  formatProductBootstrapError,
} from "./library/product-bootstrap-errors.js";

export { buildRestoreCatalogFacts, classifyProductBootstrapError, formatProductBootstrapError };

const params = new URLSearchParams(window.location.search);

/** Product mode: installed library via Browser Package Access (not CHAPTERS_ROOT). */
export const isProductMode =
  params.get("product") === "1" || params.get("library") === "1";

/**
 * @param {string} chapter
 */
export async function initProductMode(chapter) {
  if (!isProductMode) {
    return null;
  }

  const libraryBaseUrl = `${window.location.origin}/library`;
  const packageAccess = createBrowserPackageAccess({ libraryBaseUrl });
  const releaseSummary = await packageAccess.getActiveRelease(chapter);
  const releaseId = /** @type {string} */ (releaseSummary.release_id);

  window.LouConfig.enableProductMode({
    libraryBaseUrl,
    releaseId,
    packageAccess,
    buildReleaseScopedUrl,
  });

  const offlineManager = createBrowserOfflineManager({
    libraryBaseUrl,
    packageAccess,
  });

  const certification = await offlineManager.ensureReleaseReady(releaseId);
  const manifest = await packageAccess.resolveManifest(releaseId);

  return {
    releaseId,
    manifest,
    offlineStatus: certification.status,
    repaired: certification.repaired === true,
    libraryBaseUrl,
    packageAccess,
    offlineManager,
  };
}

/**
 * Read-only catalog status for tests and diagnostics.
 * @param {string} releaseId
 */
export async function readOfflineStatus(releaseId) {
  const libraryBaseUrl = `${window.location.origin}/library`;
  const catalog = await loadCatalogFromLibrary(libraryBaseUrl);
  const entry = catalog.entries.find((e) => e && e.release_id === releaseId);
  return entry ? entry.offline_status : null;
}

export { OFFLINE_STATUS };
