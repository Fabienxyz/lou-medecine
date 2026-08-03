// Orphan decision pipeline — trace + invariants (PAS couche apprenante).
import { test, describe, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";
import { compose } from "../composition/composition-engine.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const CHAPTER = "cardio/234";
const RELEASE_ID = "cardio__234__2022__1";
const SPEC_PATH = path.join(ROOT, "composition", "corpus-composition-v1.json");
const MANIFEST_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/manifest.json"
);
const MECHANISMS_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/projections/understanding/mechanisms.md"
);

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

describe("LouLearnerOrphanDecision — trace and invariants", () => {
  let dom;
  let window;
  let manifest;
  let notionsView;
  let mechanismsText;

  beforeEach(() => {
    mechanismsText = fs.readFileSync(MECHANISMS_PATH, "utf8");
    manifest = loadJson(MANIFEST_PATH);
    const spec = loadJson(SPEC_PATH);
    const { readingViewModel } = compose(manifest, spec);
    notionsView = readingViewModel.views.find((v) => v.viewId === "notions");

    dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
      url: "https://example.test/demo/renderer/?learnerTrace=1",
      runScripts: "outside-only",
    });
    window = dom.window;
    globalThis.window = window;
    globalThis.document = window.document;
    globalThis.Node = window.Node;
    globalThis.URL = window.URL;
    globalThis.requestAnimationFrame = (cb) => {
      cb();
      return 0;
    };
    window.indexedDB = new IDBFactory();

    loadScripts(window, [
      "node_modules/marked/marked.min.js",
      "config.js",
      "markdown.js",
      "learner-patrimony.js",
      "learner-store.js",
      "learner-orphan-decision.js",
      "text-highlights.js",
      "caret-anchor.js",
      "inline-notes.js",
      "blocks.js",
      "renderer.js",
    ]);

    window.LouRenderer.init(window.document.getElementById("content"), null);
    window.LouLearnerStore.setReleaseContext({
      releaseId: RELEASE_ID,
      chapter: CHAPTER,
    });
    window.LouLearnerOrphanDecision.resetTraceLog();
    window.LouLearnerOrphanDecision._forceTrace = true;

    window.fetch = async function (url) {
      if (String(url).includes("mechanisms.md")) {
        return { ok: true, text: async () => mechanismsText };
      }
      return { ok: false, status: 404 };
    };
  });

  async function renderNotions() {
    await window.LouRenderer.renderComposedView(
      notionsView,
      manifest,
      CHAPTER,
      window.LouConfig
    );
    return window.document.getElementById("content");
  }

  test("trace records restored decision with reason when mark already in DOM", async () => {
    const content = await renderNotions();
    const wt = content.querySelector(
      '[data-element="MEC-output-basics"][data-source-projection="mechanisms"] .block-walkthrough'
    );
    const phrase = "débit adapté aux besoins";
    const pos = wt.textContent.indexOf(phrase);
    const range = window.LouTextHighlights._rangeFromTextOffsets(
      wt,
      pos,
      pos + phrase.length
    );
    const selector = window.LouTextHighlights.selectorFromRange(wt, range);
    window.LouTextHighlights.wrapRangeInMark(range.cloneRange());
    const id = await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-output-basics",
      selector
    );

    window.LouLearnerOrphanDecision.resetTraceLog();
    await window.LouTextHighlights.restore(content, {
      chapter: CHAPTER,
      projection: { id: "mechanisms" },
      store: window.LouLearnerStore,
      view: notionsView,
      manifest,
      config: window.LouConfig,
      renderer: window.LouRenderer,
    });

    const traces = window.LouLearnerOrphanDecision.getTraceLog();
    assert.equal(traces.length, 1);
    assert.equal(traces[0].annotationId, id);
    assert.equal(traces[0].decision, "restored");
    assert.equal(traces[0].reason, "already_satisfied_in_dom");
    assert.equal(traces[0].alreadyPresent, true);
    assert.equal(content.querySelectorAll(".learner-orphan-annotation").length, 0);
  });

  test("stale orphan row cleared when annotation becomes satisfiable (invariant B)", async () => {
    const content = await renderNotions();
    const wt = content.querySelector(
      '[data-element="MEC-output-basics"][data-source-projection="mechanisms"] .block-walkthrough'
    );
    const phrase = "débit adapté aux besoins";
    const pos = wt.textContent.indexOf(phrase);
    const range = window.LouTextHighlights._rangeFromTextOffsets(
      wt,
      pos,
      pos + phrase.length
    );
    const selector = window.LouTextHighlights.selectorFromRange(wt, range);
    const id = await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-output-basics",
      selector
    );

    window.LouBlocks.appendAnnotationOrphans(content, [
      { kind: "highlight", record: { id, element: "MEC-output-basics", selector } },
    ]);
    assert.equal(content.querySelectorAll(".learner-orphan-annotation").length, 1);

    window.LouTextHighlights.wrapRangeInMark(range.cloneRange());

    const context = window.LouRenderer.createViewRenderContext(
      notionsView,
      manifest,
      CHAPTER,
      window.LouConfig
    );
    window.LouLearnerOrphanDecision.beginRestoreCycle(content);
    await window.LouRenderer.mountLearnerLayers(content, context);

    assert.equal(content.querySelectorAll(".learner-orphan-annotation").length, 0);
    assert.equal(wt.querySelectorAll("mark.learner-highlight").length, 1);
  });

  test("legitimate orphan remains after restore (invariant C)", async () => {
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MISSING-ELEMENT",
      {
        type: "TextQuoteSelector",
        exact: "irrecoverable phrase",
        prefix: "",
        suffix: "",
      }
    );

    const content = await renderNotions();
    assert.equal(content.querySelectorAll(".learner-orphan-annotation").length, 1);

    const traces = window.LouLearnerOrphanDecision.getTraceLog();
    const orphanTrace = traces.find((t) => t.decision === "orphan");
    assert.ok(orphanTrace);
    assert.equal(orphanTrace.reason, "block_not_found");
  });

  test("filterOrphans drops satisfied entries — no phantom rows (invariant E)", async () => {
    const content = await renderNotions();
    const wt = content.querySelector(
      '[data-element="MEC-output-basics"][data-source-projection="mechanisms"] .block-walkthrough'
    );
    const phrase = "volume d'éjection systolique";
    const pos = wt.textContent.indexOf(phrase);
    const range = window.LouTextHighlights._rangeFromTextOffsets(
      wt,
      pos,
      pos + phrase.length
    );
    const selector = window.LouTextHighlights.selectorFromRange(wt, range);
    window.LouTextHighlights.wrapRangeInMark(range.cloneRange());
    const record = {
      id: 99,
      element: "MEC-output-basics",
      projection: "mechanisms",
      selector,
    };

    const filtered = window.LouLearnerOrphanDecision.filterOrphans(
      content,
      [{ kind: "highlight", record }],
      window.LouTextHighlights,
      window.LouInlineNotes
    );
    assert.equal(filtered.length, 0);
  });

  test("appendAnnotationOrphans dedupes by annotation id (invariant D)", async () => {
    const content = await renderNotions();
    const record = {
      id: 42,
      element: "MISSING",
      selector: { exact: "x", prefix: "", suffix: "" },
    };
    const batch = [{ kind: "highlight", record }];
    window.LouBlocks.appendAnnotationOrphans(content, batch);
    window.LouBlocks.appendAnnotationOrphans(content, batch);
    assert.equal(
      content.querySelectorAll('.learner-orphan-annotation[data-orphan-id="42"]')
        .length,
      1
    );
  });
});
