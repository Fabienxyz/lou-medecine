/**
 * Local Search Runtime — shared pure logic (D6-D).
 * ViewBinding resolution, indexable paths, SearchIndexContext assembly.
 */

import { INDEX_SCHEMA_VERSION } from "../local-search-normalize.js";
import { SPEC_VERSION } from "../composition/composition-spec-schema.js";

export const RUNTIME_DIAGNOSTICS = Object.freeze({
    MANIFEST_INACCESSIBLE: "LS-RUNTIME-MANIFEST-INACCESSIBLE",
    CACHE_CORRUPT: "LS-RUNTIME-CACHE-CORRUPT",
    CACHE_PERSIST_FAILED: "LS-RUNTIME-CACHE-PERSIST-FAILED",
    RELEASE_NOT_OPEN: "LS-RUNTIME-RELEASE-NOT-OPEN",
    BUILD_IMPOSSIBLE: "LS-RUNTIME-BUILD-IMPOSSIBLE",
});

const NON_INDEXABLE_SUFFIXES = [".svg"];
const NON_INDEXABLE_FRAGMENTS = ["traceability.json", "trace_index"];

/**
 * @param {string} documentRef
 * @returns {boolean}
 */
export function isIndexableDocumentRef(documentRef) {
    if (typeof documentRef !== "string" || !documentRef.trim()) {
        return false;
    }
    const normalized = documentRef.replace(/\\/g, "/");
    for (const suffix of NON_INDEXABLE_SUFFIXES) {
        if (normalized.endsWith(suffix)) {
            return false;
        }
    }
    for (const fragment of NON_INDEXABLE_FRAGMENTS) {
        if (normalized.includes(fragment)) {
            return false;
        }
    }
    return true;
}

/**
 * @param {string} documentRef
 * @returns {"projection_markdown" | "college_markdown" | "question_yaml" | "scenario_yaml" | "cognitive_priming_json" | null}
 */
export function inferDocumentKind(documentRef) {
    const ref = documentRef.replace(/\\/g, "/");
    if (ref.startsWith("manifest:")) {
        return null;
    }
    if (
        ref.startsWith("build/") &&
        ref.includes("cognitive") &&
        ref.endsWith(".json")
    ) {
        return "cognitive_priming_json";
    }
    if (ref.startsWith("questions/") && ref.endsWith(".yaml")) {
        return "question_yaml";
    }
    if (ref.startsWith("scenarios/") && ref.endsWith(".yaml")) {
        return "scenario_yaml";
    }
    if (ref.endsWith(".md")) {
        if (ref.startsWith("source/") || ref.includes("college")) {
            return "college_markdown";
        }
        return "projection_markdown";
    }
    return null;
}

/**
 * @param {string} availability
 * @returns {"published" | "planned" | "known_absent"}
 */
export function mapViewAvailability(availability) {
    if (availability === "published") {
        return "published";
    }
    if (availability === "known_absent") {
        return "known_absent";
    }
    return "planned";
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {string} projectionId
 */
function lookupProjection(manifest, projectionId) {
    const projections = Array.isArray(manifest.projections) ? manifest.projections : [];
    return projections.find((p) => p && p.id === projectionId) || null;
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {{ kind: string, ref?: string, mergeOrder?: number }} source
 * @param {string} viewId
 */
function resolveSourceBinding(manifest, source, viewId) {
    const kind = source.kind;

    if (kind === "projection") {
        const projectionId = source.ref;
        const projection = lookupProjection(manifest, projectionId);
        if (!projection || projection.status !== "published" || typeof projection.path !== "string") {
            return null;
        }
        const documentRef = projection.path.replace(/\\/g, "/");
        if (!isIndexableDocumentRef(documentRef)) {
            return null;
        }
        return {
            sourceKind: "projection",
            projectionId,
            projectionOrder: source.mergeOrder ?? projection.order ?? 9999,
            documentRefs: [documentRef],
        };
    }

    if (kind === "questions") {
        const documentRefs = (Array.isArray(manifest.questions) ? manifest.questions : [])
            .filter((q) => q && q.status === "published" && typeof q.path === "string")
            .map((q) => q.path.replace(/\\/g, "/"))
            .filter(isIndexableDocumentRef)
            .sort();
        if (!documentRefs.length) {
            return null;
        }
        return {
            sourceKind: "questions",
            projectionId: "",
            projectionOrder: 9998,
            documentRefs,
        };
    }

    if (kind === "scenarios") {
        const documentRefs = (Array.isArray(manifest.scenarios) ? manifest.scenarios : [])
            .filter((s) => s && s.status === "published" && typeof s.path === "string")
            .map((s) => s.path.replace(/\\/g, "/"))
            .filter(isIndexableDocumentRef)
            .sort();
        if (!documentRefs.length) {
            return null;
        }
        return {
            sourceKind: "scenarios",
            projectionId: "",
            projectionOrder: 9998,
            documentRefs,
        };
    }

    if (kind === "college-source") {
        const collegePath =
            typeof manifest.college_source_path === "string"
                ? manifest.college_source_path.replace(/\\/g, "/")
                : null;
        if (!collegePath || !isIndexableDocumentRef(collegePath)) {
            return null;
        }
        return {
            sourceKind: "college-source",
            projectionId: "",
            projectionOrder: 9999,
            documentRefs: [collegePath],
        };
    }

    if (kind === "cognitive-priming") {
        const primingPath =
            typeof manifest.cognitive_priming_path === "string"
                ? manifest.cognitive_priming_path.trim().replace(/\\/g, "/")
                : null;
        if (!primingPath || !isIndexableDocumentRef(primingPath)) {
            return null;
        }
        return {
            sourceKind: "cognitive-priming",
            projectionId: "",
            projectionOrder: 1,
            documentRefs: [primingPath],
        };
    }

    if (kind === "none") {
        return null;
    }

    return null;
}

/**
 * Build ViewBindings for Local Search Service from Composition + manifest + RVM.
 * @param {Record<string, unknown>} manifest
 * @param {Record<string, unknown>} readingViewModel
 * @param {Record<string, unknown>} compositionSpec
 */
export function buildViewBindings(manifest, readingViewModel, compositionSpec) {
    const rvmViews = Array.isArray(readingViewModel.views) ? readingViewModel.views : [];
    const rvmById = new Map(rvmViews.map((v) => [v.viewId, v]));
    const specViews = Array.isArray(compositionSpec.views) ? compositionSpec.views : [];

    return specViews
        .slice()
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .map((specView) => {
            const rvmView = rvmById.get(specView.viewId);
            const availability = mapViewAvailability(rvmView ? rvmView.availability : "planned");
            const sources = (specView.sources || [])
                .map((source) => resolveSourceBinding(manifest, source, specView.viewId))
                .filter(Boolean);

            const manifestAltSource =
                availability === "published"
                    ? buildManifestAltSource(manifest, compositionSpec, specView)
                    : null;
            if (manifestAltSource) {
                sources.push(manifestAltSource);
            }

            return {
                viewId: specView.viewId,
                displayOrder: specView.displayOrder,
                availability,
                sources,
            };
        });
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {Record<string, unknown>} compositionSpec
 * @param {Record<string, unknown>} specView
 */
function buildManifestAltSource(manifest, compositionSpec, specView) {
    const visuals = collectManifestVisualsForView(manifest, compositionSpec, specView.viewId);
    if (!visuals.length) {
        return null;
    }
    return {
        sourceKind: "manifest-alt",
        projectionId: "",
        projectionOrder: 9999,
        documentRefs: [],
    };
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {Record<string, unknown>} compositionSpec
 * @param {string} [viewIdFilter]
 */
export function collectManifestVisuals(manifest, compositionSpec, viewIdFilter) {
    const visuals = [];
    for (const visual of manifest.visuals || []) {
        if (!visual || !visual.alt || !String(visual.alt).trim()) {
            continue;
        }
        const ctx = findVisualViewContext(manifest, compositionSpec, visual);
        if (viewIdFilter && ctx.viewId !== viewIdFilter) {
            continue;
        }
        visuals.push({
            id: visual.id,
            visualId: visual.id,
            element: visual.element,
            alt: visual.alt,
            viewId: ctx.viewId,
            projectionId: ctx.projectionId,
            projectionOrder: ctx.projectionOrder,
            viewIds: ctx.viewId ? [ctx.viewId] : [],
        });
    }
    return visuals;
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {Record<string, unknown>} compositionSpec
 * @param {string} viewId
 */
function collectManifestVisualsForView(manifest, compositionSpec, viewId) {
    return collectManifestVisuals(manifest, compositionSpec, viewId);
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {Record<string, unknown>} compositionSpec
 * @param {Record<string, unknown>} visual
 */
function findVisualViewContext(manifest, compositionSpec, visual) {
    const element = visual.element;
    const specViews = Array.isArray(compositionSpec.views) ? compositionSpec.views : [];

    for (const specView of specViews) {
        for (const source of specView.sources || []) {
            if (source.kind !== "projection") {
                continue;
            }
            const projection = lookupProjection(manifest, source.ref);
            if (!projection) {
                continue;
            }
            const elements = Array.isArray(projection.elements) ? projection.elements : [];
            const visualKeys =
                projection.visuals && typeof projection.visuals === "object"
                    ? Object.keys(projection.visuals)
                    : [];
            if (elements.includes(element) || visualKeys.includes(element)) {
                return {
                    viewId: specView.viewId,
                    projectionId: source.ref,
                    projectionOrder: source.mergeOrder ?? projection.order ?? 9999,
                };
            }
        }
    }
    return { viewId: "", projectionId: "", projectionOrder: 9999 };
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {Record<string, unknown>} readingViewModel
 * @param {Record<string, unknown>} compositionSpec
 */
export function collectIndexableDocumentRefs(manifest, readingViewModel, compositionSpec) {
    const bindings = buildViewBindings(manifest, readingViewModel, compositionSpec);
    const refs = new Set();
    for (const binding of bindings) {
        if (binding.availability !== "published") {
            continue;
        }
        for (const source of binding.sources || []) {
            if (source.sourceKind === "manifest-alt") {
                continue;
            }
            for (const ref of source.documentRefs || []) {
                if (isIndexableDocumentRef(ref)) {
                    refs.add(ref);
                }
            }
        }
    }
    return [...refs].sort();
}

/**
 * @param {{
 *   releaseId: string,
 *   contentDigest: string,
 *   manifest: Record<string, unknown>,
 *   readingViewModel: Record<string, unknown>,
 *   compositionSpec: Record<string, unknown>,
 * }} input
 */
export function resolveSearchIndexContext(input) {
    const viewBindings = buildViewBindings(
        input.manifest,
        input.readingViewModel,
        input.compositionSpec
    );
    return {
        release_id: input.releaseId,
        content_digest: input.contentDigest,
        index_schema_version: INDEX_SCHEMA_VERSION,
        compositionSpecVersion: input.compositionSpec.version || SPEC_VERSION,
        viewBindings,
    };
}

/**
 * @param {Record<string, unknown>} manifest
 * @param {string} documentRef
 */
export function registryMetadataForDocument(manifest, documentRef) {
    const ref = documentRef.replace(/\\/g, "/");
    const question = (manifest.questions || []).find((q) => q && q.path === ref);
    if (question) {
        return { questionId: question.question_id, publicationStatus: question.status };
    }
    const scenario = (manifest.scenarios || []).find((s) => s && s.path === ref);
    if (scenario) {
        return { scenarioId: scenario.scenario_id, publicationStatus: scenario.status };
    }
    const projection = (manifest.projections || []).find((p) => p && p.path === ref);
    if (projection) {
        return { projectionId: projection.id, publicationStatus: projection.status };
    }
    if (manifest.college_source_path === ref) {
        return { publicationStatus: "published" };
    }
    if (manifest.cognitive_priming_path === ref) {
        return { publicationStatus: "published" };
    }
    return { publicationStatus: "published" };
}
