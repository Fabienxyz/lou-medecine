/**
 * Chapter detection from Tool 01 Markdown structure.
 *
 * Chapters are ATX level-1 headings only (`# …`).
 * Identifiers and titles are parsed from heading text content — never from
 * hardcoded specialty / chapter / item lists.
 */

import { chapterFilename } from "./slug.js";

/** Exactly one leading `#` followed by a space (H1), not `##`. */
const RE_H1 = /^# ([^\n]+)$/;

/**
 * Generic capture of a numeric identifier introduced by the word "Item"
 * inside a heading (content-derived; not a specialty catalog).
 * Accepts both `Item 234` and `Item : 152`.
 */
const RE_ITEM = /\bItem\s*:?\s*(\d+)\b/i;

/**
 * @typedef {{
 *   index: number,
 *   officialTitle: string,
 *   itemNumber: string | null,
 *   titleForSlug: string,
 *   filename: string,
 *   startLine: number,
 *   endLine: number,
 * }} ChapterPlan
 */

/**
 * Detect chapter boundaries and plan output files.
 * Fail-closed on ambiguous or invalid structure.
 *
 * @param {string} markdown
 * @returns {{ lines: string[], chapters: ChapterPlan[] }}
 */
export function detectChapters(markdown) {
  if (typeof markdown !== "string") {
    throw new Error("Input must be a Markdown string");
  }
  if (markdown.length === 0) {
    throw new Error("Input Markdown is empty");
  }

  // Split preserving empty lines; do not alter content.
  const lines = splitLines(markdown);
  /** @type {{ lineIndex: number, title: string }[]} */
  const headings = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(RE_H1);
    if (m) {
      const title = m[1].trim();
      if (!title) {
        throw new Error(`Empty H1 heading at line ${i + 1}`);
      }
      headings.push({ lineIndex: i, title });
    }
  }

  if (headings.length === 0) {
    throw new Error(
      "No chapter H1 headings found (`# …`). Cannot determine chapter boundaries."
    );
  }

  if (headings[0].lineIndex !== 0) {
    throw new Error(
      `Content before the first chapter H1 (lines 1–${headings[0].lineIndex}) would belong to no chapter`
    );
  }

  /** @type {ChapterPlan[]} */
  const chapters = [];
  /** @type {Set<string>} */
  const seenTitles = new Set();
  /** @type {Set<string>} */
  const seenFiles = new Set();

  for (let c = 0; c < headings.length; c++) {
    const h = headings[c];
    const startLine = h.lineIndex; // 0-based
    const endLine =
      c + 1 < headings.length ? headings[c + 1].lineIndex - 1 : lines.length - 1;

    if (endLine < startLine) {
      throw new Error(`Invalid chapter span for H1 at line ${startLine + 1}`);
    }

    if (isEmptyChapterBody(lines, startLine, endLine)) {
      throw new Error(
        `Empty chapter (heading with no content) at line ${startLine + 1}: ${h.title}`
      );
    }

    if (seenTitles.has(h.title)) {
      throw new Error(`Duplicate chapter heading: ${h.title}`);
    }
    seenTitles.add(h.title);

    const parsed = parseHeadingContent(h.title);
    let filename;
    try {
      filename = chapterFilename(parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `Cannot derive filename for chapter at line ${startLine + 1}: ${msg}`
      );
    }

    if (seenFiles.has(filename)) {
      throw new Error(
        `Duplicate derived filename "${filename}" for chapter: ${h.title}`
      );
    }
    seenFiles.add(filename);

    chapters.push({
      index: c + 1,
      officialTitle: h.title,
      itemNumber: parsed.itemNumber,
      titleForSlug: parsed.titleForSlug,
      filename,
      startLine,
      endLine,
    });
  }

  return { lines, chapters };
}

/**
 * Parse identifier + slug title from heading text content only.
 * @param {string} title
 */
export function parseHeadingContent(title) {
  const officialTitle = String(title).trim();
  const itemMatch = officialTitle.match(RE_ITEM);
  const itemNumber = itemMatch ? itemMatch[1] : null;

  let titleForSlug = officialTitle;
  if (itemMatch) {
    const after = officialTitle
      .slice(itemMatch.index + itemMatch[0].length)
      .replace(/^[\s.:;–—\-]+/u, "")
      .trim();
    if (after) titleForSlug = after;
  }

  return { itemNumber, titleForSlug, officialTitle };
}

/**
 * Split Markdown into lines without destroying content.
 * Keeps line breaks semantics for round-trip via joinLines.
 * @param {string} markdown
 */
export function splitLines(markdown) {
  // Normalize only the split boundary detection: handle \r\n and bare \n.
  // Content of each line excludes the line break character(s).
  if (markdown === "") return [];
  const parts = markdown.split(/\r?\n/);
  // If the file ends with a trailing newline, split yields a final empty
  // string — keep it so round-trip can restore the trailing newline.
  return parts;
}

/**
 * Join lines back to Markdown. If the original ended with `\n`, the last
 * split element is `""` and join restores that trailing newline.
 * @param {string[]} lines
 */
export function joinLines(lines) {
  return lines.join("\n");
}

function isEmptyChapterBody(lines, startLine, endLine) {
  for (let i = startLine + 1; i <= endLine; i++) {
    if (String(lines[i] || "").trim().length > 0) return false;
  }
  return true;
}
