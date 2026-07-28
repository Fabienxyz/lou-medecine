import fs from "node:fs";
import type { BuildContext } from "../pipeline/context.js";
import type { Stage } from "../pipeline/stage.js";
import type { StageResult } from "../pipeline/stage.js";
import { fail, ok, requireWorkspace } from "../utils/stage-result.js";

/**
 * Stage K — Publication — doc 19 §2, doc 17.
 *
 * Migrated from lib/publication.js — behavior must remain identical.
 */
export function runPublication(ctx: BuildContext): StageResult {
  const paths = requireWorkspace<{ manifest: string }>(ctx, "paths");
  const packaging = ctx.results.get("packaging");

  if (!ctx.mutate) {
    const validation = ctx.results.get("validation");
    return validation?.ok
      ? ok({ state: "ready", note: "validate mode — publication not emitted" })
      : fail(["validation failed — publication withheld"]);
  }

  if (!packaging?.ok) {
    if (fs.existsSync(paths.manifest)) {
      fs.unlinkSync(paths.manifest);
    }
    return fail(["publication withheld — packaging failed"]);
  }

  if (!fs.existsSync(paths.manifest)) {
    return fail(["publication withheld — manifest missing after packaging"]);
  }

  return ok({ state: "published", manifestPath: paths.manifest });
}

/** Stage K — Publication (état publié ou retenue). */
export const publicationStage: Stage = {
  id: "publication",
  label: "Publication",
  dependsOn: ["packaging"],
  run(ctx) {
    return runPublication(ctx);
  },
};
