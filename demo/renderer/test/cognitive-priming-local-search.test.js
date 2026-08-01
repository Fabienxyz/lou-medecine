/**
 * AP-F-LS — Local Search indexation for Cognitive Priming (C-CP-09).
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { compose } from "../composition/composition-engine.js";
import compositionSpec from "../composition/corpus-composition-v1.json" with { type: "json" };
import { INDEX_SCHEMA_VERSION } from "../local-search-normalize.js";
import { extractCognitivePrimingUnits } from "../local-search-extract.js";
import { buildSearchIndex, searchLocalIndex } from "../local-search-service.js";
import {
    buildViewBindings,
    collectIndexableDocumentRefs,
    inferDocumentKind,
    resolveSearchIndexContext,
} from "../library/local-search-runtime-shared.js";
import { createBrowserPackageAccess } from "../library/browser-package-access.js";
import { createMemorySearchCacheStorage } from "../library/local-search-cache.js";
import { createLocalSearchRuntime } from "../library/local-search-runtime.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PKG = path.join(
    HERE,
    "fixtures/product-library/packages/cardio__234__2022__1"
);
const FIXTURE_LIBRARY = path.join(HERE, "fixtures/product-library");
const LEGACY_MANIFEST_PATH = path.join(
    HERE,
    "fixtures/manifest-understanding-full.fixture.json"
);
const CP_ARTIFACT_PATH = path.join(FIXTURE_PKG, "build/cognitive-priming.v1.json");
const RELEASE_ID = "cardio__234__2022__1";
const CONTENT_DIGEST = "sha256:fbadd8232e9d0aa133364365d752603dcde38199f786e5eddd137fcfe2b534f5";
const LIBRARY_BASE = "https://reader.test/library";

function loadJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function createMockLibraryFetch(libraryRoot) {
    const basePath = new URL(LIBRARY_BASE).pathname.replace(/\/+$/, "");

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

function build234Context() {
    const manifest = loadJson(path.join(FIXTURE_PKG, "manifest.json"));
    const { readingViewModel } = compose(manifest, compositionSpec);
    return resolveSearchIndexContext({
        releaseId: RELEASE_ID,
        contentDigest: CONTENT_DIGEST,
        manifest,
        readingViewModel,
        compositionSpec,
    });
}

describe("AP-F-LS — cognitive priming extraction", () => {
    const artifactText = fs.readFileSync(CP_ARTIFACT_PATH, "utf8");

    test("indexes summary, AI sentence, EDN labels and item_labels only", () => {
        const { units, diagnostics } = extractCognitivePrimingUnits(artifactText);
        assert.equal(diagnostics.length, 0);
        assert.equal(units.length, 1);
        assert.equal(units[0].unitType, "cognitive_priming");
        assert.deepEqual(units[0].anchor, { kind: "view_entry" });

        const paths = units[0].passages.map((p) => p.fieldPath);
        assert.ok(paths.some((p) => p.startsWith("summary.bullets[")));
        assert.ok(paths.some((p) => p.includes("ai_complements[0].sentence")));
        assert.ok(paths.some((p) => p.includes("edn_references[0].label")));
        assert.ok(paths.some((p) => p.includes("edn_references[0].item_label")));

        const joined = units[0].passages.map((p) => p.rawText).join("\n");
        assert.ok(joined.includes("débit insuffisant"));
        assert.ok(joined.includes("compensation utile"));
        assert.ok(joined.includes("Hypertension artérielle"));
        assert.ok(joined.includes("HTA"));
        assert.ok(!joined.includes("Complément pédagogique (IA)"));
        assert.ok(!joined.includes("edn-cardio-220"));
        assert.ok(!joined.includes("cardio/234"));
    });

    test("passageIds are unique (no duplicate index entries)", () => {
        const { units } = extractCognitivePrimingUnits(artifactText);
        const ids = units[0].passages.map(
            (p) => `${p.fieldPath}:${p.sourceOrdinal}`
        );
        assert.equal(new Set(ids).size, ids.length);
    });
});

describe("AP-F-LS — runtime shared bindings", () => {
    test("inferDocumentKind recognizes cognitive priming artefact", () => {
        assert.equal(
            inferDocumentKind("build/cognitive-priming.v1.json"),
            "cognitive_priming_json"
        );
        assert.equal(inferDocumentKind("build/traceability.json"), null);
    });

    test("package 234 exposes cognitive-priming source when published", () => {
        const manifest = loadJson(path.join(FIXTURE_PKG, "manifest.json"));
        const { readingViewModel } = compose(manifest, compositionSpec);
        const cpView = readingViewModel.views.find(
            (v) => v.viewId === "cognitive-priming"
        );
        assert.equal(cpView.availability, "published");

        const bindings = buildViewBindings(manifest, readingViewModel, compositionSpec);
        const cpBinding = bindings.find((b) => b.viewId === "cognitive-priming");
        assert.ok(cpBinding);
        assert.equal(cpBinding.availability, "published");
        assert.equal(cpBinding.sources.length, 1);
        assert.equal(cpBinding.sources[0].sourceKind, "cognitive-priming");
        assert.deepEqual(cpBinding.sources[0].documentRefs, [
            "build/cognitive-priming.v1.json",
        ]);

        const refs = collectIndexableDocumentRefs(manifest, readingViewModel, compositionSpec);
        assert.ok(refs.includes("build/cognitive-priming.v1.json"));
    });

    test("legacy package without artefact keeps cognitive-priming unindexed", () => {
        const manifest = loadJson(LEGACY_MANIFEST_PATH);
        const { readingViewModel } = compose(manifest, compositionSpec);
        const cpView = readingViewModel.views.find(
            (v) => v.viewId === "cognitive-priming"
        );
        assert.equal(cpView.availability, "planned");

        const refs = collectIndexableDocumentRefs(manifest, readingViewModel, compositionSpec);
        assert.ok(!refs.includes("build/cognitive-priming.v1.json"));
    });
});

describe("AP-F-LS — search hits on package 234", () => {
    test("search finds summary text in cognitive-priming view", () => {
        const context = build234Context();
        const artifactText = fs.readFileSync(CP_ARTIFACT_PATH, "utf8");
        const { index } = buildSearchIndex({
            context,
            artifacts: [
                {
                    documentRef: "build/cognitive-priming.v1.json",
                    documentKind: "cognitive_priming_json",
                    content: artifactText,
                    publicationStatus: "published",
                },
            ],
        });

        const summaryHit = searchLocalIndex(index, "débit insuffisant").hits.find(
            (h) => h.viewId === "cognitive-priming"
        );
        assert.ok(summaryHit);
        assert.equal(summaryHit.anchor.kind, "view_entry");
        assert.ok(summaryHit.fieldPath.startsWith("summary.bullets["));
    });

    test("search finds AI complement sentence", () => {
        const context = build234Context();
        const { index } = buildSearchIndex({
            context,
            artifacts: [
                {
                    documentRef: "build/cognitive-priming.v1.json",
                    documentKind: "cognitive_priming_json",
                    content: fs.readFileSync(CP_ARTIFACT_PATH, "utf8"),
                    publicationStatus: "published",
                },
            ],
        });

        const hit = searchLocalIndex(index, "compensation").hits.find(
            (h) => h.viewId === "cognitive-priming"
        );
        assert.ok(hit);
        assert.match(hit.fieldPath, /ai_complements\[0\]\.sentence/);
    });

    test("search finds EDN label", () => {
        const context = build234Context();
        const { index } = buildSearchIndex({
            context,
            artifacts: [
                {
                    documentRef: "build/cognitive-priming.v1.json",
                    documentKind: "cognitive_priming_json",
                    content: fs.readFileSync(CP_ARTIFACT_PATH, "utf8"),
                    publicationStatus: "published",
                },
            ],
        });

        const hit = searchLocalIndex(index, "fibrillation").hits.find(
            (h) => h.viewId === "cognitive-priming"
        );
        assert.ok(hit);
        assert.match(hit.fieldPath, /edn_references\[\d+\]\.label/);
    });
});

describe("AP-F-LS — runtime integration", () => {
    test("fixture 234 runtime indexes cognitive priming without regression", async () => {
        const fetchFn = createMockLibraryFetch(FIXTURE_LIBRARY);
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

        runtime.setOpenRelease({
            releaseId: RELEASE_ID,
            contentDigest: CONTENT_DIGEST,
            chapter: "cardio/234",
        });

        const cpHit = (await runtime.search("compensation")).hits.find(
            (h) => h.viewId === "cognitive-priming"
        );
        assert.ok(cpHit);

        const notionHit = (await runtime.search("insuffisance")).hits.find(
            (h) => h.viewId === "notions"
        );
        assert.ok(notionHit);
    });
});
