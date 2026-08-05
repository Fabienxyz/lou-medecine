import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { VCCK_REPORTS } from "../lib/vcck/paths.js";
import { W1_APPROVED_PNG_MANIFEST, W1_CANDIDATE_PNG_MANIFEST } from "../lib/vcck/w1-approved-png.js";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.join(ROOT, "../scripts/vcck-w1-verify-candidates.mjs");

function runVerify(env = {}) {
  return spawnSync(process.execPath, [SCRIPT], {
    cwd: path.join(ROOT, ".."),
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
}

describe("vcck-w1-verify-exit", () => {
  it("exits 0 on full conformity", () => {
    const r = runVerify();
    assert.equal(r.status, 0, r.stderr || r.stdout);
  });

  it("exits non-zero when candidate manifest hash is wrong", () => {
    const manifestPath = path.join(VCCK_REPORTS, "w1-candidate-hashes.json");
    const original = fs.readFileSync(manifestPath, "utf8");
    const manifest = JSON.parse(original);
    const tmp = path.join(os.tmpdir(), `verify-exit-candidate-${process.pid}.json`);
    const broken = structuredClone(manifest);
    broken.candidates[0].hash = "0".repeat(64);
    fs.writeFileSync(tmp, JSON.stringify(broken, null, 2));
    try {
      const r = runVerify({ VCCK_W1_CANDIDATE_MANIFEST: tmp });
      assert.notEqual(r.status, 0);
      assert.match(r.stderr + r.stdout, /drift|hash|Verdict/i);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it("exits non-zero when approved manifest hash is wrong", () => {
    const manifestPath = W1_APPROVED_PNG_MANIFEST;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const tmp = path.join(os.tmpdir(), `verify-exit-approved-${process.pid}.json`);
    const broken = structuredClone(manifest);
    const entries = broken.approved || broken.candidates;
    entries[0].hash = "f".repeat(64);
    fs.writeFileSync(tmp, JSON.stringify(broken, null, 2));
    try {
      const r = runVerify({ VCCK_W1_APPROVED_MANIFEST: tmp });
      assert.notEqual(r.status, 0);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it("exits non-zero when manifest file is missing", () => {
    const r = runVerify({
      VCCK_W1_CANDIDATE_MANIFEST: path.join(os.tmpdir(), `.missing-candidate-manifest-${process.pid}.json`),
    });
    assert.notEqual(r.status, 0);
  });

  it("exits non-zero when manifest width entry is missing", () => {
    const manifestPath = W1_CANDIDATE_PNG_MANIFEST;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const tmp = path.join(os.tmpdir(), `verify-exit-no768-${process.pid}.json`);
    const broken = structuredClone(manifest);
    broken.candidates = broken.candidates.filter((c) => c.width !== 768);
    fs.writeFileSync(tmp, JSON.stringify(broken, null, 2));
    try {
      const r = runVerify({ VCCK_W1_CANDIDATE_MANIFEST: tmp });
      assert.notEqual(r.status, 0);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it("exits non-zero when PNG byte size drifts", () => {
    const manifestPath = W1_CANDIDATE_PNG_MANIFEST;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const tmp = path.join(os.tmpdir(), `verify-exit-bytes-${process.pid}.json`);
    const broken = structuredClone(manifest);
    broken.candidates[0].bytes = 1;
    fs.writeFileSync(tmp, JSON.stringify(broken, null, 2));
    try {
      const r = runVerify({ VCCK_W1_CANDIDATE_MANIFEST: tmp });
      assert.notEqual(r.status, 0);
    } finally {
      fs.unlinkSync(tmp);
    }
  });
});
