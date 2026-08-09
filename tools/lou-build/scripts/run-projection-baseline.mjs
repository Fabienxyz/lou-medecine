#!/usr/bin/env node
/**
 * Projection Foundation — baseline / disposition reports.
 * REPORT-ONLY — never gates production.
 *
 * Usage:
 *   node scripts/run-projection-baseline.mjs [--phase p0a|p0b|dispositions] [--chapter cardio/234]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { loadYamlFile } from "../lib/anchors.js";
import { REPO_ROOT } from "../lib/paths.js";
import {
  verifyFigureProjection,
  verifyCorpusProjection,
  classifyEnumerationGaps,
  evaluateCheckpoint,
  buildDispositionAuditMatrix,
  AUTHORITATIVE_FACT_SOURCE,
} from "../lib/projection-verification.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOU_BUILD = path.join(__dirname, "..");

const CORPUS = [
  {
    id: "N09",
    specFile: "n09-diagnostic-algorithm.yaml",
    figureFile: "n09-diagnostic-algorithm.svg",
    familyIds: ["skip-level-branch", "embedded-fragment"],
  },
  {
    id: "N13-2",
    specFile: "n13-2-oap-actions.yaml",
    figureFile: "n13-2-oap-actions.svg",
    familyIds: ["dependent-sequence"],
  },
  {
    id: "N15-1",
    specFile: "n15-1-shock-support.yaml",
    figureFile: "n15-1-shock-support.svg",
    familyIds: ["dependent-sequence"],
  },
  {
    id: "N18-1",
    specFile: "n18-1-treatment-sequence.yaml",
    figureFile: "n18-1-treatment-sequence.svg",
    familyIds: ["dependent-sequence"],
  },
  {
    id: "N20-1",
    specFile: "n20-1-crt-dai-comparison.yaml",
    figureFile: "n20-1-crt-dai-comparison.svg",
    familyIds: ["two-pole"],
  },
  {
    id: "N21-1",
    specFile: "n21-1-natural-history.yaml",
    figureFile: "n21-1-natural-history.svg",
    familyIds: ["chain"],
  },
];

function parseArgs(argv) {
  const opts = { phase: "total-disposition", chapter: "01-learning/chapters/cardio/234" };
  for (let i = 2; i < argv.length; i += 1) {
    if (argv[i] === "--phase" && argv[i + 1]) {
      opts.phase = argv[i + 1].toLowerCase();
      i += 1;
    } else if (argv[i] === "--chapter" && argv[i + 1]) {
      opts.chapter = argv[i + 1];
      i += 1;
    }
  }
  return opts;
}

function runBaseline(chapterDir, phase) {
  const buildDir = path.join(chapterDir, "build");
  const specsDir = path.join(buildDir, "visual-specs");
  const figuresDir = path.join(chapterDir, "figures");
  const inventoryPath = path.join(chapterDir, "inventory.yaml");
  const inventory = fs.existsSync(inventoryPath) ? loadYamlFile(inventoryPath) : null;

  const figureReports = [];

  for (const item of CORPUS) {
    const specPath = path.join(specsDir, item.specFile);
    const figurePath = path.join(figuresDir, item.figureFile);
    if (!fs.existsSync(specPath)) {
      console.error(`Missing spec: ${specPath}`);
      process.exit(1);
    }
    if (!fs.existsSync(figurePath)) {
      console.error(`Missing figure: ${figurePath}`);
      process.exit(1);
    }

    const spec = loadVisualSpec(specPath);
    const artifact = fs.readFileSync(figurePath, "utf8");
    const report = verifyFigureProjection({
      spec,
      artifact,
      figureId: item.id,
      familyIds: item.familyIds,
    });
    figureReports.push(report);
  }

  const corpus = verifyCorpusProjection(figureReports);
  const gapCategories = classifyEnumerationGaps(corpus, figureReports);
  const checkpoint = evaluateCheckpoint(gapCategories);
  const auditMatrix = buildDispositionAuditMatrix();

  const mission =
    phase === "total-disposition"
      ? "TOTAL-DISPOSITION"
      : phase === "dispositions"
        ? "PROJECTION-DISPOSITIONS"
        : "PROJECTION-FOUNDATION";

  const output = {
    mission,
    phase: phase.toUpperCase(),
    generatedAt: new Date().toISOString(),
    authoritativeFactSource: AUTHORITATIVE_FACT_SOURCE,
    chapter: path.relative(REPO_ROOT, chapterDir),
    checkpoint,
    auditMatrix,
    corpus,
    figures: figureReports,
  };

  const outJson = path.join(
    buildDir,
    phase === "total-disposition"
      ? "projection-total-disposition-report.json"
      : phase === "dispositions"
        ? "projection-dispositions-report.json"
        : `projection-foundation-baseline-${phase}.json`,
  );
  fs.mkdirSync(buildDir, { recursive: true });
  fs.writeFileSync(outJson, `${JSON.stringify(output, null, 2)}\n`);

  return { output, outJson, inventory };
}

const opts = parseArgs(process.argv);
const chapterDir = path.isAbsolute(opts.chapter)
  ? opts.chapter
  : path.join(REPO_ROOT, opts.chapter);

const { output, outJson } = runBaseline(chapterDir, opts.phase);

console.log(`Projection report (${opts.phase}) written to ${outJson}`);
console.log(JSON.stringify({
  corpus: output.corpus,
  dispositions: output.corpus.dispositions,
  totalDispositionMetrics: output.corpus.totalDispositionMetrics,
}, null, 2));
console.log(`Checkpoint: ${output.checkpoint.verdict} — ${output.checkpoint.reason}`);

process.exit(0);
