/**
 * Layout + SVG render for threshold-scale primitive (generic).
 */

import { measureText, wrapText } from "./text-fit.js";
import { TOKENS, escapeXml } from "./visual-render.js";

export const THRESHOLD_LAYOUT = {
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 18,
  titleFontSize: 18,
  titleFontWeight: 600,
  titleLineHeight: 24,
  contextTitleSize: 15,
  scaleLabelSize: 12,
  bandHeight: 36,
  bandGap: 8,
  scaleGap: 20,
  contextGap: 28,
  margin: 36,
  titleBlock: 64,
  panelPadding: 14,
  cornerRadius: 10,
  confounderSize: 12,
  confounderLineHeight: 16,
  minContentWidth: 320,
};

export function layoutThresholdScale(spec) {
  const cfg = { ...THRESHOLD_LAYOUT };
  const contexts = spec.contexts || [];

  let contentWidth = cfg.minContentWidth;
  const contextLayouts = contexts.map((ctx) => {
    const scales = (ctx.scales || []).map((scale) => {
      const labelW = Math.max(
        measureText(`${scale.analyte} ${scale.cutoff_label}`, cfg.scaleLabelSize, 600),
        measureText(scale.low_band_label, cfg.scaleLabelSize, 500),
        measureText(scale.not_low_band_label, cfg.scaleLabelSize, 500),
      );
      const barW = Math.max(280, labelW + 40);
      contentWidth = Math.max(contentWidth, barW + 2 * cfg.panelPadding);
      return { ...scale, barW };
    });
    return { ...ctx, scales };
  });

  const width = Math.ceil(contentWidth + 2 * cfg.margin);
  const titleWrap = wrapText(
    spec.question,
    width - 2 * cfg.margin,
    cfg.titleFontSize,
    cfg.titleFontWeight,
    { maxLines: 3 },
  );
  const titleLines = titleWrap.ok ? titleWrap.lines : [spec.question];

  let y = cfg.margin + cfg.titleBlock;

  const positionedContexts = contextLayouts.map((ctx) => {
    const blockY = y;
    y += cfg.contextTitleSize + 12;
    const scales = ctx.scales.map((scale) => {
      const sy = y;
      y += cfg.scaleLabelSize + 8 + cfg.bandHeight + cfg.scaleGap;
      return { ...scale, y: sy, x: cfg.margin + cfg.panelPadding };
    });
    y += cfg.contextGap;
    return { ...ctx, y: blockY, scales, x: cfg.margin };
  });

  const interpretations = (spec.interpretations || []).map((ins, i) => {
    const wrap = wrapText(ins.label, width - 2 * cfg.margin - 16, cfg.scaleLabelSize, 400, { maxLines: 4 });
    const lines = wrap.ok ? wrap.lines : [ins.label];
    return { ...ins, id: ins.id || `interp-${i}`, lines };
  });

  y += 8;
  const interpY = y;
  for (const ins of interpretations) {
    y += ins.lines.length * (cfg.lineHeight + 2) + 6;
  }
  y += 16;

  const confounders = spec.confounders || {};
  const inc = (confounders.increase || []).map((i) => i.label).join(" · ");
  const dec = (confounders.decrease || []).map((i) => i.label).join(" · ");
  const incWrap = wrapText(`↑ ${inc}`, width - 2 * cfg.margin - 20, cfg.confounderSize, 400, { maxLines: 3 });
  const decWrap = wrapText(`↓ ${dec}`, width - 2 * cfg.margin - 20, cfg.confounderSize, 400, { maxLines: 3 });
  const confLines = [
    ...(incWrap.ok ? incWrap.lines : [`↑ ${inc}`]),
    ...(decWrap.ok ? decWrap.lines : [`↓ ${dec}`]),
  ];
  const confY = y;
  const confHeight = Math.max(64, confLines.length * cfg.confounderLineHeight + 24);
  y += confHeight + cfg.margin;

  return {
    ok: true,
    errors: [],
    layout: {
      config: cfg,
      width,
      height: Math.ceil(y),
      titleLines,
      contexts: positionedContexts,
      interpretations,
      interpY,
      confounders,
      confY,
      confHeight,
      confLines,
    },
  };
}

export function renderThresholdScaleSvg(spec, layout) {
  const cfg = layout.config;
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" ` +
      `width="${layout.width}" height="${layout.height}" role="img" ` +
      `data-primitive="${escapeXml(spec.primitive)}" data-element="${escapeXml(spec.element)}">`,
  );
  parts.push(`  <title>${escapeXml(spec.question)}</title>`);
  parts.push("  <defs><style>");
  parts.push(`.vg-title{font-family:${TOKENS.fontStack};font-size:${cfg.titleFontSize}px;font-weight:600;fill:${TOKENS.titleText}}`);
  parts.push(`.vg-ctx{font-family:${TOKENS.fontStack};font-size:${cfg.contextTitleSize}px;font-weight:600;fill:${TOKENS.titleText}}`);
  parts.push(`.vg-scale{font-family:${TOKENS.fontStack};font-size:${cfg.scaleLabelSize}px;fill:${TOKENS.nodeText}}`);
  parts.push(`.vg-band{font-family:${TOKENS.fontStack};font-size:11px;fill:${TOKENS.nodeText}}`);
  parts.push(`.vg-note{font-family:${TOKENS.fontStack};font-size:${cfg.scaleLabelSize}px;fill:#6b7280}`);
  parts.push(`.vg-conf{font-family:${TOKENS.fontStack};font-size:${cfg.confounderSize}px;fill:#6b7280}`);
  parts.push("</style></defs>");
  parts.push(`  <rect width="${layout.width}" height="${layout.height}" fill="${TOKENS.canvas}"/>`);

  const cx = layout.width / 2;
  parts.push(`  <text x="${cx}" y="34" text-anchor="middle" class="vg-title">`);
  layout.titleLines.forEach((line, i) => {
    parts.push(`    <tspan x="${cx}" dy="${i === 0 ? 0 : cfg.titleLineHeight}">${escapeXml(line)}</tspan>`);
  });
  parts.push("  </text>");

  for (const ctx of layout.contexts) {
    const panelH = ctx.scales.length * (cfg.bandHeight + cfg.scaleGap + 24) + 24;
    parts.push(
      `  <g data-context="${escapeXml(ctx.id)}"><rect x="${ctx.x}" y="${ctx.y - 8}" ` +
        `width="${layout.width - 2 * cfg.margin}" height="${panelH}" ` +
        `rx="${cfg.cornerRadius}" fill="#fafafa" stroke="#e5e7eb"/>`,
    );
    parts.push(
      `  <text x="${ctx.x + cfg.panelPadding}" y="${ctx.y + 12}" class="vg-ctx">${escapeXml(ctx.label)}</text>`,
    );
    for (const scale of ctx.scales) {
      parts.push(
        `  <text x="${scale.x}" y="${scale.y}" class="vg-scale">${escapeXml(scale.analyte)} · ${escapeXml(scale.cutoff_label)}</text>`,
      );
      const barY = scale.y + 8;
      const half = scale.barW / 2;
      parts.push(
        `  <rect x="${scale.x}" y="${barY}" width="${half}" height="${cfg.bandHeight}" fill="#eef2ff" stroke="#c7d2fe"/>`,
      );
      parts.push(
        `  <rect x="${scale.x + half}" y="${barY}" width="${half}" height="${cfg.bandHeight}" fill="#f3f4f6" stroke="#d1d5db"/>`,
      );
      parts.push(
        `  <text x="${scale.x + half / 2}" y="${barY + cfg.bandHeight / 2 + 4}" text-anchor="middle" class="vg-band">${escapeXml(scale.low_band_label)}</text>`,
      );
      parts.push(
        `  <text x="${scale.x + half + half / 2}" y="${barY + cfg.bandHeight / 2 + 4}" text-anchor="middle" class="vg-band">${escapeXml(scale.not_low_band_label)}</text>`,
      );
    }
    parts.push("  </g>");
  }

  let iy = layout.interpY;
  parts.push('  <g data-layer="interpretations">');
  for (const ins of layout.interpretations) {
    parts.push(`  <text x="${cfg.margin}" y="${iy}" class="vg-note">`);
    ins.lines.forEach((line, i) => {
      const prefix = i === 0 ? "• " : "";
      parts.push(`    <tspan x="${cfg.margin}" dy="${i === 0 ? 0 : cfg.lineHeight}">${escapeXml(prefix + line)}</tspan>`);
    });
    parts.push("  </text>");
    iy += ins.lines.length * (cfg.lineHeight + 2) + 6;
  }
  parts.push("  </g>");

  parts.push(
    `  <g data-layer="confounders"><rect x="${cfg.margin}" y="${layout.confY}" ` +
      `width="${layout.width - 2 * cfg.margin}" height="${layout.confHeight}" rx="8" fill="#f9fafb" stroke="#e5e7eb"/>`,
  );
  let cy = layout.confY + 20;
  for (const line of layout.confLines) {
    parts.push(`  <text x="${cfg.margin + 10}" y="${cy}" class="vg-conf">${escapeXml(line)}</text>`);
    cy += cfg.confounderLineHeight;
  }
  parts.push("  </g>");

  parts.push("</svg>");
  return parts.join("\n") + "\n";
}

export function renderThresholdScale(spec) {
  const laid = layoutThresholdScale(spec);
  if (!laid.ok) return { ok: false, errors: laid.errors, svg: null, layout: null };
  return {
    ok: true,
    errors: [],
    svg: renderThresholdScaleSvg(spec, laid.layout),
    layout: laid.layout,
  };
}
