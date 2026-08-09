/**
 * Geometry validation for SVG layouts — collisions and numeric bounds.
 */

import { isFinitePositive, validateLayoutDimensions } from "./svg-dimension-validate.js";
import { validateEdgeRouting } from "./svg-edge-validate.js";

const MIN_FONT_PX = 11;

function rectsOverlap(a, b, pad = 2) {
  return (
    a.x < b.x + b.width + pad &&
    a.x + a.width + pad > b.x &&
    a.y < b.y + b.height + pad &&
    a.y + a.height + pad > b.y
  );
}

export function validateSvgGeometry(layout, options = {}) {
  const errors = [];
  const minFont = options.minFontPx ?? MIN_FONT_PX;
  const dim = validateLayoutDimensions(layout);
  if (!dim.ok) errors.push(...dim.errors);

  if (layout.nodes) {
    for (let i = 0; i < layout.nodes.length; i++) {
      for (let j = i + 1; j < layout.nodes.length; j++) {
        const a = layout.nodes[i];
        const b = layout.nodes[j];
        if (rectsOverlap(a, b)) {
          errors.push(`collision: nodes ${a.id} and ${b.id}`);
        }
      }
    }
  }

  const labelBoxes = [];
  for (const edge of layout.edges || []) {
    for (const box of edge.labelBoxes || []) labelBoxes.push(box);
    for (const frag of edge.fragments || []) labelBoxes.push(frag);
  }

  for (const node of layout.nodes || []) {
    for (const box of labelBoxes) {
      if (rectsOverlap(node, box)) {
        errors.push(`collision: node ${node.id} with branch label/fragment`);
      }
    }
  }

  for (let i = 0; i < labelBoxes.length; i++) {
    for (let j = i + 1; j < labelBoxes.length; j++) {
      if (rectsOverlap(labelBoxes[i], labelBoxes[j], 1)) {
        errors.push(`collision: branch labels/fragments ${i} and ${j}`);
      }
    }
  }

  const edge = validateEdgeRouting(layout, options);
  if (!edge.ok) errors.push(...edge.errors);

  const cfg = layout.config || {};
  if (cfg.fontSize && cfg.fontSize < minFont) {
    errors.push(`font size ${cfg.fontSize}px below minimum ${minFont}px`);
  }

  if (!isFinitePositive(layout.width) || !isFinitePositive(layout.height)) {
    errors.push("invalid svg dimensions");
  }

  return { ok: errors.length === 0, errors };
}
