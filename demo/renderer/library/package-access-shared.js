/**
 * Shared Package Access primitives (D1-D / D2-D).
 * Pure logic — safe for browser and Node tests. No filesystem, no offline semantics.
 */

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
    isAbsolutePath(normalized)
  ) {
    throw new PackageAccessError(
      "FORBIDDEN_PATH",
      `package access: forbidden relative path ${JSON.stringify(relativePath)}`
    );
  }
  return normalized;
}

/**
 * @param {Record<string, unknown>} entry
 */
export function publicReleaseSummary(entry) {
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
 * @param {Record<string, unknown>} manifest
 * @returns {string[]}
 */
export function collectDeclaredArtifactPaths(manifest) {
  const paths = new Set();

  const add = (rel) => {
    if (typeof rel === "string" && rel.trim() && !rel.includes("..")) {
      paths.add(rel.replace(/\\/g, "/"));
    }
  };

  add(manifest.college_source_path);
  add(manifest.trace_index);

  for (const p of manifest.projections || []) {
    add(p?.path);
    if (p?.visuals && typeof p.visuals === "object") {
      for (const rel of Object.values(p.visuals)) add(rel);
    }
  }
  for (const v of manifest.visuals || []) add(v?.path);
  for (const q of manifest.questions || []) add(q?.path);
  for (const s of manifest.scenarios || []) add(s?.path);

  return [...paths].sort();
}

/**
 * @param {string} chapter
 * @param {unknown} edition
 * @param {unknown} publicationVersion
 * @returns {string}
 */
export function buildReleaseId(chapter, edition, publicationVersion) {
  const editionN = normalizePositiveInt(edition, "edition");
  const versionN = normalizePositiveInt(publicationVersion, "publication_version");
  const chapterFs = chapter.replaceAll("/", "__");
  return `${chapterFs}__${editionN}__${versionN}`;
}

/**
 * @param {Record<string, unknown>} manifest
 * @returns {string[]}
 */
export function validateReleaseIdentity(manifest) {
  const errors = [];
  if (!manifest || typeof manifest !== "object") {
    return ["release identity: manifest missing"];
  }

  if (typeof manifest.chapter !== "string" || !manifest.chapter.trim()) {
    errors.push("release identity: chapter missing");
  }
  if (
    manifest.source_edition === undefined ||
    manifest.source_edition === null ||
    manifest.source_edition === ""
  ) {
    errors.push("release identity: source_edition missing");
  }

  let publicationVersion;
  try {
    publicationVersion = normalizePositiveInt(
      manifest.publication_version,
      "publication_version"
    );
  } catch (e) {
    errors.push(e instanceof Error ? e.message : String(e));
  }

  if (typeof manifest.release_id !== "string" || !manifest.release_id.trim()) {
    errors.push("release identity: release_id missing");
  }

  if (
    typeof manifest.content_digest !== "string" ||
    !/^sha256:[a-f0-9]{64}$/.test(manifest.content_digest)
  ) {
    errors.push(
      "release identity: content_digest missing or not sha256:<64 hex>"
    );
  }

  if (
    errors.length === 0 &&
    typeof manifest.chapter === "string" &&
    publicationVersion !== undefined
  ) {
    const expected = buildReleaseId(
      manifest.chapter,
      manifest.source_edition,
      publicationVersion
    );
    if (manifest.release_id !== expected) {
      errors.push(
        `release identity: release_id "${manifest.release_id}" incoherent with triplet (expected "${expected}")`
      );
    }
  }

  return errors;
}

/**
 * Minimal catalogue validation for Package Access (ignores offline_status).
 * @param {unknown} catalog
 * @returns {string[]}
 */
export function validateCatalogForPackageAccess(catalog) {
  const errors = [];
  const rootKeys = new Set([
    "schema_version",
    "library_id",
    "updated_at",
    "entries",
    "active_by_chapter",
  ]);

  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
    return ["catalog must be a JSON object"];
  }

  for (const key of Object.keys(catalog)) {
    if (!rootKeys.has(key)) {
      errors.push(`unknown root field: ${key}`);
    }
  }

  if (catalog.schema_version !== 1) {
    errors.push(
      `schema_version must be 1 (got ${JSON.stringify(catalog.schema_version)})`
    );
  }

  for (const key of ["schema_version", "library_id", "entries", "active_by_chapter"]) {
    if (!(key in catalog)) {
      errors.push(`catalog: missing root field ${key}`);
    }
  }

  if (!Array.isArray(catalog.entries)) {
    errors.push("catalog: entries must be an array");
    return errors;
  }

  const seen = new Set();
  for (let i = 0; i < catalog.entries.length; i++) {
    const entry = catalog.entries[i];
    const prefix = `entries[${i}]`;
    if (!entry || typeof entry !== "object") {
      errors.push(`${prefix}: must be an object`);
      continue;
    }
    for (const req of [
      "release_id",
      "chapter",
      "edition",
      "publication_version",
      "status",
      "installed_at",
      "root",
      "manifest",
      "content_digest",
    ]) {
      if (entry[req] === undefined || entry[req] === null || entry[req] === "") {
        errors.push(`${prefix}: missing ${req}`);
      }
    }
    if (typeof entry.release_id === "string") {
      if (seen.has(entry.release_id)) {
        errors.push(`${prefix}: duplicate release_id ${entry.release_id}`);
      }
      seen.add(entry.release_id);
    }
  }

  return errors;
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {Record<string, unknown>} entry
 * @returns {string[]}
 */
export function validateManifestAgainstEntry(manifest, entry) {
  const errors = [];

  const identityErrors = validateReleaseIdentity(manifest);
  errors.push(...identityErrors);

  if (manifest.release_id !== entry.release_id) {
    errors.push(
      `package access: manifest release_id "${manifest.release_id}" ` +
        `does not match catalog entry "${entry.release_id}"`
    );
  }
  if (manifest.chapter !== entry.chapter) {
    errors.push(
      `package access: manifest chapter "${manifest.chapter}" ` +
        `does not match catalog entry "${entry.chapter}"`
    );
  }
  if (Number(manifest.source_edition) !== Number(entry.edition)) {
    errors.push(
      `package access: manifest edition "${manifest.source_edition}" ` +
        `does not match catalog entry "${entry.edition}"`
    );
  }
  if (Number(manifest.publication_version) !== Number(entry.publication_version)) {
    errors.push(
      `package access: manifest publication_version "${manifest.publication_version}" ` +
        `does not match catalog entry "${entry.publication_version}"`
    );
  }

  return errors;
}

/**
 * Stable release-scoped URL under the library base (no monorepo paths).
 * @param {string} libraryBaseUrl
 * @param {string} releaseId
 * @param {string} relativePath
 */
export function buildReleaseScopedUrl(libraryBaseUrl, releaseId, relativePath) {
  const base = libraryBaseUrl.replace(/\/+$/, "");
  const normalized = normalizePackageRelativePath(relativePath);
  const encodedPath = normalized
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/releases/${encodeURIComponent(releaseId)}/${encodedPath}`;
}

/**
 * @param {string} path
 */
function isAbsolutePath(path) {
  return path.startsWith("/") || /^[A-Za-z]:[/\\]/.test(path);
}

/**
 * @param {unknown} value
 * @param {string} label
 */
function normalizePositiveInt(value, label) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`${label} must be an integer >= 1 (got ${JSON.stringify(value)})`);
  }
  return n;
}
