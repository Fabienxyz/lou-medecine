import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../scripts/vcck-w1-verify-gitignore.mjs");

describe("vcck-w1-gitignore", () => {
  it("verify-gitignore script passes", () => {
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: ROOT, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr || r.stdout);
    assert.match(r.stdout, /VCCK gitignore verify PASS/);
  });

  it("patterns are relative to vcck/ without vcck/ prefix", () => {
    const r = spawnSync(
      "git",
      ["check-ignore", "-v", "tools/lou-build/vcck/output/chain/chain-short/artifact.svg"],
      { cwd: ROOT, encoding: "utf8" },
    );
    assert.equal(r.status, 0, "output path should be ignored");
    assert.match(r.stdout, /\.gitignore:\d+:output\//);
    assert.doesNotMatch(r.stdout.split("\t")[0], /:vcck\/output\//);
  });
});
