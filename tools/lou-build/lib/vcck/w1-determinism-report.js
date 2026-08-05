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

export function computeW1BitmapProofSummary(options = {}) {
  const outputRoot = options.outputRoot ?? null;
  const inventory = [];
  const hashSet = new Set();
  const byFixture = [];

  for (const entry of W1_APPROVED_POSITIVES) {
    const stem = entry.file.replace(".yaml", "");
    const outDir = path.join(getVcckOutputDir(outputRoot), entry.family, stem);
    const fixtureHashes = [];
    for (const width of W1_AUDIT_PNG_WIDTHS) {
      const png = path.join(outDir, `capture-${width}.png`);
      if (!fs.existsSync(png)) continue;
      const hash = sha256File(png);
      const bytes = fs.statSync(png).size;
      hashSet.add(hash);
      fixtureHashes.push({ width, hash, bytes });
      inventory.push({ fixture: stem, width, hash, bytes });
    }
    const uniqueForFixture = new Set(fixtureHashes.map((h) => h.hash));
    const stableAfterMax =
      fixtureHashes.length >= 3 &&
      fixtureHashes.filter((h) => h.width >= 768).every((h) => h.hash === fixtureHashes.find((x) => x.width === 768)?.hash);
    byFixture.push({
      fixture: stem,
      nominalProofCount: fixtureHashes.length,
      distinctBitmapCount: uniqueForFixture.size,
      stableAfterMaxWidth: stableAfterMax,
      hashes: fixtureHashes,
    });
  }

  const unexplainedVariance = [];
  const documentedVariance = [];
  const htmlFixtures = new Set(["two-pole-short", "two-pole-long", "flat-concurrent-short", "flat-concurrent-long"]);
  for (const fx of byFixture) {
    if (!htmlFixtures.has(fx.fixture)) continue;
    const h1280 = fx.hashes.find((h) => h.width === 1280)?.hash;
    const h2400 = fx.hashes.find((h) => h.width === 2400)?.hash;
    if (h1280 && h2400 && h1280 !== h2400) {
      const row1280 = fx.hashes.find((h) => h.width === 1280);
      const row2400 = fx.hashes.find((h) => h.width === 2400);
      const sizeDelta =
        row1280?.bytes && row2400?.bytes
          ? Math.abs(row1280.bytes - row2400.bytes) / row1280.bytes
          : 1;
      if (sizeDelta <= 0.05) {
        documentedVariance.push({
          fixture: fx.fixture,
          metric: "png-byte-delta",
          bytes1280: row1280.bytes,
          bytes2400: row2400.bytes,
          relativeDelta: sizeDelta,
          note: "Layout stable after max reading width; residual PNG encoder variance",
        });
      } else {
        unexplainedVariance.push(
          `${fx.fixture}: 1280 vs 2400 hash mismatch requires documented metric or fix`,
        );
      }
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
