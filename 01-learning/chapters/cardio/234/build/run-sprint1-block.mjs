#!/usr/bin/env node
/**
 * E2 Sprint 1 — W1 industrial block runner (pattern N13-2)
 * Usage: node run-sprint1-block.mjs <n13-2|n18-1|n21-1|n15-1|n20-1>
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadYamlFile } from "../../../../../tools/lou-build/lib/anchors.js";
import { loadVisualSpec, validateVisualSpec } from "../../../../../tools/lou-build/lib/visual-spec.js";
import { analyzeSignature, gateBeforeRender } from "../../../../../tools/lou-build/lib/vcck/signature-analyzer.js";
import { checkBudgets } from "../../../../../tools/lou-build/lib/vcck/budgets.js";
import { loadFamilyRegistry } from "../../../../../tools/lou-build/lib/vcck/registry.js";
import {
  renderVcckSpec,
  validateRenderedArtifact,
  checkDeterminism,
  determinismHash,
} from "../../../../../tools/lou-build/lib/vcck/render-bridge.js";

const BLOCKS = {
  "n13-2": {
    specFile: "n13-2-oap-actions.yaml",
    visualV0: "N13-2",
    outDir: "sprint-n13-2",
    figureFile: "n13-2-oap-actions.svg",
    mission: "E2-SPRINT-N13-2",
  },
  "n18-1": {
    specFile: "n18-1-treatment-sequence.yaml",
    visualV0: "N18-1",
    outDir: "sprint-n18-1",
    figureFile: "n18-1-treatment-sequence.svg",
    mission: "E2-SPRINT1-N18-1",
  },
  "n21-1": {
    specFile: "n21-1-natural-history.yaml",
    visualV0: "N21-1",
    outDir: "sprint-n21-1",
    figureFile: "n21-1-natural-history.svg",
    mission: "E2-SPRINT1-N21-1",
  },
  "n15-1": {
    specFile: "n15-1-shock-support.yaml",
    visualV0: "N15-1",
    outDir: "sprint-n15-1",
    figureFile: "n15-1-shock-support.svg",
    mission: "E2-SPRINT2-N15-1",
  },
  "n20-1": {
    specFile: "n20-1-crt-dai-comparison.yaml",
    visualV0: "N20-1",
    outDir: "sprint-n20-1",
    figureFile: "n20-1-crt-dai-comparison.svg",
    mission: "E2-SPRINT2-N20-1",
  },
};

const blockId = process.argv[2];
const block = BLOCKS[blockId];
if (!block) {
  console.error(`Unknown block "${blockId}". Expected: ${Object.keys(BLOCKS).join(", ")}`);
  process.exit(2);
}

const BUILD_DIR = path.dirname(fileURLToPath(import.meta.url));
const CHAPTER_DIR = path.join(BUILD_DIR, "..");
const SPEC_PATH = path.join(BUILD_DIR, "visual-specs", block.specFile);
const OUT_DIR = path.join(BUILD_DIR, block.outDir);

const inventory = loadYamlFile(path.join(CHAPTER_DIR, "inventory.yaml"));
const spec = loadVisualSpec(SPEC_PATH);
const gateOpts = {};

const validation = validateVisualSpec(spec, { inventory });
const signatureAnalysis = analyzeSignature(spec, gateOpts);
const gate = gateBeforeRender(spec, gateOpts);
const budget = checkBudgets(spec, gateOpts);
const registry = loadFamilyRegistry();
const recognizedFamily = signatureAnalysis.family;
const capacity = registry.families.find((f) => f.id === recognizedFamily) || null;

const recognitionVerdict = (() => {
  if (signatureAnalysis.status === "rejected") {
    return { verdict: "REJECTED", code: signatureAnalysis.code, justification: `Signature rejetée : ${signatureAnalysis.code}` };
  }
  if (signatureAnalysis.status === "ambiguous") {
    return { verdict: "UNRECOGNIZED", code: "UNSUPPORTED_TOPOLOGY", candidates: signatureAnalysis.candidates, justification: "Topologie ambiguë" };
  }
  if (!capacity) {
    return { verdict: "UNRECOGNIZED", code: "NO_REGISTERED_CAPACITY", family: recognizedFamily, justification: `Famille "${recognizedFamily}" absente du registre` };
  }
  if (capacity.qualification_status !== "QUALIFIED" && capacity.qualification_status !== "EXPERIMENTAL") {
    return { verdict: "UNRECOGNIZED", qualification_status: capacity.qualification_status, justification: "Capacité non admissible" };
  }
  return {
    verdict: "ADMITTED",
    family: recognizedFamily,
    qualification_status: capacity.qualification_status,
    justification: `Structure reconnue comme "${recognizedFamily}" (${capacity.qualification_status})`,
  };
})();

let renderResult = null;
let artifactValidation = null;
let determinism = null;

if (gate.allowed && recognitionVerdict.verdict === "ADMITTED") {
  renderResult = renderVcckSpec(spec, { inventory, expectedFamily: recognizedFamily });
  if (renderResult.ok) {
    artifactValidation = validateRenderedArtifact(spec, renderResult);
    determinism = checkDeterminism(spec, { inventory, expectedFamily: recognizedFamily });
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const chainReport = {
  mission: block.mission,
  block: blockId,
  element: spec.element,
  visual_v0: block.visualV0,
  primitive_declared: spec.primitive,
  contract05: { noTechnologyField: spec.technology == null, validationPass: validation.ok },
  steps: {
    visualSpec: { status: validation.ok ? "PASS" : "FAIL", errors: validation.errors || [] },
    signature: { status: signatureAnalysis.status, computed: signatureAnalysis.signature, family: signatureAnalysis.family },
    recognition: recognitionVerdict,
    capacity: capacity
      ? { id: capacity.id, primitive: capacity.primitive, qualification_status: capacity.qualification_status, budgets: capacity.budgets }
      : null,
    budget: { status: budget.ok ? "PASS" : "FAIL", detail: budget.detail || null },
    gate: { allowed: gate.allowed, code: gate.code || null },
    composition: renderResult?.plan
      ? { status: "PRODUCED", pipeline: "W1", explicitCompositionPlan: true, canonicalOrder: renderResult.plan?.canonicalOrder || null }
      : renderResult?.layout
        ? { status: "PRODUCED", pipeline: "generic", explicitCompositionPlan: false }
        : { status: "NOT_PRODUCED", errors: renderResult?.errors || [gate.code] },
    figure: renderResult?.ok
      ? {
          status: artifactValidation?.ok ? "PASS" : "FAIL",
          kind: renderResult.kind,
          hash: determinismHash(renderResult.artifact),
          determinism: determinism?.ok ? "PASS" : "FAIL",
          errors: artifactValidation?.errors || [],
        }
      : { status: "NOT_PRODUCED", errors: renderResult?.errors },
  },
};

fs.writeFileSync(path.join(OUT_DIR, "signature.json"), JSON.stringify(chainReport.steps.signature, null, 2));
fs.writeFileSync(path.join(OUT_DIR, "recognition-verdict.json"), JSON.stringify(chainReport.steps.recognition, null, 2));
fs.writeFileSync(path.join(OUT_DIR, "capacity-retained.json"), JSON.stringify(chainReport.steps.capacity, null, 2));
if (renderResult?.plan) {
  fs.writeFileSync(path.join(OUT_DIR, "composition.json"), JSON.stringify(renderResult.plan, null, 2));
}
fs.writeFileSync(path.join(OUT_DIR, "chain-report.json"), JSON.stringify(chainReport, null, 2));

if (renderResult?.ok && renderResult.artifact) {
  fs.writeFileSync(path.join(OUT_DIR, block.figureFile), renderResult.artifact);
  fs.writeFileSync(path.join(CHAPTER_DIR, "figures", block.figureFile), renderResult.artifact);
}

console.log(JSON.stringify(chainReport, null, 2));
process.exit(chainReport.steps.figure.status === "PASS" ? 0 : 1);
