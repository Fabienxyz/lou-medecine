#!/usr/bin/env node
/**
 * Render this chapter's visualSpecs to figures/<element>.svg.
 *
 * Eligibility is recomputed on every run: validation, then grounding, then
 * renderEligibility(). A spec that is not eligible is not rendered, and any
 * previously written asset for it is removed rather than left behind pretending
 * to be current.
 *
 *   node 01-learning/chapters/cardio/234/build/render-visual-specs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadYamlFile } from "../../../../../tools/lou-build/lib/anchors.js";
import { loadVisualSpec } from "../../../../../tools/lou-build/lib/visual-spec.js";
import { loadVisualGroundingReview } from "../../../../../tools/lou-build/lib/visual-ground.js";
import { renderVisualSpec } from "../../../../../tools/lou-build/lib/visual-render.js";

const CHAPTER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const inventory = loadYamlFile(path.join(CHAPTER_DIR, "inventory.yaml"));
const sourceMeta = loadYamlFile(path.join(CHAPTER_DIR, "source.meta.yaml"));
const review = loadVisualGroundingReview(
  path.join(CHAPTER_DIR, "build/visual-grounding-review.yaml")
);

const specDir = path.join(CHAPTER_DIR, "build/visual-specs");
const figuresDir = path.join(CHAPTER_DIR, "figures");
fs.mkdirSync(figuresDir, { recursive: true });

let failed = false;

for (const file of fs.readdirSync(specDir).filter((f) => f.endsWith(".yaml")).sort()) {
  const spec = loadVisualSpec(path.join(specDir, file));
  const outPath = path.join(figuresDir, `${String(spec.element).toLowerCase()}.svg`);
  const result = renderVisualSpec({ spec, inventory, sourceMeta, review });

  if (!result.ok) {
    console.error(`✗ ${spec.element}: blocked at ${result.stage}`);
    for (const e of result.errors) console.error(`    ${e}`);
    if (fs.existsSync(outPath)) {
      fs.rmSync(outPath);
      console.error(`    removed stale asset ${path.relative(CHAPTER_DIR, outPath)}`);
    }
    failed = true;
    continue;
  }

  fs.writeFileSync(outPath, result.svg);
  console.log(
    `✓ ${spec.element}: ${path.relative(CHAPTER_DIR, outPath)} ` +
      `(${result.layout.width}×${result.layout.height}, ` +
      `${result.layout.nodes.length} entities, ${result.layout.edges.length} relations, ` +
      `${result.layout.rows.length} rows)`
  );
}

process.exit(failed ? 1 : 0);
