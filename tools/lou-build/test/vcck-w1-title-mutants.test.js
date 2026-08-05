import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { VCCK_POSITIVE } from "../lib/vcck/paths.js";
import { runW1Pipeline } from "../lib/vcck/w1-pipeline.js";
import {
  mutatePlan,
  TITLE_MUTANT_IDS,
  validateCompositionPlan,
} from "../lib/vcck/w1-composition-plan.js";
import {
  mutateArtifactTitleClip,
  validateW1ArtifactTitleClip,
} from "../lib/vcck/w1-validate-artifact.js";

const TITLE_MUTANT_EXPECTED = Object.freeze({
  "title-overlaps-node": "plan: title overlaps first node",
  "title-outside-canvas": "plan: title outside canvas",
  "title-crosses-route": "plan: title crosses route",
  "title-missing": "plan: titleBox missing",
  "title-lines-overflow": "plan: title lines overflow titleBox",
});

describe("vcck-w1-title-mutants", () => {
  it("TITLE_MUTANT_IDS is authoritative and complete", () => {
    assert.equal(TITLE_MUTANT_IDS.length, Object.keys(TITLE_MUTANT_EXPECTED).length);
    for (const id of TITLE_MUTANT_IDS) {
      assert.ok(TITLE_MUTANT_EXPECTED[id], `missing expected error for ${id}`);
    }
  });

  it("each title plan mutant fails with exact diagnostic", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-long.yaml"));
    const base = runW1Pipeline(spec, { expectedFamily: "chain" });
    assert.equal(base.ok, true);

    for (const id of TITLE_MUTANT_IDS) {
      const mutant = mutatePlan(base.plan, id);
      const v = validateCompositionPlan(mutant);
      assert.equal(v.ok, false, `mutant ${id} should fail`);
      assert.ok(
        v.errors.some((e) => e.includes(TITLE_MUTANT_EXPECTED[id].replace("plan: ", "").split(" ")[0]) ||
          v.errors.some((err) => err === TITLE_MUTANT_EXPECTED[id])),
        `mutant ${id}: ${v.errors.join("; ")}`,
      );
      assert.ok(
        v.errors.includes(TITLE_MUTANT_EXPECTED[id]),
        `mutant ${id} expected "${TITLE_MUTANT_EXPECTED[id]}" got ${v.errors.join("; ")}`,
      );
    }
  });

  it("serialized artifact title clip detected independently of plan", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
    const rendered = runW1Pipeline(spec, { expectedFamily: "chain" });
    assert.equal(rendered.ok, true);
    const ok = validateW1ArtifactTitleClip(rendered.artifact);
    assert.equal(ok.ok, true);

    const clipped = mutateArtifactTitleClip(rendered.artifact);
    const bad = validateW1ArtifactTitleClip(clipped);
    assert.equal(bad.ok, false);
    assert.ok(bad.errors.some((e) => e.includes("title") && e.includes("viewBox")));
  });
});
