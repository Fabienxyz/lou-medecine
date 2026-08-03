import fs from "node:fs";
import path from "node:path";
import { figureRelPathForElement } from "../../lib/claims.js";
import { findBlueprintElementById } from "../../lib/blueprint.js";
import {
  buildVisualSpec,
  renderSvg,
  validateSvgStructure,
  figureAbsPath,
} from "../../lib/svg.js";
import {
  loadVisualSpec,
  visualSpecFilePath,
} from "../../lib/visual-spec.js";
import { renderVisualSpec } from "../../lib/visual-render.js";
import { loadVisualGroundingReview } from "../../lib/visual-ground.js";
import type { BuildContext } from "../pipeline/context.js";
import type { Stage } from "../pipeline/stage.js";
import type { StageResult } from "../pipeline/stage.js";
import { ok, requireWorkspace, setWorkspace } from "../utils/stage-result.js";

type RenderEngine = "v1-process-flow" | "v2-visual-spec";

type ElementVisualResult =
  | { ok: true; svg: string; engine: RenderEngine }
  | { ok: false; errors: string[]; engine: RenderEngine | null };

function renderElementVisual(
  element: Record<string, unknown>,
  opts: {
    buildDir: string;
    inventory: Record<string, unknown>;
    sourceMeta: Record<string, unknown>;
    review: ReturnType<typeof loadVisualGroundingReview>;
  },
): ElementVisualResult {
  const elementId = String(element.id);
  const specPath = visualSpecFilePath(opts.buildDir, elementId);

  if (fs.existsSync(specPath)) {
    const spec = loadVisualSpec(specPath);
    const result = renderVisualSpec({
      spec,
      inventory: opts.inventory,
      sourceMeta: opts.sourceMeta,
      review: opts.review,
    });
    if (!result.ok) {
      return {
        ok: false,
        errors: result.errors || ["visual-spec render failed"],
        engine: "v2-visual-spec",
      };
    }
    return {
      ok: true,
      svg: result.svg!,
      engine: "v2-visual-spec",
    };
  }

  const spec = buildVisualSpec(element, opts.inventory, opts.sourceMeta);
  const result = renderSvg(spec) as {
    ok: boolean;
    errors?: string[];
    svg?: string;
  };
  if (!result.ok) {
    return {
      ok: false,
      errors: result.errors || ["render failed"],
      engine: "v1-process-flow",
    };
  }
  return {
    ok: true,
    svg: result.svg!,
    engine: "v1-process-flow",
  };
}

/**
 * Stage G — Visuels officiels — doc 19 §2, contrat 05.
 */
export function runVisuals(ctx: BuildContext): StageResult {
  const paths = requireWorkspace<{ figuresDir: string; buildDir: string }>(
    ctx,
    "paths",
  );
  const blueprint = requireWorkspace<{ data: Record<string, unknown> }>(
    ctx,
    "blueprint",
  );
  const bpVal = requireWorkspace<{
    visualElements?: {
      id: string;
      visual_intent?: string;
    }[];
  }>(ctx, "blueprintValidation");
  const inventory = requireWorkspace<Record<string, unknown>>(ctx, "inventory");
  const sourceMeta = requireWorkspace<Record<string, unknown>>(
    ctx,
    "sourceMeta",
  );
  const packageConfig = requireWorkspace<{
    required_visual_elements?: string[];
  }>(ctx, "packageConfig");

  const review = loadVisualGroundingReview(
    path.join(paths.buildDir, "visual-grounding-review.yaml"),
  );
  const renderOpts = {
    buildDir: paths.buildDir,
    inventory,
    sourceMeta,
    review,
  };

  const rendered: unknown[] = [];
  const withheld: {
    elementId: string;
    state: string;
    reasons: string[];
  }[] = [];
  const elements = bpVal.visualElements || [];
  const activated = new Set(elements.map((e) => e.id));

  const planned: { elementId: string; intent: string | null }[] = [];
  for (const entry of (blueprint.data.visual_plan as
    | { element?: string; intent?: string }[]
    | undefined) || []) {
    if (entry?.element && !activated.has(entry.element)) {
      planned.push({ elementId: entry.element, intent: entry.intent || null });
    }
  }

  for (const reqId of packageConfig?.required_visual_elements || []) {
    if (!activated.has(reqId)) {
      withheld.push({
        elementId: reqId,
        state: "planned-not-built",
        reasons: [
          "declared in required_visual_elements but not activated with visual_intent in blueprint",
        ],
      });
    }
  }

  for (const element of elements) {
    const absPath = figureAbsPath(paths.figuresDir, element.id);
    let svgText: string | null = null;
    let engine: RenderEngine | null = null;

    if (!ctx.mutate && fs.existsSync(absPath)) {
      svgText = fs.readFileSync(absPath, "utf8");
    } else {
      const blueprintElement =
        findBlueprintElementById(blueprint.data, element.id) || element;
      const renderedResult = renderElementVisual(
        blueprintElement as Record<string, unknown>,
        renderOpts,
      );
      if (!renderedResult.ok) {
        withheld.push({
          elementId: element.id,
          state: "withheld",
          reasons: renderedResult.errors || ["render failed"],
        });
        continue;
      }
      svgText = renderedResult.svg;
      engine = renderedResult.engine;
    }

    const svgVal = validateSvgStructure(svgText, element.id) as {
      ok: boolean;
      errors?: string[];
    };
    if (!svgVal.ok) {
      withheld.push({
        elementId: element.id,
        state: "withheld",
        reasons: svgVal.errors || ["svg validation failed"],
      });
      continue;
    }

    rendered.push({
      elementId: element.id,
      intent: element.visual_intent,
      absPath,
      relPath: figureRelPathForElement(element.id),
      svgText,
      engine,
    });
  }

  const visualBuild = {
    ok: withheld.length === 0,
    errors: [] as string[],
    withheld,
    planned,
    rendered,
    elements,
  };

  setWorkspace(ctx, "visualBuild", visualBuild);

  if (ctx.mutate) {
    fs.mkdirSync(paths.figuresDir, { recursive: true });
    const withheldIds = new Set(withheld.map((w) => w.elementId));

    for (const vis of rendered as {
      elementId: string;
      absPath: string;
      engine?: RenderEngine | null;
    }[]) {
      if (withheldIds.has(vis.elementId)) continue;

      const blueprintElement = findBlueprintElementById(
        blueprint.data,
        vis.elementId,
      );
      if (!blueprintElement) {
        withheld.push({
          elementId: vis.elementId,
          state: "withheld",
          reasons: [`blueprint element not found: ${vis.elementId}`],
        });
        withheldIds.add(vis.elementId);
        continue;
      }

      const renderedResult = renderElementVisual(
        blueprintElement as Record<string, unknown>,
        renderOpts,
      );
      if (!renderedResult.ok) {
        withheld.push({
          elementId: vis.elementId,
          state: "withheld",
          reasons: renderedResult.errors || ["render failed"],
        });
        withheldIds.add(vis.elementId);
        continue;
      }

      fs.writeFileSync(vis.absPath, renderedResult.svg);
    }

    visualBuild.rendered = (rendered as { elementId: string }[]).filter(
      (v) => !withheldIds.has(v.elementId),
    );
    visualBuild.withheld = withheld;
  }

  return ok(visualBuild);
}

/** Stage G — Génération des visuels officiels (non bloquant si withheld). */
export const visualsStage: Stage = {
  id: "visuals",
  label: "Official visuals",
  dependsOn: ["blueprint"],
  parallelWith: ["projections"],
  blocking: false,
  run(ctx) {
    return runVisuals(ctx);
  },
};
