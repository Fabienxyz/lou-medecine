// Walkthrough Notes create integration (Renderer V2.2 commit 5).
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

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

describe("Walkthrough Notes — create (commit 5)", () => {
  let dom;
  let window;
  let context;
  let storyContext;

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
      "learner-patrimony.js",
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
    window.LouInlineNotes._boundHost = null;
    window.LouInlineNotes._activeEditNote = null;
    window.LouInlineNotes._committing = false;
    window.LouInlineNotes._hideContextMenu();

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
    storyContext = {
      ...context,
      projection: manifest.projections[1],
    };
  });

  async function renderMechanisms(ctx = context) {
    const md = window.LouRenderer.prepareLearnerMarkdown(MECHANISMS_MD);
    const html = window.LouMarkdown.parse(md);
    await window.LouRenderer.renderProjection(html, ctx);
    return window.document.getElementById("content");
  }

  function mockCaretRangeFromPoint(range) {
    window.document.caretRangeFromPoint = () => range;
  }

  async function openCreateMenu(content, elementId, globalOffset) {
    const walkthrough = content.querySelector(
      '[data-element="' + elementId + '"] .block-walkthrough'
    );
    assert.ok(walkthrough);
    const point = textNodeAt(window, walkthrough, globalOffset);
    assert.ok(point, "text node at offset " + globalOffset);
    const range = window.LouCaretAnchor._caretRangeFromOffset(
      walkthrough,
      globalOffset
    );
    assert.ok(range);
    mockCaretRangeFromPoint(range);

    const target = point.node.parentElement || point.node;
    target.dispatchEvent(
      new window.MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 120,
        clientY: 80,
      })
    );

    const menu = window.document.querySelector(".inline-notes-context-menu");
    assert.ok(menu, "context menu visible");
    assert.equal(menu.hidden, false);
    const button = menu.querySelector("button");
    assert.ok(button);
    assert.equal(button.textContent, "Add note");
    return { walkthrough, menu, button, range };
  }

  async function createPendingNote(content, elementId = "MEC-oap", offset = 12) {
    const { button } = await openCreateMenu(content, elementId, offset);
    button.click();
    await flushPromises();
    const note = content.querySelector(
      '[data-element="' + elementId + '"] .walkthrough-note:not([data-note-id])'
    );
    return note;
  }

  async function blurNote(note) {
    await window.LouInlineNotes._commitOnBlur(note);
  }

  test("WT-10 create → blur without text removes span and leaves store empty", async () => {
    const content = await renderMechanisms();
    const note = await createPendingNote(content);
    assert.ok(note);
    assert.equal(note.contentEditable, "true");
    await blurNote(note);
    assert.equal(
      content.querySelector('[data-element="MEC-oap"] .walkthrough-note'),
      null
    );
    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 0);
  });

  test("WT-11 create → type → blur persists record with data-note-id", async () => {
    const content = await renderMechanisms();
    const note = await createPendingNote(content);
    note.textContent = "My learner note";
    await blurNote(note);
    const persisted = content.querySelector(
      '[data-element="MEC-oap"] .walkthrough-note[data-note-id]'
    );
    assert.ok(persisted);
    assert.equal(persisted.textContent, "My learner note");
    assert.equal(persisted.contentEditable, "false");
    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].text, "My learner note");
  });

  test("WT-12 addWalkthroughNote rejection rolls back DOM", async () => {
    const content = await renderMechanisms();
    const note = await createPendingNote(content);
    note.textContent = "Will fail";
    const original = window.LouLearnerStore.addWalkthroughNote;
    window.LouLearnerStore.addWalkthroughNote = () =>
      Promise.reject(new Error("idb fail"));
    try {
      await blurNote(note);
      assert.equal(
        content.querySelector('[data-element="MEC-oap"] .walkthrough-note'),
        null
      );
      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows.length, 0);
    } finally {
      window.LouLearnerStore.addWalkthroughNote = original;
    }
  });

  test("WT-17 block source-projection scopes new note to DOM projection", async () => {
    const content = await renderMechanisms();
    window.LouInlineNotes.bind(content, storyContext);
    const note = await createPendingNote(content);
    note.textContent = "Mechanisms scoped";
    await blurNote(note);
    const storyRows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "story"
    );
    const mechRows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(storyRows.length, 0);
    assert.equal(mechRows.length, 1);
    assert.equal(mechRows[0].text, "Mechanisms scoped");
  });

  test("WT-CR-01 contextmenu on official text shows Add note menu", async () => {
    const content = await renderMechanisms();
    await openCreateMenu(content, "MEC-oap", 10);
  });

  test("WT-CR-02 contextmenu inside existing note shows no menu", async () => {
    const content = await renderMechanisms();
    const note = await createPendingNote(content);
    note.textContent = "Existing";
    const walkthrough = content.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    note.dispatchEvent(
      new window.MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 50,
        clientY: 50,
      })
    );
    const menu = window.document.querySelector(".inline-notes-context-menu");
    assert.ok(!menu || menu.hidden);
  });

  test("WT-CR-03 contextmenu outside walkthrough shows no menu", async () => {
    const content = await renderMechanisms();
    content.dispatchEvent(
      new window.MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 10,
        clientY: 10,
      })
    );
    const menu = window.document.querySelector(".inline-notes-context-menu");
    assert.ok(!menu || menu.hidden);
  });

  test("WT-CR-04 Add note enters contenteditable with focus", async () => {
    const content = await renderMechanisms();
    const note = await createPendingNote(content);
    assert.equal(note.contentEditable, "true");
    assert.equal(window.LouInlineNotes._activeEditNote, note);
  });

  test("WT-CR-05 create inside learner-highlight keeps highlight intact", async () => {
    const content = await renderMechanisms();
    const walkthrough = content.querySelector(
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

    const reloaded = await renderMechanisms();
    const wt = reloaded.querySelector(
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
    mockCaretRangeFromPoint(
      window.LouCaretAnchor._caretRangeFromOffset(wt, anchor.offset)
    );
    mark.dispatchEvent(
      new window.MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 100,
      })
    );
    const menu = window.document.querySelector(".inline-notes-context-menu");
    assert.ok(menu && !menu.hidden);
    menu.querySelector("button").click();
    await flushPromises();

    const note = wt.querySelector(".walkthrough-note:not([data-note-id])");
    assert.ok(note);
    assert.ok(wt.querySelector("mark.learner-highlight"));
  });

  test("WT-CR-06 blur with text → reload → restore round-trip", async () => {
    const content = await renderMechanisms();
    const note = await createPendingNote(content);
    note.textContent = "Round trip";
    await blurNote(note);
    const reloaded = await renderMechanisms();
    const restored = reloaded.querySelector(
      '[data-element="MEC-oap"] .walkthrough-note[data-note-id]'
    );
    assert.ok(restored);
    assert.equal(restored.textContent, "Round trip");
  });

  test("WT-CR-07 official stream unchanged after create and persist", async () => {
    const content = await renderMechanisms();
    const walkthrough = content.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    const before = window.LouCaretAnchor._officialStreamText(walkthrough);
    const note = await createPendingNote(content);
    note.textContent = "Excluded from stream";
    await blurNote(note);
    const after = window.LouCaretAnchor._officialStreamText(walkthrough);
    assert.equal(before, after);
  });

  test("WT-CR-08 second create while editing commits first note", async () => {
    const content = await renderMechanisms();
    const first = await createPendingNote(content, "MEC-oap", 8);
    first.textContent = "First note";
    await openCreateMenu(content, "MEC-oap", 30);
    const menu = window.document.querySelector(".inline-notes-context-menu");
    menu.querySelector("button").click();
    for (let attempt = 0; attempt < 50; attempt++) {
      await flushPromises();
      await window.LouInlineNotes._waitForCommitIdle();
      const committed = content.querySelectorAll(
        '[data-element="MEC-oap"] .walkthrough-note[data-note-id]'
      );
      const pending = content.querySelector(
        '[data-element="MEC-oap"] .walkthrough-note:not([data-note-id])'
      );
      if (committed.length === 1 && pending) {
        break;
      }
    }

    const notes = content.querySelectorAll(
      '[data-element="MEC-oap"] .walkthrough-note[data-note-id]'
    );
    assert.equal(notes.length, 1);
    assert.equal(notes[0].textContent, "First note");
    const pending = content.querySelector(
      '[data-element="MEC-oap"] .walkthrough-note:not([data-note-id])'
    );
    assert.ok(pending);
    assert.equal(pending.contentEditable, "true");
  });

  test("WT-CR-09 Escape triggers blur and empty discard", async () => {
    const content = await renderMechanisms();
    const note = await createPendingNote(content);
    assert.ok(typeof note._inlineNotesKeydown === "function");
    note._inlineNotesKeydown({ key: "Escape" });
    await blurNote(note);
    assert.equal(
      content.querySelector('[data-element="MEC-oap"] .walkthrough-note'),
      null
    );
  });

  test("WT-CR-10 mount restore failure still binds create listeners", async () => {
    const content = await renderMechanisms();
    const original = window.LouLearnerStore.listWalkthroughNotes;
    window.LouLearnerStore.listWalkthroughNotes = () =>
      Promise.reject(new Error("restore fail"));

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
      await openCreateMenu(content, "MEC-oap", 14);
    } finally {
      window.LouLearnerStore.listWalkthroughNotes = original;
      console.warn = originalWarn;
    }
  });

  test("WT-CR-11 restore ignores pending notes without data-note-id", async () => {
    const content = await renderMechanisms();
    const note = await createPendingNote(content);
    note.textContent = "Still pending";
    await window.LouInlineNotes.restore(content, context);
    const pending = content.querySelectorAll(
      '[data-element="MEC-oap"] .walkthrough-note:not([data-note-id])'
    );
    assert.equal(pending.length, 1);
    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 0);
  });

  test("WT-CR-12 pending anchor entry removed after empty blur", async () => {
    const content = await renderMechanisms();
    const note = await createPendingNote(content);
    assert.equal(window.LouInlineNotes._pendingAnchors.has(note), true);
    await blurNote(note);
    assert.equal(window.LouInlineNotes._pendingAnchors.has(note), false);
  });

  test("WT-CR-13 re-render mid-edit abandons pending without store write", async () => {
    const content = await renderMechanisms();
    const note = await createPendingNote(content);
    note.textContent = "Partial draft";
    assert.equal(window.LouInlineNotes._activeEditNote, note);

    await renderMechanisms();

    assert.equal(
      window.document.querySelector('[data-element="MEC-oap"] .walkthrough-note'),
      null
    );
    assert.equal(window.LouInlineNotes._activeEditNote, null);
    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 0);
  });

  test("WT-CR-14 Add note waits for in-flight IndexedDB commit before second pending", async () => {
    const content = await renderMechanisms();
    const first = await createPendingNote(content, "MEC-oap", 8);
    first.textContent = "First note";

    let releaseStore;
    const storeGate = new Promise((resolve) => {
      releaseStore = resolve;
    });
    const original = window.LouLearnerStore.addWalkthroughNote;
    window.LouLearnerStore.addWalkthroughNote = function (...args) {
      return storeGate.then(() => original.apply(this, args));
    };

    try {
      const commitPromise = window.LouInlineNotes._commitOnBlur(first);
      await flushPromises();
      assert.equal(window.LouInlineNotes._committing, true);

      const createPromise = (async () => {
        await openCreateMenu(content, "MEC-oap", 30);
        const menu = window.document.querySelector(".inline-notes-context-menu");
        menu.querySelector("button").click();
        await flushPromises();
      })();

      await flushPromises();
      assert.equal(
        content.querySelectorAll(
          '[data-element="MEC-oap"] .walkthrough-note:not([data-note-id])'
        ).length,
        1
      );

      releaseStore();
      await commitPromise;
      await createPromise;
      await flushPromises();

      assert.equal(
        content.querySelectorAll(
          '[data-element="MEC-oap"] .walkthrough-note[data-note-id]'
        ).length,
        1
      );
      assert.equal(
        content.querySelectorAll(
          '[data-element="MEC-oap"] .walkthrough-note:not([data-note-id])'
        ).length,
        1
      );
      assert.equal(
        content.querySelector(
          '[data-element="MEC-oap"] .walkthrough-note[data-note-id]'
        ).textContent,
        "First note"
      );
    } finally {
      window.LouLearnerStore.addWalkthroughNote = original;
    }
  });

  test("WT-CR-15 mount hides context menu and clears pending menu context", async () => {
    const content = await renderMechanisms();
    await openCreateMenu(content, "MEC-oap", 10);
    assert.notEqual(window.LouInlineNotes._pendingMenuContext, null);

    await renderMechanisms();

    const menu = window.document.querySelector(".inline-notes-context-menu");
    assert.ok(!menu || menu.hidden);
    assert.equal(window.LouInlineNotes._pendingMenuContext, null);
  });
});
