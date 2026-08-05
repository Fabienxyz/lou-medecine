import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  validatePerceptualApproval,
  PERCEPTUAL_APPROVAL_CONTRACT,
  DEFAULT_PERCEPTUAL_APPROVAL_PATH,
} from "../lib/vcck/w1-perceptual-approval.js";

function withMutant(mutator, fn) {
  const tmp = path.join(os.tmpdir(), `w1-perceptual-${Date.now()}.json`);
  const base = JSON.parse(fs.readFileSync(DEFAULT_PERCEPTUAL_APPROVAL_PATH, "utf8"));
  fs.writeFileSync(tmp, JSON.stringify(mutator(base), null, 2));
  try {
    fn(tmp);
  } finally {
    fs.unlinkSync(tmp);
  }
}

describe("vcck-w1-perceptual-approval", () => {
  it("validates the versioned attestation", () => {
    const r = validatePerceptualApproval();
    assert.equal(r.ok, true, r.errors.join("; "));
    assert.equal(r.status, "PASS_CODEX");
    assert.equal(r.doc.contract, PERCEPTUAL_APPROVAL_CONTRACT);
  });

  it("rejects missing file", () => {
    const r = validatePerceptualApproval({
      approvalPath: path.join(os.tmpdir(), "missing-perceptual.json"),
    });
    assert.equal(r.ok, false);
  });

  for (const [field, value] of [
    ["contract", "WRONG"],
    ["status", "FAIL"],
    ["authority", "HUMAN"],
  ]) {
    it(`rejects mutant ${field}`, () => {
      withMutant((doc) => ({ ...doc, [field]: value }), (approvalPath) => {
        const r = validatePerceptualApproval({ approvalPath });
        assert.equal(r.ok, false);
        assert.ok(r.errors.some((e) => e.includes(field) || e.includes(String(value))));
      });
    });
  }

  it("rejects wrong proofCount", () => {
    withMutant((doc) => ({ ...doc, scope: { ...doc.scope, proofCount: 39 } }), (approvalPath) => {
      const r = validatePerceptualApproval({ approvalPath });
      assert.equal(r.ok, false);
    });
  });

  it("rejects wrong manifest sha256", () => {
    withMutant((doc) => ({ ...doc, approvedManifestSha256: "0".repeat(64) }), (approvalPath) => {
      const r = validatePerceptualApproval({ approvalPath });
      assert.equal(r.ok, false);
      assert.ok(r.errors.some((e) => e.includes("approvedManifestSha256")));
    });
  });

  it("rejects extra attestation keys", () => {
    withMutant((doc) => ({ ...doc, timestamp: "2026-01-01" }), (approvalPath) => {
      const r = validatePerceptualApproval({ approvalPath });
      assert.equal(r.ok, false);
      assert.ok(r.errors.some((e) => e.includes("unexpected attestation keys")));
    });
  });
});
