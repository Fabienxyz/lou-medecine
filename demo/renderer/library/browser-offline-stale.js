/**
 * Stale detection for certified Releases (D2-H).
 * Pure assessment — no catalog writes, no runtime mutation.
 */
import { OFFLINE_STATUS } from "./offline-state.js";

/** @typedef {'RUNTIME_NAMESPACE_MISSING' | 'RUNTIME_INCOMPLETE' | 'RUNTIME_CATALOG_DIGEST_DIVERGENT' | 'CATALOG_MANIFEST_DIGEST_DIVERGENT' | 'PACKAGE_ASSETS_UNAVAILABLE'} StaleReason */

/**
 * @param {{
 *   catalogStatus: import("./offline-state.js").OfflineStatus,
 *   catalogDigest: unknown,
 *   manifestDigest: unknown,
 *   runtimeMetadata: { content_digest?: string } | null,
 *   hasCompleteRuntime: boolean,
 *   packageAssetsAvailable: boolean,
 * }} input
 * @returns {{ stale: boolean, recommendedStatus: import("./offline-state.js").OfflineStatus | null, reasons: StaleReason[] }}
 */
export function assessReleaseStale(input) {
  if (input.catalogStatus !== OFFLINE_STATUS.OFFLINE_READY) {
    return { stale: false, recommendedStatus: null, reasons: [] };
  }

  /** @type {StaleReason[]} */
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

  if (!input.packageAssetsAvailable) {
    reasons.push("PACKAGE_ASSETS_UNAVAILABLE");
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
