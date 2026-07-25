import crypto from "node:crypto";
import fs from "node:fs";

export const CONVERTER_NAME = "lou-pdf-to-canonical";
export const CONVERTER_VERSION = "1.0.0";

/**
 * @param {{
 *   specialty: string,
 *   edition: string,
 *   originalPdfFilename: string,
 *   pdfPath: string,
 *   markdown: string,
 *   warnings?: object[],
 *   validation?: { ok: boolean, errors: string[], anomalies: string[] },
 *   stats?: object,
 *   generatedAt?: string,
 * }} input
 */
export function buildManifest(input) {
  const pdfBuffer = fs.readFileSync(input.pdfPath);
  const pdfSha256 = sha256(pdfBuffer);
  const markdownSha256 = sha256(Buffer.from(input.markdown, "utf8"));

  const generatedAt = input.generatedAt || new Date().toISOString();

  // Key order is stable for readable diffs (Markdown itself is deterministic;
  // timestamp intentionally lives only in the manifest).
  return {
    tool: CONVERTER_NAME,
    converter_version: CONVERTER_VERSION,
    specialty: input.specialty,
    edition: String(input.edition),
    original_pdf_filename: input.originalPdfFilename,
    original_pdf_sha256: pdfSha256,
    markdown_filename: "official-college.md",
    markdown_sha256: markdownSha256,
    generated_at: generatedAt,
    validation: {
      ok: Boolean(input.validation?.ok),
      errors: input.validation?.errors || [],
      anomalies: input.validation?.anomalies || [],
    },
    warnings: input.warnings || [],
    stats: input.stats || {},
  };
}

export function writeManifest(manifestPath, manifest) {
  fs.writeFileSync(manifestPath, serializeManifest(manifest), "utf8");
}

/** Deterministic JSON serialization (sorted keys, stable nested order). */
export function serializeManifest(manifest) {
  return `${JSON.stringify(sortKeys(manifest), null, 2)}\n`;
}

export function sha256(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = sortKeys(value[key]);
    }
    return out;
  }
  return value;
}
