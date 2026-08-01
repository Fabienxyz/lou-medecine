/**
 * Offline Manager — local availability certification (OFFLINE-COMPONENT-CONTRACT D2-C).
 * Orchestrates verification via Package Access; persists offline_status via library.json.
 * No browser cache, no Service Worker, no Reader.
 */
import path from "node:path";
import {
  loadOrCreateCatalog,
  saveCatalogAtomic,
  validateLibraryCatalog,
} from "./library-catalog.js";
import { verifyPublicationDigest } from "./library-install.js";
import {
  OFFLINE_STATUS,
  OfflineStateError,
  getCatalogOfflineStatus,
  transitionCatalogOfflineStatus,
} from "./offline-state.js";
import { collectDeclaredArtifactPaths } from "./release-identity.js";
import { PackageAccessError } from "./package-access.js";

/** @typedef {'UNKNOWN_RELEASE' | 'MANIFEST_INCOHERENT' | 'ASSET_MISSING' | 'DIGEST_DIVERGENT' | 'INVALID_TRANSITION' | 'INVALID_CATALOG'} OfflineManagerErrorCode */

export class OfflineManagerError extends Error {
  /**
   * @param {OfflineManagerErrorCode} code
   * @param {string} message
   * @param {{ cause?: unknown }} [options]
   */
  constructor(code, message, options = {}) {
    super(message);
    this.name = "OfflineManagerError";
    this.code = code;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

/**
 * @param {{ packageAccess: import("./package-access.js").PackageAccess, libraryRoot?: string, catalog?: string }} deps
 */
export function createOfflineManager({ packageAccess, libraryRoot, catalog }) {
  const root = libraryRoot ?? catalog;
  if (!packageAccess) {
    throw new Error("offline manager: packageAccess is required");
  }
  if (typeof root !== "string" || !root.trim()) {
    throw new Error("offline manager: libraryRoot (catalog) is required");
  }
  return new OfflineManager(packageAccess, path.resolve(root));
}

class OfflineManager {
  /**
   * @param {import("./package-access.js").PackageAccess} packageAccess
   * @param {string} libraryRoot
   */
  constructor(packageAccess, libraryRoot) {
    this._packageAccess = packageAccess;
    this._libraryRoot = libraryRoot;
    /** @type {Map<string, Promise<{ releaseId: string, status: string }>>} */
    this._inFlight = new Map();
  }

  /**
   * @param {string} releaseId
   * @returns {import("./offline-state.js").OfflineStatus}
   */
  getStatus(releaseId) {
    const catalog = this._loadCatalog();
    this._requireCatalogEntry(catalog, releaseId);
    return getCatalogOfflineStatus(catalog, releaseId);
  }

  /**
   * Read-only verification — does not change offline_status.
   * @param {string} releaseId
   * @returns {{ releaseId: string, declaredPaths: string[] }}
   */
  verify(releaseId) {
    return verifyInstalledReleaseAvailability({
      packageAccess: this._packageAccess,
      libraryRoot: this._libraryRoot,
      releaseId,
    });
  }

  /**
   * Certify local availability: preparing → offline_ready | failed.
   * Concurrent calls for the same release_id share one in-flight preparation.
   * @param {string} releaseId
   * @returns {Promise<{ releaseId: string, status: string }>}
   */
  prepare(releaseId) {
    if (typeof releaseId !== "string" || !releaseId.trim()) {
      throw new OfflineManagerError(
        "UNKNOWN_RELEASE",
        `offline manager: invalid release_id ${JSON.stringify(releaseId)}`
      );
    }

    const existing = this._inFlight.get(releaseId);
    if (existing) {
      return existing;
    }

    const job = this._prepareInternal(releaseId).finally(() => {
      this._inFlight.delete(releaseId);
    });
    this._inFlight.set(releaseId, job);
    return job;
  }

  /**
   * @param {string} releaseId
   */
  async _prepareInternal(releaseId) {
    let catalog = this._loadCatalog();
    this._requireCatalogEntry(catalog, releaseId);

    try {
      transitionCatalogOfflineStatus(catalog, releaseId, OFFLINE_STATUS.PREPARING);
      saveCatalogAtomic(this._libraryRoot, catalog);
    } catch (err) {
      throw toOfflineManagerError(err);
    }

    try {
      verifyInstalledReleaseAvailability({
        packageAccess: this._packageAccess,
        libraryRoot: this._libraryRoot,
        releaseId,
      });

      catalog = this._loadCatalog();
      transitionCatalogOfflineStatus(
        catalog,
        releaseId,
        OFFLINE_STATUS.OFFLINE_READY
      );
      saveCatalogAtomic(this._libraryRoot, catalog);
      return { releaseId, status: OFFLINE_STATUS.OFFLINE_READY };
    } catch (err) {
      this._finalizeFailed(releaseId);
      throw toOfflineManagerError(err);
    }
  }

  /**
   * @param {string} releaseId
   */
  _finalizeFailed(releaseId) {
    try {
      const catalog = this._loadCatalog();
      const current = getCatalogOfflineStatus(catalog, releaseId);
      if (current === OFFLINE_STATUS.PREPARING) {
        transitionCatalogOfflineStatus(catalog, releaseId, OFFLINE_STATUS.FAILED);
        saveCatalogAtomic(this._libraryRoot, catalog);
      }
    } catch {
      // Best-effort — root error remains the verification failure.
    }
  }

  /**
   * @returns {Record<string, unknown>}
   */
  _loadCatalog() {
    try {
      const catalog = loadOrCreateCatalog(this._libraryRoot);
      const errors = validateLibraryCatalog(catalog);
      if (errors.length) {
        throw new OfflineManagerError(
          "INVALID_CATALOG",
          "offline manager: library catalog incoherent:\n" +
            errors.map((e) => `  - ${e}`).join("\n")
        );
      }
      return catalog;
    } catch (err) {
      if (err instanceof OfflineManagerError) {
        throw err;
      }
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("library catalog corrupted")) {
        throw new OfflineManagerError("INVALID_CATALOG", message, { cause: err });
      }
      throw err;
    }
  }

  /**
   * @param {Record<string, unknown>} catalog
   * @param {string} releaseId
   */
  _requireCatalogEntry(catalog, releaseId) {
    const entry = catalog.entries.find((e) => e && e.release_id === releaseId);
    if (!entry) {
      throw new OfflineManagerError(
        "UNKNOWN_RELEASE",
        `offline manager: release not in catalog: ${releaseId}`
      );
    }
    return entry;
  }
}

/**
 * Enumerate declared artefacts via Package Access and verify local availability + digest.
 * @param {{
 *   packageAccess: import("./package-access.js").PackageAccess,
 *   libraryRoot: string,
 *   releaseId: string,
 * }} args
 * @returns {{ releaseId: string, declaredPaths: string[] }}
 */
export function verifyInstalledReleaseAvailability({
  packageAccess,
  libraryRoot,
  releaseId,
}) {
  if (typeof releaseId !== "string" || !releaseId.trim()) {
    throw new OfflineManagerError(
      "UNKNOWN_RELEASE",
      `offline manager: invalid release_id ${JSON.stringify(releaseId)}`
    );
  }

  /** @type {Record<string, unknown>} */
  let manifest;
  try {
    manifest = packageAccess.resolveManifest(releaseId);
  } catch (err) {
    throw toOfflineManagerError(err);
  }

  const declaredPaths = collectDeclaredArtifactPaths(manifest);
  for (const rel of declaredPaths) {
    try {
      packageAccess.resolveAsset(releaseId, rel);
    } catch (err) {
      throw toOfflineManagerError(err);
    }
  }

  let catalog;
  try {
    catalog = loadOrCreateCatalog(libraryRoot);
    const errors = validateLibraryCatalog(catalog);
    if (errors.length) {
      throw new OfflineManagerError(
        "INVALID_CATALOG",
        "offline manager: library catalog incoherent:\n" +
          errors.map((e) => `  - ${e}`).join("\n")
      );
    }
  } catch (err) {
    if (err instanceof OfflineManagerError) {
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("library catalog corrupted")) {
      throw new OfflineManagerError("INVALID_CATALOG", message, { cause: err });
    }
    throw err;
  }

  const entry = catalog.entries.find((e) => e && e.release_id === releaseId);
  if (!entry) {
    throw new OfflineManagerError(
      "UNKNOWN_RELEASE",
      `offline manager: release not in catalog: ${releaseId}`
    );
  }

  const packageRoot = path.join(libraryRoot, entry.root);
  try {
    verifyPublicationDigest(packageRoot, manifest);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new OfflineManagerError(
      "DIGEST_DIVERGENT",
      message.includes("content_digest")
        ? message
        : `offline manager: content_digest verification failed for ${releaseId}: ${message}`,
      { cause: err }
    );
  }

  if (entry.content_digest !== manifest.content_digest) {
    throw new OfflineManagerError(
      "DIGEST_DIVERGENT",
      `offline manager: catalog content_digest differs from manifest for ${releaseId}`
    );
  }

  return { releaseId, declaredPaths };
}

/**
 * @param {unknown} err
 * @returns {OfflineManagerError}
 */
function toOfflineManagerError(err) {
  if (err instanceof OfflineManagerError) {
    return err;
  }

  if (err instanceof OfflineStateError) {
    if (err.code === "INVALID_TRANSITION") {
      return new OfflineManagerError("INVALID_TRANSITION", err.message, {
        cause: err,
      });
    }
    if (err.code === "UNKNOWN_RELEASE") {
      return new OfflineManagerError("UNKNOWN_RELEASE", err.message, {
        cause: err,
      });
    }
  }

  if (err instanceof PackageAccessError) {
    /** @type {Record<string, OfflineManagerErrorCode>} */
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
    return new OfflineManagerError(code, err.message, { cause: err });
  }

  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("content_digest")) {
    return new OfflineManagerError("DIGEST_DIVERGENT", message, { cause: err });
  }

  return new OfflineManagerError("MANIFEST_INCOHERENT", message, { cause: err });
}
