#!/usr/bin/env node
import { invalidatePublishableState } from "../../lib/package.js";
import { chapterPaths, resolveChapterDir } from "../../lib/paths.js";
import { createContext } from "../pipeline/context.js";
import { BUILD_PIPELINE, VALIDATE_PIPELINE } from "../pipeline/pipeline.js";
import { formatRunReport, runPipeline } from "../pipeline/runner.js";

const args = process.argv.slice(2);
const command = args[0];
const chapterIdx = args.indexOf("--chapter");
const chapterArg =
  chapterIdx !== -1 ? args[chapterIdx + 1] : "01-learning/chapters/cardio/234";

if (!command || !["validate", "build"].includes(command)) {
  console.error("Usage: lou-build validate|build --chapter <path>");
  process.exit(2);
}

let chapterDir: string;
try {
  chapterDir = resolveChapterDir(chapterArg);
} catch (e) {
  const message = e instanceof Error ? e.message : String(e);
  console.error(message);
  process.exit(2);
}

function reportWithheldVisuals(withheld: unknown) {
  if (!Array.isArray(withheld)) return;
  for (const w of withheld as {
    state?: string;
    elementId?: string;
    reasons?: string[];
    stale_asset_removed?: string;
  }[]) {
    console.warn(
      `OFFICIAL VISUAL ${(w.state || "unknown").toUpperCase()} — ${w.elementId}`,
    );
    for (const reason of w.reasons || []) console.warn("   -", reason);
    if (w.stale_asset_removed) {
      console.warn("   - stale asset removed:", w.stale_asset_removed);
    }
  }
}

const ctx = createContext(chapterDir, command as "validate" | "build");
// Mirror lib/package.js runBuild: invalidate publishable state at build start
// so a blocking failure before Stage J cannot leave a stale manifest.
if (command === "build") {
  invalidatePublishableState(chapterPaths(chapterDir));
}
const pipeline = command === "validate" ? VALIDATE_PIPELINE : BUILD_PIPELINE;
const report = await runPipeline(pipeline, ctx);

const visuals = ctx.workspace.visualBuild as
  | { withheld?: unknown[] }
  | undefined;
reportWithheldVisuals(visuals?.withheld);

const packaging = report.results.get("packaging");
if (packaging?.data && typeof packaging.data === "object") {
  const data = packaging.data as { withheldVisuals?: unknown[] };
  reportWithheldVisuals(data.withheldVisuals);
}

if (report.ok) {
  console.log(command === "validate" ? "VALIDATE PASS" : "BUILD PASS — manifest.json written");
  process.exit(0);
}

console.error(command === "validate" ? "VALIDATE FAIL" : "BUILD FAIL");
console.error(formatRunReport(report));
process.exit(1);
