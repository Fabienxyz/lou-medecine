import { loadYamlFile } from "../../lib/anchors.js";
import {
  loadChapterPackage,
  loadEvaluationRegistries,
  loadProjectionsManifest,
} from "../../lib/chapter-config.js";
import { chapterPaths } from "../../lib/paths.js";
import type { BuildContext } from "../pipeline/context.js";
import type { Stage } from "../pipeline/stage.js";
import type { StageResult } from "../pipeline/stage.js";
import { fail, ok, setWorkspace } from "../utils/stage-result.js";

/**
 * Stage B — Entrée package (normalisation) — doc 19 §2, contrat 04.
 *
 * Migrated from lib/package-input.js — behavior must remain identical.
 */
export function runPackageInput(ctx: BuildContext): StageResult {
  const paths = chapterPaths(ctx.chapterDir);
  const errors: string[] = [];

  const pkg = loadChapterPackage(ctx.chapterDir);
  const projectionsManifest = loadProjectionsManifest(ctx.chapterDir);
  const evaluation = pkg.config
    ? loadEvaluationRegistries(ctx.chapterDir, pkg.config)
    : {
        ok: true,
        errors: [] as string[],
        evaluationConfig: null,
        questions: [],
        scenarios: [],
        questionsRegistryPath: null,
        scenariosRegistryPath: null,
      };

  let sourceMeta: Record<string, unknown> | null = null;
  try {
    sourceMeta = loadYamlFile(paths.sourceMeta) as Record<string, unknown>;
    sourceMeta._path = paths.sourceMeta;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    errors.push(`source.meta.yaml: ${message}`);
  }

  if (!pkg.ok) errors.push(...pkg.errors);
  if (!projectionsManifest.ok) errors.push(...projectionsManifest.errors);
  if (!evaluation.ok) errors.push(...evaluation.errors);

  setWorkspace(ctx, "paths", paths);
  setWorkspace(ctx, "packageConfig", pkg.config);
  setWorkspace(ctx, "projectionsManifest", projectionsManifest);
  setWorkspace(ctx, "evaluation", evaluation);
  setWorkspace(ctx, "sourceMeta", sourceMeta);

  return errors.length === 0
    ? ok({ pkg, projectionsManifest, evaluation, sourceMeta })
    : fail(errors);
}

/** Stage B — Entrée package (normalisation). */
export const packageInputStage: Stage = {
  id: "package-input",
  label: "Package input",
  dependsOn: [],
  run(ctx) {
    return runPackageInput(ctx);
  },
};
