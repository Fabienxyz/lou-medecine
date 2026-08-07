/**
 * W1 surface contract — responsive SVG/HTML wrappers, content-bounded capture, metrics.
 * Version W1-S1: max display width, centered composition, content/capture ratio gates.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { resolvePlaywright } from "../playwright.js";
import { evaluateViewportIssues, SVG_VIEWPORT_WIDTHS } from "../svg-viewport-validate.js";
import { W1_VIEWPORT_WIDTHS } from "./w1-constants.js";

/** Versioned surface contract — typography lives in SVG plan, not viewport scale. */
export const W1_SURFACE_CONTRACT = Object.freeze({
  version: "W1-S1",
  svgMaxDisplayWidth: 640,
  htmlMaxReadingWidth: 720,
  surfacePaddingPx: 16,
  /** Minimum fraction of capture pixels covered by observed content bbox. */
  minContentCaptureRatio: 0.08,
  minObservedElements: 1,
});

const VIEWBOX_MARGIN = 4;
const MIN_RENDERED_FONT = 10;

export function w1SvgWrapperHtml(svgContent, viewportWidth) {
  const maxW = W1_SURFACE_CONTRACT.svgMaxDisplayWidth;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:#fff}
.vg-w1-capture-root{width:${viewportWidth}px;max-width:100%;box-sizing:border-box;display:flex;justify-content:center;background:#fff;padding:${W1_SURFACE_CONTRACT.surfacePaddingPx}px}
.vg-w1-svg-frame{width:100%;max-width:${maxW}px;margin:0 auto}
.vg-w1-svg-frame svg{display:block;width:100%;height:auto;max-width:100%}
</style></head><body><div class="vg-w1-capture-root" data-w1-surface="${W1_SURFACE_CONTRACT.version}"><div class="vg-w1-svg-frame">${svgContent}</div></div></body></html>`;
}

export function w1SvgValidationWrapperHtml(svgContent, viewportWidth) {
  const maxW = W1_SURFACE_CONTRACT.svgMaxDisplayWidth;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;overflow:visible;background:#fff}
.vg-w1-capture-root{width:${viewportWidth}px;max-width:100%;box-sizing:border-box;display:flex;justify-content:center;overflow:visible;padding:${W1_SURFACE_CONTRACT.surfacePaddingPx}px;background:#fff}
.vg-w1-svg-frame{width:100%;max-width:${maxW}px;margin:0 auto;overflow:visible}
.vg-w1-svg-frame svg{display:block;width:100%;height:auto;max-width:100%;overflow:visible}
</style></head><body><div class="vg-w1-capture-root"><div class="vg-w1-svg-frame">${svgContent}</div></div></body></html>`;
}

export const W1_HTML_SURFACE_CSS = `
body{margin:0;padding:0;overflow-x:hidden;background:#fff}
.vg-w1-capture-root{width:min(100%,${W1_SURFACE_CONTRACT.htmlMaxReadingWidth + 2 * W1_SURFACE_CONTRACT.surfacePaddingPx}px);margin:0 auto;padding:${W1_SURFACE_CONTRACT.surfacePaddingPx}px;background:#fff;box-sizing:border-box}
.vg-w1-composition{max-width:${W1_SURFACE_CONTRACT.htmlMaxReadingWidth}px;margin:0 auto;width:100%}
.vg-w1-composition .vg-visual{max-width:100%}
.vg-w1-grid{display:grid;grid-template-columns:repeat(var(--vg-cols-mobile,1),minmax(0,1fr));gap:0.75rem;list-style:none;padding:0;margin:0}
.vg-w1-grid li{margin:0;padding:0.625rem 0.75rem;border:1px solid var(--vg-border,#e5e7eb);border-radius:6px;background:var(--vg-surface,#f9fafb);line-height:1.4}
.vg-matrix-card{border:1px solid var(--vg-border,#e5e7eb);margin-bottom:0.75rem;padding:0.75rem;border-radius:4px}
.vg-matrix-card h4{margin:0 0 0.5rem;font-size:0.9375rem;font-weight:600}
.vg-matrix-card ul{margin:0;padding-left:1.25rem}
`;

function evaluateW1SurfaceMetrics() {
  function isDomVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 && rect.height <= 0) return false;
    return el.getClientRects().length > 0;
  }

  const root = document.querySelector(".vg-w1-capture-root");
  if (!root) return { error: "missing .vg-w1-capture-root" };

  const captureRect = root.getBoundingClientRect();
  const svg = root.querySelector("svg");
  const composition = root.querySelector(".vg-w1-composition") || root.querySelector(".vg-w1-svg-frame") || root;

  let contentRect = composition.getBoundingClientRect();
  let elementCount = 0;

  if (svg) {
    const nodes = [...svg.querySelectorAll("[data-node-id]")].filter(isDomVisible);
    const titles = [...svg.querySelectorAll(".vg-title")].filter(isDomVisible);
    const edges = [...svg.querySelectorAll('[data-layer="relations"] path[data-edge-id]')].filter(isDomVisible);
    elementCount = nodes.length + titles.length + edges.length;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    const collect = (el) => {
      try {
        const bb = el.getBBox();
        if (bb.width <= 0 && bb.height <= 0) return;
        minX = Math.min(minX, bb.x);
        minY = Math.min(minY, bb.y);
        maxX = Math.max(maxX, bb.x + bb.width);
        maxY = Math.max(maxY, bb.y + bb.height);
      } catch {
        /* skip */
      }
    };
    nodes.forEach(collect);
    titles.forEach(collect);
    edges.forEach(collect);
    if (Number.isFinite(minX)) {
      const pt = svg.createSVGPoint();
      const ctm = svg.getScreenCTM();
      if (ctm) {
        const corners = [
          { x: minX, y: minY },
          { x: maxX, y: minY },
          { x: maxX, y: maxY },
          { x: minX, y: maxY },
        ];
        let sMinX = Infinity;
        let sMinY = Infinity;
        let sMaxX = -Infinity;
        let sMaxY = -Infinity;
        for (const c of corners) {
          pt.x = c.x;
          pt.y = c.y;
          const sp = pt.matrixTransform(ctm);
          sMinX = Math.min(sMinX, sp.x);
          sMinY = Math.min(sMinY, sp.y);
          sMaxX = Math.max(sMaxX, sp.x);
          sMaxY = Math.max(sMaxY, sp.y);
        }
        contentRect = {
          x: sMinX,
          y: sMinY,
          width: sMaxX - sMinX,
          height: sMaxY - sMinY,
          left: sMinX,
          top: sMinY,
          right: sMaxX,
          bottom: sMaxY,
        };
      }
    }
  } else {
    const items = [...root.querySelectorAll(
      "[data-item-id], .vg-matrix-desktop th, .vg-matrix-desktop td, .vg-matrix-card, .vg-question, .vg-enum-frame",
    )].filter(isDomVisible);
    elementCount = items.length;
    if (items.length) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const el of items) {
        const r = el.getBoundingClientRect();
        if (r.width <= 0 && r.height <= 0) continue;
        minX = Math.min(minX, r.left);
        minY = Math.min(minY, r.top);
        maxX = Math.max(maxX, r.right);
        maxY = Math.max(maxY, r.bottom);
      }
      if (Number.isFinite(minX)) {
        contentRect = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          left: minX,
          top: minY,
          right: maxX,
          bottom: maxY,
        };
      }
    }
  }

  const captureArea = Math.max(1, captureRect.width * captureRect.height);
  const contentArea = Math.max(0, contentRect.width * contentRect.height);
  const contentCaptureRatio = contentArea / captureArea;

  const frame = root.querySelector(".vg-w1-svg-frame") || root.querySelector(".vg-w1-composition");
  const maxWidthApplied = frame
    ? parseFloat(getComputedStyle(frame).maxWidth) || W1_SURFACE_CONTRACT.svgMaxDisplayWidth
    : W1_SURFACE_CONTRACT.htmlMaxReadingWidth;

  const svgEl = root.querySelector("svg");
  const renderedSvgWidth = svgEl ? svgEl.getBoundingClientRect().width : null;

  return {
    contentRect: {
      width: Math.round(contentRect.width),
      height: Math.round(contentRect.height),
    },
    captureRect: {
      width: Math.round(captureRect.width),
      height: Math.round(captureRect.height),
    },
    contentCaptureRatio,
    maxWidthApplied,
    usefulHeight: Math.round(captureRect.height),
    elementCount,
    renderedSvgWidth: renderedSvgWidth != null ? Math.round(renderedSvgWidth) : null,
  };
}

export function validateW1SurfaceMetrics(metrics) {
  const errors = [];
  if (!metrics || metrics.error) {
    errors.push(metrics?.error || "missing surface metrics");
    return { ok: false, errors, metrics };
  }
  if (metrics.elementCount < W1_SURFACE_CONTRACT.minObservedElements) {
    errors.push(`zero observed elements (${metrics.elementCount})`);
  }
  if (metrics.contentCaptureRatio < W1_SURFACE_CONTRACT.minContentCaptureRatio) {
    errors.push(
      `content/capture ratio ${metrics.contentCaptureRatio.toFixed(3)} below minimum ${W1_SURFACE_CONTRACT.minContentCaptureRatio} — capture mostly empty`,
    );
  }
  return { ok: errors.length === 0, errors, metrics };
}

export async function validateW1SvgViewport(svgPath, options = {}) {
  const widths = options.widths || W1_VIEWPORT_WIDTHS;
  const svgContent = fs.readFileSync(svgPath, "utf8");
  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch();
  const errors = [];
  const details = [];

  try {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 1400 } });
      const html = w1SvgValidationWrapperHtml(svgContent, width);
      const tmp = path.join(path.dirname(svgPath), `.w1-viewport-${width}.html`);
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

export async function captureW1SvgPngs(svgPath, outDir, base, widths = W1_VIEWPORT_WIDTHS) {
  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch();
  const svg = fs.readFileSync(svgPath, "utf8");
  const paths = {};
  const metricsByWidth = {};
  fs.mkdirSync(outDir, { recursive: true });

  try {
    for (const width of widths) {
      const suffix = pngSuffix(width);
      const pngPath = path.join(outDir, `${base}-${suffix}.png`);
      const htmlPath = path.join(outDir, `.w1-cap-${width}.html`);
      fs.writeFileSync(htmlPath, w1SvgWrapperHtml(svg, width));
      const page = await browser.newPage({ viewport: { width, height: 800 } });
      await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
      const root = page.locator(".vg-w1-capture-root");
      await root.screenshot({ path: pngPath, type: "png" });
      metricsByWidth[width] = await page.evaluate(evaluateW1SurfaceMetrics);
      paths[width] = pngPath;
      fs.unlinkSync(htmlPath);
    }
  } finally {
    await browser.close();
  }

  return { paths, metricsByWidth };
}


/** Measure rendered SVG width at a viewport — for responsive regression tests. */
export async function measureW1SvgRenderedWidth(svgContent, viewportWidth) {
  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: viewportWidth, height: 800 } });
    const html = w1SvgValidationWrapperHtml(svgContent, viewportWidth);
    const tmp = path.join(process.cwd(), `.w1-measure-${viewportWidth}.html`);
    fs.writeFileSync(tmp, html);
    await page.goto(pathToFileURL(tmp).href, { waitUntil: "networkidle" });
    const width = await page.evaluate(() => {
      const svg = document.querySelector("svg");
      return svg ? Math.round(svg.getBoundingClientRect().width) : 0;
    });
    fs.unlinkSync(tmp);
    return width;
  } finally {
    await browser.close();
  }
}

export { evaluateW1SurfaceMetrics, SVG_VIEWPORT_WIDTHS, W1_VIEWPORT_WIDTHS };
