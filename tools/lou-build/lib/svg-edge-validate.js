/**
 * Edge routing validation — segment ↔ node bbox intersection checks.
 */

function rectsOverlap(a, b, pad = 2) {
  return (
    a.x < b.x + b.width + pad &&
    a.x + a.width + pad > b.x &&
    a.y < b.y + b.height + pad &&
    a.y + a.height + pad > b.y
  );
}

export function parseOrthogonalPath(pathD) {
  const tokens = String(pathD || "")
    .trim()
    .match(/[ML]|-?\d*\.?\d+/g);
  if (!tokens?.length) return [];

  const segments = [];
  let i = 0;
  let cx = 0;
  let cy = 0;

  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === "M") {
      cx = parseFloat(tokens[i++]);
      cy = parseFloat(tokens[i++]);
    } else if (cmd === "L") {
      const nx = parseFloat(tokens[i++]);
      const ny = parseFloat(tokens[i++]);
      segments.push({ x1: cx, y1: cy, x2: nx, y2: ny });
      cx = nx;
      cy = ny;
    }
  }
  return segments;
}

function segmentBounds(seg) {
  return {
    x: Math.min(seg.x1, seg.x2),
    y: Math.min(seg.y1, seg.y2),
    width: Math.abs(seg.x2 - seg.x1),
    height: Math.abs(seg.y2 - seg.y1),
  };
}

/** True when segment passes through rect interior (orthogonal or diagonal). */
export function segmentIntersectsRectInterior(seg, rect, inset = 4) {
  const r = {
    x: rect.x + inset,
    y: rect.y + inset,
    width: Math.max(0, rect.width - 2 * inset),
    height: Math.max(0, rect.height - 2 * inset),
  };
  if (r.width <= 0 || r.height <= 0) return false;

  const eps = 0.5;
  if (Math.abs(seg.x1 - seg.x2) < eps) {
    const x = seg.x1;
    const yMin = Math.min(seg.y1, seg.y2);
    const yMax = Math.max(seg.y1, seg.y2);
    return x > r.x && x < r.x + r.width && yMax > r.y && yMin < r.y + r.height;
  }
  if (Math.abs(seg.y1 - seg.y2) < eps) {
    const y = seg.y1;
    const xMin = Math.min(seg.x1, seg.x2);
    const xMax = Math.max(seg.x1, seg.x2);
    return y > r.y && y < r.y + r.height && xMax > r.x && xMin < r.x + r.width;
  }

  // Diagonal segment — sample line-rectangle intersection
  const xMin = Math.min(seg.x1, seg.x2);
  const xMax = Math.max(seg.x1, seg.x2);
  const yMin = Math.min(seg.y1, seg.y2);
  const yMax = Math.max(seg.y1, seg.y2);
  if (xMax < r.x || xMin > r.x + r.width || yMax < r.y || yMin > r.y + r.height) {
    return false;
  }

  const dx = seg.x2 - seg.x1;
  const dy = seg.y2 - seg.y1;
  const steps = 32;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = seg.x1 + dx * t;
    const py = seg.y1 + dy * t;
    if (px > r.x && px < r.x + r.width && py > r.y && py < r.y + r.height) {
      return true;
    }
  }
  return false;
}

export function pointOnRectBoundary(px, py, rect, eps = 4) {
  const onLeft = Math.abs(px - rect.x) <= eps;
  const onRight = Math.abs(px - (rect.x + rect.width)) <= eps;
  const onTop = Math.abs(py - rect.y) <= eps;
  const onBottom = Math.abs(py - (rect.y + rect.height)) <= eps;
  const inX = px >= rect.x - eps && px <= rect.x + rect.width + eps;
  const inY = py >= rect.y - eps && py <= rect.y + rect.height + eps;
  return ((onLeft || onRight) && inY) || ((onTop || onBottom) && inX);
}

function nodeByIdMap(nodes) {
  return new Map((nodes || []).map((n) => [n.id, n]));
}

export function validateEdgeRouting(layout, options = {}) {
  const errors = [];
  const nodes = layout.nodes || [];
  const nodeMap = nodeByIdMap(nodes);
  const margin = options.margin ?? 4;

  for (const edge of layout.edges || []) {
    const segments = edge.segments?.length ? edge.segments : parseOrthogonalPath(edge.path);
    const fromNode = nodeMap.get(edge.from);
    const toNode = nodeMap.get(edge.to);
    if (!fromNode || !toNode) {
      errors.push(`edge ${edge.id}: missing endpoint node`);
      continue;
    }
    if (!segments.length) {
      errors.push(`edge ${edge.id}: no path segments`);
      continue;
    }

    const first = segments[0];
    const last = segments[segments.length - 1];
    if (!pointOnRectBoundary(first.x1, first.y1, fromNode)) {
      errors.push(`edge ${edge.id}: first segment does not exit source node ${edge.from}`);
    }
    if (!pointOnRectBoundary(last.x2, last.y2, toNode)) {
      errors.push(`edge ${edge.id}: last segment does not reach target node ${edge.to}`);
    }

    for (let si = 0; si < segments.length; si++) {
      const seg = segments[si];
      for (const node of nodes) {
        if (node.id === edge.from) {
          if (si > 0 && segmentIntersectsRectInterior(seg, node)) {
            errors.push(`edge ${edge.id} re-enters source node ${node.id}`);
          }
          continue;
        }
        if (node.id === edge.to) {
          if (si < segments.length - 1 && segmentIntersectsRectInterior(seg, node)) {
            errors.push(`edge ${edge.id} crosses target node ${node.id} before entry`);
          }
          continue;
        }
        if (segmentIntersectsRectInterior(seg, node)) {
          errors.push(`edge ${edge.id} intersects non-terminal node ${node.id}`);
        }
      }
    }

    for (const box of edge.labelBoxes || []) {
      for (const node of nodes) {
        if (node.id === edge.from || node.id === edge.to) continue;
        if (rectsOverlap(box, node)) {
          errors.push(`edge ${edge.id}: branch label overlaps node ${node.id}`);
        }
      }
    }

    for (const seg of segments) {
      const b = segmentBounds(seg);
      if (b.x < margin) {
        errors.push(`edge ${edge.id}: lateral corridor exits viewBox left`);
      }
      if (b.x + b.width > layout.width - margin) {
        errors.push(`edge ${edge.id}: lateral corridor exits viewBox right`);
      }
      if (b.y < margin) {
        errors.push(`edge ${edge.id}: route exits viewBox top`);
      }
      if (b.y + b.height > layout.height - margin) {
        errors.push(`edge ${edge.id}: route exits viewBox bottom`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/** Validate a frozen broken layout fixture (nodes + edges only). */
export function validateBrokenLayoutFixture(fixture) {
  const layout = {
    width: fixture.width,
    height: fixture.height,
    nodes: fixture.nodes,
    edges: fixture.edges,
    config: {},
  };
  return validateEdgeRouting(layout);
}
