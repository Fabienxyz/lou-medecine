/**
 * VCCK-W2A-234 — Codex delivery manifest builder.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../paths.js";
import { validateSvgGeometryIndependent } from "./svg-geom-independent.js";
import { validateDecisionBranchLabelAttachment } from "./w2a-branch-label-validate.js";
import { validateWordHdMetrics } from "./w2a-word-export.js";

export function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function pngDimensions(pngPath) {
  const buf = fs.readFileSync(pngPath);
  if (buf.length < 24 || buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

export function geometryVerdict(spec, artifactPath, kind) {
  if (kind !== "svg") return { verdict: "PASS", errors: [] };
  const svg = fs.readFileSync(artifactPath, "utf8");
  const errors = [];
  if (spec.primitive === "threshold-scale") {
    const ctx = (svg.match(/data-context="/g) || []).length;
    if (ctx === 0) errors.push("threshold: missing contexts");
  } else {
    const geom = validateSvgGeometryIndependent(svg);
    if (!geom.ok) errors.push(...geom.errors);
  }
  if (spec.primitive === "decision-algorithm") {
    const labels = validateDecisionBranchLabelAttachment(svg);
    if (!labels.ok) errors.push(...labels.errors);
  }
  return { verdict: errors.length === 0 ? "PASS" : "FAIL", errors };
}

export function buildDeliveryEntry(visualEntry, pipelineResult, exportInfo) {
  const ext = "artifact.svg";
  const artifactRel = pipelineResult.outputDir ? path.join(pipelineResult.outputDir, ext) : null;
  const artifactPath = artifactRel ? path.join(REPO_ROOT, artifactRel) : null;
  const pngPath = exportInfo.pngPath;
  const pngDims = pngPath && fs.existsSync(pngPath) ? pngDimensions(pngPath) : null;

  return {
    slot: visualEntry.slot,
    element: visualEntry.element,
    order: visualEntry.order,
    familyComputed: pipelineResult.familyRecognized,
    familyExpected: visualEntry.family_expected,
    technology: pipelineResult.artifactTechnology || pipelineResult.artifactKind,
    canonicalArtifact: artifactRel,
    wordHdPng: exportInfo.pngRel,
    width: pngDims?.width ?? exportInfo.metrics?.outputWidth ?? null,
    height: pngDims?.height ?? exportInfo.metrics?.outputHeight ?? null,
    sha256: {
      artifact: artifactPath && fs.existsSync(artifactPath) ? sha256File(artifactPath) : pipelineResult.artifactHash,
      wordHdPng: pngPath && fs.existsSync(pngPath) ? sha256File(pngPath) : null,
    },
    minFontSizePx: exportInfo.metrics?.minFontPx ?? null,
    contentBounds: exportInfo.metrics?.bounds ?? null,
    geometryVerdict: exportInfo.geometryVerdict?.verdict ?? "UNKNOWN",
    determinismVerdict: pipelineResult.determinism,
    wordHdVerdict: exportInfo.wordHdVerdict,
    renderVerdict: pipelineResult.render,
  };
}

export function buildDeliveryManifest(manifest, pipelineResults, exportsBySlot) {
  const entries = manifest.visuals.map((v) => {
    const pr = pipelineResults.find((r) => r.slot === v.slot);
    const ex = exportsBySlot[v.slot] || {};
    const kind = pr?.artifactKind || (ex.kind ?? "svg");
    return buildDeliveryEntry(
      v,
      { ...pr, artifactKind: kind },
      ex,
    );
  });

  const pass = {
    artifacts: entries.filter((e) => e.renderVerdict === "PASS").length,
    wordHdPng: entries.filter((e) => e.wordHdVerdict === "PASS").length,
    geometry: entries.filter((e) => e.geometryVerdict === "PASS").length,
    determinism: entries.filter((e) => e.determinismVerdict === "PASS").length,
  };

  return {
    package: "VCCK-W2A-234-CODEX-EXPORT",
    generatedAt: new Date().toISOString(),
    visualCount: entries.length,
    entries,
    summary: pass,
    allPass:
      pass.artifacts === entries.length &&
      pass.wordHdPng === entries.length &&
      pass.geometry === entries.length &&
      pass.determinism === entries.length,
  };
}

export function validateDeliveryManifest(delivery) {
  const errors = [];
  const n = delivery.visualCount || delivery.entries?.length || 0;
  if (delivery.summary.artifacts !== n) errors.push(`artifacts ${delivery.summary.artifacts}/${n}`);
  if (delivery.summary.wordHdPng !== n) errors.push(`word HD PNG ${delivery.summary.wordHdPng}/${n}`);
  if (delivery.summary.geometry !== n) errors.push(`geometry ${delivery.summary.geometry}/${n}`);
  if (delivery.summary.determinism !== n) errors.push(`determinism ${delivery.summary.determinism}/${n}`);
  for (const e of delivery.entries || []) {
    if (e.minFontSizePx != null && e.minFontSizePx < 14) {
      errors.push(`${e.slot}: min font ${e.minFontSizePx}px below 14px`);
    }
  }
  return { ok: errors.length === 0, errors };
}
