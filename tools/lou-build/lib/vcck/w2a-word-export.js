/**
 * Word HD PNG export — native-resolution capture for Codex Word integration.
 * No artificial upscale: render at intrinsic/large viewport with deviceScaleFactor.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { resolvePlaywright } from "../playwright.js";

export const WORD_HD_EXPORT = Object.freeze({
  deviceScaleFactor: 2,
  contentPaddingPx: 16,
  minRenderedFontPx: 14,
  htmlViewportWidth: 1200,
  minPngWidthPx: 800,
});

function parseSvgDimensions(svgText) {
  const vb = svgText.match(/viewBox="0 0 (\d+(?:\.\d+)?) (\d+(?:\.\d+)?)"/);
  if (vb) {
    return { width: Math.ceil(parseFloat(vb[1])), height: Math.ceil(parseFloat(vb[2])) };
  }
  const w = svgText.match(/\bwidth="(\d+(?:\.\d+)?)"/);
  const h = svgText.match(/\bheight="(\d+(?:\.\d+)?)"/);
  return {
    width: Math.ceil(parseFloat(w?.[1] || 800)),
    height: Math.ceil(parseFloat(h?.[1] || 600)),
  };
}

function svgCaptureHtml(svgContent) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:#fff;overflow:hidden}
svg{display:block;max-width:none!important;width:auto!important;height:auto!important}
</style></head><body>${svgContent}</body></html>`;
}

/** Measure content bounds and minimum rendered font in browser context. */
function measureExportMetrics() {
  function visible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  }

  let minFont = Infinity;
  const textEls = document.querySelectorAll("text, tspan, p, li, h1, h2, h3, h4, span, td, th");
  for (const el of textEls) {
    if (!visible(el)) continue;
    const t = (el.textContent || "").trim();
    if (!t) continue;
    const fs = parseFloat(window.getComputedStyle(el).fontSize);
    if (fs > 0) minFont = Math.min(minFont, fs);
  }

  const root = document.querySelector("svg") || document.querySelector(".vg-visual") || document.body;
  const rect = root.getBoundingClientRect();
  return {
    bounds: {
      x: Math.max(0, Math.floor(rect.x)),
      y: Math.max(0, Math.floor(rect.y)),
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
    },
    minFontPx: Number.isFinite(minFont) ? minFont : null,
  };
}

export async function captureWordHdSvg(svgPath, pngPath, options = {}) {
  const cfg = { ...WORD_HD_EXPORT, ...options };
  const svg = fs.readFileSync(svgPath, "utf8");
  const dims = parseSvgDimensions(svg);
  const pad = cfg.contentPaddingPx;
  const tmp = `${pngPath}.capture.html`;
  fs.mkdirSync(path.dirname(pngPath), { recursive: true });
  fs.writeFileSync(tmp, svgCaptureHtml(svg));

  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: dims.width + pad * 2, height: dims.height + pad * 2 },
      deviceScaleFactor: cfg.deviceScaleFactor,
    });
    await page.goto(pathToFileURL(path.resolve(tmp)).href, { waitUntil: "networkidle" });
    const metrics = await page.evaluate(measureExportMetrics);
    const clip = {
      x: metrics.bounds.x,
      y: metrics.bounds.y,
      width: Math.max(metrics.bounds.width, 1),
      height: Math.max(metrics.bounds.height, 1),
    };
    await page.locator("svg").screenshot({ path: pngPath, clip, type: "png" });
    return {
      ...metrics,
      intrinsicWidth: dims.width,
      intrinsicHeight: dims.height,
      outputWidth: Math.round(clip.width * cfg.deviceScaleFactor),
      outputHeight: Math.round(clip.height * cfg.deviceScaleFactor),
    };
  } finally {
    await browser.close();
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

export async function captureWordHdArtifact(artifactPath, pngPath, _kind = "svg", options = {}) {
  return captureWordHdSvg(artifactPath, pngPath, options);
}

export function validateWordHdMetrics(metrics, options = {}) {
  const minFont = options.minRenderedFontPx ?? WORD_HD_EXPORT.minRenderedFontPx;
  const minWidth = options.minPngWidthPx ?? WORD_HD_EXPORT.minPngWidthPx;
  const errors = [];
  if (!metrics?.bounds?.width || !metrics?.bounds?.height) {
    errors.push("word-hd: missing content bounds");
  }
  if (metrics?.outputWidth && metrics.outputWidth < minWidth) {
    errors.push(`word-hd: output width ${metrics.outputWidth}px below ${minWidth}px`);
  }
  if (metrics?.minFontPx != null && metrics.minFontPx < minFont) {
    errors.push(`word-hd: min font ${metrics.minFontPx}px below ${minFont}px`);
  }
  return { ok: errors.length === 0, errors };
}
