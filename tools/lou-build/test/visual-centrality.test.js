import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateVisualCentrality,
  evaluateBlockCentrality,
  visualCentralityGateErrors,
  validateVisualCentralityMutants,
  resolveTechnicalAvailability,
  serializeManifestVisualCentrality,
  AVAILABILITY,
  VERDICTS,
  REGIMES,
  MUTANT_MM_NONE_PLANNED,
  MUTANT_NOTION_NONE_PLANNED,
  MUTANT_COMPLEMENT_AS_CENTRAL,
} from "../lib/visual-centrality.js";

function adr007Package(blocks) {
  return {
    slug: "test",
    title: "Test",
    mode: "slice",
    visual_centrality: { regime: "adr-007", blocks },
  };
}

function visualBuildFromStates(states) {
  const rendered = [];
  const planned = [];
  const withheld = [];
  for (const [elementId, state] of Object.entries(states)) {
    if (state === "published") {
      rendered.push({ elementId, relPath: `figures/${elementId.toLowerCase()}.svg` });
    } else if (state === "planned-not-built") {
      withheld.push({ elementId, state: "planned-not-built", reasons: ["fixture"] });
    } else if (state === "withheld") {
      withheld.push({ elementId, state: "withheld", reasons: ["fixture"] });
    }
  }
  return { rendered, planned, withheld };
}

describe("visual-centrality ADR-007", () => {
  it("mutants are rejected by gate", () => {
    const results = validateVisualCentralityMutants();
    assert.equal(results.length, 3);
    for (const r of results) {
      assert.equal(r.failedAsExpected, true, `${r.id}: ${r.errors.join("; ")}`);
    }
  });

  it("legacy package without contract is consumable but not qualifiable", () => {
    const report = evaluateVisualCentrality({
      packageConfig: { slug: "legacy", title: "Legacy", mode: "slice" },
      visualBuild: visualBuildFromStates({ "MM-1": "published" }),
    });
    assert.equal(report.regime, REGIMES.LEGACY);
    assert.equal(report.verdict, VERDICTS.LEGACY_UNQUALIFIED);
    assert.equal(report.releaseQualifiable, false);
    assert.equal(visualCentralityGateErrors(report, { slug: "x", title: "x" }).length, 0);
  });

  it("MM without visual (none planned) is refused", () => {
    const pkg = adr007Package([
      {
        element: "MM-master",
        editorial_type: "mental-model",
        visual_role: "master",
        congruence: "pass",
      },
    ]);
    const report = evaluateVisualCentrality({
      packageConfig: pkg,
      visualBuild: { rendered: [], planned: [], withheld: [] },
    });
    assert.equal(report.verdict, VERDICTS.REFUSED);
    const errors = visualCentralityGateErrors(report, pkg);
    assert.ok(errors.some((e) => e.includes("none-planned")));
  });

  it("autonomous notion without visual is refused", () => {
    const pkg = adr007Package([
      {
        element: "NOT-1",
        editorial_type: "autonomous-notion",
        visual_role: "central",
        congruence: "pass",
      },
    ]);
    const report = evaluateVisualCentrality({
      packageConfig: pkg,
      visualBuild: { rendered: [], planned: [], withheld: [] },
    });
    assert.equal(report.verdict, VERDICTS.REFUSED);
    assert.ok(
      visualCentralityGateErrors(report, pkg).some((e) => e.includes("none-planned")),
    );
  });

  it("withheld master keeps walkthrough accessible but block incomplete", () => {
    const pkg = adr007Package([
      {
        element: "MM-master",
        editorial_type: "mental-model",
        visual_role: "master",
        congruence: "pass",
      },
    ]);
    const report = evaluateVisualCentrality({
      packageConfig: pkg,
      visualBuild: visualBuildFromStates({ "MM-master": "withheld" }),
      publishedWalkthroughElements: new Set(["MM-master"]),
    });
    const block = report.blocks[0];
    assert.equal(block.walkthroughAccessible, true);
    assert.equal(block.blockComplete, false);
    assert.equal(block.degradedAccess, true);
    assert.equal(report.releaseQualifiable, false);
    assert.equal(report.verdict, VERDICTS.INCOMPLETE_DEGRADED);
    assert.equal(visualCentralityGateErrors(report, pkg).length, 0);
  });

  it("planned-not-built central keeps walkthrough accessible but block incomplete", () => {
    const pkg = adr007Package([
      {
        element: "NOT-1",
        editorial_type: "autonomous-notion",
        visual_role: "central",
        congruence: "pass",
      },
    ]);
    const report = evaluateVisualCentrality({
      packageConfig: pkg,
      visualBuild: visualBuildFromStates({ "NOT-1": "planned-not-built" }),
      publishedWalkthroughElements: new Set(["NOT-1"]),
    });
    const block = report.blocks[0];
    assert.equal(block.walkthroughAccessible, true);
    assert.equal(block.blockComplete, false);
    assert.equal(report.releaseQualifiable, false);
    assert.equal(visualCentralityGateErrors(report, pkg).length, 0);
  });

  it("published central with congruence pass yields complete block and qualifiable release", () => {
    const pkg = adr007Package([
      {
        element: "MM-master",
        editorial_type: "mental-model",
        visual_role: "master",
        congruence: "pass",
      },
      {
        element: "NOT-1",
        editorial_type: "autonomous-notion",
        visual_role: "central",
        congruence: "pass",
      },
    ]);
    const report = evaluateVisualCentrality({
      packageConfig: pkg,
      visualBuild: visualBuildFromStates({
        "MM-master": "published",
        "NOT-1": "published",
      }),
      publishedWalkthroughElements: new Set(["MM-master", "NOT-1"]),
    });
    assert.equal(report.blocks.every((b) => b.blockComplete), true);
    assert.equal(report.releaseQualifiable, true);
    assert.equal(report.verdict, VERDICTS.READY_FOR_RELEASE_QUALIFICATION);
  });

  it("deferrable complementary absent keeps primary complete with published debt", () => {
    const pkg = adr007Package([
      {
        element: "MM-master",
        editorial_type: "mental-model",
        visual_role: "master",
        congruence: "pass",
      },
      {
        element: "MM-comp",
        editorial_type: "mental-model",
        visual_role: "complementary",
        deferrable: true,
        congruence: "pass",
      },
    ]);
    const report = evaluateVisualCentrality({
      packageConfig: pkg,
      visualBuild: visualBuildFromStates({ "MM-master": "published" }),
      publishedWalkthroughElements: new Set(["MM-master", "MM-comp"]),
    });
    const master = report.blocks.find((b) => b.element === "MM-master");
    const comp = report.blocks.find((b) => b.element === "MM-comp");
    assert.equal(master.blockComplete, true);
    assert.equal(comp.blockComplete, true);
    assert.equal(report.complementaryDebt.length, 1);
    assert.equal(report.complementaryDebt[0].element, "MM-comp");
    assert.equal(report.releaseQualifiable, true);
  });

  it("complementary presented as central for autonomous notion blocks qualification", () => {
    const report = evaluateVisualCentrality({
      packageConfig: MUTANT_COMPLEMENT_AS_CENTRAL.packageConfig,
      visualBuild: MUTANT_COMPLEMENT_AS_CENTRAL.visualBuild,
    });
    assert.equal(report.verdict, VERDICTS.REFUSED);
    assert.ok(
      visualCentralityGateErrors(
        report,
        MUTANT_COMPLEMENT_AS_CENTRAL.packageConfig,
      ).length > 0,
    );
  });

  it("legacy package with editorial_completeness complete remains buildable", () => {
    const report = evaluateVisualCentrality({
      packageConfig: {
        slug: "legacy",
        title: "Legacy",
        mode: "slice",
        editorial_completeness: "complete",
      },
      visualBuild: visualBuildFromStates({ "MM-1": "withheld" }),
    });
    assert.equal(report.regime, REGIMES.LEGACY);
    assert.equal(report.releaseQualifiable, false);
    assert.equal(
      visualCentralityGateErrors(report, {
        slug: "legacy",
        title: "Legacy",
        editorial_completeness: "complete",
      }).length,
      0,
    );
  });

  it("editorial_completeness complete without qualification fails gate under adr-007", () => {
    const pkg = adr007Package([
      {
        element: "MM-master",
        editorial_type: "mental-model",
        visual_role: "master",
        congruence: "pass",
      },
    ]);
    const report = evaluateVisualCentrality({
      packageConfig: { ...pkg, editorial_completeness: "complete" },
      visualBuild: visualBuildFromStates({ "MM-master": "withheld" }),
    });
    const errors = visualCentralityGateErrors(
      report,
      { ...pkg, editorial_completeness: "complete" },
      null,
    );
    assert.ok(
      errors.some((e) => e.includes("Release not qualifiable")),
    );
  });

  it("resolveTechnicalAvailability maps withheld to built-but-withheld", () => {
    const vb = visualBuildFromStates({ X: "withheld" });
    assert.equal(
      resolveTechnicalAvailability(vb, "X"),
      AVAILABILITY.BUILT_BUT_WITHHELD,
    );
  });

  it("serializeManifestVisualCentrality preserves block flags", () => {
    const report = evaluateVisualCentrality({
      packageConfig: MUTANT_MM_NONE_PLANNED.packageConfig,
      visualBuild: MUTANT_MM_NONE_PLANNED.visualBuild,
    });
    const serialized = serializeManifestVisualCentrality(report);
    assert.equal(serialized.regime, REGIMES.ADR007);
    assert.equal(typeof serialized.releaseQualifiable, "boolean");
    assert.ok(Array.isArray(serialized.blocks));
  });

  it("evaluateBlockCentrality never promotes withheld to complete", () => {
    const block = evaluateBlockCentrality(
      {
        element: "MM-1",
        editorial_type: "mental-model",
        visual_role: "master",
        congruence: "pass",
      },
      AVAILABILITY.BUILT_BUT_WITHHELD,
      { walkthroughPublished: true },
    );
    assert.equal(block.blockComplete, false);
    assert.equal(block.releaseQualifiable, false);
    assert.equal(block.walkthroughAccessible, true);
  });
});
