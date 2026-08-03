// Independent annotation preferences — highlight vs note profiles (PAS ciblé).
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

describe("Annotation preferences — independent profiles", () => {
    /** @type {JSDOM} */
    let dom;
    /** @type {Window} */
    let window;

    beforeEach(() => {
        dom = new JSDOM(
            `<!DOCTYPE html><body><div id="content"><div class="pedagogical-block" data-element="X" data-source-projection="mechanisms"><div class="block-walkthrough" data-official="true">Alpha beta gamma delta.</div></div></div></body>`,
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
            "inline-notes.js",
        ]);
        window.localStorage.clear();
    });

    function highlightToolbarState() {
        const host = window.document.getElementById("content");
        const walkthrough = host.querySelector(".block-walkthrough");
        const textNode = walkthrough.firstChild;
        const range = window.document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 5);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        window.LouTextHighlights._bindContext = {
            chapter: "cardio/234",
            projection: { id: "mechanisms" },
            store: { addTextHighlight: () => Promise.resolve(1) },
        };
        window.LouTextHighlights._onSelectionChange(
            host,
            window.LouTextHighlights._bindContext
        );
        return window.LouAnnotationController.getToolbar().getState();
    }

    test("palette replaces violet with black and uses light gray highlight fill", () => {
        const C = window.LouAnnotationColors;
        assert.equal(C.getById("violet"), null);
        const black = C.getById("black");
        assert.ok(black);
        assert.equal(black.highlight, "#f3f4f6");
        assert.equal(black.text, "#111827");
        const note = window.document.createElement("span");
        C.applyNoteColor(note, "black");
        assert.equal(note.style.color, "rgb(17, 24, 39)");
        const mark = window.document.createElement("mark");
        C.applyHighlightColor(mark, "black");
        assert.equal(mark.style.backgroundColor, "rgb(243, 244, 246)");
    });

    test("legacy violet color ids migrate to black", () => {
        window.localStorage.setItem(
            window.LouAnnotationColors.STORAGE_KEY,
            JSON.stringify({
                lastHighlight: "violet",
                lastNote: "violet",
                lastNoteStyle: { bold: false, underline: false, strikethrough: false },
                lastHighlightStyle: {
                    bold: false,
                    underline: false,
                    strikethrough: false,
                },
                highlights: { "1": "violet" },
                notes: {},
                highlightStyles: {},
                noteStyles: {},
            })
        );
        assert.equal(
            window.LouAnnotationColors.getLastHighlightColorId(),
            "black"
        );
        assert.equal(window.LouAnnotationColors.getLastNoteColorId(), "black");
        assert.equal(
            window.LouAnnotationColors.getRecordColor("highlight", 1),
            "black"
        );
    });

    test("highlight toolbar opens with last highlight color and style pre-selected", () => {
        window.LouAnnotationColors.setLastHighlightPreferences({
            colorId: "pink",
            bold: false,
            underline: true,
            strikethrough: false,
        });
        window.LouAnnotationColors.setLastNotePreferences({
            colorId: "yellow",
            bold: true,
            underline: false,
            strikethrough: false,
        });
        const state = highlightToolbarState();
        assert.equal(state.colorId, "pink");
        assert.equal(state.bold, false);
        assert.equal(state.underline, true);
        assert.equal(state.strikethrough, false);
    });

    test("highlight live edit updates last highlight preferences only", async () => {
        window.LouAnnotationColors.setLastNotePreferences({
            colorId: "blue",
            bold: true,
            underline: false,
            strikethrough: false,
        });
        const host = window.document.getElementById("content");
        const walkthrough = host.querySelector(".block-walkthrough");
        const textNode = walkthrough.firstChild;
        const range = window.document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 8);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        window.LouTextHighlights._bindContext = {
            chapter: "cardio/234",
            projection: { id: "mechanisms" },
            store: {
                addTextHighlight: () => Promise.resolve(42),
            },
        };
        window.LouTextHighlights._onSelectionChange(
            host,
            window.LouTextHighlights._bindContext
        );
        await new Promise(function (resolve) {
            window.setTimeout(resolve, 20);
        });
        window.LouTextHighlights._onHighlightToolbarIntent(
            {
                colorId: "black",
                bold: true,
                underline: false,
                strikethrough: false,
            },
            { kind: "color", colorId: "black" }
        );
        const hl = window.LouAnnotationColors.getLastHighlightPreferences();
        assert.equal(hl.colorId, "black");
        assert.equal(hl.bold, true);
        const note = window.LouAnnotationColors.getLastNotePreferences();
        assert.equal(note.colorId, "blue");
        assert.equal(note.bold, true);
    });

    test("note toolbar opens with last note preferences and changes do not affect highlight", () => {
        window.LouAnnotationColors.setLastHighlightPreferences({
            colorId: "yellow",
            bold: false,
            underline: false,
            strikethrough: false,
        });
        window.LouAnnotationColors.setLastNotePreferences({
            colorId: "black",
            bold: true,
            underline: false,
            strikethrough: false,
        });

        const walkthrough = window.document.querySelector(".block-walkthrough");
        const noteEl = window.document.createElement("span");
        noteEl.className = "walkthrough-note";
        noteEl.dataset.learner = "true";
        noteEl.dataset.pendingNoteColor = "black";
        noteEl.dataset.pendingNoteBold = "true";
        noteEl.dataset.pendingNoteUnderline = "false";
        noteEl.dataset.pendingNoteStrikethrough = "false";
        walkthrough.appendChild(noteEl);
        window.LouInlineNotes._showAnnotationToolbarForNote(noteEl);

        let state = window.LouAnnotationController.getToolbar().getState();
        assert.equal(state.colorId, "black");
        assert.equal(state.bold, true);

        window.LouAnnotationController.getToolbar()
            .element.querySelector('[data-color-id="blue"]')
            .click();
        window.LouAnnotationController.getToolbar()
            .element.querySelector(".annotation-toolbar-format-strikethrough")
            .click();

        const notePrefs = window.LouAnnotationColors.getLastNotePreferences();
        assert.equal(notePrefs.colorId, "blue");
        assert.equal(notePrefs.strikethrough, true);

        const hlPrefs = window.LouAnnotationColors.getLastHighlightPreferences();
        assert.equal(hlPrefs.colorId, "yellow");
        assert.equal(hlPrefs.bold, false);
    });

    test("preferences survive localStorage reload round-trip", () => {
        window.LouAnnotationColors.setLastHighlightPreferences({
            colorId: "green",
            bold: false,
            underline: false,
            strikethrough: true,
        });
        window.LouAnnotationColors.setLastNotePreferences({
            colorId: "pink",
            bold: false,
            underline: true,
            strikethrough: false,
        });

        const raw = window.localStorage.getItem(
            window.LouAnnotationColors.STORAGE_KEY
        );
        window.localStorage.clear();
        window.localStorage.setItem(
            window.LouAnnotationColors.STORAGE_KEY,
            raw
        );

        const hl = window.LouAnnotationColors.getLastHighlightPreferences();
        assert.equal(hl.colorId, "green");
        assert.equal(hl.strikethrough, true);
        const note = window.LouAnnotationColors.getLastNotePreferences();
        assert.equal(note.colorId, "pink");
        assert.equal(note.underline, true);
    });
});
