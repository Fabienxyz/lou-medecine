#!/usr/bin/env node
/**
 * Read-only verification — VCCK vcck/.gitignore patterns (relative to vcck/).
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

function checkIgnore(relPath) {
  const r = spawnSync("git", ["check-ignore", "-v", relPath], {
    cwd: ROOT,
    encoding: "utf8",
  });
  return { ignored: r.status === 0, detail: (r.stdout || r.stderr).trim() };
}

const MUST_IGNORE = [
  "tools/lou-build/vcck/output/chain/chain-short/artifact.svg",
  "tools/lou-build/vcck/gallery/index.html",
  "tools/lou-build/vcck/reports/w1-candidate-hashes.json",
  "tools/lou-build/vcck/reports/qualification-matrix.md",
  "tools/lou-build/vcck/reports/w1-stress-surfaces-report.json",
];

const MUST_NOT_IGNORE = [
  "tools/lou-build/vcck/reports/w1-approved-png-hashes.json",
  "tools/lou-build/vcck/approvals/w1-perceptual-approval.json",
  "tools/lou-build/vcck/snapshots/render-hashes.json",
  "tools/lou-build/vcck/reports/w1.6.1-execution-proof-report.md",
  "tools/lou-build/vcck/fixtures/w1/chain/chain-short.yaml",
  "tools/lou-build/vcck/registry/families.json",
];

const errors = [];

for (const p of MUST_IGNORE) {
  const r = checkIgnore(p);
  if (!r.ignored) errors.push(`expected ignored: ${p}`);
  else if (r.detail.includes("vcck/vcck/")) {
    errors.push(`stale vcck/ prefix in rule for ${p}: ${r.detail}`);
  }
}

for (const p of MUST_NOT_IGNORE) {
  const r = checkIgnore(p);
  if (r.ignored) errors.push(`must not ignore: ${p} (${r.detail})`);
}

if (errors.length) {
  console.error("VCCK gitignore verify FAIL");
  for (const e of errors) console.error("-", e);
  process.exit(1);
}

console.log("VCCK gitignore verify PASS");
for (const p of MUST_IGNORE) {
  console.log(`  ignored: ${p}`);
}
for (const p of MUST_NOT_IGNORE) {
  console.log(`  tracked: ${p}`);
}
