/**
 * Stage E — Chapter Blueprint (legacy reference implementation).
 *
 * Migrated implementation lives in src/stages/blueprint.ts.
 * Blueprint parsing/validation remains in lib/blueprint.js.
 */

import fs from "node:fs";
import { parseBlueprint, validateBlueprint } from "./blueprint.js";

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
export function runBlueprint(ctx) {
  const paths = requireWorkspace(ctx, "paths");
  const invVal = requireWorkspace(ctx, "inventoryValidation");

  const blueprintRaw = fs.readFileSync(paths.blueprint, "utf8");
  const blueprint = parseBlueprint(paths.blueprint, blueprintRaw);
  const bpVal = validateBlueprint(blueprint, new Set(invVal.ids || []));

  ctx.workspace.blueprint = blueprint;
  ctx.workspace.blueprintValidation = bpVal;

  if (bpVal.ok) {
    return { ok: true, errors: [], data: bpVal };
  }
  return {
    ok: false,
    errors: bpVal.errors || ["blueprint validation failed"],
    data: bpVal,
  };
}
