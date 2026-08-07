/**
 * W1 stress fixture surface proofs — 4 fixtures × 5 widths = 20 technical captures.
 * Distinct from the 40 perceptually approved PNGs.
 */

import fs from "node:fs";
import path from "node:path";
import { loadVisualSpec } from "../visual-spec.js";
import { checkDeterminism } from "./render-bridge.js";
import { getVcckOutputDir, VCCK_W1, VCCK_REPORTS } from "./paths.js";
import { W1_FAMILIES, W1_VIEWPORT_WIDTHS } from "./w1-constants.js";
import { runW1Pipeline } from "./w1-pipeline.js";
import {
  validateW1Artifact,
  expectedCountsFromSpec,
} from "./w1-validate-artifact.js";
import {
  validateW1SurfaceMetrics,
  validateW1SvgViewport,
  captureW1SvgPngs,
} from "./w1-surface.js";
import { validatePngCapture } from "../svg-png-validate.js";
import { loadVcckInventory } from "./inventory.js";

export const W1_STRESS_FIXTURES = Object.freeze(
  W1_FAMILIES.map((familyId) => ({
    familyId,
    file: `${familyId}-stress-90.yaml`,
    path: path.join(VCCK_W1, familyId, `${familyId}-stress-90.yaml`),
  })),
);

export const W1_STRESS_PROOF_COUNT = W1_STRESS_FIXTURES.length * W1_VIEWPORT_WIDTHS.length;

function stressOutDir(familyId, stem, outputRoot) {
  return path.join(getVcckOutputDir(outputRoot), "stress", familyId, stem);
}

/** Full surface proof for one stress fixture — render through determinism. */
export async function runW1StressFixtureProof(familyId, options = {}) {
  const fx = W1_STRESS_FIXTURES.find((f) => f.familyId === familyId);
  const errors = [];
  const widths = {};
  const inventory = loadVcckInventory();

  if (!fx?.path || !fs.existsSync(fx.path)) {
    return {
      familyId,
      fixture: fx?.file ?? `${familyId}-stress-90.yaml`,
      ok: false,
      executed: false,
      errors: [`missing stress fixture ${fx?.path}`],
      widths: {},
      determinism: "BLOCKED",
    };
  }

  let spec;
  try {
    spec = loadVisualSpec(fx.path);
  } catch (e) {
    return {
      familyId,
      fixture: fx.file,
      ok: false,
      executed: false,
      errors: [`load error: ${e.message}`],
      widths: {},
      determinism: "BLOCKED",
    };
  }

  const pipeline = runW1Pipeline(spec, { expectedFamily: familyId, inventory });
  if (!pipeline.ok) {
    errors.push(...(pipeline.errors || []));
    return {
      familyId,
      fixture: fx.file,
      ok: false,
      executed: true,
      render: "FAIL",
      errors,
      widths: {},
      determinism: "BLOCKED",
    };
  }

  const counts = expectedCountsFromSpec(spec, familyId);
  const artifactCheck = validateW1Artifact(spec, pipeline.artifact, pipeline.kind, counts);
  if (!artifactCheck.ok) errors.push(...artifactCheck.errors);

  const det = checkDeterminism(spec, { inventory });
  const determinism = det.ok ? "PASS" : "FAIL";
  if (!det.ok) errors.push(...det.errors);

  const stem = fx.file.replace(".yaml", "");
  const outDir = stressOutDir(familyId, stem, options.outputRoot);
  fs.mkdirSync(outDir, { recursive: true });

  const artifactPath = path.join(outDir, "artifact.svg");
  fs.writeFileSync(artifactPath, pipeline.artifact);

  try {
    const vp = await validateW1SvgViewport(artifactPath, { widths: W1_VIEWPORT_WIDTHS });
    if (!vp.ok) errors.push(...vp.errors.map((e) => `viewport: ${e}`));

    const { paths, metricsByWidth } = await captureW1SvgPngs(
      artifactPath,
      outDir,
      `${stem}-stress`,
      W1_VIEWPORT_WIDTHS,
    );

    for (const width of W1_VIEWPORT_WIDTHS) {
      const pngPath = path.join(outDir, `stress-capture-${width}.png`);
      const src = paths[width];
      if (src && src !== pngPath && fs.existsSync(src)) fs.copyFileSync(src, pngPath);

      const row = { width, png: pngPath, viewport: "PASS", surfaces: "PASS", metrics: null };
      if (!fs.existsSync(pngPath)) {
        row.surfaces = "FAIL";
        errors.push(`${fx.file} @ ${width}px: missing stress capture`);
      } else {
        const pngVal = await validatePngCapture(pngPath);
        if (!pngVal.ok) {
          row.surfaces = "FAIL";
          errors.push(`${fx.file} @ ${width}px: ${pngVal.errors.join("; ")}`);
        }
      }
      const metrics = metricsByWidth[width];
      const surf = validateW1SurfaceMetrics(metrics);
      row.metrics = metrics;
      if (!surf.ok) {
        row.surfaces = "FAIL";
        errors.push(`${fx.file} @ ${width}px surface: ${surf.errors.join("; ")}`);
      }
      widths[width] = row;
    }
  } catch (e) {
    errors.push(`stress surfaces execution error: ${e.message}`);
    for (const width of W1_VIEWPORT_WIDTHS) {
      if (!widths[width]) widths[width] = { width, surfaces: "BLOCKED", viewport: "BLOCKED" };
    }
  }

  const widthRows = W1_VIEWPORT_WIDTHS.map((w) => widths[w]).filter(Boolean);
  const allWidthsPresent = widthRows.length === W1_VIEWPORT_WIDTHS.length;
  const allPass = widthRows.every(
    (r) => r.surfaces === "PASS" && (r.viewport == null || r.viewport === "PASS") && (r.reflow == null || r.reflow === "PASS"),
  );

  return {
    familyId,
    fixture: fx.file,
    ok: errors.length === 0 && allWidthsPresent && allPass && determinism === "PASS" && artifactCheck.ok,
    executed: true,
    render: pipeline.ok ? "PASS" : "FAIL",
    artifact: artifactCheck.ok ? "PASS" : "FAIL",
    determinism,
    proofCount: widthRows.length,
    expectedProofCount: W1_VIEWPORT_WIDTHS.length,
    widths: widthRows,
    errors,
    outDir,
    plan: pipeline.plan,
  };
}

/** Run all four stress fixture surface proofs. */
export async function runAllW1StressSurfaceProofs(options = {}) {
  const results = [];
  const errors = [];

  for (const familyId of W1_FAMILIES) {
    const proof = await runW1StressFixtureProof(familyId, options);
    results.push(proof);
    if (!proof.ok) errors.push(...proof.errors.map((e) => `${familyId}: ${e}`));
    if (proof.proofCount !== W1_VIEWPORT_WIDTHS.length) {
      errors.push(`${familyId}: expected ${W1_VIEWPORT_WIDTHS.length} width proofs, got ${proof.proofCount}`);
    }
  }

  const totalProofs = results.reduce((n, r) => n + (r.proofCount || 0), 0);

  return {
    ok: errors.length === 0 && results.length === 4 && totalProofs === W1_STRESS_PROOF_COUNT,
    executed: results.every((r) => r.executed),
    fixturesExecuted: results.length,
    totalProofs,
    expectedProofs: W1_STRESS_PROOF_COUNT,
    results,
    errors,
  };
}

export function evaluateStressSurfacesGate(stressProof) {
  if (!stressProof) return { ok: false, executed: false, status: "BLOCKED", errors: ["stress proof missing"] };
  if (!stressProof.executed) {
    return { ok: false, executed: false, status: "BLOCKED", errors: stressProof.errors || ["not executed"] };
  }
  if (stressProof.ok && stressProof.totalProofs === W1_STRESS_PROOF_COUNT) {
    return { ok: true, executed: true, status: "PASS", errors: [], ...stressProof };
  }
  return {
    ok: false,
    executed: true,
    status: "FAIL",
    errors: stressProof.errors || ["stress surfaces incomplete"],
    ...stressProof,
  };
}

export function writeW1StressSurfacesReport(stressProof, options = {}) {
  const outPath = options.outPath || path.join(VCCK_REPORTS, "w1-stress-surfaces-report.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(stressProof, null, 2));
  return { ...stressProof, outPath };
}
