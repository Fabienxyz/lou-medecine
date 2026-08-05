#!/usr/bin/env node
/**
 * VCCK P0.1 runner — single verdict authority, strict proof gates.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runVcckQualification } from "../lib/vcck/pipeline.js";
import { buildGallery } from "../lib/vcck/gallery.js";
import { auditAntiSpecializationTransitive } from "../lib/vcck/anti-specialization.js";
import { runAllRejectFixtures, computeRejectFixturesOk } from "../lib/vcck/reject-fixtures.js";
import { VCCK_REPORTS } from "../lib/vcck/paths.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const skipPlaywright = process.argv.includes("--skip-playwright");

  console.log("VCCK P0.2 — Visual Composition Conformance Kit");
  console.log(
    `Mode: ${dryRun ? "dry-run (no report writes)" : skipPlaywright ? "no-playwright" : "full"}`,
  );

  const audit = auditAntiSpecializationTransitive();
  if (!dryRun) {
    fs.mkdirSync(VCCK_REPORTS, { recursive: true });
    fs.writeFileSync(
      path.join(VCCK_REPORTS, "anti-specialization.json"),
      JSON.stringify(audit, null, 2),
    );
  }

  if (!audit.ok) {
    console.error("Anti-specialization audit FAILED:", audit.violations);
    process.exitCode = 1;
  } else {
    console.log(`Anti-specialization audit: PASS (${audit.scannedFiles.length} files)`);
  }

  const rejectResults = runAllRejectFixtures();
  const rejectOk = computeRejectFixturesOk(rejectResults);

  if (!rejectOk) {
    console.error("Reject fixture failures:", rejectResults.filter((r) => r.negative !== "PASS"));
    process.exitCode = 1;
  } else {
    console.log("Reject fixtures (9 codes): PASS");
  }

  const results = await runVcckQualification({
    dryRun,
    skipPlaywright: dryRun || skipPlaywright,
    rejectResults,
    checkInterProcessDeterminism: true,
  });

  if (!dryRun) {
    const galleryPath = buildGallery(results);
    console.log(`Gallery: ${galleryPath}`);
    console.log(`Matrix: ${path.join(VCCK_REPORTS, "qualification-matrix.md")}`);
    fs.writeFileSync(
      path.join(VCCK_REPORTS, "reject-fixtures.json"),
      JSON.stringify(rejectResults, null, 2),
    );
  }

  console.log(`Proof harness ready: ${results.proofHarnessReady}`);
  console.log(`IPC determinism: skipped=${results.interProcessDeterminism?.skipped}, ok=${results.interProcessDeterminism?.ok}`);
  if (results.interProcessDeterminism?.hashA) {
    console.log(`IPC hash: ${results.interProcessDeterminism.hashA}`);
  }
  console.log(`Surfaces complete: ${results.surfaces?.ok} (${results.surfaces?.present}/${results.surfaces?.expectedTotal})`);
  console.log(`Mission verdict: ${results.missionVerdict}`);
  console.log(`W1 mission verdict: ${results.w1MissionVerdict ?? "N/A"}`);

  if (results.missionVerdict !== "READY_FOR_VCCK_P1_FAMILY_REDESIGN") {
    console.error("P0.2 exit condition not met — VCCK_P0_BLOCKED");
    if (!process.exitCode) process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
