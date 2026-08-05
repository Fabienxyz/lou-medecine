/**
 * W1 PNG proof reporting — distinct bitmaps vs nominal width count.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getVcckOutputDir, VCCK_REPORTS } from "./paths.js";
import {
  W1_APPROVED_POSITIVES,
  W1_AUDIT_PNG_WIDTHS,
  W1_EXPECTED_PNG_PROOF_COUNT,
} from "./w1-snapshots.js";

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function compositionFingerprint(metrics) {
  if (!metrics?.contentRect) return null;
  const w = Number(metrics.width);
  const cr = metrics.contentRect;
  const svgW = metrics.renderedSvgWidth ?? metrics.maxWidthApplied ?? null;
  return [
    w >= 768 ? "wide" : w,
    cr.width,
    cr.height,
    metrics.elementCount ?? 0,
    svgW ?? "na",
  ].join("|");
}

function surfaceMetricsForFixture(familyResults, fixtureStem) {
  if (!familyResults) return [];
  for (const familyId of Object.keys(familyResults)) {
    for (const row of familyResults[familyId]?.positive || []) {
      const stem = String(row.fixture || "").replace(/\.yaml$/, "");
      if (stem === fixtureStem) return row.surfaceMetrics || [];
    }
  }
  return [];
}

export function computeW1BitmapProofSummary(options = {}) {
  const outputRoot = options.outputRoot ?? null;
  const familyResults = options.familyResults ?? null;
  const inventory = [];
  const hashSet = new Set();
  const byFixture = [];

  for (const entry of W1_APPROVED_POSITIVES) {
    const stem = entry.file.replace(".yaml", "");
    const outDir = path.join(getVcckOutputDir(outputRoot), entry.family, stem);
    const fixtureHashes = [];
    const metricsRows = surfaceMetricsForFixture(familyResults, stem);

    for (const width of W1_AUDIT_PNG_WIDTHS) {
      const png = path.join(outDir, `capture-${width}.png`);
      if (!fs.existsSync(png)) continue;
      const hash = sha256File(png);
      const bytes = fs.statSync(png).size;
      hashSet.add(hash);
      const metrics = metricsRows.find((m) => Number(m.width) === width);
      fixtureHashes.push({
        width,
        hash,
        bytes,
        compositionFingerprint: metrics ? compositionFingerprint(metrics) : null,
      });
      inventory.push({ fixture: stem, width, hash, bytes });
    }

    const uniqueForFixture = new Set(fixtureHashes.map((h) => h.hash));
    const wideRows = fixtureHashes.filter((h) => h.width >= 768);
    const wideFingerprints = [
      ...new Set(wideRows.map((h) => h.compositionFingerprint).filter(Boolean)),
    ];
    const stableAfterMax =
      wideRows.length >= 2 &&
      (wideFingerprints.length === 1 ||
        wideRows.every((h) => h.compositionFingerprint === wideFingerprints[0]));

    byFixture.push({
      fixture: stem,
      nominalProofCount: fixtureHashes.length,
      distinctBitmapCount: uniqueForFixture.size,
      stableAfterMaxWidth: stableAfterMax,
      wideCompositionFingerprints: wideFingerprints,
      hashes: fixtureHashes,
    });
  }

  const unexplainedVariance = [];
  const documentedVariance = [];

  for (const fx of byFixture) {
    const wide = fx.hashes.filter((h) => h.width >= 1280);
    if (wide.length >= 2) {
      const base = wide[0];
      for (const row of wide.slice(1)) {
        if (row.hash !== base.hash) {
          const fpMatch =
            base.compositionFingerprint &&
            row.compositionFingerprint === base.compositionFingerprint;
          if (fpMatch) {
            documentedVariance.push(
              `${fx.fixture}: PNG bytes differ ${base.width}px vs ${row.width}px but composition fingerprint stable (${base.compositionFingerprint}) — viewport capture root width differs while rendered composition is unchanged`,
            );
          } else {
            unexplainedVariance.push(
              `${fx.fixture}: bitmap hash mismatch ${base.width}px vs ${row.width}px with distinct composition fingerprints (${base.compositionFingerprint} vs ${row.compositionFingerprint})`,
            );
          }
        }
      }
    }
    if (fx.stableAfterMaxWidth === false) {
      unexplainedVariance.push(
        `${fx.fixture}: composition not stable after 768px — fingerprints ${JSON.stringify(fx.wideCompositionFingerprints)}`,
      );
    }
  }

  return {
    nominalProofCount: W1_EXPECTED_PNG_PROOF_COUNT,
    distinctBitmapCount: hashSet.size,
    inventory,
    byFixture,
    stableAfterMaxWidth: byFixture.every((f) => f.stableAfterMaxWidth !== false),
    documentedVariance,
    unexplainedVariance,
  };
}

export function assertReportManifestCoherence(reportInventory, manifestPath) {
  const errors = [];
  if (!fs.existsSync(manifestPath)) {
    errors.push(`missing manifest ${manifestPath}`);
    return { ok: false, errors };
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const entries = manifest.candidates || [];
  if (entries.length !== W1_EXPECTED_PNG_PROOF_COUNT) {
    errors.push(`manifest count ${entries.length} !== ${W1_EXPECTED_PNG_PROOF_COUNT}`);
  }
  for (const row of reportInventory) {
    const m = entries.find((e) => e.fixture === row.fixture && e.width === row.width);
    if (!m) errors.push(`manifest missing ${row.fixture}:${row.width}`);
    else if (m.hash !== row.hash) errors.push(`hash mismatch ${row.fixture}@${row.width}`);
  }
  return { ok: errors.length === 0, errors };
}

export function writeW1DeterminismReport(options = {}) {
  const summary = computeW1BitmapProofSummary(options);
  const outPath = path.join(VCCK_REPORTS, "w1-determinism-report.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  return { ...summary, outPath };
}
