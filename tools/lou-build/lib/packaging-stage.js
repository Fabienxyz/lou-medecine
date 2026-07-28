/**
 * Stage J — Packaging (legacy reference implementation).
 *
 * Migrated implementation lives in src/stages/packaging.ts.
 * Manifest assembly remains in lib/package.js.
 */

import fs from "node:fs";
import { assembleManifest, invalidatePublishableState } from "./package.js";

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
export function runPackaging(ctx) {
  if (!ctx.mutate) {
    return {
      ok: true,
      errors: [],
      data: { skipped: true, reason: "validate mode — no manifest write" },
    };
  }

  const paths = requireWorkspace(ctx, "paths");
  const inventory = requireWorkspace(ctx, "inventory");
  const sourceMeta = requireWorkspace(ctx, "sourceMeta");
  const packageConfig = requireWorkspace(ctx, "packageConfig");
  const projectionsManifest = requireWorkspace(ctx, "projectionsManifest");
  const reconciliation = requireWorkspace(ctx, "reconciliation");
  const visualBuild = requireWorkspace(ctx, "visualBuild");

  invalidatePublishableState(paths);

  const manifest = assembleManifest({
    inventory,
    sourceMeta,
    packageConfig,
    projections: projectionsManifest.projections,
    reconciliation,
    visualBuild,
  });

  fs.writeFileSync(paths.manifest, JSON.stringify(manifest, null, 2) + "\n");

  return {
    ok: true,
    errors: [],
    data: {
      manifest,
      withheldVisuals: visualBuild.withheld || [],
    },
  };
}
