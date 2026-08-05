/**
 * Dedicated reject-code fixtures — single authority for the nine mandatory diagnostics.
 */

import fs from "node:fs";
import path from "node:path";
import { VCCK_REJECT } from "./paths.js";
import { loadVisualSpec } from "../visual-spec.js";
import { gateBeforeRender } from "./signature-analyzer.js";
import { renderVcckSpec } from "./render-bridge.js";
import { loadVcckInventory } from "./inventory.js";
import { CONTROL } from "./status.js";

export const REJECT_FIXTURE_DEFS = [
  { file: "reject-unsupported-topology.yaml", code: "UNSUPPORTED_TOPOLOGY" },
  { file: "reject-non-planar.yaml", code: "NON_PLANAR_REQUIRED_CROSSING" },
  { file: "reject-budget-exceeded.yaml", code: "BUDGET_EXCEEDED" },
  { file: "reject-ambiguous-edge.yaml", code: "AMBIGUOUS_EDGE_ORIGIN" },
  { file: "reject-unsupported-nesting.yaml", code: "UNSUPPORTED_NESTING" },
  { file: "reject-temporal-as-causal.yaml", code: "TEMPORAL_AS_CAUSAL" },
  { file: "reject-unlabelled-branch.yaml", code: "UNLABELLED_DECISION_BRANCH" },
  { file: "reject-missing-terminal.yaml", code: "MISSING_TERMINAL" },
  { file: "reject-text-load.yaml", code: "UNSUPPORTED_TEXT_LOAD" },
];

/** True when a reject result satisfies all proof conditions. */
export function isRejectProofPass(result) {
  return (
    result.negative === CONTROL.PASS &&
    result.renderBlocked === true &&
    result.code === result.expectedCode
  );
}

/** Evaluate all nine reject fixtures. */
export function runAllRejectFixtures(options = {}) {
  const inventory = options.inventory || loadVcckInventory();
  const results = [];

  for (const def of REJECT_FIXTURE_DEFS) {
    const loadPath = path.join(VCCK_REJECT, def.file);
    if (!fs.existsSync(loadPath)) {
      results.push({
        ...def,
        fixture: def.file,
        expectedCode: def.code,
        kind: "reject",
        negative: CONTROL.FAIL,
        renderBlocked: false,
        code: null,
        errors: ["fixture missing"],
      });
      continue;
    }
    const r = runRejectFixture(loadPath, def.code, { inventory });
    results.push({ ...def, expectedCode: def.code, ...r });
  }

  return results;
}

export function computeRejectFixturesOk(rejectResults) {
  return (
    rejectResults.length === REJECT_FIXTURE_DEFS.length &&
    rejectResults.every(isRejectProofPass)
  );
}

/** Run dedicated reject-code fixture (P0.8). */
export function runRejectFixture(loadPath, expectedCode, options = {}) {
  const inventory = options.inventory || loadVcckInventory();
  const result = {
    fixture: path.basename(loadPath),
    kind: "reject",
    expectedCode,
    code: null,
    negative: CONTROL.FAIL,
    renderBlocked: false,
    errors: [],
  };

  let spec;
  try {
    spec = loadVisualSpec(loadPath);
  } catch (e) {
    result.errors.push(String(e.message || e));
    return result;
  }

  const gate = gateBeforeRender(spec);
  result.code = gate.code;

  if (gate.allowed) {
    result.errors.push("gate allowed — expected reject");
    return result;
  }

  if (gate.code !== expectedCode) {
    result.errors.push(`expected ${expectedCode}, got ${gate.code}`);
    return result;
  }

  const attempted = renderVcckSpec(spec, { inventory });
  result.renderBlocked = !attempted.ok;
  if (attempted.ok) {
    result.errors.push("renderer must remain blocked");
    return result;
  }

  result.negative = CONTROL.PASS;
  return result;
}
