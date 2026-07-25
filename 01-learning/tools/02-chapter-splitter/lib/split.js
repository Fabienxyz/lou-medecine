/**
 * Extract chapter Markdown slices without rewriting content.
 */

import { joinLines } from "./detect.js";

/**
 * @param {string[]} lines
 * @param {import('./detect.js').ChapterPlan[]} chapters
 * @returns {{ filename: string, markdown: string, first_line: number, last_line: number, index: number, officialTitle: string, itemNumber: string | null }[]}
 */
export function splitChapters(lines, chapters) {
  return chapters.map((ch) => {
    const slice = lines.slice(ch.startLine, ch.endLine + 1);
    // joinLines(slice) restores in-span newlines. If this chapter is not the
    // last line of the document, append the boundary `\n` that separated it
    // from the next chapter so concatenation round-trips exactly.
    let markdown = joinLines(slice);
    if (ch.endLine < lines.length - 1) {
      markdown += "\n";
    }

    return {
      index: ch.index,
      officialTitle: ch.officialTitle,
      itemNumber: ch.itemNumber,
      filename: ch.filename,
      markdown,
      first_line: ch.startLine + 1,
      last_line: ch.endLine + 1,
    };
  });
}
