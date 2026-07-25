import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Extract positioned text items from a born-digital PDF.
 * Output is a deterministic page → item list (sorted later by normalize).
 *
 * @param {string} pdfPath
 * @param {{ onProgress?: (page: number, total: number) => void }} [options]
 */
export async function extractPdf(pdfPath, options = {}) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const loadingTask = getDocument({
    data,
    useSystemFonts: true,
    // Deterministic: do not fetch external fonts/resources.
    disableFontFace: true,
    isEvalSupported: false,
    stopAtErrors: false,
  });

  const doc = await loadingTask.promise;
  const numPages = doc.numPages;
  /** @type {import('./types.js').ExtractedPage[]} */
  const pages = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    if (options.onProgress) options.onProgress(pageNum, numPages);
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent({
      includeMarkedContent: false,
      disableNormalization: false,
    });

    const items = [];
    for (const raw of content.items) {
      if (!raw || typeof raw.str !== "string") continue;
      // Skip purely empty strings; keep whitespace-only that may be word gaps.
      if (raw.str.length === 0) continue;

      const t = raw.transform;
      // transform = [scaleX, skewY, skewX, scaleY, tx, ty]
      const fontSize = hypot(t[2], t[3]);
      items.push({
        str: raw.str,
        x: round3(t[4]),
        y: round3(t[5]),
        width: round3(raw.width ?? 0),
        height: round3(raw.height ?? fontSize),
        fontSize: round3(fontSize),
        fontName: String(raw.fontName || ""),
        // hasEOL is present on some pdf.js versions
        hasEOL: Boolean(raw.hasEOL),
      });
    }

    pages.push({
      pageNumber: pageNum,
      width: round3(viewport.width),
      height: round3(viewport.height),
      items,
    });
  }

  await doc.destroy();

  return {
    pdfPath,
    numPages,
    pages,
  };
}

function hypot(a, b) {
  return Math.sqrt(a * a + b * b);
}

function round3(n) {
  return Math.round(Number(n) * 1000) / 1000;
}

/**
 * Optional: resolve worker source for environments that need it.
 * Legacy build used above typically does not require a separate worker in Node.
 */
export function pdfWorkerUrl() {
  return pathToFileURL(
    new URL("../node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url)
      .pathname
  ).href;
}
