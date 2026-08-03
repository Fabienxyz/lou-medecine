// Inline note edit focus — guards against LouInlineFormatting selection clearing.
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

function loadScripts(dom, files) {
    for (const file of files) {
        dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
    }
}

describe("Inline note edit focus", () => {
    /** @type {JSDOM} */
    let dom;
    /** @type {Window} */
    let window;
    /** @type {HTMLElement} */
    let host;

    before(() => {
        dom = new JSDOM(
            `<!DOCTYPE html><body><div id="content"><div class="pedagogical-block" data-element="X"><div class="block-walkthrough" data-official="true">Alpha beta gamma.</div></div></div></body>`,
            { url: "http://localhost/", runScripts: "outside-only" }
        );
        window = dom.window;
        window.requestAnimationFrame = (cb) => {
            cb();
            return 0;
        };
        loadScripts(dom, [
            "annotation-colors.js",
            "annotation-toolbar.js",
            "annotation-controller.js",
            "text-highlights.js",
            "inline-formatting.js",
            "inline-notes.js",
        ]);
    });

    beforeEach(() => {
        window.localStorage.clear();
        window.LouInlineNotes._activeEditNote = null;
        window.LouInlineNotes._noteEditGestureActive = false;
        host = window.document.getElementById("content");
        window.LouTextHighlights.bindSelection(host, {});
        window.LouInlineFormatting.bindSelection(host, {});
    });

    function setCaretIn(noteEl) {
        const range = window.document.createRange();
        range.setStart(noteEl, 0);
        range.collapse(true);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }

    function createEditingNote() {
        const walkthrough = host.querySelector(".block-walkthrough");
        const noteEl = window.document.createElement("span");
        noteEl.className = "walkthrough-note";
        noteEl.dataset.learner = "true";
        walkthrough.appendChild(noteEl);
        window.LouInlineNotes._enterEditMode(noteEl);
        window.LouInlineNotes._showAnnotationToolbarForNote(noteEl);
        setCaretIn(noteEl);
        return noteEl;
    }

    test("LouInlineFormatting dismissToolbar does not clear selection during note edit", () => {
        const noteEl = createEditingNote();
        setCaretIn(noteEl);

        window.LouInlineFormatting.dismissToolbar();
        assert.equal(window.getSelection().rangeCount, 1);
        assert.equal(window.LouInlineNotes.isNoteEditProtected(), true);
    });

    test("LouInlineFormatting mouseup handler skips selection processing during note edit", () => {
        const noteEl = createEditingNote();
        setCaretIn(noteEl);

        window.LouInlineFormatting._onSelectionChange(host, {});
        assert.equal(window.getSelection().rangeCount, 1);
    });

    test("LouInlineFormatting document mousedown does not clear caret during note edit", () => {
        const noteEl = createEditingNote();
        setCaretIn(noteEl);
        window.LouInlineFormatting._toolbar = window.document.createElement("div");
        window.document.body.appendChild(window.LouInlineFormatting._toolbar);

        window.document.dispatchEvent(
            new window.MouseEvent("mousedown", { bubbles: true })
        );
        assert.equal(window.getSelection().rangeCount, 1);
    });

    test("toolbar color click during edit keeps note editable and applies style", () => {
        const noteEl = createEditingNote();
        const toolbar = window.LouAnnotationController.getToolbar();
        toolbar.element.querySelector('[data-color-id="pink"]').click();

        assert.equal(window.LouInlineNotes.isNoteEditProtected(), true);
        assert.equal(noteEl.contentEditable, "true");
        noteEl.textContent = "Hi";
        assert.equal(noteEl.textContent, "Hi");
        assert.equal(noteEl.dataset.pendingNoteColor, "pink");
    });

    test("note edit gesture flag protects async dblclick window before enterEditMode", () => {
        window.LouInlineNotes._noteEditGestureActive = true;
        assert.equal(window.LouInlineNotes.isNoteEditProtected(), true);
        const noteEl = window.document.createElement("span");
        noteEl.className = "walkthrough-note";
        host.querySelector(".block-walkthrough").appendChild(noteEl);
        setCaretIn(noteEl);

        window.LouInlineFormatting.dismissToolbar();
        assert.equal(window.getSelection().rangeCount, 1);
    });

    test("format toggles during edit apply styles without exiting edit mode", () => {
        const noteEl = createEditingNote();
        const toolbar = window.LouAnnotationController.getToolbar();
        toolbar.element.querySelector(".annotation-toolbar-format-bold").click();
        toolbar.element.querySelector(".annotation-toolbar-format-underline").click();
        toolbar.element.querySelector(".annotation-toolbar-format-strikethrough").click();

        assert.equal(noteEl.contentEditable, "true");
        assert.equal(window.LouInlineNotes.isNoteEditProtected(), true);
        noteEl.textContent = "Styled";
        assert.equal(noteEl.textContent, "Styled");
        assert.equal(noteEl.dataset.pendingNoteBold, "true");
        assert.equal(noteEl.dataset.pendingNoteUnderline, "true");
        assert.equal(noteEl.dataset.pendingNoteStrikethrough, "true");
    });
});
