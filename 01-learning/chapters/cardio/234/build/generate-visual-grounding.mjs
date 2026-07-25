#!/usr/bin/env node
/**
 * Regenerate build/visual-grounding.yaml for this chapter's visualSpecs.
 *
 * Reads each spec, the canonical Inventory, and the independent review record;
 * writes one auditable verdict per semantic node and edge. Render eligibility is
 * deliberately NOT written: it is recomputed by renderEligibility() at gate time,
 * because a stored "eligible: true" would outlive the facts that justified it.
 *
 * Exits non-zero if any spec is not render-eligible.
 *
 *   node 01-learning/chapters/cardio/234/build/generate-visual-grounding.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadYamlFile } from "../../../../../tools/lou-build/lib/anchors.js";
import {
  loadVisualSpec,
  validateVisualSpec,
} from "../../../../../tools/lou-build/lib/visual-spec.js";
import {
  groundVisualSpec,
  renderEligibility,
  loadVisualGroundingReview,
} from "../../../../../tools/lou-build/lib/visual-ground.js";
import { writeGroundingYaml } from "../../../../../tools/lou-build/lib/ground.js";

const CHAPTER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const inventory = loadYamlFile(path.join(CHAPTER_DIR, "inventory.yaml"));
const sourceMeta = loadYamlFile(path.join(CHAPTER_DIR, "source.meta.yaml"));
const review = loadVisualGroundingReview(
  path.join(CHAPTER_DIR, "build/visual-grounding-review.yaml")
);

const specDir = path.join(CHAPTER_DIR, "build/visual-specs");
const specFiles = fs.readdirSync(specDir).filter((f) => f.endsWith(".yaml")).sort();

let blocked = false;
const allVerdicts = {};
const allErrors = [];
let note = null;

for (const file of specFiles) {
  const spec = loadVisualSpec(path.join(specDir, file));
  const validation = validateVisualSpec(spec, { inventory });

  if (!validation.ok) {
    console.error(`✗ ${file}: structural validation failed`);
    for (const e of validation.errors) console.error(`    ${e}`);
    blocked = true;
    continue;
  }

  const grounding = groundVisualSpec({ spec, inventory, sourceMeta, review });
  const eligibility = renderEligibility({ validation, grounding });

  Object.assign(allVerdicts, grounding.verdicts);
  allErrors.push(...grounding.errors);
  note = note || grounding.note;

  console.log(
    `${eligibility.eligible ? "✓" : "✗"} ${spec.element}: ` +
      `${eligibility.eligible ? "render-eligible" : "BLOCKED"} ` +
      `(${Object.keys(grounding.verdicts).length} semantic units)`
  );
  for (const reason of eligibility.reasons) console.log(`    ${reason}`);
  if (!eligibility.eligible) blocked = true;
}

writeGroundingYaml(path.join(CHAPTER_DIR, "build/visual-grounding.yaml"), {
  status: allErrors.length === 0 ? "pass" : "fail",
  verdicts: allVerdicts,
  note,
});

process.exit(blocked ? 1 : 0);
