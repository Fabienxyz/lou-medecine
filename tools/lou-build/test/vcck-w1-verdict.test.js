import { describe, it } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { VCCK_NEGATIVE, VCCK_POSITIVE, VCCK_REPORTS } from "../lib/vcck/paths.js";
import {
  computeW1FamilyVerdict,
  computeW1MissionVerdictFromPipeline,
  W1_MISSION_VERDICT,
  W1_REQUIRED_GATES,
} from "../lib/vcck/w1-verdict.js";
import { validateW1FamilyNegatives, w1NegativeMatrixForFamily } from "../lib/vcck/w1-negative-matrix.js";
import { runNegativeFixture } from "../lib/vcck/pipeline.js";
import { loadFamilyRegistry } from "../lib/vcck/registry.js";
import {
  W1_APPROVED_PNG_MANIFEST,
  W1_CANDIDATE_PNG_MANIFEST,
  verifyW1CandidateAgainstApproved,
} from "../lib/vcck/w1-approved-png.js";
import { verifyW1ApprovedPngDrift } from "../lib/vcck/w1-candidate-drift.js";
import { checkW1ExclusivityStrict, listW1StructuralCandidates } from "../lib/vcck/w1-exclusivity.js";

describe("vcck-w1-verdict", () => {
  it("computeW1FamilyVerdict requires all eight gates strictly PASS", () => {
    const pass = Object.fromEntries(W1_REQUIRED_GATES.map((g) => [g, "PASS"]));
    const v = computeW1FamilyVerdict("chain", pass);
    assert.equal(v.ready, true);
    assert.equal(v.failed.length, 0);
    assert.equal(v.qualificationStatus, "QUALIFIED");
    assert.equal(v.operationalStatus, "READY_FOR_USE");

    const partial = { ...pass, snapshots: "FAIL" };
    const v2 = computeW1FamilyVerdict("chain", partial);
    assert.equal(v2.ready, false);
    assert.deepEqual(v2.failed, ["snapshots"]);
    assert.equal(v2.qualificationStatus, "QUALIFIED");
    assert.equal(v2.operationalStatus, "BLOCKED_FOR_USE");
  });

  it("blocks mission when any gate is not PASS", () => {
    const familyResults = {
      chain: {
        positive: [
          { fixture: "chain-short.yaml", recognition: "PASS", render: "PASS", viewports: "PASS", surfaces: "PASS", determinism: "PASS" },
          { fixture: "chain-long.yaml", recognition: "PASS", render: "PASS", viewports: "PASS", surfaces: "PASS", determinism: "PASS" },
        ],
        negative: w1NegativeMatrixForFamily("chain").map((n) => ({
          fixture: n.path,
          negative: "PASS",
          recognition: "REJECTED",
          code: n.expectedCode,
        })),
      },
    };
    const blocked = computeW1MissionVerdictFromPipeline(familyResults);
    assert.notEqual(blocked.missionVerdict, W1_MISSION_VERDICT.CODEX_REAUDIT);
  });

  it("does not use global dependent-sequence-negative search", () => {
    const matrix = w1NegativeMatrixForFamily("chain");
    assert.ok(matrix.every((m) => m.path.startsWith("chain")));
    assert.equal(matrix.some((m) => m.path.includes("dependent-sequence")), false);
  });

  it("validateW1FamilyNegatives blocks wrong code", () => {
    const bad = [{ fixture: "chain-negative.yaml", negative: "PASS", recognition: "REJECTED", code: "WRONG" }];
    const v = validateW1FamilyNegatives("chain", bad);
    assert.equal(v.ok, false);
  });

  it("exclusivity uses independent structural candidates", () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
    const candidates = listW1StructuralCandidates(spec);
    assert.deepEqual(candidates, ["chain"]);
    const ex = checkW1ExclusivityStrict(spec, "chain");
    assert.equal(ex.exclusive, true);
    assert.equal(ex.candidateCount, 1);
  });

  it("verify scripts do not mutate approved manifest mtime", () => {
    if (!fs.existsSync(W1_APPROVED_PNG_MANIFEST)) return;
    const before = fs.statSync(W1_APPROVED_PNG_MANIFEST).mtimeMs;
    verifyW1CandidateAgainstApproved();
    verifyW1ApprovedPngDrift();
    const after = fs.statSync(W1_APPROVED_PNG_MANIFEST).mtimeMs;
    assert.equal(before, after);
  });
});

describe("vcck-w1-negative-probative", () => {
  it("chain-negative fails for expected topology code", async () => {
    const registry = loadFamilyRegistry();
    const family = registry.families.find((f) => f.id === "chain");
    const r = await runNegativeFixture(
      family,
      path.join(VCCK_NEGATIVE, "chain-negative.yaml"),
      { expectedCode: "UNSUPPORTED_TOPOLOGY" },
    );
    assert.equal(r.negative, "PASS");
    assert.equal(r.code, "UNSUPPORTED_TOPOLOGY");
    assert.equal(r.recognition, "REJECTED");
  });
});
