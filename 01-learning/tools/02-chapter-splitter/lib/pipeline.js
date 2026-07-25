import fs from "node:fs";
import path from "node:path";
import { detectChapters } from "./detect.js";
import { splitChapters } from "./split.js";
import { validateSplit } from "./validate.js";
import {
  buildManifest,
  writeManifest,
  sha256,
  TOOL_VERSION,
} from "./manifest.js";
import { resolveSplitPaths } from "./paths.js";

/**
 * Split official-college.md into chapters/.
 *
 * @param {object} options
 */
export function splitCollege(options = {}) {
  const paths = resolveSplitPaths(options);
  const originalMarkdown = fs.readFileSync(paths.markdownPath, "utf8");

  if (options.verbose) {
    console.error(`In:  ${paths.markdownPath}`);
    console.error(`Out: ${paths.chaptersDir}`);
  }

  const result = splitFromMarkdown(originalMarkdown, {
    sourceMarkdownPath: paths.markdownPath,
    generatedAt: options.generatedAt,
  });

  if (!options.dryRun) {
    fs.mkdirSync(paths.chaptersDir, { recursive: true });
    // Remove previously generated chapter markdown files (not foreign files).
    for (const name of fs.readdirSync(paths.chaptersDir)) {
      if (name.endsWith(".md") || name === "manifest.json") {
        fs.unlinkSync(path.join(paths.chaptersDir, name));
      }
    }
    for (const file of result.files) {
      fs.writeFileSync(
        path.join(paths.chaptersDir, file.filename),
        file.markdown,
        "utf8"
      );
    }
    writeManifest(paths.manifestPath, result.manifest);
  }

  return {
    paths,
    ...result,
    toolVersion: TOOL_VERSION,
  };
}

/**
 * In-memory split (for tests).
 * @param {string} originalMarkdown
 * @param {{ sourceMarkdownPath?: string, generatedAt?: string }} [opts]
 */
export function splitFromMarkdown(originalMarkdown, opts = {}) {
  const { lines, chapters } = detectChapters(originalMarkdown);
  const files = splitChapters(lines, chapters);

  const validation = validateSplit({
    originalMarkdown,
    lines,
    chapters,
    files,
  });

  if (!validation.ok) {
    const detail = validation.errors.map((e) => ` - ${e}`).join("\n");
    const err = new Error(`Validation failed:\n${detail}`);
    err.validation = validation;
    throw err;
  }

  const manifest = buildManifest({
    files,
    sourceMarkdownPath: opts.sourceMarkdownPath || null,
    sourceMarkdownSha256: sha256(Buffer.from(originalMarkdown, "utf8")),
    generatedAt: opts.generatedAt,
  });

  return {
    lines,
    chapters,
    files,
    manifest,
    validation,
  };
}
