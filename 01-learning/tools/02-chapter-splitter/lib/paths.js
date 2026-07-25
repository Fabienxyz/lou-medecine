import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to `01-learning/` (parent of `tools/`). */
export function defaultLearningRoot() {
  return path.resolve(__dirname, "../../..");
}

/**
 * Resolve input Markdown and chapters output directory.
 *
 * Default layout:
 *   <root>/full-edn/<specialty>/edition-<year>/official-college.md
 *   → <same>/chapters/
 */
export function resolveSplitPaths({
  input,
  specialty,
  edition,
  outdir,
  root = defaultLearningRoot(),
  markdownName = "official-college.md",
} = {}) {
  let markdownPath;
  let editionDir;

  if (input) {
    markdownPath = path.resolve(input);
    editionDir = path.dirname(markdownPath);
  } else {
    if (!specialty || !edition) {
      throw new Error(
        "Provide --input <official-college.md>, or both --specialty and --edition"
      );
    }
    const editionLabel = String(edition).startsWith("edition-")
      ? String(edition)
      : `edition-${edition}`;
    editionDir = path.resolve(root, "full-edn", specialty, editionLabel);
    markdownPath = path.join(editionDir, markdownName);
  }

  if (!fs.existsSync(markdownPath)) {
    throw new Error(`Markdown not found: ${markdownPath}`);
  }

  const chaptersDir = outdir
    ? path.resolve(outdir)
    : path.join(editionDir, "chapters");

  return {
    markdownPath,
    editionDir,
    chaptersDir,
    manifestPath: path.join(chaptersDir, "manifest.json"),
    specialty: specialty || null,
    edition: edition != null ? String(edition) : null,
  };
}
