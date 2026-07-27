// Walkthrough Notes edit/delete integration (Renderer V2.2 commit 6).
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

describe("Walkthrough Notes — edit/delete (commit 6)", () => {
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
    window.LouInlineNotes._mountGeneration = 0;
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
  });

  async function renderMechanisms() {
    const md = window.LouRenderer.prepareLearnerMarkdown(MECHANISMS_MD);
    const html = window.LouMarkdown.parse(md);
    await window.LouRenderer.renderProjection(html, context);
    return window.document.getElementById("content");
  }

  async function seedPersistedNote(
    text = "Seed note",
    element = "MEC-oap",
    offset = 12
  ) {
    await renderMechanisms();
    const walkthrough = window.document.querySelector(
      '[data-element="' + element + '"] .block-walkthrough'
    );
    const point = textNodeAt(window, walkthrough, offset);
    assert.ok(point, "text node at offset " + offset);
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
    const content = await renderMechanisms();
    const note = content.querySelector('[data-note-id="' + id + '"]');
    assert.ok(note);
    return { id, note, content, element };
  }

  async function dblclickNote(note) {
    note.dispatchEvent(
      new window.MouseEvent("dblclick", {
        bubbles: true,
        cancelable: true,
      })
    );
    await flushPromises();
    await window.LouInlineNotes._waitForCommitIdle();
  }

  async function blurNote(note) {
    note.dispatchEvent(new window.FocusEvent("blur", { bubbles: false }));
    await flushPromises();
    await window.LouInlineNotes._waitForCommitIdle();
  }

  async function escapeNote(note) {
    note.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true })
    );
    note.dispatchEvent(new window.FocusEvent("blur", { bubbles: false }));
    await flushPromises();
    await window.LouInlineNotes._waitForCommitIdle();
  }

  function countStoreCalls(methodName) {
    let calls = 0;
    const original = window.LouLearnerStore[methodName];
    window.LouLearnerStore[methodName] = function (...args) {
      calls += 1;
      return original.apply(this, args);
    };
    return {
      get calls() {
        return calls;
      },
      restore() {
        window.LouLearnerStore[methodName] = original;
      },
    };
  }

  function gateStoreMethod(methodName) {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    const original = window.LouLearnerStore[methodName];
    window.LouLearnerStore[methodName] = function (...args) {
      return gate.then(() => original.apply(this, args));
    };
    return {
      release: () => release(),
      restore: () => {
        window.LouLearnerStore[methodName] = original;
      },
      get pending() {
        return gate;
      },
    };
  }

  function mockCaretRangeFromPoint(range) {
    window.document.caretRangeFromPoint = () => range;
  }

  async function openCreateMenu(content, elementId, globalOffset) {
    const walkthrough = content.querySelector(
      '[data-element="' + elementId + '"] .block-walkthrough'
    );
    const range = window.LouCaretAnchor._caretRangeFromOffset(
      walkthrough,
      globalOffset
    );
    mockCaretRangeFromPoint(range);
    const point = textNodeAt(window, walkthrough, globalOffset);
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
    assert.ok(menu && !menu.hidden);
    return menu;
  }

  async function createPendingNote(content, elementId = "MEC-oap", offset = 12) {
    const menu = await openCreateMenu(content, elementId, offset);
    menu.querySelector("button").click();
    await flushPromises();
    await window.LouInlineNotes._waitForCommitIdle();
    return content.querySelector(
      '[data-element="' + elementId + '"] .walkthrough-note:not([data-note-id])'
    );
  }

  async function openDeleteMenu(note) {
    note.dispatchEvent(
      new window.MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: 50,
        clientY: 50,
      })
    );
    const menu = window.document.querySelector(".inline-notes-context-menu");
    assert.ok(menu && !menu.hidden);
    return menu;
  }

  async function seedSecondNote(text, element, offset) {
    await renderMechanisms();
    const walkthrough = window.document.querySelector(
      '[data-element="' + element + '"] .block-walkthrough'
    );
    const point = textNodeAt(window, walkthrough, offset);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      point.node,
      point.offset
    );
    const id = await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      element,
      anchor,
      text
    );
    return id;
  }

  test("WT-18 dblclick on persisted note enters edit mode", async () => {
    const { note } = await seedPersistedNote();
    await dblclickNote(note);
    assert.equal(note.contentEditable, "true");
    assert.equal(window.LouInlineNotes._activeEditNote, note);
  });

  test("WT-19 dblclick edit blur persists update", async () => {
    const { id, note, content } = await seedPersistedNote("Original");
    await dblclickNote(note);
    note.textContent = "Revised text";
    await blurNote(note);
    assert.equal(note.contentEditable, "false");
    assert.equal(note.textContent, "Revised text");
    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, id);
    assert.equal(rows[0].text, "Revised text");
    assert.equal(
      content.querySelectorAll('[data-element="MEC-oap"] .walkthrough-note').length,
      1
    );
  });

  test("WT-20 dblclick edit blur without change skips store write", async () => {
    const { id, note } = await seedPersistedNote("Unchanged");
    let updateCalls = 0;
    const original = window.LouLearnerStore.updateWalkthroughNote;
    window.LouLearnerStore.updateWalkthroughNote = function (...args) {
      updateCalls += 1;
      return original.apply(this, args);
    };
    try {
      await dblclickNote(note);
      await blurNote(note);
      assert.equal(updateCalls, 0);
      assert.equal(note.contentEditable, "false");
      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows[0].text, "Unchanged");
      assert.equal(rows[0].id, id);
    } finally {
      window.LouLearnerStore.updateWalkthroughNote = original;
    }
  });

  test("WT-21 dblclick edit empty blur deletes note", async () => {
    const { id, note, content } = await seedPersistedNote("To delete");
    await dblclickNote(note);
    note.textContent = "";
    await blurNote(note);
    assert.equal(content.querySelector('[data-note-id="' + id + '"]'), null);
    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 0);
  });

  test("WT-22 updateWalkthroughNote rejection rolls back DOM", async () => {
    const { id, note } = await seedPersistedNote("Keep me");
    await dblclickNote(note);
    note.textContent = "Rejected";
    const original = window.LouLearnerStore.updateWalkthroughNote;
    window.LouLearnerStore.updateWalkthroughNote = () =>
      Promise.reject(new Error("idb fail"));
    try {
      await blurNote(note);
      assert.equal(note.textContent, "Keep me");
      assert.equal(note.getAttribute("data-note-id"), String(id));
      assert.equal(note.contentEditable, "false");
      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows[0].text, "Keep me");
    } finally {
      window.LouLearnerStore.updateWalkthroughNote = original;
    }
  });

  test("WT-23 deleteWalkthroughNote rejection on empty blur keeps span", async () => {
    const { id, note, content } = await seedPersistedNote("Still here");
    await dblclickNote(note);
    note.textContent = "";
    const original = window.LouLearnerStore.deleteWalkthroughNote;
    window.LouLearnerStore.deleteWalkthroughNote = () =>
      Promise.reject(new Error("idb fail"));
    try {
      await blurNote(note);
      assert.ok(content.querySelector('[data-note-id="' + id + '"]'));
      assert.equal(note.textContent, "Still here");
      assert.equal(note.contentEditable, "false");
      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows.length, 1);
    } finally {
      window.LouLearnerStore.deleteWalkthroughNote = original;
    }
  });

  test("WT-24 dblclick note A then note B serializes first commit", async () => {
    const first = await seedPersistedNote("Note A", "MEC-oap", 8);
    const secondId = await seedSecondNote("Note B", "MEC-oap", 30);
    const content = await renderMechanisms();
    const noteA = content.querySelector('[data-note-id="' + first.id + '"]');
    const noteB = content.querySelector('[data-note-id="' + secondId + '"]');
    await dblclickNote(noteA);
    noteA.textContent = "A revised";
    await dblclickNote(noteB);
    await flushPromises();
    assert.equal(noteA.contentEditable, "false");
    assert.equal(noteA.textContent, "A revised");
    assert.equal(noteB.contentEditable, "true");
    assert.equal(window.LouInlineNotes._activeEditNote, noteB);
    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.find((r) => r.id === first.id).text, "A revised");
  });

  test("WT-25 edit reload restore shows updated text", async () => {
    const { note } = await seedPersistedNote("Before reload");
    await dblclickNote(note);
    note.textContent = "After reload";
    await blurNote(note);
    const reloaded = await renderMechanisms();
    const restored = reloaded.querySelector(
      '[data-element="MEC-oap"] .walkthrough-note[data-note-id]'
    );
    assert.ok(restored);
    assert.equal(restored.textContent, "After reload");
  });

  test("WT-ED-01 official stream unchanged after edit persist", async () => {
    const { note, content } = await seedPersistedNote("Side note");
    const walkthrough = content.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    const before = window.LouCaretAnchor._officialStreamText(walkthrough);
    await dblclickNote(note);
    note.textContent = "Changed side note";
    await blurNote(note);
    const after = window.LouCaretAnchor._officialStreamText(walkthrough);
    assert.equal(before, after);
  });

  test("WT-ED-02 dblclick on pending note is no-op", async () => {
    const content = await renderMechanisms();
    const pending = await createPendingNote(content);
    assert.equal(pending.contentEditable, "true");
    await dblclickNote(pending);
    assert.equal(window.LouInlineNotes._activeEditNote, pending);
    assert.equal(pending.hasAttribute("data-note-id"), false);
  });

  test("WT-ED-03 Escape triggers blur commit like explicit blur", async () => {
    const { id, note } = await seedPersistedNote("Escape me");
    await dblclickNote(note);
    note.textContent = "Via escape";
    await escapeNote(note);
    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows[0].text, "Via escape");
    assert.equal(note.getAttribute("data-note-id"), String(id));
  });

  test("WT-ED-04 re-render mid-edit abandons draft without store write", async () => {
    const { id, note } = await seedPersistedNote("Persisted base");
    await dblclickNote(note);
    note.textContent = "Draft only";
    const content = await renderMechanisms();
    const restored = content.querySelector('[data-note-id="' + id + '"]');
    assert.ok(restored);
    assert.equal(restored.textContent, "Persisted base");
    assert.equal(window.LouInlineNotes._activeEditNote, null);
    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows[0].text, "Persisted base");
  });

  test("WT-ED-05 update in flight blocks dblclick on second note until commit finishes", async () => {
    const first = await seedPersistedNote("First", "MEC-oap", 8);
    const secondId = await seedSecondNote("Second", "MEC-oap", 30);
    const content = await renderMechanisms();
    const noteA = content.querySelector('[data-note-id="' + first.id + '"]');
    const noteB = content.querySelector('[data-note-id="' + secondId + '"]');

    await dblclickNote(noteA);
    noteA.textContent = "First updated";

    let releaseStore;
    const storeGate = new Promise((resolve) => {
      releaseStore = resolve;
    });
    const original = window.LouLearnerStore.updateWalkthroughNote;
    window.LouLearnerStore.updateWalkthroughNote = function (...args) {
      return storeGate.then(() => original.apply(this, args));
    };

    try {
      const commitPromise = blurNote(noteA);
      await flushPromises();
      assert.equal(window.LouInlineNotes._committing, true);

      noteB.dispatchEvent(
        new window.MouseEvent("dblclick", {
          bubbles: true,
          cancelable: true,
        })
      );
      await flushPromises();
      assert.notEqual(noteB.contentEditable, "true");
      assert.notEqual(window.LouInlineNotes._activeEditNote, noteB);

      releaseStore();
      await commitPromise;
      await flushPromises();
      await window.LouInlineNotes._waitForCommitIdle();

      assert.equal(noteA.textContent, "First updated");
      assert.equal(noteB.contentEditable, "true");
      assert.equal(window.LouInlineNotes._activeEditNote, noteB);
    } finally {
      window.LouLearnerStore.updateWalkthroughNote = original;
    }
  });

  test("WT-ED-12 pending A dblclick persisted B commits A then edits B", async () => {
    const content = await renderMechanisms();
    const pendingA = await createPendingNote(content, "MEC-oap", 8);
    pendingA.textContent = "Pending commit";

    await renderMechanisms();
    const walkthrough = window.document.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    const point = textNodeAt(window, walkthrough, 30);
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      point.node,
      point.offset
    );
    const idB = await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      anchor,
      "Note B"
    );
    const content2 = await renderMechanisms();
    const pendingAgain = await createPendingNote(content2, "MEC-oap", 8);
    pendingAgain.textContent = "Pending commit";
    const noteBEl = content2.querySelector('[data-note-id="' + idB + '"]');
    assert.ok(noteBEl);

    await dblclickNote(noteBEl);
    await flushPromises();

    assert.equal(
      content2.querySelector(
        '[data-element="MEC-oap"] .walkthrough-note:not([data-note-id])'
      ),
      null
    );
    const persistedA = content2.querySelector(
      '[data-element="MEC-oap"] .walkthrough-note[data-note-id]:not([data-note-id="' +
        idB +
        '"])'
    );
    assert.ok(persistedA);
    assert.equal(persistedA.textContent, "Pending commit");
    assert.equal(noteBEl.contentEditable, "true");
    assert.equal(window.LouInlineNotes._activeEditNote, noteBEl);

    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 2);
    assert.ok(rows.some((r) => r.text === "Pending commit"));
    assert.ok(rows.some((r) => r.id === idB));
  });

  test("WT-ED-13 intent update abandoned before store invoke", async () => {
    const { id, note } = await seedPersistedNote("Stable text");
    await dblclickNote(note);
    note.textContent = "Never stored";

    let runHook;
    const origRun = window.LouInlineNotes._runStoreCommit.bind(
      window.LouInlineNotes
    );
    window.LouInlineNotes._runStoreCommit = async function (spec) {
      if (runHook) {
        await runHook();
      }
      return origRun(spec);
    };

    const counter = countStoreCalls("updateWalkthroughNote");
    try {
      runHook = async () => {
        await renderMechanisms();
      };
      await blurNote(note);
      assert.equal(counter.calls, 0);
      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows[0].text, "Stable text");
      assert.equal(rows[0].id, id);
    } finally {
      window.LouInlineNotes._runStoreCommit = origRun;
      counter.restore();
    }
  });

  test("WT-ED-15 accepted update mount settlement converges DOM", async () => {
    const { id, note } = await seedPersistedNote("Before mount");
    await dblclickNote(note);
    note.textContent = "After mount";

    const gate = gateStoreMethod("updateWalkthroughNote");
    try {
      const commitPromise = blurNote(note);
      await flushPromises();
      const content = await renderMechanisms();
      const restored = content.querySelector('[data-note-id="' + id + '"]');
      assert.equal(restored.textContent, "Before mount");

      gate.release();
      await commitPromise;
      await flushPromises();

      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows[0].text, "After mount");
      assert.equal(
        content.querySelector('[data-note-id="' + id + '"]').textContent,
        "After mount"
      );
    } finally {
      gate.restore();
    }
  });

  test("WT-ED-16 accepted delete mount settlement removes note from new DOM", async () => {
    const { id, note } = await seedPersistedNote("Delete me");
    await dblclickNote(note);
    note.textContent = "";

    const gate = gateStoreMethod("deleteWalkthroughNote");
    try {
      const commitPromise = blurNote(note);
      await flushPromises();
      const content = await renderMechanisms();
      assert.ok(content.querySelector('[data-note-id="' + id + '"]'));

      gate.release();
      await commitPromise;
      await flushPromises();

      assert.equal(content.querySelector('[data-note-id="' + id + '"]'), null);
      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows.length, 0);
    } finally {
      gate.restore();
    }
  });

  test("WT-ED-17 accepted create mount settlement injects note", async () => {
    const content = await renderMechanisms();
    const pending = await createPendingNote(content);
    pending.textContent = "Created after mount";

    const gate = gateStoreMethod("addWalkthroughNote");
    try {
      const commitPromise = blurNote(pending);
      await flushPromises();
      const remounted = await renderMechanisms();
      assert.equal(
        remounted.querySelector(
          '[data-element="MEC-oap"] .walkthrough-note[data-note-id]'
        ),
        null
      );

      gate.release();
      await commitPromise;
      await flushPromises();

      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows.length, 1);
      assert.equal(rows[0].text, "Created after mount");
      assert.ok(
        remounted.querySelector(
          '[data-note-id="' + rows[0].id + '"]'
        )
      );
    } finally {
      gate.restore();
    }
  });

  test("WT-ED-18 commit A then interaction B waits for A settlement", async () => {
    const first = await seedPersistedNote("First", "MEC-oap", 8);
    const secondId = await seedSecondNote("Second", "MEC-oap", 30);
    const content = await renderMechanisms();
    const noteA = content.querySelector('[data-note-id="' + first.id + '"]');
    const noteB = content.querySelector('[data-note-id="' + secondId + '"]');

    await dblclickNote(noteA);
    noteA.textContent = "A committed";

    const gate = gateStoreMethod("updateWalkthroughNote");
    let updateCalls = 0;
    const original = window.LouLearnerStore.updateWalkthroughNote;
    window.LouLearnerStore.updateWalkthroughNote = function (...args) {
      updateCalls += 1;
      return gate.pending.then(() => original.apply(this, args));
    };

    try {
      const commitA = blurNote(noteA);
      await flushPromises();
      assert.equal(updateCalls, 1);

      noteB.dispatchEvent(
        new window.MouseEvent("dblclick", {
          bubbles: true,
          cancelable: true,
        })
      );
      await flushPromises();
      assert.notEqual(noteB.contentEditable, "true");

      gate.release();
      await commitA;
      await flushPromises();
      await window.LouInlineNotes._waitForCommitIdle();

      await dblclickNote(noteB);
      noteB.textContent = "B waiting";
      await blurNote(noteB);
      await flushPromises();

      assert.equal(updateCalls, 2);
      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows.find((r) => r.id === first.id).text, "A committed");
      assert.equal(rows.find((r) => r.id === secondId).text, "B waiting");
    } finally {
      window.LouLearnerStore.updateWalkthroughNote = original;
    }
  });

  test("WT-ED-ABA accepted A mount A settles then B no revert clobbers B", async () => {
    const { id, note } = await seedPersistedNote("V0");
    await dblclickNote(note);
    note.textContent = "Version A";

    let releaseA;
    const gateA = new Promise((resolve) => {
      releaseA = resolve;
    });
    const updateTexts = [];
    const original = window.LouLearnerStore.updateWalkthroughNote;
    window.LouLearnerStore.updateWalkthroughNote = function (noteId, text) {
      updateTexts.push(text);
      if (updateTexts.length === 1) {
        return gateA.then(() => original.call(this, noteId, text));
      }
      return original.call(this, noteId, text);
    };

    try {
      const commitA = blurNote(note);
      await flushPromises();
      assert.equal(updateTexts.length, 1);
      assert.equal(updateTexts[0], "Version A");

      const content = await renderMechanisms();
      const restored = content.querySelector('[data-note-id="' + id + '"]');
      assert.ok(restored);
      assert.equal(restored.textContent, "V0");

      releaseA();
      await commitA;
      await flushPromises();

      assert.equal(updateTexts.length, 1);
      const rowsAfterA = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rowsAfterA[0].text, "Version A");
      assert.equal(
        content.querySelector('[data-note-id="' + id + '"]').textContent,
        "Version A"
      );
      assert.ok(!updateTexts.includes("V0"));

      await dblclickNote(restored);
      restored.textContent = "Version B";
      await blurNote(restored);
      await flushPromises();

      assert.equal(updateTexts.length, 2);
      assert.equal(updateTexts[0], "Version A");
      assert.equal(updateTexts[1], "Version B");
      assert.ok(!updateTexts.includes("V0"));

      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows.length, 1);
      assert.equal(rows[0].text, "Version B");
      assert.equal(
        content.querySelector('[data-note-id="' + id + '"]').textContent,
        "Version B"
      );
    } finally {
      window.LouLearnerStore.updateWalkthroughNote = original;
    }
  });

  test("WT-ED-ABA converge failure after successful write does not block queue", async () => {
    const { id, note } = await seedPersistedNote("Converge fail");
    await dblclickNote(note);
    note.textContent = "Persisted anyway";

    const originalConverge =
      window.LouInlineNotes._convergeAfterCommit.bind(window.LouInlineNotes);
    window.LouInlineNotes._convergeAfterCommit = async function () {
      throw new Error("converge fail");
    };

    const gate = gateStoreMethod("updateWalkthroughNote");
    try {
      const commitPromise = blurNote(note);
      await flushPromises();
      await renderMechanisms();
      gate.release();
      await commitPromise;
      await flushPromises();

      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows[0].text, "Persisted anyway");

      await dblclickNote(
        window.document.querySelector('[data-note-id="' + id + '"]')
      );
      const noteEl = window.document.querySelector('[data-note-id="' + id + '"]');
      noteEl.textContent = "Second commit";
      await blurNote(noteEl);
      await flushPromises();

      const rowsAfter = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rowsAfter[0].text, "Second commit");
      assert.equal(window.LouInlineNotes._commitInFlight, null);
      assert.equal(window.LouInlineNotes._committing, false);
    } finally {
      window.LouInlineNotes._convergeAfterCommit = originalConverge;
      gate.restore();
    }
  });

  test("WT-ED-19 no revert of older commit clobbers newer commit", async () => {
    const { id, note } = await seedPersistedNote("Version 0");
    await dblclickNote(note);
    note.textContent = "Version A";
    await blurNote(note);

    await dblclickNote(note);
    note.textContent = "Version B";
    await blurNote(note);

    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows[0].text, "Version B");
    assert.equal(note.textContent, "Version B");

    const revertSpy = countStoreCalls("updateWalkthroughNote");
    try {
      assert.equal(revertSpy.calls, 0);
    } finally {
      revertSpy.restore();
    }
  });

  test("WT-ED-20 multiple mounts during accepted commit converge once", async () => {
    const { id, note } = await seedPersistedNote("Multi mount");
    await dblclickNote(note);
    note.textContent = "Converged once";

    const gate = gateStoreMethod("updateWalkthroughNote");
    try {
      const commitPromise = blurNote(note);
      await flushPromises();
      await renderMechanisms();
      const content = await renderMechanisms();
      assert.ok(window.LouInlineNotes._commitInFlight);

      gate.release();
      await commitPromise;
      await flushPromises();

      const domNotes = content.querySelectorAll('[data-note-id="' + id + '"]');
      assert.equal(domNotes.length, 1);
      assert.equal(domNotes[0].textContent, "Converged once");
    } finally {
      gate.restore();
    }
  });

  test("WT-ED-21 failure after mount leaves IDB and current DOM unchanged", async () => {
    const { id, note } = await seedPersistedNote("Fail safe");
    await dblclickNote(note);
    note.textContent = "Will fail";

    const gate = gateStoreMethod("updateWalkthroughNote");
    const original = window.LouLearnerStore.updateWalkthroughNote;
    window.LouLearnerStore.updateWalkthroughNote = function (...args) {
      return gate.pending.then(() =>
        Promise.reject(new Error("idb fail"))
      );
    };

    try {
      const commitPromise = blurNote(note);
      await flushPromises();
      const content = await renderMechanisms();
      const restored = content.querySelector('[data-note-id="' + id + '"]');
      assert.equal(restored.textContent, "Fail safe");

      gate.release();
      await commitPromise;
      await flushPromises();

      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows[0].text, "Fail safe");
      assert.equal(
        content.querySelector('[data-note-id="' + id + '"]').textContent,
        "Fail safe"
      );
    } finally {
      window.LouLearnerStore.updateWalkthroughNote = original;
    }
  });

  test("WT-ED-22 no-op blur never starts commit queue write", async () => {
    const { note } = await seedPersistedNote("hello");
    await dblclickNote(note);
    assert.equal(window.LouInlineNotes._commitInFlight, null);
    await blurNote(note);
    assert.equal(window.LouInlineNotes._commitInFlight, null);
  });

  test("WT-ED-23 create intent abandoned before store on mount", async () => {
    const content = await renderMechanisms();
    const pending = await createPendingNote(content);
    pending.textContent = "Lost pending";

    const counter = countStoreCalls("addWalkthroughNote");
    try {
      await renderMechanisms();
      assert.equal(counter.calls, 0);
      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows.length, 0);
    } finally {
      counter.restore();
    }
  });

  test("WT-ED-24 invalid data-note-id never calls store", async () => {
    const { note } = await seedPersistedNote("Valid");

    const cases = [
      "",
      "   ",
      "abc",
      "NaN",
      "Infinity",
      "-1",
      "0",
      "1.5",
    ];
    const counter = countStoreCalls("updateWalkthroughNote");
    try {
      for (const badId of cases) {
        await dblclickNote(note);
        note.textContent = "Bad id " + badId;
        note.setAttribute("data-note-id", badId);
        await blurNote(note);
      }
      assert.equal(counter.calls, 0);
    } finally {
      counter.restore();
    }
  });

  test("WT-ED-25 normalization trims borders newlines and nested text", async () => {
    const { id, note } = await seedPersistedNote("line one");
    await dblclickNote(note);
    note.textContent = "  line one \n";
    await blurNote(note);

    const counter = countStoreCalls("updateWalkthroughNote");
    try {
      await dblclickNote(note);
      note.innerHTML = "line one<br>";
      await blurNote(note);
      assert.equal(counter.calls, 0);

      await dblclickNote(note);
      note.textContent = "  line one  ";
      await blurNote(note);
      assert.equal(counter.calls, 0);
    } finally {
      counter.restore();
    }

    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows[0].id, id);
    assert.equal(rows[0].text, "line one");
  });

  test("WT-ED-26 double blur does not enqueue concurrent writes", async () => {
    const { note } = await seedPersistedNote("Once");
    await dblclickNote(note);
    note.textContent = "Single write";

    let concurrent = 0;
    let maxConcurrent = 0;
    const original = window.LouLearnerStore.updateWalkthroughNote;
    window.LouLearnerStore.updateWalkthroughNote = function (...args) {
      concurrent += 1;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      return original.apply(this, args).finally(() => {
        concurrent -= 1;
      });
    };

    try {
      note.dispatchEvent(new window.FocusEvent("blur", { bubbles: false }));
      note.dispatchEvent(new window.FocusEvent("blur", { bubbles: false }));
      await flushPromises();
      await window.LouInlineNotes._waitForCommitIdle();
      assert.equal(maxConcurrent, 1);
    } finally {
      window.LouLearnerStore.updateWalkthroughNote = original;
    }
  });

  test("WT-ED-27 delete menu accepted mount settlement converges", async () => {
    const { id, note } = await seedPersistedNote("Menu delete");
    const gate = gateStoreMethod("deleteWalkthroughNote");
    try {
      const menu = await openDeleteMenu(note);
      const clickPromise = (async () => {
        menu.querySelector("button").click();
        await flushPromises();
        await window.LouInlineNotes._waitForCommitIdle();
      })();
      await flushPromises();
      const content = await renderMechanisms();
      assert.ok(content.querySelector('[data-note-id="' + id + '"]'));

      gate.release();
      await clickPromise;
      await flushPromises();

      assert.equal(content.querySelector('[data-note-id="' + id + '"]'), null);
    } finally {
      gate.restore();
    }
  });

  test("WT-ED-14 cosmetic border whitespace blur is no-op", async () => {
    const { id, note } = await seedPersistedNote("hello");
    let updateCalls = 0;
    const original = window.LouLearnerStore.updateWalkthroughNote;
    window.LouLearnerStore.updateWalkthroughNote = function (...args) {
      updateCalls += 1;
      return original.apply(this, args);
    };
    try {
      await dblclickNote(note);
      note.textContent = "  hello  ";
      await blurNote(note);
      assert.equal(updateCalls, 0);
      assert.equal(note.textContent, "  hello  ");
      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows[0].text, "hello");
      assert.equal(rows[0].id, id);
    } finally {
      window.LouLearnerStore.updateWalkthroughNote = original;
    }
  });

  test("WT-26 contextmenu on persisted note shows delete menu", async () => {
    const { note } = await seedPersistedNote();
    const menu = await openDeleteMenu(note);
    assert.equal(menu.querySelector("button").textContent, "Supprimer la note");
  });

  test("WT-27 delete menu removes span and store record", async () => {
    const { id, note, content } = await seedPersistedNote("Remove me");
    const menu = await openDeleteMenu(note);
    menu.querySelector("button").click();
    await flushPromises();
    await window.LouInlineNotes._waitForCommitIdle();
    assert.equal(content.querySelector('[data-note-id="' + id + '"]'), null);
    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 0);
  });

  test("WT-28 delete menu store rejection keeps span", async () => {
    const { id, note, content } = await seedPersistedNote("Stay");
    const original = window.LouLearnerStore.deleteWalkthroughNote;
    window.LouLearnerStore.deleteWalkthroughNote = () =>
      Promise.reject(new Error("idb fail"));
    try {
      const menu = await openDeleteMenu(note);
      menu.querySelector("button").click();
      await flushPromises();
      assert.ok(content.querySelector('[data-note-id="' + id + '"]'));
      const rows = await window.LouLearnerStore.listWalkthroughNotes(
        CHAPTER,
        "mechanisms"
      );
      assert.equal(rows.length, 1);
    } finally {
      window.LouLearnerStore.deleteWalkthroughNote = original;
    }
  });

  test("WT-29 delete while editing skips prior commit and removes span", async () => {
    const { id, note, content } = await seedPersistedNote("Editing delete");
    await dblclickNote(note);
    note.textContent = "Uncommitted draft";
    const menu = await openDeleteMenu(note);
    menu.querySelector("button").click();
    await flushPromises();
    await window.LouInlineNotes._waitForCommitIdle();
    assert.equal(content.querySelector('[data-note-id="' + id + '"]'), null);
    const rows = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 0);
  });

  test("WT-ED-06 delete menu on note has no Add note entry", async () => {
    const { note } = await seedPersistedNote();
    const menu = await openDeleteMenu(note);
    const labels = Array.from(menu.querySelectorAll("button")).map(
      (b) => b.textContent
    );
    assert.deepEqual(labels, ["Supprimer la note"]);
  });

  test("WT-ED-07 contextmenu off note has no delete entry", async () => {
    const content = await renderMechanisms();
    const menu = await openCreateMenu(content, "MEC-oap", 10);
    const labels = Array.from(menu.querySelectorAll("button")).map(
      (b) => b.textContent
    );
    assert.deepEqual(labels, ["Add note"]);
  });

  test("WT-ED-08 create flow still works after edit bind", async () => {
    const content = await renderMechanisms();
    const pending = await createPendingNote(content);
    pending.textContent = "New after edit bind";
    await blurNote(pending);
    const persisted = content.querySelector(
      '[data-element="MEC-oap"] .walkthrough-note[data-note-id]'
    );
    assert.ok(persisted);
    assert.equal(persisted.textContent, "New after edit bind");
  });

  test("WT-ED-09 restore idempotent with edited notes", async () => {
    const { id, note } = await seedPersistedNote("Once");
    await dblclickNote(note);
    note.textContent = "Edited once";
    await blurNote(note);
    await window.LouInlineNotes.restore(
      window.document.getElementById("content"),
      context
    );
    const notes = window.document.querySelectorAll(
      '[data-element="MEC-oap"] .walkthrough-note[data-note-id="' + id + '"]'
    );
    assert.equal(notes.length, 1);
    assert.equal(notes[0].textContent, "Edited once");
  });

  test("WT-ED-10 mount hides menu after edit contextmenu", async () => {
    const { note } = await seedPersistedNote();
    await openDeleteMenu(note);
    assert.notEqual(window.LouInlineNotes._pendingMenuContext, null);
    await renderMechanisms();
    const menu = window.document.querySelector(".inline-notes-context-menu");
    assert.ok(!menu || menu.hidden);
    assert.equal(window.LouInlineNotes._pendingMenuContext, null);
  });

  test("WT-ED-11 highlights and edited note coexist after reload", async () => {
    await renderMechanisms();
    const walkthrough = window.document.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    const full = walkthrough.textContent;
    const exact = "Au-delà du seuil";
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

    const { note } = await seedPersistedNote("Near highlight", "MEC-oap", 12);
    await dblclickNote(note);
    note.textContent = "Edited near highlight";
    await blurNote(note);

    const reloaded = await renderMechanisms();
    const wt = reloaded.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    assert.ok(wt.querySelector("mark.learner-highlight"));
    const restoredNote = wt.querySelector(".walkthrough-note[data-note-id]");
    assert.ok(restoredNote);
    assert.equal(restoredNote.textContent, "Edited near highlight");
  });
});
