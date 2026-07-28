/**
 * Stage F — Projections (legacy reference implementation).
 *
 * Migrated implementation lives in src/stages/projections.ts.
 * Claim loading remains in lib/claims.js.
 */

import { loadAllProjectionClaimsSync } from "./claims.js";

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
export function runProjections(ctx) {
  const inventory = requireWorkspace(ctx, "inventory");

  const claims = loadAllProjectionClaimsSync(ctx.chapterDir, inventory);

  ctx.workspace.claims = claims;

  if (claims.ok) {
    return { ok: true, errors: [], data: claims };
  }
  return {
    ok: false,
    errors: claims.errors || ["projection claims validation failed"],
    data: claims,
  };
}
