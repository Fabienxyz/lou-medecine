import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  attachReleaseIdentity,
  buildReleaseId,
} from "../lib/release-identity.js";
import {
  loadOrCreateCatalog,
  saveCatalogAtomic,
  mutateCatalogAtomic,
  createEmptyCatalog,
} from "../lib/library-catalog.js";
import { installPublishedRelease } from "../lib/library-install.js";
import { createPackageAccess } from "../lib/package-access.js";
import { OFFLINE_STATUS } from "../lib/offline-state.js";
import {
  createOfflineManager,
  OfflineManagerError,
  verifyInstalledReleaseAvailability,
} from "../lib/offline-manager.js";
import { createTestOfflineManager } from "./offline-test-helpers.js";
import { createNodeOfflineRuntime } from "../lib/offline-runtime-node.js";

const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const CHAPTER_234 = path.join(REPO_ROOT, "01-learning/chapters/cardio/234");

/**
 * @param {string} root
 * @param {{
 *   chapter?: string,
 *   edition?: number,
 *   publication_version?: number,
 *   body?: string,
 *   extraFiles?: Record<string, string>,
 * }} opts
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

  for (const [rel, content] of Object.entries(opts.extraFiles || {})) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
  }

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
 * @param {string} dir
 */
function snapshotPackageTree(dir) {
  /** @type {Record<string, string>} */
  const out = {};
  if (!fs.existsSync(dir)) return out;
  for (const rel of walkFiles(dir)) {
    out[rel] = fs.readFileSync(path.join(dir, rel)).toString("hex");
  }
  return out;
}

/**
 * @param {string} root
 * @returns {string[]}
 */
function walkFiles(root) {
  /** @type {string[]} */
  const files = [];
  /** @param {string} dir */
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const abs = path.join(dir, name);
      const rel = path.relative(root, abs).replace(/\\/g, "/");
      if (fs.statSync(abs).isDirectory()) {
        walk(abs);
      } else {
        files.push(rel);
      }
    }
  }
  walk(root);
  return files.sort();
}

describe("offline manager (D2-C)", () => {
  let tmp;
  let libraryRoot;
  let releaseDir;
  /** @type {ReturnType<typeof createOfflineManager>} */
  let manager;
  let releaseId;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-offmgr-"));
    libraryRoot = path.join(tmp, "library");
    releaseDir = path.join(tmp, "release");
    writeMiniRelease(releaseDir);
    installPublishedRelease(releaseDir, libraryRoot);
    releaseId = "cardio__234__2022__1";
    manager = createTestOfflineManager(libraryRoot);
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("successful prepare transitions not_prepared → preparing → offline_ready", async () => {
    assert.equal(manager.getStatus(releaseId), OFFLINE_STATUS.NOT_PREPARED);

    const result = await manager.prepare(releaseId);
    assert.equal(result.releaseId, releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(manager.getStatus(releaseId), OFFLINE_STATUS.OFFLINE_READY);
  });

  test("verify is read-only and succeeds on installed release", () => {
    const before = manager.getStatus(releaseId);
    const result = manager.verify(releaseId);
    assert.equal(result.releaseId, releaseId);
    assert.ok(result.declaredPaths.includes("source/official-college.md"));
    assert.equal(manager.getStatus(releaseId), before);
  });

  test("retry failed → preparing → offline_ready", async () => {
    const pkgRoot = path.join(libraryRoot, "packages", releaseId);
    const collegePath = path.join(pkgRoot, "source/official-college.md");
    fs.unlinkSync(collegePath);

    await assert.rejects(
      () => manager.prepare(releaseId),
      (err) =>
        err instanceof OfflineManagerError && err.code === "ASSET_MISSING"
    );
    assert.equal(manager.getStatus(releaseId), OFFLINE_STATUS.FAILED);

    fs.writeFileSync(collegePath, "college body\n");
    const result = await manager.prepare(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
  });

  test("rejects unknown release_id", async () => {
    await assert.rejects(
      () => manager.prepare("missing__release__2022__1"),
      (err) =>
        err instanceof OfflineManagerError && err.code === "UNKNOWN_RELEASE"
    );
  });

  test("fails when declared artefact is absent", async () => {
    fs.unlinkSync(
      path.join(libraryRoot, "packages", releaseId, "build/traceability.json")
    );

    await assert.rejects(
      () => manager.prepare(releaseId),
      (err) =>
        err instanceof OfflineManagerError && err.code === "ASSET_MISSING"
    );
    assert.equal(manager.getStatus(releaseId), OFFLINE_STATUS.FAILED);
  });

  test("fails on manifest incoherent with catalog", async () => {
    const manifestPath = path.join(
      libraryRoot,
      "packages",
      releaseId,
      "manifest.json"
    );
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.release_id = "cardio__234__2022__999";
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");

    await assert.rejects(
      () => manager.prepare(releaseId),
      (err) =>
        err instanceof OfflineManagerError &&
        err.code === "MANIFEST_INCOHERENT"
    );
    assert.equal(manager.getStatus(releaseId), OFFLINE_STATUS.FAILED);
  });

  test("fails on digest divergent when artefact bytes change", async () => {
    const collegePath = path.join(
      libraryRoot,
      "packages",
      releaseId,
      "source/official-college.md"
    );
    fs.appendFileSync(collegePath, "tampered\n");

    await assert.rejects(
      () => manager.prepare(releaseId),
      (err) =>
        err instanceof OfflineManagerError && err.code === "DIGEST_DIVERGENT"
    );
    assert.equal(manager.getStatus(releaseId), OFFLINE_STATUS.FAILED);
  });

  test("fails on catalog content_digest divergent from manifest", async () => {
    const catalog = loadOrCreateCatalog(libraryRoot);
    catalog.entries[0].content_digest = "sha256:" + "f".repeat(64);
    saveCatalogAtomic(libraryRoot, catalog);

    await assert.rejects(
      () => manager.prepare(releaseId),
      (err) =>
        err instanceof OfflineManagerError && err.code === "DIGEST_DIVERGENT"
    );
    assert.equal(manager.getStatus(releaseId), OFFLINE_STATUS.FAILED);
  });

  test("orphan package not in catalog is ignored during prepare", async () => {
    const orphanId = "orphan__9999__1";
    const orphanRoot = path.join(libraryRoot, "packages", orphanId);
    fs.mkdirSync(orphanRoot, { recursive: true });
    fs.writeFileSync(
      path.join(orphanRoot, "manifest.json"),
      JSON.stringify({ chapter: "orphan", release_id: orphanId }) + "\n"
    );

    const result = await manager.prepare(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
  });

  test("undeclared extra file in package does not fail prepare", async () => {
    fs.writeFileSync(
      path.join(libraryRoot, "packages", releaseId, "extra-not-in-manifest.txt"),
      "ignored\n"
    );

    const result = await manager.prepare(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
  });

  test("deduplicates concurrent prepare calls for the same release_id", async () => {
    let prepareReleaseCalls = 0;
    const runtime = createNodeOfflineRuntime(libraryRoot);
    const originalPrepare = runtime.prepareRelease.bind(runtime);
    runtime.prepareRelease = async (args) => {
      prepareReleaseCalls += 1;
      return originalPrepare(args);
    };
    const concurrentManager = createTestOfflineManager(libraryRoot, { runtime });

    const [a, b] = await Promise.all([
      concurrentManager.prepare(releaseId),
      concurrentManager.prepare(releaseId),
    ]);
    assert.equal(a.status, OFFLINE_STATUS.OFFLINE_READY);
    assert.deepEqual(a, b);
    assert.equal(prepareReleaseCalls, 1);
  });

  test("does not modify installed package tree during prepare", async () => {
    const pkgRoot = path.join(libraryRoot, "packages", releaseId);
    const before = snapshotPackageTree(pkgRoot);

    await manager.prepare(releaseId);

    const after = snapshotPackageTree(pkgRoot);
    assert.deepEqual(after, before);
  });

  test("verifyInstalledReleaseAvailability matches manager.verify", () => {
    const access = createPackageAccess(libraryRoot);
    const direct = verifyInstalledReleaseAvailability({
      packageAccess: access,
      libraryRoot,
      releaseId,
    });
    const viaManager = manager.verify(releaseId);
    assert.deepEqual(direct, viaManager);
  });
});

describe("offline manager robustness (D2-C fixes)", () => {
  let tmp;
  let libraryRoot;
  let releaseIdV1;
  let releaseIdV2;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-offmgr-robust-"));
    libraryRoot = path.join(tmp, "library");
    const releaseDirV1 = path.join(tmp, "release-v1");
    const releaseDirV2 = path.join(tmp, "release-v2");
    writeMiniRelease(releaseDirV1, { publication_version: 1, body: "v1\n" });
    writeMiniRelease(releaseDirV2, { publication_version: 2, body: "v2\n" });
    installPublishedRelease(releaseDirV1, libraryRoot);
    installPublishedRelease(releaseDirV2, libraryRoot);
    releaseIdV1 = "cardio__234__2022__1";
    releaseIdV2 = "cardio__234__2022__2";
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("parallel prepare on two release_ids preserves both final statuses", async () => {
    const manager = createTestOfflineManager(libraryRoot);

    const [r1, r2] = await Promise.all([
      manager.prepare(releaseIdV1),
      manager.prepare(releaseIdV2),
    ]);

    assert.equal(r1.status, OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(r2.status, OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(manager.getStatus(releaseIdV1), OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(manager.getStatus(releaseIdV2), OFFLINE_STATUS.OFFLINE_READY);
  });

  test("parallel success and failure do not overwrite each other's status", async () => {
    fs.unlinkSync(
      path.join(libraryRoot, "packages", releaseIdV2, "build/traceability.json")
    );

    const manager = createTestOfflineManager(libraryRoot);

    const [success, failure] = await Promise.allSettled([
      manager.prepare(releaseIdV1),
      manager.prepare(releaseIdV2),
    ]);

    assert.equal(success.status, "fulfilled");
    assert.equal(failure.status, "rejected");
    assert.equal(manager.getStatus(releaseIdV1), OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(manager.getStatus(releaseIdV2), OFFLINE_STATUS.FAILED);
  });

  test("same release_id deduplication remains effective under serialized catalog writes", async () => {
    let prepareReleaseCalls = 0;
    const runtime = createNodeOfflineRuntime(libraryRoot);
    const originalPrepare = runtime.prepareRelease.bind(runtime);
    runtime.prepareRelease = async (args) => {
      prepareReleaseCalls += 1;
      return originalPrepare(args);
    };
    const manager = createTestOfflineManager(libraryRoot, { runtime });

    const [a, b] = await Promise.all([
      manager.prepare(releaseIdV1),
      manager.prepare(releaseIdV1),
    ]);

    assert.equal(a.status, OFFLINE_STATUS.OFFLINE_READY);
    assert.deepEqual(a, b);
    assert.equal(prepareReleaseCalls, 1);
  });

  test("verification failure finalizes to failed when catalog mutation succeeds", async () => {
    fs.unlinkSync(
      path.join(libraryRoot, "packages", releaseIdV1, "build/traceability.json")
    );

    const manager = createTestOfflineManager(libraryRoot);

    await assert.rejects(
      () => manager.prepare(releaseIdV1),
      (err) =>
        err instanceof OfflineManagerError && err.code === "ASSET_MISSING"
    );
    assert.equal(manager.getStatus(releaseIdV1), OFFLINE_STATUS.FAILED);
  });

  test("verification failure with finalize mutation error exposes composed failure", async () => {
    fs.unlinkSync(
      path.join(libraryRoot, "packages", releaseIdV1, "build/traceability.json")
    );

    let mutateCalls = 0;
    const catalogMutate = async (root, mutator) => {
      mutateCalls += 1;
      if (mutateCalls === 2) {
        throw new Error("simulated catalog finalize failure");
      }
      return mutateCatalogAtomic(root, mutator);
    };

    const manager = createTestOfflineManager(libraryRoot, {
      catalogMutate,
    });

    await assert.rejects(
      () => manager.prepare(releaseIdV1),
      (err) => {
        assert.ok(err instanceof OfflineManagerError);
        assert.equal(err.code, "FINALIZATION_FAILED");
        assert.ok(err.cause instanceof OfflineManagerError);
        assert.equal(err.cause.code, "ASSET_MISSING");
        assert.ok(err.finalizationError instanceof OfflineManagerError);
        assert.match(String(err.message), /verification failed/i);
        assert.match(String(err.message), /preparing → failed/i);
        return true;
      }
    );
    assert.equal(manager.getStatus(releaseIdV1), OFFLINE_STATUS.PREPARING);
  });

  test("parallel prepares do not modify installed package trees", async () => {
    const manager = createTestOfflineManager(libraryRoot);
    const beforeV1 = snapshotPackageTree(
      path.join(libraryRoot, "packages", releaseIdV1)
    );
    const beforeV2 = snapshotPackageTree(
      path.join(libraryRoot, "packages", releaseIdV2)
    );

    await Promise.all([
      manager.prepare(releaseIdV1),
      manager.prepare(releaseIdV2),
    ]);

    assert.deepEqual(
      snapshotPackageTree(path.join(libraryRoot, "packages", releaseIdV1)),
      beforeV1
    );
    assert.deepEqual(
      snapshotPackageTree(path.join(libraryRoot, "packages", releaseIdV2)),
      beforeV2
    );
  });
});

describe("offline manager — package 234 installed (D2-C)", () => {
  let tmp;
  let libraryRoot;
  /** @type {ReturnType<typeof createOfflineManager>} */
  let manager;
  let releaseId;

  beforeEach(() => {
    if (!fs.existsSync(path.join(CHAPTER_234, "manifest.json"))) {
      return;
    }
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-offmgr-234-"));
    libraryRoot = path.join(tmp, "library");
    installPublishedRelease(CHAPTER_234, libraryRoot);
    const manifest = JSON.parse(
      fs.readFileSync(path.join(CHAPTER_234, "manifest.json"), "utf8")
    );
    releaseId = manifest.release_id;
    manager = createTestOfflineManager(libraryRoot);
  });

  afterEach(() => {
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("successful prepare of installed package 234", async (t) => {
    if (!fs.existsSync(path.join(CHAPTER_234, "manifest.json"))) {
      t.skip("chapter 234 manifest not present");
      return;
    }

    const verifyResult = manager.verify(releaseId);
    assert.ok(verifyResult.declaredPaths.length > 10);

    const result = await manager.prepare(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(manager.getStatus(releaseId), OFFLINE_STATUS.OFFLINE_READY);
  });
});
