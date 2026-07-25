/**
 * Specialized HierarchyTable reconstructor.
 *
 * Detects EDN knowledge-hierarchy tables by structure (column geometry +
 * sparse rank column), not by specialty or chapter text. Emits a stable
 * semantic schema:
 *   Rang | Rubrique | Intitulé | Descriptif
 */

import { renderPipeTable } from "../tables.js";

/** Canonical column labels for the EDN hierarchy schema (positional roles). */
const HEADERS_4 = ["Rang", "Rubrique", "Intitulé", "Descriptif"];
const HEADERS_3 = ["Rang", "Rubrique", "Intitulé"];

/**
 * Structural test: is this grid a knowledge-hierarchy table?
 * @param {string[][]} grid
 * @param {number[]} [colCenters]
 */
export function isHierarchyTableGrid(grid, colCenters = []) {
  if (!grid || grid.length < 3) return false;

  // Drop gutter ghost columns before scoring so shifted continuations
  // (empty interior col) still classify as hierarchy.
  const cleaned = collapseSparseInteriorColumns(dropEmptyColumns(grid));
  const cols = cleaned[0]?.length || 0;
  if (cols < 3 || cols > 5) return false;

  const body = cleaned.slice(1);
  if (body.length < 2) return false;

  // Leftmost column is a sparse rank slot (empty or very short token).
  const rankSparse =
    body.filter((r) => {
      const c = (r[0] || "").trim();
      return !c || c.length <= 2;
    }).length / body.length;

  // Rubrique column: first mostly-filled short-label column after rank.
  let rubriqueIdx = 1;
  for (let c = 1; c < cols; c++) {
    const hits = body.filter((r) => (r[c] || "").trim()).length;
    if (hits / body.length >= 0.4) {
      rubriqueIdx = c;
      break;
    }
  }
  const rubriqueShort =
    body.filter((r) => {
      const c = (r[rubriqueIdx] || "").trim();
      return c && c.length <= 45 && !/[.!?]$/.test(c);
    }).length / body.length;

  // Optional geometry: first column cluster near the left margin.
  const leftNarrow =
    !colCenters.length ||
    colCenters[0] < 90 ||
    (colCenters.length >= 2 && colCenters[1] - colCenters[0] < 100);

  return rankSparse >= 0.55 && rubriqueShort >= 0.45 && leftNarrow;
}

/** Exported for classification pre-clean. */
export function cleanHierarchyGrid(grid) {
  return collapseSparseInteriorColumns(dropEmptyColumns(grid || []));
}

/**
 * @param {import('../blocks.js').Block} block
 * @param {{ warnings?: ReturnType<import('../warnings.js').createWarningCollector> }} [ctx]
 * @returns {import('../blocks.js').Block}
 */
export function reconstructHierarchyTable(block, ctx = {}) {
  const warnings = ctx.warnings;
  const grids = block.segmentGrids?.length
    ? block.segmentGrids
    : block.grid
      ? [block.grid]
      : [];

  if (!grids.length) {
    warnings?.add(
      "hierarchy-table-empty",
      "Hierarchy table region had no recoverable grid",
      { page: block.page }
    );
    return {
      ...block,
      markdown: "",
      kind: "fallback",
      confidence: 0,
    };
  }

  /** @type {string[][]} */
  const bodies = [];
  /** @type {string[]} */
  const leakedProse = [];
  let targetCols = 4;

  for (const raw of grids) {
    const normalized = normalizeHierarchySegment(raw);
    if (!normalized) continue;
    targetCols = Math.max(targetCols, normalized.cols);
    for (const row of normalized.body) bodies.push(row);
    for (const text of normalized.leaked || []) leakedProse.push(text);
  }

  // Safety: peel any remaining trailing prose from the concatenated body.
  while (bodies.length && isProseLeakRow(bodies[bodies.length - 1])) {
    const row = bodies.pop();
    const text = (row || []).map((c) => (c || "").trim()).filter(Boolean).join(" ");
    if (text) leakedProse.push(text);
  }

  if (bodies.length < 2) {
    warnings?.add(
      "hierarchy-table-weak",
      "Hierarchy table detected but too few semantic rows survived reconstruction",
      { page: block.page }
    );
    const fallback = grids
      .flat()
      .map((r) => r.filter(Boolean).join(" | "))
      .filter(Boolean);
    return {
      ...block,
      markdown: ["```", ...fallback, "```"].join("\n"),
      kind: "fallback",
      confidence: 0.3,
      leakedProse,
    };
  }

  const cols = Math.min(4, Math.max(3, targetCols));
  const header = cols === 3 ? HEADERS_3 : HEADERS_4;
  const body = bodies.map((r) => padRow(r, cols));
  const grid = [header, ...body];

  return {
    ...block,
    grid,
    markdown: renderPipeTable(grid),
    kind: "pipe",
    confidence: block.confidence ?? 0.9,
    leakedProse,
  };
}

/**
 * Normalize one page/segment grid into canonical hierarchy rows.
 * @param {string[][]} grid
 * @returns {{ body: string[][], cols: number, leaked: string[] } | null}
 */
function normalizeHierarchySegment(grid) {
  if (!grid?.length) return null;

  // Peel trailing prose leaks before column cleanup — sparse-column collapse
  // can otherwise discard a leak that sits alone in a ghost column.
  /** @type {string[]} */
  const leaked = [];
  let working = grid.map((r) => r.slice());
  while (working.length && isProseLeakRow(working[working.length - 1])) {
    const row = working.pop();
    const text = (row || []).map((c) => (c || "").trim()).filter(Boolean).join(" ");
    if (text) leaked.unshift(text);
  }

  let g = dropEmptyColumns(working);
  g = collapseSparseInteriorColumns(g);
  if (!g.length || g[0].length < 3) {
    return leaked.length ? { body: [], cols: 4, leaked } : null;
  }

  // Skip structural header rows (short label cells); keep data only.
  let start = 0;
  if (isStructuralHeaderRow(g[0])) start = 1;

  /** @type {string[][]} */
  const body = [];
  for (let i = start; i < g.length; i++) {
    const row = g[i];
    if (isStructuralHeaderRow(row)) {
      // Continuation page with a shifted header — realign following rows
      // using non-empty header slots as the column map.
      const map = headerColumnMap(row);
      let j = i + 1;
      while (j < g.length && !isStructuralHeaderRow(g[j])) {
        if (isProseLeakRow(g[j])) {
          const text = g[j].map((c) => (c || "").trim()).filter(Boolean).join(" ");
          if (text) leaked.push(text);
        } else {
          body.push(remapRow(g[j], map, 4));
        }
        j += 1;
      }
      i = j - 1;
      continue;
    }
    if (isProseLeakRow(row)) {
      const text = row.map((c) => (c || "").trim()).filter(Boolean).join(" ");
      if (text) leaked.push(text);
      continue;
    }
    body.push(alignHierarchyRow(row));
  }

  if (!body.length) {
    return leaked.length ? { body: [], cols: 4, leaked } : null;
  }
  const cols = body.reduce((m, r) => Math.max(m, r.length), 0);
  return {
    body: body.map((r) => padRow(r, Math.min(4, Math.max(3, cols)))),
    cols: Math.min(4, Math.max(3, cols)),
    leaked,
  };
}

function dropEmptyColumns(grid) {
  const cols = grid[0].length;
  const keep = [];
  for (let c = 0; c < cols; c++) {
    const nonempty = grid.filter((r) => (r[c] || "").trim()).length;
    if (nonempty > 0) keep.push(c);
  }
  if (keep.length === cols) return grid.map((r) => r.slice());
  return grid.map((r) => keep.map((c) => r[c] || ""));
}

/**
 * Drop interior columns that are empty in the header and almost empty in body
 * (typical gutter ghost column between Rang and Rubrique).
 */
function collapseSparseInteriorColumns(grid) {
  if (!grid.length) return grid;
  const cols = grid[0].length;
  if (cols <= 4) {
    // Still drop a fully-empty trailing column.
    return dropEmptyColumns(grid);
  }
  const header = grid[0];
  const keep = [];
  for (let c = 0; c < cols; c++) {
    const headerEmpty = !(header[c] || "").trim();
    const bodyHits = grid.slice(1).filter((r) => (r[c] || "").trim()).length;
    const sparse = headerEmpty && bodyHits / Math.max(1, grid.length - 1) < 0.15;
    if (!sparse) keep.push(c);
  }
  if (keep.length === cols) return grid;
  return grid.map((r) => keep.map((c) => r[c] || ""));
}

/**
 * Short-label rows that act as table headers (structural, not name-matched).
 * Requires ≥3 filled short labels AND a non-empty first cell (rank header).
 * Data rows leave the rank column empty.
 */
function isStructuralHeaderRow(row) {
  const raw = (row || []).map((c) => (c || "").trim());
  const cells = raw.filter(Boolean);
  if (cells.length < 3) return false;
  if (!raw[0]) return false;
  if (cells.some((c) => c.length > 20)) return false;
  // Header labels are tiny (1–2 tokens). Learning-objective clauses are longer.
  if (!cells.every((c) => c.split(/\s+/).length <= 2 && c.length <= 16)) {
    return false;
  }
  return true;
}

function headerColumnMap(headerRow) {
  // Map non-empty header cells left→right onto canonical slots 0..n.
  const filled = [];
  for (let i = 0; i < headerRow.length; i++) {
    if ((headerRow[i] || "").trim()) filled.push(i);
  }
  return filled;
}

function remapRow(row, sourceIndexes, targetCols) {
  const out = new Array(targetCols).fill("");
  for (let t = 0; t < Math.min(sourceIndexes.length, targetCols); t++) {
    out[t] = (row[sourceIndexes[t]] || "").trim();
  }
  // If remap left leading rank empty but we have 4 source slots shifted,
  // keep positional fill already done.
  return alignHierarchyRow(out);
}

function alignHierarchyRow(row) {
  const cells = (row || []).map((c) => (c || "").trim());
  // If first cell looks like a rubrique (long-ish label) and rank empty was
  // shifted right, pull content left into canonical slots.
  while (cells.length > 4 && !(cells[cells.length - 1] || "").trim()) {
    cells.pop();
  }
  if (cells.length > 4) {
    // Merge overflow into last descriptive column.
    const head = cells.slice(0, 3);
    const rest = cells.slice(3).filter(Boolean).join(" ");
    return padRow([...head, rest], 4);
  }
  // Leading empty columns before a short rubrique: compress to start at col0/1.
  if (
    cells.length >= 4 &&
    !cells[0] &&
    !cells[1] &&
    cells[2] &&
    cells[2].length <= 45
  ) {
    return padRow(["", cells[2], cells[3] || "", cells[4] || ""], 4);
  }
  return cells;
}

function isProseLeakRow(row) {
  const cells = (row || []).map((c) => (c || "").trim());
  const nonempty = cells.filter(Boolean);
  if (!nonempty.length) return true;
  if (nonempty.length === 1 && nonempty[0].length > 55) return true;
  if (nonempty.length === 1 && /[.!?]$/.test(nonempty[0]) && nonempty[0].length > 40) {
    return true;
  }
  // Wide prose spanning one slot with empty neighbors (truncated mid-sentence).
  const long = nonempty.find((c) => c.length > 55);
  if (long && nonempty.length <= 2 && !/[?]$/.test(long)) {
    // Learning objectives are usually "Connaître/Savoir …" with siblings filled.
    // Leaked narrative often ends mid-phrase ("… risque de") or is a long clause
    // alone in the rubrique column.
    if (/\b(?:de|des|du|le|la|les|et|ou|à)\s*$/i.test(long)) return true;
    if (nonempty.length === 1) return true;
  }
  if (
    cells[1] &&
    cells[1].length > 55 &&
    !cells[2] &&
    !cells[3]
  ) {
    return true;
  }
  return false;
}

function padRow(row, cols) {
  const out = (row || []).slice(0, cols).map((c) => (c || "").trim());
  while (out.length < cols) out.push("");
  return out;
}
