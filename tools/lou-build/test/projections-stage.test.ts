import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { runInventory as runInventoryLegacy } from "../lib/inventory-stage.js";
import { runPackageInput as runPackageInputLegacy } from "../lib/package-input.js";
import { runProjections as runProjectionsLegacy } from "../lib/projections.js";
import { resolveChapterDir } from "../lib/paths.js";
import { createContext } from "../src/pipeline/context.js";
import { runInventory } from "../src/stages/inventory.js";
import { runPackageInput } from "../src/stages/package-input.js";
import { runProjections } from "../src/stages/projections.js";
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

function assertProjectionsParity(
  chapterDir: string,
  command: "validate" | "build",
) {
  const ctxLegacy = createContext(chapterDir, command);
  const ctxMigrated = createContext(chapterDir, command);
  seedThroughInventory(ctxLegacy, true);
  seedThroughInventory(ctxMigrated, false);

  const legacy = runProjectionsLegacy(ctxLegacy);
  const migrated = runProjections(ctxMigrated);
  assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "projections");
}

describe("Stage F — projections migration parity", () => {
  it("matches legacy on Item 234 (validate)", () => {
    assertProjectionsParity(CHAPTER_234, "validate");
  });

  it("matches legacy on Item 234 (build)", () => {
    assertProjectionsParity(CHAPTER_234, "build");
  });

  it("matches legacy on Item 330 (validate)", () => {
    assertProjectionsParity(CHAPTER_330, "validate");
  });

  it("matches legacy on Item 330 (build)", () => {
    assertProjectionsParity(CHAPTER_330, "build");
  });

  it("matches legacy when inventory workspace entry is empty", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThroughInventory(ctxLegacy, true);
    seedThroughInventory(ctxMigrated, false);

    ctxLegacy.workspace.inventory = { chapter: "cardio/234", kps: [] };
    ctxMigrated.workspace.inventory = { chapter: "cardio/234", kps: [] };

    const legacy = runProjectionsLegacy(ctxLegacy);
    const migrated = runProjections(ctxMigrated);
    assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "projections");
    assert.equal(legacy.ok, false);
    assert.ok(legacy.errors.length > 0);
  });

  it("does not mutate BuildContext.results", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThroughInventory(ctxLegacy, true);
    seedThroughInventory(ctxMigrated, false);
    runProjectionsLegacy(ctxLegacy);
    runProjections(ctxMigrated);
    assertResultsUntouched(ctxLegacy);
    assertResultsUntouched(ctxMigrated);
  });

  it("writes no files (read-only stage)", () => {
    const projectionPath = path.join(
      CHAPTER_234,
      "projections/understanding/mechanisms.md",
    );
    const before = fs.statSync(projectionPath).mtimeMs;
    const ctx = createContext(CHAPTER_234, "build");
    seedThroughInventory(ctx, false);
    runProjections(ctx);
    const after = fs.statSync(projectionPath).mtimeMs;
    assert.equal(after, before);
  });
});
