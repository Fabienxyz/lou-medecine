import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { runInventory as runInventoryLegacy } from "../lib/inventory-stage.js";
import { runPackageInput as runPackageInputLegacy } from "../lib/package-input.js";
import { runReconciliation as runReconciliationLegacy } from "../lib/reconciliation.js";
import { resolveChapterDir } from "../lib/paths.js";
import { createContext } from "../src/pipeline/context.js";
import { runInventory } from "../src/stages/inventory.js";
import { runPackageInput } from "../src/stages/package-input.js";
import { runReconciliation } from "../src/stages/reconciliation.js";
import {
  assertResultsUntouched,
  assertStageParity,
} from "./stage-parity-helpers.js";

const CHAPTER_234 = resolveChapterDir("01-learning/chapters/cardio/234");
const CHAPTER_330 = resolveChapterDir("01-learning/chapters/cardio/330");

function seedThroughInventory(
  ctx: ReturnType<typeof createContext>,
  legacy: boolean,
) {
  if (legacy) {
    runPackageInputLegacy(ctx);
    runInventoryLegacy(ctx);
  } else {
    runPackageInput(ctx);
    runInventory(ctx);
  }
}

function assertReconciliationParity(
  chapterDir: string,
  command: "validate" | "build",
) {
  const ctxLegacy = createContext(chapterDir, command);
  const ctxMigrated = createContext(chapterDir, command);
  seedThroughInventory(ctxLegacy, true);
  seedThroughInventory(ctxMigrated, false);

  const legacy = runReconciliationLegacy(ctxLegacy);
  const migrated = runReconciliation(ctxMigrated);
  assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "reconciliation");
}

describe("Stage D — reconciliation migration parity", () => {
  it("matches legacy on Item 234 (validate)", () => {
    assertReconciliationParity(CHAPTER_234, "validate");
  });

  it("matches legacy on Item 234 (build)", () => {
    assertReconciliationParity(CHAPTER_234, "build");
  });

  it("matches legacy on Item 330 (validate)", () => {
    assertReconciliationParity(CHAPTER_330, "validate");
  });

  it("matches legacy on Item 330 (build)", () => {
    assertReconciliationParity(CHAPTER_330, "build");
  });

  it("matches legacy when reconciliation artifact is missing", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThroughInventory(ctxLegacy, true);
    seedThroughInventory(ctxMigrated, false);

    const paths = ctxLegacy.workspace.paths as { reconciliation: string };
    const missing = paths.reconciliation.replace(
      /reconciliation\.yaml$/,
      "missing-reconciliation.yaml",
    );
    ctxLegacy.workspace.paths = { ...paths, reconciliation: missing };
    ctxMigrated.workspace.paths = { ...paths, reconciliation: missing };

    const legacy = runReconciliationLegacy(ctxLegacy);
    const migrated = runReconciliation(ctxMigrated);
    assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "reconciliation");
    assert.equal(legacy.ok, false);
    assert.ok(
      legacy.errors.some((e) => e.includes("missing reconciliation artifact")),
    );
  });

  it("does not mutate BuildContext.results", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThroughInventory(ctxLegacy, true);
    seedThroughInventory(ctxMigrated, false);
    runReconciliationLegacy(ctxLegacy);
    runReconciliation(ctxMigrated);
    assertResultsUntouched(ctxLegacy);
    assertResultsUntouched(ctxMigrated);
  });

  it("writes no files (read-only stage)", () => {
    const reconPath = `${CHAPTER_234}/build/reconciliation.yaml`;
    const before = fs.statSync(reconPath).mtimeMs;
    const ctx = createContext(CHAPTER_234, "build");
    seedThroughInventory(ctx, false);
    runReconciliation(ctx);
    const after = fs.statSync(reconPath).mtimeMs;
    assert.equal(after, before);
  });
});
