/**
 * Local Search Runtime (D6-D) — I/O orchestration for Local Search Service.
 * Reads artefacts via Package Access ; persists derived index cache ; delegates to D6-C Service.
 */

import { DIAGNOSTICS, INDEX_SCHEMA_VERSION } from "../local-search-normalize.js";
import {
    buildSearchIndex,
    validateSearchCache,
    searchLocalIndex,
} from "../local-search-service.js";
import {
    buildViewBindings,
    collectManifestVisuals,
    collectIndexableDocumentRefs,
    inferDocumentKind,
    registryMetadataForDocument,
    resolveSearchIndexContext,
    RUNTIME_DIAGNOSTICS,
} from "./local-search-runtime-shared.js";
import { isValidCacheRecordShape } from "./local-search-cache.js";

/**
 * @typedef {Object} OpenReleaseContext
 * @property {string} releaseId
 * @property {string} contentDigest
 * @property {string} [chapter]
 */

/**
 * @typedef {Object} PackageAccessLike
 * @property {(releaseId: string) => Promise<Record<string, unknown>>} resolveManifest
 * @property {(releaseId: string, relativePath: string) => Promise<{ url: string, relativePath: string }>} resolveAssetUrl
 */

/**
 * @typedef {Object} LocalSearchRuntimeOptions
 * @property {PackageAccessLike} packageAccess
 * @property {import("./local-search-cache.js").SearchCacheStorage} cacheStorage
 * @property {(manifest: Record<string, unknown>, compositionSpec: Record<string, unknown>) => { readingViewModel: Record<string, unknown> }} compose
 * @property {Record<string, unknown>} compositionSpec
 * @property {typeof fetch} [fetchFn]
 * @property {typeof fetch} [fetch] — alias of fetchFn
 * @property {() => string} [nowIso]
 */

function uniqueDiagnostics(list) {
    const seen = new Set();
    const out = [];
    for (const code of list) {
        if (code && !seen.has(code)) {
            seen.add(code);
            out.push(code);
        }
    }
    return out;
}

/**
 * @param {LocalSearchRuntimeOptions} options
 */
export function createLocalSearchRuntime(options) {
    const packageAccess = options.packageAccess;
    const cacheStorage = options.cacheStorage;
    const compose = options.compose;
    const compositionSpec = options.compositionSpec;
    const fetchFn = options.fetchFn || options.fetch || globalThis.fetch;
    const nowIso = options.nowIso || (() => new Date().toISOString());

    /** @type {OpenReleaseContext | null} */
    let openRelease = null;
    /** @type {Record<string, unknown> | null} */
    let activeIndex = null;
    /** @type {Record<string, unknown> | null} */
    let activeContext = null;
    /** @type {string[]} */
    let lastDiagnostics = [];
    /** @type {string | null} */
    let cacheStatus = null;

    function assertFetch() {
        if (typeof fetchFn !== "function") {
            throw new Error("local search runtime: fetch is required");
        }
    }

    /**
     * @param {string} [releaseId]
     */
    function resolveTargetReleaseId(releaseId) {
        const target = releaseId || (openRelease && openRelease.releaseId);
        if (!target) {
            throw new Error("local search runtime: no open release");
        }
        if (openRelease && target !== openRelease.releaseId) {
            return { refused: true, releaseId: target };
        }
        return { refused: false, releaseId: target };
    }

    /**
     * @param {string} releaseId
     * @param {string} url
     */
    async function fetchText(url) {
        assertFetch();
        const response = await fetchFn(url);
        if (!response.ok) {
            throw new Error(`local search runtime: artefact fetch failed (${response.status})`);
        }
        return response.text();
    }

    /**
     * @param {string} releaseId
     * @param {string} relativePath
     */
    async function readDeclaredArtifact(releaseId, relativePath) {
        const resolved = await packageAccess.resolveAssetUrl(releaseId, relativePath);
        const content = await fetchText(resolved.url);
        return { documentRef: resolved.relativePath, content };
    }

    /**
     * @param {string} releaseId
     * @param {string} contentDigest
     */
    async function loadManifestAndContext(releaseId, contentDigest) {
        let manifest;
        try {
            manifest = await packageAccess.resolveManifest(releaseId);
        } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            throw Object.assign(new Error(message), {
                diagnostic: RUNTIME_DIAGNOSTICS.MANIFEST_INACCESSIBLE,
            });
        }

        const { readingViewModel } = compose(manifest, compositionSpec);
        const context = resolveSearchIndexContext({
            releaseId,
            contentDigest,
            manifest,
            readingViewModel,
            compositionSpec,
        });

        return { manifest, readingViewModel, context };
    }

    /**
     * @param {string} releaseId
     * @param {Record<string, unknown>} manifest
     * @param {Record<string, unknown>} readingViewModel
     */
    async function buildArtifactsInput(releaseId, manifest, readingViewModel) {
        const documentRefs = collectIndexableDocumentRefs(manifest, readingViewModel, compositionSpec);
        /** @type {Array<Record<string, unknown>>} */
        const artifacts = [];
        const diagnostics = [];

        for (const documentRef of documentRefs) {
            const kind = inferDocumentKind(documentRef);
            if (!kind) {
                continue;
            }
            try {
                const { content } = await readDeclaredArtifact(releaseId, documentRef);
                const meta = registryMetadataForDocument(manifest, documentRef);
                artifacts.push({
                    documentRef,
                    documentKind: kind,
                    content,
                    publicationStatus: meta.publicationStatus || "published",
                    projectionId: meta.projectionId,
                    questionId: meta.questionId,
                    scenarioId: meta.scenarioId,
                });
            } catch (err) {
                diagnostics.push(DIAGNOSTICS.DOC_MISSING);
            }
        }

        const manifestVisuals = collectManifestVisuals(manifest, compositionSpec);

        return { artifacts, manifestVisuals, diagnostics };
    }

    /**
     * @param {string} releaseId
     * @param {Record<string, unknown>} context
     */
    async function loadCacheRecord(releaseId, context) {
        let raw;
        try {
            raw = await cacheStorage.get(releaseId);
        } catch {
            lastDiagnostics = uniqueDiagnostics([
                ...lastDiagnostics,
                RUNTIME_DIAGNOSTICS.CACHE_CORRUPT,
            ]);
            await cacheStorage.delete(releaseId);
            return { record: null, corrupt: true };
        }

        if (!raw) {
            return { record: null, corrupt: false };
        }

        if (!isValidCacheRecordShape(raw)) {
            lastDiagnostics = uniqueDiagnostics([
                ...lastDiagnostics,
                RUNTIME_DIAGNOSTICS.CACHE_CORRUPT,
            ]);
            await cacheStorage.delete(releaseId);
            return { record: null, corrupt: true };
        }

        const validation = validateSearchCache(raw, context);
        if (validation.status === "valid") {
            return { record: raw, corrupt: false, validation };
        }

        return { record: raw, corrupt: false, validation };
    }

    /**
     * @param {Record<string, unknown>} context
     * @param {Record<string, unknown>} index
     */
    async function persistCache(context, index) {
        const record = {
            release_id: context.release_id,
            content_digest: context.content_digest,
            index_schema_version: context.index_schema_version,
            compositionSpecVersion: context.compositionSpecVersion,
            viewBindings: context.viewBindings,
            index,
            cached_at: nowIso(),
        };
        try {
            await cacheStorage.put(record);
        } catch {
            lastDiagnostics = uniqueDiagnostics([
                ...lastDiagnostics,
                RUNTIME_DIAGNOSTICS.CACHE_PERSIST_FAILED,
            ]);
        }
    }

    return {
        INDEX_SCHEMA_VERSION,
        DIAGNOSTICS,
        RUNTIME_DIAGNOSTICS,

        /**
         * Bind the currently opened Release (Reader boot).
         * @param {OpenReleaseContext} releaseContext
         */
        setOpenRelease(releaseContext) {
            if (!releaseContext || !releaseContext.releaseId || !releaseContext.contentDigest) {
                throw new Error("local search runtime: invalid open release context");
            }
            if (openRelease && openRelease.releaseId !== releaseContext.releaseId) {
                activeIndex = null;
                activeContext = null;
                cacheStatus = null;
            }
            openRelease = {
                releaseId: releaseContext.releaseId,
                contentDigest: releaseContext.contentDigest,
                chapter: releaseContext.chapter,
            };
        },

        getOpenRelease() {
            return openRelease ? { ...openRelease } : null;
        },

        /**
         * @param {{ releaseId?: string, contentDigest?: string }} [options]
         */
        async ensureIndex(options = {}) {
            lastDiagnostics = [];
            const target = resolveTargetReleaseId(options.releaseId);
            if (target.refused) {
                lastDiagnostics = uniqueDiagnostics([
                    DIAGNOSTICS.SCOPE_REFUSED,
                    RUNTIME_DIAGNOSTICS.RELEASE_NOT_OPEN,
                ]);
                return {
                    ok: false,
                    cacheStatus: "refused",
                    diagnostics: lastDiagnostics,
                };
            }

            const releaseId = target.releaseId;
            const contentDigest =
                options.contentDigest ||
                (openRelease && openRelease.contentDigest) ||
                "";

            if (!contentDigest) {
                lastDiagnostics = uniqueDiagnostics([RUNTIME_DIAGNOSTICS.BUILD_IMPOSSIBLE]);
                return { ok: false, cacheStatus: "missing", diagnostics: lastDiagnostics };
            }

            let manifest;
            let readingViewModel;
            let context;
            try {
                const loaded = await loadManifestAndContext(releaseId, contentDigest);
                manifest = loaded.manifest;
                readingViewModel = loaded.readingViewModel;
                context = loaded.context;
            } catch (err) {
                const diagnostic =
                    /** @type {{ diagnostic?: string }} */ (err).diagnostic ||
                    RUNTIME_DIAGNOSTICS.MANIFEST_INACCESSIBLE;
                lastDiagnostics = uniqueDiagnostics([diagnostic]);
                return { ok: false, cacheStatus: "missing", diagnostics: lastDiagnostics };
            }

            const cacheLoad = await loadCacheRecord(releaseId, context);
            if (cacheLoad.corrupt) {
                lastDiagnostics = uniqueDiagnostics([
                    RUNTIME_DIAGNOSTICS.CACHE_CORRUPT,
                    DIAGNOSTICS.CACHE_STALE,
                ]);
            } else if (cacheLoad.validation && cacheLoad.validation.status === "valid") {
                activeIndex = cacheLoad.record.index;
                activeContext = context;
                cacheStatus = "valid";
                lastDiagnostics = uniqueDiagnostics(cacheLoad.validation.diagnostics);
                return {
                    ok: true,
                    cacheStatus: "valid",
                    diagnostics: lastDiagnostics,
                    indexBuilt: false,
                };
            } else if (cacheLoad.validation) {
                lastDiagnostics = uniqueDiagnostics(cacheLoad.validation.diagnostics);
            } else {
                lastDiagnostics = uniqueDiagnostics([DIAGNOSTICS.CACHE_MISSING]);
            }

            const { artifacts, manifestVisuals, diagnostics: buildDiag } =
                await buildArtifactsInput(releaseId, manifest, readingViewModel);

            lastDiagnostics = uniqueDiagnostics([...lastDiagnostics, ...buildDiag]);

            const built = buildSearchIndex({
                context,
                artifacts,
                manifestVisuals,
            });

            lastDiagnostics = uniqueDiagnostics([...lastDiagnostics, ...built.diagnostics]);

            if (!built.index) {
                lastDiagnostics = uniqueDiagnostics([
                    ...lastDiagnostics,
                    RUNTIME_DIAGNOSTICS.BUILD_IMPOSSIBLE,
                ]);
                return { ok: false, cacheStatus: "missing", diagnostics: lastDiagnostics };
            }

            activeIndex = built.index;
            activeContext = context;
            cacheStatus = "rebuilt";
            await persistCache(context, built.index);

            return {
                ok: true,
                cacheStatus: cacheStatus,
                diagnostics: lastDiagnostics,
                indexBuilt: true,
            };
        },

        /**
         * @param {string} query
         * @param {{ releaseId?: string }} [options]
         */
        async search(query, options = {}) {
            const ensure = await this.ensureIndex({ releaseId: options.releaseId });
            if (!ensure.ok) {
                return { hits: [], diagnostics: ensure.diagnostics, cacheStatus: ensure.cacheStatus };
            }
            if (!activeIndex) {
                return {
                    hits: [],
                    diagnostics: uniqueDiagnostics([
                        ...lastDiagnostics,
                        RUNTIME_DIAGNOSTICS.BUILD_IMPOSSIBLE,
                    ]),
                    cacheStatus: ensure.cacheStatus,
                };
            }
            const result = searchLocalIndex(activeIndex, query);
            lastDiagnostics = uniqueDiagnostics([...lastDiagnostics, ...result.diagnostics]);
            return {
                hits: result.hits,
                diagnostics: lastDiagnostics,
                cacheStatus: ensure.cacheStatus,
            };
        },

        /**
         * @param {string} releaseId
         */
        async invalidate(releaseId) {
            await cacheStorage.delete(releaseId);
            if (openRelease && openRelease.releaseId === releaseId) {
                activeIndex = null;
                activeContext = null;
                cacheStatus = "stale";
                lastDiagnostics = uniqueDiagnostics([DIAGNOSTICS.CACHE_STALE]);
            }
            return { ok: true, diagnostics: [DIAGNOSTICS.CACHE_STALE] };
        },

        /**
         * @param {string} releaseId
         */
        async purge(releaseId) {
            await cacheStorage.delete(releaseId);
            if (openRelease && openRelease.releaseId === releaseId) {
                activeIndex = null;
                activeContext = null;
                cacheStatus = "missing";
                lastDiagnostics = uniqueDiagnostics([DIAGNOSTICS.CACHE_MISSING]);
            }
            return { ok: true, diagnostics: [DIAGNOSTICS.CACHE_MISSING] };
        },

        getStatus() {
            return {
                openRelease: openRelease ? { ...openRelease } : null,
                cacheStatus,
                hasIndex: Boolean(activeIndex),
                diagnostics: lastDiagnostics.slice(),
            };
        },

        /** Test hook — last declared paths read via Package Access. Not used in production UI. */
        _debug: {
            buildViewBindings,
            resolveSearchIndexContext,
            collectIndexableDocumentRefs,
        },
    };
}

export default createLocalSearchRuntime;
