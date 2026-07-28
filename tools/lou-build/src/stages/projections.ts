import { loadAllProjectionClaimsSync } from "../../lib/claims.js";
import type { BuildContext } from "../pipeline/context.js";
import type { Stage } from "../pipeline/stage.js";
import type { StageResult } from "../pipeline/stage.js";
import { fail, ok, requireWorkspace, setWorkspace } from "../utils/stage-result.js";

/**
 * Stage F — Génération des projections — doc 19 §2, contrat 04 §7.
 *
 * Migrated from lib/projections.js — behavior must remain identical.
 */
export function runProjections(ctx: BuildContext): StageResult {
  const inventory = requireWorkspace<Record<string, unknown>>(
    ctx,
    "inventory",
  );

  const claims = loadAllProjectionClaimsSync(ctx.chapterDir, inventory);

  setWorkspace(ctx, "claims", claims);

  return claims.ok
    ? ok(claims)
    : fail(claims.errors || ["projection claims validation failed"], claims);
}

/** Stage F — Génération des projections (généré). */
export const projectionsStage: Stage = {
  id: "projections",
  label: "Projections",
  dependsOn: ["blueprint"],
  parallelWith: ["visuals"],
  run(ctx) {
    return runProjections(ctx);
  },
};
