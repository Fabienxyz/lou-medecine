/**
 * Fail-closed validation for chapter splits.
 */

import { chapterFilename } from "./slug.js";
import { parseHeadingContent } from "./detect.js";

/**
 * @param {{
 *   originalMarkdown: string,
 *   lines: string[],
 *   chapters: import('./detect.js').ChapterPlan[],
 *   files: { filename: string, markdown: string, first_line: number, last_line: number, officialTitle: string, itemNumber: string | null }[],
 * }} input
 */
export function validateSplit(input) {
  const { originalMarkdown, lines, chapters, files } = input;
  /** @type {string[]} */
  const errors = [];

  if (!chapters.length) {
    errors.push("No chapters detected");
  }
  if (chapters.length !== files.length) {
    errors.push(
      `Chapter plan count (${chapters.length}) != output file count (${files.length})`
    );
  }

  // Coverage: every line belongs to exactly one chapter.
  const owner = new Array(lines.length).fill(0);
  for (const ch of chapters) {
    if (ch.startLine < 0 || ch.endLine >= lines.length || ch.startLine > ch.endLine) {
      errors.push(
        `Invalid span for chapter ${ch.index}: lines ${ch.startLine + 1}–${ch.endLine + 1}`
      );
      continue;
    }
    for (let i = ch.startLine; i <= ch.endLine; i++) {
      owner[i] += 1;
    }
  }
  for (let i = 0; i < owner.length; i++) {
    if (owner[i] === 0) {
      errors.push(`Line ${i + 1} belongs to no chapter`);
    } else if (owner[i] > 1) {
      errors.push(`Line ${i + 1} belongs to ${owner[i]} chapters (overlap)`);
    }
  }

  // Ordering preserved.
  for (let i = 1; i < chapters.length; i++) {
    if (chapters[i].startLine <= chapters[i - 1].endLine) {
      errors.push(
        `Chapter ordering/overlap broken between indexes ${chapters[i - 1].index} and ${chapters[i].index}`
      );
    }
    if (chapters[i].index !== chapters[i - 1].index + 1) {
      errors.push("Chapter index sequence is not contiguous");
    }
  }

  // Filenames unique + match heading-derived rule.
  const seen = new Set();
  for (const f of files) {
    if (seen.has(f.filename)) {
      errors.push(`Duplicate filename: ${f.filename}`);
    }
    seen.add(f.filename);

    const expected = chapterFilename(
      parseHeadingContent(f.officialTitle)
    );
    if (f.filename !== expected) {
      errors.push(
        `Filename "${f.filename}" does not match heading-derived name "${expected}" for: ${f.officialTitle}`
      );
    }

    if (!f.markdown.startsWith(`# ${f.officialTitle}`)) {
      errors.push(
        `Chapter file "${f.filename}" does not start with its official H1 title`
      );
    }
  }

  // Round-trip property (mandatory).
  const reconstructed = files.map((f) => f.markdown).join("");
  if (reconstructed !== originalMarkdown) {
    errors.push(
      "Round-trip failed: concatenating chapter files does not reconstruct the original Markdown exactly"
    );
    errors.push(
      `original_length=${originalMarkdown.length} reconstructed_length=${reconstructed.length}`
    );
    const max = Math.min(originalMarkdown.length, reconstructed.length);
    for (let i = 0; i < max; i++) {
      if (originalMarkdown[i] !== reconstructed[i]) {
        errors.push(`First byte difference at index ${i}`);
        break;
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
