import type { BuildContext } from "../pipeline/context.js";
import type { Stage } from "../pipeline/stage.js";
import type { StageResult } from "../pipeline/stage.js";
import { fail, ok, requireWorkspace } from "../utils/stage-result.js";

/**
 * Stage I — Validation intégrée — doc 19 §2.
 *
 * Migrated from lib/validation.js — behavior must remain identical.
 */
export function runValidation(ctx: BuildContext): StageResult {
  const errors: string[] = [];

  const recon = requireWorkspace<{ ok: boolean; errors?: string[] }>(
    ctx,
    "reconciliation",
  );
  const bpVal = requireWorkspace<{ ok: boolean; errors?: string[] }>(
    ctx,
    "blueprintValidation",
  );
  const claims = requireWorkspace<{ ok: boolean; errors?: string[] }>(
    ctx,
    "claims",
  );
  const ground = requireWorkspace<{ ok: boolean; errors?: string[] }>(
    ctx,
    "grounding",
  );
  const anchors = requireWorkspace<{ ok: boolean; errors?: string[] }>(
    ctx,
    "anchors",
  );

  if (!recon.ok) errors.push(...(recon.errors || ["reconciliation FAIL"]));
  if (!bpVal.ok) errors.push(...(bpVal.errors || ["blueprint FAIL"]));
  if (!claims.ok) errors.push(...(claims.errors || ["claims FAIL"]));
  if (!ground.ok) errors.push(...(ground.errors || ["grounding FAIL"]));
  if (!anchors.ok) errors.push(...(anchors.errors || ["anchors FAIL"]));

  return errors.length === 0 ? ok({ gates: "PASS" }) : fail(errors);
}

/** Stage I — Validation intégrée du package (gates transversales). */
export const validationStage: Stage = {
  id: "validation",
  label: "Integrated validation",
  dependsOn: ["reconciliation", "blueprint", "projections", "visuals", "grounding"],
  run(ctx) {
    return runValidation(ctx);
  },
};
