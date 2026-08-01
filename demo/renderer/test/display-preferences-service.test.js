/**
 * Lot D7-C — Display Preferences Service unit tests (D7-B reference suites).
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
    SCHEMA_VERSION,
    SUPPORTED_SCHEMA_VERSION,
    THEME_VALUES,
    FONT_SIZE_VALUES,
    READING_WIDTH_VALUES,
    DIAGNOSTICS,
    buildDefaults,
    normalize,
    mergeAndNormalize,
    migrateToCurrent,
    equals,
} from "../display-preferences-service.js";

const GOLDEN_DEFAULTS = Object.freeze({
    schema_version: 1,
    theme: "light",
    fontSize: "medium",
    readingWidth: "standard",
});

function assertPreferences(actual, expected) {
    assert.deepEqual(actual, expected);
}

function assertDiagnostics(actual, expected) {
    assert.deepEqual(actual, expected);
}

describe("T-DEFAULT", () => {
    test("T-DEFAULT-01 — buildDefaults golden V1", () => {
        assertPreferences(buildDefaults(), GOLDEN_DEFAULTS);
    });

    test("T-DEFAULT-02 — stability across calls", () => {
        const first = buildDefaults();
        const second = buildDefaults();
        assert.ok(equals(first, second));
        assert.notEqual(first, second);
    });
});

describe("T-NORMALIZE", () => {
    test("T-NORMALIZE-01 — empty object", () => {
        const result = normalize({});
        assertPreferences(result.preferences, GOLDEN_DEFAULTS);
        assertDiagnostics(result.diagnostics, [
            { code: DIAGNOSTICS.DP_NORMALIZED, field: "fontSize", applied: "medium" },
            { code: DIAGNOSTICS.DP_NORMALIZED, field: "readingWidth", applied: "standard" },
            { code: DIAGNOSTICS.DP_NORMALIZED, field: "schema_version", applied: 1 },
            { code: DIAGNOSTICS.DP_NORMALIZED, field: "theme", applied: "light" },
        ]);
    });

    test("T-NORMALIZE-02 — null input", () => {
        const result = normalize(null);
        assertPreferences(result.preferences, GOLDEN_DEFAULTS);
        assert.equal(result.diagnostics.length, 4);
    });

    test("T-NORMALIZE-03 — undefined input", () => {
        const result = normalize(undefined);
        assertPreferences(result.preferences, GOLDEN_DEFAULTS);
        assert.equal(result.diagnostics.length, 4);
    });

    test("T-NORMALIZE-04 — complete valid record", () => {
        const result = normalize({
            schema_version: 1,
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
        });
        assertPreferences(result.preferences, {
            schema_version: 1,
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
        });
        assertDiagnostics(result.diagnostics, []);
    });

    test("T-NORMALIZE-05 — partial theme only", () => {
        const result = normalize({ theme: "dark" });
        assert.equal(result.preferences.theme, "dark");
        assert.equal(result.diagnostics.length, 3);
        assert.ok(
            result.diagnostics.every((d) => d.code === DIAGNOSTICS.DP_NORMALIZED)
        );
    });

    test("T-NORMALIZE-06 — non-object input", () => {
        const result = normalize("invalid");
        assertPreferences(result.preferences, GOLDEN_DEFAULTS);
        assert.equal(result.diagnostics.length, 4);
    });

    test("T-NORMALIZE-07 — array input treated as non-object", () => {
        const result = normalize([]);
        assertPreferences(result.preferences, GOLDEN_DEFAULTS);
        assert.equal(result.diagnostics.length, 4);
    });

    test("T-NORMALIZE-08 — persisted record shape", () => {
        const result = normalize({
            record_id: "display-preferences-v1",
            logical_record_id: "display-preferences-v1",
            schema_version: 1,
            theme: "dark",
            fontSize: "small",
            readingWidth: "narrow",
            updated_at: "2026-08-01T10:00:00.000Z",
        });
        assertPreferences(result.preferences, {
            schema_version: 1,
            theme: "dark",
            fontSize: "small",
            readingWidth: "narrow",
        });
        assertDiagnostics(result.diagnostics, []);
    });

    test("T-NORMALIZE-09 — unknown key release_id ignored", () => {
        const result = normalize({ release_id: "cardio__234__2022__1", theme: "dark" });
        assert.equal(result.preferences.theme, "dark");
        assert.ok(
            result.diagnostics.every((d) => d.code === DIAGNOSTICS.DP_NORMALIZED)
        );
        assert.ok(result.diagnostics.every((d) => d.field !== "release_id"));
    });

    test("T-NORMALIZE-10 — unknown key viewId ignored", () => {
        const result = normalize({ viewId: "mental-model" });
        assertPreferences(result.preferences, GOLDEN_DEFAULTS);
        assert.equal(result.diagnostics.length, 4);
    });

    test("T-NORMALIZE-11 — multiple unknown keys ignored silently", () => {
        const result = normalize({
            chapter: "cardio/234",
            resumePoint: { kind: "view_scroll" },
            searchHit: { passageId: "x" },
        });
        assertPreferences(result.preferences, GOLDEN_DEFAULTS);
    });

    test("T-NORMALIZE-12 — unknown keys do not produce DP-UNKNOWN-FIELD", () => {
        const result = normalize({ foo: "bar", theme: "light" });
        assert.ok(
            result.diagnostics.every((d) => d.code !== DIAGNOSTICS.DP_UNKNOWN_FIELD)
        );
    });
});

describe("T-INVALID", () => {
    test("T-INVALID-01 — invalid theme", () => {
        const result = normalize({ theme: "neon" });
        assert.equal(result.preferences.theme, "light");
        assertDiagnostics(result.diagnostics, [
            { code: DIAGNOSTICS.DP_INVALID_VALUE, field: "theme", received: "neon", applied: "light" },
            { code: DIAGNOSTICS.DP_NORMALIZED, field: "fontSize", applied: "medium" },
            { code: DIAGNOSTICS.DP_NORMALIZED, field: "readingWidth", applied: "standard" },
            { code: DIAGNOSTICS.DP_NORMALIZED, field: "schema_version", applied: 1 },
        ]);
    });

    test("T-INVALID-02 — invalid fontSize", () => {
        const result = normalize({ fontSize: "huge" });
        assert.equal(result.preferences.fontSize, "medium");
        assert.ok(
            result.diagnostics.some(
                (d) =>
                    d.code === DIAGNOSTICS.DP_INVALID_VALUE &&
                    d.field === "fontSize" &&
                    d.received === "huge"
            )
        );
    });

    test("T-INVALID-03 — invalid readingWidth", () => {
        const result = normalize({ readingWidth: "full" });
        assert.equal(result.preferences.readingWidth, "standard");
        assert.ok(
            result.diagnostics.some(
                (d) =>
                    d.code === DIAGNOSTICS.DP_INVALID_VALUE &&
                    d.field === "readingWidth"
            )
        );
    });

    test("T-INVALID-04 — invalid schema_version zero", () => {
        const result = normalize({ schema_version: 0, theme: "dark" });
        assert.equal(result.preferences.schema_version, 1);
        assert.equal(result.preferences.theme, "dark");
        assert.ok(
            result.diagnostics.some(
                (d) =>
                    d.code === DIAGNOSTICS.DP_INVALID_VALUE &&
                    d.field === "schema_version" &&
                    d.received === 0
            )
        );
    });

    test("T-INVALID-05 — invalid schema_version string", () => {
        const result = normalize({ schema_version: "1" });
        assert.equal(result.preferences.schema_version, 1);
        assert.ok(
            result.diagnostics.some(
                (d) =>
                    d.code === DIAGNOSTICS.DP_INVALID_VALUE &&
                    d.field === "schema_version" &&
                    d.received === "1"
            )
        );
    });

    test("T-INVALID-06 — multiple invalid enum fields", () => {
        const result = normalize({
            theme: "x",
            fontSize: "y",
            readingWidth: "z",
        });
        assertPreferences(result.preferences, GOLDEN_DEFAULTS);
        const invalids = result.diagnostics.filter(
            (d) => d.code === DIAGNOSTICS.DP_INVALID_VALUE
        );
        assert.equal(invalids.length, 3);
        assert.equal(invalids[0].field, "fontSize");
        assert.equal(invalids[1].field, "readingWidth");
        assert.equal(invalids[2].field, "theme");
    });
});

describe("T-MERGE", () => {
    test("T-MERGE-01 — single-field patch theme", () => {
        const current = buildDefaults();
        const result = mergeAndNormalize(current, { theme: "dark" });
        assert.equal(result.preferences.theme, "dark");
        assertDiagnostics(result.diagnostics, []);
    });

    test("T-MERGE-02 — multi-field patch", () => {
        const current = buildDefaults();
        const result = mergeAndNormalize(current, {
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
        });
        assertPreferences(result.preferences, {
            schema_version: 1,
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
        });
        assertDiagnostics(result.diagnostics, []);
    });

    test("T-MERGE-03 — empty patch preserves current", () => {
        const current = normalize({
            theme: "dark",
            fontSize: "small",
            readingWidth: "narrow",
        }).preferences;
        const result = mergeAndNormalize(current, {});
        assert.ok(equals(result.preferences, current));
        assertDiagnostics(result.diagnostics, []);
    });

    test("T-MERGE-04 — invalid patch value replaced", () => {
        const current = buildDefaults();
        const result = mergeAndNormalize(current, { theme: "invalid" });
        assert.equal(result.preferences.theme, "light");
        assertDiagnostics(result.diagnostics, [
            {
                code: DIAGNOSTICS.DP_INVALID_VALUE,
                field: "theme",
                received: "invalid",
                applied: "light",
            },
        ]);
    });

    test("T-MERGE-05 — unknown patch field", () => {
        const current = buildDefaults();
        const result = mergeAndNormalize(current, {
            release_id: "cardio__234__2022__1",
            theme: "dark",
        });
        assert.equal(result.preferences.theme, "dark");
        assertDiagnostics(result.diagnostics, [
            {
                code: DIAGNOSTICS.DP_UNKNOWN_FIELD,
                field: "release_id",
                received: "cardio__234__2022__1",
            },
        ]);
    });

    test("T-MERGE-06 — null patch treated as empty", () => {
        const current = normalize({ theme: "dark" }).preferences;
        const result = mergeAndNormalize(current, null);
        assert.ok(equals(result.preferences, current));
        assertDiagnostics(result.diagnostics, []);
    });

    test("T-MERGE-07 — patch schema_version ignored", () => {
        const current = buildDefaults();
        const result = mergeAndNormalize(current, { schema_version: 99, theme: "dark" });
        assert.equal(result.preferences.schema_version, 1);
        assert.equal(result.preferences.theme, "dark");
        assertDiagnostics(result.diagnostics, [
            {
                code: DIAGNOSTICS.DP_UNKNOWN_FIELD,
                field: "schema_version",
                received: 99,
            },
        ]);
    });
});

describe("T-MIGRATION", () => {
    test("T-MIGRATION-01 — migrateToCurrent valid record", () => {
        const raw = {
            schema_version: 1,
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
        };
        const migrated = migrateToCurrent(raw);
        const normalized = normalize(raw);
        assert.ok(equals(migrated.preferences, normalized.preferences));
        assertDiagnostics(migrated.diagnostics, normalized.diagnostics);
    });

    test("T-MIGRATION-02 — schema_version absent treated as 1", () => {
        const result = migrateToCurrent({ theme: "dark" });
        assert.equal(result.preferences.schema_version, 1);
        assert.equal(result.preferences.theme, "dark");
    });
});

describe("T-REPRO", () => {
    test("T-REPRO-01 — double normalize identical", () => {
        const raw = {
            schema_version: 1,
            theme: "dark",
            fontSize: "x",
            readingWidth: "narrow",
            chapter: "ignored",
        };
        const first = normalize(raw);
        const second = normalize(raw);
        assert.ok(equals(first.preferences, second.preferences));
        assertDiagnostics(first.diagnostics, second.diagnostics);
    });

    test("T-REPRO-02 — diagnostic order stable for complex input", () => {
        const raw = {
            schema_version: 0,
            theme: "bad",
            fontSize: "bad",
            readingWidth: "bad",
            foo: "bar",
        };
        const first = normalize(raw);
        const second = normalize(raw);
        assert.deepEqual(first.diagnostics, second.diagnostics);
        const codes = first.diagnostics.map((d) => d.code);
        assert.deepEqual(codes, [...codes].sort((a, b) => a.localeCompare(b)));
    });
});

describe("T-EQUALS", () => {
    test("T-EQUALS-01 — reflexive", () => {
        const prefs = buildDefaults();
        assert.ok(equals(prefs, prefs));
    });

    test("T-EQUALS-02 — distinct fields", () => {
        const a = buildDefaults();
        const b = normalize({ theme: "dark" }).preferences;
        assert.equal(equals(a, b), false);
    });

    test("T-EQUALS-03 — non-object inputs", () => {
        assert.equal(equals(null, buildDefaults()), false);
        assert.equal(equals(buildDefaults(), undefined), false);
        assert.equal(equals("x", "x"), false);
    });
});

describe("T-ENUM", () => {
    test("T-ENUM-01 — all authorized theme values accepted", () => {
        for (const theme of THEME_VALUES) {
            const result = normalize({ theme });
            assert.equal(result.preferences.theme, theme);
            assert.ok(
                !result.diagnostics.some(
                    (d) =>
                        d.code === DIAGNOSTICS.DP_INVALID_VALUE && d.field === "theme"
                )
            );
        }
    });

    test("T-ENUM-02 — all authorized fontSize values accepted", () => {
        for (const fontSize of FONT_SIZE_VALUES) {
            const result = normalize({ fontSize });
            assert.equal(result.preferences.fontSize, fontSize);
            assert.ok(
                !result.diagnostics.some(
                    (d) =>
                        d.code === DIAGNOSTICS.DP_INVALID_VALUE &&
                        d.field === "fontSize"
                )
            );
        }
    });

    test("T-ENUM-03 — all authorized readingWidth values accepted", () => {
        for (const readingWidth of READING_WIDTH_VALUES) {
            const result = normalize({ readingWidth });
            assert.equal(result.preferences.readingWidth, readingWidth);
            assert.ok(
                !result.diagnostics.some(
                    (d) =>
                        d.code === DIAGNOSTICS.DP_INVALID_VALUE &&
                        d.field === "readingWidth"
                )
            );
        }
    });
});

describe("T-SCHEMA-STALE", () => {
    test("T-SCHEMA-STALE-01 — schema_version 2 emits DP-SCHEMA-STALE", () => {
        const result = normalize({
            schema_version: 2,
            theme: "dark",
            fontSize: "large",
            readingWidth: "wide",
        });
        assert.equal(result.preferences.schema_version, 1);
        assert.equal(result.preferences.theme, "dark");
        assert.ok(
            result.diagnostics.some(
                (d) =>
                    d.code === DIAGNOSTICS.DP_SCHEMA_STALE &&
                    d.field === "schema_version" &&
                    d.received === 2
            )
        );
        assert.ok(
            !result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_INVALID_VALUE)
        );
    });

    test("T-SCHEMA-STALE-02 — schema_version 99 preserves valid preference fields", () => {
        const result = migrateToCurrent({
            schema_version: 99,
            theme: "dark",
        });
        assert.equal(result.preferences.theme, "dark");
        assert.equal(result.preferences.schema_version, SUPPORTED_SCHEMA_VERSION);
        assert.ok(
            result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_SCHEMA_STALE)
        );
    });

    test("T-SCHEMA-STALE-03 — schema_version 2 with invalid theme still normalizes theme", () => {
        const result = normalize({ schema_version: 2, theme: "bad" });
        assert.equal(result.preferences.theme, "light");
        assert.ok(
            result.diagnostics.some((d) => d.code === DIAGNOSTICS.DP_SCHEMA_STALE)
        );
        assert.ok(
            result.diagnostics.some(
                (d) =>
                    d.code === DIAGNOSTICS.DP_INVALID_VALUE && d.field === "theme"
            )
        );
    });
});

describe("T-PURITY — no forbidden dependencies", () => {
    test("T-PURITY-01 — module source has no I/O or browser APIs", async () => {
        const { readFileSync } = await import("node:fs");
        const { fileURLToPath } = await import("node:url");
        const { dirname, join } = await import("node:path");
        const here = dirname(fileURLToPath(import.meta.url));
        const source = readFileSync(
            join(here, "..", "display-preferences-service.js"),
            "utf8"
        );
        const forbidden = [
            "document",
            "window",
            "indexedDB",
            "localStorage",
            "fetch(",
            "LouLearnerStore",
            "session-service",
            "local-search",
            "Date.now",
        ];
        for (const token of forbidden) {
            assert.equal(
                source.includes(token),
                false,
                `forbidden token present: ${token}`
            );
        }
    });
});
