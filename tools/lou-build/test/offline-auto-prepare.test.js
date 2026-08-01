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
import { loadOrCreateCatalog } from "../lib/library-catalog.js";
import { installPublishedRelease } from "../lib/library-install.js";
import { OFFLINE_STATUS } from "../lib/offline-state.js";
import { OfflineManagerError } from "../lib/offline-manager.js";
import { buildReleaseNamespace } from "../../../demo/renderer/library/offline-runtime-shared.js";
import {
  createLibraryOfflineScheduler,
  resetLibraryOfflineSchedulersForTests,
} from "../lib/library-offline-scheduler.js";
import { createNodeOfflineRuntime } from "../lib/offline-runtime-node.js";
import { createTestOfflineManager } from "./offline-test-helpers.js";

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
 * @param {() => Promise<void>} fn
 */
async function waitUntil(fn, timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fn();
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
  }
  await fn();
}

describe("offline auto-prepare after install (D2-F)", () => {
  let tmp;
  let libraryRoot;

  beforeEach(() => {
    resetLibraryOfflineSchedulersForTests();
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-d2f-"));
    libraryRoot = path.join(tmp, "library");
  });

  afterEach(() => {
    resetLibraryOfflineSchedulersForTests();
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("installation leaves offline_status not_prepared while runtime prepares asynchronously", async () => {
    const releaseDir = path.join(tmp, "release");
    writeMiniRelease(releaseDir);
    const releaseId = "cardio__234__2022__1";
    const scheduler = createLibraryOfflineScheduler(libraryRoot);

    const result = installPublishedRelease(releaseDir, libraryRoot, {
      onInstalled: (args) => scheduler.scheduleAfterInstall(args),
    });

    assert.equal(result.ok, true);
    assert.equal(result.idempotent, false);

    const catalogAfterInstall = loadOrCreateCatalog(libraryRoot);
    assert.equal(
      catalogAfterInstall.entries[0].offline_status,
      OFFLINE_STATUS.NOT_PREPARED
    );

    await waitUntil(async () => {
      assert.equal(
        await scheduler.runtime.hasRelease(
          releaseId,
          catalogAfterInstall.entries[0].content_digest
        ),
        true
      );
    });

    const catalogAfterPrepare = loadOrCreateCatalog(libraryRoot);
    assert.equal(
      catalogAfterPrepare.entries[0].offline_status,
      OFFLINE_STATUS.NOT_PREPARED
    );
  });

  test("install returns before offline preparation completes without status change", async () => {
    const releaseDir = path.join(tmp, "release");
    writeMiniRelease(releaseDir);
    const releaseId = "cardio__234__2022__1";

    let prepareStarted = false;
    const runtime = createNodeOfflineRuntime(libraryRoot);
    const originalPrepare = runtime.prepareRelease.bind(runtime);
    runtime.prepareRelease = async (args) => {
      prepareStarted = true;
      await new Promise((resolve) => setTimeout(resolve, 200));
      return originalPrepare(args);
    };

    const manager = createTestOfflineManager(libraryRoot, { runtime });
    /** @type {Promise<unknown> | null} */
    let preparePromise = null;

    installPublishedRelease(releaseDir, libraryRoot, {
      onInstalled: ({ releaseId: rid }) => {
        preparePromise = manager.prepare(rid);
      },
    });

    assert.equal(prepareStarted, false);
    assert.equal(
      loadOrCreateCatalog(libraryRoot).entries[0].offline_status,
      OFFLINE_STATUS.NOT_PREPARED
    );

    await waitUntil(async () => {
      assert.equal(prepareStarted, true);
    });

    await preparePromise;
    assert.equal(manager.getStatus(releaseId), OFFLINE_STATUS.NOT_PREPARED);
  });

  test("runtime failure does not transition offline_status to failed", async () => {
    const releaseDir = path.join(tmp, "release");
    writeMiniRelease(releaseDir);
    const releaseId = "cardio__234__2022__1";

    installPublishedRelease(releaseDir, libraryRoot);

    fs.unlinkSync(
      path.join(libraryRoot, "packages", releaseId, "build/traceability.json")
    );

    const manager = createTestOfflineManager(libraryRoot);
    await assert.rejects(
      () => manager.prepare(releaseId),
      (err) =>
        err instanceof OfflineManagerError && err.code === "ASSET_MISSING"
    );
    assert.equal(manager.getStatus(releaseId), OFFLINE_STATUS.NOT_PREPARED);
  });

  test("digest error surfaces without offline_ready or failed", async () => {
    const releaseDir = path.join(tmp, "release");
    writeMiniRelease(releaseDir);
    const releaseId = "cardio__234__2022__1";

    installPublishedRelease(releaseDir, libraryRoot);
    fs.appendFileSync(
      path.join(libraryRoot, "packages", releaseId, "source/official-college.md"),
      "tampered\n"
    );

    const manager = createTestOfflineManager(libraryRoot);
    await assert.rejects(
      () => manager.prepare(releaseId),
      (err) =>
        err instanceof OfflineManagerError && err.code === "DIGEST_DIVERGENT"
    );
    assert.equal(manager.getStatus(releaseId), OFFLINE_STATUS.NOT_PREPARED);
  });

  test("idempotent prepare skips runtime when release namespace is complete", async () => {
    const releaseDir = path.join(tmp, "release");
    writeMiniRelease(releaseDir);
    const releaseId = "cardio__234__2022__1";
    const manager = createTestOfflineManager(libraryRoot);

    installPublishedRelease(releaseDir, libraryRoot);
    await manager.prepare(releaseId);

    let prepareCalls = 0;
    const runtime = createNodeOfflineRuntime(libraryRoot);
    const original = runtime.prepareRelease.bind(runtime);
    runtime.prepareRelease = async (args) => {
      prepareCalls += 1;
      return original(args);
    };
    const secondManager = createTestOfflineManager(libraryRoot, { runtime });

    const result = await secondManager.prepare(releaseId);
    assert.equal(result.runtimePrepared, false);
    assert.equal(prepareCalls, 0);
    assert.equal(secondManager.getStatus(releaseId), OFFLINE_STATUS.NOT_PREPARED);
  });

  test("double installation of same release skips runtime when namespace exists", async () => {
    const releaseDir = path.join(tmp, "release");
    writeMiniRelease(releaseDir);
    const releaseId = "cardio__234__2022__1";
    const scheduler = createLibraryOfflineScheduler(libraryRoot);

    installPublishedRelease(releaseDir, libraryRoot, {
      onInstalled: (args) => scheduler.scheduleAfterInstall(args),
    });

    await waitUntil(async () => {
      const catalog = loadOrCreateCatalog(libraryRoot);
      assert.equal(
        await scheduler.runtime.hasRelease(
          releaseId,
          catalog.entries[0].content_digest
        ),
        true
      );
    });

    let prepareCalls = 0;
    const runtime = createNodeOfflineRuntime(libraryRoot);
    const original = runtime.prepareRelease.bind(runtime);
    runtime.prepareRelease = async (args) => {
      prepareCalls += 1;
      return original(args);
    };
    const manager = createTestOfflineManager(libraryRoot, { runtime });

    installPublishedRelease(releaseDir, libraryRoot, {
      onInstalled: ({ releaseId: rid, idempotent }) => {
        if (idempotent) {
          void manager.prepare(rid);
        }
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));
    assert.equal(prepareCalls, 0);
    assert.equal(
      loadOrCreateCatalog(libraryRoot).entries[0].offline_status,
      OFFLINE_STATUS.NOT_PREPARED
    );
    assert.equal(
      await runtime.hasRelease(
        releaseId,
        loadOrCreateCatalog(libraryRoot).entries[0].content_digest
      ),
      true
    );
  });

  test("parallel installations of different releases prepare independently without certification", async () => {
    const releaseDirV1 = path.join(tmp, "release-v1");
    const releaseDirV2 = path.join(tmp, "release-v2");
    writeMiniRelease(releaseDirV1, { publication_version: 1, body: "v1\n" });
    writeMiniRelease(releaseDirV2, { publication_version: 2, body: "v2\n" });
    const scheduler = createLibraryOfflineScheduler(libraryRoot);

    installPublishedRelease(releaseDirV1, libraryRoot, {
      onInstalled: (args) => scheduler.scheduleAfterInstall(args),
    });
    installPublishedRelease(releaseDirV2, libraryRoot, {
      onInstalled: (args) => scheduler.scheduleAfterInstall(args),
    });

    await waitUntil(async () => {
      const catalog = loadOrCreateCatalog(libraryRoot);
      const digestV1 = catalog.entries.find(
        (e) => e.release_id === "cardio__234__2022__1"
      ).content_digest;
      const digestV2 = catalog.entries.find(
        (e) => e.release_id === "cardio__234__2022__2"
      ).content_digest;
      assert.equal(await scheduler.runtime.hasRelease("cardio__234__2022__1", digestV1), true);
      assert.equal(await scheduler.runtime.hasRelease("cardio__234__2022__2", digestV2), true);
    });

    const catalog = loadOrCreateCatalog(libraryRoot);
    assert.equal(
      catalog.entries.find((e) => e.release_id === "cardio__234__2022__1")
        .offline_status,
      OFFLINE_STATUS.NOT_PREPARED
    );
    assert.equal(
      catalog.entries.find((e) => e.release_id === "cardio__234__2022__2")
        .offline_status,
      OFFLINE_STATUS.NOT_PREPARED
    );
  });

  test("runtime receives only release_id, content_digest and declared resources", async () => {
    const releaseDir = path.join(tmp, "release");
    const manifest = writeMiniRelease(releaseDir);
    const releaseId = manifest.release_id;

    /** @type {unknown[]} */
    const capturedArgs = [];
    const runtime = createNodeOfflineRuntime(libraryRoot);
    const original = runtime.prepareRelease.bind(runtime);
    runtime.prepareRelease = async (args) => {
      capturedArgs.push(args);
      return original(args);
    };

    const manager = createTestOfflineManager(libraryRoot, { runtime });
    installPublishedRelease(releaseDir, libraryRoot);
    await manager.prepare(releaseId);

    assert.equal(capturedArgs.length, 1);
    const args = capturedArgs[0];
    assert.deepEqual(Object.keys(args).sort(), [
      "contentDigest",
      "releaseId",
      "resources",
    ]);
    assert.equal(args.releaseId, releaseId);
    assert.equal(args.contentDigest, manifest.content_digest);
    assert.ok(args.resources.some((r) => r.relativePath === "manifest.json"));
    assert.ok(
      args.resources.some((r) => r.relativePath === "source/official-college.md")
    );
    for (const resource of args.resources) {
      assert.equal(Object.keys(resource).sort().join(","), "relativePath,url");
    }
  });

  test("library.json remains the sole SSOT for offline_status", async () => {
    const releaseDir = path.join(tmp, "release");
    writeMiniRelease(releaseDir);
    const scheduler = createLibraryOfflineScheduler(libraryRoot);

    installPublishedRelease(releaseDir, libraryRoot, {
      onInstalled: (args) => scheduler.scheduleAfterInstall(args),
    });

    await waitUntil(async () => {
      const catalog = loadOrCreateCatalog(libraryRoot);
      assert.equal(
        await scheduler.runtime.hasRelease(
          catalog.entries[0].release_id,
          catalog.entries[0].content_digest
        ),
        true
      );
    });

    const catalog = loadOrCreateCatalog(libraryRoot);
    assert.equal(catalog.entries[0].offline_status, OFFLINE_STATUS.NOT_PREPARED);
    assert.equal(Object.keys(catalog).sort().join(","), "active_by_chapter,entries,library_id,schema_version,updated_at");
    assert.ok(
      fs.existsSync(
        path.join(
          libraryRoot,
          ".offline-runtime",
          "namespaces",
          buildReleaseNamespace("cardio__234__2022__1")
        )
      )
    );
    assert.equal(
      fs.existsSync(path.join(libraryRoot, "offline-status.json")),
      false
    );
  });

  test("hook runs only after atomic catalog persist", () => {
    const releaseDir = path.join(tmp, "release");
    writeMiniRelease(releaseDir);

    /** @type {string[]} */
    const events = [];

    installPublishedRelease(releaseDir, libraryRoot, {
      onInstalled: ({ releaseId }) => {
        events.push("hook");
        const catalog = loadOrCreateCatalog(libraryRoot);
        assert.equal(catalog.entries[0].release_id, releaseId);
        assert.ok(
          fs.existsSync(
            path.join(libraryRoot, "packages", releaseId, "manifest.json")
          )
        );
      },
    });

    assert.deepEqual(events, ["hook"]);
  });
});

describe("offline auto-prepare — package 234 installed (D2-F)", () => {
  let tmp;
  let libraryRoot;
  let releaseId;

  beforeEach(() => {
    resetLibraryOfflineSchedulersForTests();
    if (!fs.existsSync(path.join(CHAPTER_234, "manifest.json"))) {
      return;
    }
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-d2f-234-"));
    libraryRoot = path.join(tmp, "library");
    const manifest = JSON.parse(
      fs.readFileSync(path.join(CHAPTER_234, "manifest.json"), "utf8")
    );
    releaseId = manifest.release_id;
  });

  afterEach(() => {
    resetLibraryOfflineSchedulersForTests();
    if (tmp) fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("install 234 schedules runtime prepare without certification", async (t) => {
    if (!fs.existsSync(path.join(CHAPTER_234, "manifest.json"))) {
      t.skip("chapter 234 manifest not present");
      return;
    }

    const scheduler = createLibraryOfflineScheduler(libraryRoot);
    const started = Date.now();
    installPublishedRelease(CHAPTER_234, libraryRoot, {
      onInstalled: (args) => scheduler.scheduleAfterInstall(args),
    });
    assert.ok(Date.now() - started < 2000);

    await waitUntil(
      async () => {
        const catalog = loadOrCreateCatalog(libraryRoot);
        const entry = catalog.entries.find((e) => e.release_id === releaseId);
        assert.equal(
          await scheduler.runtime.hasRelease(releaseId, entry.content_digest),
          true
        );
      },
      30_000
    );

    const catalog = loadOrCreateCatalog(libraryRoot);
    assert.equal(
      catalog.entries.find((e) => e.release_id === releaseId).offline_status,
      OFFLINE_STATUS.NOT_PREPARED
    );
  });
});
