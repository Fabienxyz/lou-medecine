/**
 * W1 two-pole — SVG layout and serialization (comparison bands).
 */

import { measureText, wrapText } from "../text-fit.js";
import { TOKENS, escapeXml } from "../visual-render.js";
import { officialTextId } from "../svg.js";

export const TWO_POLE_SVG_LAYOUT = Object.freeze({
  width: 520,
  margin: 24,
  gutter: 20,
  titleFontSize: 18,
  titleFontWeight: 600,
  titleLineHeight: 24,
  poleFontSize: 15,
  poleFontWeight: 600,
  dimFontSize: 13,
  dimFontWeight: 600,
  cellFontSize: 14,
  cellFontWeight: 600,
  cellLineHeight: 19,
  cellPaddingX: 14,
  cellPaddingY: 12,
  dimBandPaddingY: 8,
  rowGap: 10,
  headerGap: 16,
  poleHeaderHeight: 52,
  cornerRadius: 12,
  dividerColor: "#d1d5db",
  dimMuted: "#6b7280",
  bandFill: "#f9fafb",
  cellFill: "#ffffff",
  poleCrtFill: "#f0f6ff",
  poleCrtStroke: "#2563eb",
  poleDaiFill: "#f5f7fa",
  poleDaiStroke: "#2563eb",
});

function wrapLines(label, maxWidth, fontSize, fontWeight, maxLines) {
  const wrapped = wrapText(label, maxWidth, fontSize, fontWeight, { maxLines });
  if (!wrapped.ok) return { ok: false, errors: ["UNSUPPORTED_TEXT_LOAD"] };
  return { ok: true, lines: wrapped.lines, width: wrapped.width };
}

export function layoutTwoPoleSvgPlan(spec, plan) {
  const cfg = TWO_POLE_SVG_LAYOUT;
  const poles = plan.elements.filter((e) => e.role === "pole");
  const dimensions = plan.elements.filter((e) => e.role === "dimension");
  const innerW = cfg.width - 2 * cfg.margin;
  const colW = (innerW - cfg.gutter) / 2;
  const cellInnerW = colW - 2 * cfg.cellPaddingX - 8;

  const titleWrap = wrapLines(spec.question, innerW, cfg.titleFontSize, cfg.titleFontWeight, 4);
  if (!titleWrap.ok) return { ok: false, errors: titleWrap.errors };

  const rowLayouts = dimensions.map((dim) => {
    const dimWrap = wrapLines(dim.label, innerW - 24, cfg.dimFontSize, cfg.dimFontWeight, 2);
    if (!dimWrap.ok) return { ok: false, errors: dimWrap.errors };
    const poleCells = poles.map((pole) => {
      const items = dim.cells[pole.id] || [];
      const label = items.map((i) => i.label).join(" ") || "";
      const cellWrap = wrapLines(label, cellInnerW, cfg.cellFontSize, cfg.cellFontWeight, 4);
      if (!cellWrap.ok) return { ok: false, errors: cellWrap.errors };
      return { pole, items, ...cellWrap, cellH: cellWrap.lines.length * cfg.cellLineHeight + 2 * cfg.cellPaddingY };
    });
    if (poleCells.some((c) => c.ok === false)) {
      return poleCells.find((c) => c.ok === false);
    }
    const rowH =
      dimWrap.lines.length * 16 +
      cfg.dimBandPaddingY * 2 +
      12 +
      Math.max(...poleCells.map((c) => c.cellH)) +
      cfg.dimBandPaddingY;
    return { ok: true, dim, dimWrap, poleCells, rowH };
  });

  const badRow = rowLayouts.find((r) => r.ok === false);
  if (badRow) return { ok: false, errors: badRow.errors || ["UNSUPPORTED_TEXT_LOAD"] };

  const poleWraps = poles.map((pole, pi) => {
    const w = wrapLines(pole.label, colW - 16, cfg.poleFontSize, cfg.poleFontWeight, 2);
    if (!w.ok) return w;
    return { ok: true, pole, lines: w.lines, fill: pi === 0 ? cfg.poleCrtFill : cfg.poleDaiFill };
  });
  if (poleWraps.some((p) => !p.ok)) {
    return { ok: false, errors: ["UNSUPPORTED_TEXT_LOAD"] };
  }

  let y = cfg.margin;
  const titleStartY = y + cfg.titleFontSize;
  const titleBlockH = titleWrap.lines.length * cfg.titleLineHeight + 8;
  y += titleBlockH + cfg.headerGap;

  const leftX = cfg.margin;
  const rightX = cfg.margin + colW + cfg.gutter;
  const centreX = cfg.width / 2;
  const headerY = y;

  plan.technology = "svg";
  plan.titleLines = titleWrap.lines;
  plan.titleBox = {
    centreX,
    startY: titleStartY,
    innerWidth: innerW,
    blockHeight: titleBlockH,
    lineCount: titleWrap.lines.length,
    role: "title",
  };

  const elements = [
    {
      id: "__title__",
      role: "title",
      kind: "title",
      box: { x: cfg.margin, y: cfg.margin, width: innerW, height: titleBlockH },
      textLines: titleWrap.lines,
    },
  ];

  poles.forEach((pole, pi) => {
    const pw = poleWraps[pi];
    const x = pi === 0 ? leftX : rightX;
    elements.push({
      id: pole.id,
      role: "pole-header",
      kind: "pole",
      label: pole.label,
      textLines: pw.lines,
      box: { x, y: headerY, width: colW, height: cfg.poleHeaderHeight },
    });
  });

  y = headerY + cfg.poleHeaderHeight + cfg.headerGap;

  rowLayouts.forEach((row) => {
    const bandY = y;
    const labelH = row.dimWrap.lines.length * 16 + cfg.dimBandPaddingY;
    elements.push({
      id: row.dim.id,
      role: "dimension-label",
      label: row.dim.label,
      textLines: row.dimWrap.lines,
      box: { x: cfg.margin, y: bandY, width: innerW, height: labelH },
    });
    const cellY = bandY + labelH + 12;
    const cellH = row.rowH - (cellY - bandY) - cfg.dimBandPaddingY;
    row.poleCells.forEach((cell, pi) => {
      const x = pi === 0 ? leftX : rightX;
      const item = cell.items[0];
      elements.push({
        id: item?.id || `${row.dim.id}-${cell.pole.id}`,
        role: "comparison-cell",
        poleId: cell.pole.id,
        dimensionId: row.dim.id,
        dimensionLabel: row.dim.label,
        dimLabelLines: row.dimWrap.lines,
        bandY,
        rowH: row.rowH,
        label: item?.label || "",
        textLines: cell.lines,
        box: { x: x + 4, y: cellY, width: colW - 8, height: cellH },
      });
    });
    y += row.rowH + cfg.rowGap;
  });

  plan.elements = elements;
  plan.dimensions = { width: cfg.width, height: y + cfg.margin - cfg.rowGap };
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
    fontSize: cfg.cellFontSize,
    fontWeight: cfg.cellFontWeight,
    lineHeight: cfg.cellLineHeight,
    titleFontSize: cfg.titleFontSize,
    titleFontWeight: cfg.titleFontWeight,
    titleLineHeight: cfg.titleLineHeight,
    cornerRadius: cfg.cornerRadius,
    textBaselineFactor: 0.75,
  };

  return { ok: true, plan };
}

export function serializeTwoPoleSvg(spec, plan) {
  const cfg = TWO_POLE_SVG_LAYOUT;
  const w = plan.dimensions.width;
  const h = plan.dimensions.height;
  const parts = [];
  parts.push('<?xml version="1.0" encoding="UTF-8"?>');
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" ` +
      `data-primitive="${escapeXml(spec.primitive)}" data-family="two-pole" data-contract="${escapeXml(plan.contractVersion)}" ` +
      `data-element="${escapeXml(spec.element)}">`,
  );
  parts.push(`  <title>${escapeXml(spec.question)}</title>`);
  parts.push("  <defs>");
  parts.push(
    `    <marker id="vg-compare-left" markerWidth="6" markerHeight="6" refX="0" refY="3" orient="auto"><path d="M6,0 L0,3 L6,6 Z" fill="${cfg.dividerColor}"/></marker>`,
  );
  parts.push(
    `    <marker id="vg-compare-right" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="${cfg.dividerColor}"/></marker>`,
  );
  parts.push("    <style>");
  parts.push(`      .vg-title{font-family:${TOKENS.fontStack};font-size:${cfg.titleFontSize}px;font-weight:${cfg.titleFontWeight};fill:${TOKENS.titleText}}`);
  parts.push(`      .vg-pole{font-family:${TOKENS.fontStack};font-size:${cfg.poleFontSize}px;font-weight:${cfg.poleFontWeight};fill:${TOKENS.titleText}}`);
  parts.push(`      .vg-dim{font-family:${TOKENS.fontStack};font-size:${cfg.dimFontSize}px;font-weight:${cfg.dimFontWeight};fill:${cfg.dimMuted}}`);
  parts.push(`      .vg-cell{font-family:${TOKENS.fontStack};font-size:${cfg.cellFontSize}px;font-weight:${cfg.cellFontWeight};fill:${TOKENS.nodeText}}`);
  parts.push("    </style></defs>");
  parts.push(`  <rect width="${w}" height="${h}" fill="${TOKENS.canvas}"/>`);

  const tb = plan.titleBox;
  parts.push(`  <text x="${tb.centreX}" y="${tb.startY}" text-anchor="middle" class="vg-title">`);
  plan.titleLines.forEach((line, i) => {
    parts.push(`    <tspan x="${tb.centreX}" dy="${i === 0 ? 0 : cfg.titleLineHeight}">${escapeXml(line)}</tspan>`);
  });
  parts.push("  </text>");

  const poleHeaders = plan.elements.filter((e) => e.role === "pole-header");
  const leftX = poleHeaders[0]?.box.x ?? cfg.margin;
  const rightX = poleHeaders[1]?.box.x ?? cfg.margin + (w - 2 * cfg.margin) / 2 + cfg.gutter;
  const colW = poleHeaders[0]?.box.width ?? (w - 2 * cfg.margin - cfg.gutter) / 2;
  const headerY = poleHeaders[0]?.box.y ?? 0;
  const centreX = w / 2;

  parts.push('  <g data-layer="comparison-structure">');
  poleHeaders.forEach((pole, pi) => {
    const st = pi === 0 ? { fill: cfg.poleCrtFill, stroke: cfg.poleCrtStroke } : { fill: cfg.poleDaiFill, stroke: cfg.poleDaiStroke };
    parts.push(`    <g data-node-id="${escapeXml(pole.id)}" data-role="pole-header">`);
    parts.push(
      `      <rect x="${pole.box.x}" y="${pole.box.y}" width="${pole.box.width}" height="${pole.box.height}" rx="${cfg.cornerRadius}" fill="${st.fill}" stroke="${st.stroke}" stroke-width="2"/>`,
    );
    const startTy = pole.box.y + pole.box.height / 2 - ((pole.textLines.length - 1) * 18) / 2 + 5;
    pole.textLines.forEach((line, li) => {
      parts.push(
        `      <text x="${pole.box.x + pole.box.width / 2}" y="${startTy + li * 18}" text-anchor="middle" class="vg-pole" data-official-text-id="${escapeXml(officialTextId(spec.element, `${pole.id}-header-${li + 1}`))}">${escapeXml(line)}</text>`,
      );
    });
    parts.push("    </g>");
  });

  const compareY = headerY + cfg.poleHeaderHeight / 2;
  parts.push(
    `    <line x1="${centreX - 28}" y1="${compareY}" x2="${centreX + 28}" y2="${compareY}" stroke="${cfg.dividerColor}" stroke-width="1.5" marker-start="url(#vg-compare-left)" marker-end="url(#vg-compare-right)"/>`,
  );
  parts.push(
    `    <line x1="${centreX}" y1="${headerY + cfg.poleHeaderHeight + 4}" x2="${centreX}" y2="${h - cfg.margin}" stroke="${cfg.dividerColor}" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>`,
  );

  const bands = [...new Set(plan.elements.filter((e) => e.role === "comparison-cell").map((e) => e.dimensionId))];
  for (const dimId of bands) {
    const cells = plan.elements.filter((e) => e.role === "comparison-cell" && e.dimensionId === dimId);
    if (!cells.length) continue;
    const sample = cells[0];
    const bandY = sample.bandY;
    const rowH = sample.rowH;
    parts.push(`    <g data-dimension-id="${escapeXml(dimId)}" data-layer="comparison-band">`);
    parts.push(
      `      <rect x="${cfg.margin}" y="${bandY}" width="${w - 2 * cfg.margin}" height="${rowH}" rx="8" fill="${cfg.bandFill}" stroke="${TOKENS.rule}" stroke-width="1"/>`,
    );
    parts.push(`      <text x="${cfg.margin + 12}" y="${bandY + cfg.dimBandPaddingY + cfg.dimFontSize}" class="vg-dim">${escapeXml(sample.dimensionLabel)}</text>`);
    for (const cell of cells) {
      parts.push(`      <g data-node-id="${escapeXml(cell.id)}" data-pole-id="${escapeXml(cell.poleId)}" data-dimension-id="${escapeXml(cell.dimensionId)}">`);
      parts.push(
        `        <rect x="${cell.box.x}" y="${cell.box.y}" width="${cell.box.width}" height="${cell.box.height}" rx="${cfg.cornerRadius - 2}" fill="${cfg.cellFill}" stroke="${TOKENS.rule}" stroke-width="1"/>`,
      );
      const textStartY = cell.box.y + cfg.cellPaddingY + cfg.cellFontSize * 0.85;
      cell.textLines.forEach((line, li) => {
        parts.push(
          `        <text x="${cell.box.x + cell.box.width / 2}" y="${textStartY + li * cfg.cellLineHeight}" text-anchor="middle" class="vg-cell" data-official-text-id="${escapeXml(officialTextId(spec.element, `${cell.id}-${li + 1}`))}">${escapeXml(line)}</text>`,
        );
      });
      parts.push("      </g>");
    }
    if (cells.length === 2) {
      const linkY = cells[0].box.y + cells[0].box.height / 2;
      parts.push(
        `      <line x1="${leftX + colW - 4}" y1="${linkY}" x2="${rightX + 4}" y2="${linkY}" stroke="${cfg.dividerColor}" stroke-width="1" stroke-dasharray="3 3" opacity="0.5"/>`,
      );
    }
    parts.push("    </g>");
  }
  parts.push("  </g></svg>");
  return parts.join("\n");
}
