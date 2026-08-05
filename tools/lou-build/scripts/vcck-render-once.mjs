#!/usr/bin/env node
/**
 * Render one VCCK fixture in an isolated process — used for inter-process determinism.
 * Usage: node vcck-render-once.mjs <fixture.yaml> <output.bin>
 */

import fs from "node:fs";
import path from "node:path";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { renderVcckSpec } from "../lib/vcck/render-bridge.js";
import { loadVcckInventory } from "../lib/vcck/inventory.js";

const [fixturePath, outputPath] = process.argv.slice(2);
if (!fixturePath || !outputPath) {
  console.error("Usage: vcck-render-once.mjs <fixture.yaml> <output.bin>");
  process.exit(2);
}

const spec = loadVisualSpec(fixturePath);
const inventory = loadVcckInventory();
const rendered = renderVcckSpec(spec, { inventory });

if (!rendered.ok || !rendered.artifact) {
  console.error(rendered.errors?.join("; ") || "render failed");
  process.exit(1);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, rendered.artifact);
process.exit(0);
