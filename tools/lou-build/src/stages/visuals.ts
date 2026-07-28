import fs from "node:fs";
import { figureRelPathForElement } from "../../lib/claims.js";
import {
  buildVisualSpec,
  renderSvg,
  validateSvgStructure,
  figureAbsPath,
} from "../../lib/svg.js";
import type { BuildContext } from "../pipeline/context.js";
import type { Stage } from "../pipeline/stage.js";
import type { StageResult } from "../pipeline/stage.js";
import { ok, requireWorkspace, setWorkspace } from "../utils/stage-result.js";

function findBlueprintElement(
  blueprintData: {
    mechanisms?: { id: string }[];
    clinical_reasoning?: { id: string }[];
  },
  elementId: string,
) {
  for (const mec of blueprintData.mechanisms || []) {
    if (mec.id === elementId) return mec;
  }
  for (const cr of blueprintData.clinical_reasoning || []) {
    if (cr.id === elementId) return cr;
  }
  return null;
}

/**
 * Stage G — Visuels officiels — doc 19 §2, contrat 05.
 *
 * Migrated from lib/visuals.js — behavior must remain identical.
 */
export function runVisuals(ctx: BuildContext): StageResult {
  const paths = requireWorkspace<{ figuresDir: string }>(ctx, "paths");
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

  const rendered: unknown[] = [];
  const withheld: {
    elementId: string;
    state: string;
    reasons: string[];
    stale_asset_removed?: string;
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
    const spec = buildVisualSpec(element, inventory, sourceMeta);
    const absPath = figureAbsPath(paths.figuresDir, element.id);
    let svgText: string | null = null;

    if (fs.existsSync(absPath)) {
      svgText = fs.readFileSync(absPath, "utf8");
    } else {
      const renderedResult = renderSvg(spec) as {
        ok: boolean;
        errors?: string[];
        svg?: string;
      };
      if (!renderedResult.ok) {
        withheld.push({
          elementId: element.id,
          state: "withheld",
          reasons: renderedResult.errors || ["render failed"],
        });
        continue;
      }
      svgText = renderedResult.svg!;
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
      spec,
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
    const blueprintData = blueprint.data as {
      mechanisms?: { id: string }[];
      clinical_reasoning?: { id: string }[];
    };

    for (const vis of rendered as {
      elementId: string;
      absPath: string;
    }[]) {
      if (withheldIds.has(vis.elementId)) continue;
      const element = findBlueprintElement(blueprintData, vis.elementId);
      const renderedResult = renderSvg(
        buildVisualSpec(element, inventory, sourceMeta),
      ) as { ok: boolean; errors?: string[]; svg?: string };
      if (!renderedResult.ok) {
        withheld.push({
          elementId: vis.elementId,
          state: "withheld",
          reasons: renderedResult.errors || ["render failed"],
        });
        continue;
      }
      fs.writeFileSync(vis.absPath, renderedResult.svg!);
    }

    for (const w of withheld) {
      const absPath = figureAbsPath(paths.figuresDir, w.elementId);
      if (fs.existsSync(absPath)) {
        fs.rmSync(absPath);
        w.stale_asset_removed = figureRelPathForElement(w.elementId);
      }
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
