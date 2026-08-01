/**
 * Lot D6-C — Local Search normalization (index_schema_version = 1).
 * Pure functions — no I/O, no DOM.
 */

export const INDEX_SCHEMA_VERSION = 1;

const RECORD_SEPARATOR = "\u001e";
const UNIT_SEPARATOR = "\u001f";
const ELLIPSIS = "\u2026";

export const SNIPPET_MAX_LEN = 160;
export const SNIPPET_CONTEXT_BEFORE = 60;
export const SNIPPET_CONTEXT_AFTER = 60;
export const SNIPPET_WORD_BOUNDARY_SCAN = 50;

export const DIAGNOSTICS = Object.freeze({
    CACHE_VALID: "LS-CACHE-VALID",
    CACHE_STALE: "LS-CACHE-STALE",
    CACHE_MISSING: "LS-CACHE-MISSING",
    SCHEMA_INCOMPATIBLE: "LS-SCHEMA-INCOMPATIBLE",
    DOC_MISSING: "LS-DOC-MISSING",
    DOC_INVALID: "LS-DOC-INVALID",
    ANCHOR_INVALID: "LS-ANCHOR-INVALID",
    VIEW_SKIPPED: "LS-VIEW-SKIPPED",
    ARTIFACT_SKIPPED: "LS-ARTIFACT-SKIPPED",
    BUILD_PARTIAL: "LS-BUILD-PARTIAL",
    QUERY_TOO_SHORT: "LS-QUERY-TOO-SHORT",
    SCOPE_REFUSED: "LS-SCOPE-REFUSED",
});

export const REGISTRY_PROJECTION_SORT = 9998;
export const NO_PROJECTION_SORT = 9999;

/**
 * NFC + line endings + tabs + trailing line spaces (N2–N5). No lowercase.
 */
export function normTextPreserveCase(text) {
    if (typeof text !== "string") {
        return "";
    }
    let s = text.normalize("NFC");
    s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    s = s.replace(/\t/g, " ");
    s = s.replace(/[ \t]+$/gm, "");
    s = s.replace(/\n{3,}/g, "\n\n");
    return s.trim();
}

/**
 * Full normText pipeline (N1–N8) for searchable corpus text.
 */
export function normText(text) {
    let s = normTextPreserveCase(text);
    s = foldAsciiCase(s);
    return s.trim();
}

/**
 * Query normalization (Q1–Q6).
 */
export function normQuery(query) {
    if (typeof query !== "string") {
        return "";
    }
    let s = query.normalize("NFC");
    s = s.replace(/\r\n/g, " ").replace(/\r/g, " ").replace(/\n/g, " ");
    s = s.replace(/\t/g, " ");
    s = foldAsciiCase(s);
    s = s.replace(/ +/g, " ");
    return s.trim();
}

/**
 * Tokenize normalized query (§3.7).
 */
export function tokenizeQuery(normalizedQuery) {
    if (!normalizedQuery) {
        return [];
    }
    return normalizedQuery
        .split(" ")
        .filter((token) => token.length >= 2);
}

export function foldAsciiCase(text) {
    return text.replace(/[A-Z]/g, (ch) =>
        String.fromCharCode(ch.charCodeAt(0) + 32)
    );
}

export function utf8LexCompare(a, b) {
    const encoder = new TextEncoder();
    const ba = encoder.encode(String(a));
    const bb = encoder.encode(String(b));
    const len = Math.min(ba.length, bb.length);
    for (let i = 0; i < len; i += 1) {
        if (ba[i] !== bb[i]) {
            return ba[i] - bb[i];
        }
    }
    return ba.length - bb.length;
}

export function makePassageId(documentRef, unitId, fieldPath, sourceOrdinal) {
    return `${documentRef}#/${unitId}#/${fieldPath}#/${sourceOrdinal}`;
}

export {
    RECORD_SEPARATOR,
    UNIT_SEPARATOR,
    ELLIPSIS,
};
