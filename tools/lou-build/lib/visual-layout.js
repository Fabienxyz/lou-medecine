import { measureText, wrapText } from "./text-fit.js";

/**
 * Deterministic layered layout for the causal-graph primitive.
 *
 * Everything here is geometry derived from graph structure and from the measured
 * size of spec-provided text. There are no per-node coordinates, no assumption
 * about how many nodes exist, and no knowledge of any subject domain: the module
 * sees node ids, node kinds, edge relations and strings.
 *
 * Algorithm: longest-path layering over the forward edges, one barycentre pass to
 * order each layer, then rows are packed and centred. Edges declared `feeds_back`
 * are lifted out before layering and routed through a reserved side gutter, so a
 * cycle never breaks the layering pass.
 */

export const LAYOUT = {
  fontSize: 15,
  fontWeight: 600,
  lineHeight: 21,
  titleFontSize: 19,
  titleFontWeight: 600,
  titleLineHeight: 26,
  titleMinWidth: 520,
  titleMaxLines: 2,

  nodeMinWidth: 148,
  nodeMaxWidth: 264,
  nodePaddingX: 18,
  nodePaddingY: 16,
  nodeMaxLines: 3,

  columnGap: 34,
  rowGap: 56,
  margin: 40,
  titleBlock: 74,
  gutter: 68,
  cornerRadius: 14,
};

/** Relation kinds lifted out of the DAG before layering. */
const BACK_RELATIONS = new Set(["feeds_back"]);

function layerNodes(nodeIds, forwardEdges) {
  const incoming = new Map(nodeIds.map((id) => [id, []]));
  for (const e of forwardEdges) incoming.get(e.to).push(e.from);

  const layer = new Map();
  const pending = new Set(nodeIds);

  // Longest-path layering: a node settles once every predecessor has settled.
  let guard = nodeIds.length + 1;
  while (pending.size > 0 && guard-- > 0) {
    let progressed = false;
    for (const id of [...pending]) {
      const preds = incoming.get(id);
      if (preds.some((p) => !layer.has(p))) continue;
      layer.set(id, preds.length === 0 ? 0 : Math.max(...preds.map((p) => layer.get(p) + 1)));
      pending.delete(id);
      progressed = true;
    }
    if (!progressed) break;
  }

  if (pending.size > 0) {
    return {
      ok: false,
      errors: [
        `layout: forward edges contain a cycle through ${[...pending].sort().join(", ")}; ` +
          `a cyclic relation must declare relation "feeds_back"`,
      ],
    };
  }

  return { ok: true, errors: [], layer, incoming };
}

/** One barycentre pass, tie-broken by spec order so the result is stable. */
function orderRows(nodeIds, layer, incoming, specIndex) {
  const rows = [];
  for (const id of nodeIds) {
    const l = layer.get(id);
    (rows[l] ||= []).push(id);
  }

  const slotOf = new Map();
  rows.forEach((row, index) => {
    if (index === 0) {
      row.sort((a, b) => specIndex.get(a) - specIndex.get(b));
    } else {
      row.sort((a, b) => {
        const bary = (id) => {
          const preds = incoming.get(id).filter((p) => slotOf.has(p));
          if (preds.length === 0) return Number.MAX_SAFE_INTEGER;
          return preds.reduce((sum, p) => sum + slotOf.get(p), 0) / preds.length;
        };
        return bary(a) - bary(b) || specIndex.get(a) - specIndex.get(b);
      });
    }
    row.forEach((id, slot) => slotOf.set(id, slot));
  });

  return rows;
}

function sizeNode(node, cfg) {
  const { fontSize, fontWeight, nodePaddingX, nodeMinWidth, nodeMaxWidth } = cfg;

  // Prefer a width that holds the label on one line, then clamp to the budget
  // and let wrapText decide how many lines the clamped width actually needs.
  const oneLine = measureText(node.label, fontSize, fontWeight) + 2 * nodePaddingX;
  const width = Math.min(Math.max(Math.ceil(oneLine), nodeMinWidth), nodeMaxWidth);
  const inner = width - 2 * nodePaddingX;

  const wrapped = wrapText(node.label, inner, fontSize, fontWeight, {
    maxLines: cfg.nodeMaxLines,
  });
  if (!wrapped.ok) {
    return {
      ok: false,
      errors: wrapped.errors.map((e) => `node ${node.id}: ${e}`),
    };
  }

  return {
    ok: true,
    errors: [],
    width,
    height: wrapped.lines.length * cfg.lineHeight + 2 * cfg.nodePaddingY,
    lines: wrapped.lines,
  };
}

export function layoutCausalGraph(spec, overrides = {}) {
  const cfg = { ...LAYOUT, ...overrides };
  const errors = [];

  const nodeIds = spec.nodes.map((n) => n.id);
  const specIndex = new Map(nodeIds.map((id, i) => [id, i]));
  const backEdges = spec.edges.filter((e) => BACK_RELATIONS.has(e.relation));
  const forwardEdges = spec.edges.filter((e) => !BACK_RELATIONS.has(e.relation));

  // --- measure -------------------------------------------------------------
  const boxes = new Map();
  for (const node of spec.nodes) {
    const sized = sizeNode(node, cfg);
    if (!sized.ok) {
      errors.push(...sized.errors);
      continue;
    }
    boxes.set(node.id, sized);
  }
  if (errors.length > 0) return { ok: false, errors, layout: null };

  // --- layer and order ------------------------------------------------------
  const layered = layerNodes(nodeIds, forwardEdges);
  if (!layered.ok) return { ok: false, errors: layered.errors, layout: null };

  const rows = orderRows(nodeIds, layered.layer, layered.incoming, specIndex);

  // --- place ----------------------------------------------------------------
  const rowWidths = rows.map(
    (row) =>
      row.reduce((sum, id) => sum + boxes.get(id).width, 0) +
      cfg.columnGap * (row.length - 1)
  );
  const contentWidth = Math.max(...rowWidths);
  const reserveGutter = backEdges.length > 0 ? cfg.gutter : 0;
  const gridWidth = contentWidth + 2 * cfg.margin + reserveGutter;

  // The heading is spec-provided text and obeys the same no-truncation rule as a
  // node label: it wraps, and the canvas widens for it if the grid is narrow.
  const titleBand = Math.max(cfg.titleMinWidth, gridWidth - 2 * cfg.margin);
  const titleWrap = wrapText(
    spec.question,
    titleBand,
    cfg.titleFontSize,
    cfg.titleFontWeight,
    { maxLines: cfg.titleMaxLines }
  );
  if (!titleWrap.ok) {
    return {
      ok: false,
      errors: titleWrap.errors.map((e) => `question: ${e}`),
      layout: null,
    };
  }

  const width = Math.max(gridWidth, Math.ceil(titleWrap.width) + 2 * cfg.margin);
  const titleBlock =
    cfg.titleBlock + (titleWrap.lines.length - 1) * cfg.titleLineHeight;

  const placed = new Map();
  let y = titleBlock;
  // Centre the grid within whatever width won, leaving the gutter clear.
  const gridLeft = (width - reserveGutter - contentWidth) / 2;

  rows.forEach((row, index) => {
    const rowHeight = Math.max(...row.map((id) => boxes.get(id).height));
    let x = gridLeft + (contentWidth - rowWidths[index]) / 2;
    for (const id of row) {
      const box = boxes.get(id);
      placed.set(id, {
        id,
        x,
        y: y + (rowHeight - box.height) / 2,
        width: box.width,
        height: box.height,
        lines: box.lines,
        row: index,
      });
      x += box.width + cfg.columnGap;
    }
    y += rowHeight + cfg.rowGap;
  });

  const height = y - cfg.rowGap + cfg.margin;
  const gutterX = gridLeft + contentWidth + reserveGutter / 2;

  // --- route ----------------------------------------------------------------
  const edges = [];
  for (const edge of spec.edges) {
    const a = placed.get(edge.from);
    const b = placed.get(edge.to);
    const isBack = BACK_RELATIONS.has(edge.relation);
    edges.push({
      ...edge,
      back: isBack,
      path: isBack
        ? gutterPath(a, b, gutterX, cfg.cornerRadius)
        : forwardPath(a, b),
    });
  }

  return {
    ok: true,
    errors: [],
    layout: {
      width: Math.ceil(width),
      height: Math.ceil(height),
      titleLines: titleWrap.lines,
      nodes: nodeIds.map((id) => placed.get(id)),
      edges,
      rows: rows.map((row) => [...row]),
      config: cfg,
    },
  };
}

const round = (n) => Math.round(n * 100) / 100;

/** Straight when vertically aligned, otherwise a vertical-tangent cubic. */
function forwardPath(a, b) {
  const sx = a.x + a.width / 2;
  const sy = a.y + a.height;
  const tx = b.x + b.width / 2;
  const ty = b.y;

  if (Math.abs(sx - tx) < 0.5) {
    return `M ${round(sx)} ${round(sy)} L ${round(tx)} ${round(ty)}`;
  }
  const bend = Math.max((ty - sy) / 2, 12);
  return (
    `M ${round(sx)} ${round(sy)} ` +
    `C ${round(sx)} ${round(sy + bend)}, ${round(tx)} ${round(ty - bend)}, ` +
    `${round(tx)} ${round(ty)}`
  );
}

/**
 * Orthogonal route through the reserved gutter, with rounded corners.
 * Leaving the row grid is what makes a feedback relation legible as a loop
 * rather than as one more forward arrow.
 */
function gutterPath(a, b, gutterX, radius) {
  const sx = a.x + a.width;
  const sy = a.y + a.height / 2;
  const tx = b.x + b.width;
  const ty = b.y + b.height / 2;
  const up = ty < sy;
  const r = Math.min(radius, Math.abs(sy - ty) / 2);
  const corner1 = up ? sy - r : sy + r;
  const corner2 = up ? ty + r : ty - r;

  return (
    `M ${round(sx)} ${round(sy)} ` +
    `L ${round(gutterX - r)} ${round(sy)} ` +
    `Q ${round(gutterX)} ${round(sy)}, ${round(gutterX)} ${round(corner1)} ` +
    `L ${round(gutterX)} ${round(corner2)} ` +
    `Q ${round(gutterX)} ${round(ty)}, ${round(gutterX - r)} ${round(ty)} ` +
    `L ${round(tx)} ${round(ty)}`
  );
}
