import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path to `01-learning/` (parent of `tools/`). */
export function defaultLearningRoot() {
  return path.resolve(__dirname, "../../..");
}

/**
 * Resolve the edition directory and PDF path from CLI options.
 * Expected layout: <root>/full-edn/<specialty>/edition-<edition>/official-college.pdf
 */
export function resolveEditionPaths({
  input,
  specialty,
  edition,
  outdir,
  root = defaultLearningRoot(),
  pdfName = "official-college.pdf",
} = {}) {
  let pdfPath;
  let editionDir;

  if (input) {
    pdfPath = path.resolve(input);
    editionDir = outdir ? path.resolve(outdir) : path.dirname(pdfPath);
  } else {
    if (!specialty || !edition) {
      throw new Error(
        "Provide --input <pdf>, or both --specialty and --edition"
      );
    }
    const editionLabel = String(edition).startsWith("edition-")
      ? String(edition)
      : `edition-${edition}`;
    editionDir = path.resolve(root, "full-edn", specialty, editionLabel);
    pdfPath = path.join(editionDir, pdfName);
    if (outdir) editionDir = path.resolve(outdir);
  }

  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF not found: ${pdfPath}`);
  }

  const markdownPath = path.join(editionDir, "official-college.md");
  const manifestPath = path.join(editionDir, "manifest.json");

  // Infer specialty / edition from path when possible.
  const inferred = inferSpecialtyEdition(pdfPath, root);

  return {
    pdfPath,
    editionDir,
    markdownPath,
    manifestPath,
    specialty: specialty || inferred.specialty || "unknown",
    edition: String(edition || inferred.edition || "unknown"),
    originalPdfFilename: path.basename(pdfPath),
  };
}

export function inferSpecialtyEdition(pdfPath, root = defaultLearningRoot()) {
  const abs = path.resolve(pdfPath);
  const fullEdn = path.resolve(root, "full-edn") + path.sep;
  if (!abs.startsWith(fullEdn)) {
    return { specialty: null, edition: null };
  }
  const rel = abs.slice(fullEdn.length);
  const parts = rel.split(path.sep);
  // <specialty>/edition-<year>/official-college.pdf
  const specialty = parts[0] || null;
  let edition = null;
  if (parts[1] && parts[1].startsWith("edition-")) {
    edition = parts[1].slice("edition-".length);
  }
  return { specialty, edition };
}
