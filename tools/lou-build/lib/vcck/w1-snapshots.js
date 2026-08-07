/**
 * W1 approved snapshot fixtures — eight positives Codex-audited (W1.1).
 */

import path from "node:path";
import { VCCK_POSITIVE, VCCK_VIEWPORT_WIDTHS } from "./paths.js";
import { W1_CONTRACT_VERSION, W1_VIEWPORT_WIDTHS } from "./w1-constants.js";
import { W1_SURFACE_CONTRACT } from "./w1-surface.js";

export const W1_APPROVED_POSITIVES = Object.freeze([
  {
    file: "chain-short.yaml",
    family: "chain",
    contractVersion: W1_CONTRACT_VERSION.chain,
    technology: "svg",
  },
  {
    file: "chain-long.yaml",
    family: "chain",
    contractVersion: W1_CONTRACT_VERSION.chain,
    technology: "svg",
  },
  {
    file: "dependent-sequence-short.yaml",
    family: "dependent-sequence",
    contractVersion: W1_CONTRACT_VERSION["dependent-sequence"],
    technology: "svg",
  },
  {
    file: "dependent-sequence-long.yaml",
    family: "dependent-sequence",
    contractVersion: W1_CONTRACT_VERSION["dependent-sequence"],
    technology: "svg",
  },
  {
    file: "two-pole-short.yaml",
    family: "two-pole",
    contractVersion: W1_CONTRACT_VERSION["two-pole"],
    technology: "svg",
  },
  {
    file: "two-pole-long.yaml",
    family: "two-pole",
    contractVersion: W1_CONTRACT_VERSION["two-pole"],
    technology: "svg",
  },
  {
    file: "flat-concurrent-short.yaml",
    family: "flat-concurrent",
    contractVersion: W1_CONTRACT_VERSION["flat-concurrent"],
    technology: "svg",
  },
  {
    file: "flat-concurrent-long.yaml",
    family: "flat-concurrent",
    contractVersion: W1_CONTRACT_VERSION["flat-concurrent"],
    technology: "svg",
  },
]);

/** Authoritative W1 PNG proof widths — must match global VCCK contract. */
export const W1_AUDIT_PNG_WIDTHS = Object.freeze([...VCCK_VIEWPORT_WIDTHS]);

export const W1_EXPECTED_PNG_PROOF_COUNT =
  W1_APPROVED_POSITIVES.length * W1_AUDIT_PNG_WIDTHS.length;

/** Assert manifest, audit, surface and global viewport lists are identical. */
export function assertW1ProofWidthContract(manifestWidths = null) {
  const expected = [...VCCK_VIEWPORT_WIDTHS];
  const errors = [];
  if (JSON.stringify([...W1_AUDIT_PNG_WIDTHS]) !== JSON.stringify(expected)) {
    errors.push("W1_AUDIT_PNG_WIDTHS diverges from VCCK_VIEWPORT_WIDTHS");
  }
  if (JSON.stringify([...W1_VIEWPORT_WIDTHS]) !== JSON.stringify(expected)) {
    errors.push("W1_VIEWPORT_WIDTHS diverges from VCCK_VIEWPORT_WIDTHS");
  }
  if (manifestWidths != null && JSON.stringify([...manifestWidths].sort((a, b) => a - b)) !== JSON.stringify(expected)) {
    errors.push("manifest widths diverge from contract");
  }
  if (W1_SURFACE_CONTRACT.version !== "W1-S1") {
    errors.push("unexpected surface contract version");
  }
  return { ok: errors.length === 0, errors, expected };
}

export function w1ApprovedFixturePaths() {
  return W1_APPROVED_POSITIVES.map((e) => path.join(VCCK_POSITIVE, e.file));
}

export function w1ApprovedMetadataByFile() {
  return Object.fromEntries(W1_APPROVED_POSITIVES.map((e) => [e.file, e]));
}
