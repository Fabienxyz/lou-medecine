import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  OfflineRuntimeError,
  SHELL_CACHE_NAME,
  SHELL_URLS,
  buildReleaseNamespace,
  buildReleaseStagingNamespace,
  parseReleaseScopedPath,
  isMonorepoDevPath,
} from "../library/offline-runtime-shared.js";
import { createOfflineRuntime } from "../library/offline-runtime.js";
import { prepareReleaseViaRuntime } from "../library/offline-manager-runtime-bridge.js";

const ORIGIN = "https://reader.test";
const LIBRARY_BASE = "/library";
const DIGEST_A = "sha256:" + "a".repeat(64);
const DIGEST_B = "sha256:" + "b".repeat(64);
const RELEASE_A = "cardio__234__2022__1";
const RELEASE_B = "cardio__234__2022__2";

/**
 * @returns {import("../library/offline-runtime.js").OfflineRuntimeStorage}
 */
function createMemoryStorage() {
  /** @type {Map<string, Map<string, import("../library/offline-runtime.js").StoredResource>>} */
  const caches = new Map();

  return {
    has(name) {
      return Promise.resolve(caches.has(name));
    },
    async open(name) {
      if (!caches.has(name)) {
        caches.set(name, new Map());
      }
      const store = caches.get(name);
      return {
        async get(key) {
          return store.get(key) ?? null;
        },
        async put(key, resource) {
          store.set(key, resource);
        },
        async keys() {
          return [...store.keys()];
        },
        async clear() {
          store.clear();
        },
      };
    },
    async keys() {
      return [...caches.keys()];
    },
    async delete(name) {
      return caches.delete(name);
    },
  };
}

/**
 * @param {Record<string, Record<string, { body?: string, contentType?: string, status?: number }>>} fixtures
 */
function createFixtureFetch(fixtures) {
  return async (url) => {
    const parsed = new URL(url, ORIGIN);
    const pathname = parsed.pathname;

    for (const [releaseId, files] of Object.entries(fixtures.releases || {})) {
      const prefix = `${LIBRARY_BASE}/releases/${encodeURIComponent(releaseId)}/`;
      if (pathname.startsWith(prefix)) {
        const rel = decodeURIComponent(pathname.slice(prefix.length));
        const file = files[rel];
        if (!file) {
          return new Response("missing", { status: 404 });
        }
        return new Response(file.body ?? "", {
          status: file.status ?? 200,
          headers: file.contentType
            ? { "content-type": file.contentType }
            : undefined,
        });
      }
    }

    if (fixtures.shell?.[pathname]) {
      const file = fixtures.shell[pathname];
      return new Response(file.body ?? "", {
        status: file.status ?? 200,
        headers: file.contentType
          ? { "content-type": file.contentType }
          : undefined,
      });
    }

    return new Response("not found", { status: 404 });
  };
}

function resourceUrl(releaseId, relativePath) {
  return `${ORIGIN}${LIBRARY_BASE}/releases/${encodeURIComponent(releaseId)}/${relativePath
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

function miniResources(releaseId) {
  return [
    {
      relativePath: "manifest.json",
      url: resourceUrl(releaseId, "manifest.json"),
    },
    {
      relativePath: "source/official-college.md",
      url: resourceUrl(releaseId, "source/official-college.md"),
    },
  ];
}

describe("offline runtime (D2-E)", () => {
  /** @type {ReturnType<typeof createMemoryStorage>} */
  let storage;
  /** @type {ReturnType<typeof createOfflineRuntime>} */
  let runtime;
  /** @type {ReturnType<typeof createFixtureFetch>} */
  let fetchImpl;

  beforeEach(() => {
    storage = createMemoryStorage();
    fetchImpl = createFixtureFetch({
      shell: Object.fromEntries(
        SHELL_URLS.map((url) => [
          url,
          { body: `shell:${url}`, contentType: "text/plain" },
        ])
      ),
      releases: {
        [RELEASE_A]: {
          "manifest.json": {
            body: JSON.stringify({ release_id: RELEASE_A }),
            contentType: "application/json",
          },
          "source/official-college.md": {
            body: "college body\n",
            contentType: "text/markdown",
          },
        },
        [RELEASE_B]: {
          "manifest.json": {
            body: JSON.stringify({ release_id: RELEASE_B }),
            contentType: "application/json",
          },
          "source/official-college.md": {
            body: "other body\n",
            contentType: "text/markdown",
          },
        },
      },
    });
    runtime = createOfflineRuntime({
      storage,
      fetch: fetchImpl,
      libraryBasePath: LIBRARY_BASE,
      allowDevPackageWarmCache: false,
    });
  });

  test("prepareShell caches all shell assets", async () => {
    const result = await runtime.prepareShell();
    assert.equal(result.cached, SHELL_URLS.length);

    const response = await runtime.resolveOrServe(
      `${ORIGIN}/demo/renderer/app.js`
    );
    assert.ok(response);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /^shell:/);

    const keys = await storage.keys();
    assert.ok(keys.includes(SHELL_CACHE_NAME));
  });

  test("prepareRelease stores a complete Release namespace", async () => {
    const result = await runtime.prepareRelease({
      releaseId: RELEASE_A,
      contentDigest: DIGEST_A,
      resources: miniResources(RELEASE_A),
    });
    assert.equal(result.releaseId, RELEASE_A);
    assert.equal(result.resourceCount, 2);
    assert.equal(await runtime.hasRelease(RELEASE_A, DIGEST_A), true);

    const keys = await storage.keys();
    assert.ok(keys.includes(buildReleaseNamespace(RELEASE_A)));
    assert.equal(keys.includes(buildReleaseStagingNamespace(RELEASE_A)), false);
  });

  test("namespaces are isolated per release_id", async () => {
    await runtime.prepareRelease({
      releaseId: RELEASE_A,
      contentDigest: DIGEST_A,
      resources: miniResources(RELEASE_A),
    });
    await runtime.prepareRelease({
      releaseId: RELEASE_B,
      contentDigest: DIGEST_A,
      resources: miniResources(RELEASE_B),
    });

    const nsA = buildReleaseNamespace(RELEASE_A);
    const nsB = buildReleaseNamespace(RELEASE_B);
    assert.notEqual(nsA, nsB);

    const cacheA = await storage.open(nsA);
    const cacheB = await storage.open(nsB);
    const bodyA = await cacheA.get("source/official-college.md");
    const bodyB = await cacheB.get("source/official-college.md");
    assert.notEqual(
      new TextDecoder().decode(bodyA.body),
      new TextDecoder().decode(bodyB.body)
    );
  });

  test("same release_id and digest is idempotent", async () => {
    let fetchCount = 0;
    const countingFetch = async (url) => {
      fetchCount += 1;
      return fetchImpl(url);
    };
    const countingRuntime = createOfflineRuntime({
      storage,
      fetch: countingFetch,
      libraryBasePath: LIBRARY_BASE,
    });

    await countingRuntime.prepareRelease({
      releaseId: RELEASE_A,
      contentDigest: DIGEST_A,
      resources: miniResources(RELEASE_A),
    });
    const firstFetchCount = fetchCount;

    await countingRuntime.prepareRelease({
      releaseId: RELEASE_A,
      contentDigest: DIGEST_A,
      resources: miniResources(RELEASE_A),
    });
    assert.equal(fetchCount, firstFetchCount);
    assert.equal(await countingRuntime.hasRelease(RELEASE_A, DIGEST_A), true);
  });

  test("same release_id with different digest is rejected", async () => {
    await runtime.prepareRelease({
      releaseId: RELEASE_A,
      contentDigest: DIGEST_A,
      resources: miniResources(RELEASE_A),
    });

    await assert.rejects(
      () =>
        runtime.prepareRelease({
          releaseId: RELEASE_A,
          contentDigest: DIGEST_B,
          resources: miniResources(RELEASE_A),
        }),
      (err) =>
        err instanceof OfflineRuntimeError && err.code === "DIGEST_MISMATCH"
    );
  });

  test("missing resource fails without publishing partial namespace", async () => {
    const brokenFetch = createFixtureFetch({
      releases: {
        [RELEASE_A]: {
          "manifest.json": {
            body: JSON.stringify({ release_id: RELEASE_A }),
            contentType: "application/json",
          },
        },
      },
    });
    const brokenRuntime = createOfflineRuntime({
      storage,
      fetch: brokenFetch,
      libraryBasePath: LIBRARY_BASE,
    });

    await assert.rejects(
      () =>
        brokenRuntime.prepareRelease({
          releaseId: RELEASE_A,
          contentDigest: DIGEST_A,
          resources: miniResources(RELEASE_A),
        }),
      (err) =>
        err instanceof OfflineRuntimeError &&
        err.code === "RESOURCE_FETCH_FAILED"
    );

    const keys = await storage.keys();
    assert.equal(keys.includes(buildReleaseNamespace(RELEASE_A)), false);
    assert.equal(keys.includes(buildReleaseStagingNamespace(RELEASE_A)), false);
    assert.equal(await brokenRuntime.hasRelease(RELEASE_A, DIGEST_A), false);
  });

  test("interrupted preparation rolls back staging namespace", async () => {
    let callCount = 0;
    const interruptFetch = async (url) => {
      callCount += 1;
      if (callCount === 2) {
        throw new Error("simulated interruption");
      }
      return fetchImpl(url);
    };
    const interruptRuntime = createOfflineRuntime({
      storage,
      fetch: interruptFetch,
      libraryBasePath: LIBRARY_BASE,
    });

    await assert.rejects(() =>
      interruptRuntime.prepareRelease({
        releaseId: RELEASE_A,
        contentDigest: DIGEST_A,
        resources: miniResources(RELEASE_A),
      })
    );

    const keys = await storage.keys();
    assert.equal(keys.includes(buildReleaseNamespace(RELEASE_A)), false);
    assert.equal(keys.includes(buildReleaseStagingNamespace(RELEASE_A)), false);
  });

  test("path traversal is rejected at serve time", async () => {
    await runtime.prepareRelease({
      releaseId: RELEASE_A,
      contentDigest: DIGEST_A,
      resources: miniResources(RELEASE_A),
    });

    const response = await runtime.resolveOrServe(
      `${ORIGIN}${LIBRARY_BASE}/releases/${RELEASE_A}/source/../../outside.md`
    );
    assert.ok(response);
    assert.equal(response.status, 403);
    assert.equal(response.headers.get("x-lou-offline-error"), "FORBIDDEN_PATH");
  });

  test("concurrent preparations of the same release_id are deduplicated", async () => {
    let fetchCount = 0;
    const slowFetch = async (url) => {
      fetchCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return fetchImpl(url);
    };
    const concurrentRuntime = createOfflineRuntime({
      storage,
      fetch: slowFetch,
      libraryBasePath: LIBRARY_BASE,
    });

    const [a, b] = await Promise.all([
      concurrentRuntime.prepareRelease({
        releaseId: RELEASE_A,
        contentDigest: DIGEST_A,
        resources: miniResources(RELEASE_A),
      }),
      concurrentRuntime.prepareRelease({
        releaseId: RELEASE_A,
        contentDigest: DIGEST_A,
        resources: miniResources(RELEASE_A),
      }),
    ]);

    assert.deepEqual(a, b);
    assert.equal(fetchCount, 2);
  });

  test("concurrent preparations of different release_ids stay independent", async () => {
    const [a, b] = await Promise.all([
      runtime.prepareRelease({
        releaseId: RELEASE_A,
        contentDigest: DIGEST_A,
        resources: miniResources(RELEASE_A),
      }),
      runtime.prepareRelease({
        releaseId: RELEASE_B,
        contentDigest: DIGEST_A,
        resources: miniResources(RELEASE_B),
      }),
    ]);

    assert.equal(a.releaseId, RELEASE_A);
    assert.equal(b.releaseId, RELEASE_B);
    assert.equal(await runtime.hasRelease(RELEASE_A, DIGEST_A), true);
    assert.equal(await runtime.hasRelease(RELEASE_B, DIGEST_A), true);
  });

  test("resolveOrServe returns manifest and declared artefact offline", async () => {
    await runtime.prepareRelease({
      releaseId: RELEASE_A,
      contentDigest: DIGEST_A,
      resources: miniResources(RELEASE_A),
    });

    const manifestResponse = await runtime.resolveOrServe(
      resourceUrl(RELEASE_A, "manifest.json")
    );
    assert.ok(manifestResponse);
    assert.equal(manifestResponse.status, 200);
    const manifest = JSON.parse(await manifestResponse.text());
    assert.equal(manifest.release_id, RELEASE_A);

    const assetResponse = await runtime.resolveOrServe(
      resourceUrl(RELEASE_A, "source/official-college.md")
    );
    assert.ok(assetResponse);
    assert.match(await assetResponse.text(), /college body/);
  });

  test("unprepared resource returns explicit error", async () => {
    const response = await runtime.resolveOrServe(
      resourceUrl(RELEASE_A, "manifest.json")
    );
    assert.ok(response);
    assert.equal(response.status, 404);
    assert.equal(
      response.headers.get("x-lou-offline-error"),
      "PREPARATION_INCOMPLETE"
    );
  });

  test("product mode does not fallback to monorepo dev paths", async () => {
    assert.equal(isMonorepoDevPath("/01-learning/chapters/cardio/234/manifest.json"), true);
    const response = await runtime.resolveOrServe(
      `${ORIGIN}/01-learning/chapters/cardio/234/manifest.json`
    );
    assert.equal(response, null);
  });

  test("shell assets contain no external CDN references", () => {
    for (const url of SHELL_URLS) {
      assert.equal(url.includes("googleapis.com"), false, url);
      assert.equal(url.includes("gstatic.com"), false, url);
      assert.equal(url.includes("cdn."), false, url);
      assert.equal(url.startsWith("http"), false, url);
    }
  });

  test("removeRelease deletes the namespace", async () => {
    await runtime.prepareRelease({
      releaseId: RELEASE_A,
      contentDigest: DIGEST_A,
      resources: miniResources(RELEASE_A),
    });
    assert.equal(await runtime.hasRelease(RELEASE_A, DIGEST_A), true);
    await runtime.removeRelease(RELEASE_A);
    assert.equal(await runtime.hasRelease(RELEASE_A, DIGEST_A), false);
  });

  test("offline manager bridge prepares via explicit resource list", async () => {
    const result = await prepareReleaseViaRuntime(runtime, {
      releaseId: RELEASE_A,
      contentDigest: DIGEST_A,
      declaredPaths: ["source/official-college.md"],
      resolveResourceUrl: (releaseId, relativePath) =>
        resourceUrl(releaseId, relativePath),
    });
    assert.equal(result.resourceCount, 2);
    assert.equal(await runtime.hasRelease(RELEASE_A, DIGEST_A), true);
  });

  test("parseReleaseScopedPath rejects traversal segments", () => {
    assert.equal(
      parseReleaseScopedPath(
        `${LIBRARY_BASE}/releases/${RELEASE_A}/../manifest.json`
      ),
      null
    );
  });
});
