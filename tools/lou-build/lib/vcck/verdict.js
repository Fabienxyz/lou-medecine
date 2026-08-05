/**
 * Single authority for VCCK P0 mission verdict computation.
 */

import { CONTROL } from "./status.js";
import {
  strictPositiveControlsPass,
  strictNegativeControlsPass,
  deriveMissionVerdict,
} from "./status.js";
import { computeRejectFixturesOk } from "./reject-fixtures.js";
import { loadFamilyRegistry, familyById } from "./registry.js";

export { deriveMissionVerdict };

/** Strict IPC gate — skipped or absent results are never favorable. */
export function isInterProcessDeterminismOk(interProcessDeterminism) {
  return (
    interProcessDeterminism != null &&
    interProcessDeterminism.skipped === false &&
    interProcessDeterminism.ok === true
  );
}

/**
 * Compute full P0 verdict bundle from harness metrology inputs.
 * Family positives may remain EXPERIMENTAL — proofHarnessReady judges the harness only.
 */
export function computeVcckVerdict(ctx) {
  const {
    rejectResults = [],
    detailRows = [],
    coherence = { ok: false },
    antiSpec = { ok: false },
    mutants = { ok: false },
    surfaces = { ok: false },
    interProcessDeterminism = { ok: false },
    dryRun = false,
  } = ctx;

  const rejectFixturesOk = computeRejectFixturesOk(rejectResults);

  const hasSkip = detailRows.some((r) =>
    [r.recognition, r.fixture, r.render, r.viewports, r.surfaces, r.negative, r.determinism].includes(
      "SKIP",
    ),
  );

  const familyQualificationResults = summarizeFamilyResults(detailRows);

  const interProcessOk = isInterProcessDeterminismOk(interProcessDeterminism);

  const proofHarnessReady =
    rejectFixturesOk &&
    coherence.ok &&
    antiSpec.ok &&
    mutants.ok &&
    interProcessOk &&
    !hasSkip;

  const missionVerdict = deriveMissionVerdict({
    proofHarnessReady,
    surfacesComplete: surfaces.ok,
    rejectFixturesOk,
    coherenceOk: coherence.ok,
    antiSpecializationOk: antiSpec.ok,
    mutantsOk: mutants.ok,
    interProcessDeterminismOk: interProcessOk,
    noSkipInResults: !hasSkip,
    dryRun,
  });

  return {
    missionVerdict,
    proofHarnessReady,
    rejectFixturesOk,
    familyQualificationResults,
    rejectResults,
    hasSkip,
  };
}

function summarizeFamilyResults(detailRows) {
  const byFamily = new Map();
  for (const row of detailRows) {
    if (!byFamily.has(row.family)) byFamily.set(row.family, []);
    byFamily.get(row.family).push(row);
  }

  const summary = [];
  for (const [familyId, rows] of byFamily) {
    const positives = rows.filter((r) => r.kind === "positive");
    const negatives = rows.filter((r) => r.kind === "negative");
    const posStrict = positives.every(strictPositiveControlsPass);
    const negStrict = negatives.every(strictNegativeControlsPass);
    summary.push({
      family: familyId,
      qualification_status:
        familyById(loadFamilyRegistry(), familyId)?.qualification_status ?? "EXPERIMENTAL",
      positiveStrictPass: posStrict,
      negativeStrictPass: negStrict,
      harnessPass: posStrict && negStrict,
      rows: rows.length,
    });
  }
  return summary;
}
