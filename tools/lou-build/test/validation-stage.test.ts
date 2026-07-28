import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runValidation as runValidationLegacy } from "../lib/validation.js";
import { resolveChapterDir } from "../lib/paths.js";
import { createContext } from "../src/pipeline/context.js";
import { runValidation } from "../src/stages/validation.js";
import { seedThrough } from "./stage-seed-helpers.js";
import {
  assertResultsUntouched,
  assertStageParity,
} from "./stage-parity-helpers.js";

const CHAPTER_234 = resolveChapterDir("01-learning/chapters/cardio/234");
const CHAPTER_330 = resolveChapterDir("01-learning/chapters/cardio/330");

function assertValidationParity(
  chapterDir: string,
  command: "validate" | "build",
) {
  const ctxLegacy = createContext(chapterDir, command);
  const ctxMigrated = createContext(chapterDir, command);
  seedThrough(ctxLegacy, "H", "legacy");
  seedThrough(ctxMigrated, "H", "migrated");

  const legacy = runValidationLegacy(ctxLegacy);
  const migrated = runValidation(ctxMigrated);
  assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "validation");
}

describe("Stage I — validation migration parity", () => {
  it("matches legacy on Item 234 (validate)", () => {
    assertValidationParity(CHAPTER_234, "validate");
  });

  it("matches legacy on Item 234 (build)", () => {
    assertValidationParity(CHAPTER_234, "build");
  });

  it("matches legacy on Item 330 (validate)", () => {
    assertValidationParity(CHAPTER_330, "validate");
  });

  it("matches legacy on Item 330 (build)", () => {
    assertValidationParity(CHAPTER_330, "build");
  });

  it("matches legacy when grounding fails", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThrough(ctxLegacy, "H", "legacy");
    seedThrough(ctxMigrated, "H", "migrated");

    ctxLegacy.workspace.grounding = { ok: false, errors: ["grounding FAIL"] };
    ctxMigrated.workspace.grounding = { ok: false, errors: ["grounding FAIL"] };

    const legacy = runValidationLegacy(ctxLegacy);
    const migrated = runValidation(ctxMigrated);
    assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "validation");
    assert.equal(legacy.ok, false);
    assert.ok(legacy.errors.some((e) => e.includes("grounding FAIL")));
  });

  it("matches legacy when reconciliation fails", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThrough(ctxLegacy, "H", "legacy");
    seedThrough(ctxMigrated, "H", "migrated");

    ctxLegacy.workspace.reconciliation = {
      ok: false,
      errors: ["reconciliation: status is fail (expected pass)"],
    };
    ctxMigrated.workspace.reconciliation = {
      ok: false,
      errors: ["reconciliation: status is fail (expected pass)"],
    };

    const legacy = runValidationLegacy(ctxLegacy);
    const migrated = runValidation(ctxMigrated);
    assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "validation");
    assert.equal(legacy.ok, false);
  });

  it("does not mutate BuildContext.results", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThrough(ctxLegacy, "H", "legacy");
    seedThrough(ctxMigrated, "H", "migrated");
    runValidationLegacy(ctxLegacy);
    runValidation(ctxMigrated);
    assertResultsUntouched(ctxLegacy);
    assertResultsUntouched(ctxMigrated);
  });
});
