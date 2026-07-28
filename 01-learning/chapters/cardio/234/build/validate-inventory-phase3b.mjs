#!/usr/bin/env node
/**
 * Phase 3B inventory correction validator (deterministic).
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
  "01-learning/full-edn/cardiology/edition-2022/chapters/item-234-insuffisance-cardiaque-de-ladulte.md"
);
const CORRECTIONS = path.join(__dirname, "inventory-phase3b-corrections.yaml");

const REQUIRED_FINDINGS = [
  "M1",
  "M2",
  "M3",
  "M4",
  "M5",
  "M6",
  "M7",
  "M8",
  "M9",
  "M10",
  "M11",
  "M12",
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

const correctionIds = new Set(
  (corrections.corrections || []).map((c) => c.finding_id)
);
for (const fid of REQUIRED_FINDINGS) {
  if (!correctionIds.has(fid)) {
    errors.push(`missing Phase 3B resolution for ${fid}`);
  }
}

if (corrections.starting_kp_count !== 108) {
  errors.push("corrections starting_kp_count must be 108");
}
if (inventory.kps.length !== corrections.final_kp_count) {
  errors.push(
    `inventory kps=${inventory.kps.length} != corrections final_kp_count=${corrections.final_kp_count}`
  );
}

const kp109 = inventory.kps.find((k) => k.id === "KP-109");
if (!kp109) errors.push("KP-109 missing");
if (!kp109?.label.includes("SCA")) {
  errors.push("KP-109 must cover SCA+IC dual management");
}

const bbKeep = inventory.kps.find((k) => k.id === "KP-081");
if (
  !bbKeep?.anchors?.some((a) =>
    a.quote.includes("il n’est pas recommandé d’arrêter le bêtabloquant")
  )
) {
  errors.push("KP-081 missing VI.C keep-on-BB anchor");
}

const bbStop = inventory.kps.find((k) => k.id === "KP-103");
if (
  !bbStop?.anchors?.some((a) =>
    a.quote.includes("généralement arrêté ou sa posologie est diminuée")
  )
) {
  errors.push("KP-103 missing VII.A stop/reduce anchor");
}

const feKp = inventory.kps.find((k) => k.id === "KP-089");
if (!feKp?.anchors?.some((a) => a.quote.includes("IC systolique"))) {
  errors.push("KP-089 must remain IC systolique body-grounded");
}
if (
  feKp?.anchors?.some((a) =>
    a.quote.includes("FE préservée") && a.quote.includes("contre-indiqués")
  )
) {
  errors.push("KP-089 must not settle CI-in-HFpEF from Notions anchor");
}

// Phase 2C regression checks still required
const bbKp = inventory.kps.find((k) =>
  k.label.includes("déjà sous bêtabloquant") && k.label.includes("arrêt")
);
if (!bbKp) errors.push("double-missed: beta-blocker stop/reduce not represented");

const faPrecip = inventory.kps.find((k) =>
  k.label.includes("digoxine IV") &&
  k.anchors?.some((a) => a.quote.includes("fibrillation atriale"))
);
if (!faPrecip) errors.push("double-missed: FA/digoxin precipitant not represented");

const nicKp = inventory.kps.find((k) => k.label.includes("nicardipine IV"));
if (!nicKp) errors.push("double-missed: nicardipine precipitant not represented");

const cathKp = inventory.kps.find((k) =>
  k.anchors?.some((a) => a.quote.includes("normale < 5 mmHg"))
);
if (!cathKp) errors.push("double-missed: normal cath reference pressures not represented");

if (errors.length) {
  console.error("PHASE 3B VALIDATION FAIL");
  for (const e of errors) errors.length && console.error(" -", e);
  process.exit(1);
}

const counts = {};
for (const kp of inventory.kps) {
  counts[kp.disposition] = (counts[kp.disposition] || 0) + 1;
}

console.log("PHASE 3B VALIDATION PASS");
console.log(`kps=${inventory.kps.length}`);
console.log("dispositions:", counts);
console.log(`anchors_checked=${anchorVal.results.length}`);
