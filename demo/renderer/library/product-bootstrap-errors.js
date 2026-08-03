/**
 * Product bootstrap error classification and learner-facing diagnostics (Phase 0.1-C).
 */
import { BrowserOfflineManagerError } from "./browser-offline-manager.js";
import { PackageAccessError } from "./package-access-shared.js";
import { OfflineRuntimeError } from "./offline-runtime-shared.js";

/** @typedef {import("./browser-offline-manager.js").BrowserOfflineManagerErrorCode | import("./package-access-shared.js").PackageAccessErrorCode | import("./offline-runtime-shared.js").OfflineRuntimeErrorCode | "UNKNOWN"} ProductBootstrapErrorCode */

/**
 * @param {unknown} err
 * @returns {ProductBootstrapErrorCode}
 */
export function classifyProductBootstrapError(err) {
  if (err instanceof BrowserOfflineManagerError) {
    return err.code;
  }
  if (err instanceof PackageAccessError) {
    /** @type {Record<string, ProductBootstrapErrorCode>} */
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
    return map[err.code] || "MANIFEST_INCOHERENT";
  }
  if (err instanceof OfflineRuntimeError) {
    /** @type {Record<string, ProductBootstrapErrorCode>} */
    const map = {
      DIGEST_MISMATCH: "DIGEST_DIVERGENT",
      RESOURCE_FETCH_FAILED: "ASSET_MISSING",
      RESOURCE_MISSING: "ASSET_MISSING",
      PREPARATION_INCOMPLETE: "RUNTIME_PREPARATION_FAILED",
      INVALID_RESOURCE_LIST: "MANIFEST_INCOHERENT",
      FORBIDDEN_PATH: "MANIFEST_INCOHERENT",
      RUNTIME_UNAVAILABLE: "RUNTIME_PREPARATION_FAILED",
      STORAGE_QUOTA_EXCEEDED: "RUNTIME_PREPARATION_FAILED",
      UNKNOWN_RELEASE_NAMESPACE: "UNKNOWN_RELEASE",
    };
    return map[err.code] || "RUNTIME_PREPARATION_FAILED";
  }

  const message = err instanceof Error ? err.message : String(err);
  if (message.includes("content_digest")) {
    return "DIGEST_DIVERGENT";
  }
  if (message.includes("fetch failed") || message.includes("404")) {
    return "ASSET_MISSING";
  }
  return "UNKNOWN";
}

/**
 * @param {unknown} err
 * @param {Record<string, string>} messages
 */
export function formatProductBootstrapError(err, messages) {
  const code = classifyProductBootstrapError(err);
  const detail = err instanceof Error ? err.message : String(err);
  const summary =
    messages[code] ||
    messages.UNKNOWN ||
    "Échec du démarrage en mode produit.";
  return `${summary} (${code}) — ${detail}`;
}
