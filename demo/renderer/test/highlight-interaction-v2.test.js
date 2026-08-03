// Highlight Interaction V2 — immediate creation, live edit, no nesting (PAS ciblé).
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
    return `<!DOCTYPE html><body><div id="content"><div class="pedagogical-block" data-element="X" data-source-projection="mechanisms"><div class="block-walkthrough" data-official="true">Alpha beta gamma delta epsilon.</div></div></div></body>`;
}

describe("Highlight Interaction V2", () => {
    /** @type {JSDOM} */
    let dom;
    /** @type {Window} */
    let window;
    /** @type {import("../text-highlights.js")} */
    let TH;

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
        TH = window.LouTextHighlights;
        TH._bindContext = {
            chapter: "cardio/234",
            projection: { id: "mechanisms" },
            store: {
                addTextHighlight: () => Promise.resolve(101),
            },
        };
    });

    function rangeForText(start, end) {
        const walkthrough = window.document.querySelector(".block-walkthrough");
        const range = TH._rangeFromTextOffsets(walkthrough, start, end);
        assert.ok(range, `range ${start}-${end} must resolve`);
        return range;
    }

    function selectRange(range) {
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }

    async function flushAsync() {
        await new Promise((resolve) => window.setTimeout(resolve, 20));
    }

    function host() {
        return window.document.getElementById("content");
    }

    test("mouseup on valid selection creates highlight immediately with last preferences", async () => {
        window.LouAnnotationColors.setLastHighlightPreferences({
            colorId: "pink",
            bold: false,
            underline: true,
            strikethrough: false,
        });
        selectRange(rangeForText(0, 5));
        TH._onSelectionChange(host(), TH._bindContext);
        await flushAsync();

        const mark = host().querySelector("mark.learner-highlight");
        assert.ok(mark, "mark created on selection");
        assert.equal(mark.dataset.highlightColor, "pink");
        assert.equal(mark.style.textDecoration, "underline");
        assert.equal(mark.classList.contains("is-editing"), true);
        assert.equal(window.LouAnnotationController.isHighlightEditActive(), true);
        assert.equal(
            window.LouAnnotationController.getToolbar().getState().colorId,
            "pink"
        );
    });

    test("toolbar color change updates DOM, sidecar and preferences without recreating mark", async () => {
        selectRange(rangeForText(6, 10));
        TH._onSelectionChange(host(), TH._bindContext);
        await flushAsync();
        const mark = host().querySelector("mark.learner-highlight");
        const markRef = mark;

        window.LouAnnotationController.getToolbar()
            .element.querySelector('[data-color-id="black"]')
            .click();
        assert.equal(markRef, host().querySelector("mark.learner-highlight"));
        assert.equal(markRef.dataset.highlightColor, "black");

        window.LouAnnotationController.getToolbar()
            .element.querySelector(".annotation-toolbar-format-bold")
            .click();
        assert.equal(markRef.style.fontWeight, "700");
        assert.equal(host().querySelectorAll("mark.learner-highlight").length, 1);

        const prefs = window.LouAnnotationColors.getLastHighlightPreferences();
        assert.equal(prefs.colorId, "black");
        assert.equal(prefs.bold, true);
        assert.equal(
            window.LouAnnotationColors.getRecordColor("highlight", 101),
            "black"
        );
    });

    test("partial selection inside existing highlight opens edit on entire mark", async () => {
        const walkthrough = host().querySelector(".block-walkthrough");
        const fullRange = rangeForText(0, 5);
        const mark = TH.wrapRangeInMark(fullRange.cloneRange(), "yellow", {
            bold: false,
            underline: false,
            strikethrough: false,
        });
        mark.dataset.highlightId = "55";

        selectRange(rangeForText(1, 3));
        TH._onSelectionChange(host(), TH._bindContext);

        assert.equal(host().querySelectorAll("mark.learner-highlight").length, 1);
        assert.equal(TH._editContext.mark, mark);
        assert.equal(mark.classList.contains("is-editing"), true);
        assert.equal(
            window.LouAnnotationController.getToolbar().getState().colorId,
            "yellow"
        );
        assert.equal(mark.textContent, walkthrough.textContent.slice(0, 5));
    });

    test("selection touching highlight does not create nested highlight", async () => {
        const mark = TH.wrapRangeInMark(rangeForText(0, 5).cloneRange(), "green", {
            bold: false,
            underline: false,
            strikethrough: false,
        });
        mark.dataset.highlightId = "77";

        selectRange(rangeForText(2, 8));
        TH._onSelectionChange(host(), TH._bindContext);

        assert.equal(host().querySelectorAll("mark.learner-highlight").length, 1);
        assert.equal(TH._editContext.mark, mark);
    });

    test("dismiss removes editing accent from mark", async () => {
        selectRange(rangeForText(0, 4));
        TH._onSelectionChange(host(), TH._bindContext);
        await flushAsync();
        const mark = host().querySelector("mark.learner-highlight");
        assert.equal(mark.classList.contains("is-editing"), true);
        TH.dismissToolbar();
        assert.equal(mark.classList.contains("is-editing"), false);
    });

    test("restore after reload keeps highlight presentation", async () => {
        const walkthrough = host().querySelector(".block-walkthrough");
        const range = rangeForText(0, 5);
        const selector = TH.selectorFromRange(walkthrough, range);
        window.LouAnnotationColors.setRecordColor("highlight", 9, "blue");
        window.LouAnnotationColors.setRecordStyle("highlight", 9, {
            bold: true,
            underline: false,
            strikethrough: false,
        });

        await TH.restore(host(), {
            chapter: "cardio/234",
            projection: { id: "mechanisms" },
            store: {
                listTextHighlights: async () => [
                    {
                        id: 9,
                        element: "X",
                        projection: "mechanisms",
                        selector: selector,
                    },
                ],
            },
        });

        const mark = host().querySelector("mark.learner-highlight");
        assert.ok(mark);
        assert.equal(mark.dataset.highlightColor, "blue");
        assert.equal(mark.style.fontWeight, "700");
        assert.equal(mark.dataset.highlightId, "9");
    });

    test("last highlight preferences apply to the next created highlight", async () => {
        selectRange(rangeForText(0, 5));
        TH._onSelectionChange(host(), TH._bindContext);
        await flushAsync();
        window.LouAnnotationController.getToolbar()
            .element.querySelector('[data-color-id="green"]')
            .click();
        TH.dismissToolbar();

        selectRange(rangeForText(6, 11));
        TH._onSelectionChange(host(), TH._bindContext);
        await flushAsync();

        const marks = host().querySelectorAll("mark.learner-highlight");
        assert.equal(marks.length, 2);
        assert.equal(marks[1].dataset.highlightColor, "green");
    });

    test("note preferences remain independent from highlight edits", async () => {
        window.LouAnnotationColors.setLastNotePreferences({
            colorId: "blue",
            bold: true,
            underline: false,
            strikethrough: false,
        });
        selectRange(rangeForText(0, 5));
        TH._onSelectionChange(host(), TH._bindContext);
        await flushAsync();
        window.LouAnnotationController.getToolbar()
            .element.querySelector('[data-color-id="pink"]')
            .click();

        const notePrefs = window.LouAnnotationColors.getLastNotePreferences();
        assert.equal(notePrefs.colorId, "blue");
        assert.equal(notePrefs.bold, true);
    });

    test("selection intersecting two highlights dismisses toolbar", () => {
        TH.wrapRangeInMark(rangeForText(0, 5).cloneRange(), "yellow", {
            bold: false,
            underline: false,
            strikethrough: false,
        });
        TH.wrapRangeInMark(rangeForText(6, 11).cloneRange(), "pink", {
            bold: false,
            underline: false,
            strikethrough: false,
        });

        selectRange(rangeForText(3, 9));
        TH._onSelectionChange(host(), TH._bindContext);

        assert.equal(window.LouAnnotationController.isHighlightEditActive(), false);
        assert.equal(host().querySelectorAll("mark.learner-highlight").length, 2);
    });

    test("block-question title selection resolves selector and creates highlight", () => {
        const block = host().querySelector(".pedagogical-block");
        block.innerHTML =
            '<h2 class="block-question" data-official="true">Question title here</h2>' +
            '<div class="block-walkthrough" data-official="true">Body text.</div>';
        const question = block.querySelector(".block-question");
        const range = window.document.createRange();
        range.selectNodeContents(question);
        selectRange(range);
        TH._onSelectionChange(host(), TH._bindContext);

        assert.ok(host().querySelector("mark.learner-highlight"));
        assert.equal(window.LouAnnotationController.isHighlightEditActive(), true);
    });
});
