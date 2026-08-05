/**
 * Causal-graph geometry and SVG validation — edge/path vs node bounds.
 */

import { segmentIntersectsRectInterior, pointOnRectBoundary } from "./svg-edge-validate.js";
import { validateSvgSerialized, validateLayoutDimensions } from "./svg-dimension-validate.js";

const RELATION_MARKERS = {
  causes: "vg-arrow-solid",
  transmits: "vg-arrow-flow",
  feeds_back: "vg-arrow-accent",
  contributes_to: "vg-arrow-solid",
  triggers_response: "vg-arrow-solid",
};

const RELATION_LABEL_REQUIRED = new Set(["contributes_to", "triggers_response"]);
const FORBIDDEN_ABSTRACT_MARKERS = ["vg-arrow-contribute", "vg-arrow-response"];

function rectsOverlap(a, b, pad = 2) {
  return (
    a.x < b.x + b.width + pad &&
    a.x + a.width + pad > b.x &&
    a.y < b.y + b.height + pad &&
    a.y + a.height + pad > b.y
  );
}

/** Sample an SVG path into short segments for intersection tests. */
export function samplePathSegments(pathD, steps = 24) {
  const tokens = String(pathD || "")
    .trim()
    .match(/[MLCQ]|-?\d*\.?\d+/g);
  if (!tokens?.length) return [];

  const points = [];
  let i = 0;
  let cx = 0;
  let cy = 0;

  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === "M") {
      cx = parseFloat(tokens[i++]);
      cy = parseFloat(tokens[i++]);
      points.push({ x: cx, y: cy });
    } else if (cmd === "L") {
      cx = parseFloat(tokens[i++]);
      cy = parseFloat(tokens[i++]);
      points.push({ x: cx, y: cy });
    } else if (cmd === "C") {
      const x1 = parseFloat(tokens[i++]);
      const y1 = parseFloat(tokens[i++]);
      const x2 = parseFloat(tokens[i++]);
      const y2 = parseFloat(tokens[i++]);
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      for (let t = 1; t <= steps; t++) {
        const u = t / steps;
        const mt = 1 - u;
        points.push({
          x: mt * mt * mt * cx + 3 * mt * mt * u * x1 + 3 * mt * u * u * x2 + u * u * u * x,
          y: mt * mt * mt * cy + 3 * mt * mt * u * y1 + 3 * mt * u * u * y2 + u * u * u * y,
        });
      }
      cx = x;
      cy = y;
    } else if (cmd === "Q") {
      const x1 = parseFloat(tokens[i++]);
      const y1 = parseFloat(tokens[i++]);
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      for (let t = 1; t <= steps; t++) {
        const u = t / steps;
        const mt = 1 - u;
        points.push({
          x: mt * mt * cx + 2 * mt * u * x1 + u * u * x,
          y: mt * mt * cy + 2 * mt * u * y1 + u * u * y,
        });
      }
      cx = x;
      cy = y;
    }
  }

  const segments = [];
  for (let j = 1; j < points.length; j++) {
    segments.push({
      x1: points[j - 1].x,
      y1: points[j - 1].y,
      x2: points[j].x,
      y2: points[j].y,
    });
  }
  return segments;
}

function segmentsCollinearOverlap(a, b, eps = 1) {
  const aVert = Math.abs(a.x1 - a.x2) < eps;
  const bVert = Math.abs(b.x1 - b.x2) < eps;
  if (aVert && bVert && Math.abs(a.x1 - b.x1) < eps) {
    const overlap =
      Math.min(Math.max(a.y1, a.y2), Math.max(b.y1, b.y2)) -
      Math.max(Math.min(a.y1, a.y2), Math.min(b.y1, b.y2));
    if (overlap > 8) return true;
  }
  const aHoriz = Math.abs(a.y1 - a.y2) < eps;
  const bHoriz = Math.abs(b.y1 - b.y2) < eps;
  if (aHoriz && bHoriz && Math.abs(a.y1 - b.y1) < eps) {
    const overlap =
      Math.min(Math.max(a.x1, a.x2), Math.max(b.x1, b.x2)) -
      Math.max(Math.min(a.x1, a.x2), Math.min(b.x1, b.x2));
    if (overlap > 8) return true;
  }
  return false;
}

function segmentsIntersect(a, b, eps = 1) {
  const ax1 = Math.min(a.x1, a.x2) - eps;
  const ax2 = Math.max(a.x1, a.x2) + eps;
  const ay1 = Math.min(a.y1, a.y2) - eps;
  const ay2 = Math.max(a.y1, a.y2) + eps;
  const bx1 = Math.min(b.x1, b.x2) - eps;
  const bx2 = Math.max(b.x1, b.x2) + eps;
  const by1 = Math.min(b.y1, b.y2) - eps;
  const by2 = Math.max(b.y1, b.y2) + eps;
  if (ax2 < bx1 || bx2 < ax1 || ay2 < by1 || by2 < ay1) return false;
  const overlapX = Math.min(ax2, bx2) - Math.max(ax1, bx1);
  const overlapY = Math.min(ay2, by2) - Math.max(ay1, by1);
  return overlapX > 4 && overlapY > 4;
}

export function validateCausalGeometry(layout, options = {}) {
  const errors = [];
  const margin = options.margin ?? 4;
  const dim = validateLayoutDimensions({
    width: layout.width,
    height: layout.height,
    nodes: layout.nodes,
    edges: layout.edges,
  });
  if (!dim.ok) errors.push(...dim.errors);

  for (let i = 0; i < (layout.nodes || []).length; i++) {
    for (let j = i + 1; j < layout.nodes.length; j++) {
      if (rectsOverlap(layout.nodes[i], layout.nodes[j])) {
        errors.push(`collision: nodes ${layout.nodes[i].id} and ${layout.nodes[j].id}`);
      }
    }
  }

  const nodeMap = new Map((layout.nodes || []).map((n) => [n.id, n]));

  for (const edge of layout.edges || []) {
    const segments = edge.segments?.length ? edge.segments : samplePathSegments(edge.path);
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) continue;

    if (segments.length) {
      const first = segments[0];
      const last = segments[segments.length - 1];
      if (!pointOnRectBoundary(first.x1, first.y1, fromNode)) {
        errors.push(`edge ${edge.from}->${edge.to}: path does not exit source node ${edge.from}`);
      }
      if (!pointOnRectBoundary(last.x2, last.y2, toNode)) {
        errors.push(`edge ${edge.from}->${edge.to}: path does not reach target node ${edge.to}`);
      }
    }

    for (const seg of segments) {
      for (const node of layout.nodes || []) {
        if (node.id === edge.from || node.id === edge.to) continue;
        if (segmentIntersectsRectInterior(seg, node)) {
          errors.push(`edge ${edge.from}->${edge.to} intersects non-terminal node ${node.id}`);
        }
      }
    }

    if (edge.relation === "feeds_back" && !edge.back) {
      errors.push(`edge ${edge.from}->${edge.to}: feeds_back must use exterior gutter route`);
    }

    for (const seg of segments) {
      if (Math.min(seg.x1, seg.x2) < margin) {
        errors.push(`edge ${edge.from}->${edge.to}: route exits viewBox left`);
      }
      if (Math.max(seg.x1, seg.x2) > layout.width - margin) {
        errors.push(`edge ${edge.from}->${edge.to}: route exits viewBox right`);
      }
    }
  }

  const edgeSegs = (layout.edges || []).map((e) => ({
    id: `${e.from}->${e.to}`,
    segments: e.segments?.length ? e.segments : samplePathSegments(e.path),
  }));

  for (let i = 0; i < edgeSegs.length; i++) {
    for (let j = i + 1; j < edgeSegs.length; j++) {
      for (const sa of edgeSegs[i].segments) {
        for (const sb of edgeSegs[j].segments) {
          if (segmentsIntersect(sa, sb) || segmentsCollinearOverlap(sa, sb)) {
            errors.push(`edge/edge overlap: ${edgeSegs[i].id} and ${edgeSegs[j].id} — ambiguous direction`);
          }
        }
      }
    }
  }

  const labelBoxes = (layout.edges || [])
    .filter((e) => e.labelBox)
    .map((e) => ({ id: `${e.from}->${e.to}`, ...e.labelBox }));

  for (let i = 0; i < labelBoxes.length; i++) {
    for (let j = i + 1; j < labelBoxes.length; j++) {
      if (rectsOverlap(labelBoxes[i], labelBoxes[j])) {
        errors.push(`relation-label overlap: ${labelBoxes[i].id} and ${labelBoxes[j].id}`);
      }
    }
    for (const node of layout.nodes || []) {
      if (rectsOverlap(labelBoxes[i], node)) {
        errors.push(`relation-label ${labelBoxes[i].id} overlaps node ${node.id}`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateCausalSvgSerialized(svg, layout) {
  const errors = [];
  const ser = validateSvgSerialized(svg);
  if (!ser.ok) errors.push(...ser.errors);

  const ids = [...svg.matchAll(/data-node-id="([^"]+)"/g)].map((m) => m[1]);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) errors.push(`duplicate node id in SVG: ${id}`);
    seen.add(id);
  }

  for (const edge of layout?.edges || []) {
    const marker = RELATION_MARKERS[edge.relation];
    if (!marker) {
      errors.push(`unknown relation marker mapping: ${edge.relation}`);
      continue;
    }
    if (!svg.includes(`id="${marker}"`)) {
      errors.push(`missing marker definition: ${marker}`);
    }
    const edgeId = `data-edge-id="${edge.from}-&gt;${edge.to}"`;
    const blockStart = svg.indexOf(edgeId);
    const block =
      blockStart >= 0 ? svg.slice(blockStart, blockStart + 1200).split("</g>")[0] : "";
    if (!block.includes(`url(#${marker})`)) {
      errors.push(`edge ${edge.from}->${edge.to}: relation ${edge.relation} missing marker ${marker}`);
    }
    for (const forbidden of FORBIDDEN_ABSTRACT_MARKERS) {
      if (block.includes(forbidden)) {
        errors.push(`edge ${edge.from}->${edge.to}: forbidden abstract marker ${forbidden}`);
      }
    }
    if (RELATION_LABEL_REQUIRED.has(edge.relation)) {
      if (!block.includes("data-relation-label=")) {
        errors.push(`edge ${edge.from}->${edge.to}: relation ${edge.relation} missing learner-visible relation_label`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

export function validateCausalOutput(svg, layout) {
  const geom = validateCausalGeometry(layout);
  const ser = validateCausalSvgSerialized(svg, layout);
  return { ok: geom.ok && ser.ok, errors: [...geom.errors, ...ser.errors] };
}

export function validateBrokenCausalSvgFixture(fixture) {
  return validateCausalSvgSerialized(fixture.svg, fixture.layout);
}

export function validateBrokenCausalLayoutFixture(fixture) {
  if (fixture.kind === "svg-serialized") {
    return validateBrokenCausalSvgFixture(fixture);
  }
  return validateCausalGeometry({
    width: fixture.width,
    height: fixture.height,
    nodes: fixture.nodes,
    edges: fixture.edges,
  });
}
