/**
 * W1 visual audit report — candidate hashes, surface metrics, no snapshot updates.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { VCCK_POSITIVE, VCCK_REPORTS, getVcckOutputDir } from "./paths.js";
import { W1_FAMILIES } from "./w1-constants.js";
import { W1_SURFACE_CONTRACT } from "./w1-surface.js";
import { buildW1GallerySection } from "./w1-gallery.js";
import { computeW1MissionVerdictFromPipeline, assertW1VerdictPublicationCoherence } from "./w1-verdict.js";
import { W1_AUDIT_PNG_WIDTHS, W1_EXPECTED_PNG_PROOF_COUNT, W1_APPROVED_POSITIVES } from "./w1-snapshots.js";
import { W1_CANDIDATE_PNG_MANIFEST } from "./w1-approved-png.js";
import { assertReportManifestCoherence, computeW1BitmapProofSummary } from "./w1-determinism-report.js";

const AUDIT_WIDTHS = W1_AUDIT_PNG_WIDTHS;

function sha256File(filePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function collectFixtureMetrics(familyId, variant, outputRoot) {
  const stem = `${familyId}-${variant}`;
  const outDir = path.join(getVcckOutputDir(outputRoot), familyId, stem);
  const rows = [];
  for (const w of AUDIT_WIDTHS) {
    const png = path.join(outDir, `capture-${w}.png`);
    if (!fs.existsSync(png)) {
      rows.push({ width: w, missing: true });
      continue;
    }
    rows.push({
      width: w,
      hash: sha256File(png),
      bytes: fs.statSync(png).size,
      path: png,
    });
  }
  return { stem, outDir, rows };
}

export function buildW1VisualAuditReport(options = {}) {
  const outputRoot = options.outputRoot ?? null;
  const familyResults = options.familyResults || {};
  const lines = [
    "# VCCK W1.4 — Rapport audit visuel (candidat)",
    "",
    `Contrat surface: **${W1_SURFACE_CONTRACT.version}**`,
    `- Largeurs PNG autoritaires: ${AUDIT_WIDTHS.join(", ")} px`,
    `- Inventaire nominal: ${W1_EXPECTED_PNG_PROOF_COUNT} captures (${W1_APPROVED_POSITIVES?.length ?? 8} fixtures × ${AUDIT_WIDTHS.length} largeurs)`,
    `- SVG max-width: ${W1_SURFACE_CONTRACT.svgMaxDisplayWidth}px`,
    `- HTML max reading width: ${W1_SURFACE_CONTRACT.htmlMaxReadingWidth}px`,
    `- Seuil ratio contenu/capture: ${W1_SURFACE_CONTRACT.minContentCaptureRatio}`,
    "",
    "**Référence approuvée (`w1-approved-png-hashes.json`) non modifiée par le run normal.**",
    "**Manifeste candidat régénérable : `w1-candidate-hashes.json`.**",
    "",
  ];

  const inventory = [];

  for (const family of W1_FAMILIES) {
    lines.push(`## ${family}`);
    lines.push("");
    for (const variant of ["short", "long"]) {
      const { stem, rows } = collectFixtureMetrics(family, variant, outputRoot);
      lines.push(`### ${stem}`);
      lines.push("");
      lines.push("| Largeur | Hash candidat | Taille PNG |");
      lines.push("|---------|---------------|------------|");
      for (const row of rows) {
        if (row.missing) {
          lines.push(`| ${row.width}px | _absent_ | — |`);
        } else {
          lines.push(`| ${row.width}px | \`${row.hash.slice(0, 16)}…\` | ${row.bytes} B |`);
          inventory.push({
            family,
            fixture: stem,
            width: row.width,
            hash: row.hash,
            bytes: row.bytes,
          });
        }
      }
      lines.push("");

      const fr = familyResults[family]?.positive?.find((p) => p.fixture === `${stem}.yaml`);
      if (fr?.surfaceMetrics?.length) {
        lines.push("Métriques surface (extrait) :");
        lines.push("");
        lines.push("| Largeur | Capture | Contenu | Ratio | Éléments | SVG rendu |");
        lines.push("|---------|---------|---------|-------|----------|-----------|");
        for (const m of fr.surfaceMetrics.filter((x) => AUDIT_WIDTHS.includes(Number(x.width)))) {
          lines.push(
            `| ${m.width}px | ${m.captureRect?.width}×${m.captureRect?.height} | ${m.contentRect?.width}×${m.contentRect?.height} | ${(m.ratio ?? m.contentCaptureRatio)?.toFixed(3)} | ${m.elementCount} | ${m.renderedSvgWidth ?? "—"} |`,
          );
        }
        lines.push("");
      }
    }
  }

  const verdict = computeW1MissionVerdictFromPipeline(familyResults, {
    outputRoot,
    ...(options.w1Context || {}),
  });
  const bitmap = computeW1BitmapProofSummary({ outputRoot });
  lines.push("## Preuves bitmap");
  lines.push("");
  lines.push(`- nominalProofCount: ${bitmap.nominalProofCount}`);
  lines.push(`- distinctBitmapCount: ${bitmap.distinctBitmapCount}`);
  lines.push(`- stableAfterMaxWidth: ${bitmap.stableAfterMaxWidth}`);
  lines.push(`- perceptualApproval768: ${verdict.perceptualApproval768}`);
  lines.push(`- perceptualApprovalHtmlCandidates: ${verdict.perceptualApprovalHtmlCandidates}`);
  lines.push(`- approvedPngDrift: ${verdict.approvedPngDrift}`);
  lines.push(`- artifactSnapshotDrift: ${verdict.artifactSnapshotDrift}`);
  lines.push(`- responsiveTestsExecuted: ${verdict.responsiveTestsExecuted}`);
  lines.push(`- responsiveTestsPass: ${verdict.responsiveTestsPass}`);
  lines.push("");

  lines.push("## Verdict mission");
  lines.push("");
  lines.push(`**${verdict.missionVerdict}**`);
  lines.push("");
  for (const f of verdict.perFamily) {
    const gateSummary = Object.entries(f.gates || {})
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    lines.push(
      `- ${f.familyId}: ${f.status}${f.failed.length ? ` (failed: ${f.failed.join(", ")})` : ""} [${gateSummary}]`,
    );
  }

  const galleryGates = Object.fromEntries(
    W1_FAMILIES.map((id) => {
      const fv = verdict.perFamily.find((f) => f.familyId === id);
      return [
        id,
        {
          gates: fv?.gates || {},
          verdict: fv?.status || "EXPERIMENTAL",
        },
      ];
    }),
  );
  const coherence = assertW1VerdictPublicationCoherence(verdict, {
    ...galleryGates,
    missionVerdict: verdict.missionVerdict,
  });
  if (!coherence.ok) {
    lines.push("", "## Erreurs cohérence publication", "");
    for (const e of coherence.errors) lines.push(`- ${e}`);
  }

  const manifestCoherence = assertReportManifestCoherence(inventory, W1_CANDIDATE_PNG_MANIFEST);
  if (!manifestCoherence.ok) {
    lines.push("", "## Erreurs cohérence manifeste", "");
    for (const e of manifestCoherence.errors) lines.push(`- ${e}`);
  }

  return {
    markdown: lines.join("\n"),
    inventory,
    verdict: verdict.missionVerdict,
    structuredVerdict: verdict,
    bitmapSummary: bitmap,
    gallerySection: buildW1GallerySection(galleryGates, {
      outputRoot,
      galleryDir: path.join(getVcckOutputDir(outputRoot), "..", "gallery"),
    }),
  };
}

export function writeW1VisualAuditReport(options = {}) {
  const report = buildW1VisualAuditReport(options);
  fs.mkdirSync(VCCK_REPORTS, { recursive: true });
  const mdPath = path.join(VCCK_REPORTS, "w1-visual-audit-report.md");
  fs.writeFileSync(mdPath, report.markdown);
  fs.writeFileSync(
    path.join(VCCK_REPORTS, "w1-candidate-hashes.json"),
    JSON.stringify({ contract: W1_SURFACE_CONTRACT.version, candidates: report.inventory }, null, 2),
  );
  return { ...report, mdPath };
}
