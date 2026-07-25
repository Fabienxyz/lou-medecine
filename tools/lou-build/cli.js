#!/usr/bin/env node
import { resolveChapterDir } from "./lib/paths.js";
import { runValidation, runBuild } from "./lib/package.js";

const args = process.argv.slice(2);
const command = args[0];
const chapterIdx = args.indexOf("--chapter");
const chapterArg =
  chapterIdx !== -1 ? args[chapterIdx + 1] : "01-learning/chapters/cardio/234";

if (!command || !["validate", "build"].includes(command)) {
  console.error("Usage: node cli.js validate|build --chapter <path>");
  process.exit(2);
}

let chapterDir;
try {
  chapterDir = resolveChapterDir(chapterArg);
} catch (e) {
  console.error(e.message);
  process.exit(2);
}

// A withheld Official Visual never fails the run — it is optional support — but it must stay
// fully visible in the report (IMPLEMENTATION_CONTRACT.md C.6).
function reportWithheldVisuals(withheld) {
  for (const w of withheld || []) {
    console.warn(`OFFICIAL VISUAL ${w.state.toUpperCase()} — ${w.elementId}`);
    for (const reason of w.reasons || []) console.warn("   -", reason);
    if (w.stale_asset_removed) {
      console.warn("   - stale asset removed:", w.stale_asset_removed);
    }
  }
}

if (command === "validate") {
  const result = runValidation(chapterDir);
  reportWithheldVisuals(result.steps?.visuals?.withheld);
  if (result.ok) {
    console.log("VALIDATE PASS");
    process.exit(0);
  }
  console.error("VALIDATE FAIL");
  for (const err of result.errors) console.error(" -", err);
  process.exit(1);
}

if (command === "build") {
  const result = runBuild(chapterDir);
  reportWithheldVisuals(result.withheldVisuals || result.steps?.visuals?.withheld);
  if (result.ok) {
    console.log("BUILD PASS — manifest.json written");
    process.exit(0);
  }
  console.error("BUILD FAIL");
  for (const err of result.errors || []) console.error(" -", err);
  process.exit(1);
}
