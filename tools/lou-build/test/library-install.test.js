import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  attachReleaseIdentity,
  buildReleaseId,
} from "../lib/release-identity.js";
import {
  createEmptyCatalog,
  loadOrCreateCatalog,
  validateLibraryCatalog,
  catalogPath,
} from "../lib/library-catalog.js";
import {
  installPublishedRelease,
  copyReleaseToStaging,
  verifyPublicationDigest,
  ensureLibraryLayout,
} from "../lib/library-install.js";

/**
 * Minimal published Release for installer tests.
 * @param {string} root
 * @param {{ chapter?: string, edition?: number, publication_version?: number, body?: string }} opts
 */
function writeMiniRelease(root, opts = {}) {
  const chapter = opts.chapter || "cardio/234";
  const edition = opts.edition ?? 2022;
  const publication_version = opts.publication_version ?? 1;
  const body = opts.body || "college body\n";

  fs.mkdirSync(path.join(root, "source"), { recursive: true });
  fs.mkdirSync(path.join(root, "build"), { recursive: true });
  fs.writeFileSync(path.join(root, "source", "official-college.md"), body);
  fs.writeFileSync(path.join(root, "build", "traceability.json"), "{}\n");

  const manifest = {
    chapter,
    slug: "test-slug",
    title: "Test Package",
    specialty: "Cardiologie",
    source_edition: edition,
    college_source_path: "source/official-college.md",
    trace_index: "build/traceability.json",
    known_absent: [],
    projections: [],
    visuals: [],
  };
  attachReleaseIdentity(manifest, {
    chapterDir: root,
    packageConfig: { publication_version },
  });
  assert.equal(
    manifest.release_id,
    buildReleaseId(chapter, edition, publication_version)
  );
  fs.writeFileSync(
    path.join(root, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  return manifest;
}

describe("library catalog (D1-C)", () => {
  test("createEmptyCatalog has only contract root fields", () => {
    const c = createEmptyCatalog("lou-local");
    assert.deepEqual(Object.keys(c).sort(), [
      "active_by_chapter",
      "entries",
      "library_id",
      "schema_version",
      "updated_at",
    ]);
    assert.deepEqual(validateLibraryCatalog(c), []);
  });

  test("validateLibraryCatalog rejects unknown root fields", () => {
    const c = createEmptyCatalog();
    c.extra = true;
    assert.ok(validateLibraryCatalog(c).some((e) => e.includes("unknown root")));
  });
});

describe("library install (D1-C)", () => {
  let tmp;
  let libraryRoot;
  let releaseA;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-lib-"));
    libraryRoot = path.join(tmp, "library");
    releaseA = path.join(tmp, "release-a");
    writeMiniRelease(releaseA, { publication_version: 1, body: "v1\n" });
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("first installation creates catalog entry and package tree", () => {
    const result = installPublishedRelease(releaseA, libraryRoot);
    assert.equal(result.ok, true);
    assert.equal(result.idempotent, false);
    assert.equal(result.release_id, "cardio__234__2022__1");

    const catalog = loadOrCreateCatalog(libraryRoot);
    assert.equal(catalog.entries.length, 1);
    assert.equal(catalog.entries[0].status, "active");
    assert.equal(catalog.active_by_chapter["cardio/234"], "cardio__234__2022__1");
    assert.ok(
      fs.existsSync(path.join(libraryRoot, "packages", "cardio__234__2022__1", "manifest.json"))
    );
    assert.equal(
      fs.existsSync(path.join(libraryRoot, "packages", "cardio__234__2022__1", "package.meta.json")),
      false
    );
    assert.deepEqual(validateLibraryCatalog(catalog), []);
  });

  test("idempotent reinstall does not duplicate entries", () => {
    installPublishedRelease(releaseA, libraryRoot);
    const again = installPublishedRelease(releaseA, libraryRoot);
    assert.equal(again.idempotent, true);
    const catalog = loadOrCreateCatalog(libraryRoot);
    assert.equal(catalog.entries.length, 1);
    assert.equal(catalog.entries[0].status, "active");
  });

  test("new publication of same chapter archives the previous active release", () => {
    installPublishedRelease(releaseA, libraryRoot);

    const releaseB = path.join(tmp, "release-b");
    writeMiniRelease(releaseB, { publication_version: 2, body: "v2 content\n" });
    const result = installPublishedRelease(releaseB, libraryRoot);
    assert.equal(result.release_id, "cardio__234__2022__2");

    const catalog = loadOrCreateCatalog(libraryRoot);
    assert.equal(catalog.entries.length, 2);
    const v1 = catalog.entries.find((e) => e.release_id === "cardio__234__2022__1");
    const v2 = catalog.entries.find((e) => e.release_id === "cardio__234__2022__2");
    assert.equal(v1.status, "archived");
    assert.equal(v2.status, "active");
    assert.equal(catalog.active_by_chapter["cardio/234"], "cardio__234__2022__2");
    assert.ok(
      fs.existsSync(path.join(libraryRoot, "packages", "cardio__234__2022__1", "manifest.json")),
      "archived package files must be preserved"
    );
  });

  test("failed install leaves catalog empty (interrupted / no visibility)", () => {
    ensureLibraryLayout(libraryRoot);
    // No catalog yet — corrupt source digest after identity is valid by tampering artefact
    // while keeping stale content_digest in manifest.
    const manifestPath = path.join(releaseA, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    fs.writeFileSync(
      path.join(releaseA, "source", "official-college.md"),
      "tampered without republishing\n"
    );

    assert.throws(
      () => installPublishedRelease(releaseA, libraryRoot),
      /content_digest mismatch/
    );
    assert.equal(fs.existsSync(catalogPath(libraryRoot)), false);
    assert.equal(
      fs.existsSync(path.join(libraryRoot, "packages", manifest.release_id)),
      false
    );
  });

  test("staging verification catches corruption before rename", () => {
    ensureLibraryLayout(libraryRoot);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(releaseA, "manifest.json"), "utf8")
    );
    const staging = path.join(
      libraryRoot,
      "packages",
      ".staging",
      "corrupt-test"
    );
    copyReleaseToStaging(releaseA, staging, manifest);
    fs.writeFileSync(
      path.join(staging, "source", "official-college.md"),
      "corrupted stage\n"
    );
    assert.throws(
      () => verifyPublicationDigest(staging, manifest),
      /content_digest mismatch/
    );
    // Catalog still absent — package not visible.
    assert.equal(fs.existsSync(catalogPath(libraryRoot)), false);
  });

  test("rejects incoherent release_id on source manifest", () => {
    const manifestPath = path.join(releaseA, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.release_id = "forged-id";
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    assert.throws(
      () => installPublishedRelease(releaseA, libraryRoot),
      /invalid release identity|incoherent/
    );
  });
});
