/**
 * Stage H — Grounding (legacy reference implementation).
 *
 * Migrated implementation lives in src/stages/grounding.ts.
 * Grounding logic remains in lib/ground.js and lib/claims.js.
 */

import fs from "node:fs";
import { validateAllAnchors } from "./anchors.js";
import { loadSourceText } from "./paths.js";
import {
  groundDeterministic,
  mergeSemanticGrounding,
  writeGroundingYaml,
} from "./ground.js";
import { assembleTraceability } from "./claims.js";

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
export function runGrounding(ctx) {
  const inventory = requireWorkspace(ctx, "inventory");
  const sourceMeta = requireWorkspace(ctx, "sourceMeta");
  const claims = requireWorkspace(ctx, "claims");
  const packageConfig = requireWorkspace(ctx, "packageConfig");

  if (!claims.ok) {
    return {
      ok: false,
      errors: claims.errors || ["claims not available for grounding"],
    };
  }

  const traceability = assembleTraceability(
    claims.allClaims,
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

  ctx.workspace.traceability = traceability;
  ctx.workspace.grounding = ground;
  ctx.workspace.anchors = anchorVal;

  if (ctx.mutate) {
    const paths = requireWorkspace(ctx, "paths");
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

  if (errors.length === 0) {
    return {
      ok: true,
      errors: [],
      data: { ground, traceability, anchors: anchorVal },
    };
  }
  return {
    ok: false,
    errors,
    data: { ground, traceability, anchors: anchorVal },
  };
}
