/**
 * Package Access — read-only boundary between Reader and installed library (D1-D).
 * LIBRARY-CATALOG-CONTRACT §9 · ADR-006.
 *
 * Resolves Releases via library.json only — never scans packages/.
 */
import fs from "node:fs";
import path from "node:path";
import {
  loadOrCreateCatalog,
  validateLibraryCatalog,
} from "./library-catalog.js";
import {
  collectDeclaredArtifactPaths,
  validateReleaseIdentity,
} from "./release-identity.js";

/** @typedef {'UNKNOWN_RELEASE' | 'UNKNOWN_CHAPTER' | 'INVALID_CATALOG' | 'MANIFEST_MISSING' | 'MANIFEST_INCOHERENT' | 'UNDECLARED_ASSET' | 'FORBIDDEN_PATH' | 'ASSET_MISSING'} PackageAccessErrorCode */

export class PackageAccessError extends Error {
  /**
   * @param {PackageAccessErrorCode} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = "PackageAccessError";
    this.code = code;
  }
}

/**
 * @param {string} libraryRoot  LIBRARY_ROOT — injected at construction; not exposed to callers.
 * @returns {PackageAccess}
 */
export function createPackageAccess(libraryRoot) {
  return new PackageAccess(libraryRoot);
}

export class PackageAccess {
  /**
   * @param {string} libraryRoot
   */
  constructor(libraryRoot) {
    if (typeof libraryRoot !== "string" || !libraryRoot.trim()) {
      throw new Error("package access: libraryRoot is required");
    }
    this._libraryRoot = path.resolve(libraryRoot);
  }

  /**
   * Installed Releases known to the catalogue (no filesystem scan).
   * @returns {Array<Record<string, unknown>>}
   */
  listReleases() {
    const catalog = this._loadCatalog();
    return catalog.entries.map((entry) => publicReleaseSummary(entry));
  }

  /**
   * Active Release for a chapter (via active_by_chapter, not packages/ scan).
   * @param {string} chapter
   * @returns {Record<string, unknown>}
   */
  getActiveRelease(chapter) {
    if (typeof chapter !== "string" || !chapter.trim()) {
      throw new PackageAccessError(
        "UNKNOWN_CHAPTER",
        `package access: invalid chapter ${JSON.stringify(chapter)}`
      );
    }
    const catalog = this._loadCatalog();
    const releaseId = catalog.active_by_chapter[chapter];
    if (!releaseId) {
      throw new PackageAccessError(
        "UNKNOWN_CHAPTER",
        `package access: no active release for chapter ${chapter}`
      );
    }
    return publicReleaseSummary(this._requireEntry(releaseId));
  }

  /**
   * Published manifest for an installed Release.
   * @param {string} releaseId
   * @returns {Record<string, unknown>}
   */
  resolveManifest(releaseId) {
    const entry = this._requireEntry(releaseId);
    return this._readManifestForEntry(entry);
  }

  /**
   * Resolve a manifest-declared artefact (package-relative path).
   * @param {string} releaseId
   * @param {string} relativePath
   * @returns {{ releaseId: string, relativePath: string, absolutePath: string }}
   */
  resolveAsset(releaseId, relativePath) {
    const entry = this._requireEntry(releaseId);
    const manifest = this._readManifestForEntry(entry);
    const normalized = normalizePackageRelativePath(relativePath);

    const declared = new Set(collectDeclaredArtifactPaths(manifest));
    if (!declared.has(normalized)) {
      throw new PackageAccessError(
        "UNDECLARED_ASSET",
        `package access: artefact not declared by manifest: ${normalized}`
      );
    }

    const { absolutePath, relativePath: safeRelative } = resolvePackagePath(
      this._libraryRoot,
      entry,
      normalized
    );

    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isFile()) {
      throw new PackageAccessError(
        "ASSET_MISSING",
        `package access: declared artefact missing on disk: ${safeRelative}`
      );
    }

    return {
      releaseId: entry.release_id,
      relativePath: safeRelative,
      absolutePath,
    };
  }

  /** @returns {Record<string, unknown>} */
  _loadCatalog() {
    try {
      const catalog = loadOrCreateCatalog(this._libraryRoot);
      const errors = validateLibraryCatalog(catalog);
      if (errors.length) {
        throw new PackageAccessError(
          "INVALID_CATALOG",
          "package access: library catalog incoherent:\n" +
            errors.map((e) => `  - ${e}`).join("\n")
        );
      }
      return catalog;
    } catch (err) {
      if (err instanceof PackageAccessError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes("library catalog corrupted")) {
        throw new PackageAccessError("INVALID_CATALOG", message);
      }
      throw err;
    }
  }

  /**
   * @param {string} releaseId
   */
  _requireEntry(releaseId) {
    if (typeof releaseId !== "string" || !releaseId.trim()) {
      throw new PackageAccessError(
        "UNKNOWN_RELEASE",
        `package access: invalid release_id ${JSON.stringify(releaseId)}`
      );
    }
    const catalog = this._loadCatalog();
    const entry = catalog.entries.find((e) => e.release_id === releaseId);
    if (!entry) {
      throw new PackageAccessError(
        "UNKNOWN_RELEASE",
        `package access: release not in catalog: ${releaseId}`
      );
    }
    return entry;
  }

  /**
   * @param {Record<string, unknown>} entry
   * @returns {Record<string, unknown>}
   */
  _readManifestForEntry(entry) {
    const manifestRel = entry.manifest;
    if (typeof manifestRel !== "string" || !manifestRel.trim()) {
      throw new PackageAccessError(
        "INVALID_CATALOG",
        `package access: catalog entry missing manifest path for ${entry.release_id}`
      );
    }

    const manifestPath = path.join(this._libraryRoot, manifestRel);
    const packageRoot = path.join(this._libraryRoot, entry.root);
    assertPathContained(packageRoot, manifestPath, "FORBIDDEN_PATH");

    if (!fs.existsSync(manifestPath) || !fs.statSync(manifestPath).isFile()) {
      throw new PackageAccessError(
        "MANIFEST_MISSING",
        `package access: manifest missing for release ${entry.release_id}`
      );
    }

    /** @type {Record<string, unknown>} */
    let manifest;
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      throw new PackageAccessError(
        "MANIFEST_INCOHERENT",
        `package access: manifest unreadable for ${entry.release_id}: ${message}`
      );
    }

    const identityErrors = validateReleaseIdentity(manifest);
    if (identityErrors.length) {
      throw new PackageAccessError(
        "MANIFEST_INCOHERENT",
        `package access: manifest identity invalid for ${entry.release_id}:\n` +
          identityErrors.map((e) => `  - ${e}`).join("\n")
      );
    }

    if (manifest.release_id !== entry.release_id) {
      throw new PackageAccessError(
        "MANIFEST_INCOHERENT",
        `package access: manifest release_id "${manifest.release_id}" ` +
          `does not match catalog entry "${entry.release_id}"`
      );
    }

    if (manifest.chapter !== entry.chapter) {
      throw new PackageAccessError(
        "MANIFEST_INCOHERENT",
        `package access: manifest chapter "${manifest.chapter}" ` +
          `does not match catalog entry "${entry.chapter}"`
      );
    }

    if (Number(manifest.source_edition) !== Number(entry.edition)) {
      throw new PackageAccessError(
        "MANIFEST_INCOHERENT",
        `package access: manifest edition "${manifest.source_edition}" ` +
          `does not match catalog entry "${entry.edition}"`
      );
    }

    if (Number(manifest.publication_version) !== Number(entry.publication_version)) {
      throw new PackageAccessError(
        "MANIFEST_INCOHERENT",
        `package access: manifest publication_version "${manifest.publication_version}" ` +
          `does not match catalog entry "${entry.publication_version}"`
      );
    }

    return manifest;
  }
}

/**
 * Public Release view — no LIBRARY_ROOT paths, no catalogue internals.
 * @param {Record<string, unknown>} entry
 */
function publicReleaseSummary(entry) {
  /** @type {Record<string, unknown>} */
  const summary = {
    release_id: entry.release_id,
    chapter: entry.chapter,
    edition: entry.edition,
    publication_version: entry.publication_version,
    status: entry.status,
    installed_at: entry.installed_at,
    content_digest: entry.content_digest,
  };
  for (const key of ["slug", "title", "specialty", "editorial_completeness"]) {
    if (entry[key] !== undefined && entry[key] !== null) {
      summary[key] = entry[key];
    }
  }
  return summary;
}

/**
 * @param {string} relativePath
 * @returns {string}
 */
export function normalizePackageRelativePath(relativePath) {
  if (typeof relativePath !== "string" || !relativePath.trim()) {
    throw new PackageAccessError(
      "FORBIDDEN_PATH",
      `package access: invalid relative path ${JSON.stringify(relativePath)}`
    );
  }
  const normalized = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (
    !normalized ||
    normalized.includes("..") ||
    path.isAbsolute(normalized)
  ) {
    throw new PackageAccessError(
      "FORBIDDEN_PATH",
      `package access: forbidden relative path ${JSON.stringify(relativePath)}`
    );
  }
  return normalized;
}

/**
 * @param {string} libraryRoot
 * @param {Record<string, unknown>} entry
 * @param {string} relativePath  already normalized
 */
function resolvePackagePath(libraryRoot, entry, relativePath) {
  const packageRoot = path.join(libraryRoot, entry.root);
  const absolutePath = path.resolve(packageRoot, relativePath);
  assertPathContained(packageRoot, absolutePath, "FORBIDDEN_PATH");
  return {
    absolutePath,
    relativePath: path.relative(packageRoot, absolutePath).replace(/\\/g, "/"),
  };
}

/**
 * @param {string} packageRoot
 * @param {string} targetPath
 * @param {PackageAccessErrorCode} code
 */
function assertPathContained(packageRoot, targetPath, code) {
  const rel = path.relative(packageRoot, targetPath);
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new PackageAccessError(
      code,
      `package access: path escapes package root: ${targetPath}`
    );
  }
}
