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
  catalogPath,
} from "../lib/library-catalog.js";
import { installPublishedRelease } from "../lib/library-install.js";
import {
  createPackageAccess,
  PackageAccessError,
  normalizePackageRelativePath,
} from "../lib/package-access.js";

/**
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

describe("package access (D1-D)", () => {
  let tmp;
  let libraryRoot;
  let releaseDir;
  /** @type {import("../lib/package-access.js").PackageAccess} */
  let access;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-pa-"));
    libraryRoot = path.join(tmp, "library");
    releaseDir = path.join(tmp, "release");
    writeMiniRelease(releaseDir);
    installPublishedRelease(releaseDir, libraryRoot);
    access = createPackageAccess(libraryRoot);
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("listReleases reads from catalog without scanning packages/", () => {
    // Orphan package not in catalog — must not appear in listReleases.
    const orphanId = "orphan__9999__1";
    const orphanRoot = path.join(libraryRoot, "packages", orphanId);
    fs.mkdirSync(orphanRoot, { recursive: true });
    fs.writeFileSync(
      path.join(orphanRoot, "manifest.json"),
      JSON.stringify({ chapter: "orphan", release_id: orphanId }) + "\n"
    );

    const releases = access.listReleases();
    assert.equal(releases.length, 1);
    assert.equal(releases[0].release_id, "cardio__234__2022__1");
    assert.equal(releases[0].chapter, "cardio/234");
    assert.equal(releases[0].status, "active");
    assert.equal("root" in releases[0], false);
    assert.equal("manifest" in releases[0], false);
  });

  test("getActiveRelease resolves via active_by_chapter", () => {
    const active = access.getActiveRelease("cardio/234");
    assert.equal(active.release_id, "cardio__234__2022__1");
    assert.equal(active.status, "active");
  });

  test("resolveManifest returns published manifest", () => {
    const manifest = access.resolveManifest("cardio__234__2022__1");
    assert.equal(manifest.chapter, "cardio/234");
    assert.equal(manifest.release_id, "cardio__234__2022__1");
    assert.equal(manifest.college_source_path, "source/official-college.md");
  });

  test("resolveAsset returns declared artefact path", () => {
    const asset = access.resolveAsset(
      "cardio__234__2022__1",
      "source/official-college.md"
    );
    assert.equal(asset.releaseId, "cardio__234__2022__1");
    assert.equal(asset.relativePath, "source/official-college.md");
    assert.ok(fs.existsSync(asset.absolutePath));
    assert.ok(asset.absolutePath.endsWith("source/official-college.md"));
  });

  test("resolveAsset rejects undeclared artefact", () => {
    assert.throws(
      () => access.resolveAsset("cardio__234__2022__1", "secret/undeclared.md"),
      (err) =>
        err instanceof PackageAccessError && err.code === "UNDECLARED_ASSET"
    );
  });

  test("resolveAsset rejects parent traversal", () => {
    assert.throws(
      () => access.resolveAsset("cardio__234__2022__1", "../outside.md"),
      (err) =>
        err instanceof PackageAccessError && err.code === "FORBIDDEN_PATH"
    );
    assert.throws(
      () => access.resolveAsset("cardio__234__2022__1", "source/../../outside.md"),
      (err) =>
        err instanceof PackageAccessError && err.code === "FORBIDDEN_PATH"
    );
  });

  test("normalizePackageRelativePath rejects .. segments", () => {
    assert.throws(
      () => normalizePackageRelativePath(".."),
      (err) =>
        err instanceof PackageAccessError && err.code === "FORBIDDEN_PATH"
    );
  });

  test("unknown release is rejected explicitly", () => {
    assert.throws(
      () => access.resolveManifest("nonexistent__2022__1"),
      (err) =>
        err instanceof PackageAccessError && err.code === "UNKNOWN_RELEASE"
    );
    assert.throws(
      () => access.getActiveRelease("cardio/999"),
      (err) =>
        err instanceof PackageAccessError && err.code === "UNKNOWN_CHAPTER"
    );
  });

  test("invalid catalog is rejected explicitly", () => {
    const catalog = JSON.parse(
      fs.readFileSync(catalogPath(libraryRoot), "utf8")
    );
    catalog.extra_field = true;
    fs.writeFileSync(catalogPath(libraryRoot), JSON.stringify(catalog, null, 2) + "\n");

    assert.throws(
      () => access.listReleases(),
      (err) =>
        err instanceof PackageAccessError && err.code === "INVALID_CATALOG"
    );
  });

  test("corrupted catalog JSON is rejected explicitly", () => {
    fs.writeFileSync(catalogPath(libraryRoot), "{ not json\n");
    assert.throws(
      () => access.listReleases(),
      (err) =>
        err instanceof PackageAccessError && err.code === "INVALID_CATALOG"
    );
  });

  test("manifest incoherent with catalog is rejected", () => {
    const manifestPath = path.join(
      libraryRoot,
      "packages",
      "cardio__234__2022__1",
      "manifest.json"
    );
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.release_id = "forged__2022__1";
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

    assert.throws(
      () => access.resolveManifest("cardio__234__2022__1"),
      (err) =>
        err instanceof PackageAccessError && err.code === "MANIFEST_INCOHERENT"
    );
  });

  test("missing manifest file is rejected", () => {
    fs.unlinkSync(
      path.join(
        libraryRoot,
        "packages",
        "cardio__234__2022__1",
        "manifest.json"
      )
    );
    assert.throws(
      () => access.resolveManifest("cardio__234__2022__1"),
      (err) =>
        err instanceof PackageAccessError && err.code === "MANIFEST_MISSING"
    );
  });

  test("declared but missing artefact is rejected", () => {
    fs.unlinkSync(
      path.join(
        libraryRoot,
        "packages",
        "cardio__234__2022__1",
        "source",
        "official-college.md"
      )
    );
    assert.throws(
      () =>
        access.resolveAsset("cardio__234__2022__1", "source/official-college.md"),
      (err) =>
        err instanceof PackageAccessError && err.code === "ASSET_MISSING"
    );
  });
});
