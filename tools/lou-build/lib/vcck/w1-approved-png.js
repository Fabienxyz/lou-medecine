/**
 * Approved PNG reference manifest — immutable during normal VCCK runs.
 */

import fs from "node:fs";
import path from "node:path";
import { VCCK_REPORTS } from "./paths.js";
import {
  W1_AUDIT_PNG_WIDTHS,
  W1_APPROVED_POSITIVES,
  W1_EXPECTED_PNG_PROOF_COUNT,
  assertW1ProofWidthContract,
} from "./w1-snapshots.js";

export const W1_APPROVED_PNG_MANIFEST = path.join(VCCK_REPORTS, "w1-approved-png-hashes.json");
export const W1_CANDIDATE_PNG_MANIFEST = path.join(VCCK_REPORTS, "w1-candidate-hashes.json");

export function loadPngManifest(manifestPath) {
  if (!fs.existsSync(manifestPath)) {
    return { ok: false, errors: [`missing manifest: ${manifestPath}`], manifest: null, path: manifestPath };
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const byKey = new Map();
  const widthsInManifest = new Set();
  for (const entry of manifest.candidates || manifest.approved || []) {
    byKey.set(`${entry.fixture}:${entry.width}`, entry);
    widthsInManifest.add(entry.width);
  }
  return {
    ok: true,
    errors: [],
    manifest,
    byKey,
    widthsInManifest: [...widthsInManifest].sort((a, b) => a - b),
    path: manifestPath,
  };
}

export function validatePngManifestShape(manifestLoad) {
  const errors = [];
  const { manifest, byKey, widthsInManifest } = manifestLoad;
  const entries = manifest.candidates || manifest.approved || [];

  const widthCheck = assertW1ProofWidthContract(widthsInManifest);
  if (!widthCheck.ok) errors.push(...widthCheck.errors);

  for (const w of W1_AUDIT_PNG_WIDTHS) {
    if (!widthsInManifest.includes(w)) errors.push(`manifest missing contract width ${w}`);
  }

  const expectedKeys = new Set();
  for (const entry of W1_APPROVED_POSITIVES) {
    const stem = entry.file.replace(".yaml", "");
    for (const width of W1_AUDIT_PNG_WIDTHS) {
      expectedKeys.add(`${stem}:${width}`);
    }
  }

  if (entries.length !== W1_EXPECTED_PNG_PROOF_COUNT) {
    errors.push(
      `manifest entry count ${entries.length} !== expected ${W1_EXPECTED_PNG_PROOF_COUNT}`,
    );
  }

  for (const key of expectedKeys) {
    if (!byKey.has(key)) errors.push(`manifest missing entry ${key}`);
  }
  for (const key of byKey.keys()) {
    if (!expectedKeys.has(key)) errors.push(`manifest unexpected entry ${key}`);
  }

  return errors;
}

/** Compare candidate manifest to approved reference — read-only. */
export function verifyW1CandidateAgainstApproved(options = {}) {
  const approvedPath = options.approvedPath || W1_APPROVED_PNG_MANIFEST;
  const candidatePath = options.candidatePath || W1_CANDIDATE_PNG_MANIFEST;

  const approvedLoad = loadPngManifest(approvedPath);
  if (!approvedLoad.ok) {
    return {
      ok: false,
      verdict: "VCCK_W1_BLOCKED_SURFACE_PROOF",
      errors: approvedLoad.errors,
      phase: "approved-missing",
    };
  }

  const candidateLoad = loadPngManifest(candidatePath);
  if (!candidateLoad.ok) {
    return {
      ok: false,
      verdict: "VCCK_W1_BLOCKED_SURFACE_PROOF",
      errors: candidateLoad.errors,
      phase: "candidate-missing",
    };
  }

  const errors = [
    ...validatePngManifestShape(approvedLoad),
    ...validatePngManifestShape(candidateLoad),
  ];

  for (const key of approvedLoad.byKey.keys()) {
    const a = approvedLoad.byKey.get(key);
    const c = candidateLoad.byKey.get(key);
    if (!c) {
      errors.push(`candidate missing ${key}`);
      continue;
    }
    if (c.hash !== a.hash) {
      errors.push(`${key}: candidate hash ${c.hash} !== approved ${a.hash}`);
    }
    if (c.bytes != null && a.bytes != null && c.bytes !== a.bytes) {
      errors.push(`${key}: candidate bytes ${c.bytes} !== approved ${a.bytes}`);
    }
  }

  return {
    ok: errors.length === 0,
    verdict: errors.length === 0 ? null : "VCCK_W1_BLOCKED_SURFACE_PROOF",
    errors,
    approvedPath,
    candidatePath,
    entryCount: W1_EXPECTED_PNG_PROOF_COUNT,
  };
}
