#!/usr/bin/env node
/**
 * Deterministic validation of Phase 3C targeted reconciliation.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "../../../../../tools/lou-build/node_modules/yaml/dist/index.js";
import { validateAllAnchors } from "../../../../../tools/lou-build/lib/anchors.js";
import { validateInventory } from "../../../../../tools/lou-build/lib/inventory.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../../../../../");
const CHAPTER = path.resolve(__dirname, "..");
const SOURCE = path.join(
  REPO,
  "01-learning/chapter-analysis/cardio/234-insuffisance-cardiaque/official-college.md"
);

const TARGET_SEGMENTS = ["SEG-061b", "SEG-061c", "SEG-063", "SEG-084", "SEG-091"];

function fail(errors) {
  console.error("PHASE 3C TARGETED RECONCILIATION FAIL");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}

const recon = YAML.parse(
  fs.readFileSync(path.join(__dirname, "reconciliation-phase3c-targeted.yaml"), "utf8")
);
const inventory = YAML.parse(
  fs.readFileSync(path.join(CHAPTER, "inventory.yaml"), "utf8")
);
const sourceMeta = YAML.parse(
  fs.readFileSync(path.join(CHAPTER, "source.meta.yaml"), "utf8")
);
const sourceText = fs.readFileSync(SOURCE, "utf8");

const errors = [];
const invIds = new Set(inventory.kps.map((k) => k.id));

if (recon.status !== "pass") errors.push(`status must be pass, got ${recon.status}`);
if (recon.inventory_kp_count !== 109) errors.push("inventory_kp_count must be 109");
if (inventory.kps.length !== 109) errors.push(`inventory has ${inventory.kps.length} KPs`);
if (recon.summary?.missed !== 0) errors.push("summary.missed must be 0");

const invVal = validateInventory(inventory);
if (!invVal.ok) errors.push(...invVal.errors);

const anchorVal = validateAllAnchors(sourceText, inventory, sourceMeta);
if (!anchorVal.ok) errors.push(...anchorVal.errors);

for (const sid of TARGET_SEGMENTS) {
  const seg = (recon.segments || []).find((s) => s.id === sid);
  if (!seg) errors.push(`missing targeted segment ${sid}`);
  else if (seg.disposition !== "represented") {
    errors.push(`${sid} must be represented, got ${seg.disposition}`);
  } else if (!seg.kp?.length) {
    errors.push(`${sid} must map to at least one KP`);
  }
}

const amb = (recon.segments || []).find((s) => s.id === "SEG-AMB-01");
if (!amb || amb.disposition !== "ambiguous") {
  errors.push("SEG-AMB-01 must remain ambiguous");
}
if (!amb?.kp?.includes("KP-089") || !amb?.kp?.includes("KP-096")) {
  errors.push("SEG-AMB-01 must reference KP-089 and KP-096");
}

const kp074 = inventory.kps.find((k) => k.id === "KP-074");
const kp076 = inventory.kps.find((k) => k.id === "KP-076");
const kp096 = inventory.kps.find((k) => k.id === "KP-096");
const kp100 = inventory.kps.find((k) => k.id === "KP-100");

if (!kp074?.anchors?.some((a) => a.quote.includes("régime sans sel peut être nuisible"))) {
  errors.push("SEG-061b not honestly anchored on KP-074");
}
if (!kp074?.anchors?.some((a) => a.quote.includes("augmenter sa dose de diurétiques"))) {
  errors.push("SEG-061c not honestly anchored on KP-074");
}
if (
  !kp076?.anchors?.some(
    (a) => a.section_path.includes("7 Contraception") && a.quote.includes("grossesse")
  )
) {
  errors.push("KP-076 contraception neighborhood not anchored");
}
if (!kp096?.source_conflict?.id) {
  errors.push("KP-096 FE/CCB conflict not explicitly preserved");
}
if (!kp100?.label.includes("morphine")) {
  errors.push("KP-100 morphine not reflected in semantic identity");
}

for (const seg of recon.segments || []) {
  for (const id of seg.kp || []) {
    if (!invIds.has(id)) errors.push(`${seg.id}: unknown KP ${id}`);
  }
}

const resolved = recon.reverse_check?.v2_misses_resolved_by_phase3c || [];
for (const sid of ["SEG-061b", "SEG-061c"]) {
  if (!resolved.includes(sid)) errors.push(`${sid} not listed as resolved`);
}

if ((recon.reverse_check?.insufficient_anchor_support_remaining || []).length) {
  errors.push("insufficient_anchor_support_remaining must be empty");
}
if ((recon.reverse_check?.newly_missed_segments || []).length) {
  errors.push("newly_missed_segments must be empty");
}
if ((recon.reverse_check?.unsupported_claims_introduced || []).length) {
  errors.push("unsupported_claims_introduced must be empty");
}

if (errors.length) fail(errors);

console.log("PHASE 3C TARGETED RECONCILIATION PASS");
console.log(
  JSON.stringify(
    {
      status: recon.status,
      targeted_segments: TARGET_SEGMENTS.length,
      ambiguous_preserved: 1,
      v2_misses_resolved: resolved,
    },
    null,
    2
  )
);
