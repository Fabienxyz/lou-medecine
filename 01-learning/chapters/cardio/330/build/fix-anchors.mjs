import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import {
  validateAllAnchors,
  loadYamlFile,
  normalizeWhitespace,
  extractSectionScope,
} from "../../../../tools/lou-build/lib/anchors.js";

const chapterDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const sourceMeta = loadYamlFile(path.join(chapterDir, "source.meta.yaml"));
const inventoryPath = path.join(chapterDir, "inventory.yaml");
const inventory = loadYamlFile(inventoryPath);
const sourcePath = path.join(chapterDir, sourceMeta.source_file);
const sourceText = fs.readFileSync(sourcePath, "utf8");

function normMatch(s) {
  return normalizeWhitespace(String(s).replace(/\u2019/g, "'"));
}

function extractOriginal(source, needle) {
  const words = normMatch(needle).split(/\s+/).filter(Boolean);
  const pattern = words
    .map((w) => {
      const esc = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return esc.replace(/'/g, "['\u2019']");
    })
    .join("\\s+");
  const re = new RegExp(pattern, "i");
  const m = source.match(re);
  if (!m) return null;
  return m[0].replace(/\s+/g, " ").trim();
}

function uniqueSubstring(scoped, needle) {
  const normScoped = normMatch(scoped);
  const words = normMatch(needle).split(/\s+/).filter(Boolean);
  for (let len = words.length; len >= 3; len--) {
    const sub = words.slice(0, len).join(" ");
    if (normScoped.split(sub).length - 1 === 1) {
      return extractOriginal(scoped, sub);
    }
  }
  return null;
}

let fixed = 0;
const failed = [];

for (const kp of inventory.kps) {
  for (const anchor of kp.anchors || []) {
    const scoped =
      extractSectionScope(sourceText, anchor.section_path, sourceMeta) || sourceText;
    const exact = uniqueSubstring(scoped, anchor.quote);
    if (exact) {
      if (exact !== anchor.quote) {
        anchor.quote = exact;
        fixed++;
      }
    } else {
      failed.push({ kp: kp.id, quote: anchor.quote.slice(0, 55) });
    }
  }
}

console.log(`Fixed/verified ${fixed} anchors; failed ${failed.length}`);
if (failed.length) {
  for (const f of failed.slice(0, 20)) console.log(`  ${f.kp}: ${f.quote}…`);
}

const result = validateAllAnchors(sourceText, inventory, sourceMeta);
console.log(result.ok ? "PASS" : `FAIL ${result.errors.length}`);
if (!result.ok) {
  for (const e of result.errors.slice(0, 20)) console.log(" ", e);
  process.exit(1);
}

function serializeInventory(inv) {
  const lines = [
    `chapter: ${inv.chapter}`,
    `source_edition: ${inv.source_edition}`,
    `inventory_scope: ${inv.inventory_scope}`,
    `revision: ${inv.revision}`,
    `note: ${inv.note}`,
    "kps:",
  ];
  for (const kp of inv.kps) {
    lines.push(`  - id: ${kp.id}`);
    lines.push(`    label: ${JSON.stringify(kp.label)}`);
    lines.push(`    rank: ${kp.rank}`);
    lines.push(`    disposition: ${kp.disposition}`);
    lines.push("    anchors:");
    for (const a of kp.anchors) {
      lines.push(`      - edition: ${a.edition}`);
      lines.push(`        section_path: ${JSON.stringify(a.section_path)}`);
      lines.push(`        quote: ${JSON.stringify(a.quote)}`);
    }
  }
  return lines.join("\n") + "\n";
}

fs.writeFileSync(inventoryPath, serializeInventory(inventory));
console.log(`Wrote ${inventoryPath}`);
