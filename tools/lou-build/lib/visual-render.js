import { validateVisualSpec } from "./visual-spec.js";
import { groundVisualSpec, renderEligibility } from "./visual-ground.js";
import { layoutCausalGraph } from "./visual-layout.js";

/**
 * Deterministic renderer for the causal-graph primitive.
 *
 * The renderer is subject-matter ignorant by construction. It may read only:
 * the primitive discriminator, node kinds, edge relation kinds, strings supplied
 * by the specification, claim identifiers, design tokens, and layout rules.
 *
 * It contains no branch on any element id and no fallback learner-visible string.
 * Every word a learner reads comes from the specification, except the relation
 * connectives below, which belong to the visual grammar itself and are identical
 * for every chapter and every discipline.
 */

/** Design tokens, from 01-learning/templates/design-system.md. */
export const TOKENS = {
  fontStack: "Inter, system-ui, -apple-system, sans-serif",

  canvas: "#ffffff",
  titleText: "#1d1d1f",
  nodeText: "#1d1d1f",
  connector: "#9ca3af",
  accent: "#2563eb",
  rule: "#e5e5ea",

  /**
   * One token per semantic node kind. Colour is never the only carrier of a
   * distinction: each kind also differs in border treatment, and every node
   * group carries its kind as a data attribute.
   */
  nodeKind: {
    state: { fill: "#f5f7fa", stroke: "#e5e7eb", strokeWidth: 1 },
    response: { fill: "#f0f6ff", stroke: "#c7dbfb", strokeWidth: 1 },
    event: { fill: "#ffffff", stroke: "#2563eb", strokeWidth: 2.5 },
  },
  nodeKindFallback: { fill: "#f5f7fa", stroke: "#e5e7eb", strokeWidth: 1 },

  /**
   * One token per semantic relation kind, separated by marker shape and dash
   * pattern as well as colour, so the distinction survives greyscale printing
   * and colour-vision deficiency.
   *
   * Stroke weight is deliberately equal across kinds: line weight reads as
   * confidence, and relation kind is orthogonal to how well a relation is
   * grounded. Only the reserved-route kind departs from the shared stroke,
   * because it also leaves the grid.
   */
  relation: {
    causes: { stroke: "#9ca3af", width: 2.5, dash: null, marker: "vg-arrow-solid" },
    transmits: { stroke: "#9ca3af", width: 2.5, dash: null, marker: "vg-arrow-flow" },
    feeds_back: { stroke: "#2563eb", width: 2.5, dash: "8 6", marker: "vg-arrow-accent" },
  },
  relationFallback: {
    stroke: "#9ca3af",
    width: 2.5,
    dash: null,
    marker: "vg-arrow-solid",
  },
};

/**
 * Grammar-level connectives for the text alternative, one per relation kind in
 * the schema enum. These are structural vocabulary, not subject content: they
 * describe the shape of a relation and are reused unchanged across all chapters.
 */
const RELATION_CONNECTIVE = {
  causes: "entraîne",
  transmits: "se transmet à",
  feeds_back: "rétroagit sur",
};

const GENERIC = {
  primitiveName: { "causal-graph": "Graphe causal" },
  entities: "entités",
  relations: "relations",
  feedbackLoops: "boucle de rétroaction",
  feedbackLoopsPlural: "boucles de rétroaction",
};

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Text alternative, composed deterministically from the graph.
 *
 * It enumerates exactly the relations the specification declares and adds no
 * statement of its own, so it cannot introduce a claim that is not grounded.
 */
export function describeCausalGraph(spec) {
  const labels = new Map(spec.nodes.map((n) => [n.id, n.label]));
  const backCount = spec.edges.filter((e) => e.relation === "feeds_back").length;

  const head =
    `${GENERIC.primitiveName[spec.primitive] || spec.primitive} : ` +
    `${spec.nodes.length} ${GENERIC.entities}, ${spec.edges.length} ${GENERIC.relations}` +
    (backCount > 0
      ? `, dont ${backCount} ${backCount > 1 ? GENERIC.feedbackLoopsPlural : GENERIC.feedbackLoops}`
      : "") +
    ".";

  const sentences = spec.edges.map((e) => {
    const connective = RELATION_CONNECTIVE[e.relation] || e.relation;
    return `${labels.get(e.from)} ${connective} ${labels.get(e.to)}`;
  });

  return `${head} ${sentences.join(" ; ")}.`;
}

function nodeClaimId(spec, nodeId) {
  return `cb-vis-${String(spec.element).toLowerCase()}-n-${nodeId}`;
}

function edgeClaimId(spec, edge) {
  return `cb-vis-${String(spec.element).toLowerCase()}-e-${edge.from}-to-${edge.to}`;
}

function markerDefs() {
  const shape = (id, fill) =>
    `    <marker id="${id}" markerWidth="7" markerHeight="7" refX="7" refY="3.5" ` +
    `orient="auto" markerUnits="strokeWidth">\n` +
    `      <path d="M0,0.5 L7,3.5 L0,6.5 Z" fill="${fill}"/>\n    </marker>`;
  // A double chevron reads as propagation rather than as production, and stays
  // as visually strong as the filled head so that kind is not mistaken for rank.
  const doubleChevron = (id, stroke) =>
    `    <marker id="${id}" markerWidth="9" markerHeight="8" refX="8.5" refY="4" ` +
    `orient="auto" markerUnits="strokeWidth">\n` +
    `      <path d="M0.6,1 L3.4,4 L0.6,7 M4.8,1 L7.6,4 L4.8,7" fill="none" ` +
    `stroke="${stroke}" stroke-width="1.9" stroke-linecap="round" ` +
    `stroke-linejoin="round"/>\n    </marker>`;

  return [
    shape("vg-arrow-solid", TOKENS.connector),
    doubleChevron("vg-arrow-flow", TOKENS.connector),
    shape("vg-arrow-accent", TOKENS.accent),
  ].join("\n");
}

/** Emit SVG from an already-validated spec and a computed layout. */
export function renderCausalGraphSvg(spec, layout) {
  const cfg = layout.config;
  const nodesById = new Map(spec.nodes.map((n) => [n.id, n]));

  const title = spec.question;
  const desc = describeCausalGraph(spec);

  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" ` +
      `width="${layout.width}" height="${layout.height}" role="img" ` +
      `aria-labelledby="vg-title vg-desc" data-primitive="${escapeXml(spec.primitive)}" ` +
      `data-element="${escapeXml(spec.element)}" data-spec-version="${escapeXml(spec.spec_version)}">`
  );
  parts.push(`  <title id="vg-title">${escapeXml(title)}</title>`);
  parts.push(`  <desc id="vg-desc">${escapeXml(desc)}</desc>`);
  parts.push("  <defs>");
  parts.push(markerDefs());
  parts.push("    <style>");
  parts.push(
    `      .vg-title { font-family: ${TOKENS.fontStack}; font-size: ${cfg.titleFontSize}px; ` +
      `font-weight: ${cfg.titleFontWeight}; fill: ${TOKENS.titleText}; }`
  );
  parts.push(
    `      .vg-label { font-family: ${TOKENS.fontStack}; font-size: ${cfg.fontSize}px; ` +
      `font-weight: ${cfg.fontWeight}; fill: ${TOKENS.nodeText}; }`
  );
  parts.push("    </style>");
  parts.push("  </defs>");

  parts.push(
    `  <rect width="${layout.width}" height="${layout.height}" fill="${TOKENS.canvas}"/>`
  );

  const centreX = Math.round(layout.width / 2);
  parts.push(`  <text x="${centreX}" y="40" text-anchor="middle" class="vg-title">`);
  layout.titleLines.forEach((line, i) => {
    parts.push(
      `    <tspan x="${centreX}" dy="${i === 0 ? 0 : cfg.titleLineHeight}">${escapeXml(line)}</tspan>`
    );
  });
  parts.push("  </text>");

  const ruleY = 56 + (layout.titleLines.length - 1) * cfg.titleLineHeight;
  parts.push(
    `  <line x1="${centreX - 40}" y1="${ruleY}" x2="${centreX + 40}" y2="${ruleY}" ` +
      `stroke="${TOKENS.accent}" stroke-width="2" stroke-linecap="round"/>`
  );

  // Edges first, so node surfaces sit above connector ends.
  parts.push('  <g data-layer="relations">');
  for (const edge of layout.edges) {
    const style = TOKENS.relation[edge.relation] || TOKENS.relationFallback;
    const kp = (edge.kp || []).join(" ");
    const attrs = [
      `data-claim="${escapeXml(edgeClaimId(spec, edge))}"`,
      `data-edge-id="${escapeXml(`${edge.from}->${edge.to}`)}"`,
      `data-relation="${escapeXml(edge.relation)}"`,
      `data-claim-class="${escapeXml(edge.class)}"`,
      kp ? `data-kp="${escapeXml(kp)}"` : null,
    ].filter(Boolean);
    parts.push(`    <g ${attrs.join(" ")}>`);
    parts.push(
      `      <path d="${edge.path}" fill="none" stroke="${style.stroke}" ` +
        `stroke-width="${style.width}" stroke-linecap="round"` +
        (style.dash ? ` stroke-dasharray="${style.dash}"` : "") +
        ` marker-end="url(#${style.marker})"/>`
    );
    parts.push("    </g>");
  }
  parts.push("  </g>");

  parts.push('  <g data-layer="entities">');
  for (const box of layout.nodes) {
    const node = nodesById.get(box.id);
    const style = TOKENS.nodeKind[node.kind] || TOKENS.nodeKindFallback;
    const kp = (node.kp || []).join(" ");
    const attrs = [
      `data-claim="${escapeXml(nodeClaimId(spec, node.id))}"`,
      `data-node-id="${escapeXml(node.id)}"`,
      `data-node-kind="${escapeXml(node.kind)}"`,
      `data-claim-class="${escapeXml(node.class)}"`,
      kp ? `data-kp="${escapeXml(kp)}"` : null,
    ].filter(Boolean);

    parts.push(`    <g ${attrs.join(" ")}>`);
    parts.push(
      `      <rect x="${box.x}" y="${box.y}" width="${box.width}" height="${box.height}" ` +
        `rx="${cfg.cornerRadius}" fill="${style.fill}" stroke="${style.stroke}" ` +
        `stroke-width="${style.strokeWidth}"/>`
    );

    const firstBaseline =
      box.y +
      box.height / 2 -
      ((box.lines.length - 1) * cfg.lineHeight) / 2 +
      cfg.fontSize * 0.35;
    const textX = Math.round(box.x + box.width / 2);
    parts.push(
      `      <text x="${textX}" y="${Math.round(firstBaseline * 100) / 100}" ` +
        `text-anchor="middle" class="vg-label">`
    );
    box.lines.forEach((line, i) => {
      const dy = i === 0 ? 0 : cfg.lineHeight;
      parts.push(
        `        <tspan x="${textX}" dy="${dy}">${escapeXml(line)}</tspan>`
      );
    });
    parts.push("      </text>");
    parts.push("    </g>");
  }
  parts.push("  </g>");

  parts.push("</svg>");
  return parts.join("\n") + "\n";
}

/**
 * The full gate: validate, ground, check eligibility, lay out, then emit.
 *
 * Eligibility is recomputed here on every call. A persisted verdict is never
 * trusted, and no partial asset is returned on failure — callers that receive
 * `ok: false` have nothing publishable to write.
 */
export function renderVisualSpec({ spec, inventory, sourceMeta, review }) {
  const validation = validateVisualSpec(spec, { inventory });
  if (!validation.ok) {
    return { ok: false, stage: "validation", errors: validation.errors, svg: null };
  }

  if (spec.primitive !== "causal-graph") {
    return {
      ok: false,
      stage: "renderer",
      errors: [`no renderer for primitive "${spec.primitive}"`],
      svg: null,
    };
  }

  const grounding = groundVisualSpec({ spec, inventory, sourceMeta, review });
  const eligibility = renderEligibility({ validation, grounding });
  if (!eligibility.eligible) {
    return {
      ok: false,
      stage: "eligibility",
      errors: eligibility.reasons,
      grounding,
      svg: null,
    };
  }

  const laid = layoutCausalGraph(spec);
  if (!laid.ok) {
    return { ok: false, stage: "layout", errors: laid.errors, grounding, svg: null };
  }

  return {
    ok: true,
    stage: "rendered",
    errors: [],
    grounding,
    svg: renderCausalGraphSvg(spec, laid.layout),
    layout: laid.layout,
  };
}
