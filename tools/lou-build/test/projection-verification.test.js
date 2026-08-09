import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { REPO_ROOT } from "../lib/paths.js";
import {
  enumerateLearnerFacts,
  countNormalizedOccurrences,
  classifyMultiplicity,
  classifyFactDisposition,
  extractLearnerVisibleMarks,
  inferMarkLocation,
  verifyFigureProjection,
  verifyCorpusProjection,
  classifyEnumerationGaps,
  evaluateCheckpoint,
  buildDispositionAuditMatrix,
  AUTHORITATIVE_FACT_SOURCE,
  PROJECTION_DISPOSITIONS,
} from "../lib/projection-verification.js";
import {
  compareDeclaredVsObserved,
  DISCARD_REASONS,
  isValidDiscardReason,
  loadDeclaredDispositions,
} from "../lib/total-disposition.js";

const CHAPTER = path.join(REPO_ROOT, "01-learning/chapters/cardio/234");
const SPECS = path.join(CHAPTER, "build/visual-specs");
const FIGURES = path.join(CHAPTER, "figures");

function loadCorpusItem(id, specFile, figureFile) {
  const spec = loadVisualSpec(path.join(SPECS, specFile));
  const artifact = fs.readFileSync(path.join(FIGURES, figureFile), "utf8");
  return { id, spec, artifact };
}

describe("projection-verification", () => {
  it("uses visualSpecClaimUnits as authoritative fact source", () => {
    assert.equal(AUTHORITATIVE_FACT_SOURCE, "visualSpecClaimUnits");
    const { spec } = loadCorpusItem("N09", "n09-diagnostic-algorithm.yaml", "n09-diagnostic-algorithm.svg");
    const facts = enumerateLearnerFacts(spec);
    assert.ok(facts.length > 0);
    assert.ok(facts.every((f) => f.id && f.text && f.unit));
  });

  it("classifies multiplicity: 0 missing, 1 pass, 2+ duplicated", () => {
    assert.equal(classifyMultiplicity(0), "missing");
    assert.equal(classifyMultiplicity(1), "exactly-once");
    assert.equal(classifyMultiplicity(2), "duplicated");
    assert.equal(classifyMultiplicity(5), "duplicated");
  });

  it("counts normalized occurrences deterministically", () => {
    const hay = "BNP < 35 pg/mL ou NT-proBNP < 125 pg/mL BNP < 35 pg/mL";
    assert.equal(countNormalizedOccurrences(hay, "< 35 pg/mL"), 2);
    assert.equal(countNormalizedOccurrences(hay, "< 125 pg/mL"), 1);
    assert.equal(countNormalizedOccurrences(hay, "absent"), 0);
  });

  it("fact absent → missing", () => {
    const spec = {
      spec_version: "0.2",
      primitive: "decision-algorithm",
      variant: "diagnostic",
      element: "test-absent",
      chapter: "test",
      question: "Q?",
      nodes: [{ id: "n1", kind: "entry", label: "Only node", class: "scaffolding" }],
      branches: [{ id: "b1", from: "n1", to: "n1", condition: "loop", class: "scaffolding" }],
    };
    const artifact = `<svg xmlns="http://www.w3.org/2000/svg">
      <g data-layer="nodes"><g data-node-id="n1" data-node-kind="entry">
        <text class="vg-label">Different text</text>
      </g></g>
    </svg>`;
    const report = verifyFigureProjection({ spec, artifact });
    assert.ok(report.violations.missing.length > 0);
    assert.equal(report.summary.exactlyOnce, 0);
  });

  it("fact present once → exactly-once", () => {
    const spec = {
      spec_version: "0.2",
      primitive: "decision-algorithm",
      variant: "diagnostic",
      element: "test-once",
      chapter: "test",
      question: "Q?",
      nodes: [{ id: "n1", kind: "entry", label: "Hello world", class: "scaffolding" }],
      branches: [{ id: "b1", from: "n1", to: "n1", condition: "next", class: "scaffolding" }],
    };
    const artifact = `<svg xmlns="http://www.w3.org/2000/svg">
      <g data-layer="nodes"><g data-node-id="n1" data-node-kind="entry">
        <text class="vg-label">Hello world</text>
      </g></g>
      <g data-layer="branches"><g data-branch-label="b1">
        <text class="vg-branch">next</text>
      </g></g>
    </svg>`;
    const report = verifyFigureProjection({ spec, artifact });
    const nodeFact = report.facts.find((f) => f.type === "node");
    assert.equal(nodeFact.status, "exactly-once");
  });

  it("same fact materialized twice → duplicated", () => {
    const spec = {
      spec_version: "0.2",
      primitive: "decision-algorithm",
      variant: "diagnostic",
      element: "test-dup",
      chapter: "test",
      question: "Q?",
      nodes: [{ id: "n1", kind: "entry", label: "Dup me", class: "scaffolding" }],
      branches: [{ id: "b1", from: "n1", to: "n1", condition: "x", class: "scaffolding" }],
    };
    const artifact = `<svg xmlns="http://www.w3.org/2000/svg">
      <g data-layer="nodes"><g data-node-id="n1"><text class="vg-label">Dup me</text></g></g>
      <g data-layer="branches"><text class="vg-branch">Dup me</text></g>
    </svg>`;
    const report = verifyFigureProjection({ spec, artifact });
    const dup = report.violations.duplicated.find((d) => d.text === "Dup me");
    assert.ok(dup, "expected duplicated fact");
  });

  it("learner-visible mark without fact → orphan", () => {
    const spec = {
      spec_version: "0.2",
      primitive: "decision-algorithm",
      variant: "diagnostic",
      element: "test-orphan",
      chapter: "test",
      question: "Q?",
      nodes: [{ id: "n1", kind: "entry", label: "Known", class: "scaffolding" }],
      branches: [{ id: "b1", from: "n1", to: "n1", condition: "go", class: "scaffolding" }],
    };
    const artifact = `<svg xmlns="http://www.w3.org/2000/svg">
      <g data-layer="nodes"><g data-node-id="n1"><text class="vg-label">Known</text></g></g>
      <g data-layer="branches"><text class="vg-branch">Unknown orphan text</text></g>
    </svg>`;
    const report = verifyFigureProjection({ spec, artifact });
    assert.ok(report.violations.orphans.some((o) => o.text === "Unknown orphan text"));
  });

  it("N09 → no BNP/NT-proBNP threshold duplication after VisualSpec normalization", () => {
    const { spec, artifact } = loadCorpusItem(
      "N09",
      "n09-diagnostic-algorithm.yaml",
      "n09-diagnostic-algorithm.svg",
    );
    const report = verifyFigureProjection({ spec, artifact, figureId: "N09" });

    const dupCutoffs = report.violations.duplicated.filter(
      (d) =>
        d.type === "threshold-fragment-scale-line" ||
        (d.type === "threshold-cutoff" && (d.text.includes("35") || d.text.includes("125"))),
    );
    assert.equal(
      dupCutoffs.length,
      0,
      `expected no threshold duplication, got: ${JSON.stringify(report.violations.duplicated)}`,
    );
  });

  it("N09 → low_band_meaning DERIVED from node n09-unlikely (not the reverse)", () => {
    const { spec, artifact } = loadCorpusItem("N09", "n09-diagnostic-algorithm.yaml", "n09-diagnostic-algorithm.svg");
    const report = verifyFigureProjection({ spec, artifact, figureId: "N09" });
    const node = report.facts.find((f) => f.ref === "n09-unlikely");
    const lbm = report.facts.find((f) => f.type === "threshold-fragment-low-band-meaning");
    assert.equal(node.disposition, "MATERIALIZED");
    assert.equal(lbm.disposition, "DERIVED");
    assert.match(lbm.justification, /node n09-unlikely/);
  });

  it("healthy figure N15-1 → no false threshold-cutoff duplication", () => {
    const { spec, artifact } = loadCorpusItem(
      "N15-1",
      "n15-1-shock-support.yaml",
      "n15-1-shock-support.svg",
    );
    const report = verifyFigureProjection({ spec, artifact, figureId: "N15-1" });
    const cutoffDupes = report.violations.duplicated.filter((d) => d.type === "threshold-cutoff");
    assert.equal(cutoffDupes.length, 0, JSON.stringify(cutoffDupes));
  });

  it("corpus aggregate summarizes all figures", () => {
    const items = [
      loadCorpusItem("N09", "n09-diagnostic-algorithm.yaml", "n09-diagnostic-algorithm.svg"),
      loadCorpusItem("N15-1", "n15-1-shock-support.yaml", "n15-1-shock-support.svg"),
    ];
    const reports = items.map((i) => verifyFigureProjection({ spec: i.spec, artifact: i.artifact, figureId: i.id }));
    const corpus = verifyCorpusProjection(reports);
    assert.equal(corpus.figureCount, 2);
    assert.ok(corpus.totalFacts > 0);
  });

  it("checkpoint PASS for extensible gap categories", () => {
    const gaps = ["question", "threshold-fragment-context", "threshold-fragment-low-band-meaning"];
    const cp = evaluateCheckpoint(gaps);
    assert.equal(cp.verdict, "PASS");
  });

  it("checkpoint STOP for unknown categories", () => {
    const cp = evaluateCheckpoint(["new-abstraction-required"]);
    assert.equal(cp.verdict, "STOP");
  });

  it("extractLearnerVisibleMarks ignores bare structural elements", () => {
    const artifact = `<svg><path d="M0 0"/><rect width="10" height="10"/>
      <g data-layer="nodes"><text class="vg-label">Visible</text></g></svg>`;
    const { marks } = extractLearnerVisibleMarks(artifact);
    assert.equal(marks.length, 1);
    assert.equal(marks[0].text, "Visible");
  });

  it("MATERIALIZED — node label at expected location", () => {
    const spec = {
      spec_version: "0.2",
      primitive: "decision-algorithm",
      variant: "diagnostic",
      element: "test-mat",
      chapter: "test",
      question: "Q?",
      nodes: [{ id: "n1", kind: "entry", label: "Entry label", class: "scaffolding" }],
      branches: [{ id: "b1", from: "n1", to: "n1", condition: "go", class: "scaffolding" }],
    };
    const artifact = `<svg xmlns="http://www.w3.org/2000/svg">
      <g data-layer="nodes"><g data-node-id="n1"><text class="vg-label">Entry label</text></g></g>
      <g data-layer="branches"><g data-branch-label="b1"><text class="vg-branch">go</text></g></g>
    </svg>`;
    const report = verifyFigureProjection({ spec, artifact });
    const node = report.facts.find((f) => f.type === "node");
    assert.equal(node.disposition, "MATERIALIZED");
    assert.match(node.justification, /node label/);
    assert.ok(node.evidence.locations.some((l) => l.startsWith("node:")));
  });

  it("DERIVED — low_band_meaning represented by node", () => {
    const spec = {
      spec_version: "0.2",
      primitive: "decision-algorithm",
      variant: "diagnostic",
      element: "test-derived",
      chapter: "test",
      question: "Q?",
      nodes: [
        { id: "n1", kind: "entry", label: "Start", class: "scaffolding" },
        { id: "dead", kind: "dead-end", label: "IC peu probable", class: "scaffolding" },
      ],
      branches: [
        { id: "b1", from: "n1", to: "dead", condition: "low", class: "scaffolding",
          threshold_fragment: {
            context: "ctx",
            low_band_meaning: "IC peu probable",
            scales: [{ id: "s1", analyte: "BNP", cutoff_label: "< 1", comparator: "<", value: 1, unit: "U", class: "scaffolding" }],
          },
        },
      ],
    };
    const artifact = `<svg xmlns="http://www.w3.org/2000/svg">
      <g data-layer="nodes"><g data-node-id="dead"><text class="vg-label">IC peu probable</text></g></g>
    </svg>`;
    const report = verifyFigureProjection({ spec, artifact });
    const lbm = report.facts.find((f) => f.type === "threshold-fragment-low-band-meaning");
    assert.equal(lbm.disposition, "DERIVED");
    assert.match(lbm.justification, /node dead/);
    assert.equal(lbm.materializationSource, report.facts.find((f) => f.ref === "dead").id);
  });

  it("DISCARDED — interpretation field not projected", () => {
    const spec = {
      spec_version: "0.2",
      primitive: "decision-algorithm",
      variant: "diagnostic",
      element: "test-disc",
      chapter: "test",
      question: "Q?",
      nodes: [{ id: "n1", kind: "entry", label: "Start", class: "scaffolding" }],
      branches: [{
        id: "b1", from: "n1", to: "n1", condition: "x", class: "scaffolding",
        threshold_fragment: {
          context: "ctx",
          low_band_meaning: "low",
          interpretation: "Never rendered interpretation",
          scales: [{ id: "s1", analyte: "X", cutoff_label: "< 1", comparator: "<", value: 1, unit: "U", class: "scaffolding" }],
        },
      }],
    };
    const artifact = `<svg xmlns="http://www.w3.org/2000/svg">
      <g data-fragment="threshold-scale"><text class="vg-sub">ctx</text></g>
    </svg>`;
    const report = verifyFigureProjection({ spec, artifact });
    const interp = report.facts.find((f) => f.type === "threshold-fragment-interpretation");
    assert.equal(interp.disposition, "DISCARDED");
    assert.equal(interp.status, "missing");
    assert.match(interp.justification, /not projected/);
  });

  it("UNKNOWN — no text match and not a known non-projected unit", () => {
    const spec = {
      spec_version: "0.2",
      primitive: "decision-algorithm",
      variant: "diagnostic",
      element: "test-unk",
      chapter: "test",
      question: "Q?",
      nodes: [{ id: "n1", kind: "entry", label: "Absent label", class: "scaffolding" }],
      branches: [{ id: "b1", from: "n1", to: "n1", condition: "go", class: "scaffolding" }],
    };
    const artifact = `<svg xmlns="http://www.w3.org/2000/svg"><g data-layer="nodes"><text class="vg-label">Other</text></g></svg>`;
    const report = verifyFigureProjection({ spec, artifact });
    const node = report.facts.find((f) => f.type === "node");
    assert.equal(node.disposition, "UNKNOWN");
    assert.equal(node.status, "missing");
  });

  it("duplication is independent of disposition (duplicated can be MATERIALIZED)", () => {
    const spec = {
      spec_version: "0.2",
      primitive: "decision-algorithm",
      variant: "diagnostic",
      element: "test-dup-disposition",
      chapter: "test",
      question: "Q?",
      nodes: [{ id: "n1", kind: "entry", label: "Dup me", class: "scaffolding" }],
      branches: [{ id: "b1", from: "n1", to: "n1", condition: "Dup me", class: "scaffolding" }],
    };
    const artifact = `<svg xmlns="http://www.w3.org/2000/svg">
      <g data-layer="nodes"><g data-node-id="n1"><text class="vg-label">Dup me</text></g></g>
      <g data-layer="branches"><text class="vg-branch">Dup me</text></g>
    </svg>`;
    const report = verifyFigureProjection({ spec, artifact });
    const dup = report.facts.filter((f) => f.status === "duplicated");
    assert.ok(dup.length > 0);
    for (const f of dup) {
      assert.equal(f.disposition, "MATERIALIZED", `${f.id} should be MATERIALIZED while duplicated`);
    }
  });

  it("missing is independent of disposition", () => {
    const { spec, artifact } = loadCorpusItem("N09", "n09-diagnostic-algorithm.yaml", "n09-diagnostic-algorithm.svg");
    const report = verifyFigureProjection({ spec, artifact, figureId: "N09" });
    const missingBranch = report.facts.find(
      (f) => f.status === "missing" && f.type === "branch",
    );
    assert.ok(missingBranch, "expected a missing branch fact on N09");
    assert.equal(missingBranch.disposition, "UNKNOWN");
  });

  it("corpus report includes disposition statistics", () => {
    const items = [
      loadCorpusItem("N09", "n09-diagnostic-algorithm.yaml", "n09-diagnostic-algorithm.svg"),
      loadCorpusItem("N18-1", "n18-1-treatment-sequence.yaml", "n18-1-treatment-sequence.svg"),
    ];
    const reports = items.map((i) => verifyFigureProjection({ spec: i.spec, artifact: i.artifact, figureId: i.id }));
    const corpus = verifyCorpusProjection(reports);
    assert.ok(corpus.dispositions);
    assert.equal(
      corpus.dispositions.materialized + corpus.dispositions.derived +
        corpus.dispositions.discarded + corpus.dispositions.unknown,
      corpus.totalFacts,
    );
    assert.ok(PROJECTION_DISPOSITIONS.includes("MATERIALIZED"));
  });

  it("inferMarkLocation detects node and branch contexts", () => {
    const svg = `<svg><g data-layer="nodes"><g data-node-id="n1"><text class="vg-label">A</text></g></g>
      <g data-layer="branches"><g data-branch-label="b1"><text class="vg-branch">B</text></g></g></svg>`;
    const { marks } = extractLearnerVisibleMarks(svg);
    const nodeMark = marks.find((m) => m.text === "A");
    const branchMark = marks.find((m) => m.text === "B");
    assert.equal(nodeMark.location.kind, "node-label");
    assert.equal(branchMark.location.kind, "branch-label");
  });

  describe("total disposition — declared vs observed", () => {
    const baseFact = (overrides) => ({
      id: "f1",
      type: "node",
      unit: "node",
      ref: "n1",
      text: "Label",
      disposition: "MATERIALIZED",
      occurrenceCount: 1,
      status: "exactly-once",
      materializationSource: "f1",
      ...overrides,
    });

    it("MATERIALIZED declared + one occurrence → conformant", () => {
      const declared = { disposition: "MATERIALIZED" };
      const observed = baseFact();
      const result = compareDeclaredVsObserved(declared, observed, [observed]);
      assert.equal(result.conformant, true);
    });

    it("MATERIALIZED declared + zero occurrence → mismatch", () => {
      const declared = { disposition: "MATERIALIZED" };
      const observed = baseFact({
        occurrenceCount: 0,
        status: "missing",
        disposition: "UNKNOWN",
      });
      const result = compareDeclaredVsObserved(declared, observed, [observed]);
      assert.ok(result.mismatches.includes("MATERIALIZED_BUT_MISSING"));
    });

    it("MATERIALIZED declared + two occurrences → duplication mismatch", () => {
      const declared = { disposition: "MATERIALIZED" };
      const observed = baseFact({ occurrenceCount: 2, status: "duplicated" });
      const result = compareDeclaredVsObserved(declared, observed, [observed]);
      assert.ok(result.mismatches.includes("MATERIALIZED_BUT_DUPLICATED"));
    });

    it("DERIVED correctly carried by source → conformant", () => {
      const node = baseFact({ id: "n1", unit: "node", type: "node", ref: "dead" });
      const lbm = baseFact({
        id: "lbm1",
        unit: "threshold-fragment-low-band-meaning",
        type: "threshold-fragment-low-band-meaning",
        disposition: "DERIVED",
        materializationSource: "n1",
      });
      const declared = { disposition: "DERIVED", derivedFrom: "node" };
      const result = compareDeclaredVsObserved(declared, lbm, [node, lbm]);
      assert.equal(result.conformant, true);
    });

    it("DERIVED independently materialized → mismatch", () => {
      const node = baseFact({ id: "n1" });
      const lbm = baseFact({
        id: "lbm1",
        unit: "threshold-fragment-low-band-meaning",
        type: "threshold-fragment-low-band-meaning",
        disposition: "MATERIALIZED",
        occurrenceCount: 1,
      });
      const declared = { disposition: "DERIVED", derivedFrom: "node" };
      const result = compareDeclaredVsObserved(declared, lbm, [node, lbm]);
      assert.ok(result.mismatches.includes("DERIVED_BUT_INDEPENDENTLY_MATERIALIZED"));
    });

    it("DISCARDED absent + valid reason → conformant", () => {
      const declared = {
        disposition: "DISCARDED",
        discardReason: "OUT_OF_SCOPE_FOR_CAPABILITY",
      };
      const observed = baseFact({
        type: "threshold-fragment-interpretation",
        unit: "threshold-fragment-interpretation",
        occurrenceCount: 0,
        status: "missing",
        disposition: "DISCARDED",
      });
      const result = compareDeclaredVsObserved(declared, observed, [observed]);
      assert.equal(result.conformant, true);
      assert.ok(isValidDiscardReason("OUT_OF_SCOPE_FOR_CAPABILITY"));
    });

    it("DISCARDED materialized → mismatch", () => {
      const declared = {
        disposition: "DISCARDED",
        discardReason: "OUT_OF_SCOPE_FOR_CAPABILITY",
      };
      const observed = baseFact({
        type: "threshold-fragment-interpretation",
        unit: "threshold-fragment-interpretation",
        disposition: "MATERIALIZED",
        occurrenceCount: 1,
      });
      const result = compareDeclaredVsObserved(declared, observed, [observed]);
      assert.ok(result.mismatches.includes("DISCARDED_BUT_MATERIALIZED"));
    });

    it("fact type without declared disposition → UNDECLARED", () => {
      const observed = baseFact({ type: "relation-label", unit: "relation-label" });
      const result = compareDeclaredVsObserved(null, observed, [observed]);
      assert.ok(result.mismatches.includes("UNDECLARED_FACT_TYPE"));
    });

    it("invalid discard reason → non-conformity", () => {
      const declared = { disposition: "DISCARDED", discardReason: "FREE_TEXT_REASON" };
      const observed = baseFact({
        occurrenceCount: 0,
        status: "missing",
        disposition: "DISCARDED",
      });
      const result = compareDeclaredVsObserved(declared, observed, [observed]);
      assert.ok(result.mismatches.includes("INVALID_DISCARD_REASON"));
      assert.ok(result.mismatches.includes("INVALID_DECLARATION"));
    });

    it("N09 total disposition — threshold duplication resolved", () => {
      const { spec, artifact } = loadCorpusItem(
        "N09",
        "n09-diagnostic-algorithm.yaml",
        "n09-diagnostic-algorithm.svg",
      );
      const report = verifyFigureProjection({
        spec,
        artifact,
        figureId: "N09",
        familyIds: ["skip-level-branch", "embedded-fragment"],
      });
      const scaleDupes = report.violations.duplicated.filter(
        (d) => d.type === "threshold-fragment-scale-line",
      );
      assert.equal(scaleDupes.length, 0);
      assert.ok(
        report.totalDisposition.summary.mismatched < 10,
        `expected fewer mismatches after normalization, got ${report.totalDisposition.summary.mismatched}`,
      );
    });

    it("N13-2 stable under total disposition (no duplication regression)", () => {
      const { spec, artifact } = loadCorpusItem(
        "N13-2",
        "n13-2-oap-actions.yaml",
        "n13-2-oap-actions.svg",
      );
      const report = verifyFigureProjection({
        spec,
        artifact,
        figureId: "N13-2",
        familyIds: ["dependent-sequence"],
      });
      assert.equal(report.summary.duplicated, 0);
      const cutoffDupes = report.violations.duplicated.filter((d) => d.type === "threshold-cutoff");
      assert.equal(cutoffDupes.length, 0);
      const branchMissing = report.totalDisposition.mismatches.find(
        (m) => m.factType === "branch" && m.mismatches.includes("MATERIALIZED_BUT_MISSING"),
      );
      assert.ok(branchMissing, "known pre-existing missing branch surfaced honestly");
    });

    it("N20-1 stable under total disposition (no missing regression)", () => {
      const { spec, artifact } = loadCorpusItem(
        "N20-1",
        "n20-1-crt-dai-comparison.yaml",
        "n20-1-crt-dai-comparison.svg",
      );
      const report = verifyFigureProjection({
        spec,
        artifact,
        figureId: "N20-1",
        familyIds: ["two-pole"],
      });
      assert.equal(report.summary.missing, 0);
      const cutoffDupes = report.violations.duplicated.filter((d) => d.type === "threshold-cutoff");
      assert.equal(cutoffDupes.length, 0);
      const poleDupe = report.totalDisposition.mismatches.find(
        (m) => m.factType === "pole" && m.mismatches.includes("MATERIALIZED_BUT_DUPLICATED"),
      );
      assert.ok(poleDupe, "known pre-existing pole duplication surfaced honestly");
    });

    it("audit matrix covers declared families", () => {
      const matrix = buildDispositionAuditMatrix();
      assert.ok(matrix.some((r) => r.familyId === "dependent-sequence" && r.factType === "branch"));
      assert.ok(matrix.some((r) => r.familyId === "two-pole" && r.factType === "pole"));
      assert.ok(matrix.some((r) => r.familyId === "embedded-fragment" && r.factType === "threshold-fragment-scale-line"));
      assert.ok(
        !matrix.some((r) => r.familyId === "embedded-fragment" && r.factType === "threshold-cutoff"),
        "threshold-cutoff removed from embedded-fragment registry",
      );
    });

    it("discard reason vocabulary is closed", () => {
      assert.ok(DISCARD_REASONS.includes("NON_LEARNER_VISIBLE"));
      assert.equal(isValidDiscardReason("REPRESENTED_ELSEWHERE"), false);
    });

    it("loadDeclaredDispositions merges skip-level + embedded-fragment", () => {
      const { dispositions } = loadDeclaredDispositions({
        familyIds: ["skip-level-branch", "embedded-fragment"],
      });
      assert.ok(dispositions.get("branch"));
      assert.ok(dispositions.get("threshold-fragment-scale-line"));
      assert.equal(dispositions.get("threshold-fragment-low-band-meaning").derivedFrom, "node");
      assert.equal(dispositions.get("threshold-cutoff"), undefined);
    });
  });
});
