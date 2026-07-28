/**
 * Stage B — Package input (legacy reference implementation).
 *
 * Migrated implementation lives in src/stages/package-input.ts.
 * Shared loaders remain in lib/chapter-config.js, lib/paths.js, lib/anchors.js.
 */

import { loadYamlFile } from "./anchors.js";
import {
  loadChapterPackage,
  loadProjectionsManifest,
} from "./chapter-config.js";
import { chapterPaths } from "./paths.js";

/**
 * @param {{ chapterDir: string, command: string, mutate: boolean, workspace: Record<string, unknown> }} ctx
 * @returns {{ ok: boolean, errors: string[], data?: unknown }}
 */
export function runPackageInput(ctx) {
  const paths = chapterPaths(ctx.chapterDir);
  const errors = [];

  const pkg = loadChapterPackage(ctx.chapterDir);
  const projectionsManifest = loadProjectionsManifest(ctx.chapterDir);

  let sourceMeta = null;
  try {
    sourceMeta = loadYamlFile(paths.sourceMeta);
    sourceMeta._path = paths.sourceMeta;
  } catch (e) {
    errors.push(`source.meta.yaml: ${e.message}`);
  }

  if (!pkg.ok) errors.push(...pkg.errors);
  if (!projectionsManifest.ok) errors.push(...projectionsManifest.errors);

  ctx.workspace.paths = paths;
  ctx.workspace.packageConfig = pkg.config;
  ctx.workspace.projectionsManifest = projectionsManifest;
  ctx.workspace.sourceMeta = sourceMeta;

  if (errors.length === 0) {
    return {
      ok: true,
      errors: [],
      data: { pkg, projectionsManifest, sourceMeta },
    };
  }
  return { ok: false, errors };
}
