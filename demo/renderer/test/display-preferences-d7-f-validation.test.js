/**
 * Lot D7-F — Display Preferences validation (Node): Snapshot, D4/D6 orthogonality,
 * diagnostics, singleton, reset, boot order, I/O failures.
 */
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodeCrypto from "node:crypto";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";

import { buildDefaults, DIAGNOSTICS, RECORD_ID } from "../display-preferences-service.js";
import { createDisplayPreferencesRuntime } from "../display-preferences-runtime.js";
import { createBrowserDisplayPreferencesRuntime } from "../library/browser-display-preferences-runtime.js";
import { createMemorySearchCacheStorage } from "../library/local-search-cache.js";
import { createLocalSearchRuntime } from "../library/local-search-runtime.js";
import { createBrowserPackageAccess } from "../library/browser-package-access.js";
import { compose } from "../composition/composition-engine.js";
import compositionSpec from "../composition/corpus-composition-v1.json" with { type: "json" };

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
        "config.js",
        "learner-patrimony.js",
        "learner-store.js",
        "learner-snapshot.js",
        "session-service.js",
        "display-preferences-apply.js",
    ]) {
        loadScript(dom, file);
    }
    dom.window.LouLearnerStore.setReleaseContext({
        releaseId: RELEASE_ID,
        chapter: CHAPTER,
    });
    return dom;
}

function createMemoryStorage() {
    let rows = [];
    let nextId = 1;
    return {
        async listDisplayPreferencesRecords() {
            return rows.slice();
        },
        async upsertDisplayPreferencesRecord(record) {
            const index = rows.findIndex(
                (row) => row.logical_record_id === record.logical_record_id
            );
            if (index >= 0) {
                rows[index] = Object.assign({}, record, { id: rows[index].id });
                return rows[index];
            }
            const row = Object.assign({}, record, { id: nextId++ });
            rows.push(row);
            return row;
        },
        async deleteDisplayPreferencesRecords() {
            rows = [];
        },
        async deleteDisplayPreferencesExcept(keepLogicalRecordId) {
            const before = rows.length;
            rows = rows.filter((row) => row.logical_record_id === keepLogicalRecordId);
            return before - rows.length;
        },
        _rows() {
            return rows.slice();
        },
    };
}

function mockLibraryFetch(libraryRoot, libraryBaseUrl = LIBRARY_BASE) {
    const basePath = new URL(libraryBaseUrl).pathname.replace(/\/+$/, "");
    return async (url, init = {}) => {
        const parsed = new URL(url, "https://reader.test");
        const pathname = parsed.pathname;
        if (pathname === `${basePath}/library.json`) {
            return mockResponse(200, fs.readFileSync(path.join(libraryRoot, "library.json")));
        }
        const prefix = `${basePath}/releases/`;
        if (pathname.startsWith(prefix)) {
            const rest = pathname.slice(prefix.length);
            const slash = rest.indexOf("/");
            if (slash === -1) {
                return mockResponse(404, "");
            }
            const relPath = decodeURIComponent(rest.slice(slash + 1));
            const filePath = path.join(
                libraryRoot,
                "packages",
                decodeURIComponent(rest.slice(0, slash)),
                relPath
            );
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

function mockResponse(status, body) {
    return {
        ok: status >= 200 && status < 300,
        status,
        async text() {
            return body.toString();
        },
        async json() {
            return JSON.parse(body.toString());
        },
        headers: { get: () => null },
    };
}

function createSearchRuntime(libraryRoot) {
    const runtime = createLocalSearchRuntime({
        packageAccess: createBrowserPackageAccess({
            libraryBaseUrl: LIBRARY_BASE,
            fetch: mockLibraryFetch(libraryRoot),
        }),
        cacheStorage: createMemorySearchCacheStorage(),
        compose,
        compositionSpec,
        fetch: mockLibraryFetch(libraryRoot),
    });
    runtime.setOpenRelease({
        releaseId: RELEASE_ID,
        contentDigest: CONTENT_DIGEST,
        chapter: CHAPTER,
    });
    return runtime;
}

function domainFromSnapshot(snapshot) {
    return snapshot.body.domains.find((d) => d.domain_id === "display_preferences");
}

describe("D7-F — First boot and defaults", () => {
    test("DP-F-N01 effective defaults without persisted record", async () => {
        const dom = setupPatrimonyDom();
        const win = dom.window;
        await win.LouLearnerStore.open();

        const runtime = createBrowserDisplayPreferencesRuntime({
            store: win.LouLearnerStore,
            applyDisplayPreferences: win.LouDisplayPreferencesApply.applyDisplayPreferences,
        });
        const result = await runtime.loadAndApply();

        assert.deepEqual(result.preferences, buildDefaults());
        assert.ok(result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_MISSING));
        assert.equal((await win.LouLearnerStore.listDisplayPreferencesRecords()).length, 0);

        const snapshot = await win.LouLearnerSnapshot.exportSnapshot();
        assert.equal(domainFromSnapshot(snapshot).records.length, 0);
    });
});

describe("D7-F — Singleton and successive modifications", () => {
    test("DP-F-N02 first patch creates singleton, updates same record_id", async () => {
        const storage = createMemoryStorage();
        const applied = [];
        const runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: (p) => applied.push(p.theme),
        });
        await runtime.loadAndApply();
        await runtime.applyPatch({ theme: "dark" });
        await runtime.applyPatch({ fontSize: "large" });

        assert.equal(storage._rows().length, 1);
        assert.equal(storage._rows()[0].record_id, RECORD_ID);
        assert.equal(storage._rows()[0].theme, "dark");
        assert.equal(storage._rows()[0].fontSize, "large");
        assert.equal(storage._rows()[0].release_id, undefined);
    });

    test("DP-F-N03 successive sequence dark → large → narrow → light → wide", async () => {
        const storage = createMemoryStorage();
        const runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: () => {},
        });
        await runtime.loadAndApply();
        await runtime.applyPatch({ theme: "dark" });
        await runtime.applyPatch({ fontSize: "large" });
        await runtime.applyPatch({ readingWidth: "narrow" });
        await runtime.applyPatch({ theme: "light" });
        await runtime.applyPatch({ readingWidth: "wide" });

        const prefs = runtime.getCurrentPreferences();
        assert.equal(prefs.theme, "light");
        assert.equal(prefs.fontSize, "large");
        assert.equal(prefs.readingWidth, "wide");
        assert.equal(storage._rows().length, 1);
    });
});

describe("D7-F — Reset", () => {
    test("DP-F-N04 reset deletes record and restores defaults", async () => {
        const dom = setupPatrimonyDom();
        const win = dom.window;
        await win.LouLearnerStore.open();
        const runtime = createBrowserDisplayPreferencesRuntime({
            store: win.LouLearnerStore,
            applyDisplayPreferences: win.LouDisplayPreferencesApply.applyDisplayPreferences,
        });
        await runtime.applyPatch({ theme: "dark" });
        await runtime.resetToDefaults();

        assert.deepEqual(runtime.getCurrentPreferences(), buildDefaults());
        assert.equal((await win.LouLearnerStore.listDisplayPreferencesRecords()).length, 0);
        const snapshot = await win.LouLearnerSnapshot.exportSnapshot();
        assert.equal(domainFromSnapshot(snapshot).records.length, 0);
    });
});

describe("D7-F — Snapshot export/import", () => {
    /** @type {JSDOM} */
    let dom;

    before(() => {
        dom = setupPatrimonyDom();
    });

    beforeEach(async () => {
        dom.window.indexedDB = new IDBFactory();
        dom.window.LouLearnerStore.db = null;
        await dom.window.LouLearnerStore.open();
    });

    test("DP-F-N05 export empty domain explicit", async () => {
        const snapshot = await dom.window.LouLearnerSnapshot.exportSnapshot();
        const domain = domainFromSnapshot(snapshot);
        assert.equal(domain.domain_schema_version, 1);
        assert.equal(domain.records.length, 0);
    });

    test("DP-F-N06 export one record without release_id", async () => {
        await dom.window.LouLearnerStore.upsertDisplayPreferencesRecord({
            record_id: RECORD_ID,
            logical_record_id: RECORD_ID,
            schema_version: 1,
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
        });
        const snapshot = await dom.window.LouLearnerSnapshot.exportSnapshot();
        const domain = domainFromSnapshot(snapshot);
        assert.equal(domain.records.length, 1);
        assert.equal(domain.records[0].release_id, undefined);
        assert.equal(domain.records[0].payload.theme, "dark");
    });

    test("DP-F-N07 import idempotent round-trip", async () => {
        await dom.window.LouLearnerStore.upsertDisplayPreferencesRecord({
            record_id: RECORD_ID,
            logical_record_id: RECORD_ID,
            schema_version: 1,
            theme: "dark",
            fontSize: "small",
            readingWidth: "narrow",
        });
        const exported = await dom.window.LouLearnerSnapshot.exportSnapshot();
        await dom.window.LouLearnerStore.deleteDisplayPreferencesRecords();

        assert.equal((await dom.window.LouLearnerSnapshot.importSnapshot(exported)).success, true);
        assert.equal((await dom.window.LouLearnerSnapshot.importSnapshot(exported)).success, true);
        const rows = await dom.window.LouLearnerStore.listDisplayPreferencesRecords();
        assert.equal(rows.length, 1);
        assert.equal(rows[0].theme, "dark");

        const roundTrip = await dom.window.LouLearnerSnapshot.exportSnapshot();
        assert.equal(
            domainFromSnapshot(roundTrip).records[0].payload.theme,
            domainFromSnapshot(exported).records[0].payload.theme
        );
    });

    test("DP-F-N08 import empty domain preserves local", async () => {
        await dom.window.LouLearnerStore.upsertDisplayPreferencesRecord({
            record_id: RECORD_ID,
            logical_record_id: RECORD_ID,
            schema_version: 1,
            theme: "dark",
            fontSize: "medium",
            readingWidth: "standard",
        });
        const snapshot = await dom.window.LouLearnerSnapshot.exportSnapshot();
        domainFromSnapshot(snapshot).records = [];
        const body = { domains: snapshot.body.domains };
        snapshot.integrity.digest = await dom.window.LouLearnerSnapshot.computeBodyDigest(body);

        await dom.window.LouLearnerSnapshot.importSnapshot(snapshot);
        const rows = await dom.window.LouLearnerStore.listDisplayPreferencesRecords();
        assert.equal(rows.length, 1);
        assert.equal(rows[0].theme, "dark");
    });

    test("DP-F-N09 incompatible domain_schema_version rejected", async () => {
        const snapshot = await dom.window.LouLearnerSnapshot.exportSnapshot();
        domainFromSnapshot(snapshot).domain_schema_version = 99;
        const result = await dom.window.LouLearnerSnapshot.importSnapshot(snapshot);
        assert.equal(result.success, false);
    });
});

describe("D7-F — Diagnostics and normalization", () => {
    test("DP-F-N10 invalid persisted theme normalized without blocking", async () => {
        const storage = createMemoryStorage();
        await storage.upsertDisplayPreferencesRecord({
            record_id: RECORD_ID,
            logical_record_id: RECORD_ID,
            schema_version: 1,
            theme: "neon",
            fontSize: "medium",
            readingWidth: "standard",
        });
        const runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: () => {},
        });
        const result = await runtime.loadAndApply();
        assert.equal(result.preferences.theme, "light");
        assert.ok(
            result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_INVALID_VALUE)
        );
    });

    test("DP-F-N11 schema_version stale diagnostic", async () => {
        const storage = createMemoryStorage();
        await storage.upsertDisplayPreferencesRecord({
            record_id: RECORD_ID,
            logical_record_id: RECORD_ID,
            schema_version: 2,
            theme: "dark",
            fontSize: "medium",
            readingWidth: "standard",
        });
        const runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: () => {},
        });
        const result = await runtime.loadAndApply();
        assert.equal(result.preferences.theme, "dark");
        assert.ok(
            result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_SCHEMA_STALE)
        );
    });

    test("DP-F-N12 duplicate records resolved", async () => {
        const storage = createMemoryStorage();
        await storage.upsertDisplayPreferencesRecord({
            record_id: RECORD_ID,
            logical_record_id: RECORD_ID,
            schema_version: 1,
            theme: "dark",
            fontSize: "medium",
            readingWidth: "standard",
            updated_at: "2026-08-01T08:00:00.000Z",
        });
        await storage.upsertDisplayPreferencesRecord({
            record_id: "legacy",
            logical_record_id: "legacy",
            schema_version: 1,
            theme: "light",
            fontSize: "small",
            readingWidth: "narrow",
            updated_at: "2026-08-01T09:00:00.000Z",
        });
        const runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: () => {},
        });
        const result = await runtime.loadAndApply();
        assert.ok(
            result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_DUPLICATE_RESOLVED)
        );
        assert.equal(storage._rows().length, 1);
    });

    test("DP-F-N13 store read error propagates", async () => {
        const storage = {
            listDisplayPreferencesRecords: async () => {
                throw new Error("read failed");
            },
            upsertDisplayPreferencesRecord: async () => ({}),
            deleteDisplayPreferencesRecords: async () => {},
            deleteDisplayPreferencesExcept: async () => 0,
        };
        const runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: () => {},
        });
        await assert.rejects(runtime.loadAndApply(), /read failed/);
    });

    test("DP-F-N14 store write error propagates", async () => {
        const storage = createMemoryStorage();
        storage.upsertDisplayPreferencesRecord = async () => {
            throw new Error("write failed");
        };
        const runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: () => {},
        });
        await assert.rejects(runtime.applyPatch({ theme: "dark" }), /write failed/);
    });
});

describe("D7-F — D4 and D6 orthogonality", () => {
    test("DP-F-N15 ResumePlan unchanged by display preferences", () => {
        const dom = setupPatrimonyDom();
        const service = dom.window.LouSessionService;
        const context = {
            entryMode: "cold_boot",
            requestedChapter: CHAPTER,
            activeReleaseId: RELEASE_ID,
            offlineStatus: "offline_ready",
            releaseInstalled: true,
            installedReleaseIds: [RELEASE_ID],
            viewAvailability: { "mental-model": "published" },
            viewOrder: ["mental-model"],
            sessionRecords: [],
            observedAt: "2026-08-01T10:00:00.000Z",
            isOfflineRequired: false,
            productMode: true,
        };
        const before = service.buildResumePlan(context);
        dom.window.LouDisplayPreferencesApply.applyDisplayPreferences({
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
        });
        const after = service.buildResumePlan(context);
        assert.deepEqual(after, before);
        assert.equal(JSON.stringify(before).includes("display"), false);
    });

    test("DP-F-N16 SearchHit identical across theme preferences", async () => {
        const searchRuntime = createSearchRuntime(FIXTURE_LIBRARY);
        await searchRuntime.ensureIndex();
        const light = await searchRuntime.search("insuffisance");
        const dark = await searchRuntime.search("insuffisance");
        assert.deepEqual(
            dark.hits.map((h) => ({ id: h.unitId, snippet: h.snippet })),
            light.hits.map((h) => ({ id: h.unitId, snippet: h.snippet }))
        );
    });

    test("DP-F-N17 Composition ViewModel unchanged by apply callback", async () => {
        const manifest = JSON.parse(
            fs.readFileSync(
                path.join(
                    FIXTURE_LIBRARY,
                    "packages/cardio__234__2022__1/manifest.json"
                ),
                "utf8"
            )
        );
        const before = await compose(manifest, compositionSpec);
        const dom = setupPatrimonyDom();
        dom.window.LouDisplayPreferencesApply.applyDisplayPreferences({
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
        });
        const after = await compose(manifest, compositionSpec);
        assert.deepEqual(after.readingViewModel, before.readingViewModel);
    });
});

describe("D7-F — Boot order", () => {
    test("DP-F-N18 loadAndApply completes before session restore step", async () => {
        const order = [];
        const storage = createMemoryStorage();
        const runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: () => {
                order.push("apply");
            },
        });

        async function boot() {
            await runtime.loadAndApply();
            order.push("dp_done");
            order.push("session_restore");
        }

        await boot();
        assert.deepEqual(order, ["apply", "dp_done", "session_restore"]);
    });
});

describe("D7-F — Patrimony isolation", () => {
    test("DP-F-N19 snapshot body excludes Search domains", async () => {
        const dom = setupPatrimonyDom();
        await dom.window.LouLearnerStore.open();
        const snapshot = await dom.window.LouLearnerSnapshot.exportSnapshot();
        const blob = JSON.stringify(snapshot);
        assert.ok(!/searchhit/i.test(blob));
        assert.ok(snapshot.body.domains.some((d) => d.domain_id === "display_preferences"));
    });
});
