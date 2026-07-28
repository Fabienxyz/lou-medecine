import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { runPublication as runPublicationLegacy } from "../lib/publication.js";
import { runPackaging as runPackagingLegacy } from "../lib/packaging-stage.js";
import { runValidation as runValidationLegacy } from "../lib/validation.js";
import { resolveChapterDir } from "../lib/paths.js";
import { createContext } from "../src/pipeline/context.js";
import { runPublication } from "../src/stages/publication.js";
import { runPackaging } from "../src/stages/packaging.js";
import { runValidation } from "../src/stages/validation.js";
import { seedThrough } from "./stage-seed-helpers.js";
import { assertStageParity } from "./stage-parity-helpers.js";

const CHAPTER_234 = resolveChapterDir("01-learning/chapters/cardio/234");

function seedPublicationContext(
  chapterDir: string,
  command: "validate" | "build",
  legacy: boolean,
) {
  const ctx = createContext(chapterDir, command);
  seedThrough(ctx, "H", legacy ? "legacy" : "migrated");
  const val = legacy ? runValidationLegacy(ctx) : runValidation(ctx);
  ctx.results.set("validation", val);
  if (command === "build") {
    const pkg = legacy ? runPackagingLegacy(ctx) : runPackaging(ctx);
    ctx.results.set("packaging", pkg);
  }
  return ctx;
}

describe("Stage K — publication migration parity", () => {
  it("matches legacy in validate mode when validation passes", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThrough(ctxLegacy, "H", "legacy");
    seedThrough(ctxMigrated, "H", "migrated");
    const valLegacy = runValidationLegacy(ctxLegacy);
    const valMigrated = runValidation(ctxMigrated);
    ctxLegacy.results.set("validation", valLegacy);
    ctxMigrated.results.set("validation", valMigrated);

    const legacy = runPublicationLegacy(ctxLegacy);
    const migrated = runPublication(ctxMigrated);
    assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "publication");
    assert.equal((legacy.data as { state?: string }).state, "ready");
  });

  it("matches legacy in validate mode when validation fails", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThrough(ctxLegacy, "H", "legacy");
    seedThrough(ctxMigrated, "H", "migrated");
    ctxLegacy.results.set("validation", {
      ok: false,
      errors: ["grounding FAIL"],
    });
    ctxMigrated.results.set("validation", {
      ok: false,
      errors: ["grounding FAIL"],
    });

    const legacy = runPublicationLegacy(ctxLegacy);
    const migrated = runPublication(ctxMigrated);
    assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "publication");
    assert.equal(legacy.ok, false);
  });

  it("matches legacy in build mode when packaging succeeds", () => {
    const ctxLegacy = seedPublicationContext(CHAPTER_234, "build", true);
    const ctxMigrated = seedPublicationContext(CHAPTER_234, "build", false);

    const legacy = runPublicationLegacy(ctxLegacy);
    const migrated = runPublication(ctxMigrated);
    assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "publication");
    assert.equal((legacy.data as { state?: string }).state, "published");
    assert.ok(fs.existsSync(path.join(CHAPTER_234, "manifest.json")));
  });

  it("matches legacy when packaging failed — manifest invalidated", () => {
    const ctxLegacy = createContext(CHAPTER_234, "build");
    const ctxMigrated = createContext(CHAPTER_234, "build");
    seedThrough(ctxLegacy, "H", "legacy");
    seedThrough(ctxMigrated, "H", "migrated");
    runPackagingLegacy(ctxLegacy);
    runPackaging(ctxMigrated);
    assert.ok(fs.existsSync(path.join(CHAPTER_234, "manifest.json")));

    ctxLegacy.results.set("packaging", {
      ok: false,
      errors: ["packaging failed"],
    });
    ctxMigrated.results.set("packaging", {
      ok: false,
      errors: ["packaging failed"],
    });

    const legacy = runPublicationLegacy(ctxLegacy);
    const migrated = runPublication(ctxMigrated);
    assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "publication");
    assert.equal(fs.existsSync(path.join(CHAPTER_234, "manifest.json")), false);

    seedPublicationContext(CHAPTER_234, "build", true);
  });

  it("matches legacy when manifest missing after packaging", () => {
    const ctxLegacy = createContext(CHAPTER_234, "build");
    const ctxMigrated = createContext(CHAPTER_234, "build");
    seedThrough(ctxLegacy, "H", "legacy");
    seedThrough(ctxMigrated, "H", "migrated");

    const manifestPath = (ctxLegacy.workspace.paths as { manifest: string })
      .manifest;
    const hadManifest = fs.existsSync(manifestPath);
    if (hadManifest) {
      fs.unlinkSync(manifestPath);
    }

    ctxLegacy.results.set("packaging", { ok: true, errors: [] });
    ctxMigrated.results.set("packaging", { ok: true, errors: [] });

    const legacy = runPublicationLegacy(ctxLegacy);
    const migrated = runPublication(ctxMigrated);
    assertStageParity(legacy, migrated, ctxLegacy, ctxMigrated, "publication");
    assert.equal(legacy.ok, false);
    assert.ok(
      legacy.errors.some((e) =>
        e.includes("manifest missing after packaging"),
      ),
    );

    if (hadManifest) {
      seedPublicationContext(CHAPTER_234, "build", true);
    }
  });

  it("does not mutate BuildContext beyond reading packaging/validation results", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");
    seedThrough(ctxLegacy, "H", "legacy");
    seedThrough(ctxMigrated, "H", "migrated");
    ctxLegacy.results.set("validation", { ok: true, errors: [] });
    ctxMigrated.results.set("validation", { ok: true, errors: [] });
    const sizeBeforeLegacy = ctxLegacy.results.size;
    const sizeBeforeMigrated = ctxMigrated.results.size;
    runPublicationLegacy(ctxLegacy);
    runPublication(ctxMigrated);
    assert.equal(ctxLegacy.results.size, sizeBeforeLegacy);
    assert.equal(ctxMigrated.results.size, sizeBeforeMigrated);
  });
});
