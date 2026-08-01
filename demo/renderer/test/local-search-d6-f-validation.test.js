/**
 * Lot D6-F — Validation offline, cache, D4/Patrimoine, diagnostics (Node).
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";
import nodeCrypto from "node:crypto";

import { createMemorySearchCacheStorage } from "../library/local-search-cache.js";
import { createLocalSearchRuntime } from "../library/local-search-runtime.js";
import { createBrowserPackageAccess } from "../library/browser-package-access.js";
import { compose } from "../composition/composition-engine.js";
import compositionSpec from "../composition/corpus-composition-v1.json" with { type: "json" };
import { DIAGNOSTICS, INDEX_SCHEMA_VERSION } from "../local-search-normalize.js";
import { RUNTIME_DIAGNOSTICS } from "../library/local-search-runtime-shared.js";
import { attachReleaseIdentity } from "../../../tools/lou-build/lib/release-identity.js";
import { installPublishedRelease } from "../../../tools/lou-build/lib/library-install.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const FIXTURE_LIBRARY = path.join(HERE, "fixtures/product-library");
const LIBRARY_BASE = "https://reader.test/library";
const RELEASE_ID = "cardio__234__2022__1";
const CHAPTER = "cardio/234";
const CONTENT_DIGEST =
    "sha256:fbadd8232e9d0aa133364365d752603dcde38199f786e5eddd137fcfe2b534f5";

function loadScript(dom, file) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
}

function setupPatrimonyDom() {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
        url: "http://localhost/?chapter=cardio%2F234&product=1",
        runScripts: "outside-only",
    });
    dom.window.indexedDB = new IDBFactory();
    dom.window.__LOU_NODE_CRYPTO__ = nodeCrypto;
    for (const file of [
        "learner-patrimony.js",
        "learner-store.js",
        "learner-snapshot.js",
        "session-service.js",
    ]) {
        loadScript(dom, file);
    }
    dom.window.LouLearnerStore.setReleaseContext({
        releaseId: RELEASE_ID,
        chapter: CHAPTER,
    });
    return dom;
}

function mockLibraryFetch(libraryRoot, libraryBaseUrl = LIBRARY_BASE) {
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

function createRuntime(libraryRoot) {
    const cacheStorage = createMemorySearchCacheStorage();
    const fetchFn = mockLibraryFetch(libraryRoot);
    const packageAccess = createBrowserPackageAccess({
        libraryBaseUrl: LIBRARY_BASE,
        fetch: fetchFn,
    });
    const runtime = createLocalSearchRuntime({
        packageAccess,
        cacheStorage,
        compose,
        compositionSpec,
        fetch: fetchFn,
    });
    runtime.setOpenRelease({
        releaseId: RELEASE_ID,
        contentDigest: CONTENT_DIGEST,
        chapter: CHAPTER,
    });
    return { runtime, cacheStorage, packageAccess, fetchFn };
}

function writeSearchMiniRelease(root) {
    const chapter = "search/test";
    const edition = 2022;

    fs.mkdirSync(path.join(root, "projections"), { recursive: true });
    fs.writeFileSync(
        path.join(root, "projections/mini.md"),
        "## Block {#MEC-mini}\n\nUnique searchable token xyzzysearchtoken.\n"
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

describe("D6-F — Patrimoine and Snapshot isolation", () => {
    test("export snapshot never includes Search domain", async () => {
        const dom = setupPatrimonyDom();
        const snapshot = await dom.window.LouLearnerSnapshot.exportSnapshot();
        const domainIds = snapshot.body.domains.map((d) => d.domain_id);
        assert.ok(!domainIds.some((id) => /search/i.test(id)));
        const blob = JSON.stringify(snapshot);
        assert.ok(!/searchhit/i.test(blob));
        assert.ok(!/local-search-ui/i.test(blob));
    });

    test("import snapshot does not touch Local Search runtime state", async () => {
        const dom = setupPatrimonyDom();
        loadScript(dom, "search-navigation.js");
        loadScript(dom, "local-search-ui.js");

        const snapshot = await dom.window.LouLearnerSnapshot.exportSnapshot();
        const brokenRuntime = {
            ensureIndex: async () => ({ ok: true, cacheStatus: "valid" }),
            search: async () => ({
                hits: [{ release_id: RELEASE_ID, viewId: "mental-model", snippet: "x" }],
                diagnostics: [],
                cacheStatus: "valid",
            }),
            getStatus: () => ({ hasIndex: true }),
        };
        const ui = dom.window.LouLocalSearchUI.create({
            runtime: brokenRuntime,
            releaseId: RELEASE_ID,
            tabs: [{ viewId: "mental-model", label: "Modèle mental" }],
            debounceMs: 0,
            showTab: async () => {},
        });
        ui.mount();
        ui.open();
        await ui.runSearch("insuffisance");
        assert.equal(ui.getHits().length, 1);

        await dom.window.LouLearnerSnapshot.importSnapshot(snapshot, {
            store: dom.window.LouLearnerStore,
        });

        assert.equal(ui.getState(), "results");
        assert.equal(ui.getHits().length, 1);
    });
});

describe("D6-F — Session Service / D4 non-persistence", () => {
    test("ResumePlan payload has no Search fields", () => {
        const dom = setupPatrimonyDom();
        const service = dom.window.LouSessionService;
        const plan = service.buildResumePlan({
            entryMode: "cold_boot",
            requestedChapter: CHAPTER,
            activeReleaseId: RELEASE_ID,
            offlineStatus: "offline_ready",
            releaseInstalled: true,
            installedReleaseIds: [RELEASE_ID],
            viewAvailability: {
                "mental-model": "published",
            },
            viewOrder: ["mental-model"],
            sessionRecords: [],
            observedAt: "2026-08-01T10:00:00.000Z",
            isOfflineRequired: false,
            productMode: true,
        });
        const serialized = JSON.stringify(plan);
        assert.ok(!/searchquery/i.test(serialized));
        assert.ok(!/searchhit/i.test(serialized));
        assert.equal(plan.search, undefined);
    });
});

describe("D6-F — Cache lifecycle matrix", () => {
    test("first usage without cache then valid reuse", async () => {
        const { runtime, cacheStorage } = createRuntime(FIXTURE_LIBRARY);
        assert.equal(await cacheStorage.get(RELEASE_ID), null);
        const first = await runtime.ensureIndex();
        assert.equal(first.indexBuilt, true);
        const second = await runtime.ensureIndex();
        assert.equal(second.indexBuilt, false);
        assert.equal(second.cacheStatus, "valid");
    });

    test("manual delete then reconstruction", async () => {
        const { runtime, cacheStorage } = createRuntime(FIXTURE_LIBRARY);
        await runtime.ensureIndex();
        await cacheStorage.delete(RELEASE_ID);
        const rebuilt = await runtime.ensureIndex();
        assert.equal(rebuilt.indexBuilt, true);
        const search = await runtime.search("insuffisance");
        assert.ok(search.hits.length > 0);
    });

    test("corrupt cache abandoned and rebuilt", async () => {
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
    });

    test("stale cache after content_digest change", async () => {
        const { runtime } = createRuntime(FIXTURE_LIBRARY);
        await runtime.ensureIndex();
        runtime.setOpenRelease({
            releaseId: RELEASE_ID,
            contentDigest: "sha256:" + "c".repeat(64),
            chapter: CHAPTER,
        });
        const ensure = await runtime.ensureIndex();
        assert.ok(
            ensure.diagnostics.includes(DIAGNOSTICS.CACHE_STALE) ||
                ensure.diagnostics.includes(DIAGNOSTICS.CACHE_MISSING)
        );
    });

    test("stale cache after index_schema_version change", async () => {
        const { runtime, cacheStorage } = createRuntime(FIXTURE_LIBRARY);
        await runtime.ensureIndex();
        const record = await cacheStorage.get(RELEASE_ID);
        record.index_schema_version = 99;
        await cacheStorage.put(record);
        const ensure = await runtime.ensureIndex();
        assert.ok(ensure.diagnostics.includes(DIAGNOSTICS.SCHEMA_INCOMPATIBLE));
    });
});

describe("D6-F — Release lifecycle", () => {
    test("refuses search for non-open release_id", async () => {
        const { runtime } = createRuntime(FIXTURE_LIBRARY);
        await runtime.ensureIndex();
        const result = await runtime.search("insuffisance", {
            releaseId: "other__release__999",
        });
        assert.equal(result.hits.length, 0);
        assert.ok(result.diagnostics.includes(DIAGNOSTICS.SCOPE_REFUSED));
    });

    test("purge isolates cache per release", async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-d6f-"));
        try {
            fs.cpSync(FIXTURE_LIBRARY, tmp, { recursive: true });
            const miniRoot = path.join(tmp, "mini-pkg");
            fs.mkdirSync(miniRoot, { recursive: true });
            const miniReleaseId = writeSearchMiniRelease(miniRoot);
            installPublishedRelease(miniRoot, tmp);
            const fetchFn = mockLibraryFetch(tmp);
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
            await runtimeA.ensureIndex();

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
                chapter: miniEntry.chapter,
            });
            const hitsB = (await runtimeB.search("xyzzysearchtoken")).hits;
            const hitsA = (await runtimeA.search("insuffisance")).hits;
            assert.ok(hitsA.length > 0);
            assert.ok(hitsB.length > 0);
            assert.ok(hitsA.every((h) => h.release_id === RELEASE_ID));
            assert.ok(hitsB.every((h) => h.release_id === miniReleaseId));

            await runtimeA.purge(RELEASE_ID);
            assert.equal(await cacheStorage.get(RELEASE_ID), null);
            assert.ok(await cacheStorage.get(miniReleaseId));
        } finally {
            fs.rmSync(tmp, { recursive: true, force: true });
        }
    });
});

describe("D6-F — Runtime diagnostics", () => {
    test("manifest inaccessible", async () => {
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

    test("ensureIndex fails when no open release is bound", async () => {
        const fetchFn = mockLibraryFetch(FIXTURE_LIBRARY);
        const runtime = createLocalSearchRuntime({
            packageAccess: createBrowserPackageAccess({
                libraryBaseUrl: LIBRARY_BASE,
                fetch: fetchFn,
            }),
            cacheStorage: createMemorySearchCacheStorage(),
            compose,
            compositionSpec,
            fetch: fetchFn,
        });
        await assert.rejects(
            () => runtime.ensureIndex(),
            /no open release/
        );
    });
});

describe("D6-F — regression gates", () => {
    test("D6-C suite", async () => {
        const { spawnSync } = await import("node:child_process");
        const result = spawnSync(
            process.execPath,
            ["--test", path.join(HERE, "local-search-service.test.js")],
            { cwd: ROOT, encoding: "utf8" }
        );
        assert.equal(result.status, 0, result.stderr || result.stdout);
    });

    test("D6-D suite", async () => {
        const { spawnSync } = await import("node:child_process");
        const result = spawnSync(
            process.execPath,
            ["--test", path.join(HERE, "local-search-runtime.test.js")],
            { cwd: ROOT, encoding: "utf8" }
        );
        assert.equal(result.status, 0, result.stderr || result.stdout);
    });

    test("D6-E suite", async () => {
        const { spawnSync } = await import("node:child_process");
        const result = spawnSync(
            process.execPath,
            ["--test", path.join(HERE, "local-search-reader.test.js")],
            { cwd: ROOT, encoding: "utf8" }
        );
        assert.equal(result.status, 0, result.stderr || result.stdout);
    });
});
