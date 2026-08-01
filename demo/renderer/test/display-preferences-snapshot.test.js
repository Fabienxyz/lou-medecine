/**
 * Lot D7-D — Display Preferences Snapshot export/import tests.
 */
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodeCrypto from "node:crypto";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";

import { DIAGNOSTICS, RECORD_ID } from "../display-preferences-service.js";
import { createDisplayPreferencesRuntime } from "../display-preferences-runtime.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

function loadScripts(dom, files) {
    for (const file of files) {
        dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
    }
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

function domainFromSnapshot(snapshot, domainId) {
    return snapshot.body.domains.find((domain) => domain.domain_id === domainId);
}

async function buildSnapshotWithDisplayPreferencesRecord(record, win) {
    const base = await win.LouLearnerSnapshot.exportSnapshot({
        exportedAt: "2026-08-01T00:00:00.000Z",
    });
    const domains = base.body.domains.map(function (domain) {
        if (domain.domain_id !== "display_preferences") {
            return domain;
        }
        return Object.assign({}, domain, { records: [record] });
    });
    const body = { domains: domains };
    const digest = await win.LouLearnerSnapshot.computeBodyDigest(body);
    return Object.assign({}, base, {
        body: win.LouLearnerSnapshot.canonicalizeBody(body),
        integrity: {
            algorithm: win.LouLearnerSnapshot.INTEGRITY_ALGORITHM,
            digest: digest,
        },
    });
}

describe("T-SNAPSHOT — Display Preferences domain", () => {
    /** @type {Window & typeof globalThis} */
    let window;

    before(() => {
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
            url: "https://example.test/demo/renderer/",
            runScripts: "outside-only",
        });
        window = dom.window;
        window.__LOU_NODE_CRYPTO__ = nodeCrypto;
        loadScripts(dom, [
            "config.js",
            "learner-patrimony.js",
            "learner-store.js",
            "learner-snapshot.js",
        ]);
    });

    beforeEach(() => {
        window.indexedDB = new IDBFactory();
        window.LouLearnerStore.db = null;
    });

    test("T-SNAPSHOT-EXPORT-01 — no local record → explicit empty domain", async () => {
        await window.LouLearnerStore.open();
        const snapshot = await window.LouLearnerSnapshot.exportSnapshot({
            exportedAt: "2026-08-01T00:00:00.000Z",
        });
        const domain = domainFromSnapshot(snapshot, "display_preferences");
        assert.ok(domain);
        assert.equal(domain.domain_schema_version, 1);
        assert.equal(domain.records.length, 0);
    });

    test("T-SNAPSHOT-EXPORT-02 — one local record → one projected record", async () => {
        await window.LouLearnerStore.open();
        await window.LouLearnerStore.upsertDisplayPreferencesRecord({
            record_id: RECORD_ID,
            logical_record_id: RECORD_ID,
            schema_version: 1,
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
            updated_at: "2026-08-01T10:00:00.000Z",
        });

        const snapshot = await window.LouLearnerSnapshot.exportSnapshot();
        const domain = domainFromSnapshot(snapshot, "display_preferences");
        assert.equal(domain.records.length, 1);
        const record = domain.records[0];
        assert.equal(record.record_id, RECORD_ID);
        assert.equal(record.schema_version, 1);
        assert.equal(record.domain, "display_preferences");
        assert.equal(record.release_id, undefined);
        assert.equal(record.chapter, undefined);
        assert.equal(record.payload.theme, "dark");
        assert.equal(record.payload.fontSize, "large");
        assert.equal(record.payload.readingWidth, "wide");
    });

    test("T-SNAPSHOT-IMPORT-01 — absent domain has no effect", async () => {
        await window.LouLearnerStore.open();
        await window.LouLearnerStore.upsertDisplayPreferencesRecord({
            record_id: RECORD_ID,
            logical_record_id: RECORD_ID,
            schema_version: 1,
            theme: "dark",
            fontSize: "medium",
            readingWidth: "standard",
        });

        const snapshot = await window.LouLearnerSnapshot.exportSnapshot();
        const trimmedDomains = snapshot.body.domains.filter(
            (domain) => domain.domain_id !== "display_preferences"
        );
        const body = { domains: trimmedDomains };
        const digest = await window.LouLearnerSnapshot.computeBodyDigest(body);
        const trimmedSnapshot = Object.assign({}, snapshot, {
            body: window.LouLearnerSnapshot.canonicalizeBody(body),
            integrity: {
                algorithm: window.LouLearnerSnapshot.INTEGRITY_ALGORITHM,
                digest,
            },
        });

        const result = await window.LouLearnerSnapshot.importSnapshot(trimmedSnapshot);
        assert.equal(result.success, true);
        const rows = await window.LouLearnerStore.listDisplayPreferencesRecords();
        assert.equal(rows.length, 1);
        assert.equal(rows[0].theme, "dark");
    });

    test("T-SNAPSHOT-IMPORT-02 — empty domain does not delete local record", async () => {
        await window.LouLearnerStore.open();
        await window.LouLearnerStore.upsertDisplayPreferencesRecord({
            record_id: RECORD_ID,
            logical_record_id: RECORD_ID,
            schema_version: 1,
            theme: "dark",
            fontSize: "medium",
            readingWidth: "standard",
        });

        const snapshot = await window.LouLearnerSnapshot.exportSnapshot();
        const result = await window.LouLearnerSnapshot.importSnapshot(snapshot);
        assert.equal(result.success, true);
        const rows = await window.LouLearnerStore.listDisplayPreferencesRecords();
        assert.equal(rows.length, 1);
        assert.equal(rows[0].theme, "dark");
    });

    test("T-SNAPSHOT-IMPORT-03 — one record upserts and runtime applies", async () => {
        await window.LouLearnerStore.open();
        const snapshot = await buildSnapshotWithDisplayPreferencesRecord(
            {
                record_id: RECORD_ID,
                schema_version: 1,
                domain: "display_preferences",
                payload: {
                    theme: "dark",
                    fontSize: "large",
                    readingWidth: "narrow",
                },
            },
            window
        );

        const importResult = await window.LouLearnerSnapshot.importSnapshot(snapshot);
        assert.equal(importResult.success, true);

        /** @type {object[]} */
        const applied = [];
        const runtime = createDisplayPreferencesRuntime({
            storage: createStoreStorageAdapter(window.LouLearnerStore),
            applyDisplayPreferences: (preferences) => applied.push(preferences),
        });
        const loadResult = await runtime.loadAndApply({ source: "import" });
        assert.equal(loadResult.preferences.theme, "dark");
        assert.ok(
            loadResult.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_IMPORT_APPLIED)
        );
        assert.equal(applied.length, 1);
    });

    test("T-SNAPSHOT-IDEM-01 — double import identical is idempotent", async () => {
        await window.LouLearnerStore.open();
        const snapshot = await buildSnapshotWithDisplayPreferencesRecord(
            {
                record_id: RECORD_ID,
                schema_version: 1,
                domain: "display_preferences",
                payload: {
                    theme: "dark",
                    fontSize: "medium",
                    readingWidth: "standard",
                },
            },
            window
        );

        const first = await window.LouLearnerSnapshot.importSnapshot(snapshot);
        const second = await window.LouLearnerSnapshot.importSnapshot(snapshot);
        assert.equal(first.success, true);
        assert.equal(second.success, true);
        assert.ok(second.unchanged.length >= 1 || second.updated.length === 0);
        const rows = await window.LouLearnerStore.listDisplayPreferencesRecords();
        assert.equal(rows.length, 1);
    });

    test("T-SNAPSHOT-IMPORT-MULTI-01 — multiple records resolved to singleton", async () => {
        await window.LouLearnerStore.open();
        const snapshot = await buildSnapshotWithDisplayPreferencesRecord(
            {
                record_id: "display-preferences-legacy",
                schema_version: 1,
                domain: "display_preferences",
                payload: {
                    theme: "light",
                    fontSize: "small",
                    readingWidth: "narrow",
                },
            },
            window
        );
        const dpDomain = domainFromSnapshot(snapshot, "display_preferences");
        dpDomain.records.push({
            record_id: RECORD_ID,
            schema_version: 1,
            domain: "display_preferences",
            payload: {
                theme: "dark",
                fontSize: "large",
                readingWidth: "wide",
            },
        });
        const body = { domains: snapshot.body.domains };
        const digest = await window.LouLearnerSnapshot.computeBodyDigest(body);
        snapshot.body = window.LouLearnerSnapshot.canonicalizeBody(body);
        snapshot.integrity.digest = digest;

        const result = await window.LouLearnerSnapshot.importSnapshot(snapshot);
        assert.equal(result.success, true);
        assert.ok(
            result.warnings.some((warning) => warning.code === "DP-DUPLICATE-RESOLVED")
        );
        const rows = await window.LouLearnerStore.listDisplayPreferencesRecords();
        assert.equal(rows.length, 1);
        assert.equal(rows[0].logical_record_id, RECORD_ID);
        assert.equal(rows[0].theme, "dark");
    });

    test("T-SNAPSHOT-VERSION-01 — incompatible domain_schema_version rejected", async () => {
        await window.LouLearnerStore.open();
        const snapshot = await window.LouLearnerSnapshot.exportSnapshot();
        const domain = domainFromSnapshot(snapshot, "display_preferences");
        domain.domain_schema_version = 99;

        const result = await window.LouLearnerSnapshot.importSnapshot(snapshot);
        assert.equal(result.success, false);
        assert.match(result.refused[0].reason, /unsupported domain_schema_version/);
    });

    test("T-SNAPSHOT-ROUNDTRIP-01 — export → import → export stable", async () => {
        await window.LouLearnerStore.open();
        await window.LouLearnerStore.upsertDisplayPreferencesRecord({
            record_id: RECORD_ID,
            logical_record_id: RECORD_ID,
            schema_version: 1,
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
        });

        const exported = await window.LouLearnerSnapshot.exportSnapshot({
            exportedAt: "2026-08-01T00:00:00.000Z",
        });
        await window.LouLearnerStore.deleteDisplayPreferencesRecords();
        const importResult = await window.LouLearnerSnapshot.importSnapshot(exported);
        assert.equal(importResult.success, true);

        const roundTrip = await window.LouLearnerSnapshot.exportSnapshot({
            exportedAt: "2026-08-01T00:00:00.000Z",
        });
        const before = domainFromSnapshot(exported, "display_preferences").records[0];
        const after = domainFromSnapshot(roundTrip, "display_preferences").records[0];
        assert.deepEqual(after.payload, before.payload);
        assert.equal(after.record_id, before.record_id);
    });

    test("T-SNAPSHOT-FUTURE-01 — display_preferences no longer future-reserved", () => {
        assert.equal(
            window.LouLearnerSnapshot.FUTURE_DOMAIN_IDS.indexOf("display_preferences"),
            -1
        );
        assert.ok(
            window.LouLearnerSnapshot.ACTIVE_DOMAIN_IDS.indexOf("display_preferences") >= 0
        );
    });
});
