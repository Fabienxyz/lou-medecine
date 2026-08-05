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

const driftOptions = {
  ...(process.env.VCCK_W1_CANDIDATE_MANIFEST
    ? { manifestPath: process.env.VCCK_W1_CANDIDATE_MANIFEST }
    : {}),
};
const compareOptions = {
  ...(process.env.VCCK_W1_CANDIDATE_MANIFEST
    ? { candidatePath: process.env.VCCK_W1_CANDIDATE_MANIFEST }
    : {}),
  ...(process.env.VCCK_W1_APPROVED_MANIFEST
    ? { approvedPath: process.env.VCCK_W1_APPROVED_MANIFEST }
    : {}),
};
const approvedOptions = {
  ...(process.env.VCCK_W1_APPROVED_MANIFEST
    ? { manifestPath: process.env.VCCK_W1_APPROVED_MANIFEST }
    : {}),
};

const candidateCompare = verifyW1CandidateAgainstApproved(compareOptions);
const outputDrift = verifyW1OutputMatchesCandidate(driftOptions);
const approvedDrift = verifyW1ApprovedPngDrift(approvedOptions);

const errors = [
  ...(outputDrift.errors || []),
  ...(candidateCompare.errors || []),
  ...(approvedDrift.errors || []),
];

const approvedMtimeAfter = snapshotMtime(W1_APPROVED_PNG_MANIFEST);
if (approvedMtimeBefore != null && approvedMtimeAfter !== approvedMtimeBefore) {
  errors.push("approved manifest mtime changed during read-only verify");
}

if (errors.length) {
  console.error(`Verdict: ${outputDrift.verdict || candidateCompare.verdict || "VCCK_W1_BLOCKED_SURFACE_PROOF"}`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log("W1 output vs candidate manifest: PASS");
console.log(`Candidate manifest: ${W1_CANDIDATE_PNG_MANIFEST}`);
console.log(`Approved manifest: ${W1_APPROVED_PNG_MANIFEST}`);
console.log(`Output PNG proofs verified: ${outputDrift.pngProofsVerified}`);
console.log("Candidate vs approved: PASS");
console.log("Output vs approved: PASS");
