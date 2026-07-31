// Lot D — navigation expectations from Reading View Model (pre/post Renderer branch).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compose } from "../composition/composition-engine.js";
import { buildNavigationFromViewModel } from "../composition/navigation.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SPEC_PATH = path.join(ROOT, "composition", "corpus-composition-v1.json");
const MANIFEST_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/manifest.json"
);

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

describe("Lot D — navigation from compose()", () => {
  const manifest = loadJson(MANIFEST_PATH);
  const spec = loadJson(SPEC_PATH);
  const { readingViewModel } = compose(manifest, spec);
  const tabs = buildNavigationFromViewModel(readingViewModel);

  test("exactly 7 views in navigation", () => {
    assert.equal(tabs.length, 7);
    assert.equal(readingViewModel.views.length, 7);
  });

  test("displayOrder 1 through 7 matches Composition Specification labels", () => {
    assert.deepEqual(
      tabs.map((t) => t.label),
      [
        "Amorçage cognitif",
        "Modèle mental",
        "Notions",
        "Cas cliniques",
        "Collège officiel",
        "QCM",
        "Notes",
      ]
    );
    assert.deepEqual(
      tabs.map((t) => t.displayOrder),
      [1, 2, 3, 4, 5, 6, 7]
    );
  });

  test("mental-model aggregates story + overview blocks", () => {
    const view = readingViewModel.views.find((v) => v.viewId === "mental-model");
    assert.equal(view.availability, "published");
    const sources = view.blocks.map((b) => b.sourceProjectionId);
    assert.ok(sources.includes("story"));
    assert.ok(sources.includes("overview"));
    const storyIdx = sources.indexOf("story");
    const overviewIdx = sources.lastIndexOf("overview");
    assert.ok(storyIdx < overviewIdx);
  });

  test("notions displays mechanisms projection only", () => {
    const view = readingViewModel.views.find((v) => v.viewId === "notions");
    assert.equal(view.availability, "published");
    assert.ok(view.blocks.length > 0);
    assert.ok(
      view.blocks.every((b) => b.sourceProjectionId === "mechanisms")
    );
  });

  test("clinical-cases includes clinical-reasoning blocks and scenarios registry", () => {
    const view = readingViewModel.views.find((v) => v.viewId === "clinical-cases");
    assert.equal(view.availability, "published");
    assert.ok(view.blocks.every((b) => b.sourceProjectionId === "clinical-reasoning"));
    assert.equal(view.scenarios.length, 3);
    assert.ok(view.scenarios.every((s) => s.path && s.scenarioId));
  });

  test("qcm uses questions registry from manifest", () => {
    const view = readingViewModel.views.find((v) => v.viewId === "qcm");
    assert.equal(view.availability, "published");
    assert.equal(
      view.questions.length,
      manifest.questions.filter((q) => q.status === "published").length
    );
    assert.ok(view.questions.every((q) => q.questionId && q.path));
  });

  test("notes is published learner shell without blocks", () => {
    const view = readingViewModel.views.find((v) => v.viewId === "notes");
    assert.equal(view.availability, "published");
    assert.ok(!("blocks" in view));
    assert.ok(!("questions" in view));
  });

  test("cognitive-priming and college-official respect planned availability", () => {
    const amorçage = readingViewModel.views.find(
      (v) => v.viewId === "cognitive-priming"
    );
    const college = readingViewModel.views.find(
      (v) => v.viewId === "college-official"
    );
    assert.equal(amorçage.availability, "planned");
    assert.equal(college.availability, "planned");
    assert.equal(tabs.find((t) => t.viewId === "cognitive-priming").availability, "planned");
    assert.equal(tabs.find((t) => t.viewId === "college-official").availability, "planned");
  });

  test("navigation carries view entries without composition logic", () => {
    for (const tab of tabs) {
      assert.ok(tab.viewId);
      assert.ok(tab.view);
      assert.equal(tab.view.viewId, tab.viewId);
      assert.ok(!("projection" in tab));
      assert.ok(!("path" in tab));
    }
  });
});
