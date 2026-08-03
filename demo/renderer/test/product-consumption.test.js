/**
 * Phase 0.1-D — minimal validation of the real consumption path:
 * install → certify → digest drift → ensureReleaseReady auto-repair.
 */
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { installPublishedRelease } from "../../../tools/lou-build/lib/library-install.js";
import { loadOrCreateCatalog } from "../../../tools/lou-build/lib/library-catalog.js";
import { OFFLINE_STATUS } from "../../../tools/lou-build/lib/offline-state.js";
import { createBrowserPackageAccess } from "../library/browser-package-access.js";
import { createOfflineRuntime } from "../library/offline-runtime.js";
import { createBrowserOfflineManager } from "../library/browser-offline-manager.js";
import { buildReleaseNamespace } from "../library/offline-runtime-shared.js";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);
const SYNC_SCRIPT = path.join(ROOT, "scripts/sync-reader-fixture.mjs");
const CHAPTER_234 = path.join(ROOT, "01-learning/chapters/cardio/234");

/** @returns {import("../library/offline-runtime.js").OfflineRuntimeStorage} */
function createMemoryRuntimeStorage() {
  /** @type {Map<string, Map<string, import("../library/offline-runtime.js").StoredResource>>} */
  const stores = new Map();
  return {
    has: (name) => Promise.resolve(stores.has(name)),
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
 * @param {string} libraryRoot
 * @param {string} [libraryBaseUrl]
 */
function createMockLibraryFetch(libraryRoot, libraryBaseUrl = "https://reader.test/library") {
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

describe("Phase 0.1 — product consumption path", () => {
  /** @type {string} */
  let libraryRoot;
  /** @type {string} */
  let releaseId;

  beforeEach(() => {
    libraryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lou-p01-"));
    execFileSync(process.execPath, [SYNC_SCRIPT, "--library", libraryRoot], {
      cwd: ROOT,
    });
    const manifest = JSON.parse(
      fs.readFileSync(path.join(CHAPTER_234, "manifest.json"), "utf8")
    );
    releaseId = manifest.release_id;
  });

  afterEach(() => {
    fs.rmSync(libraryRoot, { recursive: true, force: true });
  });

  test("republication via sync + ensureReleaseReady repairs stale runtime", async () => {
    const fetchFn = createMockLibraryFetch(libraryRoot);
    const packageAccess = createBrowserPackageAccess({
      libraryBaseUrl: "https://reader.test/library",
      fetch: fetchFn,
    });
    const runtime = createOfflineRuntime({
      storage: createMemoryRuntimeStorage(),
      libraryBasePath: "/library",
      allowDevPackageWarmCache: false,
      fetch: fetchFn,
    });
    const manager = createBrowserOfflineManager({
      libraryBaseUrl: "https://reader.test/library",
      packageAccess,
      runtime,
      fetch: fetchFn,
    });

    const first = await manager.ensureReleaseReady(releaseId);
    assert.equal(first.status, OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(first.repaired, false);

    const manifestPath = path.join(
      libraryRoot,
      "packages",
      releaseId,
      "manifest.json"
    );
    const installed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const namespace = buildReleaseNamespace(releaseId);
    const storage = runtime.getStorage();
    const cache = await storage.open(namespace);
    const meta = await runtime.getReleaseMetadata(releaseId);
    assert.ok(meta);
    meta.content_digest = "sha256:" + "d".repeat(64);
    await cache.put("__lou-offline-meta.json", {
      body: new TextEncoder().encode(JSON.stringify(meta)),
      contentType: "application/json",
    });

    execFileSync(process.execPath, [SYNC_SCRIPT, "--library", libraryRoot], {
      cwd: ROOT,
    });
    const refreshed = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert.equal(refreshed.content_digest, installed.content_digest);

    const second = await manager.ensureReleaseReady(releaseId);
    assert.equal(second.status, OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(second.repaired, true);

    const catalog = loadOrCreateCatalog(libraryRoot);
    const entry = catalog.entries.find((e) => e.release_id === releaseId);
    assert.equal(entry?.offline_status, OFFLINE_STATUS.OFFLINE_READY);
    assert.equal(
      await runtime.hasRelease(releaseId, refreshed.content_digest),
      true
    );
  });
});
