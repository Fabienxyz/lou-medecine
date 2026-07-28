/**
 * Stage I — Validation (legacy reference implementation).
 *
 * Migrated implementation lives in src/stages/validation.ts.
 */

function requireWorkspace(ctx, key) {
  const value = ctx.workspace[key];
  if (value === undefined) {
    throw new Error(`Pipeline workspace missing required key: ${key}`);
  }
  return value;
}

/**
 * @param {{ chapterDir: string, command: string, mutate: boolean, workspace: Record<string, unknown> }} ctx
 * @returns {{ ok: boolean, errors: string[], data?: unknown }}
 */
export function runValidation(ctx) {
  const errors = [];

  const recon = requireWorkspace(ctx, "reconciliation");
  const bpVal = requireWorkspace(ctx, "blueprintValidation");
  const claims = requireWorkspace(ctx, "claims");
  const ground = requireWorkspace(ctx, "grounding");
  const anchors = requireWorkspace(ctx, "anchors");

  if (!recon.ok) errors.push(...(recon.errors || ["reconciliation FAIL"]));
  if (!bpVal.ok) errors.push(...(bpVal.errors || ["blueprint FAIL"]));
  if (!claims.ok) errors.push(...(claims.errors || ["claims FAIL"]));
  if (!ground.ok) errors.push(...(ground.errors || ["grounding FAIL"]));
  if (!anchors.ok) errors.push(...(anchors.errors || ["anchors FAIL"]));

  if (errors.length === 0) {
    return { ok: true, errors: [], data: { gates: "PASS" } };
  }
  return { ok: false, errors };
}
