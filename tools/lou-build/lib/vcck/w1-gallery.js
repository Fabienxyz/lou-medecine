/**
 * W1 gallery section — derives gate status from structured verdict only.
 */

import fs from "node:fs";
import path from "node:path";
import { VCCK_VIEWPORT_WIDTHS, getVcckOutputDir } from "./paths.js";
import { W1_FAMILIES } from "./w1-constants.js";
import { W1_REQUIRED_GATES } from "./w1-gates.js";
import { getFamilyQualificationStatus } from "./w1-qualification.js";

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildW1GallerySection(w1Results = {}, options = {}) {
  const outputRoot = options.outputRoot ?? null;
  const parts = [
    '<section id="vcck-w1" class="vcck-w1-gallery">',
    "<h2>VCCK Wave 1 — Familles canoniques</h2>",
    "<p>Contrats W1-1…W1-4, CompositionPlan, cinq largeurs, charge courte/longue.</p>",
  ];

  for (const family of W1_FAMILIES) {
    const gates = w1Results[family]?.gates || w1Results[family] || {};
    const qualificationStatus =
      w1Results[family]?.qualificationStatus || getFamilyQualificationStatus(family);
    const operationalStatus =
      w1Results[family]?.operationalStatus || w1Results[family]?.status || w1Results[family]?.verdict || "BLOCKED_FOR_USE";
    parts.push(`<article data-family="${escapeHtml(family)}">`);
    parts.push(
      `<h3>${escapeHtml(family)} <span class="qualification">${escapeHtml(qualificationStatus)}</span> <span class="operational">${escapeHtml(operationalStatus)}</span></h3>`,
    );
    parts.push("<ul class=\"gates\">");
    for (const gate of W1_REQUIRED_GATES) {
      const status = gates[gate];
      if (status === undefined) continue;
      parts.push(`<li>${escapeHtml(gate)}: ${escapeHtml(String(status))}</li>`);
    }
    parts.push("</ul>");

    const positives = [`${family}-short.yaml`, `${family}-long.yaml`];
    for (const fx of positives) {
      const stem = fx.replace(".yaml", "");
      const outDir = path.join(getVcckOutputDir(outputRoot), family, stem);
      parts.push(`<h4>${escapeHtml(fx)}</h4><div class="widths">`);
      for (const w of VCCK_VIEWPORT_WIDTHS) {
        const png = path.join(outDir, `capture-${w}.png`);
        if (fs.existsSync(png)) {
          parts.push(
            `<figure><img src="${escapeHtml(path.relative(options.galleryDir || ".", png))}" alt="${w}px" width="120"><figcaption>${w}px</figcaption></figure>`,
          );
        } else {
          parts.push(`<figure><figcaption>${w}px — absent</figcaption></figure>`);
        }
      }
      parts.push("</div>");
    }
    parts.push("</article>");
  }

  parts.push("</section>");
  return parts.join("\n");
}

export function appendW1GalleryToIndex(indexHtml, w1Section) {
  if (indexHtml.includes('id="vcck-w1"')) {
    return indexHtml.replace(/<section id="vcck-w1"[\s\S]*?<\/section>/, w1Section);
  }
  return indexHtml.replace("</main>", `${w1Section}\n</main>`);
}
