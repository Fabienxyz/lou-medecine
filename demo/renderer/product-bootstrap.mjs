/**
 * Product mode bootstrap (D2-G) — Browser Package Access + offline certification.
 */
import { createBrowserPackageAccess } from "./library/browser-package-access.js";
import { createBrowserOfflineManager } from "./library/browser-offline-manager.js";
import { buildReleaseScopedUrl } from "./library/package-access-shared.js";
import { loadCatalogFromLibrary } from "./library/library-catalog-browser.js";
import { OFFLINE_STATUS } from "./library/offline-state.js";

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

  const certification = await offlineManager.prepareAndCertify(releaseId);
  const manifest = await packageAccess.resolveManifest(releaseId);

  return {
    releaseId,
    manifest,
    offlineStatus: certification.status,
    libraryBaseUrl,
    packageAccess,
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