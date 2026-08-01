/**
 * Atomic Library Installer (LIBRARY-CATALOG-CONTRACT / ADR-006).
 * Installs a published Release into LIBRARY_ROOT. No Reader / Package Access.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  catalogEntryFromManifest,
  loadOrCreateCatalog,
  saveCatalogAtomic,
} from "./library-catalog.js";
import {
  collectDeclaredArtifactPaths,
  computeContentDigest,
  validateReleaseIdentity,
} from "./release-identity.js";

/**
 * @param {string} libraryRoot
 */
export function ensureLibraryLayout(libraryRoot) {
  fs.mkdirSync(path.join(libraryRoot, "packages"), { recursive: true });
  fs.mkdirSync(path.join(libraryRoot, "packages", ".staging"), {
    recursive: true,
  });
}

/**
 * Verify staged/source tree matches the publication content_digest (check only).
 * @param {string} packageRoot
 * @param {Record<string, unknown>} manifest
 */
export function verifyPublicationDigest(packageRoot, manifest) {
  const expected = manifest.content_digest;
  if (typeof expected !== "string") {
    throw new Error("install: manifest content_digest missing");
  }
  const computed = computeContentDigest(packageRoot, manifest);
  if (computed !== expected) {
    throw new Error(
      `install: content_digest mismatch (publication=${expected}, verified=${computed})`
    );
  }
}

/**
 * Copy manifest + declared artefacts into staging root (package-relative layout).
 * @param {string} sourceDir
 * @param {string} stagingRoot
 * @param {Record<string, unknown>} manifest
 */
export function copyReleaseToStaging(sourceDir, stagingRoot, manifest) {
  fs.mkdirSync(stagingRoot, { recursive: true });
  const manifestDest = path.join(stagingRoot, "manifest.json");
  fs.copyFileSync(path.join(sourceDir, "manifest.json"), manifestDest);

  for (const rel of collectDeclaredArtifactPaths(manifest)) {
    const from = path.join(sourceDir, rel);
    const to = path.join(stagingRoot, rel);
    if (!fs.existsSync(from) || !fs.statSync(from).isFile()) {
      throw new Error(`install: missing declared artefact ${rel}`);
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }

  // Never write package.meta.json
  const forbidden = path.join(stagingRoot, "package.meta.json");
  if (fs.existsSync(forbidden)) {
    fs.unlinkSync(forbidden);
  }
}

/**
 * Install a published Release into the local library.
 *
 * Order (atomic visibility):
 *   copy → staging → verify identity + digest → rename into packages/<release_id>
 *   → update library.json
 *
 * @param {string} sourceChapterDir  published package directory (contains manifest.json)
 * @param {string} libraryRoot       LIBRARY_ROOT
 * @param {{ libraryId?: string, activate?: boolean }} [options]
 */
export function installPublishedRelease(
  sourceChapterDir,
  libraryRoot,
  options = {}
) {
  const { libraryId, activate = true } = options;
  const sourceDir = path.resolve(sourceChapterDir);
  const libRoot = path.resolve(libraryRoot);
  const sourceManifestPath = path.join(sourceDir, "manifest.json");

  if (!fs.existsSync(sourceManifestPath)) {
    throw new Error(`install: no manifest.json at ${sourceManifestPath}`);
  }

  /** @type {Record<string, unknown>} */
  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(sourceManifestPath, "utf8"));
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Error(`install: unreadable source manifest (${message})`);
  }

  // Do not mutate the source manifest — work on a clone for verification.
  const manifestView = structuredClone(manifest);
  const identityErrors = validateReleaseIdentity(manifestView);
  if (identityErrors.length) {
    throw new Error(
      "install: invalid release identity:\n" +
        identityErrors.map((e) => `  - ${e}`).join("\n")
    );
  }

  // Verify source tree before copying (fail fast; no catalog change).
  verifyPublicationDigest(sourceDir, manifestView);

  const releaseId = /** @type {string} */ (manifestView.release_id);
  ensureLibraryLayout(libRoot);

  const packagesDir = path.join(libRoot, "packages");
  const finalRoot = path.join(packagesDir, releaseId);
  const stagingRoot = path.join(
    packagesDir,
    ".staging",
    `${releaseId}-${crypto.randomUUID()}`
  );

  const catalog = loadOrCreateCatalog(libRoot, libraryId);
  const existingEntry = catalog.entries.find((e) => e.release_id === releaseId);

  try {
    if (fs.existsSync(finalRoot)) {
      const installedManifest = JSON.parse(
        fs.readFileSync(path.join(finalRoot, "manifest.json"), "utf8")
      );
      verifyPublicationDigest(finalRoot, installedManifest);
      if (installedManifest.content_digest !== manifestView.content_digest) {
        throw new Error(
          `install: packages/${releaseId} already exists with a different content_digest`
        );
      }
      // Idempotent reinstall: package tree already correct — refresh catalog only.
      applyCatalogActivation(catalog, manifestView, {
        activate,
        installedAt: existingEntry?.installed_at || new Date().toISOString(),
      });
      saveCatalogAtomic(libRoot, catalog);
      return {
        ok: true,
        release_id: releaseId,
        idempotent: true,
        libraryRoot: libRoot,
        root: `packages/${releaseId}`,
      };
    }

    copyReleaseToStaging(sourceDir, stagingRoot, manifestView);
    // Verify staged copy (still invisible to catalog).
    const stagedManifest = JSON.parse(
      fs.readFileSync(path.join(stagingRoot, "manifest.json"), "utf8")
    );
    // Ensure we did not alter identity on copy.
    if (JSON.stringify(stagedManifest) !== JSON.stringify(manifest)) {
      throw new Error("install: staged manifest differs from source");
    }
    verifyPublicationDigest(stagingRoot, stagedManifest);

    // Publish package tree atomically (same-filesystem rename).
    fs.renameSync(stagingRoot, finalRoot);

    applyCatalogActivation(catalog, manifestView, {
      activate,
      installedAt: new Date().toISOString(),
    });
    saveCatalogAtomic(libRoot, catalog);

    return {
      ok: true,
      release_id: releaseId,
      idempotent: false,
      libraryRoot: libRoot,
      root: `packages/${releaseId}`,
    };
  } catch (err) {
    // Leave catalog untouched; remove incomplete staging if present.
    if (fs.existsSync(stagingRoot)) {
      fs.rmSync(stagingRoot, { recursive: true, force: true });
    }
    throw err;
  }
}

/**
 * @param {Record<string, unknown>} catalog
 * @param {Record<string, unknown>} manifest
 * @param {{ activate: boolean, installedAt: string }} opts
 */
function applyCatalogActivation(catalog, manifest, opts) {
  const { activate, installedAt } = opts;
  const releaseId = /** @type {string} */ (manifest.release_id);
  const chapter = /** @type {string} */ (manifest.chapter);
  const entry = catalogEntryFromManifest(manifest, installedAt);
  entry.status = activate ? "active" : "archived";

  if (activate) {
    for (const e of catalog.entries) {
      if (e.chapter === chapter && e.release_id !== releaseId && e.status === "active") {
        e.status = "archived";
      }
    }
    catalog.active_by_chapter[chapter] = releaseId;
  } else if (catalog.active_by_chapter[chapter] === releaseId) {
    delete catalog.active_by_chapter[chapter];
  }

  const idx = catalog.entries.findIndex((e) => e.release_id === releaseId);
  if (idx === -1) {
    catalog.entries.push(entry);
  } else {
    // Preserve first installed_at and offline_status on idempotent refresh unless missing.
    const prev = catalog.entries[idx];
    entry.installed_at = prev.installed_at || installedAt;
    if (prev.offline_status !== undefined && prev.offline_status !== null) {
      entry.offline_status = prev.offline_status;
    }
    catalog.entries[idx] = entry;
  }

  // Drop stale active_by_chapter keys that no longer match an active entry.
  for (const [ch, rid] of Object.entries(catalog.active_by_chapter)) {
    const active = catalog.entries.find(
      (e) => e.release_id === rid && e.status === "active"
    );
    if (!active) delete catalog.active_by_chapter[ch];
  }
}
