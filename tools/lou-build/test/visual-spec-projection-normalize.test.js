import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  conditionRedundantWithThresholdFragment,
  deriveThresholdBranchLabelFromFragment,
  formatThresholdFragmentScaleLine,
  normalizeVisualSpecForProjection,
} from "../lib/visual-spec-projection-normalize.js";
import { validateVisualSpec, visualSpecClaimUnits, loadVisualSpec } from "../lib/visual-spec.js";
import path from "node:path";
import { REPO_ROOT } from "../lib/paths.js";

describe("visual-spec-projection-normalize", () => {
  it("formatThresholdFragmentScaleLine composes analyte + cutoff", () => {
    const line = formatThresholdFragmentScaleLine({
      analyte: "BNP",
      cutoff_label: "< 35 pg/mL",
    });
    assert.equal(line, "BNP < 35 pg/mL");
  });

  it("detects redundant branch condition when thresholds are duplicated in condition", () => {
    const fragment = {
      scales: [
        { analyte: "BNP", cutoff_label: "< 35 pg/mL", value: 35 },
        { analyte: "NT-proBNP", cutoff_label: "< 125 pg/mL", value: 125 },
      ],
    };
    const derived = deriveThresholdBranchLabelFromFragment(fragment);
    assert.match(derived, /BNP/);
    assert.equal(
      conditionRedundantWithThresholdFragment(
        "BNP < 35 pg/mL ou NT-proBNP < 125 pg/mL",
        fragment,
      ),
      true,
    );
    assert.equal(conditionRedundantWithThresholdFragment("Seuils bas", fragment), false);
  });

  it("validation rejects redundant threshold branch conditions", () => {
    const spec = {
      spec_version: "0.2",
      primitive: "decision-algorithm",
      variant: "diagnostic",
      element: "test-redundant-branch",
      chapter: "test",
      question: "Q?",
      nodes: [
        { id: "n1", kind: "entry", label: "Start", class: "scaffolding" },
        { id: "n2", kind: "dead-end", label: "End", class: "scaffolding" },
      ],
      branches: [{
        id: "b1",
        from: "n1",
        to: "n2",
        condition: "BNP < 35 pg/mL",
        class: "scaffolding",
        threshold_fragment: {
          context: "ctx",
          low_band_meaning: "low",
          scales: [{
            id: "s1",
            analyte: "BNP",
            cutoff_label: "< 35 pg/mL",
            comparator: "<",
            value: 35,
            unit: "pg/mL",
            class: "scaffolding",
          }],
        },
      }],
    };
    const v = validateVisualSpec(spec);
    assert.equal(v.ok, false);
    assert.ok(v.errors.some((e) => e.includes("qualitative condition")));
  });

  it("threshold_fragment emits scale-line facts only, not separate cutoff facts", () => {
    const spec = {
      spec_version: "0.2",
      primitive: "decision-algorithm",
      variant: "diagnostic",
      element: "test-frag-claims",
      chapter: "test",
      question: "Q?",
      nodes: [
        { id: "n1", kind: "entry", label: "Start", class: "scaffolding" },
        { id: "n2", kind: "dead-end", label: "End", class: "scaffolding" },
      ],
      branches: [{
        id: "b1",
        from: "n1",
        to: "n2",
        condition: "Seuils bas",
        class: "scaffolding",
        threshold_fragment: {
          context: "hors urgence",
          low_band_meaning: "IC peu probable",
          scales: [{
            id: "frag-bnp",
            analyte: "BNP",
            cutoff_label: "< 35 pg/mL",
            comparator: "<",
            value: 35,
            unit: "pg/mL",
            class: "scaffolding",
          }],
        },
      }],
    };
    const units = visualSpecClaimUnits(normalizeVisualSpecForProjection(spec));
    assert.ok(units.some((u) => u.unit === "threshold-fragment-scale-line"));
    assert.equal(units.filter((u) => u.unit === "threshold-cutoff").length, 0);
    assert.ok(units.some((u) => u.unit === "branch" && u.text === "Seuils bas"));
  });

  it("N09 official spec validates after normalization", () => {
    const spec = loadVisualSpec(
      path.join(REPO_ROOT, "01-learning/chapters/cardio/234/build/visual-specs/n09-diagnostic-algorithm.yaml"),
    );
    const v = validateVisualSpec(spec);
    assert.equal(v.ok, true, v.errors?.join("; "));
  });
});
