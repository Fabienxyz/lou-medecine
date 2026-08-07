/**
 * VCCK-W1-R1 — R1 replay runner: admitted-only render with full W1 proof stack.
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { REPO_ROOT } from "../paths.js";
import { loadVisualSpec } from "../visual-spec.js";
import { runW1Pipeline } from "./w1-pipeline.js";
import { validateW1Artifact, expectedCountsFromSpec } from "./w1-validate-artifact.js";
import { checkDeterminism, determinismHash } from "./render-bridge.js";
import { checkInterProcessDeterminism } from "./determinism-ipc.js";
import { W1_VIEWPORT_WIDTHS } from "./w1-constants.js";
import {
  captureW1SvgPngs,
  validateW1SurfaceMetrics,
  validateW1SvgViewport,
} from "./w1-surface.js";
import {
  VCCK_REPLAY_OUTPUT,
  VCCK_REPLAY_GALLERY,
} from "./paths.js";
import { verifyInventoryCoherence } from "./w1-replay-inventory.js";

export class ReplayRenderBlockedError extends Error {
  constructor(category, sourcePath) {
    super(`render blocked for category ${category}: ${sourcePath}`);
    this.name = "ReplayRenderBlockedError";
    this.category = category;
    this.sourcePath = sourcePath;
  }
}

export class ReplayInventoryGateError extends Error {
  constructor(message) {
    super(message);
    this.name = "ReplayInventoryGateError";
  }
}

let inventoryGateOpen = false;
let renderInvocationLog = [];

export function resetReplayRenderGuard() {
  inventoryGateOpen = false;
  renderInvocationLog = [];
}

export function openReplayRenderGate() {
  inventoryGateOpen = true;
}

export function getReplayRenderInvocationLog() {
  return [...renderInvocationLog];
}

export function assertReplayRenderPermitted(entry) {
  if (!inventoryGateOpen) {
    throw new ReplayInventoryGateError("render forbidden before inventory gate opened");
  }
  if (entry.category !== "W1_ADMITTED") {
    throw new ReplayRenderBlockedError(entry.category, entry.sourcePath);
  }
  if (!entry.renderEligible) {
    throw new ReplayRenderBlockedError(entry.category, entry.sourcePath);
  }
}

function candidateOutputDir(entry, replayRoot = VCCK_REPLAY_OUTPUT) {
  const slug = entry.id || crypto.createHash("sha256").update(entry.sourcePath).digest("hex").slice(0, 12);
  return path.join(replayRoot, slug);
}

async function validateSurfaces(entry, pipeline, outDir, options = {}) {
  const widths = W1_VIEWPORT_WIDTHS;
  const skipPlaywright = options.skipPlaywright === true;
  const results = { expected: widths.length, executed: 0, passed: 0, byWidth: {}, skipped: skipPlaywright };

  if (skipPlaywright) return { ...results, ok: true, skipReason: "playwright-skipped" };

  if (pipeline.kind === "svg") {
    const artifactPath = path.join(outDir, "artifact.svg");
    fs.writeFileSync(artifactPath, pipeline.artifact);
    const viewport = await validateW1SvgViewport(artifactPath, { widths });
    const capture = await captureW1SvgPngs(artifactPath, outDir, "surface", widths);
    for (const width of widths) {
      results.executed++;
      const metrics = capture.metricsByWidth[width];
      const surface = validateW1SurfaceMetrics(metrics);
      results.byWidth[width] = {
        viewport: viewport.details?.find((d) => d.width === width)?.issues?.length === 0 ? "PASS" : "FAIL",
        surface: surface.ok ? "PASS" : "FAIL",
        pngHash: capture.paths[width] ? determinismHash(fs.readFileSync(capture.paths[width])) : null,
        errors: [...(viewport.errors || []).filter((e) => e.includes(`@ ${width}px`)), ...(surface.errors || [])],
      };
      if (results.byWidth[width].viewport === "PASS" && results.byWidth[width].surface === "PASS") {
        results.passed++;
      }
    }
    return { ok: results.passed === widths.length && viewport.ok, ...results, viewportErrors: viewport.errors };
  }

  return { ok: false, ...results, errors: ["unknown artifact kind"] };
}

export async function replayAdmittedCandidate(entry, options = {}) {
  assertReplayRenderPermitted(entry);
  renderInvocationLog.push({ sourcePath: entry.sourcePath, category: entry.category, at: Date.now() });

  const replayRoot = options.replayOutputRoot || VCCK_REPLAY_OUTPUT;
  const outDir = candidateOutputDir(entry, replayRoot);
  fs.mkdirSync(outDir, { recursive: true });

  const absSource = path.join(REPO_ROOT, entry.sourcePath);
  const spec = loadVisualSpec(absSource);
  const familyId = entry.recognizedFamily;

  const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });
  if (!pipeline.ok) {
    return {
      candidateId: entry.id,
      sourcePath: entry.sourcePath,
      family: familyId,
      ok: false,
      stage: pipeline.stage,
      errors: pipeline.errors,
      architectureChangeRequired: pipeline.stage === "contract" || pipeline.stage === "plan-build",
    };
  }

  const counts = expectedCountsFromSpec(spec, familyId);
  const artifactValidation = validateW1Artifact(spec, pipeline.artifact, pipeline.kind, counts);
  const determinism = checkDeterminism(spec, { expectedFamily: familyId });

  const fixtureCopy = path.join(outDir, "source.yaml");
  fs.copyFileSync(absSource, fixtureCopy);
  const ipc = options.skipIpc
    ? { ok: true, skipped: true }
    : checkInterProcessDeterminism(fixtureCopy);

  const artifactHash = determinismHash(pipeline.artifact);
  fs.writeFileSync(path.join(outDir, "artifact.svg"), pipeline.artifact);

  const surfaces = await validateSurfaces(entry, pipeline, outDir, options);

  const anomalies = [];
  if (!artifactValidation.ok) anomalies.push({ severity: "critical", kind: "artifact", errors: artifactValidation.errors });
  if (!determinism.ok) anomalies.push({ severity: "critical", kind: "determinism", errors: determinism.errors });
  if (!ipc.ok && !ipc.skipped) anomalies.push({ severity: "critical", kind: "ipc-determinism", errors: ipc.errors });
  if (!surfaces.ok && !surfaces.skipReason) {
    anomalies.push({ severity: "high", kind: "surfaces", errors: surfaces.viewportErrors || ["surface validation failed"] });
  }

  return {
    candidateId: entry.id,
    sourcePath: entry.sourcePath,
    family: familyId,
    ok:
      artifactValidation.ok &&
      determinism.ok &&
      (ipc.ok || ipc.skipped) &&
      (surfaces.ok || surfaces.skipReason),
    artifactHash,
    determinism: { ok: determinism.ok, hash: determinism.hashA },
    ipcDeterminism: ipc,
    artifactValidation,
    surfaces,
    anomalies,
    outputDir: path.relative(REPO_ROOT, outDir),
    budgets: entry.budgets,
  };
}

export async function runReplayPhase(inventory, options = {}) {
  const coherence = verifyInventoryCoherence(inventory);
  if (!coherence.ok) {
    return {
      ok: false,
      blocked: true,
      reason: "inventory-incoherent",
      errors: coherence.errors,
      results: [],
    };
  }

  if (!inventoryGateOpen && !options.forceGate) {
    return {
      ok: false,
      blocked: true,
      reason: "inventory-gate-closed",
      errors: ["render blocked until inventory is complete and gate opened"],
      results: [],
    };
  }

  const admitted = inventory.candidates.filter((c) => c.category === "W1_ADMITTED");
  const results = [];

  for (const entry of admitted) {
    try {
      const result = await replayAdmittedCandidate(entry, options);
      results.push(result);
    } catch (e) {
      if (e instanceof ReplayRenderBlockedError) throw e;
      results.push({
        candidateId: entry.id,
        sourcePath: entry.sourcePath,
        ok: false,
        errors: [String(e.message || e)],
      });
    }
  }

  return { ok: true, admittedCount: admitted.length, results };
}

export function proveNonAdmittedNeverRendered(inventory) {
  const blockedCategories = ["W1_REJECTED", "NON_W1_STRUCTURED", "UNPARSEABLE_LEGACY", "DUPLICATE"];
  const invocations = getReplayRenderInvocationLog();
  const violations = invocations.filter((i) => {
    const entry = inventory.candidates.find((c) => c.sourcePath === i.sourcePath);
    return entry && blockedCategories.includes(entry.category);
  });
  return { ok: violations.length === 0, violations };
}

export { VCCK_REPLAY_GALLERY };
