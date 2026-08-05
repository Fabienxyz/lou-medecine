import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { loadFamilyRegistry, allFamilyIds } from "../lib/vcck/registry.js";
import { assertRegistryQualificationContract } from "../lib/vcck/w1-qualification.js";
import { runVcckQualification } from "../lib/vcck/pipeline.js";
import { buildGalleryHtml } from "../lib/vcck/gallery.js";
import { VCCK_POSITIVE, VCCK_NEGATIVE } from "../lib/vcck/paths.js";
import { renderVcckSpec, checkDeterminism } from "../lib/vcck/render-bridge.js";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { loadVcckInventory } from "../lib/vcck/inventory.js";

test("registry contains 18 families with 4 QUALIFIED W1 contracts", () => {
  const reg = loadFamilyRegistry({ reload: true });
  assert.equal(reg.families.length, 18);
  const check = assertRegistryQualificationContract(reg);
  assert.equal(check.ok, true, check.errors.join("; "));
  assert.deepEqual(allFamilyIds(reg).sort(), [
    "binary-rule-out",
    "chain",
    "dependent-sequence",
    "diamond",
    "dual-context",
    "embedded-fragment",
    "fan-in",
    "fan-out",
    "flat-concurrent",
    "grouped-concurrent",
    "identity",
    "lateral-feedback",
    "monitoring-loop",
    "single-context",
    "skip-level-branch",
    "three-pole-reflow",
    "two-pole",
    "two-state",
  ]);
});

test("all positive fixtures exist (short + long)", () => {
  const reg = loadFamilyRegistry();
  for (const f of reg.families) {
    assert.ok(fs.existsSync(path.join(VCCK_POSITIVE, f.positive_fixtures.short)));
    assert.ok(fs.existsSync(path.join(VCCK_POSITIVE, f.positive_fixtures.long)));
    for (const neg of f.negative_fixtures) {
      const file = typeof neg === "string" ? neg : neg.path;
      assert.ok(fs.existsSync(path.join(VCCK_NEGATIVE, file)));
    }
  }
});

test("chain-short renders deterministically without playwright", () => {
  const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
  const inventory = loadVcckInventory();
  const rendered = renderVcckSpec(spec, { inventory });
  assert.equal(rendered.ok, true, rendered.errors?.join("; "));
  assert.match(rendered.artifact, /<svg/);
  const det = checkDeterminism(spec, { inventory });
  assert.equal(det.ok, true, det.errors?.join("; "));
});

test("dry-run qualification produces matrix report without gallery write", async () => {
  const { report, rejectResults, rejectFixturesOk } = await runVcckQualification({ dryRun: true });
  assert.match(report.markdown, /VCCK Qualification Matrix/);
  assert.match(report.markdown, /Reject fixtures/);
  assert.equal(rejectResults.length, 9);
  assert.equal(rejectFixturesOk, true);
  const html = buildGalleryHtml({ familyResults: report.familyResults });
  assert.match(html, /VCCK Gallery/);
});
