import fs from "node:fs";
import path from "node:path";
import { loadYamlFile, validateAllAnchors, loadSourceBundle } from "./anchors.js";
import * as pathsModule from "./paths.js";
import { validateInventory } from "./inventory.js";
import { parseBlueprint, validateBlueprint } from "./blueprint.js";
import {
  loadAllProjectionClaimsSync,
  assembleTraceability,
  figureRelPathForElement,
} from "./claims.js";
import { reconcile, normalizeScope } from "./reconcile.js";
import {
  groundDeterministic,
  mergeSemanticGrounding,
  writeGroundingYaml,
} from "./ground.js";
import {
  buildVisualSpec,
  renderSvg,
  validateSvgStructure,
  figureAbsPath,
} from "./svg.js";
import {
  loadChapterPackage,
  loadProjectionsManifest,
} from "./chapter-config.js";

function findBlueprintElement(blueprintData, elementId) {
  for (const mec of blueprintData.mechanisms || []) {
    if (mec.id === elementId) return mec;
  }
  for (const cr of blueprintData.clinical_reasoning || []) {
    if (cr.id === elementId) return cr;
  }
  return null;
}

export function runValidation(chapterDir, options = {}) {
  const paths = pathsModule.chapterPaths(chapterDir);
  const errors = [];
  const steps = {};

  const pkg = loadChapterPackage(chapterDir);
  steps.packageConfig = pkg;
  if (!pkg.ok) errors.push(...pkg.errors);

  const projectionsManifest = loadProjectionsManifest(chapterDir);
  steps.projectionsManifest = projectionsManifest;
  if (!projectionsManifest.ok) errors.push(...projectionsManifest.errors);

  const sourceMeta = loadYamlFile(paths.sourceMeta);
  sourceMeta._path = paths.sourceMeta;
  const inventory = loadYamlFile(paths.inventory);
  const { text: sourceText } = pathsModule.loadSourceText(sourceMeta);

  const invVal = validateInventory(inventory, {
    requireSlice:
      pkg.config?.mode === "slice" && inventory.inventory_scope !== "full-chapter",
  });
  steps.inventory = invVal;
  if (!invVal.ok) errors.push(...invVal.errors);

  const blueprintRaw = fs.readFileSync(paths.blueprint, "utf8");
  const blueprint = parseBlueprint(paths.blueprint, blueprintRaw);
  const bpVal = validateBlueprint(blueprint, new Set(invVal.ids || []));
  steps.blueprint = bpVal;
  if (!bpVal.ok) errors.push(...bpVal.errors);

  const scopeExpected =
    pkg.config?.reconciliation?.scope_expected ||
    pkg.config?.reconciliation?.slice_scope_expected ||
    null;

  const recon = reconcile({
    reconciliationPath: paths.reconciliation,
    scopeExpected: scopeExpected ? normalizeScope(scopeExpected) : null,
    inventoryKpIds: new Set(invVal.ids || []),
  });
  steps.reconciliation = recon;
  if (!recon.ok) errors.push(...recon.errors);

  const claims = loadAllProjectionClaimsSync(chapterDir, inventory);
  steps.claims = claims;
  if (!claims.ok) errors.push(...claims.errors);

  let traceability = null;
  if (claims.ok) {
    traceability = assembleTraceability(claims.allClaims, inventory, sourceMeta);
    steps.traceability = { ok: true, count: Object.keys(traceability).length };
  }

  const groundDet = groundDeterministic({
    projectionResults: claims.projectionResults,
    inventory,
    sourceMeta,
  });
  const ground = mergeSemanticGrounding(groundDet, {
    projectionResults: claims.projectionResults,
    packageConfig: pkg.config || {},
  });
  steps.grounding = ground;
  if (!ground.ok) errors.push(...ground.errors);

  if (!options.skipAnchors) {
    const anchorVal = validateAllAnchors(sourceText, inventory, sourceMeta);
    steps.anchors = anchorVal;
    if (!anchorVal.ok) errors.push(...anchorVal.errors);
  } else {
    steps.anchors = { ok: true, errors: [], skipped: true };
  }

  const visualBuild = validateAndPreviewVisuals({
    chapterDir,
    paths,
    blueprint: blueprint.data,
    bpVal,
    inventory,
    sourceMeta,
    skipSvg: options.skipSvg,
    requiredVisualElements: pkg.config?.required_visual_elements || [],
  });
  steps.visuals = visualBuild;
  if (!visualBuild.ok) errors.push(...visualBuild.errors);

  for (const elementId of pkg.config?.required_visual_elements || []) {
    const el = findBlueprintElement(blueprint.data, elementId);
    if (!el?.visual_intent) {
      errors.push(`package: required visual element ${elementId} missing visual_intent`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    steps,
    paths,
    sourceMeta,
    inventory,
    blueprint,
    traceability,
    ground,
    packageConfig: pkg.config,
    projections: claims.projections || projectionsManifest.projections,
    visualBuild,
  };
}

function validateAndPreviewVisuals({
  paths,
  blueprint,
  bpVal,
  inventory,
  sourceMeta,
  skipSvg,
  requiredVisualElements,
}) {
  const errors = [];
  const rendered = [];
  const elements = bpVal.visualElements || [];

  for (const reqId of requiredVisualElements) {
    if (!elements.some((e) => e.id === reqId)) {
      errors.push(
        `package: required visual element ${reqId} not declared with visual_intent in blueprint`
      );
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
        errors.push(...renderedResult.errors);
        continue;
      }
      svgText = renderedResult.svg;
    }

    const svgVal = validateSvgStructure(svgText, element.id);
    if (!svgVal.ok) errors.push(...svgVal.errors);

    rendered.push({
      elementId: element.id,
      intent: element.visual_intent,
      absPath,
      relPath: figureRelPathForElement(element.id),
      svgText,
      spec,
    });
  }

  return { ok: errors.length === 0, errors, rendered, elements };
}

function invalidatePublishableState(paths) {
  if (fs.existsSync(paths.manifest)) {
    fs.unlinkSync(paths.manifest);
  }
}

function recordBuildFailure(paths, ground, errors) {
  fs.mkdirSync(paths.buildDir, { recursive: true });
  writeGroundingYaml(paths.grounding, {
    verdicts: ground?.verdicts || {},
    errors: errors || ground?.errors || ["build failed before grounding"],
    note:
      ground?.note ||
      "Build failed; prior publishable state invalidated.",
    status: "fail",
  });
}

function assembleManifest({
  inventory,
  sourceMeta,
  packageConfig,
  projections,
  reconciliation,
  visualBuild,
}) {
  const mode = packageConfig.mode || "slice";
  const manifest = {
    chapter: inventory.chapter,
    slug: packageConfig.slug,
    title: packageConfig.title,
    specialty: packageConfig.specialty,
    chapterLine: packageConfig.chapter_line || packageConfig.chapterLine,
    source_edition: sourceMeta.edition,
    trace_index: "build/traceability.json",
    known_absent: packageConfig.known_absent || [],
    projections: [],
    visuals: [],
  };

  if (mode === "slice") {
    if (inventory.slice) {
      manifest.slice = inventory.slice;
    }
    manifest.slice_reconciliation_invariant = "pass";
    manifest.slice_reconciliation_scope =
      reconciliation.scope ||
      reconciliation.result?.reconciliation_scope ||
      reconciliation.result?.slice_scope;
    manifest.slice_reconciliation_segments = reconciliation.requiredIds;
  } else {
    manifest.chapter_reconciliation_invariant = "pass";
    manifest.chapter_reconciliation_scope =
      reconciliation.scope ||
      reconciliation.result?.reconciliation_scope ||
      reconciliation.result?.slice_scope;
    manifest.chapter_reconciliation_segments = reconciliation.requiredIds;
  }

  const visualsByElement = new Map(
    (visualBuild.rendered || []).map((v) => [v.elementId, v])
  );

  for (const p of projections || []) {
    const entry = {
      id: p.id,
      type: p.type,
      family: p.family || "understanding",
      order: p.order,
      path: p.path,
      status: p.status || "published",
    };
    if (p.label) entry.label = p.label;
    if (p.elements) entry.elements = p.elements;
    if (p.visual_elements) {
      entry.visuals = {};
      for (const elementId of p.visual_elements) {
        const vis = visualsByElement.get(elementId);
        if (vis) entry.visuals[elementId] = vis.relPath;
      }
    }
    manifest.projections.push(entry);
  }

  for (const vis of visualBuild.rendered || []) {
    manifest.visuals.push({
      id: String(vis.elementId).toLowerCase(),
      element: vis.elementId,
      path: vis.relPath,
      alt: packageConfig.visual_alts?.[vis.elementId] || `${vis.elementId} diagram`,
    });
  }

  return manifest;
}

export function runBuild(chapterDir) {
  const paths = pathsModule.chapterPaths(chapterDir);
  invalidatePublishableState(paths);

  const validation = runValidation(chapterDir, { skipSvg: true });
  if (!validation.ok) {
    recordBuildFailure(paths, validation.ground, validation.errors);
    return { ok: false, errors: validation.errors, steps: validation.steps };
  }

  const {
    sourceMeta,
    inventory,
    blueprint,
    traceability,
    ground,
    packageConfig,
    projections,
    visualBuild,
    steps,
  } = validation;

  fs.mkdirSync(paths.buildDir, { recursive: true });
  fs.mkdirSync(paths.figuresDir, { recursive: true });

  for (const vis of visualBuild.rendered) {
    const element = findBlueprintElement(blueprint.data, vis.elementId);
    const renderedResult = renderSvg(
      buildVisualSpec(element, inventory, sourceMeta)
    );
    if (!renderedResult.ok) {
      recordBuildFailure(paths, ground, renderedResult.errors);
      return { ok: false, errors: renderedResult.errors };
    }
    fs.writeFileSync(vis.absPath, renderedResult.svg);
  }

  fs.writeFileSync(
    paths.traceability,
    JSON.stringify(traceability, null, 2) + "\n"
  );
  writeGroundingYaml(paths.grounding, ground);

  const manifest = assembleManifest({
    inventory,
    sourceMeta,
    packageConfig,
    projections,
    reconciliation: steps.reconciliation,
    visualBuild,
  });

  fs.writeFileSync(paths.manifest, JSON.stringify(manifest, null, 2) + "\n");

  return { ok: true, manifest, paths };
}

export { loadSourceBundle };
