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

  // An Official Visual is optional pedagogical support, not the canonical explanation
  // (IMPLEMENTATION_CONTRACT.md Part B / C.6). A visual that cannot be produced or validated is
  // therefore withheld and reported — it never withholds an otherwise valid Guided Walkthrough, so
  // nothing here reaches `errors`. Every other gate still blocks as before.
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
  const rendered = [];
  const withheld = [];
  const elements = bpVal.visualElements || [];
  const activated = new Set(elements.map((e) => e.id));

  // `visual_plan` is the Blueprint's canonical declaration of which elements warrant an Official
  // Visual; `visual_intent` activates the subset the current renderer supports. A planned element
  // that is not activated is reported as declared-but-unbuilt, never as a build failure. An element
  // absent from `visual_plan` warrants no visual at all, which is a correct and frequent outcome
  // (VISUAL_GRAMMAR_CONTRACT.md I8) and needs no entry.
  const planned = [];
  for (const entry of blueprint.visual_plan || []) {
    if (entry?.element && !activated.has(entry.element)) {
      planned.push({ elementId: entry.element, intent: entry.intent || null });
    }
  }

  for (const reqId of requiredVisualElements) {
    if (!activated.has(reqId)) {
      withheld.push({
        elementId: reqId,
        state: "planned-not-built",
        reasons: [
          `declared in required_visual_elements but not activated with visual_intent in blueprint`,
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
          reasons: renderedResult.errors,
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
        reasons: svgVal.errors,
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

  return {
    ok: withheld.length === 0,
    errors: [],
    withheld,
    planned,
    rendered,
    elements,
  };
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
      // Alt text is derived from the specification, never authored here (I1). The authored
      // `visual_alts` entry is itself spec-derived prose reviewed once; the fallback is the
      // element's own step labels.
      alt:
        packageConfig.visual_alts?.[vis.elementId] ||
        (vis.spec?.steps || []).map((s) => s.label).join(" → "),
    });
  }

  // Official Visual availability, in the three states the renderer must distinguish (C.6). An
  // element absent from this list warrants no visual: a correct outcome, not a gap.
  const availability = new Map();
  for (const vis of visualBuild.rendered || []) {
    availability.set(vis.elementId, { element: vis.elementId, state: "published" });
  }
  for (const p of visualBuild.planned || []) {
    if (!availability.has(p.elementId)) {
      availability.set(p.elementId, {
        element: p.elementId,
        state: "planned-not-built",
        intent: p.intent,
      });
    }
  }
  for (const w of visualBuild.withheld || []) {
    availability.set(w.elementId, {
      element: w.elementId,
      state: w.state,
      reasons: w.reasons,
    });
  }
  manifest.official_visuals = [...availability.values()];

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

  // A withheld Official Visual must not leave an asset behind pretending to be current, and must
  // not withhold the block's Guided Walkthrough (C.6 publication behaviour).
  const withheld = [...(visualBuild.withheld || [])];

  for (const vis of visualBuild.rendered) {
    const element = findBlueprintElement(blueprint.data, vis.elementId);
    const renderedResult = renderSvg(
      buildVisualSpec(element, inventory, sourceMeta)
    );
    if (!renderedResult.ok) {
      withheld.push({
        elementId: vis.elementId,
        state: "withheld",
        reasons: renderedResult.errors,
      });
      continue;
    }
    fs.writeFileSync(vis.absPath, renderedResult.svg);
  }

  const withheldIds = new Set(withheld.map((w) => w.elementId));
  const published = visualBuild.rendered.filter(
    (v) => !withheldIds.has(v.elementId)
  );
  for (const w of withheld) {
    const absPath = figureAbsPath(paths.figuresDir, w.elementId);
    if (fs.existsSync(absPath)) {
      fs.rmSync(absPath);
      w.stale_asset_removed = figureRelPathForElement(w.elementId);
    }
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
    visualBuild: { ...visualBuild, rendered: published, withheld },
  });

  fs.writeFileSync(paths.manifest, JSON.stringify(manifest, null, 2) + "\n");

  return { ok: true, manifest, paths, withheldVisuals: withheld };
}

export { loadSourceBundle, assembleManifest, invalidatePublishableState };
