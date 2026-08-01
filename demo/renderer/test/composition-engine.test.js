// Reader Composition V1 — Lot B Composition Engine tests.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compose, composeAndValidate } from "../composition/composition-engine.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SPEC_PATH = path.join(ROOT, "composition", "corpus-composition-v1.json");
const FIXTURE_MANIFEST_PATH = path.join(
  HERE,
  "fixtures",
  "manifest-understanding-full.fixture.json"
);
const ACCEPTANCE_MANIFEST_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/manifest.json"
);

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadCorpusSpec() {
  return loadJson(SPEC_PATH);
}

describe("Lot B — compose()", () => {
  test("is deterministic for identical inputs", () => {
    const manifest = loadJson(FIXTURE_MANIFEST_PATH);
    const spec = loadCorpusSpec();
    const a = compose(manifest, spec);
    const b = compose(manifest, spec);
    assert.deepEqual(a, b);
  });

  test("passes Reading View Model validation without medical content", () => {
    const manifest = loadJson(FIXTURE_MANIFEST_PATH);
    const spec = loadCorpusSpec();
    const { validation } = composeAndValidate(manifest, spec);
    assert.equal(validation.ok, true, validation.errors.join("; "));
  });

  test("produces exactly 7 views ordered by displayOrder", () => {
    const manifest = loadJson(FIXTURE_MANIFEST_PATH);
    const spec = loadCorpusSpec();
    const { readingViewModel } = compose(manifest, spec);
    assert.equal(readingViewModel.views.length, 7);
    const orders = readingViewModel.views.map((v) => v.displayOrder);
    assert.deepEqual(orders, [1, 2, 3, 4, 5, 6, 7]);
  });

  test("mental-model aggregates story then overview blocks", () => {
    const manifest = loadJson(FIXTURE_MANIFEST_PATH);
    const spec = loadCorpusSpec();
    const { readingViewModel } = compose(manifest, spec);
    const mental = readingViewModel.views.find((v) => v.viewId === "mental-model");
    assert.ok(mental);
    assert.equal(mental.availability, "published");
    assert.deepEqual(
      mental.blocks.map((b) => ({
        elementId: b.elementId,
        sourceProjectionId: b.sourceProjectionId,
      })),
      [
        { elementId: "ANA-ville-pompe", sourceProjectionId: "story" },
        { elementId: "MM-pump-decompensation", sourceProjectionId: "story" },
        { elementId: "MM-pump-decompensation", sourceProjectionId: "overview" },
      ]
    );
  });

  test("cognitive-priming is planned with no blocks", () => {
    const manifest = loadJson(FIXTURE_MANIFEST_PATH);
    const spec = loadCorpusSpec();
    const { readingViewModel } = compose(manifest, spec);
    const view = readingViewModel.views.find((v) => v.viewId === "cognitive-priming");
    assert.equal(view.availability, "planned");
    assert.ok(!("blocks" in view));
  });

  test("notes is published shell without blocks", () => {
    const manifest = loadJson(FIXTURE_MANIFEST_PATH);
    const spec = loadCorpusSpec();
    const { readingViewModel } = compose(manifest, spec);
    const view = readingViewModel.views.find((v) => v.viewId === "notes");
    assert.equal(view.availability, "published");
    assert.ok(!("blocks" in view));
  });

  test("qcm lists published questions from manifest registry", () => {
    const manifest = loadJson(FIXTURE_MANIFEST_PATH);
    const spec = loadCorpusSpec();
    const { readingViewModel } = compose(manifest, spec);
    const view = readingViewModel.views.find((v) => v.viewId === "qcm");
    assert.equal(view.availability, "published");
    assert.equal(view.questions.length, 1);
    assert.equal(view.questions[0].questionId, "q-fixture-01");
    assert.equal(view.questions[0].path, "questions/q-fixture-01.yaml");
  });

  test("clinical-cases includes projection blocks and scenarios", () => {
    const manifest = loadJson(FIXTURE_MANIFEST_PATH);
    const spec = loadCorpusSpec();
    const { readingViewModel } = compose(manifest, spec);
    const view = readingViewModel.views.find((v) => v.viewId === "clinical-cases");
    assert.equal(view.availability, "published");
    assert.ok(view.blocks.length >= 1);
    assert.equal(view.scenarios.length, 1);
    assert.equal(view.scenarios[0].scenarioId, "sc-fixture-01");
  });

  test("college-official is planned when manifest has no renderable college path", () => {
    const manifest = loadJson(FIXTURE_MANIFEST_PATH);
    const spec = loadCorpusSpec();
    const { readingViewModel, diagnostics } = compose(manifest, spec);
    const view = readingViewModel.views.find((v) => v.viewId === "college-official");
    assert.equal(view.availability, "planned");
    assert.ok(view.collegeRef);
    assert.equal(view.collegeRef.ref, "source_edition");
    assert.equal(view.collegeRef.value, 2022);
    assert.ok(!view.collegeRef.path);
    assert.ok(
      diagnostics.some(
        (d) =>
          d.code === "view-without-resolved-source" &&
          d.context?.viewId === "college-official"
      )
    );
  });

  test("warns on published-projection-unconsumed", () => {
    const manifest = loadJson(FIXTURE_MANIFEST_PATH);
    const spec = loadCorpusSpec();
    const { diagnostics } = compose(manifest, spec);
    assert.ok(
      diagnostics.some(
        (d) =>
          d.code === "published-projection-unconsumed" &&
          d.context?.projectionId === "orphan-projection"
      )
    );
  });

  test("rejects invalid spec with incompatible-spec-version", () => {
    const manifest = loadJson(FIXTURE_MANIFEST_PATH);
    const badSpec = { version: "9.9", views: [] };
    const { diagnostics, readingViewModel } = compose(manifest, badSpec);
    assert.ok(diagnostics.some((d) => d.code === "incompatible-spec-version"));
    assert.equal(readingViewModel.views.length, 0);
  });

  test("diagnoses missing projection ref", () => {
    const manifest = loadJson(FIXTURE_MANIFEST_PATH);
    const spec = structuredClone(loadCorpusSpec());
    const notions = spec.views.find((v) => v.viewId === "notions");
    notions.sources[0].ref = "missing-projection";
    const { diagnostics, readingViewModel } = compose(manifest, spec);
    assert.ok(
      diagnostics.some(
        (d) =>
          d.code === "identity-referenced-but-absent" &&
          d.context?.projectionId === "missing-projection"
      )
    );
    const view = readingViewModel.views.find((v) => v.viewId === "notions");
    assert.equal(view.availability, "planned");
  });

  test("blocks contain only identity refs — no medical content fields", () => {
    const manifest = loadJson(FIXTURE_MANIFEST_PATH);
    const spec = loadCorpusSpec();
    const { readingViewModel } = compose(manifest, spec);
    const json = JSON.stringify(readingViewModel);
    assert.ok(!json.includes("officialContent"));
    assert.ok(!json.includes("walkthrough"));
    for (const view of readingViewModel.views) {
      if (!view.blocks) continue;
      for (const block of view.blocks) {
        assert.deepEqual(Object.keys(block).sort(), [
          "artifactRef",
          "elementId",
          "pedagogicalOrder",
          "sourceProjectionId",
        ]);
      }
    }
  });
});

describe("Lot B — acceptance fixture cardio/234", () => {
  test("compose against published manifest fixture validates", () => {
    const manifest = loadJson(ACCEPTANCE_MANIFEST_PATH);
    const spec = loadCorpusSpec();
    const { readingViewModel, validation, diagnostics } = composeAndValidate(
      manifest,
      spec
    );
    assert.equal(validation.ok, true, validation.errors.join("; "));
    assert.equal(readingViewModel.views.length, 7);
    assert.equal(readingViewModel.chapter.id, "cardio/234");

    const notions = readingViewModel.views.find((v) => v.viewId === "notions");
    assert.equal(notions.blocks.length, 11);

    const qcm = readingViewModel.views.find((v) => v.viewId === "qcm");
    assert.equal(qcm.availability, "published");
    assert.equal(
      qcm.questions.length,
      manifest.questions.filter((q) => q.status === "published").length
    );

    const cas = readingViewModel.views.find((v) => v.viewId === "clinical-cases");
    assert.equal(cas.scenarios.length, 3);

    const college = readingViewModel.views.find((v) => v.viewId === "college-official");
    assert.equal(college.availability, "published");
    assert.ok(college.collegeRef.path);

    assert.ok(
      !diagnostics.some((d) => d.code === "published-projection-unconsumed"),
      "all published projections should be consumed"
    );
  });
});
