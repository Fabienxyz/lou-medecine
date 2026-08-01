/**
 * Learner Snapshot — patrimonial export (Lot E-C, LP-05) and import (Lot E-D, LP-06).
 * Pure projection from local patrimony into a storage-independent logical artefact
 * (LEARNER-PATRIMONY-COMPONENT-CONTRACT.md §8–§9).
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
    const IMPORT_INVALID_PREFIX = "[LouLearnerSnapshot] Invalid import:";
    const IMPORTER_COMPONENT = "lou-learner-snapshot-import/1";

    const ACTIVE_DOMAIN_IDS = [
        "walkthrough_annotations",
        "walkthrough_notes",
        "svg_text_formats",
        "personal_diagrams",
    ];

    const DOMAIN_TO_STORE = {
        walkthrough_annotations: "text_annotations",
        walkthrough_notes: "walkthrough_notes",
        svg_text_formats: "svg_text_formats",
        personal_diagrams: "personal_diagrams",
    };

    function exportIncompleteError(detail) {
        return new Error(EXPORT_INCOMPLETE_PREFIX + " " + detail);
    }

    function importInvalidError(detail) {
        return new Error(IMPORT_INVALID_PREFIX + " " + detail);
    }

    function createEmptyImportResult() {
        return {
            success: false,
            inserted: [],
            updated: [],
            unchanged: [],
            conflicts: [],
            warnings: [],
            refused: [],
            rollback: null,
        };
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

    function deriveLogicalRecordId(domainId, releaseId, storageKey) {
        if (
            global.LouLearnerPatrimony &&
            typeof global.LouLearnerPatrimony.deriveLogicalRecordId === "function"
        ) {
            return global.LouLearnerPatrimony.deriveLogicalRecordId(
                domainId,
                releaseId,
                storageKey
            );
        }
        const release =
            typeof releaseId === "string" && releaseId ? releaseId : "unknown";
        return (
            domainId +
            "::" +
            release +
            "::" +
            String(Math.trunc(Number(storageKey) || 0)).padStart(10, "0")
        );
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
            record_id:
                row.logical_record_id ||
                deriveLogicalRecordId(domainId, row.release_id, row.id),
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
            record_id:
                row.logical_record_id ||
                deriveLogicalRecordId(domainId, row.release_id, row.id),
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
            record_id:
                row.logical_record_id ||
                deriveLogicalRecordId(domainId, row.release_id, row.id),
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
            record_id:
                row.logical_record_id ||
                deriveLogicalRecordId(domainId, row.release_id, row.id),
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

    async function snapshotRecordsEquivalent(localRow, snapshotRecord, domainId, store) {
        let inverseRow;
        if (domainId === "svg_text_formats") {
            inverseRow = inverseProjectSvgTextFormat(snapshotRecord, store);
        } else {
            inverseRow = INVERSE_PROJECTORS[domainId](snapshotRecord);
        }

        if (domainId === "personal_diagrams") {
            if (
                localRow.element !== inverseRow.element ||
                localRow.created !== inverseRow.created
            ) {
                return false;
            }
            if (!localRow.blob || !inverseRow.blob) {
                return false;
            }
            const localBase64 = await blobToBase64(localRow.blob);
            const inverseBase64 = await blobToBase64(inverseRow.blob);
            if (localBase64 == null || inverseBase64 == null) {
                return false;
            }
            return localBase64 === inverseBase64;
        }

        const keys =
            domainId === "walkthrough_annotations"
                ? [
                      "projection",
                      "element",
                      "selector",
                      "kind",
                      "created",
                      "updated",
                  ]
                : domainId === "walkthrough_notes"
                  ? [
                        "projection",
                        "element",
                        "anchor",
                        "text",
                        "created",
                        "updated",
                    ]
                  : [
                        "projection",
                        "element",
                        "assetPath",
                        "format",
                        "anchor",
                        "style",
                        "created",
                        "updated",
                    ];

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const left = localRow[key];
            const right = inverseRow[key];
            if (left === undefined && right === undefined) {
                continue;
            }
            if (stableStringify(left) !== stableStringify(right)) {
                return false;
            }
        }
        return true;
    }

    function base64ToBytes(base64) {
        if (typeof Buffer !== "undefined") {
            return Buffer.from(base64, "base64");
        }
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    function base64ToBlob(base64, mediaType) {
        const bytes = base64ToBytes(base64);
        const type =
            typeof mediaType === "string" && mediaType
                ? mediaType
                : "application/octet-stream";
        if (typeof Blob !== "undefined") {
            return new Blob([bytes], { type: type });
        }
        return { type: type, _bytes: bytes };
    }

    function validateSnapshotRecord(record, domainId, index) {
        const where = domainId + " record index " + index;
        if (!record || typeof record !== "object") {
            throw importInvalidError("invalid record at " + where);
        }
        if (typeof record.record_id !== "string" || !record.record_id) {
            throw importInvalidError("missing record_id at " + where);
        }
        if (record.domain !== domainId) {
            throw importInvalidError(
                "domain mismatch at " + where + " (expected " + domainId + ")"
            );
        }
        if (typeof record.release_id !== "string" || !record.release_id) {
            throw importInvalidError("missing release_id at " + where);
        }
        if (record.schema_version == null) {
            throw importInvalidError("missing schema_version at " + where);
        }
        if (typeof record.chapter !== "string" || !record.chapter) {
            throw importInvalidError("missing chapter at " + where);
        }
        if (!record.payload || typeof record.payload !== "object") {
            throw importInvalidError("missing payload at " + where);
        }
    }

    function inverseProjectWalkthroughAnnotation(record) {
        const payload = record.payload;
        return {
            logical_record_id: record.record_id,
            release_id: record.release_id,
            schema_version: record.schema_version,
            chapter: record.chapter,
            projection: payload.projection,
            element: payload.element,
            selector: payload.selector,
            kind: payload.kind || "highlight",
            created: payload.created,
            updated: payload.updated,
        };
    }

    function inverseProjectWalkthroughNote(record) {
        const payload = record.payload;
        if (!payload.text || !String(payload.text).trim()) {
            throw importInvalidError(
                "walkthrough note text must be non-empty for " + record.record_id
            );
        }
        return {
            logical_record_id: record.record_id,
            release_id: record.release_id,
            schema_version: record.schema_version,
            chapter: record.chapter,
            projection: payload.projection,
            element: payload.element,
            anchor: payload.anchor,
            text: payload.text,
            created: payload.created,
            updated: payload.updated,
        };
    }

    function inverseProjectSvgTextFormat(record, store) {
        const payload = record.payload;
        const row = {
            logical_record_id: record.record_id,
            release_id: record.release_id,
            schema_version: record.schema_version,
            chapter: record.chapter,
            projection: payload.projection,
            element: payload.element,
            assetPath: payload.assetPath,
            format: payload.format,
            anchor: payload.anchor,
            created: payload.created,
            updated: payload.updated,
        };
        if (payload.style !== undefined) {
            row.style = payload.style;
        }
        if (store && typeof store._validateSvgTextFormatRecord === "function") {
            store._validateSvgTextFormatRecord(Object.assign({}, row));
        }
        return row;
    }

    function inverseProjectPersonalDiagram(record) {
        const payload = record.payload;
        if (
            payload.binary_base64 == null ||
            typeof payload.binary_base64 !== "string" ||
            payload.binary_base64 === ""
        ) {
            throw importInvalidError(
                "personal diagram missing binary_base64 for " + record.record_id
            );
        }
        let bytes;
        try {
            bytes = base64ToBytes(payload.binary_base64);
        } catch (err) {
            throw importInvalidError(
                "personal diagram binary could not be decoded for " +
                    record.record_id
            );
        }
        if (!bytes || bytes.length === 0) {
            throw importInvalidError(
                "personal diagram binary is empty for " + record.record_id
            );
        }
        const blob = base64ToBlob(
            payload.binary_base64,
            payload.media_type || "application/octet-stream"
        );
        return {
            logical_record_id: record.record_id,
            release_id: record.release_id,
            schema_version: record.schema_version,
            chapter: record.chapter,
            element: payload.element,
            created: payload.created,
            blob: blob,
        };
    }

    const INVERSE_PROJECTORS = {
        walkthrough_annotations: inverseProjectWalkthroughAnnotation,
        walkthrough_notes: inverseProjectWalkthroughNote,
        svg_text_formats: inverseProjectSvgTextFormat,
        personal_diagrams: inverseProjectPersonalDiagram,
    };

    function validateSnapshotStructure(snapshot) {
        if (!snapshot || typeof snapshot !== "object") {
            throw importInvalidError("snapshot must be an object");
        }
        if (snapshot.snapshot_format_version !== SNAPSHOT_FORMAT_VERSION) {
            throw importInvalidError(
                "unsupported snapshot_format_version: " +
                    snapshot.snapshot_format_version
            );
        }
        if (!snapshot.integrity || typeof snapshot.integrity !== "object") {
            throw importInvalidError("missing integrity section");
        }
        if (snapshot.integrity.algorithm !== INTEGRITY_ALGORITHM) {
            throw importInvalidError(
                "unsupported integrity algorithm: " + snapshot.integrity.algorithm
            );
        }
        if (
            typeof snapshot.integrity.digest !== "string" ||
            !/^[a-f0-9]{64}$/.test(snapshot.integrity.digest)
        ) {
            throw importInvalidError("missing or invalid integrity digest");
        }
        if (!snapshot.body || !Array.isArray(snapshot.body.domains)) {
            throw importInvalidError("missing body.domains");
        }
        const seenRecordIds = {};
        for (let d = 0; d < snapshot.body.domains.length; d++) {
            const domain = snapshot.body.domains[d];
            if (!domain || typeof domain.domain_id !== "string") {
                throw importInvalidError("invalid domain entry at index " + d);
            }
            if (domain.domain_schema_version !== DOMAIN_SCHEMA_VERSION) {
                throw importInvalidError(
                    "unsupported domain_schema_version for " + domain.domain_id
                );
            }
            if (!Array.isArray(domain.records)) {
                throw importInvalidError("domain records must be an array");
            }
            if (
                FUTURE_DOMAIN_IDS.indexOf(domain.domain_id) >= 0 &&
                domain.records.length > 0
            ) {
                throw importInvalidError(
                    "future domain not importable in V1: " + domain.domain_id
                );
            }
            for (let r = 0; r < domain.records.length; r++) {
                validateSnapshotRecord(domain.records[r], domain.domain_id, r);
                const recordId = domain.records[r].record_id;
                if (seenRecordIds[recordId]) {
                    throw importInvalidError(
                        "duplicate record_id in snapshot: " + recordId
                    );
                }
                seenRecordIds[recordId] = true;
            }
        }
    }

    async function verifySnapshotIntegrity(snapshot) {
        const canonicalBody = canonicalizeBody(snapshot.body);
        const digest = await computeBodyDigest(canonicalBody);
        if (digest !== snapshot.integrity.digest) {
            throw importInvalidError("integrity digest mismatch");
        }
        return canonicalBody;
    }

    function indexExistingRecords(storeGroups) {
        const byLogicalId = {};
        for (let g = 0; g < storeGroups.length; g++) {
            const group = storeGroups[g];
            const rows = group.records || [];
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                if (row && row.logical_record_id) {
                    byLogicalId[row.logical_record_id] = {
                        storeName: group.storeName,
                        row: row,
                        index: i,
                    };
                }
            }
        }
        return byLogicalId;
    }

    function collectOptionalCatalogWarnings(snapshot, options) {
        const warnings = [];
        if (
            !options ||
            !options.catalogReleaseIds ||
            !Array.isArray(options.catalogReleaseIds)
        ) {
            return warnings;
        }
        const installed = {};
        for (let i = 0; i < options.catalogReleaseIds.length; i++) {
            installed[options.catalogReleaseIds[i]] = true;
        }
        const canonicalBody = canonicalizeBody(snapshot.body);
        const missing = [];
        for (let d = 0; d < canonicalBody.domains.length; d++) {
            const domain = canonicalBody.domains[d];
            for (let r = 0; r < domain.records.length; r++) {
                const record = domain.records[r];
                if (
                    record.release_id &&
                    !global.LouLearnerPatrimony.isLegacyReleaseId(
                        record.release_id
                    ) &&
                    !installed[record.release_id]
                ) {
                    if (missing.indexOf(record.release_id) < 0) {
                        missing.push(record.release_id);
                    }
                }
            }
        }
        for (let m = 0; m < missing.length; m++) {
            warnings.push({
                code: "release_not_in_catalog",
                release_id: missing[m],
                message:
                    "Imported record references release not present in optional catalog diagnostics",
            });
        }
        return warnings;
    }

    async function buildImportPlan(snapshot, storeGroups, store) {
        const plan = [];
        const conflicts = [];
        const existingByLogicalId = indexExistingRecords(storeGroups);
        const canonicalBody = canonicalizeBody(snapshot.body);

        for (let d = 0; d < ACTIVE_DOMAIN_IDS.length; d++) {
            const domainId = ACTIVE_DOMAIN_IDS[d];
            const storeName = DOMAIN_TO_STORE[domainId];
            const domain = canonicalBody.domains.find(function (entry) {
                return entry.domain_id === domainId;
            });
            const records = domain ? domain.records : [];
            const projector = INVERSE_PROJECTORS[domainId];

            for (let r = 0; r < records.length; r++) {
                const snapshotRecord = records[r];
                let row;
                if (domainId === "svg_text_formats") {
                    row = projector(snapshotRecord, store);
                } else {
                    row = projector(snapshotRecord);
                }

                const existing = existingByLogicalId[snapshotRecord.record_id];
                if (!existing) {
                    plan.push({
                        storeName: storeName,
                        domainId: domainId,
                        logicalRecordId: snapshotRecord.record_id,
                        action: "insert",
                        row: row,
                        snapshotRecord: snapshotRecord,
                    });
                    continue;
                }

                const equivalent = await snapshotRecordsEquivalent(
                    existing.row,
                    snapshotRecord,
                    domainId,
                    store
                );
                if (equivalent) {
                    plan.push({
                        storeName: storeName,
                        domainId: domainId,
                        logicalRecordId: snapshotRecord.record_id,
                        action: "unchanged",
                        row: row,
                        snapshotRecord: snapshotRecord,
                    });
                    continue;
                }

                plan.push({
                    storeName: storeName,
                    domainId: domainId,
                    logicalRecordId: snapshotRecord.record_id,
                    action: "update",
                    row: row,
                    snapshotRecord: snapshotRecord,
                });
                conflicts.push({
                    record_id: snapshotRecord.record_id,
                    domain: domainId,
                    resolution: "snapshot_wins",
                    local_store: existing.storeName,
                    local_id: existing.row.id,
                });
            }
        }

        return { plan: plan, conflicts: conflicts };
    }

    /**
     * @param {object} snapshot
     * @param {{
     *   store?: object,
     *   catalogReleaseIds?: string[],
     *   _injectApplyError?: Error
     * }} [options]
     */
    async function importSnapshot(snapshot, options) {
        options = options || {};
        const result = createEmptyImportResult();
        const store = options.store || global.LouLearnerStore;

        if (
            !store ||
            typeof store.listAllPatrimonialRecords !== "function" ||
            typeof store.applyPatrimonialImportPlan !== "function"
        ) {
            result.refused.push({
                reason: "Patrimony store with import support is required",
            });
            result.rollback = { reason: "store_unavailable" };
            return result;
        }

        try {
            validateSnapshotStructure(snapshot);
            await verifySnapshotIntegrity(snapshot);
            await store.open();
            const storeGroups = await store.listAllPatrimonialRecords();
            const built = await buildImportPlan(snapshot, storeGroups, store);
            result.warnings = collectOptionalCatalogWarnings(snapshot, options);

            if (options._injectApplyError) {
                throw options._injectApplyError;
            }

            const applyOutcome = await store.applyPatrimonialImportPlan(
                built.plan
            );

            result.inserted = applyOutcome.inserted.map(function (entry) {
                return {
                    record_id: entry.logical_record_id,
                    store: entry.storeName,
                    id: entry.id,
                };
            });
            result.updated = applyOutcome.updated.map(function (entry) {
                return {
                    record_id: entry.logical_record_id,
                    store: entry.storeName,
                    id: entry.id,
                };
            });
            result.unchanged = applyOutcome.unchanged.map(function (entry) {
                return {
                    record_id: entry.logical_record_id,
                    store: entry.storeName,
                    id: entry.id,
                };
            });
            result.conflicts = built.conflicts;
            result.success = true;
            return result;
        } catch (err) {
            result.success = false;
            result.refused.push({
                reason: String(err && err.message ? err.message : err),
            });
            result.rollback = {
                reason: "full_rollback",
                detail: String(err && err.message ? err.message : err),
            };
            return result;
        }
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
        IMPORTER_COMPONENT,
        EXPORT_INCOMPLETE_PREFIX,
        IMPORT_INVALID_PREFIX,
        ALL_DOMAIN_IDS,
        ACTIVE_DOMAIN_IDS,
        FUTURE_DOMAIN_IDS,
        STORE_TO_DOMAIN,
        DOMAIN_TO_STORE,
        assertExportablePatrimonyRow,
        deriveLogicalRecordId,
        resolveOrphanStatus,
        buildBodyFromStoreGroups,
        canonicalizeBody,
        stableStringify,
        computeBodyDigest,
        buildSummary,
        createEmptyImportResult,
        validateSnapshotStructure,
        verifySnapshotIntegrity,
        buildImportPlan,
        importSnapshot,
        exportSnapshot,
    };
})(typeof window !== "undefined" ? window : globalThis);
