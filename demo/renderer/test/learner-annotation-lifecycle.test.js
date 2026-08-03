// Learner annotation lifecycle — creation → persistence → restore → orphan honesty (PAS couche apprenante).
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
const STORY_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/projections/understanding/story.md"
);
const SVG_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/figures/mm-pump-decompensation.svg"
);

const NOTIONS_ELEMENT = "MEC-output-basics";
const NOTIONS_PHRASE = "débit adapté aux besoins";
const MM_ELEMENT = "MM-pump-decompensation";
const MM_PHRASE = "débit adapté aux besoins";

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

function orphanCount(content) {
  return content.querySelectorAll(".learner-orphan-annotation").length;
}

function setReleaseContext(window) {
  window.LouLearnerStore.setReleaseContext({
    releaseId: RELEASE_ID,
    chapter: CHAPTER,
  });
}

function createHighlightInWalkthrough(window, walkthrough, projection, element, phrase) {
  const TH = window.LouTextHighlights;
  const pos = walkthrough.textContent.indexOf(phrase);
  assert.ok(pos >= 0, "phrase must exist: " + phrase);
  const range = TH._rangeFromTextOffsets(walkthrough, pos, pos + phrase.length);
  assert.ok(range, "range must resolve");
  const selector = TH.selectorFromRange(walkthrough, range);
  assert.ok(selector?.exact, "selector must resolve");
  const mark = TH.wrapRangeInMark(range.cloneRange());
  assert.ok(mark, "mark must wrap");
  return { selector, mark };
}

describe("Learner annotation lifecycle — composition path", () => {
  let dom;
  let window;
  let manifest;
  let notionsView;
  let mentalView;
  let mechanismsText;
  let storyText;
  let svgText;

  before(() => {
    mechanismsText = fs.readFileSync(MECHANISMS_PATH, "utf8");
    storyText = fs.readFileSync(STORY_PATH, "utf8");
    svgText = fs.readFileSync(SVG_PATH, "utf8");
    manifest = loadJson(MANIFEST_PATH);
    const spec = loadJson(SPEC_PATH);
    const { readingViewModel } = compose(manifest, spec);
    notionsView = readingViewModel.views.find((v) => v.viewId === "notions");
    mentalView = readingViewModel.views.find((v) => v.viewId === "mental-model");
  });

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
      url: "https://example.test/demo/renderer/",
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
    setReleaseContext(window);

    window.fetch = async function (url) {
      const href = String(url);
      if (href.includes("mechanisms.md")) {
        return { ok: true, text: async () => mechanismsText };
      }
      if (href.includes("story.md")) {
        return { ok: true, text: async () => storyText };
      }
      if (href.includes("mm-pump-decompensation.svg")) {
        return { ok: true, text: async () => svgText };
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

  async function renderMentalModel() {
    await window.LouRenderer.renderComposedView(
      mentalView,
      manifest,
      CHAPTER,
      window.LouConfig
    );
    return window.document.getElementById("content");
  }

  function notionsWalkthrough(content) {
    const block = content.querySelector(
      '[data-element="' +
        NOTIONS_ELEMENT +
        '"][data-source-projection="mechanisms"]'
    );
    return block && block.querySelector(".block-walkthrough");
  }

  function mentalWalkthrough(content) {
    const block = content.querySelector(
      '[data-element="' + MM_ELEMENT + '"][data-source-projection="story"]'
    );
    return block && block.querySelector(".block-walkthrough");
  }

  test("highlight create → mountLearnerLayers restore — no false orphan", async () => {
    const content = await renderNotions();
    const wt = notionsWalkthrough(content);
    assert.ok(wt);

    const { selector } = createHighlightInWalkthrough(
      window,
      wt,
      "mechanisms",
      NOTIONS_ELEMENT,
      NOTIONS_PHRASE
    );
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      NOTIONS_ELEMENT,
      selector
    );

    const context = window.LouRenderer.createViewRenderContext(
      notionsView,
      manifest,
      CHAPTER,
      window.LouConfig
    );
    await window.LouRenderer.mountLearnerLayers(content, context);

    assert.equal(orphanCount(content), 0);
    assert.equal(
      wt.querySelectorAll("mark.learner-highlight").length,
      1,
      "highlight must remain visible"
    );
  });

  test("highlight create → full reload → restore — no orphan", async () => {
    let content = await renderNotions();
    const wt = notionsWalkthrough(content);
    const { selector } = createHighlightInWalkthrough(
      window,
      wt,
      "mechanisms",
      NOTIONS_ELEMENT,
      NOTIONS_PHRASE
    );
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      NOTIONS_ELEMENT,
      selector
    );

    content = await renderNotions();
    const wt2 = notionsWalkthrough(content);
    assert.equal(orphanCount(content), 0);
    assert.equal(wt2.querySelectorAll("mark.learner-highlight").length, 1);
  });

  test("note inline create → mountLearnerLayers restore — no false orphan", async () => {
    const content = await renderNotions();
    const wt = notionsWalkthrough(content);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      wt,
      wt.firstChild,
      0
    );
    assert.ok(anchor);

    const id = await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      NOTIONS_ELEMENT,
      anchor,
      "Note fraîche"
    );

    const noteEl = window.document.createElement("span");
    noteEl.className = "walkthrough-note";
    noteEl.dataset.learner = "true";
    noteEl.setAttribute("data-note-id", String(id));
    noteEl.textContent = "Note fraîche";
    const range = window.LouCaretAnchor.restoreCaretAnchor(wt, anchor);
    assert.ok(range);
    range.insertNode(noteEl);

    const context = window.LouRenderer.createViewRenderContext(
      notionsView,
      manifest,
      CHAPTER,
      window.LouConfig
    );
    await window.LouRenderer.mountLearnerLayers(content, context);

    assert.equal(orphanCount(content), 0);
    assert.equal(wt.querySelectorAll(".walkthrough-note").length, 1);
  });

  test("note inline survives reload without orphan panel", async () => {
    let content = await renderNotions();
    const wt = notionsWalkthrough(content);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      wt,
      wt.firstChild,
      0
    );
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      NOTIONS_ELEMENT,
      anchor,
      "Note persistée"
    );

    content = await renderNotions();
    assert.equal(orphanCount(content), 0);
    const note = notionsWalkthrough(content).querySelector(".walkthrough-note");
    assert.ok(note);
    assert.equal(note.textContent, "Note persistée");
  });

  test("missing element → legitimate orphan highlight", async () => {
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MISSING-ELEMENT",
      {
        type: "TextQuoteSelector",
        exact: "ghost phrase",
        prefix: "",
        suffix: "",
      }
    );

    const content = await renderNotions();
    assert.equal(orphanCount(content), 1);
    const orphan = content.querySelector(
      '.learner-orphan-annotation[data-orphan-kind="highlight"]'
    );
    assert.ok(orphan);
    assert.match(orphan.textContent, /ghost phrase/);
  });

  test("missing element → legitimate orphan note", async () => {
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      "MISSING-ELEMENT",
      {
        type: "CaretAnchor",
        offset: 0,
        prefix: "",
        suffix: "",
      },
      "Orphan note text"
    );

    const content = await renderNotions();
    assert.equal(orphanCount(content), 1);
    assert.match(
      content.querySelector(".learner-orphan-annotation").textContent,
      /Orphan note text/
    );
  });

  test("mental-model story highlight — no false orphan after mount", async () => {
    const content = await renderMentalModel();
    const wt = mentalWalkthrough(content);
    assert.ok(wt, "MM walkthrough must exist");

    const { selector } = createHighlightInWalkthrough(
      window,
      wt,
      "story",
      MM_ELEMENT,
      MM_PHRASE
    );
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      MM_ELEMENT,
      selector
    );

    const renderBlocks = window.LouRenderer.mentalModelRenderBlocks(
      mentalView,
      manifest
    );
    const renderView = Object.assign({}, mentalView, { blocks: renderBlocks });
    const context = window.LouRenderer.createViewRenderContext(
      renderView,
      manifest,
      CHAPTER,
      window.LouConfig
    );
    await window.LouRenderer.mountLearnerLayers(content, context);

    assert.equal(orphanCount(content), 0);
    assert.equal(wt.querySelectorAll("mark.learner-highlight").length, 1);
  });

  test("restoreAll is idempotent — double mountLearnerLayers", async () => {
    let content = await renderNotions();
    const wt = notionsWalkthrough(content);
    const { selector } = createHighlightInWalkthrough(
      window,
      wt,
      "mechanisms",
      NOTIONS_ELEMENT,
      NOTIONS_PHRASE
    );
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      NOTIONS_ELEMENT,
      selector
    );

    content = await renderNotions();
    const context = window.LouRenderer.createViewRenderContext(
      notionsView,
      manifest,
      CHAPTER,
      window.LouConfig
    );
    await window.LouRenderer.mountLearnerLayers(content, context);
    await window.LouRenderer.mountLearnerLayers(content, context);

    assert.equal(orphanCount(content), 0);
    assert.equal(
      notionsWalkthrough(content).querySelectorAll("mark.learner-highlight")
        .length,
      1
    );
  });

  test("legacy overview projection patrimony does not false-orphan on MM (story-only DOM)", async () => {
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "overview",
      MM_ELEMENT,
      {
        type: "TextQuoteSelector",
        exact: "legacy overview only",
        prefix: "",
        suffix: "",
      }
    );

    const content = await renderMentalModel();
    const orphans = content.querySelectorAll(
      '.learner-orphan-annotation[data-orphan-kind="highlight"]'
    );
    assert.equal(
      orphans.length,
      0,
      "overview patrimony must not restore against story-only DOM"
    );
  });
});
