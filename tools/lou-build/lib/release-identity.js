/**
 * Release identity for published Chapter Packages (ADR-006, LIBRARY-CATALOG-CONTRACT).
 * publication_version · release_id · content_digest (publication).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * @param {string} chapter
 * @param {unknown} edition
 * @param {unknown} publicationVersion
 * @returns {string}
 */
export function buildReleaseId(chapter, edition, publicationVersion) {
  if (typeof chapter !== "string" || !chapter.trim()) {
    throw new Error("release_id: chapter must be a non-empty string");
  }
  const editionN = normalizePositiveInt(edition, "edition");
  const versionN = normalizePositiveInt(publicationVersion, "publication_version");
  const chapterFs = chapter.replaceAll("/", "__");
  return `${chapterFs}__${editionN}__${versionN}`;
}

/**
 * Resolve publication_version for (chapter, edition).
 * Relative to the pair: first publication = 1; explicit config wins;
 * otherwise reuse previous manifest version for the same pair, else 1.
 *
 * @param {{
 *   chapter: string,
 *   edition: unknown,
 *   packageConfig?: Record<string, unknown>,
 *   previousManifest?: Record<string, unknown> | null,
 * }} args
 */
export function resolvePublicationVersion({
  chapter,
  edition,
  packageConfig = {},
  previousManifest = null,
}) {
  if (packageConfig.publication_version !== undefined) {
    return normalizePositiveInt(
      packageConfig.publication_version,
      "publication_version"
    );
  }

  const editionN = normalizePositiveInt(edition, "edition");
  if (
    previousManifest &&
    previousManifest.chapter === chapter &&
    Number(previousManifest.source_edition) === editionN &&
    previousManifest.publication_version !== undefined
  ) {
    return normalizePositiveInt(
      previousManifest.publication_version,
      "publication_version"
    );
  }

  return 1;
}

/**
 * Collect relative paths of artefacts declared by the manifest (publication tree).
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
  add(manifest.cognitive_priming_path);
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
 * Publication content digest — computed by the Fabrique, stored on the manifest.
 * Hashes the identity-bearing manifest (without content_digest) plus declared artefact bytes.
 *
 * @param {string} chapterDir
 * @param {Record<string, unknown>} manifestWithoutDigest
 * @returns {string} sha256:<hex>
 */
export function computeContentDigest(chapterDir, manifestWithoutDigest) {
  const forHash = { ...manifestWithoutDigest };
  delete forHash.content_digest;

  const hash = crypto.createHash("sha256");
  hash.update(stableStringify(forHash));
  hash.update("\n");

  for (const rel of collectDeclaredArtifactPaths(forHash)) {
    const abs = path.join(chapterDir, rel);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      throw new Error(`content_digest: declared artefact missing: ${rel}`);
    }
    hash.update(rel);
    hash.update("\0");
    hash.update(fs.readFileSync(abs));
    hash.update("\n");
  }

  return `sha256:${hash.digest("hex")}`;
}

/**
 * Attach publication_version, release_id, content_digest to a draft manifest.
 *
 * @param {Record<string, unknown>} manifest
 * @param {{
 *   chapterDir: string,
 *   packageConfig?: Record<string, unknown>,
 *   previousManifest?: Record<string, unknown> | null,
 * }} options
 */
export function attachReleaseIdentity(manifest, options) {
  const { chapterDir, packageConfig = {}, previousManifest = null } = options;
  const chapter = manifest.chapter;
  if (typeof chapter !== "string" || !chapter.trim()) {
    throw new Error("release identity: manifest.chapter is required");
  }
  const edition = manifest.source_edition;
  if (edition === undefined || edition === null || edition === "") {
    throw new Error("release identity: manifest.source_edition is required");
  }

  const publicationVersion = resolvePublicationVersion({
    chapter,
    edition,
    packageConfig,
    previousManifest,
  });
  const releaseId = buildReleaseId(chapter, edition, publicationVersion);

  manifest.publication_version = publicationVersion;
  manifest.release_id = releaseId;
  delete manifest.content_digest;

  manifest.content_digest = computeContentDigest(chapterDir, manifest);

  const errors = validateReleaseIdentity(manifest);
  if (errors.length) {
    throw new Error(
      "Release identity assembly failed:\n" + errors.join("\n")
    );
  }

  return manifest;
}

/**
 * Gate checks: presence and coherence of release identity fields.
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
 * @param {string} chapterDir
 * @returns {Record<string, unknown> | null}
 */
export function loadPreviousManifest(chapterDir) {
  const manifestPath = path.join(chapterDir, "manifest.json");
  if (!fs.existsSync(manifestPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  } catch {
    return null;
  }
}

function normalizePositiveInt(value, label) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`${label} must be an integer >= 1 (got ${JSON.stringify(value)})`);
  }
  return n;
}

/** Deterministic JSON for hashing (sorted object keys). */
function stableStringify(value) {
  return JSON.stringify(sortKeysDeep(value));
}

function sortKeysDeep(value) {
  if (Array.isArray(value)) {
    return value.map(sortKeysDeep);
  }
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = sortKeysDeep(value[key]);
    }
    return out;
  }
  return value;
}
