/**
 * Offline Runtime shared primitives (D2-E).
 * Pure logic — safe for browser, Service Worker, and Node tests.
 */

export const RUNTIME_SCHEMA_VERSION = 1;
export const SHELL_CACHE_NAME = "lou-reader-shell-v1";
export const DEV_WARM_CACHE_NAME = "lou-reader-runtime-v1";

/** @typedef {'UNKNOWN_RELEASE_NAMESPACE' | 'INVALID_RESOURCE_LIST' | 'FORBIDDEN_PATH' | 'RESOURCE_FETCH_FAILED' | 'RESOURCE_MISSING' | 'DIGEST_MISMATCH' | 'PREPARATION_INCOMPLETE' | 'STORAGE_QUOTA_EXCEEDED' | 'RUNTIME_UNAVAILABLE'} OfflineRuntimeErrorCode */

export class OfflineRuntimeError extends Error {
  /**
   * @param {OfflineRuntimeErrorCode} code
   * @param {string} message
   * @param {{ cause?: unknown }} [options]
   */
  constructor(code, message, options = {}) {
    super(message);
    this.name = "OfflineRuntimeError";
    this.code = code;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export const META_ENTRY_PATH = "__lou-offline-meta.json";

export const SHELL_URLS = [
  "/demo/renderer/index.html",
  "/demo/renderer/styles.css",
  "/demo/renderer/config.js",
  "/demo/renderer/markdown.js",
  "/demo/renderer/learner-patrimony.js",
  "/demo/renderer/learner-store.js",
  "/demo/renderer/text-highlights.js",
  "/demo/renderer/caret-anchor.js",
  "/demo/renderer/inline-notes.js",
  "/demo/renderer/svg-loader.js",
  "/demo/renderer/inline-formatting.js",
  "/demo/renderer/blocks.js",
  "/demo/renderer/renderer.js",
  "/demo/renderer/app.js",
  "/demo/renderer/lib/marked.min.js",
  "/demo/renderer/lib/fonts/inter-latin.woff2",
  "/demo/renderer/composition/bootstrap.mjs",
  "/demo/renderer/composition/corpus-composition-v1.json",
  "/demo/renderer/composition/composition-engine.js",
  "/demo/renderer/composition/reading-view-model.js",
  "/demo/renderer/composition/navigation.js",
  "/demo/renderer/composition/composition-spec-schema.js",
  "/demo/renderer/product-bootstrap.mjs",
  "/demo/renderer/library/browser-package-access.js",
  "/demo/renderer/library/browser-offline-manager.js",
  "/demo/renderer/library/browser-offline-verify.js",
  "/demo/renderer/library/library-catalog-browser.js",
  "/demo/renderer/library/offline-state.js",
  "/demo/renderer/library/offline-runtime.js",
  "/demo/renderer/library/offline-runtime-shared.js",
  "/demo/renderer/library/offline-manager-runtime-bridge.js",
  "/demo/renderer/library/package-access-shared.js",
];

export const SHELL_PREFIX = "/demo/renderer/";
export const DEV_PACKAGE_PREFIX = "/01-learning/chapters/";
export const LIBRARY_RELEASES_PREFIX = "/library/releases/";

/**
 * @param {string} releaseId
 * @returns {string}
 */
export function buildReleaseNamespace(releaseId) {
  assertReleaseId(releaseId);
  return `lou-offline-${releaseId}-v${RUNTIME_SCHEMA_VERSION}`;
}

/**
 * @param {string} releaseId
 * @returns {string}
 */
export function buildReleaseStagingNamespace(releaseId) {
  return `${buildReleaseNamespace(releaseId)}-staging`;
}

/**
 * @param {string} releaseId
 * @returns {string}
 */
export function buildReleaseBackupNamespace(releaseId) {
  return `${buildReleaseNamespace(releaseId)}-backup`;
}

/**
 * @param {unknown} releaseId
 */
export function assertReleaseId(releaseId) {
  if (typeof releaseId !== "string" || !releaseId.trim()) {
    throw new OfflineRuntimeError(
      "UNKNOWN_RELEASE_NAMESPACE",
      `offline runtime: invalid release_id ${JSON.stringify(releaseId)}`
    );
  }
}

/**
 * @param {unknown} relativePath
 * @returns {string}
 */
export function normalizeReleaseResourcePath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim()) {
    throw new OfflineRuntimeError(
      "FORBIDDEN_PATH",
      `offline runtime: invalid resource path ${JSON.stringify(relativePath)}`
    );
  }
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    /^[A-Za-z]:[/\\]/.test(normalized)
  ) {
    throw new OfflineRuntimeError(
      "FORBIDDEN_PATH",
      `offline runtime: forbidden resource path ${JSON.stringify(relativePath)}`
    );
  }
  return normalized;
}

/**
 * @param {unknown} resources
 * @returns {Array<{ relativePath: string, url: string }>}
 */
export function validateResourceList(resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    throw new OfflineRuntimeError(
      "INVALID_RESOURCE_LIST",
      "offline runtime: resources must be a non-empty array"
    );
  }

  /** @type {Array<{ relativePath: string, url: string }>} */
  const normalized = [];
  const seen = new Set();

  for (const item of resources) {
    if (!item || typeof item !== "object") {
      throw new OfflineRuntimeError(
        "INVALID_RESOURCE_LIST",
        "offline runtime: each resource must be an object"
      );
    }
    const relativePath = normalizeReleaseResourcePath(item.relativePath);
    if (seen.has(relativePath)) {
      throw new OfflineRuntimeError(
        "INVALID_RESOURCE_LIST",
        `offline runtime: duplicate resource path ${relativePath}`
      );
    }
    seen.add(relativePath);

    if (typeof item.url !== "string" || !item.url.trim()) {
      throw new OfflineRuntimeError(
        "INVALID_RESOURCE_LIST",
        `offline runtime: resource ${relativePath} missing url`
      );
    }

    normalized.push({ relativePath, url: item.url });
  }

  return normalized;
}

/**
 * @param {string} pathname
 * @param {string} [libraryBasePath]
 * @returns {{ releaseId: string, relativePath: string } | null}
 */
export function parseReleaseScopedPath(pathname, libraryBasePath = "/library") {
  const base = libraryBasePath.replace(/\/+$/, "");
  const prefix = `${base}/releases/`;
  if (!pathname.startsWith(prefix)) {
    return null;
  }

  const rest = pathname.slice(prefix.length);
  const slash = rest.indexOf("/");
  if (slash === -1) {
    return null;
  }

  const releaseId = decodeURIComponent(rest.slice(0, slash));
  const relativePath = decodeURIComponent(rest.slice(slash + 1));
  if (!releaseId || !relativePath) {
    return null;
  }

  try {
    normalizeReleaseResourcePath(relativePath);
  } catch {
    return null;
  }

  return { releaseId, relativePath };
}

/**
 * @param {string} pathname
 */
export function isMonorepoDevPath(pathname) {
  return pathname.startsWith(DEV_PACKAGE_PREFIX);
}

/**
 * @param {string} pathname
 */
export function isShellPath(pathname) {
  return pathname.startsWith(SHELL_PREFIX);
}

/**
 * @param {string} releaseId
 * @param {string} contentDigest
 * @param {Array<{ relativePath: string, url: string }>} resources
 */
export function buildReleaseMetadata(releaseId, contentDigest, resources) {
  return {
    schema_version: RUNTIME_SCHEMA_VERSION,
    release_id: releaseId,
    content_digest: contentDigest,
    resources: resources.map((r) => r.relativePath).sort(),
    prepared_at: new Date().toISOString(),
  };
}

/**
 * @param {unknown} meta
 * @param {string} releaseId
 * @param {string} contentDigest
 */
export function metadataMatches(meta, releaseId, contentDigest) {
  return (
    meta &&
    typeof meta === "object" &&
    meta.release_id === releaseId &&
    meta.content_digest === contentDigest &&
    meta.schema_version === RUNTIME_SCHEMA_VERSION
  );
}

/**
 * @param {unknown} err
 * @returns {OfflineRuntimeError}
 */
export function toStorageQuotaError(err) {
  const message = err instanceof Error ? err.message : String(err);
  if (
    message.includes("QuotaExceeded") ||
    message.includes("quota") ||
    message.includes("QUOTA")
  ) {
    return new OfflineRuntimeError("STORAGE_QUOTA_EXCEEDED", message, {
      cause: err,
    });
  }
  return new OfflineRuntimeError("RUNTIME_UNAVAILABLE", message, { cause: err });
}
