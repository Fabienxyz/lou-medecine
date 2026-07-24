import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveChapterDir } from "../lib/paths.js";
import { loadYamlFile, validateAllAnchors } from "../lib/anchors.js";
import * as pathsModule from "../lib/paths.js";
import { validateInventory } from "../lib/inventory.js";
import { parseBlueprint, validateBlueprint } from "../lib/blueprint.js";
import { loadAllProjectionClaimsSync } from "../lib/claims.js";
import { groundDeterministic, extractThresholdFromQuote } from "../lib/ground.js";
import { runValidation, runBuild } from "../lib/package.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAPTER = resolveChapterDir(
  path.join(__dirname, "../../../01-learning/chapters/cardio/234")
);

test("anchor validation — all slice KPs resolve in 2024-SFC source", () => {
  const paths = pathsModule.chapterPaths(CHAPTER);
  const sourceMeta = loadYamlFile(paths.sourceMeta);
  sourceMeta._path = paths.sourceMeta;
  const inventory = loadYamlFile(paths.inventory);
  const { text } = pathsModule.loadSourceText(sourceMeta);
  const result = validateAllAnchors(text, inventory, sourceMeta);
  assert.equal(result.ok, true, result.errors.join("; "));
});

test("inventory — exactly 3 KPs with dispositions", () => {
  const inventory = loadYamlFile(path.join(CHAPTER, "inventory.yaml"));
  const result = validateInventory(inventory);
  assert.equal(result.ok, true);
  assert.equal(inventory.kps.length, 3);
  assert.deepEqual(result.ids.sort(), ["KP-040", "KP-041", "KP-042"]);
});

test("KP-041 anchor threshold is 25 mmHg", () => {
  const inventory = loadYamlFile(path.join(CHAPTER, "inventory.yaml"));
  const q = inventory.kps.find((k) => k.id === "KP-041").anchors[0].quote;
  assert.equal(extractThresholdFromQuote(q), 25);
});

test("claim-trace completeness", () => {
  const paths = pathsModule.chapterPaths(CHAPTER);
  const inventory = loadYamlFile(paths.inventory);
  const result = loadAllProjectionClaimsSync(paths, inventory);
  assert.equal(result.ok, true, result.errors.join("; "));
});

test("deterministic grounding PASS at >25 mmHg", () => {
  const paths = pathsModule.chapterPaths(CHAPTER);
  const inventory = loadYamlFile(paths.inventory);
  const sourceMeta = loadYamlFile(paths.sourceMeta);
  const result = groundDeterministic({ filePaths: paths, inventory, sourceMeta });
  assert.equal(result.ok, true, result.errors.join("; "));
  assert.equal(result.verdicts["cb-oap-threshold"].status, "pass");
});

test("REQUIRED deliberate failure — >30 mmHg blocks grounding", () => {
  const mechPath = path.join(
    CHAPTER,
    "projections/understanding/mechanisms.md"
  );
  const original = fs.readFileSync(mechPath, "utf8");
  const corrupted = original.replace("> 25 mmHg", "> 30 mmHg");
  fs.writeFileSync(mechPath, corrupted);
  try {
    const paths = pathsModule.chapterPaths(CHAPTER);
    const inventory = loadYamlFile(paths.inventory);
    const sourceMeta = loadYamlFile(paths.sourceMeta);
    const result = groundDeterministic({ filePaths: paths, inventory, sourceMeta });
    assert.equal(result.ok, false);
    assert.equal(result.verdicts["cb-oap-threshold"].status, "fail");
    assert.equal(result.verdicts["cb-oap-threshold"].found_mmHg, 30);
  } finally {
    fs.writeFileSync(mechPath, original);
  }
});

test("after restore — full build passes", () => {
  const result = runBuild(CHAPTER);
  assert.equal(result.ok, true, (result.errors || []).join("; "));
  assert.ok(fs.existsSync(path.join(CHAPTER, "manifest.json")));
});

test("dangling KP-999 fails blueprint validation", () => {
  const bpPath = path.join(CHAPTER, "blueprint.md");
  const original = fs.readFileSync(bpPath, "utf8");
  const corrupted = original.replace("uses_kp: [KP-040]", "uses_kp: [KP-999]");
  fs.writeFileSync(bpPath, corrupted);
  try {
    const inventory = loadYamlFile(path.join(CHAPTER, "inventory.yaml"));
    const invVal = validateInventory(inventory);
    const bp = parseBlueprint(bpPath, corrupted);
    const result = validateBlueprint(bp, new Set(invVal.ids));
    assert.equal(result.ok, false);
  } finally {
    fs.writeFileSync(bpPath, original);
  }
});

test("unresolved anchor quote fails validation", () => {
  const invPath = path.join(CHAPTER, "inventory.yaml");
  const original = fs.readFileSync(invPath, "utf8");
  const corrupted = original.replace(
    "pression capillaire pulmonaire au-delà d’un certain seuil",
    "pression capillaire pulmonaire INEXISTANTE au-delà d’un certain seuil"
  );
  fs.writeFileSync(invPath, corrupted);
  try {
    const paths = pathsModule.chapterPaths(CHAPTER);
    const sourceMeta = loadYamlFile(paths.sourceMeta);
    sourceMeta._path = paths.sourceMeta;
    const inventory = loadYamlFile(invPath);
    const { text } = pathsModule.loadSourceText(sourceMeta);
    const result = validateAllAnchors(text, inventory, sourceMeta);
    assert.equal(result.ok, false);
  } finally {
    fs.writeFileSync(invPath, original);
  }
});

test("missing claim-trace fails", () => {
  const mechPath = path.join(
    CHAPTER,
    "projections/understanding/mechanisms.md"
  );
  const original = fs.readFileSync(mechPath, "utf8");
  const corrupted = original.replace("<!-- claim-trace", "<!-- removed-claim-trace");
  fs.writeFileSync(mechPath, corrupted);
  try {
    const inventory = loadYamlFile(path.join(CHAPTER, "inventory.yaml"));
    const paths = pathsModule.chapterPaths(CHAPTER);
    const result = loadAllProjectionClaimsSync(paths, inventory);
    assert.equal(result.ok, false);
  } finally {
    fs.writeFileSync(mechPath, original);
  }
});

test("missing visual_intent fails package validation", () => {
  const bpPath = path.join(CHAPTER, "blueprint.md");
  const original = fs.readFileSync(bpPath, "utf8");
  const corrupted = original.replace(
    "visual_intent: process-flow",
    "visual_intent_removed: process-flow"
  );
  fs.writeFileSync(bpPath, corrupted);
  try {
    const result = runValidation(CHAPTER);
    assert.equal(result.ok, false);
  } finally {
    fs.writeFileSync(bpPath, original);
  }
});

test("reconciliation missed segment fails", () => {
  const recPath = path.join(CHAPTER, "build/reconciliation.yaml");
  const original = fs.readFileSync(recPath, "utf8");
  const corrupted = original.replace(
    "disposition: represented\n    kp: [KP-041]",
    "disposition: missed\n    kp: []"
  );
  fs.writeFileSync(recPath, corrupted);
  try {
    const result = runValidation(CHAPTER);
    assert.equal(result.ok, false);
  } finally {
    fs.writeFileSync(recPath, original);
  }
});

test("reconciliation empty segments fails", () => {
  const recPath = path.join(CHAPTER, "build/reconciliation.yaml");
  const original = fs.readFileSync(recPath, "utf8");
  const corrupted = original.replace(/^segments:[\s\S]*/m, "segments: []");
  fs.writeFileSync(recPath, corrupted);
  try {
    const result = runValidation(CHAPTER);
    assert.equal(result.ok, false);
    assert.match(result.errors.join("; "), /segments list is empty/);
  } finally {
    fs.writeFileSync(recPath, original);
  }
});

test("reconciliation missing threshold segment fails", () => {
  const recPath = path.join(CHAPTER, "build/reconciliation.yaml");
  const original = fs.readFileSync(recPath, "utf8");
  const corrupted = original.replace(
    /  - id: seg-D[\s\S]*?kp: \[KP-041\]\n/,
    ""
  );
  fs.writeFileSync(recPath, corrupted);
  try {
    const result = runValidation(CHAPTER);
    assert.equal(result.ok, false);
    assert.match(result.errors.join("; "), /seg-D/);
  } finally {
    fs.writeFileSync(recPath, original);
  }
});

test("overview claim trace includes KP-042 for lesional/exudate contrast", () => {
  const paths = pathsModule.chapterPaths(CHAPTER);
  const inventory = loadYamlFile(paths.inventory);
  const result = loadAllProjectionClaimsSync(paths, inventory);
  assert.equal(result.ok, true);
  const overviewClaim = result.allClaims.find((c) => c.id === "cb-overview-oap");
  assert.ok(overviewClaim);
  assert.ok(overviewClaim.kp.includes("KP-042"));
});

test("integration — real build path invalidates stale publication on >30 corruption", () => {
  const paths = pathsModule.chapterPaths(CHAPTER);
  const mechPath = paths.mechanisms;
  const manifestPath = paths.manifest;
  const groundingPath = paths.grounding;
  const original = fs.readFileSync(mechPath, "utf8");

  try {
    assert.match(original, /> 25 mmHg/);

    let result = runBuild(CHAPTER);
    assert.equal(result.ok, true, (result.errors || []).join("; "));
    assert.ok(fs.existsSync(manifestPath), "publishable manifest should exist after successful build");

    fs.writeFileSync(mechPath, original.replace(/> 25 mmHg/g, "> 30 mmHg"));

    result = runBuild(CHAPTER);
    assert.equal(result.ok, false, "corrupted threshold build must fail");
    assert.equal(
      fs.existsSync(manifestPath),
      false,
      "stale publishable manifest must be removed on failed build"
    );

    const grounding = fs.readFileSync(groundingPath, "utf8");
    assert.match(grounding, /^status: fail/m);
    assert.match(
      grounding,
      /cb-oap-threshold:\n    mode: "deterministic"\n    status: "fail"/
    );
    assert.doesNotMatch(grounding, /^status: pass/m);

    fs.writeFileSync(mechPath, original);

    result = runBuild(CHAPTER);
    assert.equal(result.ok, true, (result.errors || []).join("; "));
    assert.ok(fs.existsSync(manifestPath), "manifest must be recreated after restore build");

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    assert.equal(manifest.slice_reconciliation_invariant, "pass");
  } finally {
    fs.writeFileSync(mechPath, original);
    runBuild(CHAPTER);
  }
});
