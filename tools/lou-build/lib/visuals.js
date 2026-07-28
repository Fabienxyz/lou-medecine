/**
 * Stage G — Visuals (legacy reference implementation).
 *
 * Migrated implementation lives in src/stages/visuals.ts.
 * Visual rendering remains in lib/svg.js.
 */

import fs from "node:fs";
import { figureRelPathForElement } from "./claims.js";
import {
  buildVisualSpec,
  renderSvg,
  validateSvgStructure,
  figureAbsPath,
} from "./svg.js";

function requireWorkspace(ctx, key) {
  const value = ctx.workspace[key];
  if (value === undefined) {
    throw new Error(`Pipeline workspace missing required key: ${key}`);
  }
  return value;
}

function findBlueprintElement(blueprintData, elementId) {
  for (const mec of blueprintData.mechanisms || []) {
    if (mec.id === elementId) return mec;
  }
  for (const cr of blueprintData.clinical_reasoning || []) {
    if (cr.id === elementId) return cr;
  }
  return null;
}

/**
 * @param {{ chapterDir: string, command: string, mutate: boolean, workspace: Record<string, unknown> }} ctx
 * @returns {{ ok: boolean, errors: string[], data?: unknown }}
 */
export function runVisuals(ctx) {
  const paths = requireWorkspace(ctx, "paths");
  const blueprint = requireWorkspace(ctx, "blueprint");
  const bpVal = requireWorkspace(ctx, "blueprintValidation");
  const inventory = requireWorkspace(ctx, "inventory");
  const sourceMeta = requireWorkspace(ctx, "sourceMeta");
  const packageConfig = requireWorkspace(ctx, "packageConfig");

  const rendered = [];
  const withheld = [];
  const elements = bpVal.visualElements || [];
  const activated = new Set(elements.map((e) => e.id));

  const planned = [];
  for (const entry of blueprint.data.visual_plan || []) {
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
    let svgText = null;

    if (fs.existsSync(absPath)) {
      svgText = fs.readFileSync(absPath, "utf8");
    } else {
      const renderedResult = renderSvg(spec);
      if (!renderedResult.ok) {
        withheld.push({
          elementId: element.id,
          state: "withheld",
          reasons: renderedResult.errors || ["render failed"],
        });
        continue;
      }
      svgText = renderedResult.svg;
    }

    const svgVal = validateSvgStructure(svgText, element.id);
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
    errors: [],
    withheld,
    planned,
    rendered,
    elements,
  };

  ctx.workspace.visualBuild = visualBuild;

  if (ctx.mutate) {
    fs.mkdirSync(paths.figuresDir, { recursive: true });
    const withheldIds = new Set(withheld.map((w) => w.elementId));

    for (const vis of rendered) {
      if (withheldIds.has(vis.elementId)) continue;
      const element = findBlueprintElement(blueprint.data, vis.elementId);
      const renderedResult = renderSvg(
        buildVisualSpec(element, inventory, sourceMeta),
      );
      if (!renderedResult.ok) {
        withheld.push({
          elementId: vis.elementId,
          state: "withheld",
          reasons: renderedResult.errors || ["render failed"],
        });
        continue;
      }
      fs.writeFileSync(vis.absPath, renderedResult.svg);
    }

    for (const w of withheld) {
      const absPath = figureAbsPath(paths.figuresDir, w.elementId);
      if (fs.existsSync(absPath)) {
        fs.rmSync(absPath);
        w.stale_asset_removed = figureRelPathForElement(w.elementId);
      }
    }

    visualBuild.rendered = rendered.filter((v) => !withheldIds.has(v.elementId));
    visualBuild.withheld = withheld;
  }

  return { ok: true, errors: [], data: visualBuild };
}
