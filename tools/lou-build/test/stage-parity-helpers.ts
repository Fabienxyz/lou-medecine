import assert from "node:assert/strict";
import type { BuildContext } from "../src/pipeline/context.js";
import type { StageResult } from "../src/pipeline/stage.js";

export function workspaceSnapshot(
  ctx: BuildContext,
): Record<string, unknown> {
  return structuredClone(ctx.workspace);
}

export function assertStageParity(
  legacy: StageResult,
  migrated: StageResult,
  ctxLegacy: BuildContext,
  ctxMigrated: BuildContext,
  label = "stage",
): void {
  assert.deepEqual(migrated.ok, legacy.ok, `${label}: ok mismatch`);
  assert.deepEqual(migrated.errors, legacy.errors, `${label}: errors mismatch`);
  assert.deepEqual(migrated.data, legacy.data, `${label}: data mismatch`);
  assert.deepEqual(
    workspaceSnapshot(ctxMigrated),
    workspaceSnapshot(ctxLegacy),
    `${label}: workspace mismatch`,
  );
}

export function assertResultsUntouched(ctx: BuildContext): void {
  assert.equal(ctx.results.size, 0);
}
