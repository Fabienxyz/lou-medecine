/**
 * W1 mission verdict — computeW1FamilyVerdict is the single gate authority.
 */

import { W1_FAMILIES } from "./w1-constants.js";
import {
  evaluateW1MissionGates,
  evaluateW1FamilyGates,
  W1_REQUIRED_GATES,
  gatesToPublicationPayload,
} from "./w1-gates.js";
import { verifyAllW1ArtifactSnapshots } from "./w1-artifact-snapshots.js";
import { validatePerceptualApproval } from "./w1-perceptual-approval.js";

export const W1_FAMILY_STATUS = Object.freeze({
  EXPERIMENTAL: "EXPERIMENTAL",
  READY_AUDIT: "READY_FOR_VCCK_W1_AUDIT",
});

export const W1_MISSION_VERDICT = Object.freeze({
  CODEX_REAUDIT: "READY_FOR_VCCK_W1_CODEX_REAUDIT",
  GIT_BASELINE: "READY_FOR_VCCK_W1_GIT_BASELINE_APPROVAL",
  PROOF_BLOCKED: "VCCK_W1_PROOF_INTEGRITY_BLOCKED",
  REMEDIATION_BLOCKED: "VCCK_W1_REMEDIATION_BLOCKED",
  BLOCKED: "VCCK_W1_BLOCKED",
  SURFACE_PROOF: "VCCK_W1_BLOCKED_SURFACE_PROOF",
  DRIFT: "VCCK_W1_BLOCKED_CANDIDATE_DRIFT",
  NEGATIVE: "VCCK_W1_BLOCKED_NEGATIVE_FIXTURE",
  SNAPSHOT: "VCCK_W1_BLOCKED_SNAPSHOT",
});

/** Per-family verdict from eight gates — all must be strictly PASS. */
export function computeW1FamilyVerdict(familyId, gates) {
  const failed = W1_REQUIRED_GATES.filter((g) => gates[g] !== "PASS");
  return {
    familyId,
    status: W1_FAMILY_STATUS.EXPERIMENTAL,
    qualificationStatus: "EXPERIMENTAL",
    gates,
    failed,
    ready: failed.length === 0,
  };
}

/**
 * Aggregates pipeline context into mission verdict — no parallel gate logic.
 */
export function computeW1MissionVerdictFromPipeline(familyResults, context = {}) {
  const gateEval = evaluateW1MissionGates({ ...context, familyResults });
  const perFamily = W1_FAMILIES.map((id) => {
    const evalResult = gateEval.perFamily[id];
    const verdict = computeW1FamilyVerdict(id, evalResult.gates);
    return {
      ...verdict,
      negativeErrors: evalResult.negativeErrors,
      structuralCandidates: evalResult.structuralCandidates,
      pipelineByFixture: evalResult.pipelineByFixture,
    };
  });

  const allGatesPass = perFamily.every((f) => f.ready);
  const noBlocking =
    gateEval.blockingGates.length === 0 && gateEval.allFailed.length === 0;

  const artifactSnapshots =
    context.artifactSnapshots ?? verifyAllW1ArtifactSnapshots();
  const perceptual =
    gateEval.perceptualApproval ?? validatePerceptualApproval();

  const responsiveExecuted = gateEval.responsiveTestsExecuted === true;
  const responsivePass = gateEval.responsiveTestsPass === true;
  const stressSurfacesOk = gateEval.stressSurfaces?.ok === true;

  let missionVerdict = W1_MISSION_VERDICT.PROOF_BLOCKED;
  const readyForCodex =
    allGatesPass &&
    noBlocking &&
    artifactSnapshots.ok &&
    perceptual.ok &&
    gateEval.pngDrift?.ok &&
    gateEval.pngReapproval?.ok &&
    responsiveExecuted &&
    responsivePass &&
    stressSurfacesOk;

  if (readyForCodex) {
    missionVerdict = W1_MISSION_VERDICT.CODEX_REAUDIT;
  } else if (allGatesPass && noBlocking && !artifactSnapshots.ok) {
    missionVerdict = W1_MISSION_VERDICT.SNAPSHOT;
  }

  return {
    missionVerdict,
    entryVerdict: "INDEPENDENT_W1_FAIL",
    exitVerdict: missionVerdict,
    perFamily,
    blockingGates: gateEval.blockingGates,
    blockingReasons: gateEval.allFailed,
    publication: gatesToPublicationPayload(gateEval),
    pngDrift: gateEval.pngDrift,
    pngReapproval: gateEval.pngReapproval,
    budgetCoverage: gateEval.budgetCoverage,
    bitmapSummary: gateEval.bitmapSummary,
    artifactSnapshots,
    perceptualApproval: perceptual,
    responsiveTestsExecuted: responsiveExecuted,
    responsiveTestsPass: responsivePass,
    responsiveProof: gateEval.responsiveProof ?? context.responsiveProof,
    stressSurfaces: gateEval.stressSurfaces ?? context.stressProof,
    perceptualApproval768: perceptual.ok ? "PASS_CODEX" : "FAIL",
    perceptualApprovalHtmlCandidates: perceptual.ok ? "PASS_CODEX" : "FAIL",
    approvedPngDrift: gateEval.pngReapproval?.ok ? "PASS" : "FAIL",
    artifactSnapshotDrift: artifactSnapshots.ok ? "PASS" : "FAIL",
    gitBaseline: "19b2892d6379ae16819c2b9b2dee53e900b59256",
    p0Global: "VCCK_P0_BLOCKED",
    identityDebt: "OUT_OF_SCOPE_W1",
    familiesRemainExperimental: true,
  };
}

/** Assert JSON, Markdown, gallery and logs cannot exceed structured verdict favorability. */
export function assertW1VerdictPublicationCoherence(structuredVerdict, surfaces = {}) {
  const errors = [];
  const mission = structuredVerdict.missionVerdict;

  for (const [familyId, payload] of Object.entries(surfaces)) {
    if (!W1_FAMILIES.includes(familyId)) continue;
    const familyVerdict = structuredVerdict.perFamily.find((f) => f.familyId === familyId);
    if (!familyVerdict) continue;
    if (payload.verdict && payload.verdict !== familyVerdict.status && payload.verdict !== "EXPERIMENTAL") {
      if (familyVerdict.failed.length > 0) {
        errors.push(`${familyId}: surface verdict ${payload.verdict} more favorable than ${familyVerdict.status}`);
      }
    }
    for (const gate of W1_REQUIRED_GATES) {
      const surfaceGate = payload[gate] ?? payload.gates?.[gate];
      if (surfaceGate === true || surfaceGate === "PASS") {
        if (familyVerdict.gates[gate] !== "PASS") {
          errors.push(`${familyId}:${gate} surface PASS but structured ${familyVerdict.gates[gate]}`);
        }
      }
    }
  }

  if (
    surfaces.missionVerdict &&
    (surfaces.missionVerdict === W1_MISSION_VERDICT.CODEX_REAUDIT ||
      surfaces.missionVerdict === W1_MISSION_VERDICT.GIT_BASELINE) &&
    mission !== surfaces.missionVerdict
  ) {
    errors.push(`mission surface ${surfaces.missionVerdict} more favorable than ${mission}`);
  }

  return { ok: errors.length === 0, errors };
}

export { evaluateW1FamilyGates, evaluateW1MissionGates, W1_REQUIRED_GATES };
