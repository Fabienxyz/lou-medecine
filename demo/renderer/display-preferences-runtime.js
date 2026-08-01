/**
 * Lot D7-D — Display Preferences Runtime (I/O orchestration).
 * Reads/writes patrimony ; delegates normalization to D7-C Service ; invokes Reader apply callback.
 * No DOM, CSS, Composition, Session, Local Search, or Release dependency.
 */

import {
    RECORD_ID,
    DIAGNOSTICS,
    buildDefaults,
    normalize,
    mergeAndNormalize,
    migrateToCurrent,
    equals,
} from "./display-preferences-service.js";

/**
 * @typedef {Object} DisplayPreferencesStorage
 * @property {() => Promise<object[]>} listDisplayPreferencesRecords
 * @property {(row: object) => Promise<object>} upsertDisplayPreferencesRecord
 * @property {() => Promise<void>} deleteDisplayPreferencesRecords
 * @property {(keepLogicalRecordId: string) => Promise<number>} deleteDisplayPreferencesExcept
 */

/**
 * @typedef {Object} DisplayPreferencesRuntimeOptions
 * @property {DisplayPreferencesStorage} storage
 * @property {(preferences: object) => void} applyDisplayPreferences
 * @property {() => string} [nowIso]
 */

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sortDiagnostics(diagnostics) {
    return diagnostics.slice().sort((a, b) => {
        const codeCmp = a.code.localeCompare(b.code);
        if (codeCmp !== 0) {
            return codeCmp;
        }
        const fieldA = a.field || "";
        const fieldB = b.field || "";
        return fieldA.localeCompare(fieldB);
    });
}

function mergeDiagnostics(...groups) {
    const combined = [];
    for (const group of groups) {
        if (group && group.length) {
            combined.push(...group);
        }
    }
    return sortDiagnostics(combined);
}

function compareRecordsForCanonical(a, b) {
    const aTime =
        typeof a.updated_at === "string" && a.updated_at ? a.updated_at : "";
    const bTime =
        typeof b.updated_at === "string" && b.updated_at ? b.updated_at : "";
    const timeCmp = bTime.localeCompare(aTime);
    if (timeCmp !== 0) {
        return timeCmp;
    }
    const aId = String(a.logical_record_id || a.record_id || "");
    const bId = String(b.logical_record_id || b.record_id || "");
    const idCmp = aId.localeCompare(bId);
    if (idCmp !== 0) {
        return idCmp;
    }
    return Number(a.id || 0) - Number(b.id || 0);
}

function selectCanonicalRecord(records) {
    const rows = (records || []).filter(Boolean);
    if (rows.length === 0) {
        return { record: null, resolved: false };
    }
    if (rows.length === 1) {
        return { record: rows[0], resolved: false };
    }
    const preferred = rows.find(function (row) {
        return row.logical_record_id === RECORD_ID || row.record_id === RECORD_ID;
    });
    if (preferred) {
        return { record: preferred, resolved: true };
    }
    const sorted = rows.slice().sort(compareRecordsForCanonical);
    return { record: sorted[0], resolved: true };
}

function preferencesToPersistedRow(preferences, nowIso) {
    return {
        record_id: RECORD_ID,
        logical_record_id: RECORD_ID,
        schema_version: preferences.schema_version,
        theme: preferences.theme,
        fontSize: preferences.fontSize,
        readingWidth: preferences.readingWidth,
        updated_at: nowIso(),
    };
}

function assertStorage(storage) {
    if (
        !storage ||
        typeof storage.listDisplayPreferencesRecords !== "function" ||
        typeof storage.upsertDisplayPreferencesRecord !== "function" ||
        typeof storage.deleteDisplayPreferencesRecords !== "function" ||
        typeof storage.deleteDisplayPreferencesExcept !== "function"
    ) {
        throw new Error(
            "display preferences runtime: storage adapter with list/upsert/delete is required"
        );
    }
}

/**
 * @param {DisplayPreferencesRuntimeOptions} options
 */
export function createDisplayPreferencesRuntime(options) {
    assertStorage(options.storage);
    const storage = options.storage;
    const applyDisplayPreferences = options.applyDisplayPreferences;
    if (typeof applyDisplayPreferences !== "function") {
        throw new Error("display preferences runtime: applyDisplayPreferences callback is required");
    }
    const nowIso = options.nowIso || (() => new Date().toISOString());

    /** @type {object | null} */
    let currentPreferences = null;
    /** @type {object[]} */
    let lastDiagnostics = [];
    /** @type {string} */
    let lastStatus = "idle";

    function applyEffective(preferences) {
        currentPreferences = preferences;
        applyDisplayPreferences(preferences);
    }

    async function resolveStoredRecords() {
        const records = await storage.listDisplayPreferencesRecords();
        const selection = selectCanonicalRecord(records);
        const runtimeDiagnostics = [];

        if (selection.resolved && selection.record) {
            runtimeDiagnostics.push({ code: DIAGNOSTICS.DP_DUPLICATE_RESOLVED });
            await storage.deleteDisplayPreferencesExcept(
                selection.record.logical_record_id || RECORD_ID
            );
        }

        return {
            record: selection.record,
            runtimeDiagnostics,
        };
    }

    async function loadAndApply(options) {
        const loadOptions = options || {};
        let runtimeDiagnostics = [];

        try {
            const resolved = await resolveStoredRecords();
            runtimeDiagnostics = resolved.runtimeDiagnostics;
            const rawRecord = resolved.record;

            if (!rawRecord) {
                const defaults = buildDefaults();
                applyEffective(defaults);
                lastDiagnostics = mergeDiagnostics(
                    [{ code: DIAGNOSTICS.DP_MISSING }],
                    runtimeDiagnostics
                );
                lastStatus = "loaded_defaults";
                return {
                    preferences: defaults,
                    diagnostics: lastDiagnostics.slice(),
                };
            }

            const normalized = normalize(rawRecord);
            applyEffective(normalized.preferences);
            lastDiagnostics = mergeDiagnostics(
                [{ code: DIAGNOSTICS.DP_PERSISTED }],
                normalized.diagnostics,
                runtimeDiagnostics,
                loadOptions.source === "import"
                    ? [{ code: DIAGNOSTICS.DP_IMPORT_APPLIED }]
                    : []
            );
            lastStatus = loadOptions.source === "import" ? "import_applied" : "loaded_persisted";
            return {
                preferences: normalized.preferences,
                diagnostics: lastDiagnostics.slice(),
            };
        } catch (err) {
            lastStatus = "error";
            throw err;
        }
    }

    async function applyPatch(patch) {
        const base = currentPreferences || buildDefaults();
        const merged = mergeAndNormalize(base, patch);
        const row = preferencesToPersistedRow(merged.preferences, nowIso);

        try {
            await storage.upsertDisplayPreferencesRecord(row);
            applyEffective(merged.preferences);
            lastDiagnostics = mergeDiagnostics(merged.diagnostics, [
                { code: DIAGNOSTICS.DP_SAVED },
            ]);
            lastStatus = "saved";
            return {
                preferences: merged.preferences,
                diagnostics: lastDiagnostics.slice(),
            };
        } catch (err) {
            lastStatus = "error";
            throw err;
        }
    }

    async function applyImportedRecord(record) {
        const migrated = migrateToCurrent(record);
        const row = preferencesToPersistedRow(migrated.preferences, nowIso);

        try {
            await storage.upsertDisplayPreferencesRecord(row);
            applyEffective(migrated.preferences);
            lastDiagnostics = mergeDiagnostics(migrated.diagnostics, [
                { code: DIAGNOSTICS.DP_IMPORT_APPLIED },
            ]);
            lastStatus = "import_applied";
            return {
                preferences: migrated.preferences,
                diagnostics: lastDiagnostics.slice(),
            };
        } catch (err) {
            lastStatus = "error";
            throw err;
        }
    }

    async function resetToDefaults() {
        try {
            await storage.deleteDisplayPreferencesRecords();
            const defaults = buildDefaults();
            applyEffective(defaults);
            lastDiagnostics = [{ code: DIAGNOSTICS.DP_DELETED }];
            lastStatus = "reset";
            return {
                preferences: defaults,
                diagnostics: lastDiagnostics.slice(),
            };
        } catch (err) {
            lastStatus = "error";
            throw err;
        }
    }

    function getCurrentPreferences() {
        return currentPreferences ? currentPreferences : buildDefaults();
    }

    function getStatus() {
        return {
            status: lastStatus,
            diagnostics: lastDiagnostics.slice(),
            preferences: getCurrentPreferences(),
        };
    }

    return {
        RECORD_ID,
        DIAGNOSTICS,
        loadAndApply,
        applyPatch,
        applyImportedRecord,
        resetToDefaults,
        getCurrentPreferences,
        getStatus,
        equals,
    };
}

export default createDisplayPreferencesRuntime;
