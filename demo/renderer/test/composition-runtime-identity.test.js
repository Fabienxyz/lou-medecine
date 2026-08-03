// Lot D.1 — Composition V1 runtime identity (sourceProjectionId + elementId).
import { test, describe, before, beforeEach } from "node:test";
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
const SPEC_PATH = path.join(ROOT, "composition", "corpus-composition-v1.json");
const ELEMENT = "MM-pump-decompensation";

const STORY_MD = `---
type: understanding.story
---

## Story block {#${ELEMENT}}

Story-specific walkthrough text for projection story.
`;

const OVERVIEW_MD = `---
type: understanding.overview
---

## Overview block {#${ELEMENT}}

Overview-specific walkthrough text for projection overview.
`;

const CLINICAL_MD = `---
type: understanding.clinical-reasoning
---

## Clinical reasoning {#CR-recognize}

Dyspnée d'effort progressive.
`;

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

function manifestFixture() {
  return {
    chapter: CHAPTER,
    projections: [
      {
        id: "story",
        type: "understanding.story",
        path: "projections/understanding/story.md",
        status: "published",
        elements: [ELEMENT],
      },
      {
        id: "clinical-reasoning",
        type: "understanding.clinical-reasoning",
        path: "projections/understanding/clinical-reasoning.md",
        status: "published",
        elements: ["CR-recognize"],
      },
    ],
    scenarios: [
      {
        scenario_id: "sc-234-standard-01",
        kind: "standard",
        path: "scenarios/sc-234-standard-01.yaml",
        status: "published",
      },
      {
        scenario_id: "sc-234-trap-01",
        kind: "trap",
        path: "scenarios/sc-234-trap-01.yaml",
        status: "published",
      },
    ],
    official_visuals: [
      { element: ELEMENT, state: "planned-not-built", intent: "causal-graph" },
    ],
  };
}

function loadCorpusSpec() {
  return JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
}

function textNodeAt(window, walkthrough, phrase) {
  let found = null;
  window.LouCaretAnchor._walkOfficialTextNodes(
    walkthrough,
    function (node, start, len) {
      if (found) {
        return;
      }
      const text = node.textContent || "";
      const idx = text.indexOf(phrase);
      if (idx >= 0) {
        found = { node, offset: idx };
      }
    }
  );
  return found;
}

function makeDualBlockHost(document, storyText, overviewText) {
  const host = document.createElement("div");
  host.innerHTML =
    '<section class="pedagogical-block" data-element="' +
    ELEMENT +
    '" data-source-projection="story">' +
    '<div class="block-walkthrough" data-official="true">' +
    storyText +
    "</div></section>" +
    '<section class="pedagogical-block" data-element="' +
    ELEMENT +
    '" data-source-projection="overview">' +
    '<div class="block-walkthrough" data-official="true">' +
    overviewText +
    "</div></section>";
  return host;
}

describe("Lot D.1 — Composition runtime identity", () => {
  let dom;
  let window;
  let manifest;
  let mentalView;
  let clinicalView;
  let compositionContext;

  before(() => {
    dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    window.indexedDB = new IDBFactory();
    window.requestAnimationFrame = (cb) => {
      cb();
      return 0;
    };
    loadScripts(dom, [
      "node_modules/marked/marked.min.js",
      "config.js",
      "markdown.js",
      "learner-patrimony.js",
      "learner-store.js",
      "caret-anchor.js",
      "annotation-colors.js",
      "annotation-color-palette.js",
      "text-highlights.js",
      "inline-notes.js",
      "svg-loader.js",
      "inline-formatting.js",
      "blocks.js",
      "renderer.js",
    ]);
  });

  beforeEach(() => {
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    window.LouTextHighlights._boundHost = null;
    window.LouInlineNotes._boundHost = null;
    manifest = manifestFixture();
    const spec = loadCorpusSpec();
    const { readingViewModel } = compose(manifest, spec);
    mentalView = readingViewModel.views.find((v) => v.viewId === "mental-model");
    clinicalView = readingViewModel.views.find(
      (v) => v.viewId === "clinical-cases"
    );
    window.LouRenderer.init(window.document.getElementById("content"), null);
    compositionContext = window.LouRenderer.createViewRenderContext(
      mentalView,
      manifest,
      CHAPTER,
      window.LouConfig
    );
  });

  test("projectionIdForElement resolves with sourceProjectionId", () => {
    assert.equal(
      compositionContext.projectionIdForElement(ELEMENT, "story"),
      "story"
    );
  });

  test("projectionIdForElement resolves unambiguously when single projection owns element", () => {
    assert.equal(compositionContext.projectionIdForElement(ELEMENT), "story");
  });

  test("projectionIdForElement fails explicitly for unknown pair", () => {
    const warnings = [];
    const original = console.warn;
    console.warn = function (message) {
      warnings.push(String(message));
    };
    try {
      assert.equal(
        compositionContext.projectionIdForElement(ELEMENT, "mechanisms"),
        null
      );
      assert.ok(
        warnings.some((w) => w.includes("lookup failed")),
        "expected lookup failed diagnostic"
      );
    } finally {
      console.warn = original;
    }
  });

  test("highlight restore targets scoped block by projection", async () => {
    const host = makeDualBlockHost(
      window.document,
      "Story-specific walkthrough text for projection story.",
      "Overview-specific walkthrough text for projection overview."
    );
    const storyWalkthrough = host.querySelector(
      '[data-source-projection="story"] .block-walkthrough'
    );
    const range = window.document.createRange();
    const point = textNodeAt(window, storyWalkthrough, "Story-specific");
    assert.ok(point);
    range.setStart(point.node, point.offset);
    range.setEnd(point.node, point.offset + 5);
    const selector = window.LouTextHighlights.selectorFromRange(
      storyWalkthrough,
      range
    );
    assert.ok(selector);

    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      ELEMENT,
      selector
    );

    await window.LouTextHighlights.restore(host, {
      chapter: CHAPTER,
      projection: { id: "story" },
      store: window.LouLearnerStore,
      view: mentalView,
    });

    const storyMarks = host.querySelectorAll(
      '[data-source-projection="story"] .learner-highlight'
    );
    const overviewMarks = host.querySelectorAll(
      '[data-source-projection="overview"] .learner-highlight'
    );
    assert.equal(storyMarks.length, 1);
    assert.equal(overviewMarks.length, 0);
  });

  test("note restore targets scoped block by projection", async () => {
    const host = makeDualBlockHost(
      window.document,
      "Story-specific walkthrough text for projection story.",
      "Overview-specific walkthrough text for projection overview."
    );
    const overviewWalkthrough = host.querySelector(
      '[data-source-projection="overview"] .block-walkthrough'
    );
    assert.ok(overviewWalkthrough);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      overviewWalkthrough,
      overviewWalkthrough.firstChild,
      5
    );
    assert.ok(anchor);

    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "overview",
      ELEMENT,
      anchor,
      "Scoped overview note"
    );

    await window.LouInlineNotes.restore(host, {
      chapter: CHAPTER,
      projection: { id: "overview" },
      store: window.LouLearnerStore,
      view: mentalView,
    });

    const overviewNote = host.querySelector(
      '[data-source-projection="overview"] .walkthrough-note[data-note-id]'
    );
    const storyNote = host.querySelector(
      '[data-source-projection="story"] .walkthrough-note[data-note-id]'
    );
    assert.ok(overviewNote);
    assert.equal(overviewNote.textContent, "Scoped overview note");
    assert.equal(storyNote, null);
  });

  test("clinical-cases scenarios render in content zone", async () => {
    window.fetch = async function (url) {
      const href = String(url);
      if (href.includes("clinical-reasoning.md")) {
        return {
          ok: true,
          text: async () => CLINICAL_MD,
        };
      }
      return { ok: false, status: 404 };
    };

    await window.LouRenderer.renderComposedView(
      clinicalView,
      manifest,
      CHAPTER,
      window.LouConfig
    );

    const content = window.document.getElementById("content");
    const scenarios = content.querySelector(".view-scenarios-shell");
    assert.ok(scenarios);
    assert.equal(content.querySelector(".footer-nav"), null);
    assert.equal(
      content.querySelectorAll(".view-scenarios-list li").length,
      clinicalView.scenarios.length
    );
  });
});
