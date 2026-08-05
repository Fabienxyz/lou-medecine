/**
 * Capture HTML visual artifacts to PNG via Playwright (lou-build dependency).
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { resolvePlaywright } from "./playwright.js";

/** Widths captured for review artifacts (includes diffusion 2400 px). */
export const CAPTURE_WIDTHS = [375, 530, 768, 1280, 2400];

export async function captureHtmlPng(htmlPath, pngPath, { width, height = null, fullPage = true }) {
  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width, height: height || 900 } });
    await page.goto(pathToFileURL(path.resolve(htmlPath)).href, { waitUntil: "networkidle" });
    await page.screenshot({
      path: pngPath,
      fullPage,
      type: "png",
    });
  } finally {
    await browser.close();
  }
}

function captureSuffix(width) {
  if (width === 2400) return "desktop-2400";
  if (width === 375) return "mobile-375";
  if (width === 530) return "word-530";
  return `viewport-${width}`;
}

export async function captureVisualVariants(htmlPath, outDir, baseName) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(path.join(outDir, "crops"), { recursive: true });

  const paths = {};
  for (const width of CAPTURE_WIDTHS) {
    const filePath = path.join(outDir, `${baseName}-${captureSuffix(width)}.png`);
    await captureHtmlPng(htmlPath, filePath, { width, fullPage: true });
    paths[width] = filePath;
  }

  const primary = path.join(outDir, `${baseName}.png`);
  fs.copyFileSync(paths[2400], primary);

  const reportsWordCrop = path.join(outDir, "crops", `${baseName}-word-insert.png`);
  fs.copyFileSync(paths[530], reportsWordCrop);

  return {
    desktop: paths[1280],
    desktop768: paths[768],
    desktop2400: paths[2400],
    mobile: paths[375],
    wordCrop: reportsWordCrop,
    word530: paths[530],
    byWidth: paths,
    primary,
  };
}
