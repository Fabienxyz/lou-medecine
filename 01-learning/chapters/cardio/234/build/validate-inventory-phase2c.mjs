#!/usr/bin/env node
/**
 * Phase 2C canonical inventory validator (deterministic).
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
const ID_MAP = path.join(__dirname, "inventory-id-map.yaml");

const sourceText = fs.readFileSync(SOURCE, "utf8");
const inventory = YAML.parse(
  fs.readFileSync(path.join(CHAPTER, "inventory.yaml"), "utf8")
);
const idMap = YAML.parse(fs.readFileSync(ID_MAP, "utf8"));

const FROZEN = {
  "KP-040":
    "Augmentation des pressions de remplissage et transmission de la pression télédiastolique VG vers veines et capillaires pulmonaires",
  "KP-041": "Seuil PPC > 25 mmHg → transsudat → OAP cardiogénique",
  "KP-042":
    "OAP lésionnel non cardiogénique → lésions membrane alvéolo-capillaire → exsudat",
};

const REQUIRED_SPLITS = [
  "CAND-010",
  "CAND-022",
  "CAND-073",
  "CAND-080",
  "CAND-088",
];
const REQUIRED_ADDITIONS = [
  "(added)", // scintigraphie + dihydropyridines + 2 precipitant KPs — checked via mapping actions
];

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

for (const splitId of REQUIRED_SPLITS) {
  const rows = idMap.mappings.filter((m) => m.candidate_id === splitId);
  if (rows.length < 2) errors.push(`split ${splitId} not mapped to multiple KPs`);
}

const added = idMap.mappings.filter((m) => m.action === "added");
if (added.length < 4) {
  errors.push(`expected ≥4 added KPs (scintigraphie, dihydropyridines, 2 precipitant); found ${added.length}`);
}

const bbKp = inventory.kps.find((k) =>
  k.label.includes("déjà sous bêtabloquant") && k.label.includes("arrêt")
);
if (!bbKp) errors.push("double-missed: beta-blocker stop/reduce not represented");

const faPrecip = inventory.kps.find((k) =>
  k.label.includes("digoxine IV") &&
  (k.label.includes("FA") ||
    k.anchors?.some((a) => a.quote.includes("fibrillation atriale")))
);
if (!faPrecip) errors.push("double-missed: FA/digoxin precipitant not represented");

const nicKp = inventory.kps.find((k) => k.label.includes("nicardipine IV"));
if (!nicKp) errors.push("double-missed: nicardipine precipitant not represented");

const cathKp = inventory.kps.find((k) =>
  k.label.includes("OD < 5 mmHg") || k.anchors?.some((a) => a.quote.includes("normale < 5 mmHg"))
);
if (!cathKp) errors.push("double-missed: normal cath reference pressures not represented");

const transplant = inventory.kps.find((k) =>
  idMap.mappings.some((m) => m.candidate_id === "CAND-085" && m.final_kp_id === k.id)
);
if (!transplant || transplant.disposition !== "deferred-to-mastery") {
  errors.push("CAND-085 must be deferred-to-mastery");
}

const amio = inventory.kps.find((k) =>
  k.label.startsWith("Amiodarone : seul antiarythmique")
);
if (!amio || amio.disposition !== "understanding") {
  errors.push("amiodarone split must be understanding");
}

if (errors.length) {
  console.error("PHASE 2C VALIDATION FAIL");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}

const counts = {};
for (const kp of inventory.kps) {
  counts[kp.disposition] = (counts[kp.disposition] || 0) + 1;
}

console.log("PHASE 2C VALIDATION PASS");
console.log(`kps=${inventory.kps.length}`);
console.log("dispositions:", counts);
