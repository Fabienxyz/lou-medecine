/**
 * Lightweight internal document block model.
 *
 * Used only inside the converter to improve reconstruction.
 * Downstream tools continue to consume Markdown only.
 */

/** @enum {string} */
export const BlockType = {
  Heading: "Heading",
  Paragraph: "Paragraph",
  List: "List",
  HierarchyTable: "HierarchyTable",
  DataTable: "DataTable",
  Box: "Box",
  Figure: "Figure",
  Caption: "Caption",
};

/**
 * @typedef {{
 *   type: string,
 *   page?: number,
 *   y?: number,
 *   level?: number,
 *   text?: string,
 *   items?: string[],
 *   ordered?: boolean,
 *   id?: string,
 *   title?: string,
 *   body?: string[],
 *   grid?: string[][],
 *   colCenters?: number[],
 *   segments?: { page: number, yTop: number, yBottom: number }[],
 *   confidence?: number,
 *   kind?: 'pipe' | 'fallback',
 *   markdown?: string,
 *   caption?: string,
 * }} Block
 */

/**
 * @param {string} type
 * @param {object} fields
 * @returns {Block}
 */
export function block(type, fields = {}) {
  return { type, ...fields };
}
