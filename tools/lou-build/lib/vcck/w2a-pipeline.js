/**
 * VCCK-W2A-234 — per-visual pipeline: validate, recognize, render, surfaces, determinism.
 */

import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../paths.js";
import { loadVisualSpec, validateVisualSpec } from "../visual-spec.js";
import { gateBeforeRender } from "./signature-analyzer.js";
import { checkBudgets } from "./budgets.js";
import { renderVcckSpec, checkDeterminism, determinismHash, validateRenderedArtifact } from "./render-bridge.js";
import { VCCK_VIEWPORT_WIDTHS, VCCK_W2A_OUTPUT } from "./paths.js";
import { captureW1SvgPngs, validateW1SvgViewport } from "./w1-surface.js";
import { loadW2AManifest, resolveW2ASpecPath } from "./w2a-manifest.js";

export async function loadChapterInventoryAsync() {
  const { loadYamlFile } = await import("../anchors.js");
  return loadYamlFile(path.join(REPO_ROOT, "01-learning/chapters/cardio/234/inventory.yaml"));
}

export async function runW2AVisualPipeline(visualEntry, options = {}) {
  const inventory = options.inventory || (await loadChapterInventoryAsync());
  const specPath = resolveW2ASpecPath(visualEntry);
  const spec = loadVisualSpec(specPath);
  const gateOpts = { familyId: visualEntry.family_expected, w2aLabelBudget: true };
  const validation = validateVisualSpec(spec, { inventory });
  const gate = gateBeforeRender(spec, gateOpts);
  const budget = checkBudgets(spec, gateOpts);
  const recognized = gate.analysis?.family;
  const familyMatch = recognized === visualEntry.family_expected;

  const result = {
    slot: visualEntry.slot,
    element: visualEntry.element,
    order: visualEntry.order,
    familyExpected: visualEntry.family_expected,
    familyRecognized: recognized,
    validation: validation.ok ? "PASS" : "FAIL",
    validationErrors: validation.errors || [],
    gate: gate.allowed ? "PASS" : "FAIL",
    gateCode: gate.code,
    budget: budget.ok ? "PASS" : "FAIL",
    familyMatch: familyMatch ? "PASS" : "FAIL",
    render: "BLOCKED",
    determinism: "BLOCKED",
    surfaces: { expected: VCCK_VIEWPORT_WIDTHS.length, passed: 0, executed: 0, byWidth: {} },
    wordCandidate: "BLOCKED",
    anomalies: [],
  };

  if (!validation.ok || !gate.allowed || !budget.ok || !familyMatch) {
    result.anomalies.push({ severity: "critical", kind: "admission", detail: "pre-render gate failed" });
    return result;
  }

  const renderOpts = {
    inventory,
    expectedFamily: visualEntry.family_expected,
    w2aLabelBudget: true,
  };
  const rendered = renderVcckSpec(spec, renderOpts);
  if (!rendered.ok) {
    result.render = "FAIL";
    result.anomalies.push({ severity: "critical", kind: "render", detail: rendered.errors });
    return result;
  }

  const artifactCheck = validateRenderedArtifact(spec, rendered);
  if (!artifactCheck.ok) {
    result.render = "FAIL";
    result.anomalies.push({ severity: "critical", kind: "artifact", detail: artifactCheck.errors });
    return result;
  }

  const outDir = path.join(options.outputRoot || VCCK_W2A_OUTPUT, visualEntry.slot);
  fs.mkdirSync(outDir, { recursive: true });
  const artifactPath = path.join(outDir, "artifact.svg");
  fs.writeFileSync(artifactPath, rendered.artifact);
  result.artifactHash = determinismHash(rendered.artifact);
  result.artifactKind = rendered.kind;
  result.artifactTechnology = spec.technology || rendered.kind;
  result.render = "PASS";

  const det = checkDeterminism(spec, renderOpts);
  result.determinism = det.ok ? "PASS" : "FAIL";
  if (!det.ok) result.anomalies.push({ severity: "critical", kind: "determinism", detail: det.errors });

  if (!options.skipPlaywright) {
    const viewport = await validateW1SvgViewport(artifactPath, { widths: VCCK_VIEWPORT_WIDTHS });
    const capture = await captureW1SvgPngs(artifactPath, outDir, visualEntry.slot, VCCK_VIEWPORT_WIDTHS);
    for (const w of VCCK_VIEWPORT_WIDTHS) {
      result.surfaces.executed++;
      const issues = viewport.details?.find((d) => d.width === w)?.issues || [];
      const pngPath = capture.paths[w];
      const ok = issues.length === 0 && pngPath && fs.existsSync(pngPath);
      result.surfaces.byWidth[w] = ok ? "PASS" : "FAIL";
      if (ok) result.surfaces.passed++;
      if (w === 530 && ok) {
        fs.copyFileSync(pngPath, path.join(outDir, "word-insert-candidate.png"));
        result.wordCandidate = "PASS";
      }
    }
    result.surfaces.status = result.surfaces.passed === result.surfaces.expected ? "PASS" : "FAIL";
  } else {
    result.surfaces.status = "SKIP";
    result.wordCandidate = "SKIP";
  }

  result.outputDir = path.relative(REPO_ROOT, outDir);
  return result;
}

export async function runW2AFullPipeline(options = {}) {
  const manifest = loadW2AManifest();
  const inventory = await loadChapterInventoryAsync();
  const results = [];
  for (const v of manifest.visuals) {
    results.push(await runW2AVisualPipeline(v, { ...options, inventory }));
  }
  return results;
}

export function summarizeW2APipeline(results) {
  const visualsPass = results.filter((r) => r.render === "PASS" && r.familyMatch === "PASS").length;
  const surfacesPass = results.reduce((n, r) => n + (r.surfaces?.passed || 0), 0);
  const wordPass = results.filter((r) => r.wordCandidate === "PASS").length;
  return {
    visuals: { pass: visualsPass, total: results.length },
    surfaces: { pass: surfacesPass, expected: results.length * VCCK_VIEWPORT_WIDTHS.length },
    wordCandidates: { pass: wordPass, total: results.length },
  };
}
