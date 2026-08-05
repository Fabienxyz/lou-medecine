/**
 * W1 eight-gate evaluation — single authority consumed by verdict, reports, gallery.
 */

import path from "node:path";
import { loadVisualSpec } from "../visual-spec.js";
import { VCCK_POSITIVE } from "./paths.js";
import { W1_FAMILIES } from "./w1-constants.js";
import { runW1Pipeline } from "./w1-pipeline.js";
import {
  validateW1Artifact,
  expectedCountsFromSpec,
} from "./w1-validate-artifact.js";
import { listW1StructuralCandidates, checkW1ExclusivityStrict } from "./w1-exclusivity.js";
import { validateW1FamilyNegatives } from "./w1-negative-matrix.js";
import { verifyW1OutputMatchesCandidate, verifyW1CandidateAgainstApproved } from "./w1-candidate-drift.js";
import { snapshotGateStatusForFamily } from "./w1-artifact-snapshots.js";
import { evaluateW1BudgetCoverage } from "./w1-budget-coverage.js";
import { computeW1BitmapProofSummary } from "./w1-determinism-report.js";

export const W1_REQUIRED_GATES = Object.freeze([
  "contract",
  "exclusivity",
  "plan",
  "serialize",
  "artifact",
  "surfaces",
  "determinism",
  "snapshots",
]);

const PASS = "PASS";
const FAIL = "FAIL";
const BLOCKED = "BLOCKED";

function gateFromBool(ok, executed = true) {
  if (!executed) return BLOCKED;
  return ok ? PASS : FAIL;
}

function allPositives(fr, field) {
  const rows = fr?.positive || [];
  if (!rows.length) return { ok: false, executed: false, failed: ["no positives"] };
  const failed = [];
  for (const p of rows) {
    if (p[field] !== PASS) failed.push(`${p.fixture}:${field}=${p[field]}`);
  }
  return { ok: failed.length === 0, executed: true, failed };
}

function evaluateFamilyPipelineGates(familyId) {
  const shortSpec = loadVisualSpec(path.join(VCCK_POSITIVE, `${familyId}-short.yaml`));
  const pipeline = runW1Pipeline(shortSpec, { expectedFamily: familyId });
  const planOk = Boolean(pipeline.ok && pipeline.plan);
  const serializeOk = Boolean(pipeline.ok && pipeline.artifact);
  let artifactOk = false;
  if (pipeline.ok) {
    const counts = expectedCountsFromSpec(shortSpec, familyId);
    const art = validateW1Artifact(shortSpec, pipeline.artifact, pipeline.kind, counts);
    artifactOk = art.ok;
  }
  return {
    plan: planOk ? PASS : FAIL,
    serialize: serializeOk ? PASS : FAIL,
    artifact: artifactOk ? PASS : FAIL,
    pipelineErrors: pipeline.errors || [],
  };
}

function evaluateSnapshotsGate(familyId) {
  return snapshotGateStatusForFamily(familyId);
}

export function evaluateW1FamilyGates(familyId, context = {}) {
  const fr = context.familyResults?.[familyId] || {};
  const pipelineGates = evaluateFamilyPipelineGates(familyId);

  const recognition = allPositives(fr, "recognition");
  const render = allPositives(fr, "render");
  const surfaces = allPositives(fr, "surfaces");
  const determinism = allPositives(fr, "determinism");
  const negatives = validateW1FamilyNegatives(familyId, fr.negative || []);

  const contract =
    recognition.ok && render.ok && negatives.ok ? PASS : FAIL;

  let exclusivity = FAIL;
  try {
    const shortSpec = loadVisualSpec(path.join(VCCK_POSITIVE, `${familyId}-short.yaml`));
    const ex = checkW1ExclusivityStrict(shortSpec, familyId);
    exclusivity = ex.exclusive ? PASS : FAIL;
  } catch {
    exclusivity = FAIL;
  }

  const gates = {
    contract: negatives.ok ? contract : FAIL,
    exclusivity,
    plan: pipelineGates.plan,
    serialize: pipelineGates.serialize,
    artifact: pipelineGates.artifact,
    surfaces: gateFromBool(surfaces.ok, surfaces.executed),
    determinism: gateFromBool(determinism.ok, determinism.executed),
    snapshots: evaluateSnapshotsGate(familyId),
  };

  const failed = W1_REQUIRED_GATES.filter((g) => gates[g] !== PASS);
  const negativeErrors = negatives.ok ? [] : negatives.errors;

  return {
    familyId,
    gates,
    failed,
    negativeErrors,
    pipelineErrors: pipelineGates.pipelineErrors,
    structuralCandidates: (() => {
      try {
        const shortSpec = loadVisualSpec(path.join(VCCK_POSITIVE, `${familyId}-short.yaml`));
        return listW1StructuralCandidates(shortSpec);
      } catch {
        return [];
      }
    })(),
  };
}

export function evaluateW1MissionGates(context = {}) {
  const perFamily = {};
  const allFailed = [];
  const blockingGates = [];

  for (const familyId of W1_FAMILIES) {
    const evalResult = evaluateW1FamilyGates(familyId, context);
    perFamily[familyId] = evalResult;
    allFailed.push(...evalResult.failed.map((g) => `${familyId}:${g}`));
    for (const g of evalResult.failed) blockingGates.push(`${familyId}:${g}`);
    allFailed.push(...evalResult.negativeErrors);
  }

  const pngDrift = context.pngDrift ?? verifyW1OutputMatchesCandidate(context);
  const pngReapproval =
    context.pngReapproval ?? verifyW1CandidateAgainstApproved(context);
  if (!pngDrift.ok) {
    blockingGates.push("png-candidate-drift");
    allFailed.push(...(pngDrift.errors || []));
  }
  if (!pngReapproval.ok) {
    blockingGates.push("png-approved-drift");
    allFailed.push(...(pngReapproval.errors || []));
  }

  const budget = context.budgetCoverage ?? evaluateW1BudgetCoverage();
  if (!budget.ok) {
    blockingGates.push("budget-coverage");
    allFailed.push(...(budget.errors || []));
  }

  const bitmap = context.bitmapSummary ?? computeW1BitmapProofSummary(context);
  if (bitmap.unexplainedVariance?.length) {
    blockingGates.push("bitmap-variance");
    allFailed.push(...bitmap.unexplainedVariance);
  }

  return {
    perFamily,
    allFailed,
    blockingGates,
    pngDrift,
    pngReapprovalPending: false,
    pngReapproval,
    budgetCoverage: budget,
    bitmapSummary: bitmap,
  };
}

export function gatesToPublicationPayload(gateEval) {
  return {
    perFamily: Object.fromEntries(
      W1_FAMILIES.map((id) => [
        id,
        {
          gates: gateEval.perFamily[id].gates,
          failed: gateEval.perFamily[id].failed,
          status: gateEval.perFamily[id].failed.length === 0 ? "READY" : "EXPERIMENTAL",
        },
      ]),
    ),
    blockingGates: gateEval.blockingGates,
    bitmapSummary: gateEval.bitmapSummary,
    budgetCoverage: gateEval.budgetCoverage,
  };
}
