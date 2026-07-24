import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(__dirname, "../../..");

export function resolveChapterDir(chapterArg) {
  const normalized = chapterArg.replace(/\\/g, "/").replace(/\/$/, "");
  if (normalized.includes("..")) {
    throw new Error("Invalid chapter path");
  }
  const abs = path.isAbsolute(normalized)
    ? normalized
    : path.join(REPO_ROOT, normalized);
  if (!fs.existsSync(abs)) {
    throw new Error(`Chapter directory not found: ${abs}`);
  }
  return abs;
}

export function chapterPaths(chapterDir) {
  return {
    chapterDir,
    sourceMeta: path.join(chapterDir, "source.meta.yaml"),
    inventory: path.join(chapterDir, "inventory.yaml"),
    blueprint: path.join(chapterDir, "blueprint.md"),
    projectionsDir: path.join(chapterDir, "projections", "understanding"),
    overview: path.join(chapterDir, "projections", "understanding", "overview.md"),
    mechanisms: path.join(chapterDir, "projections", "understanding", "mechanisms.md"),
    figuresDir: path.join(chapterDir, "figures"),
    mecOapSvg: path.join(chapterDir, "figures", "mec-oap.svg"),
    buildDir: path.join(chapterDir, "build"),
    reconciliation: path.join(chapterDir, "build", "reconciliation.yaml"),
    grounding: path.join(chapterDir, "build", "grounding.yaml"),
    traceability: path.join(chapterDir, "build", "traceability.json"),
    manifest: path.join(chapterDir, "manifest.json"),
  };
}

export function loadSourceText(sourceMeta) {
  const rel = sourceMeta.source_file;
  const abs = path.resolve(path.dirname(sourceMeta._path), rel);
  if (!fs.existsSync(abs)) {
    throw new Error(`Source file not found: ${abs}`);
  }
  return { abs, text: fs.readFileSync(abs, "utf8") };
}
