#!/usr/bin/env node
/**
 * VCCK-W2A-234 — Codex asset handoff (no DOCX).
 * Produces 10 canonical artifacts + Word HD PNG exports + delivery manifest.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { REPO_ROOT } from "../lib/paths.js";
import {
  VCCK_W2A_CODEX_EXPORT,
  VCCK_W2A_DELIVERY_MANIFEST,
  VCCK_W2A_REPORTS,
} from "../lib/vcck/paths.js";
import { verifyManifestFingerprints, loadW2AManifest } from "../lib/vcck/w2a-manifest.js";
import { fingerprintWave1Assets, compareWave1Fingerprints } from "../lib/vcck/w2a-protected.js";
import { runW2AFullPipeline } from "../lib/vcck/w2a-pipeline.js";
import { verifyWalkthroughInventory } from "../lib/vcck/w2a-walkthrough.js";
import { captureWordHdArtifact, validateWordHdMetrics } from "../lib/vcck/w2a-word-export.js";
import {
  buildDeliveryManifest,
  validateDeliveryManifest,
  geometryVerdict,
} from "../lib/vcck/w2a-delivery-manifest.js";
import { computeW2ACodexAssetsVerdict } from "../lib/vcck/w2a-verdict.js";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { resolveW2ASpecPath } from "../lib/vcck/w2a-manifest.js";

const args = new Set(process.argv.slice(2));
const skipPlaywright = args.has("--skip-playwright");

const head = execSync("git rev-parse HEAD", { cwd: REPO_ROOT, encoding: "utf8" }).trim();
const gitStatus = execSync("git status --short tools/lou-build/", { cwd: REPO_ROOT, encoding: "utf8" });

const manifestCheck = verifyManifestFingerprints();
if (!manifestCheck.ok) {
  console.error("PREFLIGHT_BLOCKED", manifestCheck.errors);
  process.exit(4);
}

const wave1Before = fingerprintWave1Assets();
const wtCheck = verifyWalkthroughInventory();
const manifest = loadW2AManifest();

const pipelineResults = await runW2AFullPipeline({ skipPlaywright });
const exportsBySlot = {};

if (!skipPlaywright) {
  fs.mkdirSync(VCCK_W2A_CODEX_EXPORT, { recursive: true });
  for (const v of manifest.visuals) {
    const pr = pipelineResults.find((r) => r.slot === v.slot);
    if (pr?.render !== "PASS") continue;
    const artifactPath = path.join(REPO_ROOT, pr.outputDir, "artifact.svg");
    const pngPath = path.join(VCCK_W2A_CODEX_EXPORT, `${v.slot}-word-hd.png`);
    const spec = loadVisualSpec(resolveW2ASpecPath(v));
    const metrics = await captureWordHdArtifact(artifactPath, pngPath, "svg");
    const hdVal = validateWordHdMetrics(metrics);
    const geom = geometryVerdict(spec, artifactPath, "svg");
    exportsBySlot[v.slot] = {
      pngPath,
      pngRel: path.relative(REPO_ROOT, pngPath),
      metrics,
      kind: "svg",
      wordHdVerdict: hdVal.ok && geom.verdict === "PASS" ? "PASS" : "FAIL",
      geometryVerdict: geom,
      errors: [...(hdVal.errors || []), ...(geom.errors || [])],
    };
  }
}

const delivery = buildDeliveryManifest(manifest, pipelineResults, exportsBySlot);
const deliveryValidation = validateDeliveryManifest(delivery);

const wave1After = fingerprintWave1Assets();
const wave1Comparison = compareWave1Fingerprints(wave1Before, wave1After);

const verdictPayload = computeW2ACodexAssetsVerdict({
  manifestCheck,
  wave1Comparison,
  deliveryManifest: delivery,
  deliveryValidation,
  pipelineResults,
});

fs.mkdirSync(VCCK_W2A_REPORTS, { recursive: true });
fs.writeFileSync(VCCK_W2A_DELIVERY_MANIFEST, JSON.stringify(delivery, null, 2));

const report = {
  mission: "VCCK-W2A-234-CODEX-ASSETS",
  head,
  verdict: verdictPayload.verdict,
  reasons: verdictPayload.reasons,
  preflight: { manifestCheck, wtCheck: { ok: wtCheck.ok, count: wtCheck.count } },
  delivery: {
    manifestPath: VCCK_W2A_DELIVERY_MANIFEST,
    exportDir: VCCK_W2A_CODEX_EXPORT,
    summary: delivery.summary,
    validation: deliveryValidation,
  },
  pipelineResults,
  wave1Protected: wave1Comparison,
  gitStatus,
};

fs.writeFileSync(path.join(VCCK_W2A_REPORTS, "w2a-codex-assets-verdict.json"), JSON.stringify(report, null, 2));

console.log(`VCCK-W2A-234 Codex assets verdict: ${verdictPayload.verdict}`);
console.log(`Artifacts: ${delivery.summary.artifacts}/${manifest.visual_count}`);
console.log(`Word HD PNG: ${delivery.summary.wordHdPng}/${manifest.visual_count}`);
console.log(`Geometry: ${delivery.summary.geometry}/${manifest.visual_count}`);
console.log(`Determinism: ${delivery.summary.determinism}/${manifest.visual_count}`);
console.log(`Manifest: ${VCCK_W2A_DELIVERY_MANIFEST}`);

process.exit(verdictPayload.exitCode ?? 1);
