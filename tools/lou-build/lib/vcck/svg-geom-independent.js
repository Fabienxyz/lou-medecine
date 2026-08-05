/**
 * Independent SVG geometry validation — consumes serialized SVG only, never layout.
 */

import { samplePathSegments } from "../svg-causal-validate.js";
import { segmentIntersectsRectInterior } from "../svg-edge-validate.js";
import { validateSvgSerialized } from "../svg-dimension-validate.js";
import { segmentsIntersect, GEOM_PARAM_EPS, GEOM_AXIS_EPS, isQuasiVertical, isQuasiHorizontal } from "./geom-segments.js";

export const CURVE_SAMPLE_STEPS = 32;

export const GEOM_ERROR = Object.freeze({
  X_CROSS: "cross (X intersection)",
  NODE_INTERIOR: "intersects node interior",
});

function parseFloatAttr(el, name, fallback = 0) {
  const v = parseFloat(el.getAttribute(name));
  return Number.isFinite(v) ? v : fallback;
}

export function extractNodeBoxesFromSvg(svgText) {
  const nodes = [];
  const re =
    /<g[^>]*data-node-id="([^"]+)"[^>]*>[\s\S]*?<rect[^>]*x="([^"]+)"[^>]*y="([^"]+)"[^>]*width="([^"]+)"[^>]*height="([^"]+)"/g;
  let m;
  while ((m = re.exec(svgText)) !== null) {
    nodes.push({
      id: m[1],
      x: parseFloat(m[2]),
      y: parseFloat(m[3]),
      width: parseFloat(m[4]),
      height: parseFloat(m[5]),
    });
  }
  return nodes;
}

export function extractEdgePathsFromSvg(svgText) {
  const edges = [];
  const re = /<path\b[^>]*>/g;
  let m;
  while ((m = re.exec(svgText)) !== null) {
    const tag = m[0];
    const path = tag.match(/\bd="([^"]+)"/)?.[1];
    if (!path) continue;
    const id = tag.match(/data-edge-id="([^"]+)"/)?.[1];
    edges.push({ id: id || `path-${edges.length}`, path });
  }
  if (edges.length === 0) {
    const fallback = /<path[^>]*marker-end[^>]*d="([^"]+)"/g;
    let i = 0;
    while ((m = fallback.exec(svgText)) !== null) {
      edges.push({ id: `path-${i++}`, path: m[1] });
    }
  }
  return edges;
}

export { segmentsIntersect };

/**
 * Validate geometry from SVG string alone — no renderer layout object.
 */
export function validateSvgGeometryIndependent(svgText, options = {}) {
  const errors = [];
  const steps = options.curveSteps ?? CURVE_SAMPLE_STEPS;

  const ser = validateSvgSerialized(svgText);
  if (!ser.ok) return { ok: false, errors: ser.errors, source: "serialized" };

  const nodes = extractNodeBoxesFromSvg(svgText);
  const edgePaths = extractEdgePathsFromSvg(svgText);

  if (nodes.length === 0) {
    errors.push("independent geom: no data-node-id boxes found in SVG");
  }

  const allSegments = [];
  for (const edge of edgePaths) {
    const segments = samplePathSegments(edge.path, steps);
    if (!segments.length) {
      errors.push(`independent geom: edge ${edge.id} produced zero segments`);
      continue;
    }
    for (const seg of segments) {
      allSegments.push({ edgeId: edge.id, seg });
      for (const node of nodes) {
        if (segmentIntersectsRectInterior(seg, node)) {
          errors.push(`independent geom: edge ${edge.id} intersects node ${node.id} interior`);
        }
      }
    }
  }

  for (let i = 0; i < allSegments.length; i++) {
    for (let j = i + 1; j < allSegments.length; j++) {
      const a = allSegments[i];
      const b = allSegments[j];
      if (a.edgeId === b.edgeId) continue;
      if (segmentsIntersect(a.seg, b.seg)) {
        errors.push(`independent geom: edges ${a.edgeId} and ${b.edgeId} cross (X intersection)`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: { nodeCount: nodes.length, edgeCount: edgePaths.length, curveSteps: steps },
  };
}

/** Mutant: two diagonal edges crossing in X — endpoints cleared from node boxes. */
export const MUTANT_DIAGONAL_X_CROSS = {
  id: "diagonal-x-cross",
  expectedErrors: [GEOM_ERROR.X_CROSS],
  svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" width="400" height="200">
  <g data-node-id="a"><rect x="8" y="82" width="24" height="24" rx="4"/></g>
  <g data-node-id="b"><rect x="368" y="82" width="24" height="24" rx="4"/></g>
  <path data-edge-id="e1" d="M 50 40 L 350 160" marker-end="url(#m)"/>
  <path data-edge-id="e2" d="M 50 160 L 350 40" marker-end="url(#m)"/>
</svg>`,
};

/** Mutant: vertical segment through intermediate node — terminals on boundary only. */
export const MUTANT_DIAGONAL_THROUGH_NODE = {
  id: "diagonal-through-node",
  expectedErrors: [`independent geom: edge e1 intersects node mid interior`],
  targetNodeId: "mid",
  svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 260" width="240" height="260">
  <g data-node-id="start"><rect x="90" y="20" width="40" height="40" rx="4"/></g>
  <g data-node-id="mid"><rect x="70" y="110" width="80" height="40" rx="4"/></g>
  <g data-node-id="end"><rect x="90" y="200" width="40" height="40" rx="4"/></g>
  <path data-edge-id="e1" d="M 110 60 L 110 200" marker-end="url(#m)"/>
</svg>`,
};

/** Quasi-vertical route mutant — dx=0.5 must still intersect rect interior when crossing. */
export const MUTANT_QUASI_VERTICAL_ROUTE = {
  id: "quasi-vertical-route",
  expectedErrors: [`independent geom: edge e1 intersects node mid interior`],
  svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <g data-node-id="mid"><rect x="80" y="80" width="40" height="40" rx="4"/></g>
  <path data-edge-id="e1" d="M 100.5 20 L 100 180" marker-end="url(#m)"/>
</svg>`,
};

function endpointOnNodeBox(seg, node, eps = GEOM_PARAM_EPS) {
  const pts = [
    { x: seg.x1, y: seg.y1 },
    { x: seg.x2, y: seg.y2 },
  ];
  for (const p of pts) {
    const on =
      p.x >= node.x - eps &&
      p.x <= node.x + node.width + eps &&
      p.y >= node.y - eps &&
      p.y <= node.y + node.height + eps;
    if (on) return true;
  }
  return false;
}

export function validateMutantFixtures() {
  const mutants = [MUTANT_DIAGONAL_THROUGH_NODE, MUTANT_DIAGONAL_X_CROSS, MUTANT_QUASI_VERTICAL_ROUTE];
  const results = [];
  for (const m of mutants) {
    const v = validateSvgGeometryIndependent(m.svg);
    const matched = (m.expectedErrors || []).every((exp) =>
      v.errors.some((e) => e.includes(exp) || e === exp),
    );
    const unexpected = v.errors.filter(
      (e) => !(m.expectedErrors || []).some((exp) => e.includes(exp) || e === exp),
    );
    const foreignOnly = unexpected.length > 0;

    let endpointOnlyFailure = false;
    if (m.targetNodeId && v.errors.length) {
      const nodes = extractNodeBoxesFromSvg(m.svg);
      const target = nodes.find((n) => n.id === m.targetNodeId);
      const edges = extractEdgePathsFromSvg(m.svg);
      if (target && edges[0]) {
        const segs = samplePathSegments(edges[0].path, CURVE_SAMPLE_STEPS);
        endpointOnlyFailure =
          v.errors.some((e) => e.includes("intersects node")) &&
          segs.every((seg) => endpointOnNodeBox(seg, target));
      }
    }

    results.push({
      id: m.id,
      failedAsExpected: !v.ok && matched && !foreignOnly && !endpointOnlyFailure,
      errors: v.errors,
      expectedErrors: m.expectedErrors,
      endpointOnlyFailure,
    });
  }
  return {
    ok: results.every((r) => r.failedAsExpected),
    results,
  };
}

export function segmentIntersectsRectPlan(seg, rect, axisEps = GEOM_AXIS_EPS) {
  const inset = GEOM_PARAM_EPS;
  const left = rect.x + inset;
  const right = rect.x + rect.width - inset;
  const top = rect.y + inset;
  const bottom = rect.y + rect.height - inset;
  const { x1, y1, x2, y2 } = seg;

  if (isQuasiVertical(seg, axisEps)) {
    const x = (x1 + x2) / 2;
    if (x < left || x > right) return false;
    return Math.max(y1, y2) > top && Math.min(y1, y2) < bottom;
  }
  if (isQuasiHorizontal(seg, axisEps)) {
    const y = (y1 + y2) / 2;
    if (y < top || y > bottom) return false;
    return Math.max(x1, x2) > left && Math.min(x1, x2) < right;
  }
  return false;
}
