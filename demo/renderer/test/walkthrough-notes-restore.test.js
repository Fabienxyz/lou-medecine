// Walkthrough Notes restore integration (Renderer V2.2 commit 4).
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const CHAPTER = "cardio/234";

const MECHANISMS_MD = `---
type: understanding.mechanisms
---

# Pourquoi ? — mécanismes causaux

Intro qui n'appartient à aucun bloc.

## Pourquoi la congestion pulmonaire apparaît-elle ? {#MEC-congestion}

La pression de remplissage gauche remonte. {#cb-mec-cong-steps}

---

## Comment la congestion mène-t-elle à l'OAP ? {#MEC-oap}

Transmission aux capillaires pulmonaires. {#cb-oap-bridge} Au-delà du seuil, transsudat. {#cb-oap-threshold}

## Pourquoi le corps aide-t-il puis aggrave-t-il ? {#MEC-compensation}

Les compensations achètent du temps. {#cb-mec-comp-steps}
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
        id: "mechanisms",
        type: "understanding.mechanisms",
        path: "projections/understanding/mechanisms.md",
        status: "published",
        elements: ["MEC-congestion", "MEC-oap", "MEC-compensation"],
        visuals: { "MEC-oap": "figures/mec-oap.svg" },
      },
      {
        id: "story",
        type: "understanding.story",
        path: "projections/understanding/story.md",
        status: "published",
        elements: ["MM-pump-decompensation"],
      },
    ],
    visuals: [
      {
        id: "mec-oap",
        element: "MEC-oap",
        path: "figures/mec-oap.svg",
        alt: "Congestion pulmonaire",
      },
    ],
    official_visuals: [
      { element: "MEC-oap", state: "published" },
      { element: "MEC-compensation", state: "withheld", reasons: ["x"] },
    ],
  };
}

function textNodeAt(window, walkthrough, globalOffset) {
  let found = null;
  window.LouCaretAnchor._walkOfficialTextNodes(
    walkthrough,
    function (node, start, len) {
      if (found) {
        return;
      }
      if (globalOffset >= start && globalOffset <= start + len) {
        found = { node, offset: globalOffset - start };
      }
    }
  );
  return found;
}

describe("Walkthrough Notes — restore (commit 4)", () => {
  let dom;
  let window;
  let context;

  before(() => {
    dom = new JSDOM(
      `<!DOCTYPE html><body><div id="content"></div></body>`,
      { url: "https://example.test/demo/renderer/", runScripts: "outside-only" }
    );
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
      "learner-store.js",
      "caret-anchor.js",
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
    const manifest = manifestFixture();
    window.LouRenderer.init(window.document.getElementById("content"), null);
    context = {
      projection: manifest.projections[0],
      manifest,
      chapter: CHAPTER,
      config: window.LouConfig,
      renderer: window.LouRenderer,
      store: window.LouLearnerStore,
    };
  });

  async function renderMechanisms() {
    const md = window.LouRenderer.prepareLearnerMarkdown(MECHANISMS_MD);
    const html = window.LouMarkdown.parse(md);
    await window.LouRenderer.renderProjection(html, context);
    return window.document.getElementById("content");
  }

  async function seedNote(element, text, globalOffset) {
    const content = await renderMechanisms();
    const walkthrough = content.querySelector(
      '[data-element="' + element + '"] .block-walkthrough'
    );
    const point = textNodeAt(window, walkthrough, globalOffset);
    assert.ok(point, "text node at offset " + globalOffset);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      point.node,
      point.offset
    );
    assert.ok(anchor);
    const id = await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      element,
      anchor,
      text
    );
    return { id, anchor, walkthrough };
  }

  test("WT-06 simple restore after renderProjection", async () => {
    await seedNote("MEC-oap", "Note simple", 12);
    const content = await renderMechanisms();
    const note = content.querySelector(
      '[data-element="MEC-oap"] .walkthrough-note[data-note-id]'
    );
    assert.ok(note);
    assert.equal(note.textContent, "Note simple");
    assert.equal(note.dataset.learner, "true");
    assert.equal(note.className, "walkthrough-note");
  });

  test("WT-07 restore note inside restored highlight", async () => {
    await renderMechanisms();
    const walkthrough = window.document.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    const full = walkthrough.textContent;
    const exact = "Au-delà du seuil";
    const pos = full.indexOf(exact);
    assert.ok(pos >= 0);

    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      {
        type: "TextQuoteSelector",
        exact,
        prefix: full.slice(Math.max(0, pos - 32), pos),
        suffix: full.slice(pos + exact.length, pos + exact.length + 32),
      }
    );

    const content = await renderMechanisms();
    const wt = content.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    const mark = wt.querySelector("mark.learner-highlight");
    assert.ok(mark);

    const anchor = window.LouCaretAnchor.createCaretAnchor(
      wt,
      mark.firstChild,
      2
    );
    assert.ok(anchor);
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      anchor,
      "Inside highlight"
    );

    const restored = await renderMechanisms();
    const note = restored.querySelector(
      '[data-element="MEC-oap"] .walkthrough-note'
    );
    assert.ok(note);
    assert.equal(note.textContent, "Inside highlight");
    assert.ok(restored.querySelector("mark.learner-highlight"));
  });

  test("WT-08 multiple notes in same walkthrough", async () => {
    await seedNote("MEC-oap", "First note", 5);
    await seedNote("MEC-oap", "Second note", 40);
    const content = await renderMechanisms();
    const notes = content.querySelectorAll(
      '[data-element="MEC-oap"] .walkthrough-note'
    );
    assert.equal(notes.length, 2);
    const texts = [...notes].map((n) => n.textContent).sort();
    assert.deepEqual(texts, ["First note", "Second note"]);
  });

  test("WT-09 double mount does not duplicate notes", async () => {
    await seedNote("MEC-oap", "Once only", 8);
    const content = await renderMechanisms();
    await window.LouInlineNotes.mount(content, context);
    await window.LouInlineNotes.mount(content, context);
    const notes = content.querySelectorAll(
      '[data-element="MEC-oap"] .walkthrough-note'
    );
    assert.equal(notes.length, 1);
  });

  test("WT-16 projection filtering — story note invisible on mechanisms", async () => {
    await renderMechanisms();
    const walkthrough = window.document.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    const point = textNodeAt(window, walkthrough, 10);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      point.node,
      point.offset
    );
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "story",
      "MEC-oap",
      anchor,
      "Story projection only"
    );

    const content = await renderMechanisms();
    assert.equal(content.querySelectorAll(".walkthrough-note").length, 0);
  });

  test("WT-INV-1 official text stream unchanged after restore", async () => {
    await seedNote("MEC-oap", "Stream check", 15);
    const content = await renderMechanisms();
    const walkthrough = content.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    const streamBefore = window.LouCaretAnchor._officialStreamText(walkthrough);
    await window.LouInlineNotes.restore(content, context);
    const streamAfter = window.LouCaretAnchor._officialStreamText(walkthrough);
    assert.equal(streamBefore, streamAfter);
    assert.ok(walkthrough.querySelector(".walkthrough-note"));
  });

  test("WT-INV-2 invalid anchor skipped silently — walkthrough intact", async () => {
    await renderMechanisms();
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      {
        type: "CaretAnchor",
        offset: 0,
        prefix: "___no-match___",
        suffix: "___no-match___",
      },
      "Should not appear"
    );
    const content = await renderMechanisms();
    assert.equal(
      content.querySelector('[data-element="MEC-oap"] .walkthrough-note'),
      null
    );
    assert.ok(
      content.querySelector('[data-element="MEC-oap"] .block-walkthrough')
        .textContent.length > 0
    );
  });

  test("WT-INV-3 empty text record skipped via _restoreRecord", async () => {
    await renderMechanisms();
    const content = window.document.getElementById("content");
    const walkthrough = content.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    window.LouInlineNotes._restoreRecord(content, {
      id: 99,
      element: "MEC-oap",
      text: "   ",
      anchor: { type: "CaretAnchor", offset: 0, prefix: "", suffix: "" },
    });
    assert.equal(walkthrough.querySelector('[data-note-id="99"]'), null);
  });

  test("WT-INV-4 missing block skipped silently", async () => {
    await renderMechanisms();
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      "MISSING-ELEMENT",
      { type: "CaretAnchor", offset: 0, prefix: "", suffix: "" },
      "Orphan note"
    );
    const content = await renderMechanisms();
    assert.equal(content.querySelectorAll(".walkthrough-note").length, 0);
  });

  test("WT-15 highlights and notes coexist after reload", async () => {
    await renderMechanisms();
    const walkthrough = window.document.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    const full = walkthrough.textContent;
    const exact = "transsudat";
    const pos = full.indexOf(exact);
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      {
        type: "TextQuoteSelector",
        exact,
        prefix: full.slice(Math.max(0, pos - 32), pos),
        suffix: full.slice(pos + exact.length, pos + exact.length + 32),
      }
    );
    const point = textNodeAt(window, walkthrough, 3);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      point.node,
      point.offset
    );
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      anchor,
      "Coexist"
    );

    const content = await renderMechanisms();
    assert.ok(
      content.querySelector('[data-element="MEC-oap"] mark.learner-highlight')
    );
    assert.ok(
      content.querySelector('[data-element="MEC-oap"] .walkthrough-note')
    );
    assert.equal(
      content.querySelector('[data-element="MEC-oap"] .walkthrough-note')
        .textContent,
      "Coexist"
    );
  });

  test("mount warns once on global restore failure without throwing", async () => {
    await seedNote("MEC-oap", "Warn test", 6);
    const content = await renderMechanisms();
    const original = window.LouLearnerStore.listWalkthroughNotes;
    window.LouLearnerStore.listWalkthroughNotes = () =>
      Promise.reject(new Error("idb unavailable"));

    let warned = false;
    const originalWarn = console.warn;
    console.warn = function (message) {
      if (String(message).includes("[LouInlineNotes]")) {
        warned = true;
      }
      originalWarn.apply(console, arguments);
    };

    try {
      await window.LouInlineNotes.mount(content, context);
      assert.equal(warned, true);
    } finally {
      window.LouLearnerStore.listWalkthroughNotes = original;
      console.warn = originalWarn;
    }
  });
});
