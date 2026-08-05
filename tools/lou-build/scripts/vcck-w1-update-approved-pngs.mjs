#!/usr/bin/env node
/** Manual explicit update of approved PNG reference — never run from normal VCCK qualification. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { VCCK_REPORTS } from "../lib/vcck/paths.js";
import {
  W1_APPROVED_PNG_MANIFEST,
  W1_CANDIDATE_PNG_MANIFEST,
  loadPngManifest,
  validatePngManifestShape,
} from "../lib/vcck/w1-approved-png.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.argv.includes("--help")) {
  console.log("Usage: node scripts/vcck-w1-update-approved-pngs.mjs [--from-candidate]");
  console.log("Copies w1-candidate-hashes.json to w1-approved-png-hashes.json after shape validation.");
  process.exit(0);
}

const source = process.argv.includes("--from-candidate")
  ? W1_CANDIDATE_PNG_MANIFEST
  : W1_CANDIDATE_PNG_MANIFEST;

const load = loadPngManifest(source);
if (!load.ok) {
  console.error(load.errors.join("\n"));
  process.exit(1);
}
const shapeErrors = validatePngManifestShape(load);
if (shapeErrors.length) {
  console.error("Manifest shape invalid:");
  for (const e of shapeErrors) console.error(`  - ${e}`);
  process.exit(1);
}

const payload = {
  contract: load.manifest.contract,
  approved: (load.manifest.candidates || load.manifest.approved || []).map((e) => ({ ...e })),
  updatedAt: new Date().toISOString(),
  source: path.relative(path.join(__dirname, ".."), source),
};

fs.mkdirSync(VCCK_REPORTS, { recursive: true });
fs.writeFileSync(W1_APPROVED_PNG_MANIFEST, JSON.stringify(payload, null, 2));
console.log(`Approved PNG reference updated: ${W1_APPROVED_PNG_MANIFEST}`);
console.log(`Entries: ${payload.approved.length}`);
