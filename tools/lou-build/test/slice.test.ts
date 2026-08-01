import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { invalidatePublishableState } from "../lib/package.js";
import { resolveChapterDir } from "../lib/paths.js";
import { loadYamlFile, validateAllAnchors } from "../lib/anchors.js";
import * as pathsModule from "../lib/paths.js";
import { validateInventory } from "../lib/inventory.js";
import { parseBlueprint, validateBlueprint } from "../lib/blueprint.js";
import { loadAllProjectionClaimsSync } from "../lib/claims.js";
import { groundDeterministic, extractThresholdFromQuote } from "../lib/ground.js";
import { reconcile } from "../lib/reconcile.js";
import { createContext } from "../src/pipeline/context.js";
import { BUILD_PIPELINE, VALIDATE_PIPELINE } from "../src/pipeline/pipeline.js";
import { runPipeline, type RunReport } from "../src/pipeline/runner.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAPTER = resolveChapterDir(
  path.join(__dirname, "../../../01-learning/chapters/cardio/234")
);

function collectErrors(report: RunReport): string[] {
  const errors: string[] = [];
  for (const result of report.results.values()) {
    if (!result.ok) errors.push(...result.errors);
  }
  return errors;
}

async function runTypedValidation(chapterDir: string) {
  const ctx = createContext(chapterDir, "validate");
  const report = await runPipeline(VALIDATE_PIPELINE, ctx);
  const visualBuild = (ctx.workspace.visualBuild || {}) as {
    withheld?: { elementId: string; state: string; reasons: string[] }[];
    rendered?: unknown[];
  };
  return {
    ok: report.ok,
    errors: collectErrors(report),
    steps: {
      visuals: {
        withheld: visualBuild.withheld || [],
        rendered: visualBuild.rendered || [],
      },
    },
  };
}

async function runTypedBuild(chapterDir: string) {
  const paths = pathsModule.chapterPaths(chapterDir);
  invalidatePublishableState(paths);
  const ctx = createContext(chapterDir, "build");
  const report = await runPipeline(BUILD_PIPELINE, ctx);
  const packaging = report.results.get("packaging");
  const packagingData = packaging?.data as
    | {
        manifest?: Record<string, unknown> & {
          official_visuals?: { element: string; state: string; reasons?: string[] }[];
          visuals?: { element: string }[];
          projections?: { type: string; status: string }[];
        };
        withheldVisuals?: { elementId: string; state: string; reasons?: string[] }[];
      }
    | undefined;
  const manifest = packagingData?.manifest;
  const withheldVisuals =
    packagingData?.withheldVisuals ||
    (ctx.workspace.visualBuild as { withheld?: { elementId: string; state: string; reasons?: string[] }[] })
      ?.withheld ||
    [];
  return {
    ok: report.ok,
    errors: collectErrors(report),
    manifest,
    withheldVisuals,
    paths,
  };
}

const RECONCILIATION_FIXTURE = `# OAP vertical slice — scoped reconciliation (NOT full Item 234 coverage)
chapter: cardio/234
slice: oap-mechanism-vertical-slice
slice_scope: pulmonary filling pressure / congestion → upstream VG pressure transmission → PPC threshold crossing → transudation → cardiogenic OAP → cardiogenic transudate vs lesional exudate confusion boundary
reconciliation_scope: pulmonary filling pressure / congestion → upstream VG pressure transmission → PPC threshold crossing → transudation → cardiogenic OAP → cardiogenic transudate vs lesional exudate confusion boundary

required_segment_ids:
  - seg-B
  - seg-C
  - seg-D
  - seg-E

methodology: bootstrap-cursor-v1
status: pass

segments:
  - id: seg-B
    label: Filling-pressure consequence (pump dysfunction)
    source_lines: "254-258"
    section_path: "I. Généralités > C Physiopathologie > 1 Quelques rappels simples"
    disposition: represented
    kp: [KP-040]

  - id: seg-C
    label: Pulmonary transmission (VG → capillaries)
    source_lines: "259-261"
    section_path: "I. Généralités > C Physiopathologie > 1 Quelques rappels simples"
    disposition: represented
    kp: [KP-040]

  - id: seg-D
    label: PPC threshold → transudate → cardiogenic OAP
    source_lines: "265-267"
    section_path: "I. Généralités > C Physiopathologie > 1 Quelques rappels simples"
    disposition: represented
    kp: [KP-041]

  - id: seg-E
    label: Lesional OAP → exudate contrast
    source_lines: "268-270"
    section_path: "I. Généralités > C Physiopathologie > 1 Quelques rappels simples"
    disposition: represented
    kp: [KP-042]
`;

const CANONICAL_PPC_THRESHOLD = "**PPC > 25 mmHg**";

function canonicalMechanisms(text: string) {
  return text.replace(/\*\*PPC > \d+ mmHg\*\*/g, CANONICAL_PPC_THRESHOLD);
}

function canonicalBlueprint(text: string) {
  return text.replace(
    "visual_intent_removed: process-flow",
    "visual_intent: process-flow"
  );
}

const CHAPTER_PACKAGE_SLICE_FIXTURE = fs.readFileSync(
  path.join(CHAPTER, "build/oap-slice-chapter.package.fixture.yaml"),
  "utf8"
);
const CHAPTER_PACKAGE_FULL_FIXTURE = fs.readFileSync(
  path.join(CHAPTER, "build/full-chapter-chapter.package.fixture.yaml"),
  "utf8"
);

function resetChapterFixtures() {
  fs.writeFileSync(
    path.join(CHAPTER, "build/reconciliation.yaml"),
    RECONCILIATION_FIXTURE
  );
  fs.writeFileSync(path.join(CHAPTER, "chapter.package.yaml"), CHAPTER_PACKAGE_SLICE_FIXTURE);
  const bpPath = path.join(CHAPTER, "blueprint.md");
  const mechPath = path.join(
    CHAPTER,
    "projections/understanding/mechanisms.md"
  );
  // Preserve Phase-5 mechanisms content; only normalize OAP threshold + visual_intent.
  const normalizedBp = canonicalBlueprint(fs.readFileSync(bpPath, "utf8"));
  fs.writeFileSync(bpPath, normalizedBp);
  const normalizedMech = canonicalMechanisms(fs.readFileSync(mechPath, "utf8"));
  fs.writeFileSync(mechPath, normalizedMech);

  assert.match(normalizedMech, /\{#cb-oap-threshold\}/);
  assert.match(normalizedMech, /\{#cb-oap-bridge\}/);
  assert.match(normalizedMech, /\{#cb-oap-contrast\}/);
  assert.match(normalizedMech, /\*\*PPC > 25 mmHg\*\*/);

  return {
    mechanisms: normalizedMech,
    blueprint: normalizedBp,
    inventory: fs.readFileSync(path.join(CHAPTER, "inventory.yaml"), "utf8"),
    reconciliation: RECONCILIATION_FIXTURE,
    chapterPackage: CHAPTER_PACKAGE_SLICE_FIXTURE,
  };
}

describe("cardio/234 OAP slice regression", { concurrency: false }, () => {
  const BASELINE = resetChapterFixtures();

  const artifactPaths = {
    mechanisms: path.join(CHAPTER, "projections/understanding/mechanisms.md"),
    blueprint: path.join(CHAPTER, "blueprint.md"),
    inventory: path.join(CHAPTER, "inventory.yaml"),
    reconciliation: path.join(CHAPTER, "build/reconciliation.yaml"),
    chapterPackage: path.join(CHAPTER, "chapter.package.yaml"),
  };

  function restoreBaseline(name: keyof typeof artifactPaths) {
    if (name === "inventory") {
      fs.writeFileSync(artifactPaths.inventory, BASELINE.inventory);
      assert.doesNotMatch(
        fs.readFileSync(artifactPaths.inventory, "utf8"),
        /INEXISTANTE/
      );
      return;
    }
    if (name === "blueprint") {
      fs.writeFileSync(
        artifactPaths.blueprint,
        canonicalBlueprint(BASELINE.blueprint)
      );
      assert.match(
        fs.readFileSync(artifactPaths.blueprint, "utf8"),
        /visual_intent: process-flow/
      );
      return;
    }
    if (name === "mechanisms") {
      fs.writeFileSync(artifactPaths.mechanisms, BASELINE.mechanisms);
      const restored = fs.readFileSync(artifactPaths.mechanisms, "utf8");
      assert.doesNotMatch(restored, /\*\*PPC > 30 mmHg\*\*/);
      assert.match(restored, /\*\*PPC > 25 mmHg\*\*/);
      return;
    }
    if (name === "reconciliation") {
      fs.writeFileSync(artifactPaths.reconciliation, BASELINE.reconciliation);
      assert.match(
        fs.readFileSync(artifactPaths.reconciliation, "utf8"),
        /  - id: seg-D\n/
      );
      return;
    }
    if (name === "chapterPackage") {
      fs.writeFileSync(artifactPaths.chapterPackage, BASELINE.chapterPackage);
      assert.match(
        fs.readFileSync(artifactPaths.chapterPackage, "utf8"),
        /^mode: slice/m
      );
      return;
    }
    fs.writeFileSync(artifactPaths[name], BASELINE[name]);
  }

  function reconcileChapter(reconciliationPath = artifactPaths.reconciliation) {
    const inventory = loadYamlFile(artifactPaths.inventory);
    const invVal = validateInventory(inventory);
    return reconcile({
      reconciliationPath,
      inventoryKpIds: new Set(invVal.ids),
    });
  }

  function restoreAllBaselines() {
    restoreBaseline("reconciliation");
    restoreBaseline("chapterPackage");
    restoreBaseline("mechanisms");
    restoreBaseline("blueprint");
    restoreBaseline("inventory");
  }

  after(async () => {
    fs.writeFileSync(
      path.join(CHAPTER, "build/reconciliation.yaml"),
      fs.readFileSync(path.join(CHAPTER, "build/reconciliation-full-v3.yaml"), "utf8")
    );
    fs.writeFileSync(
      path.join(CHAPTER, "chapter.package.yaml"),
      CHAPTER_PACKAGE_FULL_FIXTURE
    );
    // Restore canonical full-chapter manifest after slice regression tests (Stage J).
    const result = await runTypedBuild(CHAPTER);
    assert.equal(result.ok, true, (result.errors || []).join("; "));
  });

  test("anchor validation — all slice KPs resolve in 2022 FIL B source", () => {
    const paths = pathsModule.chapterPaths(CHAPTER);
    const sourceMeta = loadYamlFile(paths.sourceMeta);
    sourceMeta._path = paths.sourceMeta;
    const inventory = loadYamlFile(paths.inventory);
    const { text } = pathsModule.loadSourceText(sourceMeta);
    const result = validateAllAnchors(text, inventory, sourceMeta);
    assert.equal(result.ok, true, result.errors.join("; "));
  });

  test("inventory — full chapter with frozen OAP slice KPs preserved", () => {
    const inventory = loadYamlFile(path.join(CHAPTER, "inventory.yaml"));
    const result = validateInventory(inventory);
    assert.equal(result.ok, true);
    assert.ok(inventory.kps.length > 3, "full-chapter inventory expected");
    assert.equal(inventory.inventory_scope, "full-chapter");
    for (const id of ["KP-040", "KP-041", "KP-042"]) {
      assert.equal(inventory.kps.filter((k) => k.id === id).length, 1);
    }
    assert.ok(!inventory.kps.some((k) => /^CAND-/.test(k.id)));
  });

  test("KP-041 anchor threshold is 25 mmHg", () => {
    const inventory = loadYamlFile(path.join(CHAPTER, "inventory.yaml"));
    const q = inventory.kps.find((k) => k.id === "KP-041").anchors[0].quote;
    assert.equal(extractThresholdFromQuote(q), 25);
  });

  test("claim-trace completeness", () => {
    const inventory = loadYamlFile(path.join(CHAPTER, "inventory.yaml"));
    const result = loadAllProjectionClaimsSync(CHAPTER, inventory);
    assert.equal(result.ok, true, result.errors.join("; "));
  });

  test("deterministic grounding PASS at >25 mmHg", () => {
    const inventory = loadYamlFile(path.join(CHAPTER, "inventory.yaml"));
    const sourceMeta = loadYamlFile(path.join(CHAPTER, "source.meta.yaml"));
    const claims = loadAllProjectionClaimsSync(CHAPTER, inventory);
    const result = groundDeterministic({
      projectionResults: claims.projectionResults,
      inventory,
      sourceMeta,
    });
    assert.equal(result.ok, true, result.errors.join("; "));
    assert.equal(result.verdicts["cb-oap-threshold"].status, "pass");
  });

  test("REQUIRED deliberate failure — >30 mmHg blocks grounding", () => {
    const mechPath = artifactPaths.mechanisms;
    const original = fs.readFileSync(mechPath, "utf8");
    const corrupted = original.replace(/> 25 mmHg/g, "> 30 mmHg");
    assert.notEqual(corrupted, original);
    fs.writeFileSync(mechPath, corrupted);
    try {
      const inventory = loadYamlFile(path.join(CHAPTER, "inventory.yaml"));
      const sourceMeta = loadYamlFile(path.join(CHAPTER, "source.meta.yaml"));
      const claims = loadAllProjectionClaimsSync(CHAPTER, inventory);
      const result = groundDeterministic({
        projectionResults: claims.projectionResults,
        inventory,
        sourceMeta,
      });
      assert.equal(result.ok, false);
      assert.equal(result.verdicts["cb-oap-threshold"].status, "fail");
      assert.equal(result.verdicts["cb-oap-threshold"].found_mmHg, 30);
    } finally {
      restoreBaseline("mechanisms");
    }
  });

  test("after restore — full build passes", async () => {
    restoreAllBaselines();
    const result = await runTypedBuild(CHAPTER);
    assert.equal(result.ok, true, (result.errors || []).join("; "));
    assert.ok(fs.existsSync(path.join(CHAPTER, "manifest.json")));
  });

  test("integration — real build path invalidates stale publication on >30 corruption", async () => {
    restoreAllBaselines();
    const paths = pathsModule.chapterPaths(CHAPTER);
    const mechPath = paths.mechanisms;
    const manifestPath = paths.manifest;
    const groundingPath = paths.grounding;
    const original = BASELINE.mechanisms;

    try {
      assert.match(original, /> 25 mmHg/);

      assert.ok(
        fs.existsSync(manifestPath),
        "publishable manifest should exist after successful build"
      );

      const corrupted = original.replace(/> 25 mmHg/g, "> 30 mmHg");
      assert.notEqual(corrupted, original);
      fs.writeFileSync(mechPath, corrupted);

      let result = await runTypedBuild(CHAPTER);
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
        /cb-oap-threshold:\n    mode: "deterministic"\n    rule: "threshold-mmHg"\n    status: "fail"/
      );
      assert.doesNotMatch(grounding, /^status: pass/m);

      fs.writeFileSync(mechPath, original);

      result = await runTypedBuild(CHAPTER);
      assert.equal(result.ok, true, (result.errors || []).join("; "));
      assert.ok(
        fs.existsSync(manifestPath),
        "manifest must be recreated after restore build"
      );

      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      assert.equal(manifest.slice_reconciliation_invariant, "pass");
    } finally {
      restoreAllBaselines();
    }
  });

  test("dangling KP-999 fails blueprint validation", () => {
    restoreBaseline("blueprint");
    const bpPath = artifactPaths.blueprint;
    const original = fs.readFileSync(bpPath, "utf8");
    const corrupted = original.replace("uses_kp: [KP-040]", "uses_kp: [KP-999]");
    assert.notEqual(corrupted, original);
    fs.writeFileSync(bpPath, corrupted);
    try {
      const inventory = loadYamlFile(path.join(CHAPTER, "inventory.yaml"));
      const invVal = validateInventory(inventory);
      const bp = parseBlueprint(bpPath, corrupted);
      const result = validateBlueprint(bp, new Set(invVal.ids));
      assert.equal(result.ok, false);
    } finally {
      restoreBaseline("blueprint");
    }
  });

  test("unresolved anchor quote fails validation", () => {
    restoreBaseline("inventory");
    const invPath = artifactPaths.inventory;
    const original = fs.readFileSync(invPath, "utf8");
    const corrupted = original.replace(
      "pression capillaire pulmonaire au-delà d’un certain seuil",
      "pression capillaire pulmonaire INEXISTANTE au-delà d’un certain seuil"
    );
    assert.notEqual(corrupted, original);
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
      restoreBaseline("inventory");
    }
  });

  test("missing claim-trace fails", () => {
    restoreBaseline("mechanisms");
    const mechPath = artifactPaths.mechanisms;
    const original = fs.readFileSync(mechPath, "utf8");
    const corrupted = original.replace(
      "<!-- claim-trace",
      "<!-- removed-claim-trace"
    );
    assert.notEqual(corrupted, original);
    fs.writeFileSync(mechPath, corrupted);
    try {
      const inventory = loadYamlFile(path.join(CHAPTER, "inventory.yaml"));
      const result = loadAllProjectionClaimsSync(CHAPTER, inventory);
      assert.equal(result.ok, false);
    } finally {
      restoreBaseline("mechanisms");
    }
  });

  // An Official Visual is optional pedagogical support, so a visual that cannot be produced is
  // reported and withheld — it never invalidates the Guided Walkthrough, which is the canonical
  // explanation (IMPLEMENTATION_CONTRACT.md C.6).
  test("missing visual_intent withholds the visual and still validates", async () => {
    restoreBaseline("blueprint");
    const bpPath = artifactPaths.blueprint;
    const original = fs.readFileSync(bpPath, "utf8");
    const corrupted = original.replace(
      "visual_intent: process-flow",
      "visual_intent_removed: process-flow"
    );
    assert.notEqual(corrupted, original);
    fs.writeFileSync(bpPath, corrupted);
    try {
      const result = await runTypedValidation(CHAPTER);
      assert.equal(result.ok, true);
      const withheld = result.steps.visuals.withheld;
      assert.equal(withheld.length, 1);
      assert.equal(withheld[0].elementId, "MEC-oap");
      assert.equal(withheld[0].state, "planned-not-built");
      assert.ok(withheld[0].reasons.length > 0);
      assert.equal(result.steps.visuals.rendered.length, 0);
    } finally {
      restoreBaseline("blueprint");
    }
  });

  // The failure must remain fully visible: reported, stale asset removed, traceability and
  // validation results preserved, and the walkthrough still published.
  test("an unrenderable Official Visual degrades the block instead of failing the build", async () => {
    restoreBaseline("blueprint");
    const bpPath = artifactPaths.blueprint;
    const original = fs.readFileSync(bpPath, "utf8");
    const corrupted = original.replace(
      "visual_intent: process-flow",
      "visual_intent: causal-graph"
    );
    assert.notEqual(corrupted, original);
    fs.writeFileSync(bpPath, corrupted);
    const figure = path.join(CHAPTER, "figures", "mec-oap.svg");
    try {
      fs.rmSync(figure, { force: true });
      const result = await runTypedBuild(CHAPTER);

      assert.equal(result.ok, true);
      assert.equal(fs.existsSync(figure), false);
      assert.equal(result.withheldVisuals.length, 1);
      assert.equal(result.withheldVisuals[0].elementId, "MEC-oap");
      assert.equal(result.withheldVisuals[0].state, "withheld");

      const availability = result.manifest!.official_visuals!.find(
        (v) => v.element === "MEC-oap"
      );
      assert.equal(availability!.state, "withheld");
      assert.ok(availability!.reasons!.length > 0);
      assert.equal(result.manifest!.visuals!.length, 0);

      // Traceability and grounding results survive the withheld visual.
      const chapterPaths = pathsModule.chapterPaths(CHAPTER);
      assert.equal(fs.existsSync(chapterPaths.traceability), true);
      assert.match(
        fs.readFileSync(chapterPaths.grounding, "utf8"),
        /^status: pass/m
      );
      const mechanisms = result.manifest!.projections!.find(
        (p) => p.type === "understanding.mechanisms"
      );
      assert.equal(mechanisms!.status, "published");
    } finally {
      restoreBaseline("blueprint");
    }
  });

  test("reconciliation missed segment fails", () => {
    restoreBaseline("reconciliation");
    const recPath = artifactPaths.reconciliation;
    const original = fs.readFileSync(recPath, "utf8");
    const corrupted = original.replace(
      /  - id: seg-D[\s\S]*?disposition: represented\n    kp: \[KP-041\]/,
      "  - id: seg-D\n    disposition: missed\n    kp: []"
    );
    assert.notEqual(corrupted, original);
    fs.writeFileSync(recPath, corrupted);
    try {
      const result = reconcileChapter(recPath);
      assert.equal(result.ok, false);
    } finally {
      restoreBaseline("reconciliation");
    }
  });

  test("reconciliation empty segments fails", () => {
    restoreBaseline("reconciliation");
    const recPath = artifactPaths.reconciliation;
    const original = fs.readFileSync(recPath, "utf8");
    const corrupted = original.replace(/^segments:[\s\S]*/m, "segments: []");
    assert.notEqual(corrupted, original);
    fs.writeFileSync(recPath, corrupted);
    try {
      const result = reconcileChapter(recPath);
      assert.equal(result.ok, false);
      assert.match(result.errors.join("; "), /segments list is empty/);
    } finally {
      restoreBaseline("reconciliation");
    }
  });

  test("reconciliation missing threshold segment fails", () => {
    restoreBaseline("reconciliation");
    const recPath = artifactPaths.reconciliation;
    const original = fs.readFileSync(recPath, "utf8");
    const corrupted = original.replace(
      /  - id: seg-D[\s\S]*?kp: \[KP-041\]\n/,
      ""
    );
    assert.notEqual(corrupted, original);
    fs.writeFileSync(recPath, corrupted);
    try {
      const result = reconcileChapter(recPath);
      assert.equal(result.ok, false);
      assert.match(result.errors.join("; "), /seg-D/);
    } finally {
      restoreBaseline("reconciliation");
    }
  });

  test("overview claim trace includes KP-042 for lesional/exudate contrast", () => {
    const inventory = loadYamlFile(path.join(CHAPTER, "inventory.yaml"));
    const result = loadAllProjectionClaimsSync(CHAPTER, inventory);
    assert.equal(result.ok, true);
    const overviewClaim = result.allClaims.find((c) => c.id === "cb-overview-oap");
    assert.ok(overviewClaim);
    assert.ok(overviewClaim.kp.includes("KP-042"));
  });

  test("manifest assembly uses projections.yaml registry", async () => {
    restoreAllBaselines();

    const result = await runTypedBuild(CHAPTER);
    assert.equal(result.ok, true, (result.errors || []).join("; "));
    const manifest = JSON.parse(
      fs.readFileSync(path.join(CHAPTER, "manifest.json"), "utf8")
    );
    assert.equal(manifest.projections.length, 4);
    assert.deepEqual(
      manifest.projections.map((p: { id: string }) => p.id),
      ["story", "overview", "mechanisms", "clinical-reasoning"]
    );
    assert.equal(manifest.visuals.length, 1);
    assert.equal(manifest.visuals[0].element, "MEC-oap");
    for (const projection of manifest.projections) {
      assert.ok(
        !Object.prototype.hasOwnProperty.call(projection, "label"),
        `projection ${projection.id} must not publish Reader label`
      );
    }
    assert.ok(
      !(manifest.known_absent || []).includes("actors"),
      "known_absent must not list Reader pseudo-view actors"
    );
    assert.ok(
      !(manifest.known_absent || []).includes("readiness"),
      "known_absent must not list Reader pseudo-view readiness"
    );
  });

  test("build 234 publishes cognitive priming artefact and manifest path (A6)", async () => {
    restoreAllBaselines();

    const result = await runTypedBuild(CHAPTER);
    assert.equal(result.ok, true, (result.errors || []).join("; "));

    const manifest = JSON.parse(
      fs.readFileSync(path.join(CHAPTER, "manifest.json"), "utf8")
    );
    assert.equal(manifest.cognitive_priming_path, "build/cognitive-priming.v1.json");

    const artifactPath = path.join(CHAPTER, "build/cognitive-priming.v1.json");
    assert.ok(fs.existsSync(artifactPath), "cognitive priming artefact must exist after build");

    const record = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    assert.equal(record.schema_version, 1);
    assert.equal(record.chapter_id, "cardio/234");
    assert.ok(Array.isArray(record.summary?.bullets) && record.summary.bullets.length > 0);
  });
});
