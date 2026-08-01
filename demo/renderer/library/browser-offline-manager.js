/**
 * Browser Offline Manager (D2-G/H) — production runtime preparation, certification,
 * repair, purge, and stale invalidation.
 * Sole component authorized to transition offline_status to offline_ready or failed.
 */
import {
  OFFLINE_STATUS,
  getCatalogOfflineStatus,
  setCatalogOfflineStatus,
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
   * Remove runtime namespace, re-prepare and re-certify (D2-H repair).
   * @param {string} releaseId
   */
  repair(releaseId) {
    return /** @type {Promise<{ releaseId: string, status: import("../../../tools/lou-build/lib/offline-state.js").OfflineStatus }>} */ (
      this._runExclusive(releaseId, () => this._repairInternal(releaseId))
    );
  }

  /**
   * Remove runtime namespace and reset offline_status to not_prepared (D2-H purge).
   * @param {string} releaseId
   */
  purge(releaseId) {
    return /** @type {Promise<{ releaseId: string, status: import("../../../tools/lou-build/lib/offline-state.js").OfflineStatus }>} */ (
      this._runExclusive(releaseId, () => this._purgeInternal(releaseId))
    );
  }

  /**
   * Assess whether a certified Release is stale relative to catalogue and runtime.
   * @param {string} releaseId
   */
  async detectStale(releaseId) {
    if (typeof releaseId !== "string" || !releaseId.trim()) {
      throw new BrowserOfflineManagerError(
        "UNKNOWN_RELEASE",
        `browser offline manager: invalid release_id ${JSON.stringify(releaseId)}`
      );
    }

    const catalog = await loadCatalogFromLibrary(this._libraryBaseUrl, this._fetch);
    const entry = this._requireCatalogEntry(catalog, releaseId);
    const catalogStatus = getCatalogOfflineStatus(catalog, releaseId);
    const manifest = await this._packageAccess.resolveManifest(releaseId);
    const runtimeMetadata = await this._runtime.getReleaseMetadata(releaseId);
    const catalogDigest = entry.content_digest;

    const hasCompleteRuntime =
      typeof catalogDigest === "string" &&
      (await this._runtime.hasRelease(releaseId, catalogDigest));

    return this._assessReleaseStale({
      catalogStatus,
      catalogDigest,
      manifestDigest: manifest.content_digest,
      runtimeMetadata,
      hasCompleteRuntime,
    });
  }

  /**
   * @param {{
   *   catalogStatus: import("./offline-state.js").OfflineStatus,
   *   catalogDigest: unknown,
   *   manifestDigest: unknown,
   *   runtimeMetadata: { content_digest?: string } | null,
   *   hasCompleteRuntime: boolean,
   * }} input
   */
  _assessReleaseStale(input) {
    if (input.catalogStatus !== OFFLINE_STATUS.OFFLINE_READY) {
      return { stale: false, recommendedStatus: null, reasons: [] };
    }

    /** @type {string[]} */
    const reasons = [];

    if (
      typeof input.catalogDigest === "string" &&
      typeof input.manifestDigest === "string" &&
      input.catalogDigest !== input.manifestDigest
    ) {
      reasons.push("CATALOG_MANIFEST_DIGEST_DIVERGENT");
    }

    if (!input.runtimeMetadata) {
      reasons.push("RUNTIME_NAMESPACE_MISSING");
    } else if (
      typeof input.catalogDigest === "string" &&
      input.runtimeMetadata.content_digest !== input.catalogDigest
    ) {
      reasons.push("RUNTIME_CATALOG_DIGEST_DIVERGENT");
    }

    if (!input.hasCompleteRuntime) {
      reasons.push("RUNTIME_INCOMPLETE");
    }

    if (reasons.length === 0) {
      return { stale: false, recommendedStatus: null, reasons: [] };
    }

    return {
      stale: true,
      recommendedStatus: OFFLINE_STATUS.FAILED,
      reasons,
    };
  }

  /**
   * Invalidate offline_ready Releases that fail stale checks (→ failed).
   * @param {string} releaseId
   */
  async invalidateIfStale(releaseId) {
    const assessment = await this.detectStale(releaseId);
    if (!assessment.stale || assessment.recommendedStatus !== OFFLINE_STATUS.FAILED) {
      return assessment;
    }

    const catalog = await loadCatalogFromLibrary(this._libraryBaseUrl, this._fetch);
    const status = getCatalogOfflineStatus(catalog, releaseId);
    if (status === OFFLINE_STATUS.OFFLINE_READY) {
      await this._persistTransition(releaseId, OFFLINE_STATUS.FAILED);
    }
    return assessment;
  }

  /**
   * @param {string} releaseId
   * @param {() => Promise<{ releaseId: string, status: import("../../../tools/lou-build/lib/offline-state.js").OfflineStatus }>} fn
   */
  _runExclusive(releaseId, fn) {
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

    const job = fn().finally(() => {
      this._inFlight.delete(releaseId);
    });
    this._inFlight.set(releaseId, job);
    return job;
  }

  /**
   * @param {string} releaseId
   */
  async _repairInternal(releaseId) {
    const catalog = await loadCatalogFromLibrary(this._libraryBaseUrl, this._fetch);
    this._requireCatalogEntry(catalog, releaseId);
    const status = getCatalogOfflineStatus(catalog, releaseId);
    if (status === OFFLINE_STATUS.OFFLINE_READY) {
      await this.invalidateIfStale(releaseId);
    }
    await this._runtime.removeRelease(releaseId);
    return this._prepareAndCertifyInternal(releaseId);
  }

  /**
   * @param {string} releaseId
   */
  async _purgeInternal(releaseId) {
    const catalog = await loadCatalogFromLibrary(this._libraryBaseUrl, this._fetch);
    this._requireCatalogEntry(catalog, releaseId);
    await this._runtime.removeRelease(releaseId);
    await this._persistDirectStatus(releaseId, OFFLINE_STATUS.NOT_PREPARED);
    return { releaseId, status: OFFLINE_STATUS.NOT_PREPARED };
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

  /**
   * @param {string} releaseId
   * @param {import("../../../tools/lou-build/lib/offline-state.js").OfflineStatus} status
   */
  async _persistDirectStatus(releaseId, status) {
    await mutateCatalogInLibrary(
      this._libraryBaseUrl,
      (catalog) => {
        setCatalogOfflineStatus(catalog, releaseId, status);
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
