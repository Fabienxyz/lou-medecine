import path from "node:path";
import { extractThresholdFromQuote } from "./ground.js";
import { inventoryById, anchorForKp } from "./inventory.js";
import { figureRelPathForElement } from "./claims.js";

export const SUPPORTED_VISUAL_INTENTS = new Set(["process-flow"]);

/**
 * Blueprint element + visual_intent → in-memory visualSpec.
 */
export function buildVisualSpec(element, inventory, sourceMeta) {
  const usesKp = element.uses_kp || [];
  let threshold = null;
  for (const kpId of usesKp) {
    const kp = inventoryById(inventory).get(kpId);
    const anchor = anchorForKp(kp, sourceMeta.edition);
    const t = extractThresholdFromQuote(anchor?.quote);
    if (t != null) {
      threshold = t;
      break;
    }
  }

  return {
    element: element.id,
    intent: element.visual_intent,
    question: element.question || element.label || element.id,
    steps: (element.steps || []).map((label, i) => ({
      n: i + 1,
      label,
      highlight:
        threshold != null &&
        (label.includes("seuil") || label.includes(String(threshold)))
          ? { thresholdMmHg: threshold }
          : null,
    })),
  };
}

export function renderSvg(spec) {
  if (spec.intent === "process-flow") {
    return { ok: true, svg: renderProcessFlowSvg(spec) };
  }
  return {
    ok: false,
    errors: [`unsupported visual_intent: ${spec.intent}`],
  };
}

export function renderProcessFlowSvg(spec) {
  const title = spec.question;
  const steps = spec.steps;
  const thresholdStep = steps.find((s) => s.highlight?.thresholdMmHg);
  const thresholdLabel = thresholdStep
    ? `Seuil PPC > ${thresholdStep.highlight.thresholdMmHg} mmHg`
    : null;

  const cardY = [160, 248, 376, 504];
  const cardH = [56, 96, 96, 94];
  const cardFill = ["#F5F7FA", "#FDE7C7", "#FEE2E2", "#F5F7FA"];
  const labels = steps.map((s) => s.label);

  let cards = "";
  for (let i = 0; i < Math.min(4, steps.length); i++) {
    const y = cardY[i];
    const h = cardH[i];
    const sub =
      i === 1 && thresholdLabel
        ? `\n  <text x="600" y="${y + 48}" text-anchor="middle" class="body">${escapeXml(thresholdLabel)}</text>`
        : i === 2
          ? `\n  <text x="600" y="${y + 48}" text-anchor="middle" class="body">OAP cardiogénique</text>`
          : "";
    cards += `
  <g filter="url(#card-shadow)">
    <rect x="390" y="${y}" width="420" height="${h}" rx="16" fill="${cardFill[i]}" stroke="#E5E7EB" stroke-width="1"/>
  </g>
  <circle cx="458" cy="${y + 30}" r="11" fill="#F3F4F6" stroke="#E5E7EB" stroke-width="1"/>
  <text x="458" y="${y + 34}" text-anchor="middle" class="step-num">${i + 1}</text>
  <text x="600" y="${y + 30}" text-anchor="middle" class="card-title">${escapeXml(shortLabel(labels[i]))}</text>${sub}`;
    if (i < 3) {
      cards += `\n  <line x1="600" y1="${y + h}" x2="600" y2="${y + h + 32}" stroke="#9CA3AF" stroke-width="3" stroke-linecap="round" marker-end="url(#arrowhead)"/>`;
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 638" role="img" aria-labelledby="svg-title svg-desc" data-blueprint-element="${escapeXml(spec.element)}">
  <title id="svg-title">${escapeXml(title)}</title>
  <desc id="svg-desc">Process flow for ${escapeXml(spec.element)}.</desc>
  <defs>
    <filter id="card-shadow" x="-6%" y="-6%" width="112%" height="118%">
      <feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="#000000" flood-opacity="0.05"/>
    </filter>
    <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L6,3 L0,6 Z" fill="#9CA3AF"/>
    </marker>
    <style>
      .title-main { font-family: Inter, system-ui, sans-serif; font-size: 32px; font-weight: 700; fill: #111827; }
      .title-sub { font-family: Inter, system-ui, sans-serif; font-size: 20px; font-weight: 600; fill: #111827; }
      .card-title { font-family: Inter, system-ui, sans-serif; font-size: 15px; font-weight: 600; fill: #111827; }
      .body { font-family: Inter, system-ui, sans-serif; font-size: 13px; fill: #6B7280; }
      .step-num { font-family: Inter, system-ui, sans-serif; font-size: 11px; font-weight: 600; fill: #6B7280; }
      .summary-title { font-family: Inter, system-ui, sans-serif; font-size: 15px; font-weight: 600; fill: #111827; }
      .summary-body { font-family: Inter, system-ui, sans-serif; font-size: 13px; fill: #374151; }
    </style>
  </defs>
  <rect width="1200" height="638" fill="#FFFFFF"/>
  <text x="600" y="64" text-anchor="middle" class="title-main">${escapeXml(spec.element)}</text>
  <text x="600" y="98" text-anchor="middle" class="title-sub">${escapeXml(title)}</text>
  <line x1="520" y1="120" x2="680" y2="120" stroke="#2563EB" stroke-width="2" stroke-linecap="round"/>
  ${cards}
  <g filter="url(#card-shadow)">
    <rect x="180" y="560" width="840" height="60" rx="16" fill="#F5F7FA" stroke="#E5E7EB" stroke-width="1"/>
  </g>
  <text x="600" y="586" text-anchor="middle" class="summary-title">À retenir</text>
  <text x="600" y="608" text-anchor="middle" class="summary-body">Process flow derived from Blueprint steps.</text>
</svg>
`;
}

/** @deprecated alias */
export const renderMecOapSvg = renderProcessFlowSvg;

export function figureAbsPath(figuresDir, elementId) {
  return path.join(figuresDir, `${String(elementId).toLowerCase()}.svg`);
}

export function validateSvgStructure(svgText, elementId) {
  const errors = [];
  if (!svgText.includes('role="img"')) errors.push("svg: missing role=img");
  if (!svgText.includes("<title")) errors.push("svg: missing title");
  if (!svgText.includes("<desc")) errors.push("svg: missing desc");
  if (!svgText.includes(`data-blueprint-element="${elementId}"`)) {
    errors.push("svg: missing data-blueprint-element");
  }
  return { ok: errors.length === 0, errors };
}

function shortLabel(text) {
  if (text.length <= 48) return text;
  return text.slice(0, 45) + "…";
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
