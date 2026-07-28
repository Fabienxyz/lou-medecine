import fs from "node:fs";
import { validateAllAnchors } from "../../lib/anchors.js";
import { loadSourceText } from "../../lib/paths.js";
import {
  groundDeterministic,
  mergeSemanticGrounding,
  writeGroundingYaml,
} from "../../lib/ground.js";
import { assembleTraceability } from "../../lib/claims.js";
import type { BuildContext } from "../pipeline/context.js";
import type { Stage } from "../pipeline/stage.js";
import type { StageResult } from "../pipeline/stage.js";
import { fail, ok, requireWorkspace, setWorkspace } from "../utils/stage-result.js";

/**
 * Stage H — Grounding et traçabilité — doc 19 §2, contrat 01 §7.
 *
 * Migrated from lib/grounding.js — behavior must remain identical.
 */
export function runGrounding(ctx: BuildContext): StageResult {
  const inventory = requireWorkspace<Record<string, unknown>>(ctx, "inventory");
  const sourceMeta = requireWorkspace<Record<string, unknown>>(
    ctx,
    "sourceMeta",
  );
  const claims = requireWorkspace<{
    ok: boolean;
    allClaims?: unknown[];
    projectionResults?: unknown[];
    errors?: string[];
  }>(ctx, "claims");
  const packageConfig = requireWorkspace<Record<string, unknown>>(
    ctx,
    "packageConfig",
  );

  if (!claims.ok) {
    return fail(claims.errors || ["claims not available for grounding"]);
  }

  const traceability = assembleTraceability(
    claims.allClaims!,
    inventory,
    sourceMeta,
  );

  const groundDet = groundDeterministic({
    projectionResults: claims.projectionResults,
    inventory,
    sourceMeta,
  });
  const ground = mergeSemanticGrounding(groundDet, {
    projectionResults: claims.projectionResults,
    packageConfig: packageConfig || {},
  });

  const { text: sourceText } = loadSourceText(sourceMeta);
  const anchorVal = validateAllAnchors(sourceText, inventory, sourceMeta);

  setWorkspace(ctx, "traceability", traceability);
  setWorkspace(ctx, "grounding", ground);
  setWorkspace(ctx, "anchors", anchorVal);

  if (ctx.mutate) {
    const paths = requireWorkspace<{
      buildDir: string;
      traceability: string;
      grounding: string;
    }>(ctx, "paths");
    fs.mkdirSync(paths.buildDir, { recursive: true });
    fs.writeFileSync(
      paths.traceability,
      JSON.stringify(traceability, null, 2) + "\n",
    );
    writeGroundingYaml(paths.grounding, ground);
  }

  const errors = [
    ...(ground.ok ? [] : ground.errors || []),
    ...(anchorVal.ok ? [] : anchorVal.errors || []),
  ];

  return errors.length === 0
    ? ok({ ground, traceability, anchors: anchorVal })
    : fail(errors, { ground, traceability, anchors: anchorVal });
}

/** Stage H — Grounding et traçabilité (validation distincte). */
export const groundingStage: Stage = {
  id: "grounding",
  label: "Grounding & traceability",
  dependsOn: ["projections"],
  run(ctx) {
    return runGrounding(ctx);
  },
};
