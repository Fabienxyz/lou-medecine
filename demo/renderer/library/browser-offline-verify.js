/**
 * Read-only offline verification via Browser Package Access (D2-G).
 */
import { collectDeclaredArtifactPaths } from "./package-access-shared.js";
import { PackageAccessError } from "./package-access-shared.js";

export class BrowserOfflineVerifyError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {{ cause?: unknown }} [options]
   */
  constructor(code, message, options = {}) {
    super(message);
    this.name = "BrowserOfflineVerifyError";
    this.code = code;
    if (options.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

/**
 * @param {import("./browser-package-access.js").BrowserPackageAccess} packageAccess
 * @param {string} releaseId
 * @param {Record<string, unknown>} catalog
 */
export async function verifyReleaseViaBrowserPackageAccess(
  packageAccess,
  releaseId,
  catalog
) {
  /** @type {Record<string, unknown>} */
  let manifest;
  try {
    manifest = await packageAccess.resolveManifest(releaseId);
  } catch (err) {
    throw toVerifyError(err);
  }

  const entry = catalog.entries.find((e) => e && e.release_id === releaseId);
  if (!entry) {
    throw new BrowserOfflineVerifyError(
      "UNKNOWN_RELEASE",
      `offline verify: release not in catalog: ${releaseId}`
    );
  }

  if (entry.content_digest !== manifest.content_digest) {
    throw new BrowserOfflineVerifyError(
      "DIGEST_DIVERGENT",
      `offline verify: catalog content_digest differs from manifest for ${releaseId}`
    );
  }

  const declaredPaths = collectDeclaredArtifactPaths(manifest);
  for (const rel of declaredPaths) {
    try {
      await packageAccess.resolveAssetUrl(releaseId, rel);
    } catch (err) {
      throw toVerifyError(err);
    }
  }

  return { releaseId, declaredPaths };
}

/**
 * @param {unknown} err
 */
function toVerifyError(err) {
  if (err instanceof BrowserOfflineVerifyError) {
    return err;
  }
  if (err instanceof PackageAccessError) {
    /** @type {Record<string, string>} */
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
    return new BrowserOfflineVerifyError(code, err.message, { cause: err });
  }
  const message = err instanceof Error ? err.message : String(err);
  return new BrowserOfflineVerifyError("MANIFEST_INCOHERENT", message, {
    cause: err,
  });
}
