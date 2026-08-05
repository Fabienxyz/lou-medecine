/**
 * Viewport validation for SVG wrapped in HTML at target widths.
 * Measures internal content via getBBox — overflow:hidden is never used.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { resolvePlaywright } from "./playwright.js";

export const SVG_VIEWPORT_WIDTHS = [375, 530, 768, 1280, 2400];

const VIEWBOX_MARGIN = 4;
const MIN_RENDERED_FONT = 10;

/** HTML wrapper for PNG capture (responsive scaling). */
export function svgWrapperHtml(svgContent, width) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:#fff}
.wrap{width:${width}px;max-width:100%}
.wrap svg{display:block;width:100%;height:auto;max-width:100%}
</style></head><body><div class="wrap">${svgContent}</div></body></html>`;
}

/** HTML wrapper for validation — no clipping. */
export function svgValidationWrapperHtml(svgContent, width) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;overflow:visible;background:#fff}
.wrap{width:${width}px;max-width:100%;overflow:visible}
.wrap svg{display:block;width:100%;height:auto;max-width:100%;overflow:visible}
</style></head><body><div class="wrap">${svgContent}</div></body></html>`;
}

export function evaluateViewportIssues({ margin, minFont }) {
  const problems = [];
  const svg = document.querySelector("svg");
  if (!svg) return ["no svg element"];

  const vb = svg.viewBox.baseVal;
  if (!vb.width || !vb.height || !Number.isFinite(vb.width) || !Number.isFinite(vb.height)) {
    problems.push(`invalid viewBox ${vb.width} x ${vb.height}`);
    return problems;
  }

  const vbRight = vb.x + vb.width;
  const vbBottom = vb.y + vb.height;

  const boxes = [];
  const collect = (el, kind) => {
    try {
      const bb = el.getBBox();
      if (!Number.isFinite(bb.width) || !Number.isFinite(bb.height)) {
        problems.push(`${kind}: non-finite bbox`);
        return;
      }
      if (bb.width <= 0 && bb.height <= 0) return;
      boxes.push({ kind, id: el.getAttribute("data-node-id") || el.tagName, bb });
    } catch {
      /* skip elements without geometry */
    }
  };

  svg.querySelectorAll("[data-node-id]").forEach((el) => collect(el, "node"));
  svg.querySelectorAll("[data-fragment]").forEach((el) => collect(el, "fragment"));
  svg.querySelectorAll("[data-branch-label] rect").forEach((el) => collect(el, "branch-label"));
  svg.querySelectorAll(".vg-title").forEach((el) => collect(el, "title"));
  svg.querySelectorAll(".vg-ann").forEach((el) => collect(el, "annotation"));
  svg.querySelectorAll('[data-layer="interpretations"] text').forEach((el) => collect(el, "interpretation"));
  svg.querySelectorAll(".vg-conf, .vg-ctx, .vg-scale, .vg-band").forEach((el) => collect(el, "text"));
  svg.querySelectorAll("path[marker-end]").forEach((el) => collect(el, "arrow"));

  for (const { kind, id, bb } of boxes) {
    if (bb.x < vb.x - margin) {
      problems.push(`${kind}${id ? ` ${id}` : ""}: clipped left (${Math.round(bb.x)} < ${vb.x})`);
    }
    if (bb.y < vb.y - margin) {
      problems.push(`${kind}${id ? ` ${id}` : ""}: clipped top (${Math.round(bb.y)} < ${vb.y})`);
    }
    if (bb.x + bb.width > vbRight + margin) {
      problems.push(`${kind}${id ? ` ${id}` : ""}: clipped right (${Math.round(bb.x + bb.width)} > ${vbRight})`);
    }
    if (bb.y + bb.height > vbBottom + margin) {
      problems.push(`${kind}${id ? ` ${id}` : ""}: clipped bottom (${Math.round(bb.y + bb.height)} > ${vbBottom})`);
    }
  }

  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const a = boxes[i].bb;
      const b = boxes[j].bb;
      const overlap =
        a.x < b.x + b.width - 2 &&
        a.x + a.width > b.x + 2 &&
        a.y < b.y + b.height - 2 &&
        a.y + a.height > b.y + 2;
      if (!overlap) continue;
      const noCollisionPairs = new Set(["arrow"]);
      if (noCollisionPairs.has(boxes[i].kind) || noCollisionPairs.has(boxes[j].kind)) continue;
      if (boxes[i].kind === "arrow" || boxes[j].kind === "arrow") continue;

      const textKinds = new Set(["text", "branch-label", "title", "annotation", "interpretation"]);
      const aText = textKinds.has(boxes[i].kind);
      const bText = textKinds.has(boxes[j].kind);
      if (aText && bText) {
        problems.push(`text/text collision: ${boxes[i].id || boxes[i].kind} vs ${boxes[j].id || boxes[j].kind}`);
      } else if (boxes[i].kind === "node" || boxes[j].kind === "node") {
        const other = boxes[i].kind === "node" ? boxes[j] : boxes[i];
        if (other.kind === "branch-label" || other.kind === "fragment") {
          problems.push(`node collision: ${boxes[i].id || boxes[j].id} with ${other.kind}`);
        }
      } else if (boxes[i].kind === "fragment" || boxes[j].kind === "fragment") {
        if (boxes[i].kind === "fragment" && boxes[j].kind === "fragment") {
          problems.push(`fragment collision: ${boxes[i].id || boxes[i].kind} vs ${boxes[j].id || boxes[j].kind}`);
        }
      }
    }
  }

  const styles = getComputedStyle(svg);
  const fsPx = parseFloat(styles.fontSize);
  if (fsPx && fsPx < minFont) {
    problems.push(`rendered font ${fsPx}px below minimum ${minFont}px`);
  }

  const root = document.documentElement;
  if (root.scrollWidth > root.clientWidth + 2) {
    problems.push(`horizontal scroll ${root.scrollWidth} > ${root.clientWidth}`);
  }

  const svgRect = svg.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  if (svgRect.right > viewportWidth + 2) {
    problems.push(`svg box overflow right ${Math.round(svgRect.right)} > ${viewportWidth}`);
  }

  return problems;
}

export async function validateSvgViewport(svgPath, options = {}) {
  const widths = options.widths || SVG_VIEWPORT_WIDTHS;
  const svgContent = fs.readFileSync(svgPath, "utf8");
  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch();
  const errors = [];
  const details = [];

  try {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 1400 } });
      const html = svgValidationWrapperHtml(svgContent, width);
      const tmp = path.join(path.dirname(svgPath), `.viewport-${width}.html`);
      fs.writeFileSync(tmp, html);
      await page.goto(pathToFileURL(tmp).href, { waitUntil: "networkidle" });
      const issues = await page.evaluate(evaluateViewportIssues, {
        margin: VIEWBOX_MARGIN,
        minFont: MIN_RENDERED_FONT,
      });
      for (const issue of issues) {
        errors.push(`${path.basename(svgPath)} @ ${width}px: ${issue}`);
      }
      details.push({ width, issues });
      fs.unlinkSync(tmp);
    }
  } finally {
    await browser.close();
  }

  return { ok: errors.length === 0, errors, widths, details };
}

function pngSuffix(width) {
  if (width === 2400) return "desktop-2400";
  if (width === 375) return "mobile-375";
  if (width === 530) return "word-530";
  return `viewport-${width}`;
}

/** Capture SVG at responsive widths — clips to `.wrap` so wide graphs do not leave empty page chrome. */
export async function captureResponsiveSvgPng(svgPath, outDir, base, widths = SVG_VIEWPORT_WIDTHS) {
  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch();
  const svg = fs.readFileSync(svgPath, "utf8");
  const paths = {};
  fs.mkdirSync(outDir, { recursive: true });

  try {
    for (const width of widths) {
      const suffix = pngSuffix(width);
      const pngPath = path.join(outDir, `${base}-${suffix}.png`);
      const htmlPath = path.join(outDir, `.cap-${width}.html`);
      fs.writeFileSync(htmlPath, svgWrapperHtml(svg, width));
      const page = await browser.newPage({ viewport: { width, height: 1200 } });
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
      const wrap = page.locator(".wrap");
      await wrap.screenshot({ path: pngPath, type: "png" });
      paths[width] = pngPath;
      fs.unlinkSync(htmlPath);
    }
  } finally {
    await browser.close();
  }

  return paths;
}
