#!/usr/bin/env node
/**
 * Generate QCM tranche 2 (q-234-16 … q-234-81) from compact spec.
 * Run: node build/generate-questions-tranche2.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "../../../../../tools/lou-build/node_modules/yaml/dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../questions");
const SPEC = path.join(__dirname, "questions-tranche2-spec.json");

function facet(id, kp, role = "stem") {
  return { id, class: "sourced", kp: Array.isArray(kp) ? kp : [kp] };
}

function opt(qid, letter, label, tier, kp, explanation) {
  const kps = Array.isArray(kp) ? kp : [kp];
  return {
    id: letter,
    label: label.trim(),
    score_tier: tier,
    claim_facets_label: [facet(`cf-${qid}-opt-${letter}`, kps)],
    explanation: explanation.trim(),
    claim_facets_explanation: [facet(`cf-${qid}-exp-${letter}`, kps)],
  };
}

function buildQuestion(spec) {
  const qid = `q-234-${String(spec.num).padStart(2, "0")}`;
  const kps = spec.kp_refs;
  const editorial = {
    difficulty: spec.difficulty || "intermediate",
    notes: spec.notes,
  };
  if (spec.kp_disposition === "deferred-to-mastery") {
    editorial.kp_disposition = "deferred-to-mastery";
  }
  const doc = {
    "# Question d'évaluation (contrat 07)": null,
    question_id: qid,
    status: "published",
    score_model: "edn_v1",
    kp_refs: kps,
    stem: {
      text: spec.stem.trim() + "\n",
      claim_facets: [facet(`cf-${qid}-stem`, kps.slice(0, Math.min(2, kps.length)))],
    },
    options: spec.options.map((o) => opt(qid, o[0], o[1], o[2], o[3], o[4])),
    editorial,
  };
  if (spec.element_refs?.length) doc.element_refs = spec.element_refs;
  delete doc["# Question d'évaluation (contrat 07)"];
  const header = "# Question d'évaluation (contrat 07)\n";
  return header + YAML.stringify(doc, { lineWidth: 0 }).replace(/\n$/, "") + "\n";
}

const specs = JSON.parse(fs.readFileSync(SPEC, "utf8"));
for (const s of specs) {
  const file = path.join(OUT, `q-234-${String(s.num).padStart(2, "0")}.yaml`);
  fs.writeFileSync(file, buildQuestion(s));
  console.log("wrote", path.basename(file));
}
console.log(`Generated ${specs.length} questions.`);
