import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { renderVisualSpecSvgV02 } from "../lib/visual-render-svg-v02.js";
import { validateRenderedArtifact } from "../lib/vcck/render-bridge.js";
import {
  validateThresholdBandLabels,
  validateThresholdBandMutantFixtures,
  MUTANT_THRESHOLD_BAND_OVERLAP,
} from "../lib/threshold-band-validate.js";
import { resolveW2ASpecPath, loadW2AManifest } from "../lib/vcck/w2a-manifest.js";

const FIX = path.join(process.cwd(), "test/fixtures");

describe("threshold-band-validate", () => {
  it("mutant narrow single-line bands are rejected", () => {
    const result = validateThresholdBandMutantFixtures();
    assert.equal(result.failedAsExpected, true, result.errors?.join("; "));
    const v = validateThresholdBandLabels(MUTANT_THRESHOLD_BAND_OVERLAP.svg);
    assert.equal(v.ok, false);
    assert.ok(v.errors.some((e) => e.includes("overlap")));
  });

  it("generic threshold-scale passes band label validation", () => {
    const spec = loadVisualSpec(path.join(FIX, "generic-threshold-scale.yaml"));
    const r = renderVisualSpecSvgV02(spec);
    assert.equal(r.ok, true);
    const v = validateThresholdBandLabels(r.svg);
    assert.equal(v.ok, true, v.errors?.join("; "));
    const bridge = validateRenderedArtifact(spec, { ok: true, artifact: r.svg, kind: "svg" });
    assert.equal(bridge.ok, true, bridge.errors?.join("; "));
  });

  it("N10 W2-A spec passes band label validation after wrap fix", () => {
    const manifest = loadW2AManifest();
    const entry = manifest.visuals.find((v) => v.slot === "N10");
    const spec = loadVisualSpec(resolveW2ASpecPath(entry));
    const r = renderVisualSpecSvgV02(spec);
    assert.equal(r.ok, true, r.errors?.join("; "));
    const v = validateThresholdBandLabels(r.svg);
    assert.equal(v.ok, true, v.errors?.join("; "));
    assert.ok(v.stats.rowCount >= 4);
  });
});
