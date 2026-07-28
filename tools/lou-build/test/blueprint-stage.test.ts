import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { runBlueprint as runBlueprintLegacy } from "../lib/blueprint-stage.js";
import { runInventory as runInventoryLegacy } from "../lib/inventory-stage.js";
import { runPackageInput as runPackageInputLegacy } from "../lib/package-input.js";
import { runReconciliation as runReconciliationLegacy } from "../lib/reconciliation.js";
import { resolveChapterDir } from "../lib/paths.js";
import { createContext } from "../src/pipeline/context.js";
import { runBlueprint } from "../src/stages/blueprint.js";
import { runInventory } from "../src/stages/inventory.js";
import { runPackageInput } from "../src/stages/package-input.js";
import { runReconciliation } from "../src/stages/reconciliation.js";
import {
  assertResultsUntouched,
  assertStageParity,
} from "./stage-parity-helpers.js";

const CHAPTER_234 = resolveChapterDir("01-learning/chapters/cardio/234");
const CHAPTER_330 = resolveChapterDir("01-learning/chapters/cardio/330");

function seedThroughReconciliation(
  ctx: ReturnType<typeof createContext>,
  legacy: boolean,
) {
  if (legacy) {
    runPackageInputLegacy(ctx);
    runInventoryLegacy(ctx);
    runReconciliationLegacy(ctx);
  } else {
    runPackageInput(ctx);
    runInventory(ctx);
    runReconciliation(ctx);
  }
}

function assertBlueprintParity(chapterDir: string, command: "validate" | "build") {
  const ctxLegacy = createContext(chapterDir, command);
  const ctxMigrated = createContext(chapterDir, command);
  seedThroughReconciliation(ctxLegacy, true);
  seedThroughReconciliation(ctxMigrated, false);

  const legacy = runBlueprintLegacy(ctxLegacy);
  const migrated = runBlueprint(ctxMigrated);
  assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "blueprint");
}

describe("Stage E — blueprint migration parity", () => {
  it("matches legacy on Item 234 (validate)", () => {
    assertBlueprintParity(CHAPTER_234, "validate");
  });

  it("matches legacy on Item 234 (build)", () => {
    assertBlueprintParity(CHAPTER_234, "build");
  });

  it("matches legacy on Item 330 (validate)", () => {
    assertBlueprintParity(CHAPTER_330, "validate");
  });

  it("matches legacy on Item 330 (build)", () => {
    assertBlueprintParity(CHAPTER_330, "build");
  });

  it("matches legacy when blueprint file is missing", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThroughReconciliation(ctxLegacy, true);
    seedThroughReconciliation(ctxMigrated, false);

    const paths = ctxLegacy.workspace.paths as { blueprint: string };
    const missing = paths.blueprint.replace(/blueprint\.md$/, "missing-blueprint.md");
    ctxLegacy.workspace.paths = { ...paths, blueprint: missing };
    ctxMigrated.workspace.paths = { ...paths, blueprint: missing };

    assert.throws(() => runBlueprintLegacy(ctxLegacy));
    assert.throws(() => runBlueprint(ctxMigrated));
  });

  it("does not mutate BuildContext.results", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThroughReconciliation(ctxLegacy, true);
    seedThroughReconciliation(ctxMigrated, false);
    runBlueprintLegacy(ctxLegacy);
    runBlueprint(ctxMigrated);
    assertResultsUntouched(ctxLegacy);
    assertResultsUntouched(ctxMigrated);
  });

  it("writes no files (read-only stage)", () => {
    const blueprintPath = `${CHAPTER_234}/blueprint.md`;
    const before = fs.statSync(blueprintPath).mtimeMs;
    const ctx = createContext(CHAPTER_234, "build");
    seedThroughReconciliation(ctx, false);
    runBlueprint(ctx);
    const after = fs.statSync(blueprintPath).mtimeMs;
    assert.equal(after, before);
  });
});
