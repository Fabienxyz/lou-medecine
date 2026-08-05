import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { VCCK_POSITIVE } from "../lib/vcck/paths.js";
import { renderVcckSpec, validateRenderedArtifact } from "../lib/vcck/render-bridge.js";
import {
  expectedCountsFromSpec,
  validateW1Artifact,
} from "../lib/vcck/w1-validate-artifact.js";
import { W1_FAMILIES } from "../lib/vcck/w1-constants.js";

describe("vcck-w1-surfaces", () => {
  for (const family of W1_FAMILIES) {
    it(`${family} serializes artifact with independent counts`, () => {
      const spec = loadVisualSpec(path.join(VCCK_POSITIVE, `${family}-short.yaml`));
      const rendered = renderVcckSpec(spec);
      assert.equal(rendered.ok, true, rendered.errors?.join("; "));
      assert.ok(rendered.artifact);
      assert.ok(rendered.plan, "W1 render must expose composition plan");

      const expected = expectedCountsFromSpec(spec, family);
      const artifactCheck = validateW1Artifact(spec, rendered.artifact, rendered.kind, expected);
      assert.equal(artifactCheck.ok, true, artifactCheck.errors.join("; "));

      const bridgeCheck = validateRenderedArtifact(spec, rendered);
      assert.equal(bridgeCheck.ok, true, bridgeCheck.errors.join("; "));
    });
  }

  it("chain SVG fails independent validation when data-edge-id is stripped", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
    const rendered = renderVcckSpec(spec);
    assert.equal(rendered.ok, true);
    const stripped = rendered.artifact.replace(/\s*data-edge-id="[^"]+"/g, "");
    const expected = expectedCountsFromSpec(spec, "chain");
    const check = validateW1Artifact(spec, stripped, "svg", expected);
    assert.equal(check.ok, false);
    assert.ok(
      check.errors.some((e) => e.includes("data-edge-id") || e.includes("edges, observed 0")),
      check.errors.join("; "),
    );
  });
});
