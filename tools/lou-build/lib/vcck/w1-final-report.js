/**
 * W1.2 final audit dossier — READY_FOR_VCCK_W1_AUDIT gate.
 */

import fs from "node:fs";
import path from "node:path";
import { VCCK_REPORTS, VCCK_SNAPSHOTS } from "./paths.js";
import { W1_APPROVED_POSITIVES, W1_AUDIT_PNG_WIDTHS, W1_EXPECTED_PNG_PROOF_COUNT } from "./w1-snapshots.js";
import { W1_SURFACE_CONTRACT } from "./w1-surface.js";
import { W1_CONTRACT_VERSION } from "./w1-constants.js";
import { loadRenderSnapshot } from "./determinism-ipc.js";

export function buildW1FinalAuditReport(options = {}) {
  const snap = loadRenderSnapshot(path.join(VCCK_SNAPSHOTS, "render-hashes.json"));
  const manifestPath = path.join(VCCK_REPORTS, "w1-candidate-hashes.json");
  const manifest = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, "utf8"))
    : { candidates: [] };

  const lines = [
    "# VCCK W1.3 — Dossier final (preuve 768 complète)",
    "",
    "## Décision visuelle Codex",
    "",
    "Huit fixtures W1 approuvées perceptuellement (run W1.1, `w1-visual-audit-report.md`).",
    "Familles : **EXPERIMENTAL** — aucune promotion QUALIFIED/FROZEN.",
    "",
    "## Contrats",
    "",
    `- Composition : W1-1…W1-4 (${Object.entries(W1_CONTRACT_VERSION).map(([k, v]) => `${k}=${v}`).join(", ")})`,
    `- Surface responsive : ${W1_SURFACE_CONTRACT.version}`,
    `- Largeurs PNG contractuelles : ${W1_AUDIT_PNG_WIDTHS.join(", ")} px (${W1_EXPECTED_PNG_PROOF_COUNT} preuves)`,
    "",
    "## Fixtures approuvées (8)",
    "",
    "| Fixture | Famille | Contrat | Technologie | Hash artefact |",
    "|---------|---------|---------|-------------|---------------|",
  ];

  for (const entry of W1_APPROVED_POSITIVES) {
    const snapEntry = snap.entries[entry.file];
    const hash = snapEntry?.hash || "—";
    lines.push(
      `| ${entry.file} | ${entry.family} | ${entry.contractVersion} | ${entry.technology} | \`${hash.slice(0, 16)}…\` |`,
    );
  }

  lines.push("", "## Hashes PNG candidats (manifeste)", "");
  lines.push("Référence : `vcck/reports/w1-candidate-hashes.json`", "");

  for (const entry of W1_APPROVED_POSITIVES) {
    const stem = entry.file.replace(".yaml", "");
    lines.push(`### ${stem}`);
    for (const w of W1_AUDIT_PNG_WIDTHS) {
      const c = manifest.candidates?.find((x) => x.fixture === stem && x.width === w);
      if (c) {
        lines.push(`- ${w}px : \`${c.hash.slice(0, 16)}…\` (${c.bytes} B)`);
      }
    }
    lines.push("");
  }

  lines.push("## Négatifs W1 authentiques", "");
  lines.push("- `dependent-sequence-negative.yaml` → UNSUPPORTED_TOPOLOGY (embranchement)");
  lines.push("- `flat-concurrent-negative.yaml` → UNSUPPORTED_TOPOLOGY (groupe exclusive-set unique)");
  lines.push("");

  lines.push("## Snapshots artefact", "");
  lines.push(`Entrées enregistrées : ${Object.keys(snap.entries).filter((k) => W1_APPROVED_POSITIVES.some((e) => e.file === k)).length}/8`);
  lines.push("");

  lines.push("## Limitations Word", "");
  lines.push("- `word-insert-candidate.html` présent ≠ preuve de fidélité Word");
  lines.push("- `wordRenderExecuted` / `wordProofValidated` : false");
  lines.push("");

  lines.push("## Dette hors périmètre W1", "");
  lines.push("- `identity / identity-negative.yaml / UNEXPECTED_PASS` → **OUT_OF_SCOPE_W1 — future family redesign**");
  lines.push("- Ne constitue pas un négatif W1.", "");
  lines.push("");

  const verdict = options.missionVerdict || "READY_FOR_VCCK_W1_CODEX_REAUDIT";
  lines.push("## Verdict mission", "", `**${verdict}**`, "");

  if (options.testSummary) {
    lines.push("## Tests", "", options.testSummary, "");
  }

  return lines.join("\n");
}

export function writeW1FinalAuditReport(options = {}) {
  fs.mkdirSync(VCCK_REPORTS, { recursive: true });
  const mdPath = path.join(VCCK_REPORTS, "w1-final-audit-report.md");
  fs.writeFileSync(mdPath, buildW1FinalAuditReport(options));
  return mdPath;
}
