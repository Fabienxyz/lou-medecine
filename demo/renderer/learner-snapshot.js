/**
 * Learner Snapshot — patrimonial export (Lot E-C, LP-05).
 * Pure projection from local patrimony into a storage-independent logical artefact
 * (LEARNER-PATRIMONY-COMPONENT-CONTRACT.md §8).
 *
 * Export only — no import, no bundle, no catalog/offline coupling in the body.
 */
(function (global) {
    const SNAPSHOT_FORMAT_VERSION = 1;
    const DOMAIN_SCHEMA_VERSION = 1;
    const INTEGRITY_ALGORITHM = "sha256-canonical-v1";
    const EXPORTER_COMPONENT = "lou-learner-snapshot/1";

    const STORE_TO_DOMAIN = {
        text_annotations: "walkthrough_annotations",
        walkthrough_notes: "walkthrough_notes",
        svg_text_formats: "svg_text_formats",
        personal_diagrams: "personal_diagrams",
    };

    /** Fixed §4 domain order — canonicalization invariant. */
    const ALL_DOMAIN_IDS = [
        "walkthrough_annotations",
        "walkthrough_notes",
        "svg_text_formats",
        "personal_diagrams",
        "assessment_history",
        "scenario_progress",
        "concept_mastery",
        "session_resume",
        "display_preferences",
    ];

    const FUTURE_DOMAIN_IDS = [
        "assessment_history",
        "scenario_progress",
        "concept_mastery",
        "session_resume",
        "display_preferences",
    ];

    const EXPORT_INCOMPLETE_PREFIX = "[LouLearnerSnapshot] Incomplete export:";

    function exportIncompleteError(detail) {
        return new Error(EXPORT_INCOMPLETE_PREFIX + " " + detail);
    }

    function describeStoreRecord(storeName, index) {
        const domainId = STORE_TO_DOMAIN[storeName] || storeName;
        return (
            domainId +
            " (store " +
            storeName +
            ", record index " +
            index +
            ")"
        );
    }

    function assertExportablePatrimonyRow(row, storeName, index) {
        const where = describeStoreRecord(storeName, index);
        if (!row || typeof row !== "object") {
            throw exportIncompleteError("invalid patrimonial record at " + where);
        }
        if (typeof row.release_id !== "string" || !row.release_id) {
            throw exportIncompleteError("missing release_id at " + where);
        }
        if (row.schema_version == null) {
            throw exportIncompleteError("missing schema_version at " + where);
        }
    }

    function padStorageKey(value) {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0) {
            return "0000000000";
        }
        return String(Math.trunc(n)).padStart(10, "0");
    }

    /**
     * Logical record identity — stable within an installation, independent of IndexedDB
     * as an identity model (A2). The storage sequence is mapped only at projection time.
     */
    function deriveLogicalRecordId(domainId, releaseId, storageKey) {
        const release = typeof releaseId === "string" && releaseId ? releaseId : "unknown";
        return domainId + "::" + release + "::" + padStorageKey(storageKey);
    }

    function resolveOrphanStatus(releaseId) {
        if (
            global.LouLearnerPatrimony &&
            typeof global.LouLearnerPatrimony.isLegacyReleaseId === "function" &&
            global.LouLearnerPatrimony.isLegacyReleaseId(releaseId)
        ) {
            return "legacy_unresolved";
        }
        return "none";
    }

    function pickFields(source, keys) {
        const out = {};
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            if (source[key] !== undefined) {
                out[key] = source[key];
            }
        }
        return out;
    }

    function bufferToBase64(buffer) {
        if (typeof Buffer !== "undefined") {
            return Buffer.from(buffer).toString("base64");
        }
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    async function blobToBase64(value) {
        if (value == null) {
            return null;
        }
        if (typeof value === "string") {
            return bufferToBase64(new TextEncoder().encode(value));
        }
        if (value instanceof ArrayBuffer) {
            return bufferToBase64(value);
        }
        if (ArrayBuffer.isView(value)) {
            return bufferToBase64(
                value.buffer.slice(
                    value.byteOffset,
                    value.byteOffset + value.byteLength
                )
            );
        }
        if (typeof value.arrayBuffer === "function") {
            try {
                return bufferToBase64(await value.arrayBuffer());
            } catch (err) {
                return null;
            }
        }
        return null;
    }

    function projectWalkthroughAnnotation(row, domainId) {
        return {
            record_id: deriveLogicalRecordId(domainId, row.release_id, row.id),
            release_id: row.release_id,
            schema_version: row.schema_version,
            domain: domainId,
            chapter: row.chapter,
            orphan_status: resolveOrphanStatus(row.release_id),
            payload: pickFields(row, [
                "projection",
                "element",
                "selector",
                "kind",
                "created",
                "updated",
            ]),
        };
    }

    function projectWalkthroughNote(row, domainId) {
        return {
            record_id: deriveLogicalRecordId(domainId, row.release_id, row.id),
            release_id: row.release_id,
            schema_version: row.schema_version,
            domain: domainId,
            chapter: row.chapter,
            orphan_status: resolveOrphanStatus(row.release_id),
            payload: pickFields(row, [
                "projection",
                "element",
                "anchor",
                "text",
                "created",
                "updated",
            ]),
        };
    }

    function projectSvgTextFormat(row, domainId) {
        const payload = pickFields(row, [
            "projection",
            "element",
            "assetPath",
            "format",
            "anchor",
            "created",
            "updated",
        ]);
        if (row.style !== undefined) {
            payload.style = row.style;
        }
        return {
            record_id: deriveLogicalRecordId(domainId, row.release_id, row.id),
            release_id: row.release_id,
            schema_version: row.schema_version,
            domain: domainId,
            chapter: row.chapter,
            orphan_status: resolveOrphanStatus(row.release_id),
            payload: payload,
        };
    }

    async function projectPersonalDiagram(row, domainId) {
        if (row.blob == null) {
            throw exportIncompleteError(
                "personal diagram missing blob at " +
                    domainId +
                    " record id " +
                    row.id
            );
        }
        const binaryBase64 = await blobToBase64(row.blob);
        if (binaryBase64 == null || binaryBase64 === "") {
            throw exportIncompleteError(
                "personal diagram binary could not be encoded at " +
                    domainId +
                    " record id " +
                    row.id
            );
        }
        return {
            record_id: deriveLogicalRecordId(domainId, row.release_id, row.id),
            release_id: row.release_id,
            schema_version: row.schema_version,
            domain: domainId,
            chapter: row.chapter,
            orphan_status: resolveOrphanStatus(row.release_id),
            payload: {
                element: row.element,
                created: row.created,
                media_type:
                    row.blob && row.blob.type
                        ? row.blob.type
                        : "application/octet-stream",
                binary_base64: binaryBase64,
            },
        };
    }

    const DOMAIN_PROJECTORS = {
        walkthrough_annotations: projectWalkthroughAnnotation,
        walkthrough_notes: projectWalkthroughNote,
        svg_text_formats: projectSvgTextFormat,
        personal_diagrams: projectPersonalDiagram,
    };

    function compareRecords(a, b) {
        const releaseCmp = String(a.release_id).localeCompare(String(b.release_id));
        if (releaseCmp !== 0) {
            return releaseCmp;
        }
        return String(a.record_id).localeCompare(String(b.record_id));
    }

    function sortRecords(records) {
        return records.slice().sort(compareRecords);
    }

    function emptyDomain(domainId) {
        return {
            domain_id: domainId,
            domain_schema_version: DOMAIN_SCHEMA_VERSION,
            records: [],
        };
    }

    /**
     * @param {{ storeName: string, records: Record<string, unknown>[] }[]} storeGroups
     */
    async function buildBodyFromStoreGroups(storeGroups) {
        const recordsByDomain = {};
        for (let d = 0; d < ALL_DOMAIN_IDS.length; d++) {
            recordsByDomain[ALL_DOMAIN_IDS[d]] = [];
        }

        let sourcePatrimonyCount = 0;

        for (let g = 0; g < storeGroups.length; g++) {
            const group = storeGroups[g];
            const domainId = STORE_TO_DOMAIN[group.storeName];
            if (!domainId) {
                continue;
            }
            const projector = DOMAIN_PROJECTORS[domainId];
            const rows = group.records || [];
            sourcePatrimonyCount += rows.length;
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                assertExportablePatrimonyRow(row, group.storeName, i);
                let projected;
                if (domainId === "personal_diagrams") {
                    projected = await projectPersonalDiagram(row, domainId);
                } else {
                    projected = projector(row, domainId);
                }
                recordsByDomain[domainId].push(projected);
            }
        }

        let exportedPatrimonyCount = 0;
        for (let d = 0; d < ALL_DOMAIN_IDS.length; d++) {
            exportedPatrimonyCount += recordsByDomain[ALL_DOMAIN_IDS[d]].length;
        }
        if (sourcePatrimonyCount !== exportedPatrimonyCount) {
            throw exportIncompleteError(
                "patrimonial record count mismatch: source " +
                    sourcePatrimonyCount +
                    ", exported " +
                    exportedPatrimonyCount
            );
        }

        const domains = [];
        for (let d = 0; d < ALL_DOMAIN_IDS.length; d++) {
            const domainId = ALL_DOMAIN_IDS[d];
            domains.push({
                domain_id: domainId,
                domain_schema_version: DOMAIN_SCHEMA_VERSION,
                records: sortRecords(recordsByDomain[domainId]),
            });
        }

        return { domains: domains };
    }

    function canonicalizeBody(body) {
        const sourceDomains = body && body.domains ? body.domains : [];
        const byId = {};
        for (let i = 0; i < sourceDomains.length; i++) {
            const domain = sourceDomains[i];
            if (domain && domain.domain_id) {
                byId[domain.domain_id] = domain;
            }
        }

        const domains = [];
        for (let d = 0; d < ALL_DOMAIN_IDS.length; d++) {
            const domainId = ALL_DOMAIN_IDS[d];
            const domain = byId[domainId] || emptyDomain(domainId);
            domains.push({
                domain_id: domainId,
                domain_schema_version: DOMAIN_SCHEMA_VERSION,
                records: sortRecords(domain.records || []),
            });
        }

        return { domains: domains };
    }

    function stableStringify(value) {
        if (value === null || typeof value !== "object") {
            return JSON.stringify(value);
        }
        if (Array.isArray(value)) {
            let out = "[";
            for (let i = 0; i < value.length; i++) {
                if (i > 0) {
                    out += ",";
                }
                out += stableStringify(value[i]);
            }
            return out + "]";
        }
        const keys = Object.keys(value).sort();
        let out = "{";
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const item = value[key];
            if (item === undefined) {
                continue;
            }
            if (out.length > 1) {
                out += ",";
            }
            out += JSON.stringify(key) + ":" + stableStringify(item);
        }
        return out + "}";
    }

    function sha256HexSyncFallback(text) {
        const injected =
            global.__LOU_NODE_CRYPTO__ ||
            (typeof globalThis !== "undefined" &&
                globalThis.__LOU_NODE_CRYPTO__);
        if (injected && typeof injected.createHash === "function") {
            return injected.createHash("sha256").update(text).digest("hex");
        }
        return null;
    }

    async function sha256Hex(text) {
        const syncDigest = sha256HexSyncFallback(text);
        if (syncDigest) {
            return syncDigest;
        }
        const data = new TextEncoder().encode(text);
        if (
            typeof globalThis.crypto !== "undefined" &&
            globalThis.crypto.subtle &&
            typeof globalThis.crypto.subtle.digest === "function"
        ) {
            const hash = await globalThis.crypto.subtle.digest("SHA-256", data);
            return Array.from(new Uint8Array(hash))
                .map(function (byte) {
                    return byte.toString(16).padStart(2, "0");
                })
                .join("");
        }
        throw new Error("SHA-256 unavailable for snapshot integrity");
    }

    async function computeBodyDigest(body) {
        const canonical = canonicalizeBody(body);
        const serialized = stableStringify(canonical);
        return sha256Hex(serialized);
    }

    function buildSummary(body) {
        const canonical = canonicalizeBody(body);
        const recordCountByDomain = {};
        const releaseIds = {};
        let total = 0;

        for (let d = 0; d < canonical.domains.length; d++) {
            const domain = canonical.domains[d];
            const count = domain.records.length;
            recordCountByDomain[domain.domain_id] = count;
            total += count;
            for (let r = 0; r < domain.records.length; r++) {
                const record = domain.records[r];
                if (record.release_id) {
                    releaseIds[record.release_id] = true;
                }
            }
        }

        return {
            record_count_total: total,
            record_count_by_domain: recordCountByDomain,
            release_ids_referenced: Object.keys(releaseIds).sort(),
        };
    }

    /**
     * @param {{
     *   store?: { listAllPatrimonialRecords: () => Promise<{ storeName: string, records: object[] }[]> },
     *   exportedAt?: string,
     *   diagnostics?: Record<string, unknown>
     * }} [options]
     */
    async function exportSnapshot(options) {
        options = options || {};
        const store = options.store || global.LouLearnerStore;
        if (!store || typeof store.listAllPatrimonialRecords !== "function") {
            throw new Error(
                "Patrimony store with listAllPatrimonialRecords is required"
            );
        }

        const storeGroups = await store.listAllPatrimonialRecords();
        const body = await buildBodyFromStoreGroups(storeGroups);
        const canonicalBody = canonicalizeBody(body);
        const digest = await computeBodyDigest(canonicalBody);

        const snapshot = {
            snapshot_format_version: SNAPSHOT_FORMAT_VERSION,
            export_metadata: {
                exported_at:
                    typeof options.exportedAt === "string"
                        ? options.exportedAt
                        : new Date().toISOString(),
                exporter_component: EXPORTER_COMPONENT,
            },
            integrity: {
                algorithm: INTEGRITY_ALGORITHM,
                digest: digest,
            },
            summary: buildSummary(canonicalBody),
            body: canonicalBody,
        };

        if (options.diagnostics && typeof options.diagnostics === "object") {
            snapshot.diagnostics = options.diagnostics;
        }

        return snapshot;
    }

    global.LouLearnerSnapshot = {
        SNAPSHOT_FORMAT_VERSION,
        DOMAIN_SCHEMA_VERSION,
        INTEGRITY_ALGORITHM,
        EXPORTER_COMPONENT,
        EXPORT_INCOMPLETE_PREFIX,
        ALL_DOMAIN_IDS,
        FUTURE_DOMAIN_IDS,
        STORE_TO_DOMAIN,
        assertExportablePatrimonyRow,
        deriveLogicalRecordId,
        resolveOrphanStatus,
        buildBodyFromStoreGroups,
        canonicalizeBody,
        stableStringify,
        computeBodyDigest,
        buildSummary,
        exportSnapshot,
    };
})(typeof window !== "undefined" ? window : globalThis);
