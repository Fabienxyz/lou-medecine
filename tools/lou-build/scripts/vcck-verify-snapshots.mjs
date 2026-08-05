#!/usr/bin/env node
/** Verify W1 render snapshots — never writes reference files. */

import fs from "node:fs";
import path from "node:path";
import { VCCK_SNAPSHOTS } from "../lib/vcck/paths.js";
import { verifyRenderSnapshots } from "../lib/vcck/determinism-ipc.js";
import { w1ApprovedFixturePaths } from "../lib/vcck/w1-snapshots.js";

const snapshotPath = path.join(VCCK_SNAPSHOTS, "render-hashes.json");
const fixtures = w1ApprovedFixturePaths();

const beforeStat = fs.existsSync(snapshotPath) ? fs.statSync(snapshotPath) : null;
const beforeContent = beforeStat ? fs.readFileSync(snapshotPath, "utf8") : null;

const result = verifyRenderSnapshots(fixtures, { snapshotPath });

if (beforeStat) {
  const afterStat = fs.statSync(snapshotPath);
  const afterContent = fs.readFileSync(snapshotPath, "utf8");
  if (afterStat.mtimeMs !== beforeStat.mtimeMs || afterContent !== beforeContent) {
    console.error("Snapshot verify modified reference file — forbidden");
    process.exit(1);
  }
}

if (!result.ok) {
  console.error("Snapshot verify FAILED:");
  for (const e of result.errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(
  `Snapshot verify PASS (${result.results.length}/8):`,
  result.results.map((r) => `${r.fixture}=${r.hash.slice(0, 12)}…`).join(", "),
);
