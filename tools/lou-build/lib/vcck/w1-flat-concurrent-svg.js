/**
 * W1 flat-concurrent — SVG layout and serialization (concurrent set grid, no arrows).
 */

import { wrapText } from "../text-fit.js";
import { TOKENS, escapeXml } from "../visual-render.js";
import { officialTextId } from "../svg.js";

export const FLAT_CONCURRENT_SVG_LAYOUT = Object.freeze({
  margin: 36,
  titleFontSize: 18,
  titleFontWeight: 600,
  titleLineHeight: 24,
  itemFontSize: 14,
  itemFontWeight: 600,
  itemLineHeight: 19,
  itemPaddingX: 16,
  itemPaddingY: 14,
  itemMinWidth: 120,
  itemMaxWidth: 220,
  itemMaxLines: 3,
  rowGap: 16,
  colGap: 16,
  frameGap: 12,
  cornerRadius: 12,
  columns: 2,
  setLabelFontSize: 13,
  setLabelColor: "#6b7280",
  itemFill: "#f5f7fa",
  itemStroke: "#e5e7eb",
});

function wrapLines(label, maxWidth, fontSize, fontWeight, maxLines) {
  const wrapped = wrapText(label, maxWidth, fontSize, fontWeight, { maxLines });
  if (!wrapped.ok) return { ok: false, errors: ["UNSUPPORTED_TEXT_LOAD"] };
  return { ok: true, lines: wrapped.lines, width: wrapped.width };
}

export function layoutFlatConcurrentSvgPlan(spec, plan) {
  const cfg = FLAT_CONCURRENT_SVG_LAYOUT;
  const items = plan.elements.filter((e) => e.role === "item");
  const cols = Math.min(cfg.columns, Math.max(1, items.length));
  const innerMax = cfg.itemMaxWidth - 2 * cfg.itemPaddingX;

  const sized = [];
  for (const item of items) {
    const box = wrapLines(item.label, innerMax, cfg.itemFontSize, cfg.itemFontWeight, cfg.itemMaxLines);
    if (!box.ok) return { ok: false, errors: box.errors };
    const width = Math.min(cfg.itemMaxWidth, Math.max(cfg.itemMinWidth, Math.ceil(box.width + 2 * cfg.itemPaddingX)));
    const height = Math.ceil(2 * cfg.itemPaddingY + box.lines.length * cfg.itemLineHeight);
    sized.push({ ...item, textLines: box.lines, box: { width, height } });
  }

  const titleWrap = wrapLines(spec.question, cols * cfg.itemMaxWidth + (cols - 1) * cfg.colGap, cfg.titleFontSize, cfg.titleFontWeight, 3);
  if (!titleWrap.ok) return { ok: false, errors: titleWrap.errors };

  let setLines = [];
  if (spec.set?.label) {
    const sw = wrapLines(spec.set.label, cols * cfg.itemMaxWidth + (cols - 1) * cfg.colGap, cfg.setLabelFontSize, 600, 2);
    if (!sw.ok) return { ok: false, errors: sw.errors };
    setLines = sw.lines;
  }

  const rowWidth = cols * cfg.itemMaxWidth + (cols - 1) * cfg.colGap;
  const canvasWidth = rowWidth + 2 * cfg.margin;
  const centreX = canvasWidth / 2;

  let y = cfg.margin;
  const titleStartY = y + cfg.titleFontSize;
  const titleBlockH = titleWrap.lines.length * cfg.titleLineHeight + 8;
  y += titleBlockH;
  if (setLines.length) y += setLines.length * 18 + cfg.frameGap;

  const elements = [
    {
      id: "__title__",
      role: "title",
      kind: "title",
      box: { x: cfg.margin, y: cfg.margin, width: rowWidth, height: titleBlockH },
      textLines: titleWrap.lines,
    },
  ];

  const startY = y;
  let maxRowH = 0;
  sized.forEach((item, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = cfg.margin + col * (cfg.itemMaxWidth + cfg.colGap);
    const iy = startY + row * (Math.max(...sized.slice(row * cols, row * cols + cols).map((s) => s.box.height)) + cfg.rowGap);
    const box = { x, y: iy, width: item.box.width, height: item.box.height };
    maxRowH = Math.max(maxRowH, iy + item.box.height);
    elements.push({
      id: item.id,
      role: "item",
      kind: "concurrent-item",
      label: item.label,
      class: item.class,
      textLines: item.textLines,
      box,
    });
  });

  const canvasHeight = maxRowH + cfg.margin;
  plan.technology = "svg";
  plan.titleLines = titleWrap.lines;
  plan.setLabelLines = setLines;
  plan.titleBox = {
    centreX,
    startY: titleStartY,
    innerWidth: rowWidth,
    blockHeight: titleBlockH,
    lineCount: titleWrap.lines.length,
    role: "title",
  };
  plan.elements = elements;
  plan.dimensions = { width: canvasWidth, height: canvasHeight };
  plan.slots = elements.filter((e) => e.id !== "__title__").map((el, i) => ({
    id: `slot-${i}`,
    level: i,
    centreX: el.box.x + el.box.width / 2,
    y: el.box.y,
    width: el.box.width,
  }));
  plan.levels = plan.slots.map((s, i) => ({ level: i, slot: i, elementId: elements[i + 1]?.id }));
  plan.routes = [];
  plan.typography = {
    fontSize: cfg.itemFontSize,
    fontWeight: cfg.itemFontWeight,
    lineHeight: cfg.itemLineHeight,
    titleFontSize: cfg.titleFontSize,
    titleFontWeight: cfg.titleFontWeight,
    titleLineHeight: cfg.titleLineHeight,
    cornerRadius: cfg.cornerRadius,
    textBaselineFactor: 0.75,
  };

  return { ok: true, plan };
}

export function serializeFlatConcurrentSvg(spec, plan) {
  const cfg = FLAT_CONCURRENT_SVG_LAYOUT;
  const w = plan.dimensions.width;
  const h = plan.dimensions.height;
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" ` +
      `data-primitive="${escapeXml(spec.primitive)}" data-family="flat-concurrent" data-contract="${escapeXml(plan.contractVersion)}" ` +
      `data-element="${escapeXml(spec.element)}">`,
  );
  parts.push(`  <title>${escapeXml(spec.question)}</title>`);
  parts.push("  <defs><style>");
  parts.push(`      .vg-title{font-family:${TOKENS.fontStack};font-size:${cfg.titleFontSize}px;font-weight:${cfg.titleFontWeight};fill:${TOKENS.titleText}}`);
  parts.push(`      .vg-frame{font-family:${TOKENS.fontStack};font-size:${cfg.setLabelFontSize}px;font-weight:600;fill:${cfg.setLabelColor}}`);
  parts.push(`      .vg-label{font-family:${TOKENS.fontStack};font-size:${cfg.itemFontSize}px;font-weight:${cfg.itemFontWeight};fill:${TOKENS.nodeText}}`);
  parts.push("    </style></defs>");
  parts.push(`  <rect width="${w}" height="${h}" fill="${TOKENS.canvas}"/>`);

  const tb = plan.titleBox;
  parts.push(`  <text x="${tb.centreX}" y="${tb.startY}" text-anchor="middle" class="vg-title">`);
  plan.titleLines.forEach((line, i) => {
    parts.push(`    <tspan x="${tb.centreX}" dy="${i === 0 ? 0 : cfg.titleLineHeight}">${escapeXml(line)}</tspan>`);
  });
  parts.push("  </text>");

  if (plan.setLabelLines?.length) {
    const setY = cfg.margin + tb.blockHeight + cfg.frameGap / 2;
    parts.push(`  <text x="${tb.centreX}" y="${setY}" text-anchor="middle" class="vg-frame">`);
    plan.setLabelLines.forEach((line, i) => {
      parts.push(`    <tspan x="${tb.centreX}" dy="${i === 0 ? 0 : 18}">${escapeXml(line)}</tspan>`);
    });
    parts.push("  </text>");
  }

  parts.push('  <g data-layer="entities">');
  for (const el of plan.elements) {
    if (el.role === "title" || el.id === "__title__") continue;
    parts.push(`    <g data-node-id="${escapeXml(el.id)}" data-node-kind="concurrent-item">`);
    parts.push(
      `      <rect x="${el.box.x}" y="${el.box.y}" width="${el.box.width}" height="${el.box.height}" rx="${cfg.cornerRadius}" fill="${cfg.itemFill}" stroke="${cfg.itemStroke}" stroke-width="1"/>`,
    );
    const textStartY = el.box.y + cfg.itemPaddingY + cfg.itemFontSize * 0.85;
    el.textLines.forEach((line, li) => {
      parts.push(
        `      <text x="${el.box.x + el.box.width / 2}" y="${textStartY + li * cfg.itemLineHeight}" text-anchor="middle" class="vg-label" data-official-text-id="${escapeXml(officialTextId(spec.element, `${el.id}-${li + 1}`))}">${escapeXml(line)}</text>`,
      );
    });
    parts.push("    </g>");
  }
  parts.push("  </g></svg>");
  return parts.join("\n");
}
