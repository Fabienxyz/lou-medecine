#!/usr/bin/env node
/**
 * Fast global consistency / reverse check after Phase 3C corrections.
 * Not a fresh full-chapter semantic extraction.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "../../../../../tools/lou-build/node_modules/yaml/dist/index.js";
import { validateInventory } from "../../../../../tools/lou-build/lib/inventory.js";
import { validateAllAnchors } from "../../../../../tools/lou-build/lib/anchors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../../../../../");
const CHAPTER = path.resolve(__dirname, "..");
const SOURCE = path.join(
  REPO,
  "01-learning/chapter-analysis/cardio/234-insuffisance-cardiaque/official-college.md"
);

const FROZEN = ["KP-040", "KP-041", "KP-042"];
const V2_MISSES = ["SEG-061b", "SEG-061c"];

function fail(errors) {
  console.error("PHASE 3C GLOBAL CONSISTENCY FAIL");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}

const inventory = YAML.parse(
  fs.readFileSync(path.join(CHAPTER, "inventory.yaml"), "utf8")
);
const sourceMeta = YAML.parse(
  fs.readFileSync(path.join(CHAPTER, "source.meta.yaml"), "utf8")
);
const v2 = YAML.parse(
  fs.readFileSync(path.join(__dirname, "reconciliation-full-v2.yaml"), "utf8")
);
const targeted = YAML.parse(
  fs.readFileSync(path.join(__dirname, "reconciliation-phase3c-targeted.yaml"), "utf8")
);
const corrections = YAML.parse(
  fs.readFileSync(path.join(__dirname, "inventory-phase3c-corrections.yaml"), "utf8")
);
const sourceText = fs.readFileSync(SOURCE, "utf8");

const errors = [];
const ids = inventory.kps.map((k) => k.id);
const unique = new Set(ids);

if (unique.size !== ids.length) errors.push("duplicate KP IDs");
if (inventory.kps.length !== 109) errors.push(`KP count ${inventory.kps.length} != 109`);
if (inventory.kps.some((k) => /^CAND-/.test(k.id))) errors.push("CAND-* IDs present");

for (const id of FROZEN) {
  if (!unique.has(id)) errors.push(`missing frozen identity ${id}`);
}

const invVal = validateInventory(inventory);
if (!invVal.ok) errors.push(...invVal.errors);

for (const kp of inventory.kps) {
  if (
    (kp.disposition === "understanding" || kp.disposition === "deferred-to-mastery") &&
    (!Array.isArray(kp.anchors) || kp.anchors.length === 0)
  ) {
    errors.push(`${kp.id}: understanding/deferred KP without anchors`);
  }
}

const anchorVal = validateAllAnchors(sourceText, inventory, sourceMeta);
if (!anchorVal.ok) errors.push(...anchorVal.errors);

const kp041 = inventory.kps.find((k) => k.id === "KP-041");
if (!kp041?.anchors?.some((a) => a.quote.includes("> 25 mmHg"))) {
  errors.push("KP-041 OAP >25 mmHg threshold changed or missing");
}

for (const sid of V2_MISSES) {
  const v2Seg = (v2.segments || []).find((s) => s.id === sid);
  if (v2Seg?.disposition !== "missed") {
    errors.push(`${sid} was not missed in v2 baseline`);
  }
  const resolved = targeted.reverse_check?.v2_misses_resolved_by_phase3c || [];
  if (!resolved.includes(sid)) errors.push(`${sid} not marked resolved in targeted recon`);
}

const kp096 = inventory.kps.find((k) => k.id === "KP-096");
if (!kp096?.source_conflict?.id) {
  errors.push("FE/CCB ambiguity not explicitly tracked on KP-096");
}

const amb = (targeted.segments || []).find((s) => s.id === "SEG-AMB-01");
if (!amb || amb.disposition !== "ambiguous") {
  errors.push("SEG-AMB-01 FE/CCB ambiguity not preserved in targeted recon");
}

if (corrections.final_kp_count !== 109 || corrections.starting_kp_count !== 109) {
  errors.push("Phase 3C corrections KP count mismatch");
}

const mapped = new Set();
for (const seg of v2.segments || []) {
  for (const id of seg.kp || []) mapped.add(id);
}
for (const c of corrections.corrections || []) {
  if (c.target_kp) mapped.add(c.target_kp);
}
const orphans = [...unique].filter((id) => !mapped.has(id));
if (orphans.length && v2.reverse_check?.orphan_kps?.length === 0) {
  const newOrphans = orphans.filter((id) => !["KP-107", "KP-108"].includes(id));
  if (newOrphans.length) {
    errors.push(`unexpected orphan KPs after Phase 3C: ${newOrphans.join(", ")}`);
  }
}

if (targeted.status !== "pass") errors.push("targeted reconciliation must pass first");
if ((targeted.summary?.missed || 0) > 0) {
  errors.push("known v2 misses still open in targeted reconciliation");
}

if (errors.length) fail(errors);

console.log("PHASE 3C GLOBAL CONSISTENCY PASS");
console.log(
  JSON.stringify(
    {
      kp_count: inventory.kps.length,
      unique_ids: unique.size,
      anchors_checked: anchorVal.results.length,
      v2_misses_resolved: V2_MISSES,
      fe_ccb_ambiguity: kp096.source_conflict.id,
      oap_threshold: "> 25 mmHg preserved on KP-041",
      blueprint_started: false,
      projections_started: false,
    },
    null,
    2
  )
);
