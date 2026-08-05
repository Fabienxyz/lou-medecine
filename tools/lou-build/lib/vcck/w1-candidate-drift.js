/**
 * Verify W1 approved candidates have not drifted since Codex visual audit.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getVcckOutputDir, VCCK_REPORTS } from "./paths.js";
import {
  W1_APPROVED_POSITIVES,
  W1_AUDIT_PNG_WIDTHS,
  W1_EXPECTED_PNG_PROOF_COUNT,
  assertW1ProofWidthContract,
} from "./w1-snapshots.js";
import {
  W1_APPROVED_PNG_MANIFEST,
  W1_CANDIDATE_PNG_MANIFEST,
  loadPngManifest,
  validatePngManifestShape,
  verifyW1CandidateAgainstApproved,
} from "./w1-approved-png.js";

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

/**
 * Compare on-disk PNG captures to candidate manifest (post-run regeneration).
 * Read-only — never writes manifests.
 */
export function verifyW1OutputMatchesCandidate(options = {}) {
  const outputRoot = options.outputRoot ?? null;
  const manifestLoad = loadPngManifest(options.manifestPath || W1_CANDIDATE_PNG_MANIFEST);
  if (!manifestLoad.ok) {
    return {
      ok: false,
      verdict: "VCCK_W1_BLOCKED_SURFACE_PROOF",
      errors: manifestLoad.errors,
      details: [],
      fixturesVerified: 0,
      widthsPerFixture: W1_AUDIT_PNG_WIDTHS.length,
      pngProofsVerified: 0,
      manifestPath: manifestLoad.path,
    };
  }

  const errors = validatePngManifestShape(manifestLoad);
  const details = [];
  let pngProofsVerified = 0;

  for (const entry of W1_APPROVED_POSITIVES) {
    const stem = entry.file.replace(".yaml", "");
    const outDir = path.join(getVcckOutputDir(outputRoot), entry.family, stem);
    details.push({ fixture: entry.file, pngs: [] });

    for (const width of W1_AUDIT_PNG_WIDTHS) {
      const pngPath = path.join(outDir, `capture-${width}.png`);
      const key = `${stem}:${width}`;
      const expected = manifestLoad.byKey.get(key);
      if (!expected) {
        errors.push(`${entry.file}: no manifest entry for width ${width}`);
        continue;
      }
      if (!fs.existsSync(pngPath)) {
        errors.push(`${entry.file}: missing PNG ${pngPath}`);
        continue;
      }
      const hash = sha256File(pngPath);
      const stat = fs.statSync(pngPath);
      details.at(-1).pngs.push({ fixture: entry.file, width, hash, expectedHash: expected.hash, bytes: stat.size, expectedBytes: expected.bytes });
      if (hash !== expected.hash) {
        errors.push(`${entry.file} @ ${width}px: PNG hash drift expected ${expected.hash} got ${hash}`);
      } else if (expected.bytes != null && stat.size !== expected.bytes) {
        errors.push(`${entry.file} @ ${width}px: PNG size drift expected ${expected.bytes}B got ${stat.size}B`);
      } else {
        pngProofsVerified++;
      }
    }
  }

  return {
    ok: errors.length === 0,
    verdict: errors.length === 0 ? null : "VCCK_W1_BLOCKED_SURFACE_PROOF",
    errors,
    details,
    manifestPath: manifestLoad.path,
    surfaceContract: manifestLoad.manifest.contract,
    fixturesVerified: details.length,
    widthsPerFixture: W1_AUDIT_PNG_WIDTHS.length,
    pngProofsVerified,
    expectedPngProofs: W1_EXPECTED_PNG_PROOF_COUNT,
  };
}

/** Compare output PNGs to approved reference — pending Codex reapproval when candidate differs. */
export function verifyW1ApprovedPngDrift(options = {}) {
  const outputRoot = options.outputRoot ?? null;
  const manifestLoad = loadPngManifest(options.manifestPath || W1_APPROVED_PNG_MANIFEST);
  if (!manifestLoad.ok) {
    return {
      ok: false,
      verdict: "VCCK_W1_BLOCKED_SURFACE_PROOF",
      errors: manifestLoad.errors,
      details: [],
      fixturesVerified: 0,
      widthsPerFixture: W1_AUDIT_PNG_WIDTHS.length,
      pngProofsVerified: 0,
      manifestPath: manifestLoad.path,
    };
  }

  const errors = validatePngManifestShape(manifestLoad);
  const details = [];
  let pngProofsVerified = 0;

  for (const entry of W1_APPROVED_POSITIVES) {
    const stem = entry.file.replace(".yaml", "");
    const outDir = path.join(getVcckOutputDir(outputRoot), entry.family, stem);

    details.push({ fixture: entry.file, pngs: [] });

    for (const width of W1_AUDIT_PNG_WIDTHS) {
      const pngPath = path.join(outDir, `capture-${width}.png`);
      const key = `${stem}:${width}`;
      const expected = manifestLoad.byKey.get(key);

      if (!expected) {
        errors.push(`${entry.file}: no manifest entry for width ${width}`);
        continue;
      }
      if (!fs.existsSync(pngPath)) {
        errors.push(`${entry.file}: missing PNG ${pngPath}`);
        continue;
      }

      const hash = sha256File(pngPath);
      const stat = fs.statSync(pngPath);
      details.at(-1).pngs.push({
        fixture: entry.file,
        width,
        hash,
        expectedHash: expected.hash,
        bytes: stat.size,
        expectedBytes: expected.bytes,
      });

      if (hash !== expected.hash) {
        errors.push(
          `${entry.file} @ ${width}px: PNG hash drift expected ${expected.hash} got ${hash}`,
        );
      } else if (expected.bytes != null && stat.size !== expected.bytes) {
        errors.push(
          `${entry.file} @ ${width}px: PNG size drift expected ${expected.bytes}B got ${stat.size}B`,
        );
      } else {
        pngProofsVerified++;
      }
    }
  }

  if (pngProofsVerified !== W1_EXPECTED_PNG_PROOF_COUNT && errors.length === 0) {
    errors.push(
      `PNG proof count ${pngProofsVerified} !== expected ${W1_EXPECTED_PNG_PROOF_COUNT}`,
    );
  }

  return {
    ok: errors.length === 0,
    verdict: errors.length === 0 ? null : "VCCK_W1_BLOCKED_SURFACE_PROOF",
    errors,
    details,
    manifestPath: manifestLoad.path,
    surfaceContract: manifestLoad.manifest.contract,
    fixturesVerified: details.length,
    widthsPerFixture: W1_AUDIT_PNG_WIDTHS.length,
    pngProofsVerified,
    expectedPngProofs: W1_EXPECTED_PNG_PROOF_COUNT,
  };
}

/** @deprecated alias */
export function verifyW1CandidateDrift(options = {}) {
  return verifyW1OutputMatchesCandidate(options);
}

export { verifyW1CandidateAgainstApproved };
