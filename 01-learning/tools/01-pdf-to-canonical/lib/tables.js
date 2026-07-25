/**
 * Generic multi-column table reconstruction from positioned PDF text items.
 *
 * Detection is geometric:
 *   - ignore whitespace-only items
 *   - split rows on large horizontal gutters (not every word gap)
 *   - require vertically repeated column structure
 *
 * No specialty-specific names, page numbers, or document-specific replacements.
 */

const Y_LINE_TOL = 3.5;
const Y_WRAP_GAP = 24;
/**
 * Minimum gap (PDF units) between the end of one cell and the start of the next.
 * EDN hierarchy tables use ~22pt gutters between Rang and Rubrique; ordinary
 * prose word-spacing is typically ≤ 8pt after width accounting.
 */
const GUTTER_MIN = 18;
const MIN_COLS = 2;
const MIN_MULTICOL_ROWS = 3; // need a sustained multi-column run

/**
 * @param {{ pages: import('./types.js').ExtractedPage[] }} extraction
 * @param {{ warnings?: ReturnType<import('./warnings.js').createWarningCollector> }} [ctx]
 */
export function detectTables(extraction, ctx = {}) {
  const warnings = ctx.warnings;
  /** @type {import('./types.js').DetectedTable[]} */
  const tables = [];
  for (const page of extraction.pages) {
    tables.push(...detectTablesOnPage(page, warnings));
  }
  // Multi-page merges are handled by specialized table reconstructors so each
  // page segment can be normalized before bodies are concatenated.
  return tables.map((t) => ({
    ...t,
    segmentGrids: t.grid ? [t.grid] : [],
    segments: t.segments || [
      { page: t.page, yTop: t.yTop, yBottom: t.yBottom },
    ],
  }));
}

/**
 * @param {import('./types.js').ExtractedPage} page
 * @param {*} warnings
 */
export function detectTablesOnPage(page, warnings) {
  const rows = buildVisualRows(page.items).map((row) => {
    const cells = splitRowIntoCells(row.items);
    return { ...row, cells, colCount: cells.length };
  });
  if (rows.length < MIN_MULTICOL_ROWS) return [];

  /** @type {import('./types.js').DetectedTable[]} */
  const tables = [];
  let i = 0;
  while (i < rows.length) {
    if (rows[i].colCount < MIN_COLS || isHardStopRow(rows[i])) {
      i += 1;
      continue;
    }

    // Grow until a hard stop / prose interrupt. Include wrapped single-cell
    // fragments that still sit in the column x-bands (hierarchy tables wrap
    // cells across several visual rows with ~60–80pt gaps between logical rows).
    let end = i;
    let runningXs = rows[i].cells.map((c) => c.x);
    for (let j = i + 1; j < rows.length; j++) {
      const row = rows[j];
      if (isHardStopRow(row)) break;
      if (isProseInterrupt(row, runningXs)) break;

      const rowXs = row.cells.map((c) => c.x);
      if (row.colCount >= MIN_COLS && columnsCompatible(runningXs, rowXs)) {
        end = j;
        runningXs = clusterXs([...runningXs, ...rowXs]).map((c) => c.center);
        continue;
      }
      // Wrapped / sparse cells: keep only if they sit in column bands and are
      // not left-margin prose (which is near col-0 by accident).
      if (isTableCellFragment(row, runningXs, rows[end])) {
        end = j;
        continue;
      }
      break;
    }

    const slice = rows.slice(i, end + 1);
    const multiCount = slice.filter((r) => r.colCount >= MIN_COLS).length;
    // Continuation pages may only have a repeated header + 2 data rows.
    const minRows = looksLikeHeaderRow(rows[i]) ? 2 : MIN_MULTICOL_ROWS;
    if (multiCount >= minRows && slice.length >= minRows) {
      const built = buildTableFromCellRows(slice, runningXs, page, warnings);
      if (built) {
        tables.push(built);
        i = end + 1;
        continue;
      }
    }
    i += 1;
  }
  return tables;
}

/**
 * Build visual rows (same y-band) from positioned items.
 * @param {import('./types.js').TextItem[]} items
 */
export function buildVisualRows(items) {
  const sorted = items
    .filter((it) => it.str != null && String(it.str).trim().length > 0)
    .slice()
    .sort((a, b) => b.y - a.y || a.x - b.x);

  /** @type {{ y: number, items: import('./types.js').TextItem[] }[]} */
  const rows = [];
  for (const item of sorted) {
    const last = rows[rows.length - 1];
    if (last && Math.abs(last.y - item.y) <= Y_LINE_TOL) {
      last.items.push(item);
      last.y = (last.y * (last.items.length - 1) + item.y) / last.items.length;
    } else {
      rows.push({ y: item.y, items: [item] });
    }
  }
  for (const row of rows) {
    row.items.sort((a, b) => a.x - b.x);
  }
  return rows;
}

/**
 * Split a visual row into cells on large horizontal gutters.
 * @param {import('./types.js').TextItem[]} items
 */
export function splitRowIntoCells(items) {
  const meaningful = items.filter((i) => String(i.str).trim().length > 0);
  if (!meaningful.length) return [];

  /** @type {{ x: number, text: string, items: import('./types.js').TextItem[] }[]} */
  const cells = [];
  let current = [meaningful[0]];

  for (let i = 1; i < meaningful.length; i++) {
    const prev = meaningful[i - 1];
    const cur = meaningful[i];
    const prevEnd = prev.x + (prev.width || estimateWidth(prev));
    const gap = cur.x - prevEnd;
    if (gap >= GUTTER_MIN) {
      cells.push(makeCell(current));
      current = [cur];
    } else {
      current.push(cur);
    }
  }
  cells.push(makeCell(current));
  return cells;
}

function makeCell(items) {
  return {
    x: items[0].x,
    text: joinCellItems(items),
    items,
  };
}

function joinCellItems(items) {
  let out = items[0].str;
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1];
    const cur = items[i];
    const prevEnd = prev.x + (prev.width || estimateWidth(prev));
    const gap = cur.x - prevEnd;
    if (gap < 1.2) out += cur.str;
    else if (out.endsWith("-") && /^[a-zà-öø-ÿ]/.test(cur.str)) {
      out = out.slice(0, -1) + cur.str;
    } else out += (/^\s/.test(cur.str) ? "" : " ") + cur.str;
  }
  return normalizeCell(out);
}

function estimateWidth(item) {
  // Fallback when width missing: ~0.5em per character at fontSize.
  return (item.fontSize || 12) * 0.45 * String(item.str || "").length;
}

/**
 * 1-D clustering of x coordinates (exported for tests).
 */
export function clusterXs(xs, tol = GUTTER_MIN * 0.75) {
  if (!xs.length) return [];
  const sorted = xs.slice().sort((a, b) => a - b);
  const clusters = [];
  for (const x of sorted) {
    const last = clusters[clusters.length - 1];
    if (!last || x - last.center > tol) {
      clusters.push({ center: x, n: 1, sum: x });
    } else {
      last.sum += x;
      last.n += 1;
      last.center = last.sum / last.n;
    }
  }
  return clusters;
}

function columnsCompatible(a, b, tol = GUTTER_MIN * 2.2) {
  if (a.length < 2 || b.length < 2) return false;
  const [small, large] = a.length <= b.length ? [a, b] : [b, a];
  let hits = 0;
  for (const x of small) {
    if (large.some((y) => Math.abs(x - y) <= tol)) hits += 1;
  }
  // Allow 2-column body rows under a 3–4 column header.
  return hits >= Math.min(2, small.length) && hits / small.length >= 0.5;
}

function isProseInterrupt(row, runningXs) {
  if (!row.cells.length) return false;
  const text = row.cells.map((c) => c.text).join(" ").trim();
  const minX = Math.min(...row.cells.map((c) => c.x));
  // Left-margin narrative lines end a table even if x≈ first column.
  if (row.colCount === 1 && minX < 55 && text.length > 55) {
    return true;
  }
  if (
    row.colCount === 1 &&
    minX < 60 &&
    text.length > 90 &&
    !cellsFitColumns(row.cells, runningXs)
  ) {
    return true;
  }
  return false;
}

function isTableCellFragment(row, runningXs, prevRow) {
  if (!row.cells.length || !cellsFitColumns(row.cells, runningXs)) return false;
  const text = row.cells.map((c) => c.text).join(" ").trim();
  const minX = Math.min(...row.cells.map((c) => c.x));
  const yGap = prevRow.y - row.y;
  // Interior-column fragments (not the leftmost page margin).
  const interior = runningXs
    .slice(1)
    .some((x) => Math.abs(minX - x) <= GUTTER_MIN * 1.6);
  if (interior && text.length < 120) return true;
  // Same logical row wrap (tight y-gap), short cell.
  if (yGap <= Y_WRAP_GAP && text.length < 80) return true;
  // Short label in first column with table-like row spacing.
  if (minX < 55 && text.length <= 40 && yGap < 90 && !/[.!?]$/.test(text)) {
    return true;
  }
  return false;
}

function looksLikeHeaderRow(row) {
  if (!row || row.colCount < MIN_COLS) return false;
  const texts = row.cells.map((c) => c.text.trim());
  // Short label cells typical of headers (not long prose).
  const short = texts.filter((t) => t.length > 0 && t.length <= 40).length;
  return short >= MIN_COLS && texts.every((t) => t.length <= 60);
}

function cellsFitColumns(cells, colXs, tol = GUTTER_MIN * 1.4) {
  if (!cells.length) return false;
  return cells.every((c) => colXs.some((x) => Math.abs(c.x - x) <= tol));
}

function isHardStopRow(row) {
  const text = (row.cells || [])
    .map((c) => c.text)
    .join(" ")
    .trim();
  const items = row.items || [];
  const maxFont = items.length
    ? Math.max(...items.map((i) => i.fontSize || 0))
    : 12;
  const minX = items.length ? Math.min(...items.map((i) => i.x)) : 0;

  if (maxFont >= 20) return true;
  if (/^Chapitre\s+\d+/i.test(text)) return true;
  if (/^(?:[IVXLCDM]{2,}|[IVX])(?:\.|\s+)\s*\S/.test(text) && maxFont >= 16) {
    return true;
  }
  // Letter subsection titles at the left margin end a table region.
  if (
    /^[A-Z](?:\.|\s+)[A-ZÀ-Ÿ]/.test(text) &&
    minX < 55 &&
    row.colCount <= 1 &&
    text.length < 80
  ) {
    return true;
  }
  // Named structural headings that are never table cells.
  if (
    /^(Situations de départ|Hiérarchisation des connaissances|Points-clés)\s*$/i.test(
      text
    )
  ) {
    return true;
  }
  return false;
}

/**
 * @param {Array} cellRows rows with .cells / .y
 * @param {number[]} seedXs
 */
export function buildTableFromCellRows(cellRows, seedXs, page, warnings) {
  const allXs = cellRows.flatMap((r) => r.cells.map((c) => c.x));
  let colCenters = clusterXs(allXs).map((c) => c.center);
  if (colCenters.length < MIN_COLS) colCenters = seedXs.slice();
  if (colCenters.length < MIN_COLS) return null;

  const logical = bandLogicalRows(cellRows);

  /** @type {string[][]} */
  const grid = [];
  for (const band of logical) {
    const cells = new Array(colCenters.length).fill("");
    for (const vrow of band) {
      for (const cell of vrow.cells) {
        const ci = nearestCol(cell.x, colCenters);
        if (ci < 0) continue;
        cells[ci] = cells[ci]
          ? joinCellText(cells[ci], cell.text)
          : cell.text;
      }
    }
    const normalized = cells.map((c) => normalizeCell(c));
    if (normalized.every((c) => !c)) continue;
    grid.push(normalized);
  }

  // Drop columns that are empty across (almost) the whole grid.
  const kept = dropEmptyColumns(grid, colCenters);
  if (kept.grid.length < 2 || kept.cols < MIN_COLS) return null;

  const header = kept.grid[0];
  const body = [header];
  for (let r = 1; r < kept.grid.length; r++) {
    if (rowsEqual(kept.grid[r], header)) continue;
    body.push(kept.grid[r]);
  }
  if (body.length < 2) return null;

  const multi = body.filter((r) => r.filter(Boolean).length >= 2).length;
  const confidence = multi / body.length;
  const yTop = Math.max(...cellRows.map((r) => r.y));
  const yBottom = Math.min(...cellRows.map((r) => r.y));

  // Reject low-confidence "tables" that are really prose fragments.
  const segments = [{ page: page.pageNumber, yTop, yBottom }];
  const centers = kept.centers;

  if (confidence < 0.55 || body.length < 3) {
    if (confidence >= 0.35 && body.length >= 3) {
      // Warning emitted by DataTable reconstructor after classification.
      return {
        page: page.pageNumber,
        yTop,
        yBottom,
        colCenters: centers,
        segments,
        grid: body,
        markdown: ["```", ...body.map((r) => r.filter(Boolean).join(" | ")), "```"].join(
          "\n"
        ),
        kind: "fallback",
        confidence,
      };
    }
    return null; // do not emit a false table
  }

  return {
    page: page.pageNumber,
    yTop,
    yBottom,
    colCenters: centers,
    segments,
    grid: body,
    markdown: renderPipeTable(body),
    kind: "pipe",
    confidence,
  };
}

/** @deprecated use buildTableFromCellRows — kept for unit tests with visual rows */
export function buildTableFromRows(visualRows, seedCenters, page, warnings) {
  const cellRows = visualRows.map((row) => ({
    ...row,
    cells: splitRowIntoCells(row.items),
  }));
  return buildTableFromCellRows(cellRows, seedCenters, page, warnings);
}

export function bandLogicalRows(visualRows) {
  if (!visualRows.length) return [];
  const sorted = visualRows.slice().sort((a, b) => b.y - a.y);
  const bands = [];
  let current = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const prev = current[current.length - 1];
    const gap = prev.y - sorted[i].y;
    if (gap <= Y_WRAP_GAP) current.push(sorted[i]);
    else {
      bands.push(current);
      current = [sorted[i]];
    }
  }
  bands.push(current);
  return bands;
}

function nearestCol(x, centers) {
  let best = -1;
  let bestDist = Infinity;
  for (let i = 0; i < centers.length; i++) {
    const d = Math.abs(x - centers[i]);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  if (bestDist > GUTTER_MIN * 1.6) return -1;
  return best;
}

function joinCellText(a, b) {
  if (!a) return b;
  if (!b) return a;
  // Soft hyphenation across a wrap only.
  if (a.endsWith("-") && /^[a-zà-öø-ÿ]/.test(b)) return a.slice(0, -1) + b;
  // Default: wrapped cell fragments are separate words.
  return `${a} ${b}`;
}

function normalizeCell(text) {
  return String(text || "")
    .replace(/\u00ad/g, "")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function rowsEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (normalizeCell(a[i]).toLowerCase() !== normalizeCell(b[i]).toLowerCase()) {
      return false;
    }
  }
  return true;
}

function dropEmptyColumns(grid, colCenters = []) {
  if (!grid.length) return { grid, cols: 0, centers: [], keep: [] };
  const cols = grid[0].length;
  const keep = [];
  for (let c = 0; c < cols; c++) {
    const nonempty = grid.filter((r) => r[c]).length;
    if (nonempty > 0) keep.push(c);
  }
  return {
    grid: grid.map((r) => keep.map((c) => r[c])),
    cols: keep.length,
    centers: keep.map((c) => colCenters[c]).filter((x) => x != null),
    keep,
  };
}

export function renderPipeTable(grid) {
  const cols = Math.max(...grid.map((r) => r.length));
  const padded = grid.map((r) => {
    const row = r.slice();
    while (row.length < cols) row.push("");
    return row.map((c) => escapeCell(c));
  });
  const lines = [];
  lines.push(`| ${padded[0].join(" | ")} |`);
  lines.push(`| ${padded[0].map(() => "---").join(" | ")} |`);
  for (let i = 1; i < padded.length; i++) {
    lines.push(`| ${padded[i].join(" | ")} |`);
  }
  return lines.join("\n");
}

function escapeCell(text) {
  return String(text).replace(/\|/g, "\\|").replace(/\n/g, " ");
}

export function mergeContinuedTables(tables) {
  if (tables.length < 2) return tables;
  const sorted = tables
    .slice()
    .sort((a, b) => a.page - b.page || b.yTop - a.yTop)
    .map((t) => ({
      ...t,
      segments: t.segments || [
        { page: t.page, yTop: t.yTop, yBottom: t.yBottom },
      ],
    }));
  const out = [];
  let cur = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    const continued =
      next.page === cur.page + 1 &&
      cur.yBottom < 140 &&
      next.yTop > 650 &&
      columnsCompatible(cur.colCenters || [], next.colCenters || []) &&
      cur.kind === "pipe" &&
      next.kind === "pipe";
    if (continued) cur = stitchTables(cur, next);
    else {
      out.push(cur);
      cur = next;
    }
  }
  out.push(cur);
  return out;
}

function stitchTables(a, b) {
  const gridA = parsePipe(a.markdown);
  const gridB = parsePipe(b.markdown);
  if (!gridA.length) {
    return {
      ...a,
      yBottom: b.yBottom,
      pageEnd: b.page,
      segments: [
        ...(a.segments || [{ page: a.page, yTop: a.yTop, yBottom: a.yBottom }]),
        ...(b.segments || [{ page: b.page, yTop: b.yTop, yBottom: b.yBottom }]),
      ],
    };
  }
  const header = gridA[0];
  const merged = [...gridA];
  for (const row of gridB) {
    if (rowsEqual(row, header)) continue;
    merged.push(row);
  }
  return {
    ...a,
    markdown: renderPipeTable(merged),
    yBottom: b.yBottom,
    pageEnd: b.page,
    segments: [
      ...(a.segments || [{ page: a.page, yTop: a.yTop, yBottom: a.yBottom }]),
      ...(b.segments || [{ page: b.page, yTop: b.yTop, yBottom: b.yBottom }]),
    ],
  };
}

function parsePipe(markdown) {
  return markdown
    .split("\n")
    .filter((l) => l.startsWith("|") && !/^\|\s*---/.test(l))
    .map((l) =>
      l
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((c) => c.trim())
    );
}

export function filterExtractionOutsideTables(extraction, tables) {
  return {
    ...extraction,
    pages: extraction.pages.map((page) => {
      const pageTables = tables.filter((t) =>
        (t.segments || [{ page: t.page }]).some((s) => s.page === page.pageNumber)
      );
      if (!pageTables.length) return page;
      return {
        ...page,
        items: page.items.filter(
          (item) => !pageTables.some((t) => itemInTable(item, t, page.pageNumber))
        ),
      };
    }),
  };
}

function itemInTable(item, table, pageNumber) {
  const segments =
    table.segments ||
    [{ page: table.page, yTop: table.yTop, yBottom: table.yBottom }];
  return segments.some(
    (s) =>
      s.page === pageNumber &&
      item.y <= s.yTop + 2 &&
      item.y >= s.yBottom - 2
  );
}

export function lineInTable(line, table) {
  return itemInTable(line, table, line.page);
}
