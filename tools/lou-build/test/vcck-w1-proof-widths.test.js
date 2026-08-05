import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { VCCK_REPORTS, VCCK_VIEWPORT_WIDTHS } from "../lib/vcck/paths.js";
import { W1_VIEWPORT_WIDTHS } from "../lib/vcck/w1-constants.js";
import {
  W1_APPROVED_POSITIVES,
  W1_AUDIT_PNG_WIDTHS,
  W1_EXPECTED_PNG_PROOF_COUNT,
  assertW1ProofWidthContract,
} from "../lib/vcck/w1-snapshots.js";
import { verifyW1CandidateDrift } from "../lib/vcck/w1-candidate-drift.js";

const CONTRACT_WIDTHS = [375, 530, 768, 1280, 2400];

describe("vcck-w1-proof-widths", () => {
  it("authoritative width lists are identical", () => {
    const check = assertW1ProofWidthContract();
    assert.equal(check.ok, true, check.errors.join("; "));
    assert.deepEqual([...W1_AUDIT_PNG_WIDTHS], CONTRACT_WIDTHS);
    assert.deepEqual([...W1_VIEWPORT_WIDTHS], CONTRACT_WIDTHS);
    assert.deepEqual([...VCCK_VIEWPORT_WIDTHS], CONTRACT_WIDTHS);
  });

  it("manifest declares five contract widths and 40 PNG proofs", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(VCCK_REPORTS, "w1-candidate-hashes.json"), "utf8"),
    );
    const widths = [...new Set((manifest.candidates || []).map((c) => c.width))].sort(
      (a, b) => a - b,
    );
    assert.deepEqual(widths, CONTRACT_WIDTHS);
    assert.equal(manifest.candidates.length, W1_EXPECTED_PNG_PROOF_COUNT);
    assert.equal(W1_EXPECTED_PNG_PROOF_COUNT, 40);
    const check = assertW1ProofWidthContract(widths);
    assert.equal(check.ok, true, check.errors.join("; "));
  });

  it("each approved fixture has all five widths in manifest", () => {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(VCCK_REPORTS, "w1-candidate-hashes.json"), "utf8"),
    );
    for (const entry of W1_APPROVED_POSITIVES) {
      const stem = entry.file.replace(".yaml", "");
      for (const w of W1_AUDIT_PNG_WIDTHS) {
        const found = manifest.candidates.some((c) => c.fixture === stem && c.width === w);
        assert.equal(found, true, `${stem} missing width ${w}`);
      }
    }
  });

  it("drift verify passes with 40 PNG proofs", () => {
    const drift = verifyW1CandidateDrift();
    assert.equal(drift.ok, true, drift.errors?.join("; "));
    assert.equal(drift.fixturesVerified, 8);
    assert.equal(drift.widthsPerFixture, 5);
    assert.equal(drift.pngProofsVerified, 40);
  });

  it("missing 768 manifest entry fails", () => {
    const manifestPath = path.join(VCCK_REPORTS, "w1-candidate-hashes.json");
    const original = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(original);
    manifest.candidates = manifest.candidates.filter((c) => c.width !== 768);
    const tmp = path.join(VCCK_REPORTS, ".w1-candidate-hashes-test.json");
    fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2));
    try {
      const drift = verifyW1CandidateDrift({ manifestPath: tmp });
      assert.equal(drift.ok, false);
      assert.ok(drift.errors.some((e) => e.includes("768") || e.includes("40")));
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it("modified 768 hash fails", () => {
    const manifestPath = path.join(VCCK_REPORTS, "w1-candidate-hashes.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const tmp = path.join(VCCK_REPORTS, ".w1-candidate-hashes-test2.json");
    const broken = structuredClone(manifest);
    const idx = broken.candidates.findIndex(
      (c) => c.fixture === "chain-short" && c.width === 768,
    );
    assert.ok(idx >= 0);
    broken.candidates[idx].hash = "0".repeat(64);
    fs.writeFileSync(tmp, JSON.stringify(broken, null, 2));
    try {
      const drift = verifyW1CandidateDrift({ manifestPath: tmp });
      assert.equal(drift.ok, false);
      assert.ok(drift.errors.some((e) => e.includes("chain-short") && e.includes("768")));
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it("unexpected manifest width fails", () => {
    const manifestPath = path.join(VCCK_REPORTS, "w1-candidate-hashes.json");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const tmp = path.join(VCCK_REPORTS, ".w1-candidate-hashes-test3.json");
    const broken = structuredClone(manifest);
    broken.candidates.push({
      family: "chain",
      fixture: "chain-short",
      width: 999,
      hash: "a".repeat(64),
      bytes: 1,
    });
    fs.writeFileSync(tmp, JSON.stringify(broken, null, 2));
    try {
      const drift = verifyW1CandidateDrift({ manifestPath: tmp });
      assert.equal(drift.ok, false);
      assert.ok(drift.errors.some((e) => e.includes("999") || e.includes("unexpected")));
    } finally {
      fs.unlinkSync(tmp);
    }
  });
});
