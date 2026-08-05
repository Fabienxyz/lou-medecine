/**
 * VCCK HTML gallery — optional write for dry-run/tests.
 */

import fs from "node:fs";
import path from "node:path";
import { VCCK_GALLERY, VCCK_OUTPUT, VCCK_POSITIVE, getVcckOutputDir } from "./paths.js";
import { loadFamilyRegistry } from "./registry.js";
import { analyzeSignature } from "./signature-analyzer.js";
import { loadVisualSpec } from "../visual-spec.js";
import { buildW1GallerySection } from "./w1-gallery.js";
import { computeW1MissionVerdictFromPipeline } from "./w1-verdict.js";
import { W1_FAMILIES } from "./w1-constants.js";

function rel(from, to) {
  return path.relative(from, to).split(path.sep).join("/");
}

/** Pure gallery HTML generation — no filesystem writes. */
export function buildGalleryHtml(results = null, options = {}) {
  const registry = loadFamilyRegistry();
  const outputRoot = options.outputRoot ?? null;

  const sections = registry.families.map((family) => {
    const shortPath = path.join(VCCK_POSITIVE, family.positive_fixtures.short);
    const longPath = path.join(VCCK_POSITIVE, family.positive_fixtures.long);
    let shortSig = null;
    let longSig = null;
    try {
      shortSig = analyzeSignature(loadVisualSpec(shortPath));
      longSig = analyzeSignature(loadVisualSpec(longPath));
    } catch {
      /* fixture load error surfaced in validation panel */
    }

    const outShort = path.join(
      getVcckOutputDir(outputRoot),
      family.id,
      family.positive_fixtures.short.replace(".yaml", ""),
    );
    const outLong = path.join(
      getVcckOutputDir(outputRoot),
      family.id,
      family.positive_fixtures.long.replace(".yaml", ""),
    );

    const fr = results?.familyResults?.[family.id];

    return {
      family,
      shortSig,
      longSig,
      shortImages: collectImages(outShort),
      longImages: collectImages(outLong),
      validation: fr,
    };
  });

  return renderGalleryHtml(sections, options.galleryDir || VCCK_GALLERY, results, outputRoot);
}

export function buildGallery(results = null, options = {}) {
  const write = options.write !== false;
  const galleryDir = options.galleryDir || VCCK_GALLERY;
  const html = buildGalleryHtml(results, { ...options, galleryDir });

  if (!write) return { html, path: null, written: false };

  fs.mkdirSync(galleryDir, { recursive: true });
  const outPath = path.join(galleryDir, "index.html");
  fs.writeFileSync(outPath, html);
  return outPath;
}

function collectImages(outDir) {
  if (!fs.existsSync(outDir)) return {};
  const imgs = {};
  for (const w of [375, 530, 768, 1280, 2400]) {
    const p = path.join(outDir, `capture-${w}.png`);
    if (fs.existsSync(p)) imgs[w] = p;
  }
  const candidate = path.join(outDir, "word-insert-candidate.html");
  if (fs.existsSync(candidate)) imgs.wordCandidate = candidate;
  const artifactSvg = path.join(outDir, "artifact.svg");
  const artifactHtml = path.join(outDir, "artifact.html");
  if (fs.existsSync(artifactSvg)) imgs.artifact = artifactSvg;
  if (fs.existsSync(artifactHtml)) imgs.artifact = artifactHtml;
  return imgs;
}

function renderGalleryHtml(sections, galleryDir, results = null, outputRoot = null) {
  const parts = [
    "<!DOCTYPE html>",
    "<html lang=\"fr\">",
    "<head>",
    "<meta charset=\"utf-8\">",
    "<title>VCCK — Galerie de qualification</title>",
    "<style>body{font-family:system-ui,sans-serif;margin:1rem} section{margin:1rem 0;padding:1rem;border:1px solid #e5e7eb}</style>",
    "</head><body>",
    "<h1>VCCK Gallery</h1>",
    "<main>",
  ];

  for (const s of sections) {
    const f = s.family;
    parts.push(`<section id="${f.id}"><h2>${f.id}</h2>`);
    parts.push(`<p>Primitive: ${f.primitive} · ${f.qualification_status}</p>`);
    parts.push(`<pre>${JSON.stringify(s.shortSig, null, 2)}</pre>`);
    parts.push(renderImageGrid(s.shortImages, galleryDir));
    parts.push("</section>");
  }

  parts.push("</main>");

  if (results?.familyResults) {
    const w1Verdict = computeW1MissionVerdictFromPipeline(results.familyResults, {
      outputRoot,
    });
    const w1Gates = Object.fromEntries(
      w1Verdict.perFamily.map((f) => [
        f.familyId,
        {
          gates: f.gates,
          qualificationStatus: f.qualificationStatus,
          operationalStatus: f.operationalStatus,
          verdict: f.operationalStatus,
        },
      ]),
    );
    parts.push(
      buildW1GallerySection(w1Gates, {
        outputRoot,
        galleryDir,
      }),
    );
  }

  parts.push("</body></html>");
  return parts.join("\n");
}

function renderImageGrid(images, galleryDir) {
  if (!images || !Object.keys(images).length) {
    return "<p>Rendus non générés</p>";
  }
  const parts = ['<div class="grid">'];
  for (const [key, p] of Object.entries(images)) {
    parts.push(`<figure><img src="${rel(galleryDir, p)}" alt="${key}"><figcaption>${key}</figcaption></figure>`);
  }
  parts.push("</div>");
  return parts.join("\n");
}
