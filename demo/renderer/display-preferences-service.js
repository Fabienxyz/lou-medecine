/**
 * Lot D7-C — Display Preferences Service (pure, stateless).
 * No I/O, DOM, IndexedDB, Reader, Runtime, Session, Local Search, or system clock.
 * Authority: DISPLAY-PREFERENCES-COMPONENT-CONTRACT.md (D7-A) + D7-B spec.
 */

export const SCHEMA_VERSION = 1;
export const SUPPORTED_SCHEMA_VERSION = 1;
export const RECORD_ID = "display-preferences-v1";

export const THEME_VALUES = Object.freeze(["light", "dark"]);
export const FONT_SIZE_VALUES = Object.freeze(["small", "medium", "large"]);
export const READING_WIDTH_VALUES = Object.freeze(["narrow", "standard", "wide"]);

export const DIAGNOSTICS = Object.freeze({
    DP_MISSING: "DP-MISSING",
    DP_PERSISTED: "DP-PERSISTED",
    DP_NORMALIZED: "DP-NORMALIZED",
    DP_INVALID_VALUE: "DP-INVALID-VALUE",
    DP_UNKNOWN_FIELD: "DP-UNKNOWN-FIELD",
    DP_SCHEMA_STALE: "DP-SCHEMA-STALE",
    DP_MIGRATED: "DP-MIGRATED",
    DP_SAVED: "DP-SAVED",
    DP_DELETED: "DP-DELETED",
    DP_APPLIED: "DP-APPLIED",
    DP_DUPLICATE_RESOLVED: "DP-DUPLICATE-RESOLVED",
    DP_IMPORT_APPLIED: "DP-IMPORT-APPLIED",
});

const DEFAULTS = Object.freeze({
    schema_version: SCHEMA_VERSION,
    theme: "light",
    fontSize: "medium",
    readingWidth: "standard",
});

const ENUM_FIELDS = Object.freeze([
    { field: "theme", values: THEME_VALUES, defaultValue: DEFAULTS.theme },
    { field: "fontSize", values: FONT_SIZE_VALUES, defaultValue: DEFAULTS.fontSize },
    {
        field: "readingWidth",
        values: READING_WIDTH_VALUES,
        defaultValue: DEFAULTS.readingWidth,
    },
]);

const PATCHABLE_FIELDS = new Set(["theme", "fontSize", "readingWidth"]);

function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function freezePreferences(preferences) {
    return Object.freeze({
        schema_version: preferences.schema_version,
        theme: preferences.theme,
        fontSize: preferences.fontSize,
        readingWidth: preferences.readingWidth,
    });
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

function hasOwnField(raw, field) {
    return isPlainObject(raw) && Object.prototype.hasOwnProperty.call(raw, field);
}

function normalizeSchemaVersion(raw, diagnostics) {
    if (!hasOwnField(raw, "schema_version")) {
        diagnostics.push({
            code: DIAGNOSTICS.DP_NORMALIZED,
            field: "schema_version",
            applied: DEFAULTS.schema_version,
        });
        return DEFAULTS.schema_version;
    }

    const received = raw.schema_version;
    if (received === SUPPORTED_SCHEMA_VERSION) {
        return SUPPORTED_SCHEMA_VERSION;
    }

    if (
        typeof received === "number" &&
        Number.isInteger(received) &&
        received > SUPPORTED_SCHEMA_VERSION
    ) {
        diagnostics.push({
            code: DIAGNOSTICS.DP_SCHEMA_STALE,
            field: "schema_version",
            received,
            applied: DEFAULTS.schema_version,
        });
        return DEFAULTS.schema_version;
    }

    diagnostics.push({
        code: DIAGNOSTICS.DP_INVALID_VALUE,
        field: "schema_version",
        received,
        applied: DEFAULTS.schema_version,
    });
    return DEFAULTS.schema_version;
}

function normalizeEnumField(raw, field, allowed, defaultValue, diagnostics) {
    if (!hasOwnField(raw, field)) {
        diagnostics.push({
            code: DIAGNOSTICS.DP_NORMALIZED,
            field,
            applied: defaultValue,
        });
        return defaultValue;
    }

    const received = raw[field];
    if (allowed.indexOf(received) >= 0) {
        return received;
    }

    diagnostics.push({
        code: DIAGNOSTICS.DP_INVALID_VALUE,
        field,
        received,
        applied: defaultValue,
    });
    return defaultValue;
}

function validateEnumValue(value, field, allowed, defaultValue, diagnostics) {
    if (allowed.indexOf(value) >= 0) {
        return value;
    }

    diagnostics.push({
        code: DIAGNOSTICS.DP_INVALID_VALUE,
        field,
        received: value,
        applied: defaultValue,
    });
    return defaultValue;
}

function buildDefaults() {
    return freezePreferences({ ...DEFAULTS });
}

function normalize(raw) {
    const diagnostics = [];
    const schema_version = normalizeSchemaVersion(raw, diagnostics);

    const preferences = {
        schema_version,
        theme: normalizeEnumField(raw, "theme", THEME_VALUES, DEFAULTS.theme, diagnostics),
        fontSize: normalizeEnumField(
            raw,
            "fontSize",
            FONT_SIZE_VALUES,
            DEFAULTS.fontSize,
            diagnostics
        ),
        readingWidth: normalizeEnumField(
            raw,
            "readingWidth",
            READING_WIDTH_VALUES,
            DEFAULTS.readingWidth,
            diagnostics
        ),
    };

    return {
        preferences: freezePreferences(preferences),
        diagnostics: sortDiagnostics(diagnostics),
    };
}

function mergeAndNormalize(current, patch) {
    const diagnostics = [];
    const patchObj = isPlainObject(patch) ? patch : {};
    const base = isPlainObject(current) ? current : buildDefaults();

    const merged = {
        schema_version: base.schema_version,
        theme: base.theme,
        fontSize: base.fontSize,
        readingWidth: base.readingWidth,
    };

    for (const key of Object.keys(patchObj)) {
        if (PATCHABLE_FIELDS.has(key)) {
            merged[key] = patchObj[key];
        } else {
            diagnostics.push({
                code: DIAGNOSTICS.DP_UNKNOWN_FIELD,
                field: key,
                received: patchObj[key],
            });
        }
    }

    for (const spec of ENUM_FIELDS) {
        merged[spec.field] = validateEnumValue(
            merged[spec.field],
            spec.field,
            spec.values,
            spec.defaultValue,
            diagnostics
        );
    }

    merged.schema_version = SUPPORTED_SCHEMA_VERSION;

    return {
        preferences: freezePreferences(merged),
        diagnostics: sortDiagnostics(diagnostics),
    };
}

function migrateToCurrent(raw) {
    return normalize(raw);
}

function equals(a, b) {
    if (!isPlainObject(a) || !isPlainObject(b)) {
        return false;
    }
    return (
        a.schema_version === b.schema_version &&
        a.theme === b.theme &&
        a.fontSize === b.fontSize &&
        a.readingWidth === b.readingWidth
    );
}

export {
    buildDefaults,
    normalize,
    mergeAndNormalize,
    migrateToCurrent,
    equals,
};

export const DisplayPreferencesService = {
    SCHEMA_VERSION,
    SUPPORTED_SCHEMA_VERSION,
    RECORD_ID,
    THEME_VALUES,
    FONT_SIZE_VALUES,
    READING_WIDTH_VALUES,
    DIAGNOSTICS,
    buildDefaults,
    normalize,
    mergeAndNormalize,
    migrateToCurrent,
    equals,
};

export default DisplayPreferencesService;
