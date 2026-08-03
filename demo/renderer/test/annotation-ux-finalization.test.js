// Annotation UX Finalization V1 — bold highlight, eraser, note re-edit (PAS ciblé).
import { test, describe, beforeEach } from "node:test";
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

function blockHtml() {
    return `<!DOCTYPE html><body><div id="content"><div class="pedagogical-block" data-element="X" data-source-projection="mechanisms"><div class="block-walkthrough" data-official="true">Alpha beta gamma delta.</div></div></div></body>`;
}

describe("Annotation UX Finalization V1", () => {
    /** @type {JSDOM} */
    let dom;
    /** @type {Window} */
    let window;

    beforeEach(() => {
        dom = new JSDOM(blockHtml(), {
            url: "http://localhost/",
            runScripts: "outside-only",
        });
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
            "inline-notes.js",
        ]);
        window.localStorage.clear();
        window.LouTextHighlights._bindContext = {
            chapter: "cardio/234",
            projection: { id: "mechanisms" },
            store: {
                addTextHighlight: () => Promise.resolve(42),
                deleteTextHighlight: () => Promise.resolve(),
            },
        };
        window.LouInlineNotes._bindContext = {
            chapter: "cardio/234",
            projection: { id: "mechanisms" },
            store: {
                deleteWalkthroughNote: () => Promise.resolve(),
            },
        };
    });

    function rangeForText(start, end) {
        const walkthrough = window.document.querySelector(".block-walkthrough");
        return window.LouTextHighlights._rangeFromTextOffsets(
            walkthrough,
            start,
            end
        );
    }

    test("highlight bold applies dataset and typography; underline replaces bold exclusively", async () => {
        const host = window.document.getElementById("content");
        const range = rangeForText(0, 5);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        window.LouTextHighlights._onSelectionChange(
            host,
            window.LouTextHighlights._bindContext
        );
        await new Promise((resolve) => window.setTimeout(resolve, 20));

        const toolbar = window.LouAnnotationController.getToolbar();
        const mark = host.querySelector("mark.learner-highlight");
        assert.ok(mark);

        toolbar.element.querySelector(".annotation-toolbar-format-bold").click();
        assert.equal(mark.dataset.highlightBold, "true");
        assert.equal(mark.style.fontWeight, "700");
        assert.equal(mark.dataset.highlightUnderline, "false");

        toolbar.element.querySelector(".annotation-toolbar-format-underline").click();
        assert.equal(mark.dataset.highlightBold, "false");
        assert.equal(mark.dataset.highlightUnderline, "true");
        assert.equal(mark.style.textDecoration, "underline");
        assert.equal(mark.style.fontWeight, "");
    });

    test("highlight eraser unwraps mark and deletes store record", async () => {
        const host = window.document.getElementById("content");
        const range = rangeForText(0, 5);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        window.LouTextHighlights._onSelectionChange(
            host,
            window.LouTextHighlights._bindContext
        );
        await new Promise((resolve) => window.setTimeout(resolve, 20));

        const mark = host.querySelector("mark.learner-highlight");
        mark.dataset.highlightId = "42";
        window.LouAnnotationColors.setRecordColor("highlight", 42, "yellow");
        window.LouAnnotationColors.setRecordStyle("highlight", 42, {
            bold: true,
            underline: false,
            strikethrough: false,
        });

        const walkthrough = host.querySelector(".block-walkthrough");
        const beforeText = walkthrough.textContent;

        window.LouAnnotationController.getToolbar()
            .element.querySelector(".annotation-toolbar-erase")
            .click();
        await new Promise((resolve) => window.setTimeout(resolve, 20));

        assert.equal(host.querySelector("mark.learner-highlight"), null);
        assert.equal(walkthrough.textContent, beforeText);
        assert.equal(
            window.LouAnnotationColors.getRecordColor("highlight", 42),
            null
        );
        assert.equal(window.LouAnnotationController.isHighlightEditActive(), false);
    });

    test("double-click on existing note re-enters edit and opens toolbar", async () => {
        const host = window.document.getElementById("content");
        const walkthrough = host.querySelector(".block-walkthrough");
        const noteEl = window.document.createElement("span");
        noteEl.className = "walkthrough-note";
        noteEl.dataset.learner = "true";
        noteEl.dataset.noteId = "9";
        noteEl.setAttribute("data-note-id", "9");
        noteEl.textContent = "Saved note";
        walkthrough.appendChild(noteEl);

        const event = new window.MouseEvent("dblclick", {
            bubbles: true,
            clientX: 40,
            clientY: 40,
        });
        Object.defineProperty(event, "target", { value: noteEl.firstChild });
        await window.LouInlineNotes._onNoteDblClick(event, host);

        assert.equal(noteEl.contentEditable, "true");
        assert.equal(window.LouInlineNotes._activeEditNote, noteEl);
        assert.equal(window.LouAnnotationController.isNoteEditActive(), true);

        await window.LouInlineNotes._onNoteDblClick(event, host);
        assert.equal(window.LouInlineNotes._activeEditNote, noteEl);
        assert.equal(window.LouAnnotationController.isNoteEditActive(), true);
    });

    test("note eraser removes persisted note from DOM and sidecar", async () => {
        const host = window.document.getElementById("content");
        const walkthrough = host.querySelector(".block-walkthrough");
        const noteEl = window.document.createElement("span");
        noteEl.className = "walkthrough-note";
        noteEl.dataset.learner = "true";
        noteEl.setAttribute("data-note-id", "15");
        noteEl.textContent = "Delete me";
        walkthrough.appendChild(noteEl);
        window.LouAnnotationColors.setRecordColor("note", 15, "blue");

        window.LouInlineNotes._enterEditMode(noteEl);
        window.LouInlineNotes._showAnnotationToolbarForNote(noteEl);
        window.LouAnnotationController.getToolbar()
            .element.querySelector(".annotation-toolbar-erase")
            .click();
        await new Promise((resolve) => window.setTimeout(resolve, 30));

        assert.equal(walkthrough.querySelector(".walkthrough-note"), null);
        assert.equal(window.LouAnnotationColors.getRecordColor("note", 15), null);
        assert.equal(window.LouAnnotationController.isNoteEditActive(), false);
    });

    test("highlight bold survives sidecar reload round-trip", async () => {
        const host = window.document.getElementById("content");
        const walkthrough = host.querySelector(".block-walkthrough");
        const range = rangeForText(0, 5);
        const selector = window.LouTextHighlights.selectorFromRange(
            walkthrough,
            range
        );
        window.LouAnnotationColors.setRecordColor("highlight", 3, "green");
        window.LouAnnotationColors.setRecordStyle("highlight", 3, {
            bold: true,
            underline: false,
            strikethrough: false,
        });

        await window.LouTextHighlights.restore(host, {
            chapter: "cardio/234",
            projection: { id: "mechanisms" },
            store: {
                listTextHighlights: async () => [
                    {
                        id: 3,
                        element: "X",
                        projection: "mechanisms",
                        selector: selector,
                    },
                ],
            },
        });

        const mark = host.querySelector("mark.learner-highlight");
        assert.ok(mark);
        assert.equal(mark.dataset.highlightBold, "true");
        assert.equal(mark.style.fontWeight, "700");
    });
});
