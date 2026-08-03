/**
 * Unit-level storage and lifecycle checks (JSDOM).
 * Browser automation cannot verify IndexedDB schema or cross-chapter isolation alone.
 */
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "../..");
const CHAPTER = "cardio/234";

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

describe("V2.1 smoke — learner storage (unit)", () => {
  let window;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    loadScripts(dom, [
      "node_modules/marked/marked.min.js",
      "config.js",
      "markdown.js",
      "learner-patrimony.js",
      "learner-store.js",
      "annotation-colors.js",
      "annotation-color-palette.js",
      "text-highlights.js",
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
  });

  test("ST-U01 empty IndexedDB returns no highlights", async () => {
    const rows = await window.LouLearnerStore.listTextHighlights(
      CHAPTER,
      "mechanisms"
    );
    assert.deepEqual(rows, []);
  });

  test("ST-U02 highlights persist per projection in same chapter", async () => {
    const selector = {
      type: "TextQuoteSelector",
      exact: "test phrase",
      prefix: "",
      suffix: "",
    };
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      "MM-pump-decompensation",
      selector
    );
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-output-basics",
      selector
    );
    const story = await window.LouLearnerStore.listTextHighlights(
      CHAPTER,
      "story"
    );
    const mech = await window.LouLearnerStore.listTextHighlights(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(story.length, 1);
    assert.equal(mech.length, 1);
    assert.equal(story[0].projection, "story");
    assert.equal(mech[0].projection, "mechanisms");
  });

  test("ST-U03 highlights isolated by chapter id", async () => {
    const selector = {
      type: "TextQuoteSelector",
      exact: "isolated",
      prefix: "",
      suffix: "",
    };
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-output-basics",
      selector
    );
    await window.LouLearnerStore.addTextHighlight(
      "cardio/999",
      "mechanisms",
      "MEC-output-basics",
      selector
    );
    const rows = await window.LouLearnerStore.listTextHighlights(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].chapter, CHAPTER);
  });

  test("ST-U04 stored record preserves TextQuoteSelector shape", async () => {
    const selector = {
      type: "TextQuoteSelector",
      exact: "Au-delà du seuil",
      prefix: "abc",
      suffix: "def",
    };
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      selector
    );
    const rows = await window.LouLearnerStore.listTextHighlights(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows[0].selector.type, "TextQuoteSelector");
    assert.equal(rows[0].selector.exact, "Au-delà du seuil");
    assert.equal(rows[0].kind, "highlight");
  });

  test("ST-U05 bindSelection skips rebinding same host", () => {
    const host = window.document.getElementById("content");
    window.LouTextHighlights.bindSelection(host, {});
    const first = window.LouTextHighlights._boundHost;
    window.LouTextHighlights.bindSelection(host, {});
    assert.equal(window.LouTextHighlights._boundHost, first);
  });
});

describe("walkthrough_notes store (unit)", () => {
  let window;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    loadScripts(dom, ["learner-patrimony.js", "learner-store.js"]);
  });

  beforeEach(() => {
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
  });

  const sampleAnchor = {
    type: "CaretAnchor",
    offset: 42,
    prefix: "before",
    suffix: "after",
  };

  test("ST-01 addWalkthroughNote + listWalkthroughNotes filters chapter/projection", async () => {
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "story",
      "MM-pump-decompensation",
      sampleAnchor,
      "Note story"
    );
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      sampleAnchor,
      "Note mechanisms"
    );
    await window.LouLearnerStore.addWalkthroughNote(
      "cardio/999",
      "mechanisms",
      "MEC-oap",
      sampleAnchor,
      "Note other chapter"
    );

    const story = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "story"
    );
    const mech = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );

    assert.equal(story.length, 1);
    assert.equal(mech.length, 1);
    assert.equal(story[0].projection, "story");
    assert.equal(story[0].chapter, CHAPTER);
    assert.equal(story[0].element, "MM-pump-decompensation");
    assert.equal(story[0].text, "Note story");
    assert.equal(mech[0].projection, "mechanisms");
    assert.equal(mech[0].text, "Note mechanisms");
  });

  test("ST-02 updateWalkthroughNote sets updated", async () => {
    const id = await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      sampleAnchor,
      "Original"
    );
    const before = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    const created = before[0].created;
    assert.ok(created);
    assert.equal(before[0].updated, undefined);

    await window.LouLearnerStore.updateWalkthroughNote(id, "Revised text");

    const after = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(after[0].text, "Revised text");
    assert.equal(after[0].created, created);
    assert.ok(after[0].updated);
    assert.match(after[0].updated, /^\d{4}-\d{2}-\d{2}T/);
  });

  test("ST-03 deleteWalkthroughNote", async () => {
    const id = await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      sampleAnchor,
      "To delete"
    );
    await window.LouLearnerStore.deleteWalkthroughNote(id);

    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.deepEqual(rows, []);
  });
});
