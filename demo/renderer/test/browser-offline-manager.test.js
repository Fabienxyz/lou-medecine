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
 */
function writeMiniRelease(root) {
  fs.mkdirSync(path.join(root, "source"), { recursive: true });
  fs.mkdirSync(path.join(root, "build"), { recursive: true });
  fs.writeFileSync(path.join(root, "source", "official-college.md"), "body\n");
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
    packageConfig: { publication_version: 1 },
  });
  fs.writeFileSync(
    path.join(root, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  return manifest;
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
