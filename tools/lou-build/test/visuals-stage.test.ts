import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { runVisuals as runVisualsLegacy } from "../lib/visuals.js";
import { resolveChapterDir } from "../lib/paths.js";
import { createContext } from "../src/pipeline/context.js";
import { runVisuals } from "../src/stages/visuals.js";
import { seedThrough } from "./stage-seed-helpers.js";
import {
  assertResultsUntouched,
  assertStageParity,
} from "./stage-parity-helpers.js";

const CHAPTER_234 = resolveChapterDir("01-learning/chapters/cardio/234");
const CHAPTER_330 = resolveChapterDir("01-learning/chapters/cardio/330");

function assertVisualsParity(chapterDir: string, command: "validate" | "build") {
  const ctxLegacy = createContext(chapterDir, command);
  const ctxMigrated = createContext(chapterDir, command);
  seedThrough(ctxLegacy, "E", "legacy");
  seedThrough(ctxMigrated, "E", "migrated");

  const legacy = runVisualsLegacy(ctxLegacy);
  const migrated = runVisuals(ctxMigrated);
  assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "visuals");
}

describe("Stage G — visuals migration parity", () => {
  it("matches legacy on Item 234 (validate)", () => {
    assertVisualsParity(CHAPTER_234, "validate");
  });

  it("matches legacy on Item 234 (build)", () => {
    assertVisualsParity(CHAPTER_234, "build");
  });

  it("matches legacy on Item 330 (validate)", () => {
    assertVisualsParity(CHAPTER_330, "validate");
  });

  it("matches legacy on Item 330 (build)", () => {
    assertVisualsParity(CHAPTER_330, "build");
  });

  it("always returns stage ok even when visuals are withheld (non-blocking)", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThrough(ctxLegacy, "E", "legacy");
    seedThrough(ctxMigrated, "E", "migrated");

    const legacy = runVisualsLegacy(ctxLegacy);
    const migrated = runVisuals(ctxMigrated);
    assert.equal(legacy.ok, true);
    assert.equal(migrated.ok, true);
    const legacyData = legacy.data as { withheld?: unknown[] };
    assert.ok(Array.isArray(legacyData.withheld));
  });

  it("matches legacy diagnostics when blueprintValidation has no visual elements", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThrough(ctxLegacy, "E", "legacy");
    seedThrough(ctxMigrated, "E", "migrated");

    (ctxLegacy.workspace.blueprintValidation as { visualElements: unknown[] }).visualElements = [];
    (ctxMigrated.workspace.blueprintValidation as { visualElements: unknown[] }).visualElements = [];

    const legacy = runVisualsLegacy(ctxLegacy);
    const migrated = runVisuals(ctxMigrated);
    assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "visuals");
  });

  it("does not mutate BuildContext.results", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThrough(ctxLegacy, "E", "legacy");
    seedThrough(ctxMigrated, "E", "migrated");
    runVisualsLegacy(ctxLegacy);
    runVisuals(ctxMigrated);
    assertResultsUntouched(ctxLegacy);
    assertResultsUntouched(ctxMigrated);
  });

  it("validate mode writes no figure files", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-build-visuals-"));
    fs.cpSync(CHAPTER_234, tmp, { recursive: true });
    const figuresDir = path.join(tmp, "figures");
    const before = fs.existsSync(figuresDir)
      ? fs.readdirSync(figuresDir).sort().join(",")
      : "";
    const ctx = createContext(tmp, "validate");
    seedThrough(ctx, "E", "migrated");
    runVisuals(ctx);
    const after = fs.existsSync(figuresDir)
      ? fs.readdirSync(figuresDir).sort().join(",")
      : "";
    assert.equal(after, before);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
