/**
 * Offline Manager (Node) — runtime preparation and verification (D2-C / D2-F).
 * Prepares optional Node runtime storage and verifies installed releases via Package Access.
 * Does not certify offline_status — browser certification is D2-G.
 */
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  loadOrCreateCatalog,
  validateLibraryCatalog,
} from "./library-catalog.js";
import { verifyPublicationDigest } from "./library-install.js";
import {
  OfflineStateError,
  getCatalogOfflineStatus,
} from "./offline-state.js";
import { collectDeclaredArtifactPaths } from "./release-identity.js";
import { PackageAccessError } from "./package-access.js";
import { prepareReleaseViaRuntime } from "./offline-manager-runtime-bridge.js";
import { OfflineRuntimeError } from "../../../demo/renderer/library/offline-runtime-shared.js";

/** @typedef {'UNKNOWN_RELEASE' | 'MANIFEST_INCOHERENT' | 'ASSET_MISSING' | 'DIGEST_DIVERGENT' | 'INVALID_TRANSITION' | 'INVALID_CATALOG' | 'RUNTIME_PREPARATION_FAILED'} OfflineManagerErrorCode */

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
 * @param {{
 *   packageAccess: import("./package-access.js").PackageAccess,
 *   libraryRoot?: string,
 *   catalog?: string,
 *   runtime?: import("../../../demo/renderer/library/offline-runtime.js").OfflineRuntime,
 * }} deps
 */
export function createOfflineManager({
  packageAccess,
  libraryRoot,
  catalog,
  runtime,
}) {
  const root = libraryRoot ?? catalog;
  if (!packageAccess) {
    throw new Error("offline manager: packageAccess is required");
  }
  if (typeof root !== "string" || !root.trim()) {
    throw new Error("offline manager: libraryRoot (catalog) is required");
  }
  if (!runtime) {
    throw new Error("offline manager: runtime is required");
  }
  return new OfflineManager(packageAccess, path.resolve(root), runtime);
}

class OfflineManager {
  /**
   * @param {import("./package-access.js").PackageAccess} packageAccess
   * @param {string} libraryRoot
   * @param {import("../../../demo/renderer/library/offline-runtime.js").OfflineRuntime} runtime
   */
  constructor(packageAccess, libraryRoot, runtime) {
    this._packageAccess = packageAccess;
    this._libraryRoot = libraryRoot;
    this._runtime = runtime;
    /** @type {Map<string, Promise<{ releaseId: string, runtimePrepared: boolean }>>} */
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
   * Prepare Node runtime storage and verify the installed release.
   * Never reads or writes offline_status.
   * @param {string} releaseId
   * @returns {Promise<{ releaseId: string, runtimePrepared: boolean }>}
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
    try {
      const catalog = this._loadCatalog();
      this._requireCatalogEntry(catalog, releaseId);

      const { declaredPaths, contentDigest } =
        this._resolveRuntimePrepareInputs(releaseId);

      let runtimePrepared = false;
      if (!(await this._runtime.hasRelease(releaseId, contentDigest))) {
        await prepareReleaseViaRuntime(this._runtime, {
          releaseId,
          contentDigest,
          declaredPaths,
          resolveResourceUrl: (rid, relativePath) =>
            this._resolveRuntimeResourceUrl(rid, relativePath),
        });
        runtimePrepared = true;
      }

      verifyInstalledReleaseAvailability({
        packageAccess: this._packageAccess,
        libraryRoot: this._libraryRoot,
        releaseId,
      });

      return { releaseId, runtimePrepared };
    } catch (err) {
      throw toOfflineManagerError(err);
    }
  }

  /**
   * @param {string} releaseId
   * @param {string} relativePath
   */
  _resolveRuntimeResourceUrl(releaseId, relativePath) {
    const normalized = relativePath.replace(/\\/g, "/");
    if (normalized === "manifest.json") {
      const catalog = this._loadCatalog();
      const entry = this._requireCatalogEntry(catalog, releaseId);
      const manifestPath = path.join(this._libraryRoot, entry.manifest);
      return pathToFileURL(manifestPath).href;
    }
    return pathToFileURL(
      this._packageAccess.resolveAsset(releaseId, normalized).absolutePath
    ).href;
  }

  /**
   * Runtime inputs only — no offline_status, no library.json writes.
   * @param {string} releaseId
   */
  _resolveRuntimePrepareInputs(releaseId) {
    const manifest = this._packageAccess.resolveManifest(releaseId);
    const contentDigest = manifest.content_digest;
    if (typeof contentDigest !== "string" || !contentDigest.trim()) {
      throw new OfflineManagerError(
        "MANIFEST_INCOHERENT",
        `offline manager: manifest content_digest missing for ${releaseId}`
      );
    }
    return {
      declaredPaths: collectDeclaredArtifactPaths(manifest),
      contentDigest,
    };
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

  if (err instanceof OfflineRuntimeError) {
    /** @type {Record<string, OfflineManagerErrorCode>} */
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
    return new OfflineManagerError(code, err.message, { cause: err });
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
