/**
 * VCCK control statuses — monotonic, no SKIP → PASS promotion.
 */

export const CONTROL = Object.freeze({
  PASS: "PASS",
  FAIL: "FAIL",
  BLOCKED: "BLOCKED",
  N_A: "N/A",
});

/** P0 fixture-level statuses — never reuse READY_FOR_VCCK_AUDIT at fixture level. */
export const FIXTURE_STATUS = Object.freeze({
  PROOF_PASS: "P0_FIXTURE_PROOF_PASS",
  EXPERIMENTAL: "EXPERIMENTAL",
});

/** Family harness aggregate (informational only — families stay EXPERIMENTAL in registry). */
export const FAMILY_HARNESS_STATUS = Object.freeze({
  PASS: "P0_FAMILY_HARNESS_PASS",
  EXPERIMENTAL: "EXPERIMENTAL",
});

/** Statuses that block favorable promotion on any control. */
export const BLOCKING = new Set([CONTROL.FAIL, CONTROL.BLOCKED, "SKIP"]);

const STRICT_POSITIVE_KEYS = [
  "recognition",
  "fixtureValidation",
  "render",
  "viewports",
  "surfaces",
  "determinism",
];

/** Map summarizeRow keys to result object keys. */
const ROW_POSITIVE_KEYS = [
  ["recognition", "recognition"],
  ["fixture", "fixtureValidation"],
  ["render", "render"],
  ["viewports", "viewports"],
  ["surfaces", "surfaces"],
  ["determinism", "determinism"],
];

/**
 * Strict positive proof pass — every control must be exactly PASS.
 */
export function strictPositiveControlsPass(row) {
  const get = (summaryKey, resultKey) => row[summaryKey] ?? row[resultKey];
  for (const [sk, rk] of ROW_POSITIVE_KEYS) {
    const v = get(sk, rk);
    if (v !== CONTROL.PASS) return false;
  }
  return true;
}

/**
 * Strict negative proof pass.
 */
export function strictNegativeControlsPass(row) {
  return (
    row.recognition === "REJECTED" &&
    row.negative === CONTROL.PASS &&
    row.code === row.expectedCode
  );
}

/**
 * Returns false for any non-PASS control value on positives (including BLOCKED, N/A, SKIP, FAIL, unknown).
 */
export function isFavorableControlValue(value) {
  return value === CONTROL.PASS;
}

/**
 * Derive fixture status — strict: all PASS → P0_FIXTURE_PROOF_PASS, else EXPERIMENTAL.
 */
export function deriveFixtureStatus(controls) {
  const mapped = {
    recognition: controls.recognition,
    fixtureValidation: controls.fixtureValidation ?? controls.fixture,
    render: controls.render,
    viewports: controls.viewports,
    surfaces: controls.surfaces,
    determinism: controls.determinism,
  };
  if (strictPositiveControlsPass(mapped)) return FIXTURE_STATUS.PROOF_PASS;
  return FIXTURE_STATUS.EXPERIMENTAL;
}

/**
 * Mission-level verdict — proof harness + surfaces (after Playwright).
 */
export function deriveMissionVerdict(ctx) {
  const {
    proofHarnessReady = false,
    surfacesComplete = false,
    dryRun = false,
  } = ctx;

  if (dryRun) return "VCCK_P0_BLOCKED";

  if (proofHarnessReady && surfacesComplete) {
    return "READY_FOR_VCCK_P1_FAMILY_REDESIGN";
  }
  return "VCCK_P0_BLOCKED";
}

/**
 * Aggregate control column across rows — never promotes BLOCKED/FAIL to PASS.
 */
export function aggregateControl(rows, key) {
  const vals = rows.map((r) => r[key]).filter((v) => v && v !== CONTROL.N_A);
  if (vals.length === 0) return CONTROL.N_A;
  if (vals.some((v) => v === "SKIP")) return CONTROL.BLOCKED;
  if (vals.some((v) => v === CONTROL.FAIL)) return CONTROL.FAIL;
  if (vals.some((v) => v === CONTROL.BLOCKED)) return CONTROL.BLOCKED;
  if (vals.every((v) => v === CONTROL.PASS)) return CONTROL.PASS;
  return vals.join("/");
}

/**
 * Ensure summary row is not more favorable than any detail row.
 * @param {Map} summaryRows
 * @param {object[]} detailRows
 * @param {object[]} [rejectResults]
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function assertReportCoherence(summaryRows, detailRows, rejectResults = []) {
  const errors = [];
  const positiveKeys = ["recognition", "fixture", "render", "viewports", "surfaces", "determinism"];

  for (const [familyId, summary] of summaryRows) {
    const allDetails = detailRows.filter((d) => d.family === familyId);
    const posDetails = allDetails.filter((d) => d.kind === "positive");
    const negDetails = allDetails.filter((d) => d.kind === "negative");

    for (const key of positiveKeys) {
      const sumVal = summary[key];
      if (sumVal === CONTROL.PASS || sumVal === FIXTURE_STATUS.PROOF_PASS) {
        for (const d of posDetails) {
          const dv = d[key];
          if (BLOCKING.has(dv) || dv === CONTROL.FAIL || dv === CONTROL.BLOCKED) {
            errors.push(
              `${familyId}.${key}: summary=${sumVal} but detail ${d.fixtureFile || d.kind}=${dv}`,
            );
          }
        }
      }
    }

    const sumNeg = summary.negative;
    if (sumNeg === CONTROL.PASS) {
      for (const d of negDetails) {
        const dv = d.negative;
        if (BLOCKING.has(dv) || dv === CONTROL.FAIL || dv === CONTROL.BLOCKED) {
          errors.push(
            `${familyId}.negative: summary=${sumNeg} but detail ${d.fixtureFile || d.kind}=${dv}`,
          );
        }
      }
    }

    const detailStatuses = allDetails.map((d) => d.status).filter(Boolean);
    if (summary.status === FAMILY_HARNESS_STATUS.PASS) {
      for (const ds of detailStatuses) {
        if (ds !== FIXTURE_STATUS.PROOF_PASS) {
          errors.push(`${familyId}.status: summary HARNESS_PASS but detail status=${ds}`);
        }
      }
    }
  }

  for (const r of rejectResults) {
    if (r.negative !== CONTROL.PASS || !r.renderBlocked || r.code !== r.expectedCode) {
      errors.push(
        `reject ${r.file || r.fixture}: incoherent reject proof (negative=${r.negative}, renderBlocked=${r.renderBlocked})`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

export function browserUnavailableStatus() {
  return CONTROL.BLOCKED;
}

export function controlNotExecuted() {
  return CONTROL.BLOCKED;
}
