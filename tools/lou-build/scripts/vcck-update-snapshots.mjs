#!/usr/bin/env node
/** Update W1 render snapshots — eight Codex-approved positives only. */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { VCCK_SNAPSHOTS } from "../lib/vcck/paths.js";
import { updateRenderSnapshots } from "../lib/vcck/determinism-ipc.js";
import {
  w1ApprovedFixturePaths,
  w1ApprovedMetadataByFile,
} from "../lib/vcck/w1-snapshots.js";
import { verifyW1CandidateDrift } from "../lib/vcck/w1-candidate-drift.js";

const snapshotPath = path.join(VCCK_SNAPSHOTS, "render-hashes.json");
const metadataByFile = w1ApprovedMetadataByFile();
for (const key of Object.keys(metadataByFile)) {
  metadataByFile[key] = {
    ...metadataByFile[key],
    pngManifest: "vcck/reports/w1-candidate-hashes.json",
  };
}

const drift = verifyW1CandidateDrift();
if (!drift.ok) {
  console.error("Candidate drift detected — snapshot update blocked:");
  console.error(`Verdict: ${drift.verdict}`);
  for (const e of drift.errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("Candidate drift check: PASS (8 fixtures, PNG manifest W1-S1)");

const result = updateRenderSnapshots(w1ApprovedFixturePaths(), {
  snapshotPath,
  merge: true,
  metadataByFile,
});
console.log(`Updated ${result.count} W1 snapshot(s) → ${result.path}`);
