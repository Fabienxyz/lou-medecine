import fs from "node:fs";
import { extractPdf } from "./extract.js";
import { normalizeExtraction } from "./normalize.js";
import { reconstructMarkdown } from "./reconstruct.js";
import { validateMarkdown } from "./validate.js";
import { buildManifest, writeManifest } from "./manifest.js";
import { createWarningCollector } from "./warnings.js";
import { resolveEditionPaths } from "./paths.js";
import {
  detectTables,
  filterExtractionOutsideTables,
} from "./tables.js";

/**
 * Full conversion pipeline: PDF → official-college.md + manifest.json
 *
 * @param {object} options CLI-resolved options
 * @returns {Promise<object>}
 */
export async function convertCollege(options = {}) {
  const paths = resolveEditionPaths(options);
  const warnings = createWarningCollector();

  if (options.verbose) {
    console.error(`PDF: ${paths.pdfPath}`);
    console.error(`Out: ${paths.editionDir}`);
  }

  let extraction;
  let extractionOk = true;
  try {
    extraction = await extractPdf(paths.pdfPath, {
      onProgress: options.onProgress,
    });
  } catch (err) {
    extractionOk = false;
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`PDF extraction failed: ${message}`);
  }

  const tables = detectTables(extraction, { warnings });
  const withoutTables = filterExtractionOutsideTables(extraction, tables);
  const normalized = normalizeExtraction(withoutTables, { warnings });
  const { markdown, headingTexts } = reconstructMarkdown(normalized, {
    warnings,
    tables,
  });

  const validation = validateMarkdown({
    markdown,
    headingTexts,
    extractionOk,
    numPages: extraction.numPages,
  });

  if (!validation.ok) {
    const detail = validation.errors.map((e) => ` - ${e}`).join("\n");
    const err = new Error(`Validation failed:\n${detail}`);
    err.validation = validation;
    err.markdown = markdown;
    throw err;
  }

  if (!options.dryRun) {
    fs.mkdirSync(paths.editionDir, { recursive: true });
    fs.writeFileSync(paths.markdownPath, markdown, "utf8");
  }

  const manifest = buildManifest({
    specialty: paths.specialty,
    edition: paths.edition,
    originalPdfFilename: paths.originalPdfFilename,
    pdfPath: paths.pdfPath,
    markdown,
    warnings: warnings.list(),
    validation,
    stats: {
      pages: extraction.numPages,
      lines_kept: normalized.stats.keptLines,
      lines_raw: normalized.stats.rawLines,
      markdown_chars: markdown.length,
      heading_count: headingTexts.length,
      tables_detected: tables.length,
      tables_pipe: tables.filter((t) => t.kind === "pipe").length,
      tables_fallback: tables.filter((t) => t.kind === "fallback").length,
    },
    generatedAt: options.generatedAt,
  });

  if (!options.dryRun) {
    writeManifest(paths.manifestPath, manifest);
  }

  return {
    paths,
    markdown,
    manifest,
    validation,
    warnings: warnings.list(),
    tables,
  };
}

/**
 * Convert using an in-memory extraction fixture (for tests).
 */
export function convertFromExtraction(extraction, options = {}) {
  const warnings = createWarningCollector();
  const tables = detectTables(extraction, { warnings });
  const withoutTables = filterExtractionOutsideTables(extraction, tables);
  const normalized = normalizeExtraction(withoutTables, { warnings });
  const { markdown, headingTexts } = reconstructMarkdown(normalized, {
    warnings,
    tables,
  });
  const validation = validateMarkdown({
    markdown,
    headingTexts,
    extractionOk: true,
    numPages: extraction.numPages ?? extraction.pages?.length ?? 0,
  });
  return {
    markdown,
    headingTexts,
    validation,
    warnings: warnings.list(),
    normalized,
    tables,
  };
}
