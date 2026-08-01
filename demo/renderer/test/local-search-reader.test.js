/**
 * Lot D6-E — Local Search Reader integration tests.
 */
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

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

function buildSearchDom() {
    const dom = new JSDOM(
        `<!DOCTYPE html><html><body>
            <button id="local-search-trigger" hidden></button>
            <div id="local-search-root" hidden>
                <input id="local-search-input" />
                <p id="local-search-status"></p>
                <ul id="local-search-results"></ul>
            </div>
            <div id="content"></div>
        </body></html>`,
        { url: "http://localhost/?chapter=cardio%2F234&product=1", runScripts: "outside-only" }
    );
    loadScript(dom, "search-navigation.js");
    loadScript(dom, "local-search-ui.js");
    return dom;
}

function mockLibraryFetch(libraryRoot, libraryBaseUrl = LIBRARY_BASE) {
    const basePath = new URL(libraryBaseUrl).pathname.replace(/\/+$/, "");
    return async (url, init = {}) => {
        const parsed = new URL(url, "https://reader.test");
        const pathname = parsed.pathname;
        if (pathname === `${basePath}/library.json`) {
            return mockResponse(200, fs.readFileSync(path.join(libraryRoot, "library.json")), "application/json");
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

function createFixtureRuntime() {
    const cacheStorage = createMemorySearchCacheStorage();
    const packageAccess = createBrowserPackageAccess({
        libraryBaseUrl: LIBRARY_BASE,
        fetch: mockLibraryFetch(FIXTURE_LIBRARY),
    });
    const runtime = createLocalSearchRuntime({
        packageAccess,
        cacheStorage,
        compose,
        compositionSpec,
        fetch: mockLibraryFetch(FIXTURE_LIBRARY),
    });
    runtime.setOpenRelease({
        releaseId: RELEASE_ID,
        contentDigest: CONTENT_DIGEST,
        chapter: CHAPTER,
    });
    return runtime;
}

function buildTabs() {
    return [
        { viewId: "mental-model", label: "Schéma" },
        { viewId: "notions", label: "Notions" },
        { viewId: "college-official", label: "Collège officiel" },
        { viewId: "qcm", label: "QCM" },
        { viewId: "clinical-cases", label: "Cas cliniques" },
    ];
}

describe("D6-E search-navigation", () => {
    let dom;

    beforeEach(() => {
        dom = buildSearchDom();
    });

    test("resolve element_block by id", () => {
        dom.window.document.body.innerHTML +=
            '<section id="MEC-oap" class="pedagogical-block"></section>';
        const hit = dom.window.LouSearchNavigation.resolveSearchAnchorTarget(
            { kind: "element_block", elementId: "MEC-oap" },
            "mental-model"
        );
        assert.ok(hit.element);
        assert.equal(hit.code, null);
    });

    test("resolve section_path via data-section-path", () => {
        const key = ["Intro", "Section A"].join("\u001f");
        dom.window.document.body.innerHTML +=
            '<h2 data-section-path="' + key + '">Section A</h2>';
        const hit = dom.window.LouSearchNavigation.resolveSearchAnchorTarget(
            { kind: "section_path", path: ["Intro", "Section A"] },
            "college-official"
        );
        assert.ok(hit.element);
    });

    test("resolve question_id", () => {
        dom.window.document.body.innerHTML +=
            '<li class="view-qcm-item" data-question-id="q-234-01"></li>';
        const hit = dom.window.LouSearchNavigation.resolveSearchAnchorTarget(
            { kind: "question_id", questionId: "q-234-01" },
            "qcm"
        );
        assert.ok(hit.element);
    });

    test("resolve scenario_scroll with data-scenario-id", () => {
        dom.window.document.body.innerHTML +=
            '<li data-scenario-id="sc-234-standard-01"></li>';
        const hit = dom.window.LouSearchNavigation.resolveSearchAnchorTarget(
            { kind: "scenario_scroll", scenarioId: "sc-234-standard-01" },
            "clinical-cases"
        );
        assert.ok(hit.element);
    });

    test("resolve manifest_alt on pedagogical block", () => {
        dom.window.document.body.innerHTML +=
            '<section class="pedagogical-block" data-element="MEC-oap"></section>';
        const hit = dom.window.LouSearchNavigation.resolveSearchAnchorTarget(
            { kind: "manifest_alt", elementId: "MEC-oap" },
            "mental-model"
        );
        assert.ok(hit.element);
    });

    test("anchor missing returns explicit diagnostic", () => {
        const hit = dom.window.LouSearchNavigation.resolveSearchAnchorTarget(
            { kind: "element_block", elementId: "missing-element" },
            "mental-model"
        );
        assert.equal(hit.element, null);
        assert.equal(hit.code, "LS-READER-ANCHOR-MISSING");
    });

    test("decorateCollegeSectionPaths matches extractor keys", () => {
        dom.window.document.body.innerHTML =
            '<article class="college-official-body">' +
            "<h1>Intro</h1><h2>Section A</h2><h3>Detail</h3>" +
            "</article>";
        const host = dom.window.document.querySelector(".college-official-body");
        dom.window.LouSearchNavigation.decorateCollegeSectionPaths(host);
        const h3 = dom.window.document.querySelector("h3");
        const expected = ["Intro", "Section A", "Detail"].join("\u001f");
        assert.equal(h3.getAttribute("data-section-path"), expected);
    });

    test("clearSearchHighlights removes visual markers", () => {
        dom.window.document.body.innerHTML =
            '<p class="search-hit-highlight" id="target">x</p>';
        dom.window.LouSearchNavigation.clearSearchHighlights(dom.window.document);
        const el = dom.window.document.getElementById("target");
        assert.ok(el);
        assert.equal(el.classList.contains("search-hit-highlight"), false);
    });

    test("navigateToSearchHit rejects release mismatch", async () => {
        let called = false;
        const result = await dom.window.LouSearchNavigation.navigateToSearchHit(
            {
                release_id: "other-release",
                viewId: "mental-model",
                anchor: { kind: "element_block", elementId: "MEC-oap" },
            },
            {
                releaseId: RELEASE_ID,
                tabs: buildTabs(),
                showTab: async function () {
                    called = true;
                },
            }
        );
        assert.equal(result.ok, false);
        assert.equal(result.code, "LS-READER-RELEASE-MISMATCH");
        assert.equal(called, false);
    });

    test("navigateToSearchHit scrolls and highlights target", async () => {
        dom.window.document.body.innerHTML +=
            '<section id="MEC-oap" class="pedagogical-block"></section>';
        let tabIndex = -1;
        const result = await dom.window.LouSearchNavigation.navigateToSearchHit(
            {
                release_id: RELEASE_ID,
                viewId: "mental-model",
                anchor: { kind: "element_block", elementId: "MEC-oap" },
            },
            {
                releaseId: RELEASE_ID,
                tabs: buildTabs(),
                showTab: async function (index) {
                    tabIndex = index;
                },
            }
        );
        assert.equal(result.ok, true);
        assert.equal(tabIndex, 0);
        const el = dom.window.document.getElementById("MEC-oap");
        assert.ok(el.classList.contains("search-hit-highlight"));
    });
});

describe("D6-E local-search-ui", () => {
    let dom;
    let runtime;
    let ui;

    beforeEach(() => {
        dom = buildSearchDom();
        runtime = createFixtureRuntime();
        ui = dom.window.LouLocalSearchUI.create({
            runtime,
            releaseId: RELEASE_ID,
            tabs: buildTabs(),
            debounceMs: 0,
            showTab: async function () {},
            whenTabReady: async function () {},
        });
        ui.mount();
    });

    test("panel open and close states", async () => {
        assert.equal(ui.getState(), "closed");
        ui.open();
        assert.notEqual(ui.getState(), "closed");
        for (let i = 0; i < 100 && ui.getState() === "indexing"; i += 1) {
            await new Promise(function (resolve) {
                setTimeout(resolve, 20);
            });
        }
        assert.equal(ui.getState(), "idle");
        ui.close();
        assert.equal(ui.getState(), "closed");
    });

    test("indexing state while panel opens", () => {
        const fresh = dom.window.LouLocalSearchUI.create({
            runtime: createFixtureRuntime(),
            releaseId: RELEASE_ID,
            tabs: buildTabs(),
            debounceMs: 0,
            showTab: async function () {},
        });
        fresh.mount();
        fresh.open();
        assert.equal(fresh.getState(), "indexing");
    });

    test("empty query state", async () => {
        ui.open();
        await ui.runSearch("a");
        assert.equal(ui.getState(), "empty");
    });

    test("no-results state", async () => {
        ui.open();
        await ui.runSearch("zzzznotfound999");
        assert.equal(ui.getState(), "no-results");
        assert.equal(ui.getHits().length, 0);
    });

    test("runtime error state when ensureIndex fails", async () => {
        const broken = {
            ensureIndex: async () => ({
                ok: false,
                diagnostics: ["LS-RUNTIME-RELEASE-NOT-OPEN"],
                cacheStatus: "refused",
            }),
            search: async () => ({ hits: [], diagnostics: [], cacheStatus: "refused" }),
            getStatus: () => ({ hasIndex: false }),
        };
        const errorUi = dom.window.LouLocalSearchUI.create({
            runtime: broken,
            releaseId: RELEASE_ID,
            tabs: buildTabs(),
            debounceMs: 0,
            showTab: async function () {},
        });
        errorUi.mount();
        errorUi.open();
        await errorUi.runSearch("insuffisance");
        assert.equal(errorUi.getState(), "error");
    });

    test("displays SearchHit preserving runtime order", async () => {
        ui.open();
        await ui.runSearch("insuffisance");
        assert.equal(ui.getState(), "results");
        const hits = ui.getHits();
        assert.ok(hits.length > 0);
        const runtimeHits = (await runtime.search("insuffisance")).hits;
        assert.deepEqual(
            hits.map((h) => h.unitId),
            runtimeHits.map((h) => h.unitId)
        );
    });

    test("keyboard selection moves active result", async () => {
        ui.open();
        await ui.runSearch("insuffisance");
        assert.ok(ui.getHits().length > 1, "need multiple hits for keyboard test");
        const input = dom.window.document.getElementById("local-search-input");
        assert.equal(ui.getSelectedIndex(), 0);
        input.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowDown" }));
        assert.equal(ui.getSelectedIndex(), 1);
        input.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "ArrowUp" }));
        assert.equal(ui.getSelectedIndex(), 0);
    });

    test("closing panel clears highlights", async () => {
        dom.window.document.body.innerHTML +=
            '<section id="MEC-oap" class="pedagogical-block"></section>';
        ui.open();
        await ui.runSearch("insuffisance");
        if (ui.getHits().length) {
            await ui.selectHit(0);
        }
        ui.close();
        const el = dom.window.document.getElementById("MEC-oap");
        if (el) {
            assert.equal(el.classList.contains("search-hit-highlight"), false);
        }
    });

    test("new search clears previous highlights", async () => {
        dom.window.document.body.innerHTML +=
            '<section id="MEC-oap" class="pedagogical-block"></section>';
        ui.open();
        await ui.runSearch("insuffisance");
        if (ui.getHits().length) {
            await ui.selectHit(0);
        }
        await ui.runSearch("cardiaque");
        const el = dom.window.document.getElementById("MEC-oap");
        if (el) {
            assert.equal(el.classList.contains("search-hit-highlight"), false);
        }
    });

    test("does not write to learner patrimony stores", async () => {
        const writes = [];
        dom.window.LouLearnerStore = {
            addHighlight: function () {
                writes.push("highlight");
            },
            importSnapshot: function () {
                writes.push("snapshot");
            },
        };
        ui.open();
        await ui.runSearch("insuffisance");
        assert.equal(writes.length, 0);
    });
});

describe("D6-E package 234 end-to-end", () => {
    test("search and navigation on fixture release", async () => {
        const dom = buildSearchDom();
        const runtime = createFixtureRuntime();
        await runtime.ensureIndex({ releaseId: RELEASE_ID });
        const result = await runtime.search("insuffisance");
        assert.ok(result.hits.length > 0);

        const hit = result.hits[0];
        assert.equal(hit.release_id, RELEASE_ID);

        dom.window.document.body.innerHTML = "";
        if (hit.anchor.kind === "element_block" && hit.anchor.elementId) {
            dom.window.document.body.innerHTML =
                '<section id="' +
                hit.anchor.elementId +
                '" class="pedagogical-block"></section>';
        } else if (hit.anchor.kind === "section_path") {
            const key = hit.anchor.path.join("\u001f");
            dom.window.document.body.innerHTML =
                '<h2 data-section-path="' + key + '">target</h2>';
        } else if (hit.anchor.kind === "question_id") {
            dom.window.document.body.innerHTML =
                '<li data-question-id="' + hit.anchor.questionId + '"></li>';
        }

        const tabs = buildTabs();
        const tabIndex = dom.window.LouSearchNavigation.findTabIndex(tabs, hit.viewId);
        assert.ok(tabIndex >= 0);

        const nav = await dom.window.LouSearchNavigation.navigateToSearchHit(hit, {
            releaseId: RELEASE_ID,
            tabs,
            showTab: async function () {},
        });
        assert.equal(nav.ok, true);
    });
});
