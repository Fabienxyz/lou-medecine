#!/usr/bin/env node
/**
 * Phase 3C inventory correction validator (deterministic).
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
const CORRECTIONS = path.join(__dirname, "inventory-phase3c-corrections.yaml");

const REQUIRED_SEGMENTS = [
  "SEG-061b",
  "SEG-061c",
  "SEG-063",
  "SEG-084",
  "SEG-091",
];

const FROZEN = {
  "KP-040":
    "Augmentation des pressions de remplissage et transmission de la pression télédiastolique VG vers veines et capillaires pulmonaires",
  "KP-041": "Seuil PPC > 25 mmHg → transsudat → OAP cardiogénique",
  "KP-042":
    "OAP lésionnel non cardiogénique → lésions membrane alvéolo-capillaire → exsudat",
};

const sourceText = fs.readFileSync(SOURCE, "utf8");
const inventory = YAML.parse(
  fs.readFileSync(path.join(CHAPTER, "inventory.yaml"), "utf8")
);
const corrections = YAML.parse(fs.readFileSync(CORRECTIONS, "utf8"));
const sourceMeta = YAML.parse(
  fs.readFileSync(path.join(CHAPTER, "source.meta.yaml"), "utf8")
);

const errors = [];

const invVal = validateInventory(inventory);
if (!invVal.ok) errors.push(...invVal.errors);

const anchorVal = validateAllAnchors(sourceText, inventory, sourceMeta);
if (!anchorVal.ok) errors.push(...anchorVal.errors);

for (const [id, labelStart] of Object.entries(FROZEN)) {
  const kp = inventory.kps.find((k) => k.id === id);
  if (!kp) errors.push(`${id} missing`);
  else if (!kp.label.startsWith(labelStart.slice(0, 40))) {
    errors.push(`${id} semantic identity changed`);
  }
}

if (inventory.kps.some((k) => /^CAND-/.test(k.id))) {
  errors.push("CAND-* ids remain in canonical inventory");
}

if (inventory.revision !== "phase-3c-corrected") {
  errors.push(`inventory revision must be phase-3c-corrected, got ${inventory.revision}`);
}

const segmentIds = new Set(
  (corrections.corrections || []).map((c) => c.segment_id)
);
for (const sid of REQUIRED_SEGMENTS) {
  if (!segmentIds.has(sid)) {
    errors.push(`missing Phase 3C resolution for ${sid}`);
  }
}

if (corrections.starting_kp_count !== 109) {
  errors.push("corrections starting_kp_count must be 109");
}
if (corrections.final_kp_count !== 109) {
  errors.push("corrections final_kp_count must be 109");
}
if (inventory.kps.length !== 109) {
  errors.push(`inventory kps=${inventory.kps.length} != 109`);
}
if ((corrections.new_kp_ids || []).length !== 0) {
  errors.push("Phase 3C must not add new KPs");
}

const kp074 = inventory.kps.find((k) => k.id === "KP-074");
if (
  !kp074?.anchors?.some((a) =>
    a.quote.includes("régime sans sel peut être nuisible")
  )
) {
  errors.push("KP-074 missing SEG-061b denutrition anchor");
}
if (
  !kp074?.anchors?.some((a) =>
    a.quote.includes("augmenter sa dose de diurétiques")
  )
) {
  errors.push("KP-074 missing SEG-061c diuretic uptitration anchor");
}

const kp076 = inventory.kps.find((k) => k.id === "KP-076");
if (
  !kp076?.anchors?.some((a) =>
    a.section_path.includes("7 Contraception") &&
    a.quote.includes("grossesse expose")
  )
) {
  errors.push("KP-076 missing contraception anchor");
}

const kp096 = inventory.kps.find((k) => k.id === "KP-096");
if (
  !kp096?.anchors?.some((a) =>
    a.quote.includes("inhibiteur calcique ralentisseur")
  )
) {
  errors.push("KP-096 missing VI.F rate-slowing CCB anchor");
}
if (!kp096?.source_conflict?.id) {
  errors.push("KP-096 must carry source_conflict for FE/CCB ambiguity");
}
if (!kp096?.label.includes("conflit")) {
  errors.push("KP-096 label must preserve FE/CCB conflict explicitly");
}

const kp100 = inventory.kps.find((k) => k.id === "KP-100");
if (!kp100?.label.includes("morphine")) {
  errors.push("KP-100 label must include morphine caveat");
}
if (
  !kp100?.anchors?.some((a) => a.quote.includes("morphine IV non recommandée"))
) {
  errors.push("KP-100 missing morphine anchor");
}

const kp041 = inventory.kps.find((k) => k.id === "KP-041");
if (!kp041?.anchors?.some((a) => a.quote.includes("> 25 mmHg"))) {
  errors.push("KP-041 OAP >25 mmHg threshold must remain unchanged");
}

const feKp = inventory.kps.find((k) => k.id === "KP-089");
if (!feKp?.anchors?.some((a) => a.quote.includes("IC systolique"))) {
  errors.push("KP-089 must remain IC systolique body-grounded");
}

if (errors.length) {
  console.error("PHASE 3C VALIDATION FAIL");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}

const counts = {};
for (const kp of inventory.kps) {
  counts[kp.disposition] = (counts[kp.disposition] || 0) + 1;
}

console.log("PHASE 3C VALIDATION PASS");
console.log(`kps=${inventory.kps.length}`);
console.log("dispositions:", counts);
console.log(`anchors_checked=${anchorVal.results.length}`);
