import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { runGrounding as runGroundingLegacy } from "../lib/grounding.js";
import { resolveChapterDir } from "../lib/paths.js";
import { createContext } from "../src/pipeline/context.js";
import { runGrounding } from "../src/stages/grounding.js";
import { seedThrough } from "./stage-seed-helpers.js";
import {
  assertResultsUntouched,
  assertStageParity,
} from "./stage-parity-helpers.js";

const CHAPTER_234 = resolveChapterDir("01-learning/chapters/cardio/234");
const CHAPTER_330 = resolveChapterDir("01-learning/chapters/cardio/330");

function assertGroundingParity(chapterDir: string, command: "validate" | "build") {
  const ctxLegacy = createContext(chapterDir, command);
  const ctxMigrated = createContext(chapterDir, command);
  seedThrough(ctxLegacy, "F", "legacy");
  seedThrough(ctxMigrated, "F", "migrated");

  const legacy = runGroundingLegacy(ctxLegacy);
  const migrated = runGrounding(ctxMigrated);
  assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "grounding");
}

describe("Stage H — grounding migration parity", () => {
  it("matches legacy on Item 234 (validate)", () => {
    assertGroundingParity(CHAPTER_234, "validate");
  });

  it("matches legacy on Item 234 (build)", () => {
    assertGroundingParity(CHAPTER_234, "build");
  });

  it("matches legacy on Item 330 (validate)", () => {
    assertGroundingParity(CHAPTER_330, "validate");
  });

  it("matches legacy on Item 330 (build)", () => {
    assertGroundingParity(CHAPTER_330, "build");
  });

  it("matches legacy when claims are unavailable", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThrough(ctxLegacy, "F", "legacy");
    seedThrough(ctxMigrated, "F", "migrated");

    ctxLegacy.workspace.claims = { ok: false, errors: ["claims FAIL"] };
    ctxMigrated.workspace.claims = { ok: false, errors: ["claims FAIL"] };

    const legacy = runGroundingLegacy(ctxLegacy);
    const migrated = runGrounding(ctxMigrated);
    assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "grounding");
    assert.equal(legacy.ok, false);
  });

  it("does not mutate BuildContext.results", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThrough(ctxLegacy, "F", "legacy");
    seedThrough(ctxMigrated, "F", "migrated");
    runGroundingLegacy(ctxLegacy);
    runGrounding(ctxMigrated);
    assertResultsUntouched(ctxLegacy);
    assertResultsUntouched(ctxMigrated);
  });

  it("produces identical grounding.yaml and traceability.json in build mode", () => {
    const ctxLegacy = createContext(CHAPTER_234, "build");
    const ctxMigrated = createContext(CHAPTER_234, "build");
    seedThrough(ctxLegacy, "F", "legacy");
    seedThrough(ctxMigrated, "F", "migrated");

    runGroundingLegacy(ctxLegacy);
    const groundingLegacy = fs.readFileSync(
      path.join(CHAPTER_234, "build/grounding.yaml"),
      "utf8",
    );
    const traceLegacy = fs.readFileSync(
      path.join(CHAPTER_234, "build/traceability.json"),
      "utf8",
    );

    runGrounding(ctxMigrated);
    const groundingMigrated = fs.readFileSync(
      path.join(CHAPTER_234, "build/grounding.yaml"),
      "utf8",
    );
    const traceMigrated = fs.readFileSync(
      path.join(CHAPTER_234, "build/traceability.json"),
      "utf8",
    );

    assert.equal(groundingMigrated, groundingLegacy);
    assert.equal(traceMigrated, traceLegacy);
  });

  it("validate mode does not write grounding artefacts", () => {
    const groundingPath = path.join(CHAPTER_234, "build/grounding.yaml");
    const tracePath = path.join(CHAPTER_234, "build/traceability.json");
    const hadGrounding = fs.existsSync(groundingPath);
    const hadTrace = fs.existsSync(tracePath);
    const groundingBefore = hadGrounding
      ? fs.readFileSync(groundingPath, "utf8")
      : null;
    const traceBefore = hadTrace ? fs.readFileSync(tracePath, "utf8") : null;

    const ctx = createContext(CHAPTER_234, "validate");
    seedThrough(ctx, "F", "migrated");
    runGrounding(ctx);

    if (hadGrounding) {
      assert.equal(fs.readFileSync(groundingPath, "utf8"), groundingBefore);
    }
    if (hadTrace) {
      assert.equal(fs.readFileSync(tracePath, "utf8"), traceBefore);
    }
  });
});
