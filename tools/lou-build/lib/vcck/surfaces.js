/**
 * Required surface artifact verification.
 * Contract: 180 PNG (36×5) + 36 word-insert-candidate = 216 technical inventory items.
 * Word candidate presence ≠ Word render fidelity proof.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { getVcckOutputDir, VCCK_VIEWPORT_WIDTHS } from "./paths.js";
import { CONTROL } from "./status.js";

const WIDTHS = VCCK_VIEWPORT_WIDTHS;
export const WORD_CANDIDATE_FILENAME = "word-insert-candidate.html";

/** Expected paths for one positive fixture (PNG captures + word candidate). */
export function expectedSurfacePaths(familyId, fixtureBaseName, outputRoot = null) {
  const outDir = path.join(getVcckOutputDir(outputRoot), familyId, fixtureBaseName);
  const paths = { outDir };

  for (const w of WIDTHS) {
    paths[`capture-${w}`] = path.join(outDir, `capture-${w}.png`);
  }
  paths.wordInsertCandidate = path.join(outDir, WORD_CANDIDATE_FILENAME);
  return paths;
}

/** Generate distinct Word insert candidate — NOT a byte copy of PNG 530, NOT Word fidelity proof. */
export function writeWordInsertCandidate(htmlOrSvgPath, candidatePath, width = 530) {
  const ext = path.extname(htmlOrSvgPath);
  const content = fs.readFileSync(htmlOrSvgPath, "utf8");
  const body =
    ext === ".html"
      ? content
      : `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
body{margin:0;padding:12px;font-family:system-ui,sans-serif;background:#fff}
.wrap{width:${width}px}
.wrap svg{display:block;width:100%;height:auto}
.vcck-word-banner{font-size:10px;color:#6b7280;margin-bottom:8px}
</style></head><body>
<p class="vcck-word-banner">VCCK word-insert-candidate — not a Word fidelity proof</p>
<div class="wrap">${content.includes("<svg") ? content.match(/<svg[\s\S]*<\/svg>/i)?.[0] || content : content}</div>
</body></html>`;

  fs.mkdirSync(path.dirname(candidatePath), { recursive: true });
  fs.writeFileSync(candidatePath, body);
  return candidatePath;
}

/**
 * Verify PNG captures and word-insert-candidate inventory.
 * @returns surfaces status (PNG only), wordInsertCandidate, wordRenderExecuted, wordProofValidated
 */
export function verifyFixtureSurfaces(familyId, fixtureBaseName, technology, outputRoot = null) {
  const expected = expectedSurfacePaths(familyId, fixtureBaseName, outputRoot);
  const pngMissing = [];
  const errors = [];

  for (const w of WIDTHS) {
    const p = expected[`capture-${w}`];
    if (!fs.existsSync(p)) pngMissing.push(p);
  }

  const candidatePath = expected.wordInsertCandidate;
  const candidatePresent = fs.existsSync(candidatePath);
  const wordInsertCandidate = candidatePresent ? "PRESENT" : "MISSING";

  if (candidatePresent) {
    const png530 = expected["capture-530"];
    if (fs.existsSync(png530)) {
      const pngHash = crypto.createHash("sha256").update(fs.readFileSync(png530)).digest("hex");
      const candHash = crypto.createHash("sha256").update(fs.readFileSync(candidatePath)).digest("hex");
      if (pngHash === candHash) {
        errors.push("word-insert-candidate is byte-identical to capture-530.png");
      }
    }
  }

  const pngCount = WIDTHS.length - pngMissing.length;
  const surfacesOk = pngMissing.length === 0 && errors.length === 0;

  return {
    ok: surfacesOk && candidatePresent && errors.length === 0,
    surfaces: pngMissing.length ? CONTROL.FAIL : errors.length ? CONTROL.FAIL : CONTROL.PASS,
    wordInsertCandidate,
    wordRenderExecuted: false,
    wordProofValidated: false,
    missing: [...pngMissing, ...(candidatePresent ? [] : [candidatePath])],
    errors,
    pngCount,
    candidateCount: candidatePresent ? 1 : 0,
    count: pngCount + (candidatePresent ? 1 : 0),
  };
}

/** Per-fixture contract: 5 PNG + 1 word-insert-candidate. */
export const SURFACES_PER_FIXTURE = WIDTHS.length + 1;

/** Inventory all contract surfaces across 36 positive fixtures. */
export function inventoryAllSurfaces(registry, outputRoot = null) {
  const entries = [];
  let present = 0;

  for (const family of registry.families) {
    for (const variant of ["short", "long"]) {
      const file = family.positive_fixtures[variant];
      const base = file.replace(".yaml", "");
      const v = verifyFixtureSurfaces(family.id, base, family.technology, outputRoot);
      entries.push({ family: family.id, fixture: file, ...v });
      present += v.count;
    }
  }

  return {
    expectedTotal: 36 * SURFACES_PER_FIXTURE,
    present,
    entries,
    ok: present === 36 * SURFACES_PER_FIXTURE && entries.every((e) => e.ok),
  };
}

/** @deprecated use writeWordInsertCandidate */
export const writeWordInsertArtifact = writeWordInsertCandidate;
