import fs from "node:fs";
import {
  assembleManifest,
  invalidatePublishableState,
  publishCollegeSource,
} from "../../lib/package.js";
import { loadPreviousManifest } from "../../lib/release-identity.js";
import type { BuildContext } from "../pipeline/context.js";
import type { Stage } from "../pipeline/stage.js";
import type { StageResult } from "../pipeline/stage.js";
import { ok, requireWorkspace } from "../utils/stage-result.js";

/**
 * Stage J — Packaging — doc 19 §2, contrat 04 §10.
 *
 * Migrated from lib/packaging-stage.js — behavior must remain identical.
 */
export function runPackaging(ctx: BuildContext): StageResult {
  if (!ctx.mutate) {
    return ok({ skipped: true, reason: "validate mode — no manifest write" });
  }

  const paths = requireWorkspace<{ manifest: string; chapterDir: string }>(
    ctx,
    "paths",
  );
  const inventory = requireWorkspace<Record<string, unknown>>(ctx, "inventory");
  const sourceMeta = requireWorkspace<Record<string, unknown>>(
    ctx,
    "sourceMeta",
  );
  const packageConfig = requireWorkspace<Record<string, unknown>>(
    ctx,
    "packageConfig",
  );
  const projectionsManifest = requireWorkspace<{
    projections?: unknown[];
  }>(ctx, "projectionsManifest");
  const reconciliation = requireWorkspace<Record<string, unknown>>(
    ctx,
    "reconciliation",
  );
  const visualBuild = requireWorkspace<Record<string, unknown>>(
    ctx,
    "visualBuild",
  );
  // Optional: comprehension-only packages may omit evaluation registries.
  const evaluation = (ctx.workspace?.evaluation || {
    questions: [],
    scenarios: [],
    evaluationConfig: null,
  }) as {
    questions?: unknown[];
    scenarios?: unknown[];
    evaluationConfig?: Record<string, unknown> | null;
  };

  // Capture prior identity before invalidation removes manifest.json.
  const previousManifest = loadPreviousManifest(paths.chapterDir);

  invalidatePublishableState(paths);

  publishCollegeSource(paths.chapterDir, sourceMeta);

  const manifest = assembleManifest({
    chapterDir: paths.chapterDir,
    inventory,
    sourceMeta,
    packageConfig,
    projections: projectionsManifest.projections,
    reconciliation,
    visualBuild,
    evaluation,
    previousManifest,
  });

  fs.writeFileSync(paths.manifest, JSON.stringify(manifest, null, 2) + "\n");

  return ok({
    manifest,
    withheldVisuals: (visualBuild.withheld as unknown[]) || [],
  });
}

/** Stage J — Packaging (manifest + sidecars). */
export const packagingStage: Stage = {
  id: "packaging",
  label: "Packaging",
  dependsOn: ["validation"],
  run(ctx) {
    return runPackaging(ctx);
  },
};
