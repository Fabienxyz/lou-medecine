/**
 * Browser Display Preferences Runtime factory (D7-E).
 * Wires LouLearnerStore storage adapter to D7-D Runtime — no Reader UI.
 */
import { createDisplayPreferencesRuntime } from "../display-preferences-runtime.js";

/**
 * @param {{
 *   store?: {
 *     listDisplayPreferencesRecords: () => Promise<object[]>,
 *     upsertDisplayPreferencesRecord: (row: object) => Promise<object>,
 *     deleteDisplayPreferencesRecords: () => Promise<void>,
 *     deleteDisplayPreferencesExcept: (keepLogicalRecordId: string) => Promise<number>,
 *   },
 *   applyDisplayPreferences: (preferences: object) => void,
 *   nowIso?: () => string,
 * }} options
 */
export function createBrowserDisplayPreferencesRuntime(options) {
    const store = options.store || globalThis.LouLearnerStore;
    if (!store) {
        throw new Error("browser display preferences runtime: LouLearnerStore is required");
    }
    if (typeof options.applyDisplayPreferences !== "function") {
        throw new Error(
            "browser display preferences runtime: applyDisplayPreferences callback is required"
        );
    }

    const storage = {
        listDisplayPreferencesRecords: function () {
            return store.listDisplayPreferencesRecords();
        },
        upsertDisplayPreferencesRecord: function (row) {
            return store.upsertDisplayPreferencesRecord(row);
        },
        deleteDisplayPreferencesRecords: function () {
            return store.deleteDisplayPreferencesRecords();
        },
        deleteDisplayPreferencesExcept: function (keepLogicalRecordId) {
            return store.deleteDisplayPreferencesExcept(keepLogicalRecordId);
        },
    };

    return createDisplayPreferencesRuntime({
        storage: storage,
        applyDisplayPreferences: options.applyDisplayPreferences,
        nowIso: options.nowIso,
    });
}

export default createBrowserDisplayPreferencesRuntime;
