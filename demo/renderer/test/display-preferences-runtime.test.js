/**
 * Lot D7-D — Display Preferences Runtime integration tests.
 */
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";

import { DIAGNOSTICS, RECORD_ID, buildDefaults } from "../display-preferences-service.js";
import { createDisplayPreferencesRuntime } from "../display-preferences-runtime.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

function loadScripts(dom, files) {
    for (const file of files) {
        dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
    }
}

function createMemoryDisplayPreferencesStorage() {
    /** @type {object[]} */
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
            const row = Object.assign({}, record, { id: nextId });
            nextId += 1;
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

function createStoreStorageAdapter(store) {
    return {
        listDisplayPreferencesRecords: () => store.listDisplayPreferencesRecords(),
        upsertDisplayPreferencesRecord: (record) =>
            store.upsertDisplayPreferencesRecord(record),
        deleteDisplayPreferencesRecords: () => store.deleteDisplayPreferencesRecords(),
        deleteDisplayPreferencesExcept: (keepLogicalRecordId) =>
            store.deleteDisplayPreferencesExcept(keepLogicalRecordId),
    };
}

describe("T-RUNTIME — Display Preferences Runtime (memory storage)", () => {
    /** @type {ReturnType<typeof createMemoryDisplayPreferencesStorage>} */
    let storage;
    /** @type {object[]} */
    let applied;
    /** @type {ReturnType<typeof createDisplayPreferencesRuntime>} */
    let runtime;

    beforeEach(() => {
        storage = createMemoryDisplayPreferencesStorage();
        applied = [];
        runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: (preferences) => {
                applied.push(Object.assign({}, preferences));
            },
            nowIso: () => "2026-08-01T12:00:00.000Z",
        });
    });

    test("T-RUNTIME-LOAD-01 — empty store → defaults, no write", async () => {
        const result = await runtime.loadAndApply();
        assert.deepEqual(result.preferences, buildDefaults());
        assert.ok(result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_MISSING));
        assert.equal(storage._rows().length, 0);
        assert.equal(applied.length, 1);
    });

    test("T-RUNTIME-LOAD-02 — valid record → persisted load", async () => {
        await storage.upsertDisplayPreferencesRecord({
            record_id: RECORD_ID,
            logical_record_id: RECORD_ID,
            schema_version: 1,
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
            updated_at: "2026-08-01T10:00:00.000Z",
        });

        const result = await runtime.loadAndApply();
        assert.equal(result.preferences.theme, "dark");
        assert.equal(result.preferences.fontSize, "large");
        assert.ok(result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_PERSISTED));
    });

    test("T-RUNTIME-LOAD-03 — partial invalid record normalized", async () => {
        await storage.upsertDisplayPreferencesRecord({
            record_id: RECORD_ID,
            logical_record_id: RECORD_ID,
            schema_version: 1,
            theme: "neon",
            fontSize: "medium",
            readingWidth: "standard",
        });

        const result = await runtime.loadAndApply();
        assert.equal(result.preferences.theme, "light");
        assert.ok(
            result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_INVALID_VALUE)
        );
        assert.equal(storage._rows().length, 1);
    });

    test("T-RUNTIME-SAVE-01 — first patch creates singleton", async () => {
        await runtime.loadAndApply();
        const result = await runtime.applyPatch({ theme: "dark" });

        assert.equal(result.preferences.theme, "dark");
        assert.ok(result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_SAVED));
        assert.equal(storage._rows().length, 1);
        assert.equal(storage._rows()[0].record_id, RECORD_ID);
        assert.equal(storage._rows()[0].logical_record_id, RECORD_ID);
    });

    test("T-RUNTIME-SAVE-02 — subsequent patch updates same record", async () => {
        await runtime.loadAndApply();
        await runtime.applyPatch({ theme: "dark" });
        await runtime.applyPatch({ fontSize: "large" });

        assert.equal(storage._rows().length, 1);
        assert.equal(storage._rows()[0].theme, "dark");
        assert.equal(storage._rows()[0].fontSize, "large");
    });

    test("T-RUNTIME-RESET-01 — reset deletes record and applies defaults", async () => {
        await runtime.applyPatch({ theme: "dark" });
        const result = await runtime.resetToDefaults();

        assert.deepEqual(result.preferences, buildDefaults());
        assert.ok(result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_DELETED));
        assert.equal(storage._rows().length, 0);
    });

    test("T-RUNTIME-DUP-01 — duplicate records resolved deterministically", async () => {
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
            record_id: "display-preferences-legacy",
            logical_record_id: "display-preferences-legacy",
            schema_version: 1,
            theme: "light",
            fontSize: "small",
            readingWidth: "narrow",
            updated_at: "2026-08-01T09:00:00.000Z",
        });

        const result = await runtime.loadAndApply();
        assert.ok(
            result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_DUPLICATE_RESOLVED)
        );
        assert.equal(storage._rows().length, 1);
        assert.equal(storage._rows()[0].logical_record_id, RECORD_ID);
        assert.equal(result.preferences.theme, "dark");
    });

    test("T-RUNTIME-NO-RELEASE-01 — writes exclude release_id", async () => {
        await runtime.applyPatch({ theme: "dark" });
        const row = storage._rows()[0];
        assert.equal(row.release_id, undefined);
        assert.equal(row.chapter, undefined);
        assert.equal(row.viewId, undefined);
    });

    test("T-RUNTIME-APPLY-01 — apply callback receives normalized effective", async () => {
        await runtime.loadAndApply();
        await runtime.applyPatch({ theme: "dark", readingWidth: "wide" });
        assert.equal(applied.length, 2);
        assert.deepEqual(applied[applied.length - 1], {
            schema_version: 1,
            theme: "dark",
            fontSize: "medium",
            readingWidth: "wide",
        });
        assert.deepEqual(runtime.getCurrentPreferences(), applied[applied.length - 1]);
    });

    test("T-RUNTIME-IMPORT-01 — applyImportedRecord upserts and applies", async () => {
        const result = await runtime.applyImportedRecord({
            record_id: RECORD_ID,
            schema_version: 1,
            theme: "dark",
            fontSize: "large",
            readingWidth: "narrow",
        });

        assert.equal(result.preferences.theme, "dark");
        assert.ok(
            result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_IMPORT_APPLIED)
        );
        assert.equal(storage._rows().length, 1);
    });
});

describe("T-RUNTIME — Display Preferences Runtime (LouLearnerStore adapter)", () => {
    /** @type {Window & typeof globalThis} */
    let window;

    before(() => {
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
            url: "https://example.test/demo/renderer/",
            runScripts: "outside-only",
        });
        window = dom.window;
        loadScripts(dom, ["config.js", "learner-patrimony.js", "learner-store.js"]);
    });

    beforeEach(() => {
        window.indexedDB = new IDBFactory();
        window.LouLearnerStore.db = null;
    });

    test("T-RUNTIME-STORE-01 — store rejects release_id on upsert", async () => {
        await window.LouLearnerStore.open();
        await assert.rejects(
            window.LouLearnerStore.upsertDisplayPreferencesRecord({
                record_id: RECORD_ID,
                logical_record_id: RECORD_ID,
                schema_version: 1,
                theme: "dark",
                fontSize: "medium",
                readingWidth: "standard",
                release_id: "cardio__234__2022__1",
            }),
            /release_id/
        );
    });
});
