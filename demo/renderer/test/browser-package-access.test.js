import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  attachReleaseIdentity,
  buildReleaseId,
} from "../../../tools/lou-build/lib/release-identity.js";
import { installPublishedRelease } from "../../../tools/lou-build/lib/library-install.js";
import { catalogPath } from "../../../tools/lou-build/lib/library-catalog.js";
import {
  PackageAccessError,
  normalizePackageRelativePath,
  buildReleaseScopedUrl,
} from "../library/package-access-shared.js";
import { createBrowserPackageAccess } from "../library/browser-package-access.js";

const LIBRARY_BASE = "https://reader.test/library";
const FORBIDDEN_PATH_FRAGMENTS = [
  "/01-learning/",
  "/chapters/",
  "01-learning/chapters",
];

/**
 * @param {string} libraryRoot
 * @param {string} libraryBaseUrl
 */
function createMockLibraryFetch(libraryRoot, libraryBaseUrl = LIBRARY_BASE) {
  const basePath = new URL(libraryBaseUrl).pathname.replace(/\/+$/, "");

  return async (url, init = {}) => {
    const parsed = new URL(url, "https://reader.test");
    const pathname = parsed.pathname;

    if (pathname === `${basePath}/library.json`) {
      const body = fs.readFileSync(path.join(libraryRoot, "library.json"));
      return mockResponse(200, body, "application/json");
    }

    const prefix = `${basePath}/releases/`;
    if (pathname.startsWith(prefix)) {
      const rest = pathname.slice(prefix.length);
      const slash = rest.indexOf("/");
      if (slash === -1) {
        return mockResponse(404, "");
      }
      const releaseId = decodeURIComponent(rest.slice(0, slash));
      const relPath = decodeURIComponent(rest.slice(slash + 1));
      const filePath = path.join(libraryRoot, "packages", releaseId, relPath);

      if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
        return mockResponse(404, "");
      }

      if (init.method === "HEAD") {
        return mockResponse(200, "");
      }

      const body = fs.readFileSync(filePath);
      const type = relPath.endsWith(".json")
        ? "application/json"
        : "text/plain";
      return mockResponse(200, body, type);
    }

    return mockResponse(404, "");
  };
}

/**
 * @param {number} status
 * @param {Buffer | string} body
 * @param {string} [contentType]
 */
function mockResponse(status, body, contentType) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return JSON.parse(body.toString());
    },
    async text() {
      return body.toString();
    },
    headers: {
      get(name) {
        return name.toLowerCase() === "content-type" ? contentType ?? null : null;
      },
    },
  };
}

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
    questions: [],
    scenarios: [],
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

/**
 * @param {string} url
 */
function assertNoMonorepoPaths(url) {
  for (const fragment of FORBIDDEN_PATH_FRAGMENTS) {
    assert.equal(
      url.includes(fragment),
      false,
      `URL must not reference monorepo path ${fragment}: ${url}`
    );
  }
}

describe("browser package access (D2-D)", () => {
  let tmp;
  let libraryRoot;
  let releaseId;
  /** @type {ReturnType<typeof createBrowserPackageAccess>} */
  let access;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-bpa-"));
    libraryRoot = path.join(tmp, "library");
    const releaseDir = path.join(tmp, "release");
    writeMiniRelease(releaseDir);
    installPublishedRelease(releaseDir, libraryRoot);
    releaseId = "cardio__234__2022__1";
    access = createBrowserPackageAccess({
      libraryBaseUrl: LIBRARY_BASE,
      fetch: createMockLibraryFetch(libraryRoot),
    });
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("listReleases discovers installed releases from library.json only", async () => {
    const orphanId = "orphan__9999__1";
    fs.mkdirSync(path.join(libraryRoot, "packages", orphanId), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(libraryRoot, "packages", orphanId, "manifest.json"),
      JSON.stringify({ chapter: "orphan", release_id: orphanId }) + "\n"
    );

    const releases = await access.listReleases();
    assert.equal(releases.length, 1);
    assert.equal(releases[0].release_id, releaseId);
    assert.equal("offline_status" in releases[0], false);
    assert.equal("root" in releases[0], false);
    assert.equal("manifest" in releases[0], false);
  });

  test("getActiveRelease resolves via active_by_chapter", async () => {
    const active = await access.getActiveRelease("cardio/234");
    assert.equal(active.release_id, releaseId);
    assert.equal(active.status, "active");
  });

  test("resolveManifest returns published manifest", async () => {
    const manifest = await access.resolveManifest(releaseId);
    assert.equal(manifest.chapter, "cardio/234");
    assert.equal(manifest.release_id, releaseId);
    assert.equal(manifest.college_source_path, "source/official-college.md");
  });

  test("resolveManifestUrl and resolveAssetUrl produce stable release-scoped URLs", async () => {
    const manifestUrl = await access.resolveManifestUrl(releaseId);
    const expectedManifest = buildReleaseScopedUrl(
      LIBRARY_BASE,
      releaseId,
      "manifest.json"
    );
    assert.equal(manifestUrl, expectedManifest);
    assertNoMonorepoPaths(manifestUrl);

    const asset = await access.resolveAssetUrl(
      releaseId,
      "source/official-college.md"
    );
    assert.equal(asset.releaseId, releaseId);
    assert.equal(asset.relativePath, "source/official-college.md");
    assert.equal(
      asset.url,
      buildReleaseScopedUrl(
        LIBRARY_BASE,
        releaseId,
        "source/official-college.md"
      )
    );
    assertNoMonorepoPaths(asset.url);

    assert.equal(await access.resolveManifestUrl(releaseId), manifestUrl);
    assert.equal(
      (await access.resolveAssetUrl(releaseId, "source/official-college.md"))
        .url,
      asset.url
    );
  });

  test("resolveManifestUrl rejects unknown release_id", async () => {
    await assert.rejects(
      () => access.resolveManifestUrl("nonexistent__2022__1"),
      (err) =>
        err instanceof PackageAccessError && err.code === "UNKNOWN_RELEASE"
    );
  });

  test("resolveAssetUrl rejects undeclared artefact", async () => {
    await assert.rejects(
      () => access.resolveAssetUrl(releaseId, "secret/undeclared.md"),
      (err) =>
        err instanceof PackageAccessError && err.code === "UNDECLARED_ASSET"
    );
  });

  test("resolveAssetUrl rejects parent traversal", async () => {
    await assert.rejects(
      () => access.resolveAssetUrl(releaseId, "../outside.md"),
      (err) =>
        err instanceof PackageAccessError && err.code === "FORBIDDEN_PATH"
    );
    await assert.rejects(
      () => access.resolveAssetUrl(releaseId, "source/../../outside.md"),
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

  test("unknown release and chapter are rejected explicitly", async () => {
    await assert.rejects(
      () => access.resolveManifest("nonexistent__2022__1"),
      (err) =>
        err instanceof PackageAccessError && err.code === "UNKNOWN_RELEASE"
    );
    await assert.rejects(
      () => access.getActiveRelease("cardio/999"),
      (err) =>
        err instanceof PackageAccessError && err.code === "UNKNOWN_CHAPTER"
    );
  });

  test("invalid catalog is rejected explicitly", async () => {
    const catalog = JSON.parse(
      fs.readFileSync(catalogPath(libraryRoot), "utf8")
    );
    catalog.extra_field = true;
    fs.writeFileSync(
      catalogPath(libraryRoot),
      JSON.stringify(catalog, null, 2) + "\n"
    );

    const broken = createBrowserPackageAccess({
      libraryBaseUrl: LIBRARY_BASE,
      fetch: createMockLibraryFetch(libraryRoot),
    });

    await assert.rejects(
      () => broken.listReleases(),
      (err) =>
        err instanceof PackageAccessError && err.code === "INVALID_CATALOG"
    );
  });

  test("corrupted catalog JSON is rejected explicitly", async () => {
    fs.writeFileSync(catalogPath(libraryRoot), "{ not json\n");
    const broken = createBrowserPackageAccess({
      libraryBaseUrl: LIBRARY_BASE,
      fetch: createMockLibraryFetch(libraryRoot),
    });

    await assert.rejects(
      () => broken.listReleases(),
      (err) =>
        err instanceof PackageAccessError && err.code === "INVALID_CATALOG"
    );
  });

  test("manifest incoherent with catalog is rejected", async () => {
    const manifestPath = path.join(
      libraryRoot,
      "packages",
      releaseId,
      "manifest.json"
    );
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.release_id = "forged__2022__1";
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

    await assert.rejects(
      () => access.resolveManifest(releaseId),
      (err) =>
        err instanceof PackageAccessError && err.code === "MANIFEST_INCOHERENT"
    );
  });

  test("missing manifest file is rejected", async () => {
    fs.unlinkSync(
      path.join(libraryRoot, "packages", releaseId, "manifest.json")
    );

    await assert.rejects(
      () => access.resolveManifest(releaseId),
      (err) =>
        err instanceof PackageAccessError && err.code === "MANIFEST_MISSING"
    );
  });

  test("declared but missing artefact is rejected", async () => {
    fs.unlinkSync(
      path.join(
        libraryRoot,
        "packages",
        releaseId,
        "source",
        "official-college.md"
      )
    );

    await assert.rejects(
      () => access.resolveAssetUrl(releaseId, "source/official-college.md"),
      (err) =>
        err instanceof PackageAccessError && err.code === "ASSET_MISSING"
    );
  });
});
