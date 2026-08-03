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
import { loadOrCreateCatalog } from "../../../tools/lou-build/lib/library-catalog.js";
import { OFFLINE_STATUS } from "../../../tools/lou-build/lib/offline-state.js";
import { createBrowserPackageAccess } from "../library/browser-package-access.js";
import { createOfflineRuntime } from "../library/offline-runtime.js";
import { buildReleaseNamespace } from "../library/offline-runtime-shared.js";
import {
  BrowserOfflineManagerError,
  createBrowserOfflineManager,
} from "../library/browser-offline-manager.js";

const LIBRARY_BASE = "https://reader.test/library";

/**
 * In-memory runtime storage for Node tests (no Cache API).
 * @returns {import("../library/offline-runtime.js").OfflineRuntimeStorage}
 */
function createMemoryRuntimeStorage() {
  /** @type {Map<string, Map<string, import("../library/offline-runtime.js").StoredResource>>} */
  const stores = new Map();

  return {
    has(name) {
      return Promise.resolve(stores.has(name));
    },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const map = stores.get(name);
      return {
        get: (key) => Promise.resolve(map.get(key) ?? null),
        put: async (key, resource) => {
          map.set(key, resource);
        },
        keys: () => Promise.resolve([...map.keys()]),
      };
    },
    keys: () => Promise.resolve([...stores.keys()]),
    delete: (name) => Promise.resolve(stores.delete(name)),
  };
}

/**
 * @param {string} root
 * @param {{ publication_version?: number, body?: string }} [opts]
 */
function writeMiniRelease(root, opts = {}) {
  const publication_version = opts.publication_version ?? 1;
  const body = opts.body ?? "body\n";
  fs.mkdirSync(path.join(root, "source"), { recursive: true });
  fs.mkdirSync(path.join(root, "build"), { recursive: true });
  fs.writeFileSync(path.join(root, "source", "official-college.md"), body);
  fs.writeFileSync(path.join(root, "build", "traceability.json"), "{}\n");
  const manifest = {
    chapter: "cardio/234",
    slug: "test",
    title: "Test",
    specialty: "Cardiologie",
    source_edition: 2022,
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
  fs.writeFileSync(
    path.join(root, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  return manifest;
}

/**
 * @param {string} libraryRoot
 */
function createTestManager(libraryRoot) {
  const fetchFn = createMockLibraryFetch(libraryRoot);
  const packageAccess = createBrowserPackageAccess({
    libraryBaseUrl: LIBRARY_BASE,
    fetch: fetchFn,
  });
  const runtime = createOfflineRuntime({
    storage: createMemoryRuntimeStorage(),
    libraryBasePath: "/library",
    allowDevPackageWarmCache: false,
    fetch: fetchFn,
  });
  const manager = createBrowserOfflineManager({
    libraryBaseUrl: LIBRARY_BASE,
    packageAccess,
    fetch: fetchFn,
    runtime,
  });
  return { manager, runtime, fetchFn, packageAccess };
}

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
      if (init.method === "PUT") {
        const body =
          typeof init.body === "string"
            ? init.body
            : init.body?.toString?.() || "";
        fs.writeFileSync(
          path.join(libraryRoot, "library.json"),
          body.endsWith("\n") ? body : body + "\n"
        );
        return { ok: true, status: 204, json: async () => ({}) };
      }
      const body = fs.readFileSync(path.join(libraryRoot, "library.json"));
      return mockResponse(200, body, "application/json");
    }

    const prefix = `${basePath}/releases/`;
    if (pathname.startsWith(prefix)) {
      const rest = pathname.slice(prefix.length);
      const slash = rest.indexOf("/");
      const releaseId = decodeURIComponent(rest.slice(0, slash));
      const relPath = decodeURIComponent(rest.slice(slash + 1));
      const filePath = path.join(libraryRoot, "packages", releaseId, relPath);
      if (!fs.existsSync(filePath)) {
        return mockResponse(404, "");
      }
      if (init.method === "HEAD") {
        return mockResponse(200, "");
      }
      return mockResponse(200, fs.readFileSync(filePath));
    }
    return mockResponse(404, "");
  };
}

function mockResponse(status, body, contentType) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) =>
        name.toLowerCase() === "content-type" ? contentType || "" : null,
    },
    arrayBuffer: async () =>
      Buffer.isBuffer(body)
        ? body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength)
        : new TextEncoder().encode(String(body)).buffer,
    json: async () => JSON.parse(body.toString()),
    text: async () => body.toString(),
  };
}

describe("browser offline manager (D2-G)", () => {
  let tmp;
  let libraryRoot;
  let releaseId;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-bom-"));
    libraryRoot = path.join(tmp, "library");
    const releaseDir = path.join(tmp, "release");
    writeMiniRelease(releaseDir);
    installPublishedRelease(releaseDir, libraryRoot);
    releaseId = "cardio__234__2022__1";
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("prepareAndCertify transitions not_prepared → preparing → offline_ready", async () => {
    const fetchFn = createMockLibraryFetch(libraryRoot);
    const packageAccess = createBrowserPackageAccess({
      libraryBaseUrl: LIBRARY_BASE,
      fetch: fetchFn,
    });
    const runtime = createOfflineRuntime({
      storage: createMemoryRuntimeStorage(),
      libraryBasePath: "/library",
      allowDevPackageWarmCache: false,
      fetch: fetchFn,
    });
    const manager = createBrowserOfflineManager({
      libraryBaseUrl: LIBRARY_BASE,
      packageAccess,
      fetch: fetchFn,
      runtime,
    });

    assert.equal(
      loadOrCreateCatalog(libraryRoot).entries[0].offline_status,
      OFFLINE_STATUS.NOT_PREPARED
    );

    const result = await manager.prepareAndCertify(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(
      loadOrCreateCatalog(libraryRoot).entries[0].offline_status,
      OFFLINE_STATUS.OFFLINE_READY
    );
  });

  test("verification failure transitions to failed without offline_ready", async () => {
    fs.unlinkSync(
      path.join(libraryRoot, "packages", releaseId, "build/traceability.json")
    );

    const fetchFn = createMockLibraryFetch(libraryRoot);
    const packageAccess = createBrowserPackageAccess({
      libraryBaseUrl: LIBRARY_BASE,
      fetch: fetchFn,
    });
    const runtime = createOfflineRuntime({
      storage: createMemoryRuntimeStorage(),
      libraryBasePath: "/library",
      allowDevPackageWarmCache: false,
      fetch: fetchFn,
    });
    const manager = createBrowserOfflineManager({
      libraryBaseUrl: LIBRARY_BASE,
      packageAccess,
      fetch: fetchFn,
      runtime,
    });

    await assert.rejects(
      () => manager.prepareAndCertify(releaseId),
      (err) => err instanceof BrowserOfflineManagerError
    );
    assert.equal(
      loadOrCreateCatalog(libraryRoot).entries[0].offline_status,
      OFFLINE_STATUS.FAILED
    );
  });

  test("retry after failure can reach offline_ready", async () => {
    const missing = path.join(
      libraryRoot,
      "packages",
      releaseId,
      "build/traceability.json"
    );
    fs.unlinkSync(missing);

    const fetchFn = createMockLibraryFetch(libraryRoot);
    const packageAccess = createBrowserPackageAccess({
      libraryBaseUrl: LIBRARY_BASE,
      fetch: fetchFn,
    });
    const runtime = createOfflineRuntime({
      storage: createMemoryRuntimeStorage(),
      libraryBasePath: "/library",
      allowDevPackageWarmCache: false,
      fetch: fetchFn,
    });
    const manager = createBrowserOfflineManager({
      libraryBaseUrl: LIBRARY_BASE,
      packageAccess,
      fetch: fetchFn,
      runtime,
    });

    await assert.rejects(() => manager.prepareAndCertify(releaseId));
    fs.writeFileSync(missing, "{}\n");

    const catalog = loadOrCreateCatalog(libraryRoot);
    catalog.entries[0].offline_status = OFFLINE_STATUS.FAILED;
    fs.writeFileSync(
      path.join(libraryRoot, "library.json"),
      JSON.stringify(catalog, null, 2) + "\n"
    );

    const result = await manager.prepareAndCertify(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
  });
});

describe("browser offline manager lifecycle (D2-H)", () => {
  let tmp;
  let libraryRoot;
  let releaseId;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-bom-h-"));
    libraryRoot = path.join(tmp, "library");
    const releaseDir = path.join(tmp, "release");
    writeMiniRelease(releaseDir);
    installPublishedRelease(releaseDir, libraryRoot);
    releaseId = "cardio__234__2022__1";
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("repair after runtime removed restores offline_ready", async () => {
    const { manager, runtime } = createTestManager(libraryRoot);
    await manager.prepareAndCertify(releaseId);
    await runtime.removeRelease(releaseId);

    const result = await manager.repair(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
    const digest = loadOrCreateCatalog(libraryRoot).entries[0].content_digest;
    assert.equal(await runtime.hasRelease(releaseId, digest), true);
    assert.equal(
      loadOrCreateCatalog(libraryRoot).entries[0].offline_status,
      OFFLINE_STATUS.OFFLINE_READY
    );
  });

  test("repair after corrupted runtime restores offline_ready", async () => {
    const { manager, runtime } = createTestManager(libraryRoot);
    await manager.prepareAndCertify(releaseId);
    const namespace = buildReleaseNamespace(releaseId);
    const storage = runtime.getStorage();
    const cache = await storage.open(namespace);
    await cache.put("build/traceability.json", {
      body: new TextEncoder().encode("{}"),
      contentType: "application/json",
    });

    const result = await manager.repair(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
  });

  test("repair after runtime digest divergent restores offline_ready", async () => {
    const { manager, runtime } = createTestManager(libraryRoot);
    await manager.prepareAndCertify(releaseId);
    const namespace = buildReleaseNamespace(releaseId);
    const storage = runtime.getStorage();
    const cache = await storage.open(namespace);
    const meta = await runtime.getReleaseMetadata(releaseId);
    assert.ok(meta);
    meta.content_digest = "sha256:deadbeef";
    await cache.put("__lou-offline-meta.json", {
      body: new TextEncoder().encode(JSON.stringify(meta)),
      contentType: "application/json",
    });

    const stale = await manager.detectStale(releaseId);
    assert.equal(stale.stale, true);

    const result = await manager.repair(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
  });

  test("purge removes runtime and resets offline_status to not_prepared", async () => {
    const { manager, runtime } = createTestManager(libraryRoot);
    await manager.prepareAndCertify(releaseId);
    const packagePath = path.join(libraryRoot, "packages", releaseId, "manifest.json");
    assert.ok(fs.existsSync(packagePath));

    const result = await manager.purge(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.NOT_PREPARED);
    assert.ok(fs.existsSync(packagePath));
    assert.equal(await runtime.getReleaseMetadata(releaseId), null);
    assert.equal(
      loadOrCreateCatalog(libraryRoot).entries[0].offline_status,
      OFFLINE_STATUS.NOT_PREPARED
    );
  });

  test("stale offline_ready without runtime is detected and invalidated to failed", async () => {
    const { manager, runtime } = createTestManager(libraryRoot);
    await manager.prepareAndCertify(releaseId);
    await runtime.removeRelease(releaseId);

    const stale = await manager.detectStale(releaseId);
    assert.equal(stale.stale, true);
    assert.equal(stale.recommendedStatus, OFFLINE_STATUS.FAILED);

    await manager.invalidateIfStale(releaseId);
    assert.equal(
      loadOrCreateCatalog(libraryRoot).entries.find((e) => e.release_id === releaseId)
        .offline_status,
      OFFLINE_STATUS.FAILED
    );
  });

  test("parallel repair calls share one in-flight job", async () => {
    const { manager } = createTestManager(libraryRoot);
    await manager.prepareAndCertify(releaseId);
    await manager.purge(releaseId);

    const [first, second] = await Promise.all([
      manager.repair(releaseId),
      manager.repair(releaseId),
    ]);
    assert.equal(first.status, OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(second.status, OFFLINE_STATUS.OFFLINE_READY);
  });

  test("repair is idempotent when runtime is already complete", async () => {
    const { manager } = createTestManager(libraryRoot);
    await manager.prepareAndCertify(releaseId);
    const result = await manager.repair(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
  });

  test("ensureReleaseReady is idempotent when runtime matches digest", async () => {
    const { manager } = createTestManager(libraryRoot);
    await manager.prepareAndCertify(releaseId);
    const result = await manager.ensureReleaseReady(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(result.repaired, false);
  });

  test("ensureReleaseReady auto-repairs when runtime digest diverges", async () => {
    const { manager, runtime } = createTestManager(libraryRoot);
    await manager.prepareAndCertify(releaseId);
    const namespace = buildReleaseNamespace(releaseId);
    const storage = runtime.getStorage();
    const cache = await storage.open(namespace);
    const meta = await runtime.getReleaseMetadata(releaseId);
    assert.ok(meta);
    meta.content_digest = "sha256:" + "c".repeat(64);
    await cache.put("__lou-offline-meta.json", {
      body: new TextEncoder().encode(JSON.stringify(meta)),
      contentType: "application/json",
    });

    const result = await manager.ensureReleaseReady(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(result.repaired, true);
  });

  test("ensureReleaseReady auto-repairs after failed offline_status", async () => {
    const { manager, runtime } = createTestManager(libraryRoot);
    await manager.prepareAndCertify(releaseId);
    await runtime.removeRelease(releaseId);
    await manager.invalidateIfStale(releaseId);

    const result = await manager.ensureReleaseReady(releaseId);
    assert.equal(result.status, OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(result.repaired, true);
  });

  test("installing new active release preserves archived offline_ready and runtime", async () => {
    const { manager, runtime } = createTestManager(libraryRoot);
    const releaseIdV1 = releaseId;
    await manager.prepareAndCertify(releaseIdV1);

    const release2Dir = path.join(tmp, "release-v2");
    writeMiniRelease(release2Dir, { publication_version: 2, body: "v2 body\n" });
    installPublishedRelease(release2Dir, libraryRoot);
    const releaseIdV2 = "cardio__234__2022__2";

    const catalog = loadOrCreateCatalog(libraryRoot);
    const v1 = catalog.entries.find((e) => e.release_id === releaseIdV1);
    const v2 = catalog.entries.find((e) => e.release_id === releaseIdV2);
    assert.equal(v1.status, "archived");
    assert.equal(v1.offline_status, OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(v2.status, "active");
    assert.equal(await runtime.hasRelease(releaseIdV1, v1.content_digest), true);

    await manager.prepareAndCertify(releaseIdV2);
    assert.equal(await runtime.hasRelease(releaseIdV1, v1.content_digest), true);
    assert.equal(await runtime.hasRelease(releaseIdV2, v2.content_digest), true);
  });
});
