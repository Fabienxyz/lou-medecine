/**
 * Layout + SVG render for decision-algorithm primitive (generic).
 */

import { measureText, wrapText } from "./text-fit.js";
import { TOKENS, escapeXml } from "./visual-render.js";
import { officialTextId } from "./svg.js";
import {
  loadSvgGraphicLanguage,
  getDecisionNodeKindStyle,
  markerSvg,
} from "./svg-graphic-language.js";
import { roleGraphicVariantLabel } from "./role-graphic-language.js";
import {
  BRANCH_LABEL_ANCHORS,
  branchLabelAnchorMode,
  branchingPattern,
  calloutPlacementPriority,
  decisionLateralSeparationClass,
  diamondInternalPadding,
  isDecisionLateralFanOut,
  isVerticalDescentFanOut,
  nodeShape,
  requiresStrictTextContainment,
} from "./visual-grammar-runtime.js";

/** Maps qualitative VG diamond padding to measurable clearance (Theme-derived base × scale). VG §8.1 */
const DIAMOND_CLEARANCE = Object.freeze({
  generous: { widthScale: 1.32, heightScale: 1.42, minAspect: 1.15 },
  moderate: { widthScale: 1.2, heightScale: 1.25, minAspect: 1.1 },
});

/** Theme-derived layout metrics for VG composition rules (qualitative → measurable). */
function compositionLayoutMetrics(cfg) {
  const separationClass = decisionLateralSeparationClass();
  const decisionLateralMinDx =
    separationClass === "moderate" ? Math.round(cfg.nodeGapX * 0.44) : Math.round(cfg.nodeGapX * 0.3);
  return {
    decisionLateralMinDx,
    fanOutStubY: Math.max(cfg.nodePaddingY * 2, Math.round(cfg.layerGapY * 0.22)),
    calloutCorridorPad: Math.round(cfg.fragmentPadding * 1.2),
    calloutMinInnerWidth: Math.round(cfg.nodeMinWidth * 0.75),
  };
}

/** @deprecated use loadSvgGraphicLanguage().decisionAlgorithmLayout */
export function getDecisionAlgorithmLayout() {
  return loadSvgGraphicLanguage().decisionAlgorithmLayout;
}

export const DECISION_LAYOUT = new Proxy(
  {},
  {
    get(_target, prop) {
      return getDecisionAlgorithmLayout()[prop];
    },
  },
);

function decisionNodeStyle(kind) {
  return getDecisionNodeKindStyle(kind);
}

function nodeShapeMarkup(box, kind, style, cfg) {
  const dash = style.dash ? ` stroke-dasharray="${style.dash}"` : "";
  const strokeOpacity =
    style.groupOpacity != null && style.dash ? ` stroke-opacity="${Math.min(1, style.groupOpacity + 0.08)}"` : "";
  if (nodeShape(kind) === "diamond") {
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const points = `${cx},${box.y} ${box.x + box.width},${cy} ${cx},${box.y + box.height} ${box.x},${cy}`;
    return (
      `      <polygon points="${points}" fill="${style.fill}" stroke="${style.stroke}" ` +
      `stroke-width="${style.strokeWidth}"${dash}${strokeOpacity}/>`
    );
  }
  return (
    `      <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" rx="${cfg.cornerRadius}" ` +
    `fill="${style.fill}" stroke="${style.stroke}" stroke-width="${style.strokeWidth}"${dash}${strokeOpacity}/>`
  );
}

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

  if (requiresStrictTextContainment(node.kind)) {
    const paddingClass = diamondInternalPadding(node.kind) || "generous";
    const factors = DIAMOND_CLEARANCE[paddingClass] || DIAMOND_CLEARANCE.generous;
    let width = Math.min(
      cfg.nodeMaxWidth,
      Math.max(cfg.nodeMinWidth, Math.ceil(contentW + 2 * cfg.nodePaddingX)),
    );
    let height = Math.ceil(lines.lines.length * cfg.lineHeight + 2 * cfg.nodePaddingY);
    if (subLines.length) {
      height += 8 + subLines.length * cfg.subitemLineHeight;
    }
    width = Math.ceil(width * factors.widthScale);
    height = Math.ceil(height * factors.heightScale);
    if (width < height * factors.minAspect) {
      width = Math.ceil(height * factors.minAspect);
    }
    return {
      ok: true,
      box: {
        id: node.id,
        kind: node.kind,
        width,
        height,
        lines: lines.lines,
        subLines,
      },
    };
  }

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

function layoutCallout(frag, cfg, routed, labelBox, placed, obstacles) {
  const metrics = compositionLayoutMetrics(cfg);
  const scaleLines = (frag.scales || []).map((s) => `${s.analyte} ${s.cutoff_label}`);
  const allLines = [frag.context, ...scaleLines];
  const innerW = Math.max(
    ...allLines.map((l) => measureText(l, cfg.fragmentFontSize, 500)),
    metrics.calloutMinInnerWidth,
  );
  const width = Math.ceil(innerW + 2 * cfg.fragmentPadding);
  const height = Math.ceil(cfg.fragmentPadding * 2 + allLines.length * cfg.fragmentLineHeight);

  const corridorPad = metrics.calloutCorridorPad;
  const corridorObstacle = {
    x: Math.min(routed.x1, routed.x2) - corridorPad,
    y: routed.midY - corridorPad,
    width: Math.abs(routed.x2 - routed.x1) + corridorPad * 2,
    height: corridorPad * 2,
  };

  const labelCenterX = labelBox.x + labelBox.width / 2;
  const candidateMap = {
    "below-branch-label": {
      x: labelCenterX - width / 2,
      y: labelBox.y + labelBox.height + cfg.fragmentPadding,
    },
    "lateral-clear": {
      x: labelBox.x + labelBox.width + cfg.fragmentPadding,
      y: labelBox.y,
    },
    "below-corridor": {
      x: labelCenterX - width / 2,
      y: routed.midY + corridorPad + 4,
    },
  };

  const candidates = [];
  for (const key of calloutPlacementPriority()) {
    if (candidateMap[key]) candidates.push(candidateMap[key]);
  }
  candidates.push({
    x: labelBox.x - width - cfg.fragmentPadding,
    y: labelBox.y,
  });
  candidates.push({
    x: labelCenterX - width / 2,
    y: labelBox.y - height - cfg.fragmentPadding,
  });

  const blockers = [...obstacles, ...placed, corridorObstacle, labelBox];
  for (const c of candidates) {
    const box = { x: c.x, y: c.y, width, height };
    if (!blockers.some((o) => rectsOverlap(box, o, 6))) {
      return { ...box, lines: allLines };
    }
  }

  return {
    x: labelCenterX - width / 2,
    y: routed.midY + corridorPad + 4,
    width,
    height,
    lines: allLines,
  };
}

function rectsOverlap(a, b, pad = 2) {
  return (
    a.x < b.x + b.width + pad &&
    a.x + a.width + pad > b.x &&
    a.y < b.y + b.height + pad &&
    a.y + a.height + pad > b.y
  );
}

function rectsHorizontalOverlap(a, b, pad = 0) {
  return a.x < b.x + b.width + pad && a.x + a.width + pad > b.x;
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

  const isCorridor = options.preferX != null && options.corridorSide;
  const candidates = [];
  if (isCorridor) {
    const corridorX = options.preferX;
    const boxW = labelW + 8;
    for (const yOff of [0, -labelH - 6, labelH + 6]) {
      candidates.push({ x: corridorX - boxW / 2, y: midY - labelH / 2 + yOff });
    }
  } else if (options.preferX != null) {
    candidates.push({
      x: options.preferX - (labelW + 8) / 2,
      y: midY - labelH / 2,
    });
  }
  if (!isCorridor) {
    candidates.push(
      ...(options.preferX != null
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
          ]),
    );
  }

  let box = { x: candidates[0].x, y: candidates[0].y, width: labelW + 8, height: labelH };
  for (const c of candidates) {
    const candidate = { x: c.x, y: c.y, width: labelW + 8, height: labelH };
    const relevantObstacles = isCorridor
      ? obstacles.filter((o) => rectsHorizontalOverlap(candidate, o, 4))
      : obstacles;
    const blocked =
      placed.some((p) => rectsOverlap(candidate, p, 4)) ||
      relevantObstacles.some((p) => rectsOverlap(candidate, p, 4));
    if (!blocked) {
      box = candidate;
      break;
    }
  }
  placed.push(box);

  return {
    labelX: box.x + box.width / 2,
    labelY: box.y + cfg.branchLabelFontSize + 5,
    labelLines: lines,
    labelBoxes: [box],
  };
}

function relayoutEdgeLabels(laidEdges, positions, layer, nodeById, cfg, outgoingCounts) {
  const placed = [];
  const nodeObstacles = [...positions.values()].map((n) => ({
    x: n.x,
    y: n.y,
    width: n.width,
    height: n.height,
  }));
  const posOf = (id) => positions.get(id);

  for (const edge of laidEdges) {
    const from = posOf(edge.from);
    const to = posOf(edge.to);
    const outCount = outgoingCounts.get(edge.from) || 1;
    const routed = edgePath(from, to, edge, layer, positions, cfg, nodeById, outCount);
    edge.path = routed.path;
    edge.segments = routed.segments;
    edge.routeKind = routed.routeKind;
    const fromKind = nodeById.get(edge.from)?.kind;
    const pattern = branchingPattern(fromKind, outCount);
    const labelOpts = { preferX: routed.labelPreferX, corridorSide: routed.corridorSide };
    if (branchLabelAnchorMode(pattern) === BRANCH_LABEL_ANCHORS.TARGET_CENTER) {
      labelOpts.preferX = to.x + to.width / 2;
    }
    const label = layoutBranchLabel(
      edge,
      cfg,
      routed.x1,
      routed.x2,
      routed.midY,
      placed,
      nodeObstacles,
      labelOpts,
    );
    Object.assign(edge, label);
  }
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

function routeDecisionLateral(from, to, side, cfg) {
  const y1 = from.y + from.height;
  const y2 = to.y;
  const midY = y1 + Math.max(28, (y2 - y1) * 0.42);
  const exitX = side === "left" ? from.x : from.x + from.width;
  const enterX = to.x + to.width / 2;

  const segments = [
    { x1: exitX, y1, x2: exitX, y2: midY },
    { x1: exitX, y1: midY, x2: enterX, y2: midY },
    { x1: enterX, y1: midY, x2: enterX, y2: y2 },
  ];

  return {
    path: buildPathFromSegments(segments),
    segments,
    x1: exitX,
    x2: enterX,
    midY,
    labelPreferX: (exitX + enterX) / 2,
    routeKind: "decision-lateral",
  };
}

function routeResumeMonitoring(from, to, positions, cfg) {
  const pad = cfg.lateralCorridorPad;
  const blockMaxX = Math.max(...[...positions.values()].map((n) => n.x + n.width));
  const corridorX = blockMaxX + pad;
  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height;
  const x2 = to.x + to.width / 2;
  const y2 = to.y;
  const stubY = y1 + 20;
  const approachY = y2 - 14;

  const segments = [
    { x1, y1, x2: x1, y2: stubY },
    { x1, y1: stubY, x2: corridorX, y2: stubY },
    { x1: corridorX, y1: stubY, x2: corridorX, y2: approachY },
    { x1: corridorX, y1: approachY, x2: x2, y2: approachY },
    { x1: x2, y1: approachY, x2, y2: y2 },
  ];

  return {
    path: buildPathFromSegments(segments),
    segments,
    x1,
    x2,
    midY: (stubY + approachY) / 2,
    labelPreferX: corridorX,
    routeKind: "resume-monitoring",
  };
}

function routeBackwardLoop(from, to, positions, cfg) {
  const pad = cfg.lateralCorridorPad;
  const blockMinX = Math.min(...[...positions.values()].map((n) => n.x));
  const blockMaxX = Math.max(...[...positions.values()].map((n) => n.x + n.width));
  const corridorX = blockMinX - pad;
  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height;
  const x2 = to.x + to.width / 2;
  const y2 = to.y;
  const stubY = y1 + 18;
  const approachY = y2 - 12;

  const segments = [
    { x1, y1, x2: x1, y2: stubY },
    { x1, y1: stubY, x2: corridorX, y2: stubY },
    { x1: corridorX, y1: stubY, x2: corridorX, y2: approachY },
    { x1: corridorX, y1: approachY, x2: x2, y2: approachY },
    { x1: x2, y1: approachY, x2, y2: y2 },
  ];

  return {
    path: buildPathFromSegments(segments),
    segments,
    x1,
    x2,
    midY: (stubY + approachY) / 2,
    labelPreferX: corridorX,
    routeKind: "backward-loop",
  };
}

function routeSkipLevel(from, to, intermediate, cfg) {
  const pad = cfg.lateralCorridorPad;
  const blockMinX = Math.min(from.x, ...intermediate.map((n) => n.x));
  const blockMaxX = Math.max(from.x + from.width, ...intermediate.map((n) => n.x + n.width));
  const sourceCx = from.x + from.width / 2;
  const targetCx = to.x + to.width / 2;

  const routeRight = targetCx >= sourceCx;
  const labelHalf = (cfg.branchLabelMaxWidth || 180) / 2 + 12;
  const corridorX = routeRight ? blockMaxX + pad + labelHalf : blockMinX - pad - labelHalf;
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
    corridorSide: routeRight ? "right" : "left",
    routeKind: "skip-level",
  };
}

function routeFanOut(from, to, cfg) {
  const metrics = compositionLayoutMetrics(cfg);
  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height;
  const x2 = to.x + to.width / 2;
  const y2 = to.y;
  const splitY = y1 + metrics.fanOutStubY;
  const segments = [
    { x1, y1, x2: x1, y2: splitY },
    { x1, y1: splitY, x2, y2: splitY },
    { x1: x2, y1: splitY, x2, y2: y2 },
  ];
  return {
    path: buildPathFromSegments(segments),
    segments,
    x1,
    x2,
    midY: splitY,
    routeKind: "fan-out",
  };
}

function edgePath(from, to, branch, layer, positions, cfg, nodeById, outgoingCount = 1) {
  const fromLayer = layer.get(branch.from);
  const toLayer = layer.get(branch.to);
  const layerGap = toLayer - fromLayer;

  if (branch.relation === "resumes_monitoring") {
    return routeResumeMonitoring(from, to, positions, cfg);
  }

  if (toLayer < fromLayer) {
    return routeBackwardLoop(from, to, positions, cfg);
  }

  if (layerGap > 1) {
    const intermediate = getIntermediateNodes(branch.from, branch.to, layer, positions);
    return routeSkipLevel(from, to, intermediate, cfg);
  }

  const x1 = from.x + from.width / 2;
  const y1 = from.y + from.height;
  const x2 = to.x + to.width / 2;
  const y2 = to.y;

  const fromNode = nodeById?.get(branch.from);
  const pattern = branchingPattern(fromNode?.kind, outgoingCount);

  if (isVerticalDescentFanOut(pattern) && layerGap === 1) {
    return routeFanOut(from, to, cfg);
  }

  if (isDecisionLateralFanOut(pattern) && layerGap === 1) {
    const metrics = compositionLayoutMetrics(cfg);
    const targetCx = to.x + to.width / 2;
    const sourceCx = from.x + from.width / 2;
    if (Math.abs(targetCx - sourceCx) > metrics.decisionLateralMinDx) {
      return routeDecisionLateral(from, to, targetCx < sourceCx ? "left" : "right", cfg);
    }
  }

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
  const cfg = { ...getDecisionAlgorithmLayout() };
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
  const outgoingCounts = new Map();
  for (const branch of branches) {
    outgoingCounts.set(branch.from, (outgoingCounts.get(branch.from) || 0) + 1);
  }
  const laidEdges = branches.map((branch) => {
    const from = posOf(branch.from);
    const to = posOf(branch.to);
    const outCount = outgoingCounts.get(branch.from) || 1;
    const routed = edgePath(from, to, branch, layer, positions, cfg, nodeById, outCount);
    const fromKind = nodeById.get(branch.from)?.kind;
    const pattern = branchingPattern(fromKind, outCount);
    const labelOpts = { preferX: routed.labelPreferX, corridorSide: routed.corridorSide };
    if (branchLabelAnchorMode(pattern) === BRANCH_LABEL_ANCHORS.TARGET_CENTER) {
      labelOpts.preferX = to.x + to.width / 2;
    }
    const label = layoutBranchLabel(
      branch,
      cfg,
      routed.x1,
      routed.x2,
      routed.midY,
      placed,
      nodeObstacles,
      labelOpts,
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
      const labelBox = edge.labelBoxes[0];
      const fragBox = layoutCallout(
        branch.threshold_fragment,
        cfg,
        routed,
        labelBox,
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
      for (const frag of edge.fragments || []) {
        frag.x += padLeft;
        frag.y += padTop;
      }
    }
    relayoutEdgeLabels(laidEdges, positions, layer, nodeById, cfg, outgoingCounts);
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
  return `    ${markerSvg("arrow_solid", loadSvgGraphicLanguage(), { id: "vg-arrow-decision", markerUnits: "strokeWidth" })}`;
}

export function renderDecisionAlgorithmSvg(spec, layout) {
  const cfg = layout.config;
  const lang = loadSvgGraphicLanguage();
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  const roleGl = roleGraphicVariantLabel();
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" ` +
      `width="${layout.width}" height="${layout.height}" role="img" ` +
      `aria-labelledby="vg-title vg-desc" data-primitive="${escapeXml(spec.primitive)}" ` +
      `data-element="${escapeXml(spec.element)}" data-variant="${escapeXml(spec.variant)}"` +
      `${roleGl ? ` data-role-gl-variant="${roleGl}"` : ""}>`,
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
    `      .vg-ann{font-family:${TOKENS.fontStack};font-size:${cfg.annotationFontSize}px;fill:${lang.typography.annotation.color}}`,
  );
  parts.push("    </style>");
  parts.push("  </defs>");
  parts.push(`  <rect width="${layout.width}" height="${layout.height}" fill="${TOKENS.canvas}"/>`);

  const cx = layout.width / 2;
  parts.push(`  <text x="${cx}" y="36" text-anchor="middle" class="vg-title" data-official-text-id="${escapeXml(officialTextId(spec.element, "title"))}">`);
  layout.titleLines.forEach((line, i) => {
    parts.push(
      `    <tspan x="${cx}" dy="${i === 0 ? 0 : cfg.titleLineHeight}">${escapeXml(line)}</tspan>`,
    );
  });
  parts.push("  </text>");

  parts.push('  <g data-layer="branches">');
  for (const edge of layout.edges) {
    const dash = edge.relation === "resumes_monitoring" ? ` stroke-dasharray="8 5"` : "";
    parts.push(
      `    <path data-branch-id="${escapeXml(edge.id || "")}" d="${edge.path}" fill="none" ` +
        `stroke="${TOKENS.connector}" stroke-width="${lang.stroke.connector_decision}"${dash} marker-end="url(#vg-arrow-decision)"/>`,
    );
    for (const box of edge.labelBoxes || []) {
      parts.push(`    <g data-branch-label="${escapeXml(edge.id || "")}">`);
      parts.push(
        `    <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" fill="${lang.colors.branch_label_backdrop}" opacity="${lang.opacity.branch_label_backdrop}" rx="${lang.radius.branch_label}"/>`,
      );
      parts.push(
        `    <text x="${edge.labelX}" y="${edge.labelY}" text-anchor="middle" class="vg-branch" data-official-text-id="${escapeXml(officialTextId(spec.element, `branch-${edge.id || "edge"}-label`))}">`,
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
          `rx="${cfg.fragmentRadius}" fill="${lang.colors.surface_muted}" stroke="${lang.colors.rule_light}"/>`,
      );
      let fy = frag.y + cfg.fragmentPadding + cfg.fragmentFontSize;
      let lineIndex = 0;
      for (const line of frag.lines) {
        lineIndex += 1;
        parts.push(
          `    <text x="${frag.x + cfg.fragmentPadding}" y="${fy}" class="vg-sub" data-official-text-id="${escapeXml(officialTextId(spec.element, `frag-${edge.id || "edge"}-${lineIndex}`))}">${escapeXml(line)}</text>`,
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
    const style = decisionNodeStyle(node.kind);
    parts.push(`    <g data-node-id="${escapeXml(box.id)}" data-node-kind="${escapeXml(node.kind)}"${style.groupOpacity != null ? ` opacity="${style.groupOpacity}"` : ""}>`);
    parts.push(nodeShapeMarkup(box, node.kind, style, cfg));
    const textX = box.x + box.width / 2;
    let ty =
      box.y +
      box.height / 2 -
      ((box.lines.length + box.subLines.length) * cfg.lineHeight) / 2 +
      cfg.fontSize * 0.35;
    parts.push(`      <text x="${textX}" y="${ty}" text-anchor="middle" class="vg-label" data-official-text-id="${escapeXml(officialTextId(spec.element, `node-${box.id}-label`))}">`);
    box.lines.forEach((line, i) => {
      parts.push(
        `        <tspan x="${textX}" dy="${i === 0 ? 0 : cfg.lineHeight}">${escapeXml(line)}</tspan>`,
      );
    });
    parts.push("      </text>");
    if (box.subLines.length) {
      ty += box.lines.length * cfg.lineHeight + 4;
      parts.push(`      <text x="${box.x + cfg.nodePaddingX}" y="${ty}" class="vg-sub" data-official-text-id="${escapeXml(officialTextId(spec.element, `node-${box.id}-sub`))}">`);
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
    parts.push(`  <text x="${ann.x}" y="${ann.y}" class="vg-ann" data-placement="${escapeXml(ann.placement)}" data-official-text-id="${escapeXml(officialTextId(spec.element, `ann-${ann.id}`))}">`);
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
