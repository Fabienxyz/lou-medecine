import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { VCCK_POSITIVE } from "../lib/vcck/paths.js";
import { runW1Pipeline } from "../lib/vcck/w1-pipeline.js";
import {
  mutateArtifactNodeClip,
  mutateArtifactTitleClip,
  NODE_CLIP_MUTANT_EXPECTED,
  NODE_CLIP_MUTANT_IDS,
  validateW1ArtifactNodeClip,
  validateW1ArtifactTitleClip,
} from "../lib/vcck/w1-validate-artifact.js";

describe("vcck-w1-artifact-node-clip", () => {
  it("NODE_CLIP_MUTANT_IDS is authoritative", () => {
    assert.equal(NODE_CLIP_MUTANT_IDS.length, Object.keys(NODE_CLIP_MUTANT_EXPECTED).length);
    for (const id of NODE_CLIP_MUTANT_IDS) {
      assert.ok(NODE_CLIP_MUTANT_EXPECTED[id], `missing expected error for ${id}`);
    }
  });

  it("nominal SVG families pass independent node clip validation", () => {
    for (const family of ["chain", "dependent-sequence"]) {
      const spec = loadVisualSpec(path.join(VCCK_POSITIVE, `${family}-short.yaml`));
      const rendered = runW1Pipeline(spec, { expectedFamily: family });
      assert.equal(rendered.ok, true, `${family}: ${rendered.errors?.join("; ")}`);
      const clip = validateW1ArtifactNodeClip(rendered.artifact);
      assert.equal(clip.ok, true, clip.errors.join("; "));
    }
  });

  it("each node clip mutant fails with exact diagnostic", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
    const rendered = runW1Pipeline(spec, { expectedFamily: "chain" });
    assert.equal(rendered.ok, true);

    for (const id of NODE_CLIP_MUTANT_IDS) {
      const mutant = mutateArtifactNodeClip(rendered.artifact, id);
      const v = validateW1ArtifactNodeClip(mutant);
      assert.equal(v.ok, false, `mutant ${id} should fail`);
      assert.ok(
        v.errors.some((e) => e.includes(NODE_CLIP_MUTANT_EXPECTED[id])),
        `mutant ${id}: ${v.errors.join("; ")}`,
      );
    }
  });

  it("title clip validation remains independent of plan", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
    const rendered = runW1Pipeline(spec, { expectedFamily: "chain" });
    assert.equal(validateW1ArtifactTitleClip(rendered.artifact).ok, true);
    const clipped = mutateArtifactTitleClip(rendered.artifact);
    const bad = validateW1ArtifactTitleClip(clipped);
    assert.equal(bad.ok, false);
  });
});
