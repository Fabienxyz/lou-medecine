import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import crypto from "node:crypto";
import { loadFamilyRegistry } from "../lib/vcck/registry.js";
import { VCCK_REGISTRY } from "../lib/vcck/paths.js";
import { runVcckQualification } from "../lib/vcck/pipeline.js";
import { runAllRejectFixtures } from "../lib/vcck/reject-fixtures.js";
import {
  assertRegistryQualificationContract,
  getFamilyQualificationStatus,
  OPERATIONAL_STATUS,
  QUALIFICATION_STATUS,
  summarizeRegistryQualification,
  W1_QUALIFIED_FAMILY_IDS,
} from "../lib/vcck/w1-qualification.js";
import { computeW1FamilyVerdict, W1_REQUIRED_GATES } from "../lib/vcck/w1-verdict.js";

function registrySha() {
  return crypto.createHash("sha256").update(fs.readFileSync(VCCK_REGISTRY)).digest("hex");
}

describe("vcck-w1-qualification-governance", () => {
  it("registry has exactly 4 QUALIFIED, 14 EXPERIMENTAL, 0 FROZEN", () => {
    const check = assertRegistryQualificationContract();
    assert.equal(check.ok, true, check.errors.join("; "));
    const summary = summarizeRegistryQualification();
    assert.equal(summary.QUALIFIED, 4);
    assert.equal(summary.EXPERIMENTAL, 14);
    assert.equal(summary.FROZEN, 0);
    assert.deepEqual(
      [...W1_QUALIFIED_FAMILY_IDS].sort(),
      ["chain", "dependent-sequence", "flat-concurrent", "two-pole"].sort(),
    );
  });

  it("qualified W1 families are the four audited contracts only", () => {
    const reg = loadFamilyRegistry({ reload: true });
    const qualified = reg.families.filter((f) => f.qualification_status === QUALIFICATION_STATUS.QUALIFIED);
    assert.equal(qualified.length, 4);
    assert.ok(qualified.every((f) => W1_QUALIFIED_FAMILY_IDS.includes(f.id)));
  });

  it("dry-run qualification does not rewrite registry qualification_status", async () => {
    const before = registrySha();
    await runVcckQualification({ dryRun: true, rejectResults: runAllRejectFixtures() });
    const after = registrySha();
    assert.equal(after, before);
    const check = assertRegistryQualificationContract(loadFamilyRegistry({ reload: true }));
    assert.equal(check.ok, true, check.errors.join("; "));
  });

  it("operational drift blocks use without downgrading registry qualification", () => {
    const pass = Object.fromEntries(W1_REQUIRED_GATES.map((g) => [g, "PASS"]));
    const ok = computeW1FamilyVerdict("chain", pass);
    assert.equal(ok.qualificationStatus, QUALIFICATION_STATUS.QUALIFIED);
    assert.equal(ok.operationalStatus, OPERATIONAL_STATUS.READY_FOR_USE);

    const drift = computeW1FamilyVerdict("chain", { ...pass, snapshots: "FAIL" });
    assert.equal(drift.qualificationStatus, QUALIFICATION_STATUS.QUALIFIED);
    assert.equal(drift.operationalStatus, OPERATIONAL_STATUS.BLOCKED_FOR_USE);
    assert.equal(getFamilyQualificationStatus("chain", loadFamilyRegistry({ reload: true })), QUALIFICATION_STATUS.QUALIFIED);
  });

  it("experimental family stays EXPERIMENTAL after operational PASS", () => {
    const pass = Object.fromEntries(W1_REQUIRED_GATES.map((g) => [g, "PASS"]));
    assert.equal(getFamilyQualificationStatus("fan-out"), QUALIFICATION_STATUS.EXPERIMENTAL);
    const v = computeW1FamilyVerdict("fan-out", pass);
    assert.equal(v.qualificationStatus, QUALIFICATION_STATUS.EXPERIMENTAL);
    assert.equal(v.operationalStatus, OPERATIONAL_STATUS.READY_FOR_USE);
  });
});
