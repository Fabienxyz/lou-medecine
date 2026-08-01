/**
 * library.json — operational catalog (LIBRARY-CATALOG-CONTRACT).
 * Sole discovery authority for installed Releases.
 */
import fs from "node:fs";
import path from "node:path";
import { buildReleaseId } from "./release-identity.js";

export const LIBRARY_SCHEMA_VERSION = 1;
export const DEFAULT_LIBRARY_ID = "lou-local";

const ROOT_KEYS = new Set([
  "schema_version",
  "library_id",
  "updated_at",
  "entries",
  "active_by_chapter",
]);

const ENTRY_KEYS = new Set([
  "release_id",
  "chapter",
  "edition",
  "publication_version",
  "status",
  "installed_at",
  "root",
  "manifest",
  "content_digest",
  "slug",
  "title",
  "specialty",
  "editorial_completeness",
]);

/**
 * @param {string} [libraryId]
 */
export function createEmptyCatalog(libraryId = DEFAULT_LIBRARY_ID) {
  return {
    schema_version: LIBRARY_SCHEMA_VERSION,
    library_id: libraryId,
    updated_at: new Date().toISOString(),
    entries: [],
    active_by_chapter: {},
  };
}

/**
 * @param {string} libraryRoot
 * @returns {string}
 */
export function catalogPath(libraryRoot) {
  return path.join(libraryRoot, "library.json");
}

/**
 * @param {string} libraryRoot
 * @param {string} [libraryId]
 */
export function loadOrCreateCatalog(libraryRoot, libraryId = DEFAULT_LIBRARY_ID) {
  const file = catalogPath(libraryRoot);
  if (!fs.existsSync(file)) {
    return createEmptyCatalog(libraryId);
  }
  let raw;
  try {
    raw = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`library catalog corrupted (unreadable JSON): ${message}`);
  }
  const errors = validateLibraryCatalog(raw);
  if (errors.length) {
    throw new Error(
      "library catalog corrupted:\n" + errors.map((e) => `  - ${e}`).join("\n")
    );
  }
  return raw;
}

/**
 * Atomic catalog persist: write temp then rename.
 * @param {string} libraryRoot
 * @param {Record<string, unknown>} catalog
 */
export function saveCatalogAtomic(libraryRoot, catalog) {
  catalog.updated_at = new Date().toISOString();
  const errors = validateLibraryCatalog(catalog);
  if (errors.length) {
    throw new Error(
      "refusing to write invalid library catalog:\n" +
        errors.map((e) => `  - ${e}`).join("\n")
    );
  }

  fs.mkdirSync(libraryRoot, { recursive: true });
  const target = catalogPath(libraryRoot);
  const tmp = path.join(
    libraryRoot,
    `.library.json.${process.pid}.${Date.now()}.tmp`
  );
  fs.writeFileSync(tmp, JSON.stringify(catalog, null, 2) + "\n");
  fs.renameSync(tmp, target);
}

/**
 * @param {unknown} catalog
 * @returns {string[]}
 */
export function validateLibraryCatalog(catalog) {
  const errors = [];
  if (!catalog || typeof catalog !== "object" || Array.isArray(catalog)) {
    return ["catalog must be a JSON object"];
  }

  for (const key of Object.keys(catalog)) {
    if (!ROOT_KEYS.has(key)) {
      errors.push(`unknown root field: ${key}`);
    }
  }

  if (catalog.schema_version !== LIBRARY_SCHEMA_VERSION) {
    errors.push(
      `schema_version must be ${LIBRARY_SCHEMA_VERSION} (got ${JSON.stringify(catalog.schema_version)})`
    );
  }
  if (typeof catalog.library_id !== "string" || !catalog.library_id.trim()) {
    errors.push("library_id must be a non-empty string");
  }
  if (typeof catalog.updated_at !== "string" || !catalog.updated_at.trim()) {
    errors.push("updated_at must be a non-empty ISO-8601 string");
  }
  if (!Array.isArray(catalog.entries)) {
    errors.push("entries must be an array");
  }
  if (
    !catalog.active_by_chapter ||
    typeof catalog.active_by_chapter !== "object" ||
    Array.isArray(catalog.active_by_chapter)
  ) {
    errors.push("active_by_chapter must be an object");
  }

  if (!Array.isArray(catalog.entries)) return errors;

  const seenIds = new Set();
  const activeByChapter = new Map();

  for (let i = 0; i < catalog.entries.length; i++) {
    const entry = catalog.entries[i];
    const prefix = `entries[${i}]`;
    if (!entry || typeof entry !== "object") {
      errors.push(`${prefix}: must be an object`);
      continue;
    }
    for (const key of Object.keys(entry)) {
      if (!ENTRY_KEYS.has(key)) {
        errors.push(`${prefix}: unknown field ${key}`);
      }
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

    if (entry.status !== "active" && entry.status !== "archived") {
      errors.push(`${prefix}: status must be active|archived`);
    }

    if (typeof entry.release_id === "string") {
      if (seenIds.has(entry.release_id)) {
        errors.push(`${prefix}: duplicate release_id ${entry.release_id}`);
      }
      seenIds.add(entry.release_id);

      try {
        const expected = buildReleaseId(
          entry.chapter,
          entry.edition,
          entry.publication_version
        );
        if (entry.release_id !== expected) {
          errors.push(
            `${prefix}: release_id incoherent (expected ${expected})`
          );
        }
      } catch (e) {
        errors.push(
          `${prefix}: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    }

    if (
      typeof entry.content_digest === "string" &&
      !/^sha256:[a-f0-9]{64}$/.test(entry.content_digest)
    ) {
      errors.push(`${prefix}: content_digest must be sha256:<64 hex>`);
    }

    if (entry.status === "active" && typeof entry.chapter === "string") {
      if (activeByChapter.has(entry.chapter)) {
        errors.push(
          `${prefix}: multiple active entries for chapter ${entry.chapter}`
        );
      }
      activeByChapter.set(entry.chapter, entry.release_id);
    }

    if (
      typeof entry.root === "string" &&
      entry.root !== `packages/${entry.release_id}`
    ) {
      errors.push(
        `${prefix}: root must be packages/<release_id> (got ${entry.root})`
      );
    }
    if (
      typeof entry.manifest === "string" &&
      entry.manifest !== `packages/${entry.release_id}/manifest.json`
    ) {
      errors.push(
        `${prefix}: manifest path must be packages/<release_id>/manifest.json`
      );
    }
  }

  if (
    catalog.active_by_chapter &&
    typeof catalog.active_by_chapter === "object"
  ) {
    for (const [chapter, releaseId] of Object.entries(
      catalog.active_by_chapter
    )) {
      if (activeByChapter.get(chapter) !== releaseId) {
        errors.push(
          `active_by_chapter[${chapter}] must match the sole active entry (${releaseId})`
        );
      }
      const entry = catalog.entries.find((e) => e.release_id === releaseId);
      if (!entry || entry.status !== "active") {
        errors.push(
          `active_by_chapter[${chapter}] points to non-active release_id`
        );
      }
    }
    for (const [chapter, releaseId] of activeByChapter) {
      if (catalog.active_by_chapter[chapter] !== releaseId) {
        errors.push(
          `active entry for ${chapter} missing from active_by_chapter`
        );
      }
    }
  }

  return errors;
}

/**
 * Build a catalog entry from a validated published manifest.
 * @param {Record<string, unknown>} manifest
 * @param {string} [installedAt]
 */
export function catalogEntryFromManifest(manifest, installedAt = new Date().toISOString()) {
  const releaseId = manifest.release_id;
  /** @type {Record<string, unknown>} */
  const entry = {
    release_id: releaseId,
    chapter: manifest.chapter,
    edition: Number(manifest.source_edition),
    publication_version: Number(manifest.publication_version),
    status: "active",
    installed_at: installedAt,
    root: `packages/${releaseId}`,
    manifest: `packages/${releaseId}/manifest.json`,
    content_digest: manifest.content_digest,
  };
  for (const key of ["slug", "title", "specialty", "editorial_completeness"]) {
    if (manifest[key] !== undefined && manifest[key] !== null) {
      entry[key] = manifest[key];
    }
  }
  return entry;
}
