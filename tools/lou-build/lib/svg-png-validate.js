/**
 * PNG capture validation — detect clipped, empty, or overlapping renders.
 */

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { resolvePlaywright } from "./playwright.js";

const EDGE_SAMPLE = 6;
const BG_TOLERANCE = 248;

/** Expect broken legacy PNG fixtures to fail validation. */
export async function expectBrokenPngFixtures(fixturePaths) {
  const outcomes = [];
  for (const p of fixturePaths) {
    const r = await validatePngCapture(p);
    outcomes.push({ path: p, failedAsExpected: !r.ok, errors: r.errors });
  }
  const allFailed = outcomes.every((o) => o.failedAsExpected);
  return { ok: allFailed, outcomes };
}

function pngValidationPageHtml(dataUrl) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;background:#fff}
canvas{display:block}
</style></head><body><canvas id="c"></canvas>
<script>
(async () => {
  const img = new Image();
  img.src = ${JSON.stringify(dataUrl)};
  await img.decode();
  const c = document.getElementById('c');
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  window.__pngStats = analyze(ctx, c.width, c.height);
  function analyze(ctx, w, h) {
    const data = ctx.getImageData(0, 0, w, h).data;
    const problems = [];
    if (w < 50 || h < 50) problems.push('abnormally small capture');
    let ink = 0;
    let edgeInk = 0;
    const edge = ${EDGE_SAMPLE};
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const lum = (data[i] + data[i+1] + data[i+2]) / 3;
        const alpha = data[i+3];
        if (alpha > 10 && lum < ${BG_TOLERANCE}) ink++;
        const onEdge = x < edge || y < edge || x >= w - edge || y >= h - edge;
        if (onEdge && alpha > 10 && lum < ${BG_TOLERANCE}) edgeInk++;
      }
    }
    const inkRatio = ink / (w * h);
    if (inkRatio < 0.005) problems.push('render appears empty');
    if (edgeInk > edge * (w + h) * 0.35) problems.push('content touching or exceeding capture edges');
    let midInk = 0;
    const mx = Math.floor(w * 0.25), my = Math.floor(h * 0.25);
    const mw = Math.floor(w * 0.5), mh = Math.floor(h * 0.5);
    for (let y = my; y < my + mh; y++) {
      for (let x = mx; x < mx + mw; x++) {
        const i = (y * w + x) * 4;
        const lum = (data[i] + data[i+1] + data[i+2]) / 3;
        if (data[i+3] > 10 && lum < ${BG_TOLERANCE}) midInk++;
      }
    }
    if (midInk < mw * mh * 0.002) problems.push('center region nearly empty — possible crop or overlap');
    return { w, h, inkRatio, problems };
  }
})();
</script></body></html>`;
}

export async function validatePngCapture(pngPath, options = {}) {
  if (!fs.existsSync(pngPath)) {
    return { ok: false, errors: [`missing png: ${pngPath}`], stats: null };
  }

  const { chromium } = resolvePlaywright();
  const browser = await chromium.launch();
  const errors = [];

  try {
    const page = await browser.newPage();
    const b64 = fs.readFileSync(pngPath).toString("base64");
    const dataUrl = `data:image/png;base64,${b64}`;
    const tmp = path.join(path.dirname(pngPath), `.pngval-${path.basename(pngPath)}.html`);
    fs.writeFileSync(tmp, pngValidationPageHtml(dataUrl));
    await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
    await page.waitForFunction(() => window.__pngStats != null, { timeout: 15000 });
    const stats = await page.evaluate(() => window.__pngStats);
    fs.unlinkSync(tmp);

    if (options.minWidth && stats.w < options.minWidth) {
      errors.push(`width ${stats.w}px below minimum ${options.minWidth}px`);
    }
    for (const p of stats.problems) {
      errors.push(p);
    }
    return { ok: errors.length === 0, errors, stats };
  } finally {
    await browser.close();
  }
}

export async function validatePngSet(pngPaths, options = {}) {
  const results = [];
  const errors = [];
  for (const entry of pngPaths) {
    const r = await validatePngCapture(entry.path, { ...options, ...entry });
    results.push({ ...entry, ...r });
    for (const e of r.errors) {
      errors.push(`${entry.label || path.basename(entry.path)}: ${e}`);
    }
  }
  return { ok: errors.length === 0, errors, results };
}
