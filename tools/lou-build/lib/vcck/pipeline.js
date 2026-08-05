/**
 * VCCK P0 qualification pipeline — monotonic controls, authentic negatives, surface inventory.
 */

import fs from "node:fs";
import path from "node:path";
import { loadVisualSpec, validateVisualSpec } from "../visual-spec.js";
import { validateHtmlViewport } from "../html-viewport-validate.js";
import {
  validateSvgViewport,
  captureResponsiveSvgPng,
  SVG_VIEWPORT_WIDTHS,
} from "../svg-viewport-validate.js";
import { captureHtmlPng } from "../html-capture.js";
import { validatePngCapture } from "../svg-png-validate.js";
import { isW1Family } from "./w1-constants.js";
import {
  validateW1SvgViewport,
  captureW1SvgPngs,
  captureW1HtmlPng,
  validateW1SurfaceMetrics,
} from "./w1-surface.js";
import {
  VCCK_NEGATIVE,
  VCCK_POSITIVE,
  VCCK_REPORTS,
  VCCK_VIEWPORT_WIDTHS,
  getVcckOutputDir,
} from "./paths.js";
import { loadFamilyRegistry } from "./registry.js";
import {
  gateBeforeRender,
  signatureMatchesFamily,
} from "./signature-analyzer.js";
import { checkBudgets } from "./budgets.js";
import {
  renderVcckSpec,
  validateRenderedArtifact,
  checkDeterminism,
  artifactKind,
} from "./render-bridge.js";
import { loadVcckInventory } from "./inventory.js";
import {
  CONTROL,
  FIXTURE_STATUS,
  FAMILY_HARNESS_STATUS,
  deriveFixtureStatus,
  assertReportCoherence,
  aggregateControl,
  browserUnavailableStatus,
  controlNotExecuted,
} from "./status.js";
import {
  verifyFixtureSurfaces,
  writeWordInsertCandidate,
  WORD_CANDIDATE_FILENAME,
} from "./surfaces.js";
import { auditAntiSpecializationTransitive } from "./anti-specialization.js";
import { inventoryAllSurfaces } from "./surfaces.js";
import { validateMutantFixtures } from "./svg-geom-independent.js";
import {
  runAllRejectFixtures,
  runRejectFixture,
} from "./reject-fixtures.js";
import { writeW1VisualAuditReport } from "./w1-visual-report.js";
import { computeW1MissionVerdictFromPipeline } from "./w1-verdict.js";
import { W1_FAMILIES } from "./w1-constants.js";
import {
  runAllW1StressSurfaceProofs,
  writeW1StressSurfacesReport,
} from "./w1-stress-surfaces.js";
import { buildW1ResponsiveProof } from "./w1-responsive-proof.js";
import { validateW1HtmlReflowAtWidth } from "./w1-reflow-validate.js";
import { computeVcckVerdict } from "./verdict.js";
import { checkInterProcessDeterminism } from "./determinism-ipc.js";
import { VCCK_POSITIVE as POS_DIR } from "./paths.js";

export { runRejectFixture };

function isBrowserMissingError(e) {
  const msg = String(e?.message || e);
  return msg.includes("Executable doesn't exist") || msg.includes("playwright install");
}

function baseResult(family, loadPath, kind) {
  return {
    familyId: family.id,
    fixture: path.basename(loadPath),
    kind,
    recognition: CONTROL.N_A,
    fixtureValidation: CONTROL.N_A,
    render: CONTROL.N_A,
    viewports: CONTROL.N_A,
    surfaces: CONTROL.N_A,
    wordInsertCandidate: "NOT_EXECUTED",
    wordRenderExecuted: false,
    wordProofValidated: false,
    negative: CONTROL.N_A,
    determinism: CONTROL.N_A,
    status: FIXTURE_STATUS.EXPERIMENTAL,
    code: null,
    expectedCode: null,
    signature: null,
    errors: [],
    controlNotes: [],
  };
}

export async function runPositiveFixture(family, loadPath, options = {}) {
  const inventory = options.inventory || loadVcckInventory();
  const dryRun = Boolean(options.dryRun);
  const skipPlaywright = Boolean(options.skipPlaywright);
  const outputRoot = options.outputRoot ?? null;
  const outDir = path.join(
    getVcckOutputDir(outputRoot),
    family.id,
    path.basename(loadPath, ".yaml"),
  );
  const result = baseResult(family, loadPath, "positive");

  let spec;
  try {
    spec = loadVisualSpec(loadPath);
  } catch (e) {
    result.errors.push(String(e.message || e));
    result.fixtureValidation = CONTROL.FAIL;
    result.recognition = CONTROL.BLOCKED;
    result.render = CONTROL.BLOCKED;
    result.viewports = CONTROL.BLOCKED;
    result.surfaces = CONTROL.BLOCKED;
    result.determinism = CONTROL.BLOCKED;
    result.status = FIXTURE_STATUS.EXPERIMENTAL;
    return result;
  }

  const validation = validateVisualSpec(spec, { inventory });
  result.fixtureValidation = validation.ok ? CONTROL.PASS : CONTROL.FAIL;
  if (!validation.ok) {
    result.errors.push(...validation.errors);
    result.recognition = CONTROL.BLOCKED;
    result.render = CONTROL.BLOCKED;
    result.viewports = CONTROL.BLOCKED;
    result.surfaces = CONTROL.BLOCKED;
    result.determinism = CONTROL.BLOCKED;
    result.status = FIXTURE_STATUS.EXPERIMENTAL;
    return result;
  }

  const gate = gateBeforeRender(spec);
  result.signature = gate.analysis?.signature || null;
  const recognized = signatureMatchesFamily(gate.analysis, family.id);
  result.recognition = recognized ? CONTROL.PASS : CONTROL.FAIL;

  if (!gate.allowed) {
    result.code = gate.code;
    result.errors.push(`gate: ${gate.code}`);
    result.render = CONTROL.BLOCKED;
    result.viewports = CONTROL.BLOCKED;
    result.surfaces = CONTROL.BLOCKED;
    result.determinism = CONTROL.BLOCKED;
    result.status = FIXTURE_STATUS.EXPERIMENTAL;
    return result;
  }

  if (!recognized) {
    result.errors.push(
      `family mismatch: expected ${family.id}, got ${gate.analysis?.family || gate.analysis?.status}`,
    );
    result.render = CONTROL.BLOCKED;
    result.viewports = CONTROL.BLOCKED;
    result.surfaces = CONTROL.BLOCKED;
    result.determinism = CONTROL.BLOCKED;
    result.status = FIXTURE_STATUS.EXPERIMENTAL;
    return result;
  }

  const familyBudget = checkBudgets(spec, { familyId: family.id });
  if (!familyBudget.ok) {
    result.code = familyBudget.code;
    result.errors.push(
      `family budget after recognition: ${familyBudget.code} (${familyBudget.detail?.field})`,
    );
    result.render = CONTROL.BLOCKED;
    result.viewports = CONTROL.BLOCKED;
    result.surfaces = CONTROL.BLOCKED;
    result.determinism = CONTROL.BLOCKED;
    result.status = FIXTURE_STATUS.EXPERIMENTAL;
    return result;
  }

  if (dryRun || skipPlaywright) {
    result.render = controlNotExecuted();
    result.viewports = browserUnavailableStatus();
    result.surfaces = browserUnavailableStatus();
    result.wordInsertCandidate = "NOT_EXECUTED";
    result.determinism = controlNotExecuted();
    result.controlNotes.push(
      dryRun
        ? "dry-run — render/viewport/surface controls not executed"
        : "skip-playwright — browser controls blocked",
    );
    result.status = FIXTURE_STATUS.EXPERIMENTAL;
    return result;
  }

  let rendered;
  try {
    rendered = renderVcckSpec(spec, { inventory });
  } catch (e) {
    result.render = CONTROL.FAIL;
    result.errors.push(String(e.message || e));
    result.viewports = CONTROL.BLOCKED;
    result.surfaces = CONTROL.BLOCKED;
    result.determinism = CONTROL.BLOCKED;
    result.status = FIXTURE_STATUS.EXPERIMENTAL;
    return result;
  }

  result.render = rendered.ok ? CONTROL.PASS : CONTROL.FAIL;
  if (!rendered.ok) {
    result.errors.push(...(rendered.errors || []));
    result.viewports = CONTROL.BLOCKED;
    result.surfaces = CONTROL.BLOCKED;
    result.determinism = CONTROL.BLOCKED;
    result.status = FIXTURE_STATUS.EXPERIMENTAL;
    return result;
  }

  const artifactCheck = validateRenderedArtifact(spec, rendered);
  if (!artifactCheck.ok) {
    result.render = CONTROL.FAIL;
    result.errors.push(...artifactCheck.errors);
    result.viewports = CONTROL.BLOCKED;
    result.surfaces = CONTROL.BLOCKED;
    result.determinism = CONTROL.BLOCKED;
    result.status = FIXTURE_STATUS.EXPERIMENTAL;
    return result;
  }

  fs.mkdirSync(outDir, { recursive: true });
  const artifactName = rendered.kind === "svg" ? "artifact.svg" : "artifact.html";
  const artifactPath = path.join(outDir, artifactName);
  fs.writeFileSync(artifactPath, rendered.artifact);

  const det = checkDeterminism(spec, { inventory });
  result.determinism = det.ok ? CONTROL.PASS : CONTROL.FAIL;
  if (!det.ok) result.errors.push(...det.errors);
  result.snapshotHash = det.hashA;

  const vpErrors = [];
  const pngErrors = [];
  const surfaceMetricNotes = [];
  const reflowMetricNotes = [];
  const kind = artifactKind(spec);
  const w1Family = isW1Family(family.id);

  try {
    if (kind === "html") {
      for (const width of VCCK_VIEWPORT_WIDTHS) {
        const vp = await validateHtmlViewport(artifactPath, { widths: [width] });
        if (!vp.ok) vpErrors.push(`${width}px: ${vp.errors.join("; ")}`);
        const pngPath = path.join(outDir, `capture-${width}.png`);
        if (w1Family) {
          const metrics = await captureW1HtmlPng(artifactPath, pngPath, { width });
          const surfVal = validateW1SurfaceMetrics(metrics);
          if (!surfVal.ok) {
            pngErrors.push(`${width}px surface: ${surfVal.errors.join("; ")}`);
          }
          if (metrics) {
            surfaceMetricNotes.push({
              width,
              ...metrics,
              ratio: metrics.contentCaptureRatio,
            });
          }
          if (rendered.plan && (family.id === "two-pole" || family.id === "flat-concurrent")) {
            const reflow = await validateW1HtmlReflowAtWidth(
              rendered.plan,
              artifactPath,
              width,
              family.id,
            );
            reflowMetricNotes.push({ width, ok: reflow.ok, detail: reflow.detail, errors: reflow.errors });
            if (!reflow.ok) pngErrors.push(...reflow.errors.map((e) => `${width}px reflow: ${e}`));
          }
        } else {
          await captureHtmlPng(artifactPath, pngPath, { width });
        }
        const pngVal = await validatePngCapture(pngPath);
        if (!pngVal.ok) pngErrors.push(`${width}px: ${pngVal.errors.join("; ")}`);
      }
    } else if (kind === "svg") {
      if (w1Family) {
        const vpResult = await validateW1SvgViewport(artifactPath, { widths: VCCK_VIEWPORT_WIDTHS });
        if (!vpResult.ok) vpErrors.push(...vpResult.errors);
        const { paths: pngPaths, metricsByWidth } = await captureW1SvgPngs(
          artifactPath,
          outDir,
          path.basename(loadPath, ".yaml"),
          VCCK_VIEWPORT_WIDTHS,
        );
        for (const [width, pngPath] of Object.entries(pngPaths)) {
          const dest = path.join(outDir, `capture-${width}.png`);
          if (pngPath !== dest && fs.existsSync(pngPath)) fs.copyFileSync(pngPath, dest);
          const metrics = metricsByWidth[width];
          const surfVal = validateW1SurfaceMetrics(metrics);
          if (!surfVal.ok) {
            pngErrors.push(`${width}px surface: ${surfVal.errors.join("; ")}`);
          }
          if (metrics) {
            surfaceMetricNotes.push({
              width,
              ...metrics,
              ratio: metrics.contentCaptureRatio,
            });
          }
          const pngVal = await validatePngCapture(dest);
          if (!pngVal.ok) pngErrors.push(`${width}px: ${pngVal.errors.join("; ")}`);
        }
      } else {
        const vpResult = await validateSvgViewport(artifactPath, { widths: SVG_VIEWPORT_WIDTHS });
        if (!vpResult.ok) vpErrors.push(...vpResult.errors);
        const pngPaths = await captureResponsiveSvgPng(
          artifactPath,
          outDir,
          path.basename(loadPath, ".yaml"),
          SVG_VIEWPORT_WIDTHS,
        );
        for (const [width, pngPath] of Object.entries(pngPaths)) {
          const dest = path.join(outDir, `capture-${width}.png`);
          if (pngPath !== dest && fs.existsSync(pngPath)) fs.copyFileSync(pngPath, dest);
          const pngVal = await validatePngCapture(dest);
          if (!pngVal.ok) pngErrors.push(`${width}px: ${pngVal.errors.join("; ")}`);
        }
      }
    }
  } catch (e) {
    if (isBrowserMissingError(e)) {
      result.viewports = browserUnavailableStatus();
      result.surfaces = browserUnavailableStatus();
      result.controlNotes.push("browser unavailable — viewport/png blocked");
    } else {
      result.viewports = CONTROL.FAIL;
      vpErrors.push(String(e.message || e));
    }
  }

  if (result.viewports !== browserUnavailableStatus()) {
    result.viewports = vpErrors.length || pngErrors.length ? CONTROL.FAIL : CONTROL.PASS;
  }
  if (pngErrors.length) {
    result.errors.push(...pngErrors.map((e) => `png: ${e}`));
    if (result.viewports === CONTROL.PASS) result.viewports = CONTROL.FAIL;
  }
  if (vpErrors.length && result.viewports !== browserUnavailableStatus()) {
    result.errors.push(...vpErrors);
  }

  if (fs.existsSync(artifactPath)) {
    writeWordInsertCandidate(
      artifactPath,
      path.join(outDir, WORD_CANDIDATE_FILENAME),
      530,
    );
    result.wordInsertCandidate = "PRESENT";
  }

  const surfaceCheck = verifyFixtureSurfaces(
    family.id,
    path.basename(loadPath, ".yaml"),
    family.technology,
    outputRoot,
  );
  result.surfaces =
    result.viewports === browserUnavailableStatus()
      ? browserUnavailableStatus()
      : surfaceCheck.surfaces;
  result.wordInsertCandidate = surfaceCheck.wordInsertCandidate;
  result.wordRenderExecuted = surfaceCheck.wordRenderExecuted;
  result.wordProofValidated = surfaceCheck.wordProofValidated;

  if (surfaceCheck.errors.length) {
    result.errors.push(...surfaceCheck.errors);
  }
  if (surfaceMetricNotes.length) {
    result.surfaceMetrics = surfaceMetricNotes;
  }
  if (reflowMetricNotes.length) {
    result.reflowMetrics = reflowMetricNotes;
  }
  if (surfaceCheck.missing.length) {
    result.errors.push(...surfaceCheck.missing.map((m) => `missing: ${m}`));
  }

  result.status = deriveFixtureStatus(result);
  return result;
}

export async function runNegativeFixture(family, loadPath, options = {}) {
  const inventory = options.inventory || loadVcckInventory();
  const expectedCode = options.expectedCode || family.expected_negative_code;
  const result = baseResult(family, loadPath, "negative");
  result.recognition = CONTROL.N_A;
  result.fixtureValidation = CONTROL.N_A;
  result.render = CONTROL.BLOCKED;
  result.viewports = CONTROL.BLOCKED;
  result.surfaces = CONTROL.N_A;
  result.determinism = CONTROL.N_A;
  result.expectedCode = expectedCode;
  result.negative = CONTROL.FAIL;

  let spec;
  try {
    spec = loadVisualSpec(loadPath);
  } catch (e) {
    result.errors.push(String(e.message || e));
    return result;
  }

  const gate = gateBeforeRender(spec);
  result.code = gate.code;
  result.signature = gate.analysis?.signature || null;

  if (gate.allowed) {
    result.recognition = "UNEXPECTED_PASS";
    result.negative = CONTROL.FAIL;
    result.errors.push(`gate allowed render — expected block with ${expectedCode}`);
    return result;
  }

  result.recognition = "REJECTED";

  if (gate.code !== expectedCode) {
    result.errors.push(`expected ${expectedCode}, gate emitted ${gate.code}`);
    result.negative = CONTROL.FAIL;
  } else {
    result.negative = CONTROL.PASS;
  }

  const attempted = renderVcckSpec(spec, { inventory });
  if (attempted.ok) {
    result.negative = CONTROL.FAIL;
    result.errors.push("renderer must remain blocked for structural reject");
  }

  if (result.recognition === "UNEXPECTED_PASS") {
    result.negative = CONTROL.FAIL;
  }

  result.status =
    result.recognition === "REJECTED" &&
    result.negative === CONTROL.PASS &&
    result.code === expectedCode
      ? FIXTURE_STATUS.PROOF_PASS
      : FIXTURE_STATUS.EXPERIMENTAL;

  return result;
}

export async function runVcckQualification(options = {}) {
  const registry = loadFamilyRegistry();
  const inventory = loadVcckInventory();
  const dryRun = Boolean(options.dryRun);
  const skipPlaywright = Boolean(options.skipPlaywright);
  const outputRoot = options.outputRoot ?? null;
  const matrix = [];
  const detailRows = [];
  const familyResults = {};

  const rejectResults =
    options.rejectResults || runAllRejectFixtures({ inventory });

  for (const family of registry.families) {
    const fr = { family: family.id, positive: [], negative: [] };

    for (const variant of ["short", "long"]) {
      const file = family.positive_fixtures[variant];
      const loadPath = path.join(VCCK_POSITIVE, file);
      const r = await runPositiveFixture(family, loadPath, {
        ...options,
        inventory,
        outputRoot,
      });
      fr.positive.push(r);
      const row = summarizeRow(family.id, r);
      matrix.push(row);
      detailRows.push(row);
    }

    for (const fileEntry of family.negative_fixtures || []) {
      const file = typeof fileEntry === "string" ? fileEntry : fileEntry.path;
      const expectedCode =
        typeof fileEntry === "object" && fileEntry.expected_code
          ? fileEntry.expected_code
          : family.expected_negative_code;
      const loadPath = path.join(VCCK_NEGATIVE, file);
      const r = await runNegativeFixture(family, loadPath, {
        ...options,
        inventory,
        expectedCode,
      });
      fr.negative.push(r);
      const row = summarizeRow(family.id, r);
      matrix.push(row);
      detailRows.push(row);
    }

    familyResults[family.id] = fr;
  }

  const summaryRows = buildSummaryRows(matrix);
  const coherence = assertReportCoherence(summaryRows, detailRows, rejectResults);

  const antiSpec = auditAntiSpecializationTransitive();
  const mutants = validateMutantFixtures();
  const surfaces = inventoryAllSurfaces(registry, outputRoot);

  let interProcessDeterminism = { ok: false, skipped: true };
  if (options.checkInterProcessDeterminism) {
    const chainShort = path.join(POS_DIR, "chain-short.yaml");
    interProcessDeterminism = {
      ...checkInterProcessDeterminism(chainShort),
      skipped: false,
    };
  }

  const verdictBundle = computeVcckVerdict({
    rejectResults,
    detailRows,
    coherence,
    antiSpec,
    mutants,
    surfaces,
    interProcessDeterminism,
    dryRun,
  });

  const report = buildMatrixReport(matrix, familyResults, {
    ...verdictBundle,
    coherence,
    antiSpec,
    mutants,
    surfaces,
    rejectResults,
    interProcessDeterminism,
  });

  let stressProof = { executed: false, ok: false, totalProofs: 0 };
  let responsiveProof = buildW1ResponsiveProof(familyResults, {
    skipPlaywright: true,
    playwrightLaunched: false,
    stressProof,
  });

  if (!dryRun) {
    fs.mkdirSync(VCCK_REPORTS, { recursive: true });
    fs.writeFileSync(path.join(VCCK_REPORTS, "qualification-matrix.md"), report.markdown);

    if (!skipPlaywright) {
      stressProof = await runAllW1StressSurfaceProofs({ outputRoot });
      writeW1StressSurfacesReport(stressProof);
    }

    responsiveProof = buildW1ResponsiveProof(familyResults, {
      skipPlaywright,
      playwrightLaunched: !skipPlaywright,
      stressProof,
    });

    const w1Context = {
      outputRoot,
      familyResults,
      stressProof,
      responsiveProof,
      responsiveTestsExecuted: responsiveProof.executed === true,
      responsiveTestsPass: responsiveProof.ok === true,
    };
    const w1Visual = writeW1VisualAuditReport({ familyResults, outputRoot, w1Context });
    const w1Verdict =
      w1Visual.structuredVerdict ||
      computeW1MissionVerdictFromPipeline(familyResults, w1Context);
    fs.writeFileSync(
      path.join(VCCK_REPORTS, "w1-mission-verdict.json"),
      JSON.stringify(w1Verdict, null, 2),
    );
    fs.writeFileSync(
      path.join(VCCK_REPORTS, "w1.4-mission-verdict.json"),
      JSON.stringify(w1Verdict, null, 2),
    );
    fs.writeFileSync(
      path.join(VCCK_REPORTS, "qualification-results.json"),
      JSON.stringify(
        {
          missionVerdict: verdictBundle.missionVerdict,
          proofHarnessReady: verdictBundle.proofHarnessReady,
          rejectFixturesOk: verdictBundle.rejectFixturesOk,
          rejectResults,
          familyQualificationResults: verdictBundle.familyQualificationResults,
          familyResults,
          coherence,
          surfaces,
          mutants,
          interProcessDeterminism,
          stressProof: !skipPlaywright ? stressProof : null,
          responsiveProof,
        },
        null,
        2,
      ),
    );
  }

  const w1MissionVerdict = computeW1MissionVerdictFromPipeline(familyResults, {
    outputRoot,
    familyResults,
    stressProof,
    responsiveProof,
    responsiveTestsExecuted: responsiveProof.executed === true,
    responsiveTestsPass: responsiveProof.ok === true,
  }).missionVerdict;

  return {
    matrix,
    familyResults,
    report,
    rejectResults,
    ...verdictBundle,
    w1MissionVerdict,
    coherence,
    antiSpec,
    mutants,
    surfaces,
    interProcessDeterminism,
  };
}

function summarizeRow(familyId, r) {
  return {
    family: familyId,
    fixtureFile: r.fixture,
    recognition: r.recognition,
    fixture: r.fixtureValidation,
    render: r.render,
    viewports: r.viewports,
    surfaces: r.surfaces,
    wordInsertCandidate: r.wordInsertCandidate,
    negative: r.negative || CONTROL.N_A,
    determinism: r.determinism,
    code: r.code,
    expectedCode: r.expectedCode,
    status: r.status,
    kind: r.kind,
  };
}

function buildSummaryRows(matrix) {
  const byFamily = new Map();
  for (const row of matrix) {
    if (!byFamily.has(row.family)) byFamily.set(row.family, []);
    byFamily.get(row.family).push(row);
  }

  const summaryRows = new Map();
  for (const [familyId, rows] of byFamily) {
    const pos = rows.filter((r) => r.kind === "positive");
    const neg = rows.filter((r) => r.kind === "negative");
    summaryRows.set(familyId, {
      family: familyId,
      recognition: aggregateControl(pos, "recognition"),
      fixture: aggregateControl(pos, "fixture"),
      render: aggregateControl(pos, "render"),
      viewports: aggregateControl(pos, "viewports"),
      surfaces: aggregateControl(pos, "surfaces"),
      negative: neg.length ? aggregateControl(neg, "negative") : CONTROL.N_A,
      determinism: aggregateControl(pos, "determinism"),
      status: aggregateFamilyStatus(rows),
    });
  }
  return summaryRows;
}

function buildMatrixReport(matrix, familyResults, ctx) {
  const summaryRows = buildSummaryRows(matrix);
  const lines = [
    "# VCCK Qualification Matrix (P0.1)",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    `Mission verdict: **${ctx.missionVerdict}**`,
    `Proof harness ready: **${ctx.proofHarnessReady}**`,
    `Reject fixtures: **${ctx.rejectFixturesOk ? "PASS" : "FAIL"}** (9/9 required)`,
    "",
    "| Famille | Reconnaissance | Fixture | Rendu | Viewports | Surfaces (PNG) | Négatif | Déterminisme | Statut |",
    "|---|---|---|---|---|---|---|---|---|",
  ];

  for (const [familyId, summary] of summaryRows) {
    lines.push(
      `| ${familyId} | ${summary.recognition} | ${summary.fixture} | ${summary.render} | ${summary.viewports} | ${summary.surfaces} | ${summary.negative} | ${summary.determinism} | ${summary.status} |`,
    );
  }

  lines.push("", "## Reject fixtures (9 codes)", "");
  for (const r of ctx.rejectResults || []) {
    lines.push(
      `- ${r.file || r.fixture}: ${r.negative} (code=${r.code}, expected=${r.expectedCode}, renderBlocked=${r.renderBlocked})`,
    );
  }

  lines.push("", "## P0 coherence", "");
  lines.push(`Report coherence: ${ctx.coherence.ok ? "PASS" : "FAIL"}`);
  if (!ctx.coherence.ok) {
    for (const e of ctx.coherence.errors) lines.push(`- ${e}`);
  }

  lines.push("", "## Anti-specialization (transitive)", "");
  lines.push(`Status: ${ctx.antiSpec.ok ? "PASS" : "FAIL"}`);

  lines.push("", "## Inter-process determinism", "");
  lines.push(
    `Status: ${ctx.interProcessDeterminism?.skipped ? "NOT_RUN" : ctx.interProcessDeterminism?.ok ? "PASS" : "FAIL"}`,
  );

  lines.push("", "## Surface inventory", "");
  lines.push(
    `Expected: ${ctx.surfaces.expectedTotal} (180 PNG + 36 word-insert-candidate), present: ${ctx.surfaces.present}`,
  );
  lines.push("", "## Word surface policy", "");
  lines.push("- `word-insert-candidate` = technical inventory item only");
  lines.push("- `wordRenderExecuted` = false (not in P0.1 scope)");
  lines.push("- `wordProofValidated` = false (not in P0.1 scope)");

  return { markdown: lines.join("\n"), familyResults, summaryRows: [...summaryRows.entries()] };
}

function aggregateFamilyStatus(rows) {
  const pos = rows.filter((r) => r.kind === "positive");
  const neg = rows.filter((r) => r.kind === "negative");
  const posOk = pos.every((r) => r.status === FIXTURE_STATUS.PROOF_PASS);
  const negOk = neg.every((r) => r.status === FIXTURE_STATUS.PROOF_PASS);
  if (posOk && negOk) return FAMILY_HARNESS_STATUS.PASS;
  return FAMILY_HARNESS_STATUS.EXPERIMENTAL;
}
