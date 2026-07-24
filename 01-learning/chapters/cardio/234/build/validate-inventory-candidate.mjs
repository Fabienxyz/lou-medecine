#!/usr/bin/env node
/**
 * Non-publishing validator for Phase 2A inventory-candidate.yaml.
 * Does NOT touch canonical inventory.yaml or the chapter build/publish path.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "../../../../../tools/lou-build/node_modules/yaml/dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "../../../../../");
const SOURCE = path.join(
  REPO,
  "01-learning/chapter-analysis/cardio/234-insuffisance-cardiaque/official-college.md"
);
const CAND = path.join(__dirname, "inventory-candidate.yaml");

const source = fs.readFileSync(SOURCE, "utf8");
const doc = YAML.parse(fs.readFileSync(CAND, "utf8"));
const nw = (t) => t.replace(/\s+/g, " ").trim();
const ns = nw(source);

const errors = [];
const ids = new Set();

for (const kp of doc.kps || []) {
  if (!kp.id) errors.push("KP missing id");
  if (ids.has(kp.id)) errors.push(`duplicate id ${kp.id}`);
  ids.add(kp.id);
  if (!kp.label || !String(kp.label).trim()) errors.push(`${kp.id}: empty label`);
  if (!kp.disposition) errors.push(`${kp.id}: missing disposition`);
  const anchors = kp.anchors || [];
  if (!anchors.length) errors.push(`${kp.id}: no anchors`);
  for (const a of anchors) {
    const q = nw(a.quote || "");
    let count = 0;
    let pos = 0;
    while (true) {
      const i = ns.indexOf(q, pos);
      if (i === -1) break;
      count += 1;
      pos = i + q.length;
    }
    if (count !== 1) {
      errors.push(
        `${kp.id}: quote resolves ${count}× — ${String(a.quote).slice(0, 80)}`
      );
    }
  }
}

for (const id of ["KP-040", "KP-041", "KP-042"]) {
  const n = (doc.kps || []).filter((k) => k.id === id).length;
  if (n !== 1) errors.push(`${id} must appear exactly once (found ${n})`);
}

const unexpected = (doc.kps || []).filter(
  (k) => /^KP-/.test(k.id) && !["KP-040", "KP-041", "KP-042"].includes(k.id)
);
if (unexpected.length) {
  errors.push(
    `unexpected permanent KP ids: ${unexpected.map((k) => k.id).join(", ")}`
  );
}

if (errors.length) {
  console.error("CANDIDATE VALIDATION FAIL");
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}

console.log("CANDIDATE VALIDATION PASS");
console.log(`kps=${doc.kps.length}`);
process.exit(0);
