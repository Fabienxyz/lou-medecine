import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { runInventory as runInventoryLegacy } from "../lib/inventory-stage.js";
import { runPackageInput as runPackageInputLegacy } from "../lib/package-input.js";
import { resolveChapterDir } from "../lib/paths.js";
import { createContext } from "../src/pipeline/context.js";
import { runInventory } from "../src/stages/inventory.js";
import { runPackageInput } from "../src/stages/package-input.js";
import {
  assertResultsUntouched,
  assertStageParity,
} from "./stage-parity-helpers.js";

const CHAPTER_234 = resolveChapterDir("01-learning/chapters/cardio/234");
const CHAPTER_330 = resolveChapterDir("01-learning/chapters/cardio/330");

function seedPackageInput(ctx: ReturnType<typeof createContext>, legacy: boolean) {
  if (legacy) runPackageInputLegacy(ctx);
  else runPackageInput(ctx);
}

function assertInventoryParity(chapterDir: string, command: "validate" | "build") {
  const ctxLegacy = createContext(chapterDir, command);
  const ctxMigrated = createContext(chapterDir, command);
  seedPackageInput(ctxLegacy, true);
  seedPackageInput(ctxMigrated, false);

  const legacy = runInventoryLegacy(ctxLegacy);
  const migrated = runInventory(ctxMigrated);
  assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "inventory");
}

describe("Stage C — inventory migration parity", () => {
  it("matches legacy on Item 234 (validate)", () => {
    assertInventoryParity(CHAPTER_234, "validate");
  });

  it("matches legacy on Item 234 (build)", () => {
    assertInventoryParity(CHAPTER_234, "build");
  });

  it("matches legacy on Item 330 (validate)", () => {
    assertInventoryParity(CHAPTER_330, "validate");
  });

  it("matches legacy on Item 330 (build)", () => {
    assertInventoryParity(CHAPTER_330, "build");
  });

  it("matches legacy when inventory file is missing", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedPackageInput(ctxLegacy, true);
    seedPackageInput(ctxMigrated, false);

    const paths = ctxLegacy.workspace.paths as { inventory: string };
    const missing = paths.inventory.replace(/inventory\.yaml$/, "missing-inventory.yaml");
    ctxLegacy.workspace.paths = { ...paths, inventory: missing };
    ctxMigrated.workspace.paths = { ...paths, inventory: missing };

    assert.throws(() => runInventoryLegacy(ctxLegacy));
    assert.throws(() => runInventory(ctxMigrated));
  });

  it("does not mutate BuildContext.results", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedPackageInput(ctxLegacy, true);
    seedPackageInput(ctxMigrated, false);
    runInventoryLegacy(ctxLegacy);
    runInventory(ctxMigrated);
    assertResultsUntouched(ctxLegacy);
    assertResultsUntouched(ctxMigrated);
  });

  it("writes no files (read-only stage)", () => {
    const manifestPath = `${CHAPTER_234}/manifest.json`;
    const before = fs.existsSync(manifestPath) ? fs.statSync(manifestPath).mtimeMs : 0;
    const ctx = createContext(CHAPTER_234, "build");
    seedPackageInput(ctx, false);
    runInventory(ctx);
    const after = fs.existsSync(manifestPath) ? fs.statSync(manifestPath).mtimeMs : 0;
    assert.equal(after, before);
  });
});
