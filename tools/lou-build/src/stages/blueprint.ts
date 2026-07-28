import fs from "node:fs";
import { parseBlueprint, validateBlueprint } from "../../lib/blueprint.js";
import type { BuildContext } from "../pipeline/context.js";
import type { Stage } from "../pipeline/stage.js";
import type { StageResult } from "../pipeline/stage.js";
import { fail, ok, requireWorkspace, setWorkspace } from "../utils/stage-result.js";

/**
 * Stage E — Chapter Blueprint (curatif) — doc 19 §2, contrat 04 §5.
 *
 * Migrated from lib/blueprint-stage.js — behavior must remain identical.
 */
export function runBlueprint(ctx: BuildContext): StageResult {
  const paths = requireWorkspace<{ blueprint: string }>(ctx, "paths");
  const invVal = requireWorkspace<{ ids?: string[] }>(
    ctx,
    "inventoryValidation",
  );

  const blueprintRaw = fs.readFileSync(paths.blueprint, "utf8");
  const blueprint = parseBlueprint(paths.blueprint, blueprintRaw);
  const bpVal = validateBlueprint(blueprint, new Set(invVal.ids || []));

  setWorkspace(ctx, "blueprint", blueprint);
  setWorkspace(ctx, "blueprintValidation", bpVal);

  return bpVal.ok
    ? ok(bpVal)
    : fail(bpVal.errors || ["blueprint validation failed"], bpVal);
}

/** Stage E — Chapter Blueprint (curatif). */
export const blueprintStage: Stage = {
  id: "blueprint",
  label: "Chapter Blueprint",
  dependsOn: ["inventory", "reconciliation"],
  curative: true,
  run(ctx) {
    return runBlueprint(ctx);
  },
};
