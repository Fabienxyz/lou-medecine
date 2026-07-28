import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import { runPackageInput as runPackageInputLegacy } from "../lib/package-input.js";
import { resolveChapterDir } from "../lib/paths.js";
import { createContext, type BuildContext } from "../src/pipeline/context.js";
import { runPackageInput } from "../src/stages/package-input.js";

const CHAPTER_234 = resolveChapterDir("01-learning/chapters/cardio/234");
const CHAPTER_330 = resolveChapterDir("01-learning/chapters/cardio/330");

function workspaceSnapshot(ctx: BuildContext): Record<string, unknown> {
  return structuredClone(ctx.workspace);
}

function assertParity(
  chapterDir: string,
  command: "validate" | "build" = "validate",
): void {
  const ctxLegacy = createContext(chapterDir, command);
  const ctxMigrated = createContext(chapterDir, command);

  const legacy = runPackageInputLegacy(ctxLegacy);
  const migrated = runPackageInput(ctxMigrated);

  assert.deepEqual(migrated.ok, legacy.ok, "ok mismatch");
  assert.deepEqual(migrated.errors, legacy.errors, "errors mismatch");
  assert.deepEqual(migrated.data, legacy.data, "data mismatch");
  assert.deepEqual(
    workspaceSnapshot(ctxMigrated),
    workspaceSnapshot(ctxLegacy),
    "workspace mismatch",
  );
}

describe("Stage B — package-input migration parity", () => {
  it("matches legacy on Item 234 (validate)", () => {
    assertParity(CHAPTER_234, "validate");
  });

  it("matches legacy on Item 234 (build)", () => {
    assertParity(CHAPTER_234, "build");
  });

  it("matches legacy on Item 330 (validate)", () => {
    assertParity(CHAPTER_330, "validate");
  });

  it("matches legacy on Item 330 (build)", () => {
    assertParity(CHAPTER_330, "build");
  });

  it("matches legacy error behavior on an empty chapter directory", () => {
    const emptyDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "lou-build-pkg-input-"),
    );
    try {
      assertParity(emptyDir, "validate");
      const ctxLegacy = createContext(emptyDir, "validate");
      const legacy = runPackageInputLegacy(ctxLegacy);
      assert.equal(legacy.ok, false);
      assert.ok(legacy.errors.length > 0);
      assert.ok(
        legacy.errors.some((e) => e.includes("source.meta.yaml")),
        "expected source.meta.yaml error",
      );
      assert.ok(
        legacy.errors.some((e) => e.includes("chapter package config")),
        "expected chapter.package.yaml error",
      );
      assert.ok(
        legacy.errors.some((e) => e.includes("projections manifest")),
        "expected projections.yaml error",
      );
    } finally {
      fs.rmSync(emptyDir, { recursive: true, force: true });
    }
  });

  it("does not mutate BuildContext.results", () => {
    const ctxLegacy = createContext(CHAPTER_234, "validate");
    const ctxMigrated = createContext(CHAPTER_234, "validate");

    runPackageInputLegacy(ctxLegacy);
    runPackageInput(ctxMigrated);

    assert.equal(ctxLegacy.results.size, 0);
    assert.equal(ctxMigrated.results.size, 0);
  });

  it("writes no files (read-only stage)", () => {
    const before = snapshotTree(CHAPTER_234);
    const ctx = createContext(CHAPTER_234, "build");
    runPackageInput(ctx);
    const after = snapshotTree(CHAPTER_234);
    assert.deepEqual(after, before);
  });
});

function snapshotTree(dir: string): Map<string, number> {
  const entries = new Map<string, number>();
  function walk(current: string): void {
    for (const name of fs.readdirSync(current)) {
      const abs = path.join(current, name);
      const stat = fs.statSync(abs);
      const rel = path.relative(dir, abs);
      entries.set(rel, stat.mtimeMs);
      if (stat.isDirectory()) walk(abs);
    }
  }
  walk(dir);
  return entries;
}
