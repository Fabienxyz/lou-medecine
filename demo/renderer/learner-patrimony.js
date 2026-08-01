/**
 * Learner Patrimony — release-scoped identity helpers (Lot E-B).
 * Pure logic: no storage engine assumptions (LEARNER-PATRIMONY-COMPONENT-CONTRACT §6).
 *
 * Release identity is never invented here. Catalog/manifest/Package Access must supply
 * release_id via releaseContext. Without that context, records use the dev/legacy namespace
 * (__legacy__*) and stay outside the active patrimonial domain (§2.3, §11.2).
 */
(function (global) {
    const PATRIMONY_RECORD_SCHEMA_VERSION = 1;
    const LEGACY_RELEASE_PREFIX = "__legacy__";

    function deriveLegacyReleaseId(chapter) {
        if (!chapter || typeof chapter !== "string") {
            return LEGACY_RELEASE_PREFIX + "unknown";
        }
        return LEGACY_RELEASE_PREFIX + chapter.replace(/\//g, "__");
    }

    function isLegacyReleaseId(releaseId) {
        return (
            typeof releaseId === "string" &&
            releaseId.indexOf(LEGACY_RELEASE_PREFIX) === 0
        );
    }

    /**
     * @param {string} chapter
     * @param {{ releaseContext?: { releaseId: string, chapter: string } | null }} [options]
     */
    function hasReleaseContextForChapter(chapter, options) {
        options = options || {};
        const releaseContext = options.releaseContext;
        return (
            !!releaseContext &&
            releaseContext.chapter === chapter &&
            typeof releaseContext.releaseId === "string" &&
            releaseContext.releaseId.length > 0 &&
            !isLegacyReleaseId(releaseContext.releaseId)
        );
    }

    /**
     * Resolve the release_id stored on a record (write or migration).
     * @param {string} chapter
     * @param {{ releaseContext?: { releaseId: string, chapter: string } | null, requireCatalogRelease?: boolean }} [options]
     */
    function resolveReleaseIdForChapter(chapter, options) {
        options = options || {};
        if (hasReleaseContextForChapter(chapter, options)) {
            return options.releaseContext.releaseId;
        }
        if (options.requireCatalogRelease) {
            throw new Error(
                "Patrimonial write requires catalog release context for chapter"
            );
        }
        return deriveLegacyReleaseId(chapter);
    }

    /**
     * Active patrimonial domain for reads — catalog release when context matches, else legacy namespace.
     * @param {string} chapter
     * @param {{ releaseContext?: { releaseId: string, chapter: string } | null }} [options]
     */
    function resolveActiveReleaseId(chapter, options) {
        options = options || {};
        if (hasReleaseContextForChapter(chapter, options)) {
            return options.releaseContext.releaseId;
        }
        return deriveLegacyReleaseId(chapter);
    }

    /**
     * @param {string} chapter
     * @param {Record<string, unknown>} record
     * @param {{ releaseContext?: { releaseId: string, chapter: string } | null, requireCatalogRelease?: boolean }} [options]
     */
    function stampPatrimonyRecord(chapter, record, options) {
        record.release_id = resolveReleaseIdForChapter(chapter, options);
        record.chapter = chapter;
        record.schema_version = PATRIMONY_RECORD_SCHEMA_VERSION;
        return record;
    }

    /**
     * @param {Record<string, unknown>} row
     * @param {string} chapter
     * @param {{ releaseContext?: { releaseId: string, chapter: string } | null }} [options]
     */
    function matchesPatrimonyScope(row, chapter, options) {
        if (!row || typeof row !== "object") {
            return false;
        }
        if (typeof row.release_id !== "string" || !row.release_id) {
            return false;
        }
        return row.release_id === resolveActiveReleaseId(chapter, options);
    }

    function needsPatrimonyMigration(row) {
        return (
            !row ||
            typeof row !== "object" ||
            !row.release_id ||
            row.schema_version == null
        );
    }

    /**
     * @param {Record<string, unknown>} row
     * @param {{ releaseContext?: { releaseId: string, chapter: string } | null }} [options]
     */
    function migratePatrimonyRow(row, options) {
        if (!row || typeof row !== "object") {
            return row;
        }
        if (!needsPatrimonyMigration(row)) {
            return row;
        }
        const chapter =
            typeof row.chapter === "string" && row.chapter.length > 0
                ? row.chapter
                : "unknown";
        return stampPatrimonyRecord(chapter, row, options);
    }

    /**
     * Preserve patrimonial identity fields on update (LP-01 / E4).
     * @param {Record<string, unknown>} existing
     * @param {Record<string, unknown>} merged
     */
    function preservePatrimonyIdentity(existing, merged) {
        merged.release_id = existing.release_id;
        merged.chapter = existing.chapter;
        merged.schema_version = existing.schema_version;
        if (existing.logical_record_id) {
            merged.logical_record_id = existing.logical_record_id;
        }
        return merged;
    }

    function padStorageKey(value) {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
            return "0000000000";
        }
        return String(Math.trunc(n)).padStart(10, "0");
    }

    /**
     * Logical record identity — stable within an installation (LP-10).
     * @param {string} domainId
     * @param {string} releaseId
     * @param {number|string} storageKey
     */
    function deriveLogicalRecordId(domainId, releaseId, storageKey) {
        const release =
            typeof releaseId === "string" && releaseId ? releaseId : "unknown";
        return domainId + "::" + release + "::" + padStorageKey(storageKey);
    }

    const STORE_TO_DOMAIN = {
        text_annotations: "walkthrough_annotations",
        walkthrough_notes: "walkthrough_notes",
        svg_text_formats: "svg_text_formats",
        personal_diagrams: "personal_diagrams",
        session_resume: "session_resume",
        display_preferences: "display_preferences",
    };

    global.LouLearnerPatrimony = {
        PATRIMONY_RECORD_SCHEMA_VERSION,
        LEGACY_RELEASE_PREFIX,
        deriveLegacyReleaseId,
        isLegacyReleaseId,
        hasReleaseContextForChapter,
        resolveReleaseIdForChapter,
        resolveActiveReleaseId,
        stampPatrimonyRecord,
        matchesPatrimonyScope,
        needsPatrimonyMigration,
        migratePatrimonyRow,
        preservePatrimonyIdentity,
        padStorageKey,
        deriveLogicalRecordId,
        STORE_TO_DOMAIN,
    };
})(typeof window !== "undefined" ? window : globalThis);
