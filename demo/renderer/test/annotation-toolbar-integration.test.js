// Annotation Toolbar Integration — single toolbar, controller routing, cross-module coordination.
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

## Pourquoi la congestion pulmonaire apparaît-elle ? {#MEC-congestion}

La pression de remplissage gauche remonte. {#cb-mec-cong-steps}
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
                elements: ["MEC-congestion"],
                visuals: {},
            },
        ],
        visuals: [],
        official_visuals: [],
    };
}

function resetController(window) {
    if (window.LouAnnotationController && window.LouAnnotationController._toolbar) {
        window.LouAnnotationController._toolbar.destroy();
        window.LouAnnotationController._toolbar = null;
        window.LouAnnotationController._context = null;
        window.LouAnnotationController._highlightIntent = null;
        window.LouAnnotationController._noteIntent = null;
    }
}

describe("Annotation Toolbar Integration", () => {
    /** @type {JSDOM} */
    let dom;
    /** @type {Window} */
    let window;

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
            "annotation-colors.js",
            "annotation-toolbar.js",
            "annotation-controller.js",
            "text-highlights.js",
            "inline-notes.js",
            "blocks.js",
            "renderer.js",
        ]);
    });

  beforeEach(async () => {
    if (window.LouInlineNotes && window.LouInlineNotes._commitInFlight) {
      await window.LouInlineNotes._commitInFlight;
    }
        window.indexedDB = new IDBFactory();
        window.LouLearnerStore.db = null;
        window.localStorage.clear();
        const contentEl = window.document.getElementById("content");
        if (contentEl) {
            const fresh = window.document.createElement("div");
            fresh.id = "content";
            contentEl.replaceWith(fresh);
        }
        window.LouTextHighlights._boundHost = null;
        window.LouTextHighlights._selectionContext = null;
        window.LouInlineNotes._boundHost = null;
        window.LouInlineNotes._activeEditNote = null;
        window.LouInlineNotes._committing = false;
        resetController(window);
    });

    async function renderMechanisms() {
        const manifest = manifestFixture();
        window.LouRenderer.init(window.document.getElementById("content"), null);
        const context = {
            projection: manifest.projections[0],
            manifest,
            chapter: CHAPTER,
            config: window.LouConfig,
            renderer: window.LouRenderer,
            store: window.LouLearnerStore,
        };
        const md = window.LouRenderer.prepareLearnerMarkdown(MECHANISMS_MD);
        const html = window.LouMarkdown.parse(md);
        await window.LouRenderer.renderProjection(html, context);
        return window.document.getElementById("content");
    }

    test("only one annotation-toolbar element exists after highlight and note contexts", async () => {
        const content = await renderMechanisms();
        const walkthrough = content.querySelector(".block-walkthrough");
        const range = window.LouCaretAnchor._caretRangeFromOffset(walkthrough, 3);
        range.getBoundingClientRect = () => ({
            left: 10,
            top: 20,
            width: 40,
            height: 16,
            right: 50,
            bottom: 36,
        });
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        window.LouTextHighlights._selectionContext = {
            host: content,
            context: {
                chapter: CHAPTER,
                store: { addTextHighlight: () => Promise.resolve(1) },
            },
            officialRoot: walkthrough,
            element: "MEC-congestion",
            sourceProjection: null,
            range: range.cloneRange(),
        };
        window.LouTextHighlights._showToolbar(range);
        assert.equal(window.document.querySelectorAll(".annotation-toolbar").length, 1);

        const noteEl = window.document.createElement("span");
        noteEl.className = "walkthrough-note";
        noteEl.dataset.learner = "true";
        noteEl.textContent = "Note";
        walkthrough.appendChild(noteEl);
        window.LouInlineNotes._showAnnotationToolbarForNote(noteEl);
        assert.equal(window.document.querySelectorAll(".annotation-toolbar").length, 1);
        assert.equal(window.LouAnnotationController.getContext(), "note-edit");
    });

    test("highlight dismiss does not clear selection while note is being edited", async () => {
        const content = await renderMechanisms();
        const walkthrough = content.querySelector(".block-walkthrough");
        const noteEl = window.document.createElement("span");
        noteEl.className = "walkthrough-note";
        noteEl.dataset.learner = "true";
        noteEl.textContent = "Edit me";
        walkthrough.appendChild(noteEl);

        window.LouInlineNotes._enterEditMode(noteEl);
        window.LouInlineNotes._showAnnotationToolbarForNote(noteEl);

        const range = window.document.createRange();
        range.selectNodeContents(noteEl);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        window.LouTextHighlights.dismissToolbar();
        assert.equal(window.getSelection().rangeCount, 1);
        assert.ok(window.getSelection().getRangeAt(0).toString().length >= 0);
    });

    test("style-only edit persists color and format without store text update", async () => {
        const content = await renderMechanisms();
        window.LouInlineNotes._bindContext = {
            chapter: CHAPTER,
            store: window.LouLearnerStore,
            projection: { id: "mechanisms" },
        };
        const id = await window.LouLearnerStore.addWalkthroughNote(
            CHAPTER,
            "mechanisms",
            "MEC-congestion",
            { type: "CaretAnchor", streamOffset: 5 },
            "Style me"
        );
        const noteEl = window.document.createElement("span");
        noteEl.className = "walkthrough-note";
        noteEl.dataset.learner = "true";
        noteEl.setAttribute("data-note-id", String(id));
        noteEl.textContent = "Style me";
        window.LouAnnotationColors.applyNoteColor(noteEl, "blue");
        window.LouAnnotationColors.applyNoteStyle(
            noteEl,
            window.LouAnnotationColors.emptyFormatState()
        );
        content.querySelector(".block-walkthrough").appendChild(noteEl);

        window.LouInlineNotes._editSnapshots.set(noteEl, {
            text: "Style me",
            prefs: window.LouInlineNotes._prefsSnapshot(noteEl),
        });
        window.LouInlineNotes._enterEditMode(noteEl);
        window.LouInlineNotes._showAnnotationToolbarForNote(noteEl);

        const toolbar = window.LouAnnotationController.getToolbar();
        toolbar.element.querySelector('[data-color-id="pink"]').click();
        toolbar.element.querySelector(".annotation-toolbar-format-bold").click();

        let updateCalls = 0;
        const original = window.LouLearnerStore.updateWalkthroughNote;
        window.LouLearnerStore.updateWalkthroughNote = function () {
            updateCalls += 1;
            return original.apply(this, arguments);
        };
        try {
            await window.LouInlineNotes._commitOnBlur(noteEl);
            await window.LouInlineNotes._waitForCommitIdle();
        } finally {
            window.LouLearnerStore.updateWalkthroughNote = original;
        }

        assert.equal(updateCalls, 0);
        assert.equal(window.LouAnnotationColors.getRecordColor("note", id), "pink");
        const style = window.LouAnnotationColors.getRecordStyle("note", id);
        assert.equal(style.bold, true);
    });

    test("mouseup selection inside note does not open highlight toolbar during edit", async () => {
        const content = await renderMechanisms();
        const walkthrough = content.querySelector(".block-walkthrough");
        const noteEl = window.document.createElement("span");
        noteEl.className = "walkthrough-note";
        noteEl.dataset.learner = "true";
        noteEl.textContent = "Inside";
        walkthrough.appendChild(noteEl);

        window.LouInlineNotes._enterEditMode(noteEl);
        const textNode = noteEl.firstChild;
        const range = window.document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 3);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);

        window.LouTextHighlights._onSelectionChange(content, {
            chapter: CHAPTER,
            store: window.LouLearnerStore,
        });
        assert.notEqual(window.LouAnnotationController.getContext(), "highlight-create");
    });
});
