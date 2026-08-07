/**
 * Serialize CompositionPlan to SVG — no free geometry discovery.
 */

import { TOKENS, escapeXml } from "../visual-render.js";
import { officialTextId } from "../svg.js";
import { serializeTwoPoleSvg } from "./w1-two-pole-svg.js";
import { serializeFlatConcurrentSvg } from "./w1-flat-concurrent-svg.js";

const DECISION_STYLES = {
  entry: { fill: "#f5f7fa", stroke: "#2563eb", strokeWidth: 2 },
  test: { fill: "#f9fafb", stroke: "#6b7280", strokeWidth: 1.5, dash: "5 4" },
  conclusion: { fill: "#f0f6ff", stroke: "#2563eb", strokeWidth: 2 },
  "dead-end": { fill: "#f3f4f6", stroke: "#9ca3af", strokeWidth: 1.5, dash: "4 3" },
};

function nodeStyle(kind, family) {
  if (family === "dependent-sequence") {
    return DECISION_STYLES[kind] || DECISION_STYLES.test;
  }
  return TOKENS.nodeKind[kind] || TOKENS.nodeKindFallback;
}

function serializeSvgFromPlan(spec, plan) {
  const cfg = plan.typography || (
    plan.family === "dependent-sequence"
      ? { fontSize: 14, fontWeight: 600, lineHeight: 19, titleFontSize: 18, titleFontWeight: 600, titleLineHeight: 24, cornerRadius: 12, textBaselineFactor: 0.75 }
      : { fontSize: 15, fontWeight: 600, lineHeight: 21, titleFontSize: 19, titleFontWeight: 600, titleLineHeight: 26, cornerRadius: 14, textBaselineFactor: 0.75 }
  );

  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${plan.dimensions.width} ${plan.dimensions.height}" ` +
      `width="${plan.dimensions.width}" height="${plan.dimensions.height}" role="img" ` +
      `data-primitive="${escapeXml(spec.primitive)}" data-family="${escapeXml(plan.family)}" ` +
      `data-contract="${escapeXml(plan.contractVersion)}" data-element="${escapeXml(spec.element)}">`,
  );
  parts.push(`  <title>${escapeXml(spec.question)}</title>`);
  parts.push("  <defs>");
  parts.push(
    `    <marker id="vg-arrow-solid" markerWidth="7" markerHeight="7" refX="7" refY="3.5" orient="auto"><path d="M0,0.5 L7,3.5 L0,6.5 Z" fill="${TOKENS.connector}"/></marker>`,
  );
  parts.push("    <style>");
  parts.push(`      .vg-title{font-family:${TOKENS.fontStack};font-size:${cfg.titleFontSize}px;font-weight:${cfg.titleFontWeight};fill:${TOKENS.titleText}}`);
  parts.push(`      .vg-label{font-family:${TOKENS.fontStack};font-size:${cfg.fontSize}px;font-weight:${cfg.fontWeight};fill:${TOKENS.nodeText}}`);
  parts.push("    </style></defs>");
  parts.push(`  <rect width="${plan.dimensions.width}" height="${plan.dimensions.height}" fill="${TOKENS.canvas}"/>`);

  const tb = plan.titleBox || {
    centreX: Math.round(plan.dimensions.width / 2),
    startY: 40,
    lines: plan.titleLines,
  };
  parts.push(`  <text x="${tb.centreX}" y="${tb.startY}" text-anchor="middle" class="vg-title">`);
  plan.titleLines.forEach((line, i) => {
    parts.push(`    <tspan x="${tb.centreX}" dy="${i === 0 ? 0 : cfg.titleLineHeight}">${escapeXml(line)}</tspan>`);
  });
  parts.push("  </text>");

  parts.push('  <g data-layer="relations">');
  for (const route of plan.routes) {
    const seg = route.segments[0];
    parts.push(`    <g data-edge-id="${escapeXml(`${route.from}->${route.to}`)}">`);
    parts.push(
      `      <path d="M ${seg.x1} ${seg.y1} L ${seg.x2} ${seg.y2}" fill="none" stroke="${TOKENS.connector}" stroke-width="2.5" marker-end="url(#vg-arrow-solid)" data-edge-id="${escapeXml(`${route.from}->${route.to}`)}"/>`,
    );
    parts.push("    </g>");
  }
  parts.push("  </g>");

  parts.push('  <g data-layer="entities">');
  for (const el of plan.elements) {
    if (el.role === "title" || el.id === "__title__") continue;
    const style = nodeStyle(el.kind, plan.family);
    const dash = style.dash ? ` stroke-dasharray="${style.dash}"` : "";
    parts.push(`    <g data-node-id="${escapeXml(el.id)}" data-node-kind="${escapeXml(el.kind)}"${el.terminal ? ' data-terminal="true"' : ""}>`);
    parts.push(
      `      <rect x="${el.box.x}" y="${el.box.y}" width="${el.box.width}" height="${el.box.height}" rx="${cfg.cornerRadius}" fill="${style.fill}" stroke="${style.stroke}" stroke-width="${style.strokeWidth}"${dash}/>`,
    );
    el.textLines.forEach((line, li) => {
      const ty = el.box.y + cfg.fontSize + (li + 1) * cfg.lineHeight * (cfg.textBaselineFactor ?? 0.75);
      parts.push(
        `      <text x="${el.box.x + el.box.width / 2}" y="${ty}" text-anchor="middle" class="vg-label" data-official-text-id="${escapeXml(officialTextId(spec.element, `${el.id}-${li + 1}`))}">${escapeXml(line)}</text>`,
      );
    });
    parts.push("    </g>");
  }
  parts.push("  </g></svg>");
  return parts.join("\n");
}

export function serializeArtifact(spec, plan) {
  if (plan.family === "two-pole") {
    return { ok: true, artifact: serializeTwoPoleSvg(spec, plan), kind: "svg" };
  }
  if (plan.family === "flat-concurrent") {
    return { ok: true, artifact: serializeFlatConcurrentSvg(spec, plan), kind: "svg" };
  }
  if (plan.technology === "svg") {
    return { ok: true, artifact: serializeSvgFromPlan(spec, plan), kind: "svg" };
  }
  return { ok: false, errors: [`cannot serialize family ${plan.family}`], artifact: null, kind: null };
}
