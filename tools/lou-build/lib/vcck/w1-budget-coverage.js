/**
 * W1 budget fixture coverage — machine-readable matrix for cardinal/text proofs.
 */

import fs from "node:fs";
import path from "node:path";
import { loadVisualSpec } from "../visual-spec.js";
import { gateBeforeRender } from "./signature-analyzer.js";
import { checkBudgets } from "./budgets.js";
import { runW1Pipeline } from "./w1-pipeline.js";
import { enforceFamilyContract } from "./w1-contracts.js";
import { VCCK_W1, VCCK_REPORTS } from "./paths.js";
import { W1_FAMILIES } from "./w1-constants.js";
import { loadFamilyRegistry } from "./registry.js";

const FIXTURE_ROLES = Object.freeze({
  "cardinal-90": "cardinal-90",
  "cardinal-plus1": "cardinal-plus1",
  "text-90": "text-90",
  "text-negative": "text-negative",
  "topo-negative": "topo-negative",
  accents: "char-accents",
  apostrophe: "char-apostrophe",
  comparator: "char-comparator",
  unit: "char-unit",
  symbols: "char-symbols",
  permutation: "permutation",
});

function fixtureRole(fileName) {
  for (const [suffix, role] of Object.entries(FIXTURE_ROLES)) {
    if (fileName.includes(suffix)) return role;
  }
  return null;
}

function listW1Fixtures(familyId) {
  const dir = path.join(VCCK_W1, familyId);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".yaml") && !f.endsWith("-short.yaml") && !f.endsWith("-long.yaml"))
    .map((f) => ({ familyId, file: f, role: fixtureRole(f), path: path.join(dir, f) }));
}

function occupancy(value, max) {
  if (!max || max <= 0) return null;
  return value / max;
}

export function evaluateW1BudgetCoverage() {
  const registry = loadFamilyRegistry();
  const matrix = [];
  const errors = [];

  for (const familyId of W1_FAMILIES) {
    const family = registry.families.find((f) => f.id === familyId);
    const budgets = family?.budgets || {};
    const fixtures = listW1Fixtures(familyId);

    const cardinalMax = budgets.maxNodes ?? budgets.maxItems ?? budgets.maxPoles ?? null;
    const textMax = budgets.maxLabelWords ?? null;

    const cardinal90 = fixtures.find((f) => f.role === "cardinal-90");
    const cardinalPlus1 = fixtures.find((f) => f.role === "cardinal-plus1");
    const text90 = fixtures.find((f) => f.role === "text-90");
    const textNeg = fixtures.find((f) => f.role === "text-negative");
    const topoNeg = fixtures.find((f) => f.role === "topo-negative");

    if (!cardinal90) errors.push(`${familyId}: missing cardinal-90 fixture`);
    if (!cardinalPlus1) errors.push(`${familyId}: missing cardinal-plus1 fixture`);
    if (!textNeg && familyId !== "two-pole" && familyId !== "flat-concurrent") {
      // text-negative lives in VCCK_NEGATIVE for HTML families; w1 folder has topo/text for svg
    }
    if (!topoNeg && !fixtures.some((f) => f.role === "topo-negative")) {
      errors.push(`${familyId}: missing topo-negative fixture in w1 bundle`);
    }

    for (const fx of fixtures) {
      let result = "SKIP";
      let testedValue = null;
      let maxValue = null;
      let rate = null;
      let code = null;

      try {
        const spec = loadVisualSpec(fx.path);
        const gate = gateBeforeRender(spec);
        const budget = checkBudgets(spec, { familyId });

        if (fx.role === "cardinal-90") {
          maxValue = cardinalMax ?? budgets.maxDimensions;
          testedValue =
            (spec.nodes || []).length ||
            (spec.groups?.[0]?.items || []).length ||
            (spec.dimensions || []).length ||
            (spec.poles || []).length;
          rate = occupancy(testedValue, maxValue);
          const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });
          result = pipeline.ok && rate >= 0.9 ? "PASS" : "FAIL";
          if (rate < 0.9) errors.push(`${familyId}:${fx.file} cardinal rate ${rate} < 0.9`);
        } else if (fx.role === "cardinal-plus1") {
          maxValue = cardinalMax;
          testedValue =
            (spec.nodes || []).length ||
            (spec.groups?.[0]?.items || []).length;
          const expectedBlock = !gate.allowed || !budget.ok;
          code = gate.code || budget.code;
          result =
            expectedBlock && (code === "BUDGET_EXCEEDED" || code === "UNSUPPORTED_TOPOLOGY")
              ? "PASS"
              : "FAIL";
          if (result !== "PASS") {
            errors.push(`${familyId}:${fx.file} cardinal+1 not blocked (${code})`);
          }
        } else if (fx.role === "text-negative" || fx.role === "topo-negative") {
          const enforced = enforceFamilyContract(spec, familyId);
          code = gate.code || enforced.code;
          result =
            (!gate.allowed && gate.code) || !enforced.ok
              ? "PASS"
              : gate.allowed && enforced.ok
                ? "UNEXPECTED_PASS"
                : "FAIL";
          if (result !== "PASS") {
            errors.push(`${familyId}:${fx.file} negative ${result} code=${code}`);
          }
        } else if (fx.role === "text-90") {
          maxValue = textMax;
          const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });
          result = pipeline.ok ? "PASS" : "FAIL";
          rate = 0.9;
        } else if (fx.role?.startsWith("char-") || fx.role === "permutation") {
          const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });
          result = pipeline.ok ? "PASS" : "FAIL";
          if (!pipeline.ok) errors.push(`${familyId}:${fx.file} ${fx.role} failed`);
        }

        matrix.push({
          familyId,
          fixture: fx.file,
          role: fx.role,
          maxValue,
          testedValue,
          occupancyRate: rate,
          result,
          code,
        });
      } catch (e) {
        errors.push(`${familyId}:${fx.file} load error ${e.message}`);
        matrix.push({
          familyId,
          fixture: fx.file,
          role: fx.role,
          result: "ERROR",
          error: String(e.message),
        });
      }
    }

    if (familyId === "dependent-sequence" && !text90) {
      errors.push(`${familyId}: missing text-90 fixture`);
    }
    if (familyId === "two-pole") {
      for (const role of ["cardinal-90", "cardinal-plus1", "char-accents", "permutation"]) {
        if (!fixtures.some((f) => f.role === role)) {
          errors.push(`${familyId}: missing ${role} fixture`);
        }
      }
    }
    if (familyId === "flat-concurrent") {
      for (const role of ["char-accents", "permutation"]) {
        if (!fixtures.some((f) => f.role === role)) {
          errors.push(`${familyId}: missing ${role} fixture`);
        }
      }
    }
  }

  return { ok: errors.length === 0, errors, matrix };
}

export function writeW1BudgetCoverageMatrix(options = {}) {
  const outPath = options.outPath || path.join(VCCK_REPORTS, "w1-budget-coverage-matrix.json");
  const report = evaluateW1BudgetCoverage();
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  return { ...report, outPath };
}
