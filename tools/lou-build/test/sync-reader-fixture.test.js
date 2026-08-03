import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../..");
const SYNC_SCRIPT = path.join(ROOT, "scripts/sync-reader-fixture.mjs");
const CHAPTER_234 = path.join(ROOT, "01-learning/chapters/cardio/234");

test("sync-reader-fixture installs published package into library root", () => {
  const libraryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lou-lib-sync-"));
  const output = execFileSync(
    process.execPath,
    [
      SYNC_SCRIPT,
      "--chapter",
      "01-learning/chapters/cardio/234",
      "--library",
      libraryRoot,
    ],
    { cwd: ROOT, encoding: "utf8" },
  );
  assert.match(output, /SYNC PASS/);

  const manifest = JSON.parse(
    fs.readFileSync(path.join(CHAPTER_234, "manifest.json"), "utf8"),
  );
  const releaseId = manifest.release_id;
  const installedManifest = path.join(
    libraryRoot,
    "packages",
    releaseId,
    "manifest.json",
  );
  assert.ok(fs.existsSync(installedManifest));
  const installed = JSON.parse(fs.readFileSync(installedManifest, "utf8"));
  assert.equal(installed.content_digest, manifest.content_digest);
});

test("sync-reader-fixture is idempotent on second run", () => {
  const libraryRoot = fs.mkdtempSync(path.join(os.tmpdir(), "lou-lib-sync-"));
  execFileSync(
    process.execPath,
    [SYNC_SCRIPT, "--library", libraryRoot],
    { cwd: ROOT },
  );

  const manifest = JSON.parse(
    fs.readFileSync(path.join(CHAPTER_234, "manifest.json"), "utf8"),
  );
  const releaseRoot = path.join(
    libraryRoot,
    "packages",
    manifest.release_id,
  );
  assert.ok(fs.existsSync(path.join(releaseRoot, "manifest.json")));

  const second = execFileSync(
    process.execPath,
    [SYNC_SCRIPT, "--library", libraryRoot],
    { cwd: ROOT, encoding: "utf8" },
  );
  assert.match(second, /SYNC PASS/);
  assert.match(second, /idempotent:\s+true/);
});
