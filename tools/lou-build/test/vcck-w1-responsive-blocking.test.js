import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { evaluateW1MissionGates } from "../lib/vcck/w1-gates.js";
import { computeW1MissionVerdictFromPipeline } from "../lib/vcck/w1-verdict.js";
import { buildW1ResponsiveProof, W1_RESPONSIVE_PROOF_COUNT } from "../lib/vcck/w1-responsive-proof.js";
import { W1_FAMILIES, W1_VIEWPORT_WIDTHS } from "../lib/vcck/w1-constants.js";
import { W1_STRESS_PROOF_COUNT } from "../lib/vcck/w1-stress-surfaces.js";

function passFamilyResults() {
  const positive = (fixture) => ({
    fixture,
    recognition: "PASS",
    render: "PASS",
    surfaces: "PASS",
    viewports: "PASS",
    determinism: "PASS",
    surfaceMetrics: W1_VIEWPORT_WIDTHS.map((width) => ({ width, elementCount: 5, contentCaptureRatio: 0.2 })),
  });
  const out = {};
  for (const id of W1_FAMILIES) {
    out[id] = {
      positive: [`${id}-short.yaml`, `${id}-long.yaml`].map(positive),
      negative: [],
    };
  }
  return out;
}

function passStressProof() {
  return {
    executed: true,
    ok: true,
    totalProofs: W1_STRESS_PROOF_COUNT,
    fixturesExecuted: 4,
    results: W1_FAMILIES.map((familyId) => ({
      familyId,
      fixture: `${familyId}-stress-90.yaml`,
      ok: true,
      proofCount: 5,
      widths: W1_VIEWPORT_WIDTHS.map((width) => ({ width, surfaces: "PASS", viewport: "PASS" })),
    })),
    errors: [],
  };
}

describe("vcck-w1-responsive-blocking", () => {
  it("blocks when responsive proof not executed", () => {
    const gates = evaluateW1MissionGates({
      familyResults: passFamilyResults(),
      responsiveProof: buildW1ResponsiveProof(passFamilyResults(), { skipPlaywright: true }),
      stressProof: passStressProof(),
    });
    assert.ok(gates.blockingGates.includes("responsive-tests"));
  });

  it("blocks when stress surfaces not executed", () => {
    const familyResults = passFamilyResults();
    const responsiveProof = buildW1ResponsiveProof(familyResults, {
      playwrightLaunched: true,
      stressProof: { executed: false, ok: false, totalProofs: 0 },
    });
    const gates = evaluateW1MissionGates({
      familyResults,
      responsiveProof,
      stressProof: { executed: false },
    });
    assert.ok(gates.blockingGates.includes("stress-surfaces"));
  });

  it("requires full 60-proof inventory for PASS", () => {
    const familyResults = passFamilyResults();
    const stressProof = passStressProof();
    const responsiveProof = buildW1ResponsiveProof(familyResults, {
      playwrightLaunched: true,
      stressProof,
    });
    assert.equal(responsiveProof.ok, true);
    assert.equal(responsiveProof.counts.totalProofCount, W1_RESPONSIVE_PROOF_COUNT);
    assert.equal(W1_RESPONSIVE_PROOF_COUNT, 40 + 20);
  });

  it("incomplete stress inventory fails responsive proof", () => {
    const familyResults = passFamilyResults();
    const partialStress = { ...passStressProof(), totalProofs: 15, ok: false, errors: ["incomplete"] };
    const proof = buildW1ResponsiveProof(familyResults, {
      playwrightLaunched: true,
      stressProof: partialStress,
    });
    assert.equal(proof.ok, false);
  });

  it("passes only on true/true with complete inventory", () => {
    const familyResults = passFamilyResults();
    const stressProof = passStressProof();
    const responsiveProof = buildW1ResponsiveProof(familyResults, {
      playwrightLaunched: true,
      stressProof,
    });
    const gates = evaluateW1MissionGates({
      familyResults,
      responsiveProof,
      stressProof,
    });
    assert.equal(gates.responsiveTestsExecuted, true);
    assert.equal(gates.responsiveTestsPass, true);
    assert.equal(gates.stressSurfaces.ok, true);
    assert.ok(!gates.blockingGates.includes("responsive-tests"));
    assert.ok(!gates.blockingGates.includes("stress-surfaces"));
  });
});
