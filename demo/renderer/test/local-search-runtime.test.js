/**
 * Lot D6-D — Local Search Runtime integration tests.
 */
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { collectDeclaredArtifactPaths } from "../library/package-access-shared.js";
import { createBrowserPackageAccess } from "../library/browser-package-access.js";
import { compose } from "../composition/composition-engine.js";
import compositionSpec from "../composition/corpus-composition-v1.json" with { type: "json" };
import { DIAGNOSTICS, INDEX_SCHEMA_VERSION } from "../local-search-normalize.js";
import { createMemorySearchCacheStorage } from "../library/local-search-cache.js";
import { createLocalSearchRuntime } from "../library/local-search-runtime.js";
import { RUNTIME_DIAGNOSTICS } from "../library/local-search-runtime-shared.js";
import { attachReleaseIdentity } from "../../../tools/lou-build/lib/release-identity.js";
import { installPublishedRelease } from "../../../tools/lou-build/lib/library-install.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_LIBRARY = path.join(HERE, "fixtures/product-library");
const LIBRARY_BASE = "https://reader.test/library";
const RELEASE_ID = "cardio__234__2022__1";
const CHAPTER = "cardio/234";
const CONTENT_DIGEST = "sha256:fbadd8232e9d0aa133364365d752603dcde38199f786e5eddd137fcfe2b534f5";

/**
 * @param {string} libraryRoot
 * @param {string} [libraryBaseUrl]
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
            const type = relPath.endsWith(".json") ? "application/json" : "text/plain";
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
 * @param {string} libraryRoot
 */
function createRuntime(libraryRoot) {
    const cacheStorage = createMemorySearchCacheStorage();
    const fetchFn = createMockLibraryFetch(libraryRoot);
    const packageAccess = createBrowserPackageAccess({
        libraryBaseUrl: LIBRARY_BASE,
        fetch: fetchFn,
    });

    /** @type {string[]} */
    const resolvedPaths = [];
    const originalResolve = packageAccess.resolveAssetUrl.bind(packageAccess);
    packageAccess.resolveAssetUrl = async (releaseId, relativePath) => {
        const result = await originalResolve(releaseId, relativePath);
        resolvedPaths.push(result.relativePath);
        return result;
    };

    const runtime = createLocalSearchRuntime({
        packageAccess,
        cacheStorage,
        compose,
        compositionSpec,
        fetch: fetchFn,
        nowIso: () => "2026-08-01T12:00:00.000Z",
    });

    runtime.setOpenRelease({
        releaseId: RELEASE_ID,
        contentDigest: CONTENT_DIGEST,
        chapter: CHAPTER,
    });

    return { runtime, cacheStorage, packageAccess, resolvedPaths };
}

/**
 * @param {string} root
 */
function writeSearchMiniRelease(root) {
    const chapter = "search/test";
    const edition = 2022;
    const publication_version = 1;

    fs.mkdirSync(path.join(root, "projections"), { recursive: true });
    fs.writeFileSync(
        path.join(root, "projections/mini.md"),
        "## Block {#MEC-mini}\n\nAlpha searchable token here.\n"
    );

    const manifest = {
        chapter,
        slug: "search-mini",
        title: "Search Mini",
        specialty: "Test",
        source_edition: edition,
        college_source_path: "",
        trace_index: "build/traceability.json",
        known_absent: [],
        projections: [
            {
                id: "mechanisms",
                type: "understanding.mechanisms",
                order: 1,
                path: "projections/mini.md",
                status: "published",
                elements: ["MEC-mini"],
            },
        ],
        visuals: [],
        questions: [],
        scenarios: [],
    };
    fs.mkdirSync(path.join(root, "build"), { recursive: true });
    fs.writeFileSync(path.join(root, "build/traceability.json"), "{}\n");
    attachReleaseIdentity(manifest, { chapterDir: root });
    fs.writeFileSync(path.join(root, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
    return manifest.release_id;
}

describe("D6-D — Local Search Runtime", () => {
    test("1 — lazy index build on first search", async () => {
        const { runtime, cacheStorage } = createRuntime(FIXTURE_LIBRARY);
        const before = await cacheStorage.get(RELEASE_ID);
        assert.equal(before, null);

        const result = await runtime.search("insuffisance");
        assert.ok(result.hits.length > 0);
        assert.ok(result.cacheStatus === "rebuilt" || result.cacheStatus === "valid");

        const after = await cacheStorage.get(RELEASE_ID);
        assert.ok(after);
        assert.equal(after.index_schema_version, INDEX_SCHEMA_VERSION);
    });

    test("2 — reuse valid cache on second search", async () => {
        const { runtime } = createRuntime(FIXTURE_LIBRARY);
        const first = await runtime.ensureIndex();
        assert.equal(first.indexBuilt, true);

        const second = await runtime.ensureIndex();
        assert.equal(second.indexBuilt, false);
        assert.equal(second.cacheStatus, "valid");
        assert.ok(second.diagnostics.includes(DIAGNOSTICS.CACHE_VALID));
    });

    test("3 — invalidate on content_digest change", async () => {
        const { runtime, cacheStorage } = createRuntime(FIXTURE_LIBRARY);
        await runtime.ensureIndex();
        assert.ok(await cacheStorage.get(RELEASE_ID));

        runtime.setOpenRelease({
            releaseId: RELEASE_ID,
            contentDigest: "sha256:" + "b".repeat(64),
            chapter: CHAPTER,
        });

        const ensure = await runtime.ensureIndex();
        assert.notEqual(ensure.cacheStatus, "valid");
        assert.ok(
            ensure.diagnostics.includes(DIAGNOSTICS.CACHE_STALE) ||
                ensure.diagnostics.includes(DIAGNOSTICS.CACHE_MISSING)
        );
    });

    test("4 — invalidate on index_schema_version change", async () => {
        const { runtime, cacheStorage } = createRuntime(FIXTURE_LIBRARY);
        await runtime.ensureIndex();
        const record = await cacheStorage.get(RELEASE_ID);
        assert.ok(record);
        record.index_schema_version = 99;
        await cacheStorage.put(record);

        const ensure = await runtime.ensureIndex();
        assert.ok(ensure.diagnostics.includes(DIAGNOSTICS.SCHEMA_INCOMPATIBLE));
        assert.equal(ensure.indexBuilt, true);
    });

    test("5 — rebuild after corrupt cache", async () => {
        const { runtime, cacheStorage } = createRuntime(FIXTURE_LIBRARY);
        await cacheStorage.put({
            release_id: RELEASE_ID,
            content_digest: CONTENT_DIGEST,
            index_schema_version: INDEX_SCHEMA_VERSION,
            viewBindings: [],
            index: null,
        });

        const ensure = await runtime.ensureIndex();
        assert.ok(ensure.diagnostics.includes(RUNTIME_DIAGNOSTICS.CACHE_CORRUPT));
        assert.equal(ensure.indexBuilt, true);
        const search = await runtime.search("insuffisance");
        assert.ok(search.hits.length > 0);
    });

    test("6 — purge by release_id", async () => {
        const { runtime, cacheStorage } = createRuntime(FIXTURE_LIBRARY);
        await runtime.ensureIndex();
        assert.ok(await cacheStorage.get(RELEASE_ID));

        await runtime.purge(RELEASE_ID);
        assert.equal(await cacheStorage.get(RELEASE_ID), null);
        assert.equal(runtime.getStatus().hasIndex, false);
    });

    test("7 — isolation between two releases", async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-ls-"));
        try {
            fs.cpSync(FIXTURE_LIBRARY, tmp, { recursive: true });

            const miniRoot = path.join(tmp, "mini-pkg");
            fs.mkdirSync(miniRoot, { recursive: true });
            const miniReleaseId = writeSearchMiniRelease(miniRoot);
            installPublishedRelease(miniRoot, tmp);

            const fetchFn = createMockLibraryFetch(tmp);
            const cacheStorage = createMemorySearchCacheStorage();
            const packageAccess = createBrowserPackageAccess({
                libraryBaseUrl: LIBRARY_BASE,
                fetch: fetchFn,
            });

            const catalog = JSON.parse(fs.readFileSync(path.join(tmp, "library.json"), "utf8"));
            const miniEntry = catalog.entries.find((e) => e.release_id === miniReleaseId);

            const runtimeA = createLocalSearchRuntime({
                packageAccess,
                cacheStorage,
                compose,
                compositionSpec,
                fetch: fetchFn,
            });
            runtimeA.setOpenRelease({
                releaseId: RELEASE_ID,
                contentDigest: CONTENT_DIGEST,
                chapter: CHAPTER,
            });
            const hitsA = (await runtimeA.search("insuffisance")).hits;

            const runtimeB = createLocalSearchRuntime({
                packageAccess,
                cacheStorage,
                compose,
                compositionSpec,
                fetch: fetchFn,
            });
            runtimeB.setOpenRelease({
                releaseId: miniReleaseId,
                contentDigest: miniEntry.content_digest,
                chapter: "search/test",
            });
            const hitsB = (await runtimeB.search("searchable")).hits;

            assert.ok(hitsA.length > 0);
            assert.ok(hitsB.length > 0);
            assert.ok(hitsA.every((h) => h.release_id === RELEASE_ID));
            assert.ok(hitsB.every((h) => h.release_id === miniReleaseId));

            assert.ok(await cacheStorage.get(RELEASE_ID));
            assert.ok(await cacheStorage.get(miniReleaseId));
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });

    test("8 — refuse release different from open release", async () => {
        const { runtime } = createRuntime(FIXTURE_LIBRARY);
        const result = await runtime.search("insuffisance", {
            releaseId: "other__release__2022__1",
        });
        assert.equal(result.hits.length, 0);
        assert.ok(result.diagnostics.includes(DIAGNOSTICS.SCOPE_REFUSED));
    });

    test("9 — manifest and artefacts via Package Access only", async () => {
        const { runtime, packageAccess, resolvedPaths } = createRuntime(FIXTURE_LIBRARY);
        const manifest = await packageAccess.resolveManifest(RELEASE_ID);
        const declared = new Set(collectDeclaredArtifactPaths(manifest));

        await runtime.search("insuffisance");

        assert.ok(resolvedPaths.length > 0);
        for (const p of resolvedPaths) {
            assert.ok(declared.has(p), `undeclared path read: ${p}`);
            assert.ok(!p.endsWith(".svg"), `svg must not be read: ${p}`);
        }
    });

    test("10 — no filesystem scan (only declared paths)", async () => {
        const { runtime, resolvedPaths } = createRuntime(FIXTURE_LIBRARY);
        await runtime.ensureIndex();
        for (const p of resolvedPaths) {
            assert.ok(!p.includes("library.json"));
            assert.ok(!p.includes("packages/"));
        }
    });

    test("11 — no interaction with Learner Patrimony", async () => {
        assert.equal(typeof globalThis.LouLearnerStore, "undefined");
        const { runtime } = createRuntime(FIXTURE_LIBRARY);
        await runtime.search("insuffisance");
        assert.equal(typeof globalThis.LouLearnerStore, "undefined");
    });

    test("12 — offline_status unchanged after index operations", async () => {
        const catalogPath = path.join(FIXTURE_LIBRARY, "library.json");
        const before = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
        const statusBefore = before.entries[0].offline_status;

        const { runtime } = createRuntime(FIXTURE_LIBRARY);
        await runtime.ensureIndex();
        await runtime.search("insuffisance");
        await runtime.invalidate(RELEASE_ID);

        const after = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
        const statusAfter = after.entries[0].offline_status;
        assert.equal(statusAfter, statusBefore);
    });

    test("13 — local fetch without network (mock library)", async () => {
        const { runtime } = createRuntime(FIXTURE_LIBRARY);
        const result = await runtime.search("insuffisance");
        assert.ok(result.hits.length > 0);
        assert.ok(result.diagnostics.length >= 0);
    });

    test("14 — propagate D6-C diagnostics", async () => {
        const { runtime } = createRuntime(FIXTURE_LIBRARY);
        const short = await runtime.search("x");
        assert.equal(short.hits.length, 0);
        assert.ok(short.diagnostics.includes(DIAGNOSTICS.QUERY_TOO_SHORT));
    });

    test("invalidate() clears cache and marks stale", async () => {
        const { runtime, cacheStorage } = createRuntime(FIXTURE_LIBRARY);
        await runtime.ensureIndex();
        await runtime.invalidate(RELEASE_ID);
        assert.equal(await cacheStorage.get(RELEASE_ID), null);
        assert.ok(runtime.getStatus().diagnostics.includes(DIAGNOSTICS.CACHE_STALE));
    });

    test("manifest inaccessible diagnostic", async () => {
        const cacheStorage = createMemorySearchCacheStorage();
        const packageAccess = createBrowserPackageAccess({
            libraryBaseUrl: LIBRARY_BASE,
            fetch: async () => mockResponse(404, ""),
        });
        const runtime = createLocalSearchRuntime({
            packageAccess,
            cacheStorage,
            compose,
            compositionSpec,
            fetch: async () => mockResponse(404, ""),
        });
        runtime.setOpenRelease({
            releaseId: RELEASE_ID,
            contentDigest: CONTENT_DIGEST,
            chapter: CHAPTER,
        });
        const ensure = await runtime.ensureIndex();
        assert.equal(ensure.ok, false);
        assert.ok(ensure.diagnostics.includes(RUNTIME_DIAGNOSTICS.MANIFEST_INACCESSIBLE));
    });
});

describe("D6-D — regression D6-C service tests", () => {
    test("D6-C suite still passes", async () => {
        const { spawnSync } = await import("node:child_process");
        const result = spawnSync(
            process.execPath,
            ["--test", path.join(HERE, "local-search-service.test.js")],
            { cwd: path.join(HERE, ".."), encoding: "utf8" }
        );
        assert.equal(result.status, 0, result.stderr || result.stdout);
    });
});
