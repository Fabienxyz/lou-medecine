/**
 * Lot D6-C — Local Search Service (pure, stateless).
 * No I/O, DOM, IndexedDB, Package Access, Reader, or system clock.
 * Authority: LOCAL-SEARCH-COMPONENT-CONTRACT.md (D6-A) + D6-B spec.
 */

import {
    INDEX_SCHEMA_VERSION,
    DIAGNOSTICS,
    RECORD_SEPARATOR,
    SNIPPET_MAX_LEN,
    SNIPPET_CONTEXT_BEFORE,
    SNIPPET_CONTEXT_AFTER,
    SNIPPET_WORD_BOUNDARY_SCAN,
    ELLIPSIS,
    REGISTRY_PROJECTION_SORT,
    NO_PROJECTION_SORT,
    normText,
    normQuery,
    tokenizeQuery,
    utf8LexCompare,
    makePassageId,
} from "./local-search-normalize.js";

import {
    extractMarkdownUnits,
    extractQuestionUnits,
    extractScenarioUnits,
    extractManifestAltUnit,
    extractCognitivePrimingUnits,
} from "./local-search-extract.js";

function uniqueDiagnostics(list) {
    const seen = new Set();
    const out = [];
    for (const code of list) {
        if (!seen.has(code)) {
            seen.add(code);
            out.push(code);
        }
    }
    return out;
}

function assignDocumentOffsets(units) {
    const allPassages = [];
    for (const unit of units) {
        for (const passage of unit.passages) {
            allPassages.push(passage);
        }
    }
    let offset = 0;
    for (let i = 0; i < allPassages.length; i += 1) {
        const passage = allPassages[i];
        passage.documentOffsetBase = offset;
        offset += passage.normalizedText.length;
        if (i < allPassages.length - 1) {
            offset += RECORD_SEPARATOR.length;
        }
    }
}

function buildDocumentNormalizedText(units) {
    const parts = [];
    for (const unit of units) {
        for (const passage of unit.passages) {
            parts.push(passage.normalizedText);
        }
    }
    return parts.join(RECORD_SEPARATOR);
}

function finalizePassages(documentRef, units) {
    for (const unit of units) {
        for (const passage of unit.passages) {
            passage.passageId = makePassageId(
                documentRef,
                unit.unitId,
                passage.fieldPath,
                passage.sourceOrdinal
            );
        }
    }
    assignDocumentOffsets(units);
}

function extractUnitsForArtifact(artifact) {
    const kind = artifact.documentKind;
    if (kind === "projection_markdown") {
        return extractMarkdownUnits(artifact.content, "projection");
    }
    if (kind === "college_markdown") {
        return extractMarkdownUnits(artifact.content, "college");
    }
    if (kind === "question_yaml") {
        return extractQuestionUnits(artifact.content, artifact.questionId);
    }
    if (kind === "scenario_yaml") {
        return extractScenarioUnits(artifact.content, artifact.scenarioId);
    }
    if (kind === "cognitive_priming_json") {
        return extractCognitivePrimingUnits(artifact.content);
    }
    return { units: [], diagnostics: [DIAGNOSTICS.DOC_INVALID] };
}

function compareProjectionId(a, b) {
    return utf8LexCompare(a || "", b || "");
}

function compareSortKey(a, b) {
    if (a.viewSort !== b.viewSort) {
        return a.viewSort - b.viewSort;
    }
    if (a.projectionSort !== b.projectionSort) {
        return a.projectionSort - b.projectionSort;
    }
    const projCmp = compareProjectionId(a.projectionId, b.projectionId);
    if (projCmp !== 0) {
        return projCmp;
    }
    const docCmp = utf8LexCompare(a.documentRef, b.documentRef);
    if (docCmp !== 0) {
        return docCmp;
    }
    if (a.documentOffset !== b.documentOffset) {
        return a.documentOffset - b.documentOffset;
    }
    const passCmp = utf8LexCompare(a.passageId, b.passageId);
    if (passCmp !== 0) {
        return passCmp;
    }
    if (a.matchRangeIndex !== b.matchRangeIndex) {
        return a.matchRangeIndex - b.matchRangeIndex;
    }
    return utf8LexCompare(a.unitId, b.unitId);
}

function findAllOccurrences(text, token) {
    const ranges = [];
    if (!token) {
        return ranges;
    }
    let from = 0;
    while (from <= text.length) {
        const idx = text.indexOf(token, from);
        if (idx < 0) {
            break;
        }
        ranges.push({ start: idx, length: token.length });
        from = idx + 1;
    }
    return ranges;
}

function findFirstOccurrence(text, token) {
    const idx = text.indexOf(token);
    if (idx < 0) {
        return null;
    }
    return { start: idx, length: token.length };
}

function passageMatchesTokens(normalizedText, tokens) {
    const ranges = [];
    for (const token of tokens) {
        const range = findFirstOccurrence(normalizedText, token);
        if (!range) {
            return null;
        }
        ranges.push(range);
    }
    ranges.sort((a, b) => a.start - b.start);
    return ranges;
}

function adjustToWordBoundary(text, start, end) {
    let s = start;
    let e = end;
    if (s > 0 && text[s] !== " ") {
        const limit = Math.max(0, s - SNIPPET_WORD_BOUNDARY_SCAN);
        for (let i = s; i >= limit; i -= 1) {
            if (text[i] === " ") {
                s = i + 1;
                break;
            }
        }
    }
    if (e < text.length && text[e - 1] !== " ") {
        const limit = Math.min(text.length, e + SNIPPET_WORD_BOUNDARY_SCAN);
        for (let i = e; i < limit; i += 1) {
            if (text[i] === " ") {
                e = i;
                break;
            }
        }
    }
    return { start: s, end: e };
}

function buildSnippet(normalizedText, matchRanges) {
    if (!matchRanges.length) {
        return { snippet: "", snippetMatchRanges: [] };
    }
    const primary = matchRanges[0];
    const primaryEnd = primary.start + primary.length;
    let winStart = Math.max(0, primary.start - SNIPPET_CONTEXT_BEFORE);
    let winEnd = Math.min(normalizedText.length, primaryEnd + SNIPPET_CONTEXT_AFTER);

    if (winEnd - winStart > SNIPPET_MAX_LEN) {
        const center = (primary.start + primaryEnd) / 2;
        const half = Math.floor(SNIPPET_MAX_LEN / 2);
        winStart = Math.max(0, Math.floor(center - half));
        winEnd = winStart + SNIPPET_MAX_LEN;
        if (winEnd > normalizedText.length) {
            winEnd = normalizedText.length;
            winStart = Math.max(0, winEnd - SNIPPET_MAX_LEN);
        }
    }

    const adjusted = adjustToWordBoundary(normalizedText, winStart, winEnd);
    winStart = adjusted.start;
    winEnd = adjusted.end;

    if (winEnd - winStart > SNIPPET_MAX_LEN) {
        winEnd = winStart + SNIPPET_MAX_LEN;
    }

    let snippet = normalizedText.slice(winStart, winEnd);
    const prefixEllipsis = winStart > 0;
    const suffixEllipsis = winEnd < normalizedText.length;
    if (prefixEllipsis) {
        snippet = ELLIPSIS + snippet;
    }
    if (suffixEllipsis) {
        snippet = snippet + ELLIPSIS;
    }

    const snippetMatchRanges = matchRanges
        .map((range) => {
            const absStart = range.start;
            const absEnd = range.start + range.length;
            if (absEnd <= winStart || absStart >= winEnd) {
                return null;
            }
            const relStart = absStart - winStart + (prefixEllipsis ? 1 : 0);
            return { start: relStart, length: range.length };
        })
        .filter(Boolean);

    return { snippet, snippetMatchRanges };
}

function buildNavigation(viewId, anchor, fieldPath, documentRef) {
    return {
        viewId,
        anchor,
        fieldPath,
        documentRef,
    };
}

function flattenIndexEntries(index) {
    const entries = [];
    for (const doc of index.documents) {
        for (const viewId of doc.viewIds) {
            const binding = index.context.viewBindings.find((v) => v.viewId === viewId);
            const viewSort = binding ? binding.displayOrder : NO_PROJECTION_SORT;
            let projectionSort = doc.projectionOrder;
            if (projectionSort === undefined || projectionSort === null) {
                projectionSort =
                    doc.documentKind === "question_yaml" || doc.documentKind === "scenario_yaml"
                        ? REGISTRY_PROJECTION_SORT
                        : NO_PROJECTION_SORT;
            }
            for (const unit of doc.units) {
                for (const passage of unit.passages) {
                    entries.push({
                        doc,
                        viewId,
                        viewSort,
                        projectionSort,
                        projectionId: doc.projectionId || "",
                        unit,
                        passage,
                    });
                }
            }
        }
    }
    return entries;
}

/**
 * Build search index from pre-loaded artifacts (pure).
 */
export function buildSearchIndex(input) {
    const diagnostics = [];
    const context = input.context;
    const artifactsByRef = new Map();

    if (!context || context.index_schema_version !== INDEX_SCHEMA_VERSION) {
        return {
            index: null,
            diagnostics: uniqueDiagnostics([DIAGNOSTICS.SCHEMA_INCOMPATIBLE]),
        };
    }

    for (const artifact of input.artifacts || []) {
        artifactsByRef.set(artifact.documentRef, artifact);
    }

    const documents = [];
    const publishedBindings = (context.viewBindings || []).slice().sort((a, b) => a.displayOrder - b.displayOrder);

    for (const binding of context.viewBindings || []) {
        if (binding.availability !== "published") {
            diagnostics.push(DIAGNOSTICS.VIEW_SKIPPED);
        }
    }

    const docJobs = [];
    for (const binding of publishedBindings) {
        if (binding.availability !== "published") {
            continue;
        }
        for (const source of binding.sources || []) {
            const projectionSort =
                source.projectionOrder !== undefined && source.projectionOrder !== null
                    ? source.projectionOrder
                    : source.sourceKind === "questions" || source.sourceKind === "scenarios"
                      ? REGISTRY_PROJECTION_SORT
                      : NO_PROJECTION_SORT;
            for (const documentRef of source.documentRefs || []) {
                docJobs.push({
                    documentRef,
                    viewId: binding.viewId,
                    displayOrder: binding.displayOrder,
                    projectionId: source.projectionId || "",
                    projectionSort,
                    sourceKind: source.sourceKind,
                });
            }
        }
    }

    docJobs.sort((a, b) => {
        if (a.displayOrder !== b.displayOrder) {
            return a.displayOrder - b.displayOrder;
        }
        if (a.projectionSort !== b.projectionSort) {
            return a.projectionSort - b.projectionSort;
        }
        return utf8LexCompare(a.documentRef, b.documentRef);
    });

    const docMap = new Map();
    let partial = false;

    for (const job of docJobs) {
        if (job.sourceKind === "manifest-alt") {
            continue;
        }
        const artifact = artifactsByRef.get(job.documentRef);
        if (!artifact) {
            diagnostics.push(DIAGNOSTICS.DOC_MISSING);
            partial = true;
            continue;
        }
        if (artifact.publicationStatus && artifact.publicationStatus !== "published") {
            diagnostics.push(DIAGNOSTICS.ARTIFACT_SKIPPED);
            continue;
        }

        let unitsResult;
        if (artifact.documentKind === "manifest_alt") {
            unitsResult = extractManifestAltUnit(artifact);
        } else {
            unitsResult = extractUnitsForArtifact(artifact);
        }
        diagnostics.push(...(unitsResult.diagnostics || []));

        if (!unitsResult.units.length) {
            if ((unitsResult.diagnostics || []).includes(DIAGNOSTICS.DOC_INVALID)) {
                partial = true;
            }
            continue;
        }

        finalizePassages(job.documentRef, unitsResult.units);

        let doc = docMap.get(job.documentRef);
        if (!doc) {
            doc = {
                documentRef: job.documentRef,
                documentKind: artifact.documentKind,
                publicationStatus: "published",
                viewIds: [],
                projectionId: job.projectionId || artifact.projectionId || "",
                projectionOrder: job.projectionSort,
                units: unitsResult.units,
                documentNormalizedText: "",
            };
            docMap.set(job.documentRef, doc);
            documents.push(doc);
        } else {
            doc.viewIds.push(job.viewId);
            mergeUnits(doc.units, unitsResult.units);
        }
        if (doc.viewIds.indexOf(job.viewId) < 0) {
            doc.viewIds.push(job.viewId);
        }
    }

    for (const visual of input.manifestVisuals || []) {
        const documentRef = `manifest:visuals/${visual.id || visual.visualId}`;
        const unitsResult = extractManifestAltUnit(visual);
        if (!unitsResult.units.length) {
            continue;
        }
        finalizePassages(documentRef, unitsResult.units);
        const doc = {
            documentRef,
            documentKind: "manifest_alt",
            publicationStatus: "published",
            viewIds: visual.viewIds || (visual.viewId ? [visual.viewId] : []),
            projectionId: visual.projectionId || "",
            projectionOrder: visual.projectionOrder ?? NO_PROJECTION_SORT,
            units: unitsResult.units,
        };
        doc.documentNormalizedText = buildDocumentNormalizedText(doc.units);
        documents.push(doc);
    }

    for (const doc of documents) {
        doc.documentNormalizedText = buildDocumentNormalizedText(doc.units);
    }

    if (partial) {
        diagnostics.push(DIAGNOSTICS.BUILD_PARTIAL);
    }

    const index = {
        context: {
            release_id: context.release_id,
            content_digest: context.content_digest,
            index_schema_version: context.index_schema_version,
            compositionSpecVersion: context.compositionSpecVersion,
            viewBindings: context.viewBindings,
        },
        documents,
    };

    return {
        index,
        diagnostics: uniqueDiagnostics(diagnostics),
    };
}

function mergeUnits(existing, incoming) {
    for (const unit of incoming) {
        const found = existing.find((u) => u.unitType === unit.unitType && u.unitId === unit.unitId);
        if (!found) {
            existing.push(unit);
        }
    }
}

/**
 * Validate cache record against current context (pure).
 */
export function validateSearchCache(cacheRecord, context) {
    const diagnostics = [];
    if (!cacheRecord) {
        diagnostics.push(DIAGNOSTICS.CACHE_MISSING);
        return { status: "missing", diagnostics: uniqueDiagnostics(diagnostics) };
    }
    if (cacheRecord.index_schema_version !== INDEX_SCHEMA_VERSION) {
        diagnostics.push(DIAGNOSTICS.SCHEMA_INCOMPATIBLE);
        return { status: "stale", diagnostics: uniqueDiagnostics(diagnostics) };
    }
    if (
        cacheRecord.release_id !== context.release_id ||
        cacheRecord.content_digest !== context.content_digest ||
        cacheRecord.index_schema_version !== context.index_schema_version ||
        JSON.stringify(cacheRecord.viewBindings) !== JSON.stringify(context.viewBindings)
    ) {
        diagnostics.push(DIAGNOSTICS.CACHE_STALE);
        return { status: "stale", diagnostics: uniqueDiagnostics(diagnostics) };
    }
    diagnostics.push(DIAGNOSTICS.CACHE_VALID);
    return { status: "valid", diagnostics: uniqueDiagnostics(diagnostics) };
}

/**
 * Execute search against a built index (pure).
 */
export function searchLocalIndex(index, query) {
    const diagnostics = [];
    if (!index || !index.documents) {
        return { hits: [], diagnostics: uniqueDiagnostics(diagnostics) };
    }

    const normalizedQuery = normQuery(query);
    if (!normalizedQuery || normalizedQuery.length < 2) {
        diagnostics.push(DIAGNOSTICS.QUERY_TOO_SHORT);
        return { hits: [], diagnostics: uniqueDiagnostics(diagnostics) };
    }

    const tokens = tokenizeQuery(normalizedQuery);
    if (!tokens.length) {
        diagnostics.push(DIAGNOSTICS.QUERY_TOO_SHORT);
        return { hits: [], diagnostics: uniqueDiagnostics(diagnostics) };
    }

    const hits = [];
    const entries = flattenIndexEntries(index);
    const isMulti = tokens.length > 1;

    for (const entry of entries) {
        const { passage, unit, doc, viewId, viewSort, projectionSort, projectionId } = entry;
        const text = passage.normalizedText;

        if (isMulti) {
            const ranges = passageMatchesTokens(text, tokens);
            if (!ranges) {
                continue;
            }
            const documentOffset = passage.documentOffsetBase + ranges[0].start;
            const { snippet, snippetMatchRanges } = buildSnippet(text, ranges);
            hits.push({
                release_id: index.context.release_id,
                viewId,
                projectionId,
                documentRef: doc.documentRef,
                unitType: unit.unitType,
                unitId: unit.unitId,
                anchor: unit.anchor,
                fieldPath: passage.fieldPath,
                passageId: passage.passageId,
                matchRanges: ranges,
                documentOffset,
                snippet,
                snippetMatchRanges,
                navigation: buildNavigation(viewId, unit.anchor, passage.fieldPath, doc.documentRef),
                viewSort,
                projectionSort,
                matchRangeIndex: 0,
            });
            continue;
        }

        const token = tokens[0];
        const occurrences = findAllOccurrences(text, token);
        for (let ri = 0; ri < occurrences.length; ri += 1) {
            const range = occurrences[ri];
            const ranges = [range];
            const documentOffset = passage.documentOffsetBase + range.start;
            const { snippet, snippetMatchRanges } = buildSnippet(text, ranges);
            hits.push({
                release_id: index.context.release_id,
                viewId,
                projectionId,
                documentRef: doc.documentRef,
                unitType: unit.unitType,
                unitId: unit.unitId,
                anchor: unit.anchor,
                fieldPath: passage.fieldPath,
                passageId: passage.passageId,
                matchRanges: ranges,
                documentOffset,
                snippet,
                snippetMatchRanges,
                navigation: buildNavigation(viewId, unit.anchor, passage.fieldPath, doc.documentRef),
                viewSort,
                projectionSort,
                matchRangeIndex: ri,
            });
        }
    }

    hits.sort(compareSortKey);

    const publicHits = hits.map((hit) => {
        const { viewSort, projectionSort, matchRangeIndex, ...rest } = hit;
        return rest;
    });

    return {
        hits: publicHits,
        diagnostics: uniqueDiagnostics(diagnostics),
    };
}

export const LocalSearchService = {
    INDEX_SCHEMA_VERSION,
    DIAGNOSTICS,
    buildSearchIndex,
    validateSearchCache,
    searchLocalIndex,
    normText,
    normQuery,
    tokenizeQuery,
};

export default LocalSearchService;
