/**
 * Specialized DataTable reconstructor.
 *
 * Preserves semantic rows/columns from geometry when confidence is adequate.
 * Otherwise emits an explicit warning + preformatted fallback (never a
 * misleading pipe table).
 */

import { renderPipeTable } from "../tables.js";

const MIN_CONFIDENCE = 0.55;

/**
 * @param {import('../blocks.js').Block} block
 * @param {{ warnings?: ReturnType<import('../warnings.js').createWarningCollector> }} [ctx]
 * @returns {import('../blocks.js').Block}
 */
export function reconstructDataTable(block, ctx = {}) {
  const warnings = ctx.warnings;
  const grids = block.segmentGrids?.length
    ? block.segmentGrids
    : block.grid
      ? [block.grid]
      : [];

  if (!grids.length) {
    warnings?.add(
      "data-table-empty",
      "Data table region had no recoverable grid",
      { page: block.page }
    );
    return { ...block, markdown: "", kind: "fallback", confidence: 0 };
  }

  const merged = mergeSegmentGrids(grids);
  if (!merged || merged.length < 2) {
    warnings?.add(
      "data-table-unrecoverable",
      "Multi-column region detected but alignment is too weak for a reliable Markdown table; emitting preformatted text",
      {
        page: block.page,
        detail: `segments=${grids.length}`,
      }
    );
    const lines = grids.flat().map((r) => r.filter(Boolean).join(" | "));
    return {
      ...block,
      markdown: ["```", ...lines, "```"].join("\n"),
      kind: "fallback",
      confidence: 0.3,
    };
  }

  const confidence = scoreGrid(merged);
  if (confidence < MIN_CONFIDENCE) {
    warnings?.add(
      "data-table-unrecoverable",
      "Multi-column region detected but alignment is too weak for a reliable Markdown table; emitting preformatted text",
      {
        page: block.page,
        detail: `cols=${merged[0].length} rows=${merged.length} confidence=${confidence.toFixed(2)}`,
      }
    );
    return {
      ...block,
      grid: merged,
      markdown: [
        "```",
        ...merged.map((r) => r.filter(Boolean).join(" | ")),
        "```",
      ].join("\n"),
      kind: "fallback",
      confidence,
    };
  }

  return {
    ...block,
    grid: merged,
    markdown: renderPipeTable(merged),
    kind: "pipe",
    confidence,
  };
}

function mergeSegmentGrids(grids) {
  const normalized = grids
    .map((g) => dropEmptyColumns(g))
    .filter((g) => g.length >= 2 && g[0].length >= 2);
  if (!normalized.length) return null;

  const header = normalized[0][0];
  const cols = header.length;
  /** @type {string[][]} */
  const out = [header.map((c) => c.trim())];

  for (const g of normalized) {
    const start = rowsEqual(g[0], header) ? 1 : 0;
    for (let i = start; i < g.length; i++) {
      if (rowsEqual(g[i], header)) continue;
      out.push(padRow(g[i], cols));
    }
  }
  return out.length >= 2 ? out : null;
}

function scoreGrid(grid) {
  if (grid.length < 2) return 0;
  const multi = grid.filter((r) => r.filter(Boolean).length >= 2).length;
  return multi / grid.length;
}

function dropEmptyColumns(grid) {
  if (!grid?.length) return [];
  const cols = grid[0].length;
  const keep = [];
  for (let c = 0; c < cols; c++) {
    if (grid.some((r) => (r[c] || "").trim())) keep.push(c);
  }
  return grid.map((r) => keep.map((c) => (r[c] || "").trim()));
}

function padRow(row, cols) {
  const out = (row || []).slice(0, cols).map((c) => (c || "").trim());
  while (out.length < cols) out.push("");
  return out;
}

function rowsEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if ((a[i] || "").trim().toLowerCase() !== (b[i] || "").trim().toLowerCase()) {
      return false;
    }
  }
  return true;
}
