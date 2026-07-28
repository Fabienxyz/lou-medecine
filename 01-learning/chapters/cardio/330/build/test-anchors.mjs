import fs from "node:fs";
import YAML from "yaml";
import { validateAllAnchors, loadYamlFile } from "../../../../tools/lou-build/lib/anchors.js";

const chapterDir = new URL("..", import.meta.url).pathname;
const sourceMeta = loadYamlFile(`${chapterDir}/source.meta.yaml`);
const inventory = loadYamlFile(`${chapterDir}/inventory.yaml`);
const sourcePath = `${chapterDir}/${sourceMeta.source_file}`;
const sourceText = fs.readFileSync(sourcePath, "utf8");

const result = validateAllAnchors(sourceText, inventory, sourceMeta);
if (result.ok) {
  console.log(`PASS — ${inventory.kps.length} KPs, ${result.results.length} anchors`);
} else {
  console.log(`FAIL — ${result.errors.length} errors`);
  for (const e of result.errors) console.log(" ", e);
  process.exit(1);
}
