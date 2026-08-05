/**
 * Codex perceptual attestation — distinct from hash drift verification.
 */

import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { VCCK_ROOT } from "./paths.js";
import { W1_APPROVED_PNG_MANIFEST } from "./w1-approved-png.js";
import { W1_AUDIT_PNG_WIDTHS, W1_EXPECTED_PNG_PROOF_COUNT } from "./w1-snapshots.js";
import { W1_FAMILIES } from "./w1-constants.js";

export const PERCEPTUAL_APPROVAL_CONTRACT = "VCCK-W1-PERCEPTUAL-APPROVAL-1";
export const DEFAULT_PERCEPTUAL_APPROVAL_PATH = path.join(
  VCCK_ROOT,
  "approvals/w1-perceptual-approval.json",
);

const EXPECTED_FIXTURES = Object.freeze([
  "chain-short",
  "chain-long",
  "dependent-sequence-short",
  "dependent-sequence-long",
  "two-pole-short",
  "two-pole-long",
  "flat-concurrent-short",
  "flat-concurrent-long",
]);

export function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

export function loadPerceptualApproval(approvalPath = DEFAULT_PERCEPTUAL_APPROVAL_PATH) {
  if (!fs.existsSync(approvalPath)) {
    return { ok: false, errors: [`perceptual approval missing: ${approvalPath}`], doc: null };
  }
  let doc;
  try {
    doc = JSON.parse(fs.readFileSync(approvalPath, "utf8"));
  } catch (e) {
    return { ok: false, errors: [`invalid JSON: ${e.message}`], doc: null };
  }
  return { ok: true, errors: [], doc, path: approvalPath };
}

/** Validate attestation against approved manifest — read-only. */
export function validatePerceptualApproval(options = {}) {
  const approvalPath = options.approvalPath || DEFAULT_PERCEPTUAL_APPROVAL_PATH;
  const manifestPath = options.manifestPath || W1_APPROVED_PNG_MANIFEST;
  const load = loadPerceptualApproval(approvalPath);
  if (!load.ok) return { ok: false, errors: load.errors, status: "BLOCKED" };

  const doc = load.doc;
  const errors = [];

  if (doc.contract !== PERCEPTUAL_APPROVAL_CONTRACT) {
    errors.push(`contract mismatch expected ${PERCEPTUAL_APPROVAL_CONTRACT} got ${doc.contract}`);
  }
  if (doc.status !== "PASS_CODEX") errors.push(`status must be PASS_CODEX got ${doc.status}`);
  if (doc.authority !== "CODEX") errors.push(`authority must be CODEX got ${doc.authority}`);

  const scope = doc.scope || {};
  const families = [...(scope.families || [])].sort();
  const expectedFamilies = [...W1_FAMILIES].sort();
  if (JSON.stringify(families) !== JSON.stringify(expectedFamilies)) {
    errors.push(`families mismatch expected ${expectedFamilies.join(",")} got ${families.join(",")}`);
  }

  const fixtures = [...(scope.fixtures || [])].sort();
  const expectedFixtures = [...EXPECTED_FIXTURES].sort();
  if (JSON.stringify(fixtures) !== JSON.stringify(expectedFixtures)) {
    errors.push(`fixtures mismatch expected 8 approved positives`);
  }

  const widths = [...(scope.widths || [])].sort((a, b) => a - b);
  const expectedWidths = [...W1_AUDIT_PNG_WIDTHS].sort((a, b) => a - b);
  if (JSON.stringify(widths) !== JSON.stringify(expectedWidths)) {
    errors.push(`widths mismatch expected ${expectedWidths.join(",")}`);
  }

  if (scope.proofCount !== W1_EXPECTED_PNG_PROOF_COUNT) {
    errors.push(`proofCount must be ${W1_EXPECTED_PNG_PROOF_COUNT} got ${scope.proofCount}`);
  }

  if (!fs.existsSync(manifestPath)) {
    errors.push(`approved manifest missing: ${manifestPath}`);
  } else {
    const manifestHash = sha256File(manifestPath);
    if (doc.approvedManifestSha256 !== manifestHash) {
      errors.push(
        `approvedManifestSha256 mismatch expected ${manifestHash} got ${doc.approvedManifestSha256}`,
      );
    }
  }

  const relManifest = doc.approvedManifest;
  if (relManifest !== "vcck/reports/w1-approved-png-hashes.json") {
    errors.push(`approvedManifest path unexpected: ${relManifest}`);
  }

  const extraKeys = Object.keys(doc).filter(
    (k) => !["contract", "status", "authority", "scope", "approvedManifest", "approvedManifestSha256"].includes(k),
  );
  if (extraKeys.length) errors.push(`unexpected attestation keys: ${extraKeys.join(",")}`);

  return {
    ok: errors.length === 0,
    errors,
    status: errors.length === 0 ? "PASS_CODEX" : "FAIL",
    doc,
    path: approvalPath,
  };
}
