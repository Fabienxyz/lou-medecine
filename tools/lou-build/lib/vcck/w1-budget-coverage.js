/**
 * W1 budget fixture coverage — measured rates only, no declarative literals.
 */

import fs from "node:fs";
import path from "node:path";
import { loadVisualSpec } from "../visual-spec.js";
import { gateBeforeRender } from "./signature-analyzer.js";
import { checkBudgets, labelWordMetrics } from "./budgets.js";
import { runW1Pipeline } from "./w1-pipeline.js";
import { enforceFamilyContract } from "./w1-contracts.js";
import { VCCK_W1, VCCK_REPORTS } from "./paths.js";
import { W1_FAMILIES } from "./w1-constants.js";
import { loadFamilyRegistry } from "./registry.js";

const TEXT_THRESHOLD = 0.9;
const CARDINAL_THRESHOLD = 0.9;

const FIXTURE_ROLES = Object.freeze({
  "cardinal-90": "cardinal-90",
  "cardinal-plus1": "cardinal-plus1",
  "text-90": "text-90",
  "stress-90": "stress-90",
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

function linearStructuralMaxBranches(budgets) {
  if (budgets.maxNodes == null) return null;
  return budgets.maxNodes - 1;
}

/** Per-family cardinal axis resolution — no generic fallback chain. */
export function resolveCardinalAxes(familyId, budgets) {
  switch (familyId) {
    case "chain":
      return [
        {
          axis: "maxNodes",
          declaredMax: budgets.maxNodes,
          structuralMax: budgets.maxNodes,
          max: budgets.maxNodes,
          observed: (spec, detail) => detail.nodeCount ?? (spec.nodes || []).length,
        },
      ];
    case "dependent-sequence": {
      const structuralBranches = linearStructuralMaxBranches(budgets);
      return [
        {
          axis: "maxNodes",
          declaredMax: budgets.maxNodes,
          structuralMax: budgets.maxNodes,
          max: budgets.maxNodes,
          observed: (spec, detail) => detail.nodeCount ?? (spec.nodes || []).length,
        },
        {
          axis: "maxBranches",
          declaredMax: budgets.maxBranches,
          structuralMax: structuralBranches,
          max: budgets.maxBranches,
          observed: (spec, detail) => detail.branchCount ?? (spec.branches || []).length,
        },
      ];
    }
    case "two-pole":
      return [
        {
          axis: "maxDimensions",
          declaredMax: budgets.maxDimensions,
          structuralMax: budgets.maxDimensions,
          max: budgets.maxDimensions,
          observed: (spec, detail) => detail.dimensionCount ?? (spec.dimensions || []).length,
        },
        {
          axis: "maxPoles",
          declaredMax: budgets.maxPoles,
          structuralMax: budgets.maxPoles,
          max: budgets.maxPoles,
          observed: (spec, detail) => detail.poleCount ?? (spec.poles || []).length,
        },
      ];
    case "flat-concurrent":
      return [
        {
          axis: "maxItems",
          declaredMax: budgets.maxItems,
          structuralMax: budgets.maxItems,
          max: budgets.maxItems,
          observed: (spec, detail) => {
            if (detail.itemCount != null) return detail.itemCount;
            let count = 0;
            for (const g of spec.groups || []) count += (g.items || []).length;
            return count;
          },
        },
      ];
    default:
      return [];
  }
}

function occupancy(value, max) {
  if (max == null || max <= 0 || value == null) return null;
  return value / max;
}

function observedForBudgetField(spec, detail, field) {
  switch (field) {
    case "maxNodes":
      return detail.nodeCount ?? (spec.nodes || []).length;
    case "maxEdges":
      return detail.edgeCount ?? (spec.edges || []).filter((e) => e.relation !== "feeds_back").length;
    case "maxBranches":
      return detail.branchCount ?? (spec.branches || []).length;
    case "maxDimensions":
      return detail.dimensionCount ?? (spec.dimensions || []).length;
    case "maxPoles":
      return detail.poleCount ?? (spec.poles || []).length;
    case "maxItems": {
      if (detail.itemCount != null) return detail.itemCount;
      let count = 0;
      for (const g of spec.groups || []) count += (g.items || []).length;
      return count;
    }
    default:
      return null;
  }
}

function declaredMaxForField(familyId, budgets, field) {
  for (const ax of resolveCardinalAxes(familyId, budgets)) {
    if (ax.axis === field) return ax.declaredMax;
  }
  return budgets[field];
}

function evaluateCardinalPlus1(spec, familyId, budgets) {
  const budget = checkBudgets(spec, { familyId });
  const gate = gateBeforeRender(spec, { familyId });
  const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });
  const field = budget.detail?.field;
  const observed = field ? observedForBudgetField(spec, budget.detail || {}, field) : null;
  const declaredMax = field ? declaredMaxForField(familyId, budgets, field) : null;
  const code = budget.code || gate.code;
  const gateBlocked = gate.allowed === false;
  const budgetBlocked = budget.ok === false;
  const rendererBlocked = pipeline.ok === false;
  const exactCode = code === "BUDGET_EXCEEDED";
  const exactObserved = observed != null && declaredMax != null && observed === declaredMax + 1;

  const pass =
    gateBlocked && budgetBlocked && rendererBlocked && exactCode && exactObserved;

  return {
    code,
    field,
    observed,
    declaredMax,
    expectedObserved: declaredMax != null ? declaredMax + 1 : null,
    gateBlocked,
    budgetBlocked,
    rendererBlocked,
    result: pass ? "PASS" : "FAIL",
  };
}

function evaluateTextNegative(spec, familyId) {
  const budget = checkBudgets(spec, { familyId });
  const gate = gateBeforeRender(spec, { familyId });
  const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });
  const code = budget.code || gate.code;
  const pass =
    gate.allowed === false &&
    budget.ok === false &&
    pipeline.ok === false &&
    code === "UNSUPPORTED_TEXT_LOAD";
  return { code, result: pass ? "PASS" : "FAIL", gateBlocked: !gate.allowed, rendererBlocked: !pipeline.ok };
}

export function evaluateTopoNegative(spec, familyId) {
  const enforced = enforceFamilyContract(spec, familyId);
  const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });
  const code = enforced.code;
  const positiveRecognition = enforced.ok === true && enforced.family === familyId;
  const pass =
    enforced.ok === false &&
    code === "UNSUPPORTED_TOPOLOGY" &&
    pipeline.ok === false &&
    !positiveRecognition;

  return {
    code,
    result: pass ? "PASS" : "FAIL",
    contractBlocked: enforced.ok === false,
    rendererBlocked: pipeline.ok === false,
    positiveRecognition,
    contract: enforced.contract,
  };
}

function evaluateText90(spec, familyId, budgets) {
  const budget = checkBudgets(spec, { familyId });
  const metrics = labelWordMetrics(spec);
  const maxAllowed = budgets.maxLabelWords ?? budget.detail?.budgets?.maxLabelWords;
  const observed = budget.detail?.labelWords ?? metrics.maxWords;
  const rate = occupancy(observed, maxAllowed);
  const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });
  const pass =
    pipeline.ok &&
    rate != null &&
    rate >= TEXT_THRESHOLD &&
    rate <= 1.0 &&
    observed <= maxAllowed;
  return {
    maxAllowed,
    observed,
    maxLabel: metrics.maxLabel,
    maxLabelLocation: metrics.maxLabelLocation,
    rate,
    threshold: TEXT_THRESHOLD,
    result: pass ? "PASS" : "FAIL",
    pipelineOk: pipeline.ok,
  };
}

function evaluateCardinal90(spec, familyId, budgets) {
  const budget = checkBudgets(spec, { familyId });
  const axes = resolveCardinalAxes(familyId, budgets);
  const axisResults = axes.map((ax) => {
    const observed = ax.observed(spec, budget.detail || {});
    const rate = occupancy(observed, ax.max);
    return {
      axis: ax.axis,
      declaredMax: ax.declaredMax,
      structuralMax: ax.structuralMax,
      maxAllowed: ax.max,
      observed,
      rate,
      threshold: CARDINAL_THRESHOLD,
      pass: rate != null && rate >= CARDINAL_THRESHOLD && rate <= 1.0 && observed <= ax.max,
    };
  });
  const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });
  const pass = pipeline.ok && axisResults.length > 0 && axisResults.every((a) => a.pass);
  return { axisResults, threshold: CARDINAL_THRESHOLD, result: pass ? "PASS" : "FAIL", pipelineOk: pipeline.ok };
}

export function evaluateW1BudgetCoverage() {
  const registry = loadFamilyRegistry();
  const matrix = [];
  const errors = [];

  for (const familyId of W1_FAMILIES) {
    const family = registry.families.find((f) => f.id === familyId);
    const budgets = family?.budgets || {};
    const fixtures = listW1Fixtures(familyId);

    if (familyId === "dependent-sequence") {
      const structural = linearStructuralMaxBranches(budgets);
      if (budgets.maxBranches !== structural) {
        errors.push(
          `BLOCKED_REGISTRY_BUDGET_INCONSISTENCY: maxBranches ${budgets.maxBranches} !== structural ${structural}`,
        );
      }
    }

    for (const role of ["cardinal-90", "cardinal-plus1", "text-90", "stress-90", "topo-negative", "text-negative"]) {
      if (!fixtures.some((f) => f.role === role)) {
        errors.push(`${familyId}: missing ${role} fixture`);
      }
    }

    for (const fx of fixtures) {
      let row = {
        familyId,
        fixture: fx.file,
        role: fx.role,
        result: "SKIP",
      };

      try {
        const spec = loadVisualSpec(fx.path);

        if (fx.role === "cardinal-90") {
          const eval90 = evaluateCardinal90(spec, familyId, budgets);
          row = {
            ...row,
            axisResults: eval90.axisResults,
            occupancyRate: eval90.axisResults[0]?.rate ?? null,
            threshold: CARDINAL_THRESHOLD,
            result: eval90.result,
          };
          if (eval90.result !== "PASS") {
            errors.push(`${familyId}:${fx.file} cardinal-90 failed ${JSON.stringify(eval90.axisResults)}`);
          }
        } else if (fx.role === "cardinal-plus1") {
          const evalPlus = evaluateCardinalPlus1(spec, familyId, budgets);
          row = {
            ...row,
            code: evalPlus.code,
            field: evalPlus.field,
            observed: evalPlus.observed,
            declaredMax: evalPlus.declaredMax,
            expectedObserved: evalPlus.expectedObserved,
            result: evalPlus.result,
          };
          if (evalPlus.result !== "PASS") {
            errors.push(
              `${familyId}:${fx.file} cardinal+1 expected BUDGET_EXCEEDED at ${evalPlus.expectedObserved} got code=${evalPlus.code} observed=${evalPlus.observed}`,
            );
          }
        } else if (fx.role === "text-90") {
          const evalText = evaluateText90(spec, familyId, budgets);
          row = {
            ...row,
            maxAllowed: evalText.maxAllowed,
            testedValue: evalText.observed,
            maxLabel: evalText.maxLabel,
            maxLabelLocation: evalText.maxLabelLocation,
            occupancyRate: evalText.rate,
            threshold: TEXT_THRESHOLD,
            result: evalText.result,
          };
          if (evalText.result !== "PASS") {
            errors.push(
              `${familyId}:${fx.file} text rate ${evalText.rate} observed ${evalText.observed}/${evalText.maxAllowed}`,
            );
          }
        } else if (fx.role === "stress-90") {
          const cardinal = evaluateCardinal90(spec, familyId, budgets);
          const text = evaluateText90(spec, familyId, budgets);
          const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });
          row = {
            ...row,
            axisResults: cardinal.axisResults,
            textRate: text.rate,
            textObserved: text.observed,
            textMaxAllowed: text.maxAllowed,
            maxLabelLocation: text.maxLabelLocation,
            threshold: TEXT_THRESHOLD,
            result:
              pipeline.ok && cardinal.result === "PASS" && text.result === "PASS" ? "PASS" : "FAIL",
          };
          if (row.result !== "PASS") errors.push(`${familyId}:${fx.file} stress-90 failed`);
        } else if (fx.role === "text-negative") {
          const evalNeg = evaluateTextNegative(spec, familyId);
          row = { ...row, code: evalNeg.code, result: evalNeg.result };
          if (evalNeg.result !== "PASS") {
            errors.push(`${familyId}:${fx.file} text-negative expected UNSUPPORTED_TEXT_LOAD got ${evalNeg.code}`);
          }
        } else if (fx.role === "topo-negative") {
          const evalTopo = evaluateTopoNegative(spec, familyId);
          row = { ...row, code: evalTopo.code, result: evalTopo.result };
          if (evalTopo.result !== "PASS") {
            errors.push(
              `${familyId}:${fx.file} topo-negative expected UNSUPPORTED_TOPOLOGY got ${evalTopo.code ?? "none"}`,
            );
          }
        } else if (fx.role?.startsWith("char-") || fx.role === "permutation") {
          const pipeline = runW1Pipeline(spec, { expectedFamily: familyId });
          row.result = pipeline.ok ? "PASS" : "FAIL";
          if (!pipeline.ok) errors.push(`${familyId}:${fx.file} ${fx.role} pipeline failed`);
        }

        matrix.push(row);
      } catch (e) {
        errors.push(`${familyId}:${fx.file} load error ${e.message}`);
        matrix.push({ ...row, result: "ERROR", error: String(e.message) });
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
