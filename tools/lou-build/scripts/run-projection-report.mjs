#!/usr/bin/env node
/**
 * Projection Verification / Total Disposition — CI report-only runner.
 *
 * Always exits 0. Never blocks publication. Writes JSON report artifact.
 *
 * Usage:
 *   node scripts/run-projection-report.mjs [--chapter 01-learning/chapters/cardio/234]
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { REPO_ROOT } from "../lib/paths.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const opts = { chapter: "01-learning/chapters/cardio/234" };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--chapter" && argv[i + 1]) {
      opts.chapter = argv[i + 1];
      i += 1;
    }
  }
  return opts;
}

const opts = parseArgs(process.argv);
const baselineScript = path.join(__dirname, "run-projection-baseline.mjs");

const result = spawnSync(
  process.execPath,
  [baselineScript, "--phase", "total-disposition", "--chapter", opts.chapter],
  { encoding: "utf8", cwd: path.join(__dirname, "..") },
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

const chapterDir = path.isAbsolute(opts.chapter)
  ? opts.chapter
  : path.join(REPO_ROOT, opts.chapter);
const reportPath = path.join(chapterDir, "build/projection-total-disposition-report.json");

let summary = { status: "REPORT-ONLY", gate: "NOT_BLOCKED" };
if (fs.existsSync(reportPath)) {
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const c = report.corpus || {};
  summary = {
    status: "REPORT-ONLY",
    gate: "NOT_BLOCKED",
    mission: report.mission,
    figureCount: c.figureCount,
    missing: c.missing,
    duplicated: c.duplicated,
    orphan: c.orphan,
    dispositionMismatches: c.dispositionMismatches,
    unknown: c.dispositions?.unknown,
    reportPath: path.relative(REPO_ROOT, reportPath),
  };
}

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log("  Projection Verification — REPORT-ONLY (no gate)");
console.log(JSON.stringify(summary, null, 2));
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

process.exit(0);
