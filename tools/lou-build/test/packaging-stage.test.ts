import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { runPackaging as runPackagingLegacy } from "../lib/packaging-stage.js";
import { resolveChapterDir } from "../lib/paths.js";
import { createContext } from "../src/pipeline/context.js";
import { runPackaging } from "../src/stages/packaging.js";
import { seedThrough } from "./stage-seed-helpers.js";
import {
  assertResultsUntouched,
  assertStageParity,
} from "./stage-parity-helpers.js";

const CHAPTER_234 = resolveChapterDir("01-learning/chapters/cardio/234");
const CHAPTER_330 = resolveChapterDir("01-learning/chapters/cardio/330");

function assertPackagingParity(chapterDir: string, command: "validate" | "build") {
  const ctxLegacy = createContext(chapterDir, command);
  const ctxMigrated = createContext(chapterDir, command);
  seedThrough(ctxLegacy, "H", "legacy");
  seedThrough(ctxMigrated, "H", "migrated");

  const legacy = runPackagingLegacy(ctxLegacy);
  const migrated = runPackaging(ctxMigrated);
  assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "packaging");
}

describe("Stage J — packaging migration parity", () => {
  it("matches legacy on Item 234 (validate — skipped write)", () => {
    assertPackagingParity(CHAPTER_234, "validate");
    const ctx = createContext(CHAPTER_234, "validate");
    seedThrough(ctx, "H", "migrated");
    const result = runPackaging(ctx);
    assert.deepEqual(result.data, {
      skipped: true,
      reason: "validate mode — no manifest write",
    });
  });

  it("matches legacy on Item 234 (build)", () => {
    assertPackagingParity(CHAPTER_234, "build");
  });

  it("matches legacy on Item 330 (build)", () => {
    assertPackagingParity(CHAPTER_330, "build");
  });

  it("does not mutate BuildContext.results", () => {
    const ctxLegacy = createContext(CHAPTER_234, "build");
    const ctxMigrated = createContext(CHAPTER_234, "build");
    seedThrough(ctxLegacy, "H", "legacy");
    seedThrough(ctxMigrated, "H", "migrated");
    runPackagingLegacy(ctxLegacy);
    runPackaging(ctxMigrated);
    assertResultsUntouched(ctxLegacy);
    assertResultsUntouched(ctxMigrated);
  });

  it("produces byte-identical manifest.json in build mode", () => {
    const manifestPath = path.join(CHAPTER_234, "manifest.json");
    const ctxLegacy = createContext(CHAPTER_234, "build");
    const ctxMigrated = createContext(CHAPTER_234, "build");
    seedThrough(ctxLegacy, "H", "legacy");
    seedThrough(ctxMigrated, "H", "migrated");

    runPackagingLegacy(ctxLegacy);
    const manifestLegacy = fs.readFileSync(manifestPath, "utf8");

    runPackaging(ctxMigrated);
    const manifestMigrated = fs.readFileSync(manifestPath, "utf8");

    assert.equal(manifestMigrated, manifestLegacy);
    assert.deepEqual(JSON.parse(manifestMigrated), JSON.parse(manifestLegacy));
  });
});
