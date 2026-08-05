/**
 * Layout + SVG render for decision-algorithm primitive (generic).
 */

import { measureText, wrapText } from "./text-fit.js";
import { TOKENS, escapeXml } from "./visual-render.js";

export const DECISION_LAYOUT = {
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 19,
  titleFontSize: 18,
  titleFontWeight: 600,
  titleLineHeight: 24,
  nodeMinWidth: 140,
  nodeMaxWidth: 260,
  nodePaddingX: 16,
  nodePaddingY: 14,
  subitemFontSize: 12,
  subitemLineHeight: 17,
  layerGapY: 110,
  nodeGapX: 64,
  branchLabelFontSize: 12,
  branchLabelMaxWidth: 180,
  branchLabelLineHeight: 16,
  margin: 36,
  titleBlock: 72,
  cornerRadius: 12,
  annotationFontSize: 12,
  annotationLineHeight: 17,
  fragmentFontSize: 11,
  fragmentLineHeight: 14,
  fragmentPadding: 8,
  minBottomMargin: 24,
  lateralCorridorPad: 28,
};

const NODE_STYLES = {
  entry: { fill: "#f5f7fa", stroke: "#2563eb", strokeWidth: 2, dash: null },
  decision: { fill: "#ffffff", stroke: "#2563eb", strokeWidth: 2, dash: null },
  test: { fill: "#f9fafb", stroke: "#6b7280", strokeWidth: 1.5, dash: "5 4" },
  "dead-end": { fill: "#f3f4f6", stroke: "#9ca3af", strokeWidth: 1.5, dash: "4 3" },
  conclusion: { fill: "#f0f6ff", stroke: "#2563eb", strokeWidth: 2, dash: null },
};

function sizeNode(node, cfg) {
  const lines = wrapText(node.label, cfg.nodeMaxWidth - 2 * cfg.nodePaddingX, cfg.fontSize, cfg.fontWeight, {
    maxLines: 4,
  });
  if (!lines.ok) return { ok: false, errors: [`node ${node.id}: label overflow`] };

  let height = 2 * cfg.nodePaddingY + lines.lines.length * cfg.lineHeight;
  const subLines = [];
  for (const sub of node.subitems || []) {
    const w = wrapText(`• ${sub.label}`, cfg.nodeMaxWidth - 2 * cfg.nodePaddingX - 8, cfg.subitemFontSize, 500, {
      maxLines: 3,
    });
    if (!w.ok) return { ok: false, errors: [`node ${node.id} subitem: overflow`] };
    subLines.push(...w.lines);
  }
  if (subLines.length) {
    height += 8 + subLines.length * cfg.subitemLineHeight;
  }

  const contentW = Math.max(
    lines.width,
    ...subLines.map((l) => measureText(l, cfg.subitemFontSize, 500)),
  );
  const width = Math.min(
    cfg.nodeMaxWidth,
    Math.max(cfg.nodeMinWidth, Math.ceil(contentW + 2 * cfg.nodePaddingX)),
  );

  return {
    ok: true,
    box: {
      id: node.id,
      kind: node.kind,
      width,
      height: Math.ceil(height),
      lines: lines.lines,
      subLines,
    },
  };
}

function assignLayers(nodeIds, branches) {
  const incoming = new Map(nodeIds.map((id) => [id, []]));
  const outgoing = new Map(nodeIds.map((id) => [id, []]));
  for (const b of branches) {
    outgoing.get(b.from).push(b);
    incoming.get(b.to).push(b);
  }

  const layer = new Map();
  for (const id of nodeIds) {
    if (incoming.get(id).length === 0) layer.set(id, 0);
  }
  if (layer.size === 0 && nodeIds.length) layer.set(nodeIds[0], 0);

  let guard = nodeIds.length * nodeIds.length;
  while (guard-- > 0) {
    let changed = false;
    for (const b of branches) {
      if (!layer.has(b.from)) continue;
      const next = layer.get(b.from) + 1;
      if (!layer.has(b.to) || layer.get(b.to) < next) {
        layer.set(b.to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return { layer, incoming, outgoing };
}

function layoutFragmentBox(frag, cfg, anchorX, anchorY, placed, obstacles) {
  const scaleLines = (frag.scales || []).map(
    (s) => `${s.analyte} ${s.cutoff_label}`,
  );
  const allLines = [frag.context, ...scaleLines];
  const innerW = Math.max(
    ...allLines.map((l) => measureText(l, cfg.fragmentFontSize, 500)),
    120,
  );
  const width = Math.ceil(innerW + 2 * cfg.fragmentPadding);
  const height = Math.ceil(
    cfg.fragmentPadding * 2 + allLines.length * cfg.fragmentLineHeight,
  );

  const candidates = [
    { x: anchorX - width / 2, y: anchorY - height - 16 },
    { x: anchorX + 32, y: anchorY - height / 2 },
    { x: anchorX - width - 32, y: anchorY - height / 2 },
    { x: anchorX - width / 2, y: anchorY + 20 },
  ];

  for (const c of candidates) {
    const box = { x: c.x, y: c.y, width, height };
    const blocked =
      placed.some((p) => rectsOverlap(box, p, 6)) ||
      obstacles.some((p) => rectsOverlap(box, p, 6));
    if (!blocked) return { ...box, lines: allLines };
  }

  return { x: anchorX - width / 2, y: anchorY - height - 16, width, height, lines: allLines };
}

function rectsOverlap(a, b, pad = 2) {
  return (
    a.x < b.x + b.width + pad &&
    a.x + a.width + pad > b.x &&
    a.y < b.y + b.height + pad &&
    a.y + a.height + pad > b.y
  );
}

function layoutBranchLabel(branch, cfg, x1, x2, midY, placed, obstacles, options = {}) {
  const labelWrap = wrapText(
    branch.condition,
    cfg.branchLabelMaxWidth,
    cfg.branchLabelFontSize,
    500,
    { maxLines: 4 },
  );
  const lines = labelWrap.ok ? labelWrap.lines : [branch.condition];
  const labelW = Math.max(...lines.map((l) => measureText(l, cfg.branchLabelFontSize, 500)), 40);
  const labelH = lines.length * cfg.branchLabelLineHeight + 8;
  const centerX = options.preferX ?? (x1 + x2) / 2;

  const candidates = options.preferX != null
    ? [
        { x: centerX - labelW - 8, y: midY - labelH / 2 },
        { x: centerX + 12, y: midY - labelH / 2 },
        { x: centerX - labelW / 2 - 4, y: midY - labelH - 8 },
        { x: centerX - labelW / 2 - 4, y: midY + 10 },
      ]
    : [
        { x: centerX - labelW / 2 - 4, y: midY - labelH - 6 },
        { x: x2 - labelW / 2 - 4, y: midY + 10 },
        { x: x1 - labelW - 20, y: midY - labelH / 2 },
        { x: x2 + 16, y: midY - labelH / 2 },
        { x: x1 + 16, y: midY - labelH - 6 },
      ];

  let box = { x: candidates[0].x, y: candidates[0].y, width: labelW + 8, height: labelH };
  for (const c of candidates) {
    const candidate = { x: c.x, y: c.y, width: labelW + 8, height: labelH };
    const blocked =
      placed.some((p) => rectsOverlap(candidate, p, 4)) ||
      obstacles.some((p) => rectsOverlap(candidate, p, 4));
    if (!blocked) {
      box = candidate;
      break;
    }
  }
  placed.push(box);

  return {
    labelX: box.x + box.width / 2,
    labelY: box.y + 12,
    labelLines: lines,
    labelBoxes: [box],
  };
}

function buildPathFromSegments(segments) {
  if (!segments.length) return "";
  const [first, ...rest] = segments;
  const parts = [`M ${first.x1} ${first.y1}`];
  for (const seg of segments) {
    parts.push(`L ${seg.x2} ${seg.y2}`);
  }
  return parts.join(" ");
}

function getIntermediateNodes(fromId, toId, layer, positions) {
  const fromL = layer.get(fromId);
  const toL = layer.get(toId);
  if (fromL == null || toL == null || toL - fromL <= 1) return [];
  const result = [];
  for (const [id, pos] of positions) {
    const l = layer.get(id);
    if (l > fromL && l < toL) result.push(pos);
  }
  return result;
}

function routeSkipLevel(from, to, intermediate, cfg) {
  const pad = cfg.lateralCorridorPad;
  const blockMinX = Math.min(from.x, ...intermediate.map((n) => n.x));
  const blockMaxX = Math.max(from.x + from.width, ...intermediate.map((n) => n.x + n.width));
  const sourceCx = from.x + from.width / 2;
  const targetCx = to.x + to.width / 2;

  const routeRight = targetCx >= sourceCx;
  const corridorX = routeRight ? blockMaxX + pad : blockMinX - pad;
  const exitX = routeRight ? from.x + from.width : from.x;
  const exitY = from.y + from.height / 2;
  const approachY = to.y - 10;
  const enterX = to.x + to.width / 2;

  const segments = [
    { x1: exitX, y1: exitY, x2: corridorX, y2: exitY },
    { x1: corridorX, y1: exitY, x2: corridorX, y2: approachY },
    { x1: corridorX, y1: approachY, x2: enterX, y2: approachY },
    { x1: enterX, y1: approachY, x2: enterX, y2: to.y },
  ];

  const labelY = (exitY + approachY) / 2;
  return {
    path: buildPathFromSegments(segments),
    segments,
    x1: exitX,
    x2: enterX,
    midY: labelY,
    labelPreferX: corridorX,
    routeKind: "skip-level",
  };
}

function edgePath(from, to, branch, layer, positions, cfg) {
  const fromLayer = layer.get(branch.from);
  const toLayer = layer.get(branch.to);
  const layerGap = toLayer - fromLayer;

  if (layerGap > 1) {
    const intermediate = getIntermediateNodes(branch.from, branch.to, layer, positions);
    return routeSkipLevel(from, to, intermediate, cfg);
  }

  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height;
  const x2 = to.x + to.width / 2;
  const y2 = to.y;

  if (Math.abs(y2 - from.y) < 12) {
    const routeY = from.y - 28;
    const segments = [
      { x1, y1: y1, x2: x1, y2: routeY },
      { x1, y1: routeY, x2: x2, y2: routeY },
      { x1: x2, y1: routeY, x2, y2: y2 },
    ];
    return {
      path: buildPathFromSegments(segments),
      segments,
      x1,
      x2,
      midY: routeY,
      routeKind: "same-row",
    };
  }

  const midY = (y1 + y2) / 2;
  const segments = [
    { x1, y1, x2: x1, y2: midY },
    { x1, y1: midY, x2: x2, y2: midY },
    { x1: x2, y1: midY, x2, y2: y2 },
  ];
  return {
    path: buildPathFromSegments(segments),
    segments,
    x1,
    x2,
    midY,
    routeKind: "adjacent",
  };
}

export function layoutDecisionAlgorithm(spec) {
  const cfg = { ...DECISION_LAYOUT };
  const errors = [];
  const nodes = spec.nodes || [];
  const branches = spec.branches || [];
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const nodeIds = nodes.map((n) => n.id);

  const boxes = new Map();
  for (const node of nodes) {
    const sized = sizeNode(node, cfg);
    if (!sized.ok) errors.push(...sized.errors);
    else boxes.set(node.id, sized.box);
  }
  if (errors.length) return { ok: false, errors, layout: null };

  const { layer } = assignLayers(nodeIds, branches);
  const rows = [];
  const maxLayer = Math.max(...layer.values(), 0);
  for (let l = 0; l <= maxLayer; l++) {
    rows[l] = nodeIds.filter((id) => layer.get(id) === l);
    rows[l].sort(
      (a, b) =>
        nodes.findIndex((n) => n.id === a) - nodes.findIndex((n) => n.id === b),
    );
  }

  let maxRowWidth = 0;
  const positions = new Map();
  let y = cfg.margin + cfg.titleBlock;
  for (const row of rows) {
    if (!row?.length) continue;
    const rowWidth =
      row.reduce((sum, id) => sum + boxes.get(id).width, 0) +
      cfg.nodeGapX * Math.max(0, row.length - 1);
    maxRowWidth = Math.max(maxRowWidth, rowWidth);
    let x = cfg.margin;
    for (const id of row) {
      const box = boxes.get(id);
      positions.set(id, { x, y, ...box });
      x += box.width + cfg.nodeGapX;
    }
    y += Math.max(...row.map((id) => boxes.get(id).height)) + cfg.layerGapY;
  }

  let width = Math.ceil(maxRowWidth + 2 * cfg.margin);

  for (const row of rows) {
    if (!row?.length) continue;
    const rowWidth =
      row.reduce((sum, id) => sum + boxes.get(id).width, 0) +
      cfg.nodeGapX * Math.max(0, row.length - 1);
    let x = (width - rowWidth) / 2;
    for (const id of row) {
      const pos = positions.get(id);
      pos.x = x;
      x += pos.width + cfg.nodeGapX;
    }
  }

  const nodeObstacles = [...positions.values()].map((n) => ({
    x: n.x,
    y: n.y,
    width: n.width,
    height: n.height,
  }));
  const posOf = (id) => positions.get(id);
  const placed = [];
  const laidEdges = branches.map((branch) => {
    const from = posOf(branch.from);
    const to = posOf(branch.to);
    const routed = edgePath(from, to, branch, layer, positions, cfg);
    const label = layoutBranchLabel(
      branch,
      cfg,
      routed.x1,
      routed.x2,
      routed.midY,
      placed,
      nodeObstacles,
      { preferX: routed.labelPreferX },
    );
    const edge = {
      ...branch,
      path: routed.path,
      segments: routed.segments,
      routeKind: routed.routeKind,
      ...label,
      fragments: [],
    };

    if (branch.threshold_fragment) {
      const fragAnchorX = (from.x + from.width + to.x) / 2;
      const fragAnchorY = Math.min(from.y, to.y) - 36;
      const fragBox = layoutFragmentBox(
        branch.threshold_fragment,
        cfg,
        fragAnchorX,
        fragAnchorY,
        placed,
        nodeObstacles,
      );
      placed.push({ x: fragBox.x, y: fragBox.y, width: fragBox.width, height: fragBox.height });
      edge.fragments = [fragBox];
    }

    return edge;
  });

  const titleWrap = wrapText(spec.question, width - 2 * cfg.margin, cfg.titleFontSize, cfg.titleFontWeight, {
    maxLines: 3,
  });
  const titleLines = titleWrap.ok ? titleWrap.lines : [spec.question];

  const annotations = (spec.annotations || []).map((ann, i) => {
    const wrap = wrapText(ann.label, width - 2 * cfg.margin, cfg.annotationFontSize, 400, { maxLines: 3 });
    const lines = wrap.ok ? wrap.lines : [ann.label];
    return { ...ann, id: ann.id || `ann-${i}`, lines };
  });

  let annBlockH = 0;
  for (const ann of annotations) {
    annBlockH += ann.lines.length * cfg.annotationLineHeight + 10;
  }
  annBlockH += cfg.minBottomMargin;

  let height = Math.ceil(y + annBlockH);
  let annY = height - annBlockH + cfg.annotationFontSize;
  for (const ann of annotations) {
    ann.x = cfg.margin;
    ann.y = annY;
    annY += ann.lines.length * cfg.annotationLineHeight + 10;
  }

  // Expand canvas if labels/fragments exceed current bounds
  let minX = cfg.margin;
  let minY = cfg.margin + cfg.titleBlock;
  let maxX = width - cfg.margin;
  let maxY = height - cfg.margin;
  for (const node of positions.values()) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);
  }
  for (const edge of laidEdges) {
    for (const box of edge.labelBoxes || []) {
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    }
    for (const frag of edge.fragments || []) {
      minX = Math.min(minX, frag.x);
      minY = Math.min(minY, frag.y);
      maxX = Math.max(maxX, frag.x + frag.width);
      maxY = Math.max(maxY, frag.y + frag.height);
    }
    for (const seg of edge.segments || []) {
      minX = Math.min(minX, seg.x1, seg.x2);
      minY = Math.min(minY, seg.y1, seg.y2);
      maxX = Math.max(maxX, seg.x1, seg.x2);
      maxY = Math.max(maxY, seg.y1, seg.y2);
    }
  }

  const padLeft = Math.max(0, cfg.margin - minX);
  const padTop = Math.max(0, cfg.margin + cfg.titleBlock - minY);
  const padRight = Math.max(0, maxX + cfg.margin - width);
  const padBottom = Math.max(0, maxY + cfg.margin - height);
  if (padLeft || padTop || padRight || padBottom) {
    width += padLeft + padRight;
    height += padTop + padBottom;
    for (const node of positions.values()) {
      node.x += padLeft;
      node.y += padTop;
    }
    for (const ann of annotations) {
      ann.y += padTop + padBottom;
    }
    for (const edge of laidEdges) {
      for (const box of edge.labelBoxes || []) {
        box.x += padLeft;
        box.y += padTop;
      }
      for (const frag of edge.fragments || []) {
        frag.x += padLeft;
        frag.y += padTop;
      }
    }
    for (const edge of laidEdges) {
      const routed = edgePath(posOf(edge.from), posOf(edge.to), edge, layer, positions, cfg);
      edge.path = routed.path;
      edge.segments = routed.segments;
      edge.routeKind = routed.routeKind;
    }
  }

  width = Math.ceil(width);
  height = Math.ceil(height);

  return {
    ok: true,
    errors: [],
    layout: {
      config: cfg,
      width,
      height,
      nodes: [...positions.values()],
      edges: laidEdges,
      nodeById,
      annotations,
      titleLines,
    },
  };
}

function markerDef() {
  return (
    `    <marker id="vg-arrow-decision" markerWidth="7" markerHeight="7" refX="7" refY="3.5" ` +
    `orient="auto" markerUnits="strokeWidth">\n` +
    `      <path d="M0,0.5 L7,3.5 L0,6.5 Z" fill="${TOKENS.connector}"/>\n    </marker>`
  );
}

export function renderDecisionAlgorithmSvg(spec, layout) {
  const cfg = layout.config;
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" ` +
      `width="${layout.width}" height="${layout.height}" role="img" ` +
      `aria-labelledby="vg-title vg-desc" data-primitive="${escapeXml(spec.primitive)}" ` +
      `data-element="${escapeXml(spec.element)}" data-variant="${escapeXml(spec.variant)}">`,
  );
  parts.push(`  <title id="vg-title">${escapeXml(spec.question)}</title>`);
  parts.push(`  <desc id="vg-desc">${escapeXml(spec.primitive)} ${escapeXml(spec.variant)}</desc>`);
  parts.push("  <defs>");
  parts.push(markerDef());
  parts.push("    <style>");
  parts.push(
    `      .vg-title{font-family:${TOKENS.fontStack};font-size:${cfg.titleFontSize}px;font-weight:${cfg.titleFontWeight};fill:${TOKENS.titleText}}`,
  );
  parts.push(
    `      .vg-label{font-family:${TOKENS.fontStack};font-size:${cfg.fontSize}px;font-weight:${cfg.fontWeight};fill:${TOKENS.nodeText}}`,
  );
  parts.push(
    `      .vg-sub{font-family:${TOKENS.fontStack};font-size:${cfg.subitemFontSize}px;fill:${TOKENS.nodeText}}`,
  );
  parts.push(
    `      .vg-branch{font-family:${TOKENS.fontStack};font-size:${cfg.branchLabelFontSize}px;fill:${TOKENS.titleText}}`,
  );
  parts.push(
    `      .vg-ann{font-family:${TOKENS.fontStack};font-size:${cfg.annotationFontSize}px;fill:#6b7280}`,
  );
  parts.push("    </style>");
  parts.push("  </defs>");
  parts.push(`  <rect width="${layout.width}" height="${layout.height}" fill="${TOKENS.canvas}"/>`);

  const cx = layout.width / 2;
  parts.push(`  <text x="${cx}" y="36" text-anchor="middle" class="vg-title">`);
  layout.titleLines.forEach((line, i) => {
    parts.push(
      `    <tspan x="${cx}" dy="${i === 0 ? 0 : cfg.titleLineHeight}">${escapeXml(line)}</tspan>`,
    );
  });
  parts.push("  </text>");

  parts.push('  <g data-layer="branches">');
  for (const edge of layout.edges) {
    parts.push(
      `    <path d="${edge.path}" fill="none" stroke="${TOKENS.connector}" stroke-width="2" ` +
        `marker-end="url(#vg-arrow-decision)"/>`,
    );
    for (const box of edge.labelBoxes || []) {
      parts.push(`    <g data-branch-label="${escapeXml(edge.id || "")}">`);
      parts.push(
        `    <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="#ffffff" opacity="0.92" rx="4"/>`,
      );
      parts.push(
        `    <text x="${edge.labelX}" y="${edge.labelY}" text-anchor="middle" class="vg-branch">`,
      );
      edge.labelLines.forEach((line, i) => {
        parts.push(
          `      <tspan x="${edge.labelX}" dy="${i === 0 ? 0 : cfg.branchLabelLineHeight}">${escapeXml(line)}</tspan>`,
        );
      });
      parts.push("    </text>");
      parts.push("    </g>");
    }

    for (const frag of edge.fragments || []) {
      parts.push(
        `    <g data-fragment="threshold-scale"><rect x="${frag.x}" y="${frag.y}" width="${frag.width}" height="${frag.height}" ` +
          `rx="6" fill="#f9fafb" stroke="#e5e7eb"/>`,
      );
      let fy = frag.y + cfg.fragmentPadding + cfg.fragmentFontSize;
      for (const line of frag.lines) {
        parts.push(
          `    <text x="${frag.x + cfg.fragmentPadding}" y="${fy}" class="vg-sub">${escapeXml(line)}</text>`,
        );
        fy += cfg.fragmentLineHeight;
      }
      parts.push("    </g>");
    }
  }
  parts.push("  </g>");

  parts.push('  <g data-layer="nodes">');
  for (const box of layout.nodes) {
    const node = layout.nodeById.get(box.id);
    const style = NODE_STYLES[node.kind] || NODE_STYLES.entry;
    parts.push(`    <g data-node-id="${escapeXml(box.id)}" data-node-kind="${escapeXml(node.kind)}">`);
    parts.push(
      `      <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="${cfg.cornerRadius}" ` +
        `fill="${style.fill}" stroke="${style.stroke}" stroke-width="${style.strokeWidth}"` +
        (style.dash ? ` stroke-dasharray="${style.dash}"` : "") +
        "/>",
    );
    const textX = box.x + box.width / 2;
    let ty =
      box.y +
      box.height / 2 -
      ((box.lines.length + box.subLines.length) * cfg.lineHeight) / 2 +
      cfg.fontSize * 0.35;
    parts.push(`      <text x="${textX}" y="${ty}" text-anchor="middle" class="vg-label">`);
    box.lines.forEach((line, i) => {
      parts.push(
        `        <tspan x="${textX}" dy="${i === 0 ? 0 : cfg.lineHeight}">${escapeXml(line)}</tspan>`,
      );
    });
    parts.push("      </text>");
    if (box.subLines.length) {
      ty += box.lines.length * cfg.lineHeight + 4;
      parts.push(`      <text x="${box.x + cfg.nodePaddingX}" y="${ty}" class="vg-sub">`);
      box.subLines.forEach((line, i) => {
        parts.push(
          `          <tspan x="${box.x + cfg.nodePaddingX}" dy="${i === 0 ? 0 : cfg.subitemLineHeight}">${escapeXml(line)}</tspan>`,
        );
      });
      parts.push("      </text>");
    }
    parts.push("    </g>");
  }
  parts.push("  </g>");

  for (const ann of layout.annotations || []) {
    parts.push(`  <text x="${ann.x}" y="${ann.y}" class="vg-ann" data-placement="${escapeXml(ann.placement)}">`);
    ann.lines.forEach((line, i) => {
      parts.push(
        `    <tspan x="${ann.x}" dy="${i === 0 ? 0 : cfg.annotationLineHeight}">${escapeXml(line)}</tspan>`,
      );
    });
    parts.push("  </text>");
  }

  parts.push("</svg>");
  return parts.join("\n") + "\n";
}

export function renderDecisionAlgorithm(spec) {
  const laid = layoutDecisionAlgorithm(spec);
  if (!laid.ok) return { ok: false, errors: laid.errors, svg: null, layout: null };
  return {
    ok: true,
    errors: [],
    svg: renderDecisionAlgorithmSvg(spec, laid.layout),
    layout: laid.layout,
  };
}
