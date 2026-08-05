/**
 * Inter-process render determinism — two independent Node processes, byte-identical output.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { REPO_ROOT } from "../paths.js";
import { VCCK_SNAPSHOTS } from "./paths.js";
import { verifySingleArtifactSnapshot, computeFixtureArtifactHash } from "./w1-artifact-snapshots.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RENDER_ONCE = path.join(REPO_ROOT, "tools/lou-build/scripts/vcck-render-once.mjs");
const DEFAULT_SNAPSHOT = path.join(VCCK_SNAPSHOTS, "render-hashes.json");

export function determinismHash(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function spawnRender(fixturePath, outputPath) {
  const r = spawnSync(process.execPath, [RENDER_ONCE, fixturePath, outputPath], {
    encoding: "utf8",
    cwd: path.join(REPO_ROOT, "tools/lou-build"),
  });
  return {
    ok: r.status === 0,
    stdout: r.stdout || "",
    stderr: r.stderr || "",
    status: r.status,
  };
}

/**
 * Render same fixture in two independent processes; compare bytes and hashes.
 */
export function checkInterProcessDeterminism(fixturePath, options = {}) {
  const tmpA = fs.mkdtempSync(path.join(os.tmpdir(), "vcck-ipc-a-"));
  const tmpB = fs.mkdtempSync(path.join(os.tmpdir(), "vcck-ipc-b-"));
  const outA = path.join(tmpA, "artifact.bin");
  const outB = path.join(tmpB, "artifact.bin");

  try {
    const runA = spawnRender(fixturePath, outA);
    const runB = spawnRender(fixturePath, outB);

    if (!runA.ok || !runB.ok) {
      return {
        ok: false,
        errors: [
          !runA.ok ? `process A failed: ${runA.stderr}` : null,
          !runB.ok ? `process B failed: ${runB.stderr}` : null,
        ].filter(Boolean),
        hashA: null,
        hashB: null,
      };
    }

    if (!fs.existsSync(outA) || !fs.existsSync(outB)) {
      return { ok: false, errors: ["missing artifact from subprocess"], hashA: null, hashB: null };
    }

    const bytesA = fs.readFileSync(outA);
    const bytesB = fs.readFileSync(outB);
    const hashA = determinismHash(bytesA);
    const hashB = determinismHash(bytesB);
    const bytesMatch = Buffer.compare(bytesA, bytesB) === 0;

    return {
      ok: bytesMatch && hashA === hashB,
      hashA,
      hashB,
      bytesMatch,
      errors: bytesMatch ? [] : ["inter-process byte mismatch"],
      fixture: path.basename(fixturePath),
    };
  } finally {
    fs.rmSync(tmpA, { recursive: true, force: true });
    fs.rmSync(tmpB, { recursive: true, force: true });
  }
}

/** Load versioned reference snapshot (read-only for verify). */
export function loadRenderSnapshot(snapshotPath = DEFAULT_SNAPSHOT) {
  if (!fs.existsSync(snapshotPath)) return { entries: {}, path: snapshotPath, exists: false };
  const entries = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  return { entries, path: snapshotPath, exists: true };
}

/**
 * Verify fixture hashes against reference — never writes snapshot.
 * Delegates to w1-artifact-snapshots (single canonical implementation).
 */
export function verifyRenderSnapshots(fixtures, options = {}) {
  const snapshotPath = options.snapshotPath || DEFAULT_SNAPSHOT;
  const snap = loadRenderSnapshot(snapshotPath);
  const errors = [];
  const results = [];

  if (!snap.exists) {
    return { ok: false, errors: [`snapshot missing: ${snapshotPath}`], results, snapshotPath };
  }

  for (const fixturePath of fixtures) {
    const r = verifySingleArtifactSnapshot(fixturePath, { ...options, snapshotPath, snapshot: snap });
    results.push({
      fixture: r.fixture,
      hash: r.hash,
      expected: r.expectedHash,
      ok: r.ok ?? false,
      status: r.status,
    });
    for (const e of r.errors) errors.push(`${r.fixture}: ${e}`);
  }

  return { ok: errors.length === 0, errors, results, snapshotPath };
}

/**
 * Update reference snapshot — must NOT be called from tests or qualification runner.
 * With merge:true, preserves entries not in fixtures list.
 */
export function updateRenderSnapshots(fixtures, options = {}) {
  const snapshotPath = options.snapshotPath || DEFAULT_SNAPSHOT;
  const merge = options.merge !== false;
  const metadataByFile = options.metadataByFile || {};
  fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });

  const entries =
    merge && fs.existsSync(snapshotPath)
      ? JSON.parse(fs.readFileSync(snapshotPath, "utf8"))
      : {};

  for (const fixturePath of fixtures) {
    const key = path.basename(fixturePath);
    const computed = computeFixtureArtifactHash(fixturePath, options);
    if (!computed.ok) throw new Error(`${key}: render failed — ${computed.error}`);
    const meta = metadataByFile[key] || {};
    entries[key] = {
      family: meta.family ?? null,
      contractVersion: meta.contractVersion ?? null,
      technology: meta.technology ?? null,
      hash: computed.hash,
      ...(meta.pngManifest ? { pngManifest: meta.pngManifest } : {}),
    };
  }

  fs.writeFileSync(snapshotPath, `${JSON.stringify(entries, null, 2)}\n`);
  return { path: snapshotPath, count: fixtures.length, entries };
}
