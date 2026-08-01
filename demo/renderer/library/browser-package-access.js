/**
 * Browser Package Access (D2-D) — read-only Release resolution for Reader runtime.
 * Produces stable library-scoped URLs. No offline, Service Worker, or cache logic.
 */
import {
  PackageAccessError,
  normalizePackageRelativePath,
  publicReleaseSummary,
  validateCatalogForPackageAccess,
  validateManifestAgainstEntry,
  collectDeclaredArtifactPaths,
  buildReleaseScopedUrl,
} from "./package-access-shared.js";

/**
 * @param {{
 *   libraryBaseUrl: string,
 *   fetch?: typeof fetch,
 * }} options
 */
export function createBrowserPackageAccess(options) {
  return new BrowserPackageAccess(options);
}

export class BrowserPackageAccess {
  /**
   * @param {{ libraryBaseUrl: string, fetch?: typeof fetch }} options
   */
  constructor(options = {}) {
    if (!options.libraryBaseUrl || typeof options.libraryBaseUrl !== "string") {
      throw new Error("browser package access: libraryBaseUrl is required");
    }
    this._libraryBaseUrl = options.libraryBaseUrl.replace(/\/+$/, "");
    const fetchFn = options.fetch ?? globalThis.fetch;
    if (typeof fetchFn !== "function") {
      throw new Error("browser package access: fetch is required");
    }
    this._fetch = (...args) => fetchFn(...args);
    /** @type {Promise<Record<string, unknown>> | null} */
    this._catalogPromise = null;
    /** @type {Map<string, Promise<Record<string, unknown>>>} */
    this._manifestPromises = new Map();
  }

  /**
   * @returns {string}
   */
  catalogUrl() {
    return `${this._libraryBaseUrl}/library.json`;
  }

  /**
   * @returns {Promise<Array<Record<string, unknown>>>}
   */
  async listReleases() {
    const catalog = await this._loadCatalog();
    return catalog.entries.map((entry) => publicReleaseSummary(entry));
  }

  /**
   * @param {string} chapter
   * @returns {Promise<Record<string, unknown>>}
   */
  async getActiveRelease(chapter) {
    if (typeof chapter !== "string" || !chapter.trim()) {
      throw new PackageAccessError(
        "UNKNOWN_CHAPTER",
        `package access: invalid chapter ${JSON.stringify(chapter)}`
      );
    }
    const catalog = await this._loadCatalog();
    const releaseId = catalog.active_by_chapter[chapter];
    if (!releaseId) {
      throw new PackageAccessError(
        "UNKNOWN_CHAPTER",
        `package access: no active release for chapter ${chapter}`
      );
    }
    return publicReleaseSummary(this._findCatalogEntry(catalog, releaseId));
  }

  /**
   * Stable manifest URL for a catalogued Release.
   * @param {string} releaseId
   * @returns {Promise<string>}
   */
  async resolveManifestUrl(releaseId) {
    await this._requireEntry(releaseId);
    return this._buildManifestUrl(releaseId);
  }

  /**
   * Fetch and validate the published manifest for an installed Release.
   * @param {string} releaseId
   * @returns {Promise<Record<string, unknown>>}
   */
  async resolveManifest(releaseId) {
    await this._requireEntry(releaseId);
    return this._fetchManifest(releaseId);
  }

  /**
   * Resolve a declared artefact to a stable release-scoped URL.
   * @param {string} releaseId
   * @param {string} relativePath
   * @returns {Promise<{ releaseId: string, relativePath: string, url: string }>}
   */
  async resolveAssetUrl(releaseId, relativePath) {
    const normalized = normalizePackageRelativePath(relativePath);
    const entry = await this._requireEntry(releaseId);
    const manifest = await this._fetchManifest(releaseId);

    const declared = new Set(collectDeclaredArtifactPaths(manifest));
    if (!declared.has(normalized)) {
      throw new PackageAccessError(
        "UNDECLARED_ASSET",
        `package access: artefact not declared by manifest: ${normalized}`
      );
    }

    assertManifestPathWithinRelease(normalized);

    const url = this._buildReleaseScopedUrl(releaseId, normalized);
    await this._assertAssetAvailable(url, normalized);
    return {
      releaseId: entry.release_id,
      relativePath: normalized,
      url,
    };
  }

  /** Clear cached catalog after offline_status mutation (D2-G). */
  invalidateCatalogCache() {
    this._catalogPromise = null;
  }

  /**
   * @param {string} releaseId
   * @returns {string}
   */
  _buildManifestUrl(releaseId) {
    return this._buildReleaseScopedUrl(releaseId, "manifest.json");
  }

  /**
   * @param {string} releaseId
   * @param {string} relativePath normalized package-relative path
   * @returns {string}
   */
  _buildReleaseScopedUrl(releaseId, relativePath) {
    return buildReleaseScopedUrl(this._libraryBaseUrl, releaseId, relativePath);
  }

  /**
   * @param {string} releaseId
   */
  _assertValidReleaseId(releaseId) {
    if (typeof releaseId !== "string" || !releaseId.trim()) {
      throw new PackageAccessError(
        "UNKNOWN_RELEASE",
        `package access: invalid release_id ${JSON.stringify(releaseId)}`
      );
    }
  }

  /**
   * @returns {Promise<Record<string, unknown>>}
   */
  async _loadCatalog() {
    if (!this._catalogPromise) {
      this._catalogPromise = this._fetchCatalog();
    }
    return this._catalogPromise;
  }

  /**
   * @returns {Promise<Record<string, unknown>>}
   */
  async _fetchCatalog() {
    const url = this.catalogUrl();
    let response;
    try {
      response = await this._fetch(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new PackageAccessError(
        "INVALID_CATALOG",
        `package access: failed to load library catalog: ${message}`
      );
    }

    if (!response.ok) {
      throw new PackageAccessError(
        "INVALID_CATALOG",
        `package access: library catalog unavailable (${response.status})`
      );
    }

    /** @type {unknown} */
    let catalog;
    try {
      catalog = await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new PackageAccessError(
        "INVALID_CATALOG",
        `package access: library catalog unreadable: ${message}`
      );
    }

    const errors = validateCatalogForPackageAccess(catalog);
    if (errors.length) {
      throw new PackageAccessError(
        "INVALID_CATALOG",
        "package access: library catalog incoherent:\n" +
          errors.map((e) => `  - ${e}`).join("\n")
      );
    }

    return /** @type {Record<string, unknown>} */ (catalog);
  }

  /**
   * @param {string} releaseId
   * @returns {Promise<Record<string, unknown>>}
   */
  async _requireEntry(releaseId) {
    this._assertValidReleaseId(releaseId);
    const catalog = await this._loadCatalog();
    return this._findCatalogEntry(catalog, releaseId);
  }

  /**
   * @param {Record<string, unknown>} catalog
   * @param {string} releaseId
   */
  _findCatalogEntry(catalog, releaseId) {
    const entry = catalog.entries.find((e) => e && e.release_id === releaseId);
    if (!entry) {
      throw new PackageAccessError(
        "UNKNOWN_RELEASE",
        `package access: release not in catalog: ${releaseId}`
      );
    }
    return entry;
  }

  /**
   * @param {string} releaseId
   * @returns {Promise<Record<string, unknown>>}
   */
  async _fetchManifest(releaseId) {
    if (!this._manifestPromises.has(releaseId)) {
      this._manifestPromises.set(releaseId, this._loadManifest(releaseId));
    }
    return this._manifestPromises.get(releaseId);
  }

  /**
   * @param {string} releaseId
   * @returns {Promise<Record<string, unknown>>}
   */
  async _loadManifest(releaseId) {
    const entry = await this._requireEntry(releaseId);
    const manifestRel = entry.manifest;
    if (typeof manifestRel !== "string" || !manifestRel.trim()) {
      throw new PackageAccessError(
        "INVALID_CATALOG",
        `package access: catalog entry missing manifest path for ${entry.release_id}`
      );
    }

    assertCatalogManifestPath(entry, manifestRel);

    const url = this._buildManifestUrl(releaseId);
    let response;
    try {
      response = await this._fetch(url);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new PackageAccessError(
        "MANIFEST_MISSING",
        `package access: manifest fetch failed for ${releaseId}: ${message}`
      );
    }

    if (response.status === 404 || !response.ok) {
      throw new PackageAccessError(
        "MANIFEST_MISSING",
        `package access: manifest missing for release ${releaseId}`
      );
    }

    /** @type {unknown} */
    let manifest;
    try {
      manifest = await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new PackageAccessError(
        "MANIFEST_INCOHERENT",
        `package access: manifest unreadable for ${releaseId}: ${message}`
      );
    }

    const coherenceErrors = validateManifestAgainstEntry(
      /** @type {Record<string, unknown>} */ (manifest),
      entry
    );
    if (coherenceErrors.length) {
      throw new PackageAccessError(
        "MANIFEST_INCOHERENT",
        `package access: manifest identity invalid for ${releaseId}:\n` +
          coherenceErrors.map((e) => `  - ${e}`).join("\n")
      );
    }

    return /** @type {Record<string, unknown>} */ (manifest);
  }

  /**
   * @param {string} url
   * @param {string} relativePath
   */
  async _assertAssetAvailable(url, relativePath) {
    let response;
    try {
      response = await this._fetch(url, { method: "HEAD" });
    } catch {
      response = null;
    }

    if (!response || !response.ok) {
      try {
        response = await this._fetch(url, { method: "GET" });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new PackageAccessError(
          "ASSET_MISSING",
          `package access: declared artefact missing: ${relativePath} (${message})`
        );
      }
    }

    if (!response.ok) {
      throw new PackageAccessError(
        "ASSET_MISSING",
        `package access: declared artefact missing on disk: ${relativePath}`
      );
    }
  }
}

/**
 * @param {Record<string, unknown>} entry
 * @param {string} manifestRel
 */
function assertCatalogManifestPath(entry, manifestRel) {
  const normalized = manifestRel.replace(/\\/g, "/");
  const root = String(entry.root).replace(/\\/g, "/").replace(/\/+$/, "");
  const expectedSuffix = `${root}/manifest.json`;
  if (normalized !== expectedSuffix && !normalized.endsWith("/manifest.json")) {
    throw new PackageAccessError(
      "INVALID_CATALOG",
      `package access: catalog manifest path escapes release root for ${entry.release_id}`
    );
  }
  if (normalized.includes("..")) {
    throw new PackageAccessError(
      "FORBIDDEN_PATH",
      `package access: forbidden manifest path for ${entry.release_id}`
    );
  }
}

/**
 * @param {string} relativePath normalized package-relative path
 */
function assertManifestPathWithinRelease(relativePath) {
  if (relativePath.includes("..") || relativePath.startsWith("/")) {
    throw new PackageAccessError(
      "FORBIDDEN_PATH",
      `package access: path escapes package root: ${relativePath}`
    );
  }
}
