import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { VCCK_POSITIVE, VCCK_SNAPSHOTS } from "../lib/vcck/paths.js";
import { REPO_ROOT } from "../lib/paths.js";
import {
  SNAPSHOT_GATE,
  computeFixtureArtifactHash,
  verifySingleArtifactSnapshot,
  verifyW1ArtifactSnapshots,
  verifyAllW1ArtifactSnapshots,
  snapshotGateStatusForFamily,
} from "../lib/vcck/w1-artifact-snapshots.js";
import { verifyRenderSnapshots } from "../lib/vcck/determinism-ipc.js";
import { w1ApprovedFixturePaths, w1ApprovedMetadataByFile } from "../lib/vcck/w1-snapshots.js";
import { evaluateW1FamilyGates } from "../lib/vcck/w1-gates.js";
import {
  computeW1MissionVerdictFromPipeline,
  W1_MISSION_VERDICT,
} from "../lib/vcck/w1-verdict.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.join(VCCK_SNAPSHOTS, "render-hashes.json");
const VERIFY_SCRIPT = path.join(__dirname, "../scripts/vcck-verify-snapshots.mjs");

function makeTempSnapshot(entries) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "vcck-snap-test-"));
  const file = path.join(dir, "render-hashes.json");
  fs.writeFileSync(file, JSON.stringify(entries, null, 2));
  return { dir, file };
}

describe("vcck-w1-artifact-snapshots gate", () => {
  it("passes when current hash matches reference", () => {
    const fixture = path.join(VCCK_POSITIVE, "chain-short.yaml");
    const computed = computeFixtureArtifactHash(fixture);
    assert.equal(computed.ok, true);
    const meta = w1ApprovedMetadataByFile()["chain-short.yaml"];
    const { file } = makeTempSnapshot({
      "chain-short.yaml": {
        family: meta.family,
        contractVersion: meta.contractVersion,
        technology: meta.technology,
        hash: computed.hash,
      },
    });
    const r = verifySingleArtifactSnapshot(fixture, { snapshotPath: file });
    assert.equal(r.status, SNAPSHOT_GATE.PASS);
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
  });

  it("fails on modified hash", () => {
    const fixture = path.join(VCCK_POSITIVE, "chain-short.yaml");
    const meta = w1ApprovedMetadataByFile()["chain-short.yaml"];
    const { file } = makeTempSnapshot({
      "chain-short.yaml": {
        family: meta.family,
        contractVersion: meta.contractVersion,
        technology: meta.technology,
        hash: "0".repeat(64),
      },
    });
    const r = verifySingleArtifactSnapshot(fixture, { snapshotPath: file });
    assert.equal(r.status, SNAPSHOT_GATE.FAIL);
    assert.ok(r.errors.some((e) => e.includes("hash mismatch")));
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
  });

  it("fails on stale hash present but obsolete", () => {
    const fixture = path.join(VCCK_POSITIVE, "two-pole-short.yaml");
    const meta = w1ApprovedMetadataByFile()["two-pole-short.yaml"];
    const stale = "1b9f81743f96b0b4902dbc60cd4a4439eb2ed18acf90bfc83139baf7fb8f8e1f";
    const { file } = makeTempSnapshot({
      "two-pole-short.yaml": {
        family: meta.family,
        contractVersion: meta.contractVersion,
        technology: meta.technology,
        hash: stale,
      },
    });
    const r = verifySingleArtifactSnapshot(fixture, { snapshotPath: file });
    assert.equal(r.status, SNAPSHOT_GATE.FAIL);
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
  });

  it("fails on incorrect family in reference", () => {
    const fixture = path.join(VCCK_POSITIVE, "chain-short.yaml");
    const meta = w1ApprovedMetadataByFile()["chain-short.yaml"];
    const computed = computeFixtureArtifactHash(fixture);
    const { file } = makeTempSnapshot({
      "chain-short.yaml": {
        family: "two-pole",
        contractVersion: meta.contractVersion,
        technology: meta.technology,
        hash: computed.hash,
      },
    });
    const r = verifySingleArtifactSnapshot(fixture, { snapshotPath: file });
    assert.equal(r.status, SNAPSHOT_GATE.FAIL);
    assert.ok(r.errors.some((e) => e.includes("family")));
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
  });

  it("fails on incorrect contract version", () => {
    const fixture = path.join(VCCK_POSITIVE, "chain-short.yaml");
    const meta = w1ApprovedMetadataByFile()["chain-short.yaml"];
    const computed = computeFixtureArtifactHash(fixture);
    const { file } = makeTempSnapshot({
      "chain-short.yaml": {
        family: meta.family,
        contractVersion: "W1-9",
        technology: meta.technology,
        hash: computed.hash,
      },
    });
    const r = verifySingleArtifactSnapshot(fixture, { snapshotPath: file });
    assert.equal(r.status, SNAPSHOT_GATE.FAIL);
    assert.ok(r.errors.some((e) => e.includes("contractVersion")));
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
  });

  it("fails on incorrect technology", () => {
    const fixture = path.join(VCCK_POSITIVE, "chain-short.yaml");
    const meta = w1ApprovedMetadataByFile()["chain-short.yaml"];
    const computed = computeFixtureArtifactHash(fixture);
    const { file } = makeTempSnapshot({
      "chain-short.yaml": {
        family: meta.family,
        contractVersion: meta.contractVersion,
        technology: "html",
        hash: computed.hash,
      },
    });
    const r = verifySingleArtifactSnapshot(fixture, { snapshotPath: file });
    assert.equal(r.status, SNAPSHOT_GATE.FAIL);
    assert.ok(r.errors.some((e) => e.includes("technology")));
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
  });

  it("blocks when snapshot entry is missing", () => {
    const fixture = path.join(VCCK_POSITIVE, "chain-short.yaml");
    const { file } = makeTempSnapshot({});
    const r = verifySingleArtifactSnapshot(fixture, { snapshotPath: file });
    assert.equal(r.status, SNAPSHOT_GATE.BLOCKED);
    fs.rmSync(path.dirname(file), { recursive: true, force: true });
  });

  it("blocks when render is not executable", () => {
    const missing = path.join(VCCK_POSITIVE, "nonexistent-fixture.yaml");
    const r = verifySingleArtifactSnapshot(missing, { snapshotPath: SNAPSHOT_PATH });
    assert.equal(r.status, SNAPSHOT_GATE.BLOCKED);
  });

  it("never modifies reference file during verify", () => {
    if (!fs.existsSync(SNAPSHOT_PATH)) return;
    const beforeStat = fs.statSync(SNAPSHOT_PATH);
    const beforeContent = fs.readFileSync(SNAPSHOT_PATH, "utf8");
    verifyAllW1ArtifactSnapshots();
    const afterStat = fs.statSync(SNAPSHOT_PATH);
    const afterContent = fs.readFileSync(SNAPSHOT_PATH, "utf8");
    assert.equal(beforeStat.mtimeMs, afterStat.mtimeMs);
    assert.equal(beforeContent, afterContent);
  });

  it("gate matches verifyRenderSnapshots on same repo state", () => {
    const fixtures = w1ApprovedFixturePaths();
    const ipc = verifyRenderSnapshots(fixtures, { snapshotPath: SNAPSHOT_PATH });
    const shared = verifyAllW1ArtifactSnapshots({ snapshotPath: SNAPSHOT_PATH });
    assert.equal(ipc.ok, shared.ok);
    assert.deepEqual(
      ipc.errors.sort(),
      shared.errors.sort(),
      "verifyRenderSnapshots and verifyAllW1ArtifactSnapshots must agree",
    );
  });

  it("gate matches vcck-verify-snapshots.mjs script result", () => {
    const shared = verifyAllW1ArtifactSnapshots({ snapshotPath: SNAPSHOT_PATH });
    const script = spawnSync(process.execPath, [VERIFY_SCRIPT], {
      cwd: path.join(REPO_ROOT, "tools/lou-build"),
      encoding: "utf8",
    });
    const scriptOk = script.status === 0;
    assert.equal(shared.ok, scriptOk, `script stderr: ${script.stderr}`);
  });
});

describe("vcck-w1-snapshot-pre-update integration", () => {
  it("detects four HTML artifact snapshot mismatches before baseline update", () => {
    const verification = verifyAllW1ArtifactSnapshots({ snapshotPath: SNAPSHOT_PATH });
    const htmlFixtures = ["two-pole-short.yaml", "two-pole-long.yaml", "flat-concurrent-short.yaml", "flat-concurrent-long.yaml"];
    const htmlFails = verification.results.filter(
      (r) => htmlFixtures.includes(r.fixture) && r.status === SNAPSHOT_GATE.FAIL,
    );
    if (htmlFails.length === 4) {
      assert.equal(verification.ok, false);
      for (const id of ["two-pole", "flat-concurrent"]) {
        assert.equal(snapshotGateStatusForFamily(id, { snapshotPath: SNAPSHOT_PATH }), SNAPSHOT_GATE.FAIL);
      }
    } else {
      assert.equal(htmlFails.length, 0, "expected either 4 HTML fails pre-update or 0 post-update");
      assert.equal(verification.ok, true);
    }
  });

  it("blocks CODEX_REAUDIT when HTML snapshots drift (pre-update state)", () => {
    const verification = verifyAllW1ArtifactSnapshots({ snapshotPath: SNAPSHOT_PATH });
    if (!verification.ok) {
      const twoPole = evaluateW1FamilyGates("two-pole", { familyResults: {} });
      assert.equal(twoPole.gates.snapshots, SNAPSHOT_GATE.FAIL);
      const mission = computeW1MissionVerdictFromPipeline({}, {
        pngReapproval: { ok: false, errors: ["drift"] },
        artifactSnapshots: verification,
      });
      assert.notEqual(mission.missionVerdict, W1_MISSION_VERDICT.CODEX_REAUDIT);
      assert.notEqual(mission.missionVerdict, W1_MISSION_VERDICT.GIT_BASELINE);
    }
  });
});
