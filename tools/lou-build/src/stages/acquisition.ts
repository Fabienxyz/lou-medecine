import type { BuildContext } from "../pipeline/context.js";
import type { Stage } from "../pipeline/stage.js";
import type { StageResult } from "../pipeline/stage.js";
import { ok } from "../utils/stage-result.js";

/**
 * Stage A — Acquisition (contrat 03 / doc 19 §2).
 *
 * Migrated from lib/acquisition.js — behavior must remain identical.
 * Tool 01/02 produce acquisition artefacts upstream; chapter validate/build
 * consumes qualified chapter files via Stage B.
 */
export function runAcquisition(ctx: BuildContext): StageResult {
  void ctx;
  return ok({
    note: "Acquisition is handled upstream by Tool 01/02 (contrat 03).",
  });
}

/** Stage A — Acquisition. */
export const acquisitionStage: Stage = {
  id: "acquisition",
  label: "Acquisition",
  dependsOn: [],
  run(ctx) {
    return runAcquisition(ctx);
  },
};
