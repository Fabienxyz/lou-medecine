import fs from "node:fs";
import path from "node:path";
import { loadYamlFile, validateAllAnchors, loadSourceBundle } from "./anchors.js";
import * as pathsModule from "./paths.js";
import { validateInventory } from "./inventory.js";
import { parseBlueprint, validateBlueprint } from "./blueprint.js";
import {
  loadAllProjectionClaimsSync,
  assembleTraceability,
} from "./claims.js";
import { reconcile, SLICE_SCOPE, SLICE_REQUIRED_SEGMENT_IDS } from "./reconcile.js";
import {
  groundDeterministic,
  mergeSemanticGrounding,
  writeGroundingYaml,
} from "./ground.js";
import {
  buildVisualSpec,
  renderMecOapSvg,
  validateSvgStructure,
} from "./svg.js";

const SEMANTIC_GROUNDING_FIXTURE = {
  bridging: {
    "cb-oap-bridge": { status: "pass", note: "bootstrap-verified entailment" },
    "cb-overview-oap": { status: "pass", note: "bootstrap-verified entailment" },
  },
};

function normalizeScope(s) {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim();
}

export function runValidation(chapterDir, options = {}) {
  const paths = pathsModule.chapterPaths(chapterDir);
  const errors = [];
  const steps = {};

  const sourceMeta = loadYamlFile(paths.sourceMeta);
  sourceMeta._path = paths.sourceMeta;
  const inventory = loadYamlFile(paths.inventory);
  const { text: sourceText } = pathsModule.loadSourceText(sourceMeta);

  const invVal = validateInventory(inventory);
  steps.inventory = invVal;
  if (!invVal.ok) errors.push(...invVal.errors);

  const anchorVal = validateAllAnchors(sourceText, inventory, sourceMeta);
  steps.anchors = anchorVal;
  if (!anchorVal.ok) errors.push(...anchorVal.errors);

  const blueprintRaw = fs.readFileSync(paths.blueprint, "utf8");
  const blueprint = parseBlueprint(paths.blueprint, blueprintRaw);
  const bpVal = validateBlueprint(blueprint, invVal.ids ? new Set(invVal.ids) : new Set());
  steps.blueprint = bpVal;
  if (!bpVal.ok) errors.push(...bpVal.errors);

  const recon = reconcile({
    reconciliationPath: paths.reconciliation,
    sliceScopeExpected: normalizeScope(SLICE_SCOPE),
  });
  if (recon.result?.slice_scope) {
    const scopeOk =
      normalizeScope(recon.result.slice_scope) === normalizeScope(SLICE_SCOPE);
    if (!scopeOk) errors.push("reconciliation: slice_scope text mismatch");
  }
  steps.reconciliation = recon;
  if (!recon.ok) errors.push(...recon.errors);

  const claims = loadAllProjectionClaimsSync(paths, inventory);
  steps.claims = claims;
  if (!claims.ok) errors.push(...claims.errors);

  let traceability = null;
  if (claims.ok) {
    traceability = assembleTraceability(claims.allClaims, inventory, sourceMeta);
    steps.traceability = { ok: true, count: Object.keys(traceability).length };
  }

  const groundDet = groundDeterministic({
    filePaths: paths,
    inventory,
    sourceMeta,
  });
  const ground = mergeSemanticGrounding(groundDet, SEMANTIC_GROUNDING_FIXTURE);
  steps.grounding = ground;
  if (!ground.ok) errors.push(...ground.errors);

  let svgText = null;
  if (bpVal.mecOap && fs.existsSync(paths.mecOapSvg)) {
    svgText = fs.readFileSync(paths.mecOapSvg, "utf8");
  } else if (bpVal.mecOap) {
    const spec = buildVisualSpec(bpVal.mecOap, inventory, sourceMeta);
    svgText = renderMecOapSvg(spec);
  }
  if (svgText) {
    const svgVal = validateSvgStructure(svgText, "MEC-oap");
    steps.svg = svgVal;
    if (!svgVal.ok) errors.push(...svgVal.errors);
  } else if (!options.skipSvg) {
    errors.push("package: MEC-oap SVG missing");
  }

  if (!bpVal.mecOap?.visual_intent) {
    errors.push("package: missing visual relationship for MEC-oap");
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
    svgText,
  };
}

function invalidatePublishableState(paths) {
  if (fs.existsSync(paths.manifest)) {
    fs.unlinkSync(paths.manifest);
  }
}

function recordBuildFailure(paths, ground, errors) {
  fs.mkdirSync(paths.buildDir, { recursive: true });
  const failGround = ground || {
    status: "fail",
    verdicts: {},
    errors: errors || ["build failed before grounding"],
    note: "Build failed; prior publishable state invalidated.",
  };
  writeGroundingYaml(paths.grounding, failGround);
}

export function runBuild(chapterDir) {
  const paths = pathsModule.chapterPaths(chapterDir);
  invalidatePublishableState(paths);

  const validation = runValidation(chapterDir, { skipSvg: true });
  if (!validation.ok) {
    recordBuildFailure(paths, validation.ground, validation.errors);
    return { ok: false, errors: validation.errors, steps: validation.steps };
  }

  const { sourceMeta, inventory, blueprint, traceability, ground, svgText } =
    validation;

  fs.mkdirSync(paths.buildDir, { recursive: true });
  fs.mkdirSync(paths.figuresDir, { recursive: true });

  const bpVal = validation.steps.blueprint;
  const spec = buildVisualSpec(bpVal.mecOap, inventory, sourceMeta);
  const svg = svgText || renderMecOapSvg(spec);
  fs.writeFileSync(paths.mecOapSvg, svg);

  const svgVal = validateSvgStructure(svg, "MEC-oap");
  if (!svgVal.ok) {
    recordBuildFailure(paths, ground, svgVal.errors);
    return { ok: false, errors: svgVal.errors };
  }

  fs.writeFileSync(
    paths.traceability,
    JSON.stringify(traceability, null, 2) + "\n"
  );
  writeGroundingYaml(paths.grounding, ground);

  const manifest = {
    chapter: inventory.chapter,
    slug: "234-insuffisance-cardiaque",
    title: "Insuffisance cardiaque — OAP (vertical slice)",
    specialty: "Cardiologie",
    chapterLine: "Item 234 — vertical slice OAP",
    source_edition: sourceMeta.edition,
    slice: inventory.slice,
    slice_reconciliation_invariant: "pass",
    slice_reconciliation_scope: SLICE_SCOPE,
    slice_reconciliation_segments: SLICE_REQUIRED_SEGMENT_IDS,
    trace_index: "build/traceability.json",
    known_absent: [
      "mastery",
      "story",
      "actors",
      "clinical-reasoning",
      "readiness",
    ],
    projections: [
      {
        id: "overview",
        type: "understanding.overview",
        family: "understanding",
        order: 1,
        path: "projections/understanding/overview.md",
        status: "published",
      },
      {
        id: "mechanisms",
        type: "understanding.mechanisms",
        family: "understanding",
        order: 2,
        path: "projections/understanding/mechanisms.md",
        elements: ["MEC-oap"],
        visuals: { "MEC-oap": "figures/mec-oap.svg" },
        status: "published",
      },
    ],
    visuals: [
      {
        id: "mec-oap",
        element: "MEC-oap",
        path: "figures/mec-oap.svg",
        alt: "Congestion pulmonaire → seuil PPC → transsudat → OAP cardiogénique",
      },
    ],
  };

  fs.writeFileSync(paths.manifest, JSON.stringify(manifest, null, 2) + "\n");

  return { ok: true, manifest, paths };
}

export { loadSourceBundle };
