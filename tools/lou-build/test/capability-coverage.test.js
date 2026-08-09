import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { VCCK_POSITIVE } from "../lib/vcck/paths.js";
import { loadFamilyRegistry } from "../lib/vcck/registry.js";
import {
  artifactContainsText,
  artifactContainsNodeKind,
  computeCoverageForSpec,
  computeFamilyCoverage,
  computeQualifiedCoverageReport,
} from "../lib/vcck/capability-coverage.js";
import { extractAllConsumptionEntries as extractPaths } from "../lib/vcck/consumption-paths.js";
import { runW1Pipeline } from "../lib/vcck/w1-pipeline.js";

describe("capability-coverage", () => {
  it("extracts declared consumption paths from chain short fixture", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
    const entries = extractPaths(spec, ["question", "nodes.label", "nodes.kind"]);
    assert.ok(entries.some((e) => e.path === "question"));
    assert.ok(entries.some((e) => e.type === "node-kind"));
    assert.ok(entries.length >= 3);
  });

  it("detects text and node-kind in rendered artifact", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
    const pipeline = runW1Pipeline(spec, { expectedFamily: "chain" });
    assert.equal(pipeline.ok, true);
    const artifact = pipeline.artifact;
    assert.equal(artifactContainsText(artifact, spec.question), true);
    const firstNode = spec.nodes[0];
    assert.equal(artifactContainsNodeKind(artifact, firstNode.id, firstNode.kind), true);
  });

  it("reports missing field when artifact lacks declared text", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
    const coverage = computeCoverageForSpec(spec, "<svg></svg>", ["question", "nodes.label"]);
    assert.equal(coverage.declaredCount, 1 + spec.nodes.length);
    assert.ok(coverage.missing.length > 0);
    assert.equal(coverage.coveragePct, 0);
  });

  it("computes full coverage for all QUALIFIED W1 families", () => {
    const registry = loadFamilyRegistry();
    const report = computeQualifiedCoverageReport(registry);
    assert.equal(report.qualifiedCount, 4);
    assert.ok(report.overallDeclaredCount > 0);
    for (const family of report.families) {
      assert.equal(family.error, null, `${family.familyId}: ${family.error}`);
      assert.ok(family.declaredCount > 0, family.familyId);
      assert.equal(family.coveragePct, 100, `${family.familyId} missing: ${JSON.stringify(family.missing)}`);
    }
    assert.equal(report.ok, true);
  });

  it("family coverage uses registry consumes", () => {
    const registry = loadFamilyRegistry();
    const chain = registry.families.find((f) => f.id === "chain");
    const result = computeFamilyCoverage(chain);
    assert.deepEqual(result.declaredPaths, chain.consumes);
    assert.equal(result.ok, true);
  });

  it("dependent-sequence coverage fails when subitem text is removed from artifact", () => {
    const registry = loadFamilyRegistry({ reload: true });
    const family = registry.families.find((f) => f.id === "dependent-sequence");
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "dependent-sequence-short.yaml"));
    const pipeline = runW1Pipeline(spec, { expectedFamily: "dependent-sequence" });
    assert.equal(pipeline.ok, true);
    const baseline = computeFamilyCoverage(family, { spec, artifact: pipeline.artifact });
    assert.equal(baseline.ok, true);

    const mutated = pipeline.artifact.replace("Badge requis", "MISSING");
    const afterRemove = computeCoverageForSpec(spec, mutated, family.consumes);
    assert.ok(afterRemove.missing.some((m) => m.value === "Badge requis"));

    const altered = pipeline.artifact.replace("Badge requis", "Badge modifié");
    const afterAlter = computeCoverageForSpec(spec, altered, family.consumes);
    assert.ok(afterAlter.missing.some((m) => m.value === "Badge requis"));
  });

  it("dependent-sequence coverage fails when annotation text is removed", () => {
    const registry = loadFamilyRegistry({ reload: true });
    const family = registry.families.find((f) => f.id === "dependent-sequence");
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "dependent-sequence-short.yaml"));
    const pipeline = runW1Pipeline(spec, { expectedFamily: "dependent-sequence" });
    const mutated = pipeline.artifact.replace("Note hors flux", "");
    const coverage = computeCoverageForSpec(spec, mutated, family.consumes);
    assert.ok(coverage.missing.some((m) => m.path.startsWith("annotations[0]")));
  });
});
