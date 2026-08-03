// Annotation Formatting Simplification V1 — exclusive style model + render coherence.
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

describe("Annotation Formatting Simplification V1 — LouAnnotationColors", () => {
    /** @type {JSDOM} */
    let dom;
    /** @type {import("../../annotation-colors.js")} */
    let C;

    beforeEach(() => {
        dom = new JSDOM("<!DOCTYPE html><body></body>", {
            url: "http://localhost/",
            runScripts: "outside-only",
        });
        loadScripts(dom, ["annotation-colors.js"]);
        C = dom.window.LouAnnotationColors;
        dom.window.localStorage.clear();
    });

    test("normalizeFormatState coerces legacy multi-flag entries to a single style", () => {
        const allThree = C.normalizeFormatState({
            bold: true,
            underline: true,
            strikethrough: true,
        });
        assert.equal(allThree.bold, true);
        assert.equal(allThree.underline, false);
        assert.equal(allThree.strikethrough, false);

        const underlineStrike = C.normalizeFormatState({
            bold: false,
            underline: true,
            strikethrough: true,
        });
        assert.equal(underlineStrike.bold, false);
        assert.equal(underlineStrike.underline, true);
        assert.equal(underlineStrike.strikethrough, false);
    });

    test("applyNoteStyle renders exclusive typography per style", () => {
        const note = dom.window.document.createElement("span");
        const cases = [
            {
                state: C.emptyFormatState(),
                weight: "",
                deco: "",
                id: C.STYLE_NORMAL,
            },
            {
                state: { bold: true, underline: false, strikethrough: false },
                weight: "700",
                deco: "",
                id: C.STYLE_BOLD,
            },
            {
                state: { bold: false, underline: true, strikethrough: false },
                weight: "",
                deco: "underline",
                id: C.STYLE_UNDERLINE,
            },
            {
                state: { bold: false, underline: false, strikethrough: true },
                weight: "",
                deco: "line-through",
                id: C.STYLE_STRIKETHROUGH,
            },
        ];
        for (const c of cases) {
            C.applyNoteStyle(note, c.state);
            assert.equal(note.style.fontWeight, c.weight, c.id + " weight");
            assert.equal(note.style.textDecoration, c.deco, c.id + " deco");
            assert.equal(C.formatStateToStyleId(c.state), c.id);
        }
    });

    test("applyHighlightStyle matches sidecar after setRecordStyle and reload", () => {
        C.setRecordStyle("highlight", 7, {
            bold: false,
            underline: true,
            strikethrough: false,
        });
        const stored = C.getRecordStyle("highlight", 7);
        const mark = dom.window.document.createElement("mark");
        C.applyHighlightStyle(mark, stored);
        assert.equal(mark.style.textDecoration, "underline");
        assert.equal(mark.style.fontWeight, "");
        assert.equal(C.readHighlightStyleFromElement(mark).underline, true);
    });

    test("note sidecar round-trip keeps DOM and storage aligned", () => {
        const note = dom.window.document.createElement("span");
        note.className = "walkthrough-note";
        C.applyNotePreferences(note, {
            colorId: "pink",
            bold: true,
            underline: false,
            strikethrough: false,
        });
        C.setRecordStyle("note", 12, {
            bold: true,
            underline: false,
            strikethrough: false,
        });
        C.setRecordColor("note", 12, "pink");

        const restored = dom.window.document.createElement("span");
        restored.textContent = "restored";
        C.applyNoteColor(restored, C.getRecordColor("note", 12));
        C.applyNoteStyle(restored, C.getRecordStyle("note", 12));

        assert.equal(restored.style.fontWeight, "700");
        assert.equal(restored.style.textDecoration, "");
        assert.equal(restored.style.color, "rgb(157, 23, 77)");
    });
});

describe("Annotation Formatting Simplification V1 — LouAnnotationToolbar", () => {
    /** @type {JSDOM} */
    let dom;

    beforeEach(() => {
        dom = new JSDOM("<!DOCTYPE html><body></body>", {
            url: "http://localhost/",
            runScripts: "outside-only",
        });
        loadScripts(dom, ["annotation-colors.js", "annotation-toolbar.js"]);
    });

    function toolbar() {
        return dom.window.LouAnnotationToolbar.create({
            onStateChange: function () {},
        });
    }

    function click(toolbarInstance, selector) {
        toolbarInstance.element.querySelector(selector).click();
    }

    test("format buttons are mutually exclusive", () => {
        const tb = toolbar();
        click(tb, ".annotation-toolbar-format-bold");
        let state = tb.getState();
        assert.equal(state.bold, true);
        assert.equal(state.underline, false);
        assert.equal(state.strikethrough, false);
        click(tb, ".annotation-toolbar-format-underline");
        state = tb.getState();
        assert.equal(state.bold, false);
        assert.equal(state.underline, true);
        assert.equal(state.strikethrough, false);
        click(tb, ".annotation-toolbar-format-strikethrough");
        state = tb.getState();
        assert.equal(state.bold, false);
        assert.equal(state.underline, false);
        assert.equal(state.strikethrough, true);
        tb.destroy();
    });

    test("clicking active format returns to Normal", () => {
        const tb = toolbar();
        click(tb, ".annotation-toolbar-format-bold");
        click(tb, ".annotation-toolbar-format-bold");
        assert.equal(tb.getState().bold, false);
        assert.equal(tb.getState().underline, false);
        assert.equal(tb.getState().strikethrough, false);
        tb.destroy();
    });

    test("replacement bold → underline → strikethrough → bold", () => {
        const tb = toolbar();
        click(tb, ".annotation-toolbar-format-bold");
        click(tb, ".annotation-toolbar-format-underline");
        assert.equal(tb.getState().underline, true);
        click(tb, ".annotation-toolbar-format-strikethrough");
        assert.equal(tb.getState().strikethrough, true);
        click(tb, ".annotation-toolbar-format-bold");
        const state = tb.getState();
        assert.equal(state.bold, true);
        assert.equal(state.underline, false);
        assert.equal(state.strikethrough, false);
        tb.destroy();
    });

    test("setState normalizes legacy multi-flag input", () => {
        const tb = toolbar();
        tb.setState({ bold: true, underline: true, strikethrough: true });
        const state = tb.getState();
        assert.equal(state.bold, true);
        assert.equal(state.underline, false);
        assert.equal(state.strikethrough, false);
        tb.destroy();
    });

    test("color selection is independent from exclusive format", () => {
        const tb = toolbar();
        click(tb, '[data-color-id="green"]');
        click(tb, ".annotation-toolbar-format-underline");
        assert.equal(tb.getState().colorId, "green");
        assert.equal(tb.getState().underline, true);
        tb.destroy();
    });
});

describe("Annotation Formatting Simplification V1 — inline notes + highlights", () => {
    /** @type {JSDOM} */
    let dom;

    beforeEach(() => {
        dom = new JSDOM(
            `<!DOCTYPE html><body><div id="content"><div class="pedagogical-block" data-element="X"><div class="block-walkthrough" data-official="true">Alpha beta gamma.</div></div></div></body>`,
            { url: "http://localhost/", runScripts: "outside-only" }
        );
        loadScripts(dom, [
            "annotation-colors.js",
            "annotation-toolbar.js",
            "annotation-controller.js",
            "text-highlights.js",
            "inline-notes.js",
        ]);
        dom.window.localStorage.clear();
    });

    test("note edit applies exclusive style to entire note element", () => {
        const walkthrough = dom.window.document.querySelector(".block-walkthrough");
        const noteEl = dom.window.document.createElement("span");
        noteEl.className = "walkthrough-note";
        noteEl.dataset.learner = "true";
        walkthrough.appendChild(noteEl);
        dom.window.LouInlineNotes._enterEditMode(noteEl);
        dom.window.LouInlineNotes._showAnnotationToolbarForNote(noteEl);

        const toolbar = dom.window.LouAnnotationController.getToolbar();
        toolbar.element.querySelector(".annotation-toolbar-format-bold").click();
        noteEl.textContent = "abcdef";
        toolbar.element.querySelector(".annotation-toolbar-format-underline").click();

        assert.equal(noteEl.style.fontWeight, "");
        assert.equal(noteEl.style.textDecoration, "underline");
        assert.equal(noteEl.dataset.pendingNoteBold, "false");
        assert.equal(noteEl.dataset.pendingNoteUnderline, "true");
    });

    test("highlight wrapRangeInMark and sidecar stay coherent for each exclusive style", () => {
        const host = dom.window.document.getElementById("content");
        const walkthrough = host.querySelector(".block-walkthrough");
        const textNode = walkthrough.firstChild;
        const range = dom.window.document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 5);
        const H = dom.window.LouTextHighlights;
        const C = dom.window.LouAnnotationColors;

        const mark = H.wrapRangeInMark(range.cloneRange(), "blue", {
            bold: true,
            underline: false,
            strikethrough: false,
        });
        assert.equal(mark.style.fontWeight, "700");
        assert.equal(mark.style.textDecoration, "");

        C.setRecordStyle("highlight", 99, mark ? C.readHighlightStyleFromElement(mark) : {});
        const stored = C.getRecordStyle("highlight", 99);
        assert.equal(stored.bold, true);

        const mark2 = dom.window.document.createElement("mark");
        C.applyHighlightStyle(mark2, stored);
        assert.equal(mark2.style.fontWeight, "700");
        assert.equal(C.readHighlightStyleFromElement(mark2).bold, true);
    });
});
