/**
 * Browser Offline Manager (D2-G) — production runtime preparation and certification.
 * Sole component authorized to transition offline_status to offline_ready or failed.
 */
import {
  OFFLINE_STATUS,
  getCatalogOfflineStatus,
  transitionCatalogOfflineStatus,
} from "./offline-state.js";
import { collectDeclaredArtifactPaths } from "./package-access-shared.js";
import { OfflineRuntimeError, SHELL_CACHE_NAME } from "./offline-runtime-shared.js";
import { PackageAccessError } from "./package-access-shared.js";
import {
  createOfflineRuntime,
  createBrowserCacheStorage,
} from "./offline-runtime.js";
import { prepareReleaseViaRuntime } from "./offline-manager-runtime-bridge.js";
import {
  loadCatalogFromLibrary,
  mutateCatalogInLibrary,
} from "./library-catalog-browser.js";
import { verifyReleaseViaBrowserPackageAccess } from "./browser-offline-verify.js";

/** @typedef {'UNKNOWN_RELEASE' | 'MANIFEST_INCOHERENT' | 'ASSET_MISSING' | 'DIGEST_DIVERGENT' | 'INVALID_CATALOG' | 'RUNTIME_PREPARATION_FAILED' | 'CERTIFICATION_FAILED'} BrowserOfflineManagerErrorCode */

export class BrowserOfflineManagerError extends Error {
  /**
   * @param {BrowserOfflineManagerErrorCode} code
   * @param {string} message
   * @param {{ cause?: unknown }} [options]
   */
  constructor(code, message, options = {}) {
    super(message);
    this.name = "BrowserOfflineManagerError";
    this.code = code;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

/**
 * @param {{
 *   libraryBaseUrl: string,
 *   packageAccess: import("./browser-package-access.js").BrowserPackageAccess,
 *   fetch?: typeof fetch,
 *   runtime?: import("./offline-runtime.js").OfflineRuntime,
 * }} options
 */
export function createBrowserOfflineManager(options) {
  const libraryBaseUrl = options.libraryBaseUrl.replace(/\/+$/, "");
  if (!options.packageAccess) {
    throw new Error("browser offline manager: packageAccess is required");
  }
  const runtime =
    options.runtime ??
    createOfflineRuntime({
      storage: createBrowserCacheStorage(),
      libraryBasePath: new URL(libraryBaseUrl).pathname || "/library",
      allowDevPackageWarmCache: false,
      fetch: (...args) => (options.fetch ?? fetch)(...args),
    });
  const fetchFn = (...args) => (options.fetch ?? fetch)(...args);
  return new BrowserOfflineManager(
    libraryBaseUrl,
    options.packageAccess,
    runtime,
    fetchFn
  );
}

class BrowserOfflineManager {
  /**
   * @param {string} libraryBaseUrl
   * @param {import("./browser-package-access.js").BrowserPackageAccess} packageAccess
   * @param {import("./offline-runtime.js").OfflineRuntime} runtime
   * @param {typeof fetch} fetchFn
   */
  constructor(libraryBaseUrl, packageAccess, runtime, fetchFn) {
    this._libraryBaseUrl = libraryBaseUrl;
    this._packageAccess = packageAccess;
    this._runtime = runtime;
    this._fetch = fetchFn;
    /** @type {Map<string, Promise<{ releaseId: string, status: import("../../../tools/lou-build/lib/offline-state.js").OfflineStatus }>>} */
    this._inFlight = new Map();
  }

  /**
   * @param {string} releaseId
   * @returns {Promise<{ releaseId: string, status: import("../../../tools/lou-build/lib/offline-state.js").OfflineStatus }>}
   */
  prepareAndCertify(releaseId) {
    if (typeof releaseId !== "string" || !releaseId.trim()) {
      throw new BrowserOfflineManagerError(
        "UNKNOWN_RELEASE",
        `browser offline manager: invalid release_id ${JSON.stringify(releaseId)}`
      );
    }

    const existing = this._inFlight.get(releaseId);
    if (existing) {
      return existing;
    }

    const job = this._prepareAndCertifyInternal(releaseId).finally(() => {
      this._inFlight.delete(releaseId);
    });
    this._inFlight.set(releaseId, job);
    return job;
  }

  /**
   * @param {string} releaseId
   */
  async _prepareAndCertifyInternal(releaseId) {
    const catalog = await loadCatalogFromLibrary(this._libraryBaseUrl, this._fetch);
    this._requireCatalogEntry(catalog, releaseId);
    const currentStatus = getCatalogOfflineStatus(catalog, releaseId);

    if (currentStatus === OFFLINE_STATUS.OFFLINE_READY) {
      const manifest = await this._packageAccess.resolveManifest(releaseId);
      if (
        await this._runtime.hasRelease(
          releaseId,
          /** @type {string} */ (manifest.content_digest)
        )
      ) {
        return { releaseId, status: OFFLINE_STATUS.OFFLINE_READY };
      }
    }

    await this._persistTransition(releaseId, OFFLINE_STATUS.PREPARING);

    try {
      const manifest = await this._packageAccess.resolveManifest(releaseId);
      const contentDigest = manifest.content_digest;
      if (typeof contentDigest !== "string" || !contentDigest.trim()) {
        throw new BrowserOfflineManagerError(
          "MANIFEST_INCOHERENT",
          `browser offline manager: manifest content_digest missing for ${releaseId}`
        );
      }

      const declaredPaths = collectDeclaredArtifactPaths(manifest);

      if (!(await this._runtime.hasRelease(releaseId, contentDigest))) {
        await prepareReleaseViaRuntime(this._runtime, {
          releaseId,
          contentDigest,
          declaredPaths,
          resolveResourceUrl: async (rid, relativePath) => {
            if (relativePath === "manifest.json") {
              return this._packageAccess.resolveManifestUrl(rid);
            }
            const resolved = await this._packageAccess.resolveAssetUrl(
              rid,
              relativePath
            );
            return resolved.url;
          },
        });
      }

      const freshCatalog = await loadCatalogFromLibrary(
        this._libraryBaseUrl,
        this._fetch
      );
      await verifyReleaseViaBrowserPackageAccess(
        this._packageAccess,
        releaseId,
        freshCatalog
      );

      if (!(await this._runtime.hasRelease(releaseId, contentDigest))) {
        throw new BrowserOfflineManagerError(
          "RUNTIME_PREPARATION_FAILED",
          `browser offline manager: runtime incomplete after prepare for ${releaseId}`
        );
      }

      await this._persistTransition(releaseId, OFFLINE_STATUS.OFFLINE_READY);
      return { releaseId, status: OFFLINE_STATUS.OFFLINE_READY };
    } catch (err) {
      await this._persistTransition(releaseId, OFFLINE_STATUS.FAILED).catch(
        () => {}
      );
      throw toBrowserOfflineManagerError(err);
    }
  }

  /**
   * @param {string} releaseId
   * @param {import("../../../tools/lou-build/lib/offline-state.js").OfflineStatus} toStatus
   */
  async _persistTransition(releaseId, toStatus) {
    await mutateCatalogInLibrary(
      this._libraryBaseUrl,
      (catalog) => {
        transitionCatalogOfflineStatus(catalog, releaseId, toStatus);
      },
      this._fetch
    );
    this._packageAccess.invalidateCatalogCache?.();
    await this._cacheLibraryCatalogSnapshot();
  }

  async _cacheLibraryCatalogSnapshot() {
    const catalogPath = `${new URL(this._libraryBaseUrl).pathname.replace(/\/+$/, "")}/library.json`;
    const response = await this._fetch(`${this._libraryBaseUrl.replace(/\/+$/, "")}/library.json`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }
    const storage = this._runtime.getStorage();
    const cache = await storage.open(SHELL_CACHE_NAME);
    const body = new Uint8Array(await response.arrayBuffer());
    await cache.put(catalogPath, {
      body,
      contentType: "application/json",
    });
  }

  /**
   * @param {Record<string, unknown>} catalog
   * @param {string} releaseId
   */
  _requireCatalogEntry(catalog, releaseId) {
    const entry = catalog.entries.find((e) => e && e.release_id === releaseId);
    if (!entry) {
      throw new BrowserOfflineManagerError(
        "UNKNOWN_RELEASE",
        `browser offline manager: release not in catalog: ${releaseId}`
      );
    }
    return entry;
  }
}

/**
 * @param {unknown} err
 */
function toBrowserOfflineManagerError(err) {
  if (err instanceof BrowserOfflineManagerError) {
    return err;
  }

  if (err instanceof OfflineRuntimeError) {
    /** @type {Record<string, BrowserOfflineManagerErrorCode>} */
    const map = {
      DIGEST_MISMATCH: "DIGEST_DIVERGENT",
      RESOURCE_FETCH_FAILED: "ASSET_MISSING",
      RESOURCE_MISSING: "ASSET_MISSING",
      PREPARATION_INCOMPLETE: "RUNTIME_PREPARATION_FAILED",
      STORAGE_QUOTA_EXCEEDED: "RUNTIME_PREPARATION_FAILED",
      INVALID_RESOURCE_LIST: "MANIFEST_INCOHERENT",
      FORBIDDEN_PATH: "MANIFEST_INCOHERENT",
      RUNTIME_UNAVAILABLE: "RUNTIME_PREPARATION_FAILED",
    };
    const code = map[err.code] || "RUNTIME_PREPARATION_FAILED";
    return new BrowserOfflineManagerError(code, err.message, { cause: err });
  }

  if (err instanceof PackageAccessError) {
    /** @type {Record<string, BrowserOfflineManagerErrorCode>} */
    const map = {
      UNKNOWN_RELEASE: "UNKNOWN_RELEASE",
      UNKNOWN_CHAPTER: "UNKNOWN_RELEASE",
      INVALID_CATALOG: "INVALID_CATALOG",
      MANIFEST_MISSING: "MANIFEST_INCOHERENT",
      MANIFEST_INCOHERENT: "MANIFEST_INCOHERENT",
      UNDECLARED_ASSET: "MANIFEST_INCOHERENT",
      FORBIDDEN_PATH: "MANIFEST_INCOHERENT",
      ASSET_MISSING: "ASSET_MISSING",
    };
    const code = map[err.code] || "MANIFEST_INCOHERENT";
    return new BrowserOfflineManagerError(code, err.message, { cause: err });
  }

  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("content_digest")) {
    return new BrowserOfflineManagerError("DIGEST_DIVERGENT", message, {
      cause: err,
    });
  }

  return new BrowserOfflineManagerError("CERTIFICATION_FAILED", message, {
    cause: err,
  });
}
