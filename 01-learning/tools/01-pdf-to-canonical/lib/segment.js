/**
 * Document segmentation: ordered raw units (prose lines + table regions).
 *
 * Pipeline stage: extract/normalize → segment → classify → reconstruct → render
 */

/**
 * @param {import('./types.js').NormalizedLine[]} lines
 * @param {import('./types.js').DetectedTable[]} tableRegions
 * @returns {Array<
 *   | { kind: 'line', page: number, y: number, line: import('./types.js').NormalizedLine }
 *   | { kind: 'table', page: number, y: number, table: import('./types.js').DetectedTable }
 * >}
 */
export function segmentDocument(lines, tableRegions = []) {
  const lineEvents = lines.map((line) => ({
    kind: /** @type {const} */ ("line"),
    page: line.page,
    y: line.y,
    line,
  }));
  const tableEvents = tableRegions.map((table) => ({
    kind: /** @type {const} */ ("table"),
    page: table.page,
    y: table.yTop,
    table,
  }));
  return [...lineEvents, ...tableEvents].sort((a, b) => {
    if (a.page !== b.page) return a.page - b.page;
    if (a.y !== b.y) return b.y - a.y;
    if (a.kind !== b.kind) return a.kind === "table" ? -1 : 1;
    return 0;
  });
}
