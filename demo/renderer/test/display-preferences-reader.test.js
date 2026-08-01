/**
 * Lot D7-E — Display Preferences Reader integration tests.
 */
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";

import { buildDefaults, RECORD_ID } from "../display-preferences-service.js";
import { createDisplayPreferencesRuntime } from "../display-preferences-runtime.js";
import { createBrowserDisplayPreferencesRuntime } from "../library/browser-display-preferences-runtime.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

function loadScript(dom, file) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
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

function buildReaderDom() {
    const dom = new JSDOM(
        `<!DOCTYPE html><html lang="fr"><head></head><body>
            <div class="container"><div class="content" id="content"></div></div>
            <div id="display-preferences-root" hidden></div>
        </body></html>`,
        { url: "http://localhost/?chapter=cardio%2F234", runScripts: "outside-only" }
    );
    loadScript(dom, "display-preferences-apply.js");
    loadScript(dom, "display-preferences-ui.js");
    return dom;
}

function readRootAttributes(window) {
    const root = window.document.documentElement;
    return {
        theme: root.getAttribute("data-dp-theme"),
        fontSize: root.getAttribute("data-dp-font-size"),
        readingWidth: root.getAttribute("data-dp-reading-width"),
    };
}

describe("D7-E display-preferences-apply", () => {
    test("T-APPLY-01 — applies theme, fontSize, readingWidth attributes", () => {
        const dom = buildReaderDom();
        const win = dom.window;
        win.LouDisplayPreferencesApply.applyDisplayPreferences({
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
        });
        assert.deepEqual(readRootAttributes(win), {
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
        });
    });
});

describe("D7-E boot order", () => {
    test("T-BOOT-ORDER-01 — loadAndApply completes before session restore marker", async () => {
        const order = [];
        const storage = createMemoryStorage();
        const runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: function () {
                order.push("apply");
            },
        });

        async function bootSequence() {
            await runtime.loadAndApply();
            order.push("loadAndApply_done");
            order.push("session_restore");
        }

        await bootSequence();

        assert.ok(order.indexOf("loadAndApply_done") < order.indexOf("session_restore"));
        assert.deepEqual(order, ["apply", "loadAndApply_done", "session_restore"]);
    });

    test("T-BOOT-01 — first boot applies defaults visibly", async () => {
        const dom = buildReaderDom();
        const win = dom.window;
        const storage = createMemoryStorage();
        const runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: win.LouDisplayPreferencesApply.applyDisplayPreferences,
        });

        await runtime.loadAndApply();
        assert.deepEqual(readRootAttributes(win), {
            theme: "light",
            fontSize: "medium",
            readingWidth: "standard",
        });
        assert.equal(storage._rows().length, 0);
    });

    test("T-BOOT-02 — persisted record reloaded on boot", async () => {
        const dom = buildReaderDom();
        const win = dom.window;
        const storage = createMemoryStorage();
        await storage.upsertDisplayPreferencesRecord({
            record_id: RECORD_ID,
            logical_record_id: RECORD_ID,
            schema_version: 1,
            theme: "dark",
            fontSize: "small",
            readingWidth: "narrow",
        });

        const runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: win.LouDisplayPreferencesApply.applyDisplayPreferences,
        });
        await runtime.loadAndApply();

        assert.deepEqual(readRootAttributes(win), {
            theme: "dark",
            fontSize: "small",
            readingWidth: "narrow",
        });
    });
});

describe("D7-E display-preferences-ui", () => {
    /** @type {JSDOM} */
    let dom;
    /** @type {ReturnType<typeof createDisplayPreferencesRuntime>} */
    let runtime;
    /** @type {ReturnType<typeof createMemoryStorage>} */
    let storage;

    beforeEach(async () => {
        dom = buildReaderDom();
        storage = createMemoryStorage();
        runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: dom.window.LouDisplayPreferencesApply.applyDisplayPreferences,
            nowIso: () => "2026-08-01T12:00:00.000Z",
        });
        await runtime.loadAndApply();
    });

    function mountUi() {
        return dom.window.LouDisplayPreferencesUI.create({ runtime }).mount();
    }

    function selectById(id) {
        return dom.window.document.getElementById(id);
    }

    test("T-UI-THEME-01 — theme change applies immediately", async () => {
        mountUi();
        const themeSelect = selectById("display-preferences-theme");
        themeSelect.value = "dark";
        themeSelect.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 0));

        assert.equal(readRootAttributes(dom.window).theme, "dark");
        assert.equal(storage._rows()[0].theme, "dark");
    });

    test("T-UI-FONT-01 — fontSize change applies immediately", async () => {
        mountUi();
        const fontSelect = selectById("display-preferences-font-size");
        fontSelect.value = "large";
        fontSelect.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 0));

        assert.equal(readRootAttributes(dom.window).fontSize, "large");
    });

    test("T-UI-WIDTH-01 — readingWidth change applies immediately", async () => {
        mountUi();
        const widthSelect = selectById("display-preferences-reading-width");
        widthSelect.value = "wide";
        widthSelect.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 0));

        assert.equal(readRootAttributes(dom.window).readingWidth, "wide");
    });

    test("T-UI-MULTI-01 — successive changes persist singleton", async () => {
        const ui = dom.window.LouDisplayPreferencesUI.create({ runtime });
        ui.mount();
        const themeSelect = selectById("display-preferences-theme");
        const fontSelect = selectById("display-preferences-font-size");

        themeSelect.value = "dark";
        themeSelect.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
        fontSelect.value = "small";
        fontSelect.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
        await ui.whenPatchesIdle();

        assert.equal(storage._rows().length, 1);
        assert.equal(storage._rows()[0].theme, "dark");
        assert.equal(storage._rows()[0].fontSize, "small");
    });

    test("T-UI-RESET-01 — reset calls runtime and restores defaults", async () => {
        await runtime.applyPatch({ theme: "dark", fontSize: "large", readingWidth: "wide" });
        mountUi();

        const resetBtn = dom.window.document.querySelector(".display-preferences-reset");
        resetBtn.click();
        await new Promise((resolve) => setTimeout(resolve, 0));

        assert.deepEqual(readRootAttributes(dom.window), {
            theme: "light",
            fontSize: "medium",
            readingWidth: "standard",
        });
        assert.equal(storage._rows().length, 0);
    });

    test("T-UI-A11Y-01 — controls are labeled and keyboard focusable", () => {
        mountUi();
        const themeSelect = selectById("display-preferences-theme");
        const label = dom.window.document.querySelector('label[for="display-preferences-theme"]');
        assert.ok(label);
        assert.match(label.textContent, /Thème/i);
        assert.equal(themeSelect.tabIndex, 0);
    });
});

describe("D7-E runtime callback wiring", () => {
    test("T-RUNTIME-WIRE-01 — applyPatch and callback invoked", async () => {
        const calls = [];
        const storage = createMemoryStorage();
        const runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: (prefs) => calls.push(prefs.theme),
        });
        await runtime.loadAndApply();
        await runtime.applyPatch({ theme: "dark" });
        assert.deepEqual(calls, ["light", "dark"]);
    });

    test("T-RUNTIME-WIRE-02 — resetToDefaults invokes callback with defaults", async () => {
        const calls = [];
        const storage = createMemoryStorage();
        const runtime = createDisplayPreferencesRuntime({
            storage,
            applyDisplayPreferences: (prefs) => calls.push(prefs.theme),
        });
        await runtime.applyPatch({ theme: "dark" });
        await runtime.resetToDefaults();
        assert.equal(calls[calls.length - 1], "light");
    });
});

describe("D7-E orthogonality", () => {
    /** @type {Window & typeof globalThis} */
    let window;

    before(() => {
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
            url: "http://localhost/",
            runScripts: "outside-only",
        });
        window = dom.window;
        loadScript(dom, "config.js");
        loadScript(dom, "learner-patrimony.js");
        loadScript(dom, "session-service.js");
        loadScript(dom, "display-preferences-apply.js");
    });

    test("T-ORTHOG-01 — Session Service buildResumePlan unchanged by preferences", () => {
        const service = window.LouSessionService;
        const context = {
            entryMode: "cold_boot",
            requestedChapter: "cardio/234",
            activeReleaseId: "cardio__234__2022__1",
            offlineStatus: "offline_ready",
            releaseInstalled: true,
            installedReleaseIds: ["cardio__234__2022__1"],
            viewAvailability: {
                "cognitive-priming": "planned",
                "mental-model": "published",
            },
            viewOrder: ["cognitive-priming", "mental-model"],
            sessionRecords: [],
            observedAt: "2026-08-01T10:00:00.000Z",
            isOfflineRequired: false,
            productMode: true,
        };

        window.LouDisplayPreferencesApply.applyDisplayPreferences({
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
        });

        const before = service.buildResumePlan(context);
        window.LouDisplayPreferencesApply.applyDisplayPreferences(buildDefaults());
        const after = service.buildResumePlan(context);
        assert.deepEqual(after, before);
    });

    test("T-ORTHOG-02 — ViewModel reference unchanged after apply", () => {
        const viewModel = {
            views: [{ viewId: "mental-model", sources: [] }],
            meta: { chapter: "cardio/234" },
        };
        const snapshot = JSON.stringify(viewModel);

        window.LouDisplayPreferencesApply.applyDisplayPreferences({
            theme: "dark",
            fontSize: "small",
            readingWidth: "narrow",
        });

        assert.equal(JSON.stringify(viewModel), snapshot);
    });
});

describe("D7-E browser runtime adapter", () => {
    /** @type {Window & typeof globalThis} */
    let window;

    before(() => {
        const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
            url: "http://localhost/",
            runScripts: "outside-only",
        });
        window = dom.window;
        loadScript(dom, "config.js");
        loadScript(dom, "learner-patrimony.js");
        loadScript(dom, "learner-store.js");
        loadScript(dom, "display-preferences-apply.js");
    });

    beforeEach(() => {
        window.indexedDB = new IDBFactory();
        window.LouLearnerStore.db = null;
    });

    test("T-BROWSER-RT-01 — LouLearnerStore adapter loads and patches", async () => {
        await window.LouLearnerStore.open();
        const runtime = createBrowserDisplayPreferencesRuntime({
            store: window.LouLearnerStore,
            applyDisplayPreferences:
                window.LouDisplayPreferencesApply.applyDisplayPreferences,
        });
        await runtime.loadAndApply();
        await runtime.applyPatch({ theme: "dark" });
        const rows = await window.LouLearnerStore.listDisplayPreferencesRecords();
        assert.equal(rows.length, 1);
        assert.equal(rows[0].theme, "dark");
        assert.equal(rows[0].release_id, undefined);
    });
});
