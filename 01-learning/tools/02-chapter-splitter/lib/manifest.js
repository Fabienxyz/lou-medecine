import crypto from "node:crypto";
import fs from "node:fs";

export const TOOL_NAME = "lou-chapter-splitter";
export const TOOL_VERSION = "1.0.0";

/**
 * @param {string | Buffer} data
 */
export function sha256(data) {
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * @param {{
 *   files: {
 *     index: number,
 *     itemNumber: string | null,
 *     officialTitle: string,
 *     filename: string,
 *     markdown: string,
 *     first_line: number,
 *     last_line: number,
 *   }[],
 *   sourceMarkdownPath?: string,
 *   sourceMarkdownSha256?: string,
 *   generatedAt?: string,
 * }} input
 */
export function buildManifest(input) {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const chapters = input.files.map((f) => ({
    index: f.index,
    edn_item_number: f.itemNumber,
    official_title: f.officialTitle,
    filename: f.filename,
    sha256: sha256(Buffer.from(f.markdown, "utf8")),
    first_line: f.first_line,
    last_line: f.last_line,
  }));

  // Stable key order for readable diffs.
  return {
    tool: TOOL_NAME,
    tool_version: TOOL_VERSION,
    generated_at: generatedAt,
    chapter_count: chapters.length,
    source_markdown_sha256: input.sourceMarkdownSha256 || null,
    source_markdown_path: input.sourceMarkdownPath || null,
    chapters,
  };
}

/**
 * @param {object} manifest
 */
export function serializeManifest(manifest) {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

/**
 * @param {string} path
 * @param {object} manifest
 */
export function writeManifest(path, manifest) {
  fs.writeFileSync(path, serializeManifest(manifest), "utf8");
}
