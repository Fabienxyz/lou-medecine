#!/usr/bin/env node
/** Read-only — compare candidate manifest to approved reference and output PNG drift. */

import fs from "node:fs";
import {
  verifyW1OutputMatchesCandidate,
  verifyW1ApprovedPngDrift,
  verifyW1CandidateAgainstApproved,
} from "../lib/vcck/w1-candidate-drift.js";
import { W1_APPROVED_PNG_MANIFEST, W1_CANDIDATE_PNG_MANIFEST } from "../lib/vcck/w1-approved-png.js";

function snapshotMtime(p) {
  return fs.existsSync(p) ? fs.statSync(p).mtimeMs : null;
}

const approvedMtimeBefore = snapshotMtime(W1_APPROVED_PNG_MANIFEST);

const candidateCompare = verifyW1CandidateAgainstApproved();
const outputDrift = verifyW1OutputMatchesCandidate();
const approvedDrift = verifyW1ApprovedPngDrift();

const errors = [...(outputDrift.errors || [])];

const approvedMtimeAfter = snapshotMtime(W1_APPROVED_PNG_MANIFEST);
if (approvedMtimeBefore != null && approvedMtimeAfter !== approvedMtimeBefore) {
  errors.push("approved manifest mtime changed during read-only verify");
}

if (errors.length) {
  console.error(`Verdict: ${candidateCompare.verdict || outputDrift.verdict || "VCCK_W1_BLOCKED_SURFACE_PROOF"}`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("W1 output vs candidate manifest: PASS");
console.log(`Candidate manifest: ${W1_CANDIDATE_PNG_MANIFEST}`);
console.log(`Approved manifest: ${W1_APPROVED_PNG_MANIFEST}`);
console.log(`Output PNG proofs verified: ${outputDrift.pngProofsVerified}`);
if (!candidateCompare.ok) {
  console.log(`Candidate vs approved: PENDING_CODEX_REAPPROVAL (${candidateCompare.errors.length} diffs)`);
} else {
  console.log("Candidate vs approved: PASS");
}
if (!approvedDrift.ok) {
  console.log(`Output vs approved: PENDING_CODEX_REAPPROVAL (${approvedDrift.errors.length} diffs)`);
}
