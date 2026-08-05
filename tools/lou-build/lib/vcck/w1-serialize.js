/**
 * Serialize CompositionPlan to SVG or HTML — no free geometry discovery.
 */

import { TOKENS, escapeXml } from "../visual-render.js";
import { HTML_VISUAL_CSS, renderQuestionHeading } from "../visual-render-html.js";
import { officialTextId } from "../svg.js";
import { W1_HTML_SURFACE_CSS } from "./w1-surface.js";

function renderQuestionCaption(text) {
  const raw = String(text).trim();
  if (raw.endsWith("?")) {
    return (
      `<figcaption class="vg-question">` +
      `<span class="vg-question-text">${escapeHtml(raw.slice(0, -1).trim())}</span>` +
      `<span class="vg-question-mark">&nbsp;?</span>` +
      `</figcaption>`
    );
  }
  return `<figcaption class="vg-question">${escapeHtml(raw)}</figcaption>`;
}

const DECISION_STYLES = {
  entry: { fill: "#f5f7fa", stroke: "#2563eb", strokeWidth: 2 },
  test: { fill: "#f9fafb", stroke: "#6b7280", strokeWidth: 1.5, dash: "5 4" },
  conclusion: { fill: "#f0f6ff", stroke: "#2563eb", strokeWidth: 2 },
  "dead-end": { fill: "#f3f4f6", stroke: "#9ca3af", strokeWidth: 1.5, dash: "4 3" },
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

function serializeTwoPoleHtml(spec, plan) {
  const poles = plan.elements.filter((e) => e.role === "pole");
  const dimensions = plan.elements.filter((e) => e.role === "dimension");

  const desktop = ['<table class="vg-matrix-desktop"><thead><tr><th scope="col"></th>'];
  for (const pole of poles) desktop.push(`<th scope="col">${escapeHtml(pole.label)}</th>`);
  desktop.push("</tr></thead><tbody>");

  for (const dim of dimensions) {
    desktop.push(`<tr><th scope="row" class="vg-dim-label">${escapeHtml(dim.label)}</th>`);
    for (const pole of poles) {
      const items = dim.cells[pole.id] || [];
      desktop.push("<td><ul>");
      for (const item of items) {
        desktop.push(`<li data-item-id="${escapeHtml(item.id)}">${escapeHtml(item.label)}</li>`);
      }
      desktop.push("</ul></td>");
    }
    desktop.push("</tr>");
  }
  desktop.push("</tbody></table>");

  const mobile = ['<div class="vg-matrix-mobile" aria-hidden="false">'];
  for (const dim of dimensions) {
    for (const pole of poles) {
      const items = dim.cells[pole.id] || [];
      mobile.push(`<article class="vg-matrix-card" data-dimension="${escapeHtml(dim.id)}" data-pole="${escapeHtml(pole.id)}">`);
      mobile.push(`<h4>${escapeHtml(dim.label)} — ${escapeHtml(pole.label)}</h4><ul>`);
      for (const item of items) {
        mobile.push(`<li data-item-id="${escapeHtml(item.id)}">${escapeHtml(item.label)}</li>`);
      }
      mobile.push("</ul></article>");
    }
  }
  mobile.push("</div>");

  return [
    `<figure class="vg-visual vg-comparison-matrix" data-primitive="comparison-matrix" data-family="two-pole" data-contract="${plan.contractVersion}">`,
    renderQuestionCaption(spec.question),
    desktop.join("\n"),
    mobile.join("\n"),
    "</figure>",
  ].join("\n");
}

function serializeFlatConcurrentHtml(spec, plan) {
  const cols375 = plan.reflowByWidth[375]?.columns ?? 1;
  const cols530 = plan.reflowByWidth[530]?.columns ?? cols375;
  const cols768 = plan.reflowByWidth[768]?.columns ?? cols530;
  const cols1280 = Math.min(plan.reflowByWidth[1280]?.columns ?? cols768, plan.elements.length || 1);
  const parts = [
    `<section class="vg-visual vg-enumeration-set" data-primitive="enumeration-set" data-family="flat-concurrent" data-contract="${plan.contractVersion}">`,
    renderQuestionHeading(spec.question, 2),
    `<p class="vg-enum-frame">${escapeHtml(spec.set?.label || "")}</p>`,
    `<ul class="vg-enum-list vg-enum-concurrent-list vg-w1-grid" style="--vg-cols-375:${cols375};--vg-cols-530:${cols530};--vg-cols-768:${cols768};--vg-cols-desktop:${cols1280}">`,
  ];
  for (const el of plan.elements) {
    parts.push(`<li data-item-id="${escapeHtml(el.id)}" data-class="${escapeHtml(el.class || "scaffolding")}">${escapeHtml(el.label)}</li>`);
  }
  parts.push("</ul></section>");
  return parts.join("\n");
}

export function serializeArtifact(spec, plan) {
  if (plan.technology === "svg") {
    return { ok: true, artifact: serializeSvgFromPlan(spec, plan), kind: "svg" };
  }
  if (plan.family === "two-pole") {
    return { ok: true, artifact: serializeTwoPoleHtml(spec, plan), kind: "html" };
  }
  if (plan.family === "flat-concurrent") {
    return { ok: true, artifact: serializeFlatConcurrentHtml(spec, plan), kind: "html" };
  }
  return { ok: false, errors: [`cannot serialize family ${plan.family}`], artifact: null, kind: null };
}

export function wrapHtmlDocument(spec, body) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(spec.element)}</title>
<style>${HTML_VISUAL_CSS}
${W1_HTML_SURFACE_CSS}
.vg-w1-grid{grid-template-columns:repeat(var(--vg-cols-375,1),minmax(0,1fr))}
@media (min-width:530px){.vg-w1-grid{grid-template-columns:repeat(var(--vg-cols-530,1),minmax(0,1fr))}}
@media (min-width:768px){.vg-w1-grid{grid-template-columns:repeat(var(--vg-cols-768,3),minmax(0,1fr))}}
@media (min-width:1280px){.vg-w1-grid{grid-template-columns:repeat(var(--vg-cols-desktop,4),minmax(0,1fr))}}
</style>
</head>
<body><div class="vg-w1-capture-root" data-w1-surface="W1-S1"><div class="vg-w1-composition">${body}</div></div></body>
</html>`;
}
