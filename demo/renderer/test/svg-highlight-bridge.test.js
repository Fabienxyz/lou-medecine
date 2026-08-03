// SVG highlight bridge — Highlight V2 engine + LouInlineFormatting backend.
import { test, describe, beforeEach, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

function loadScripts(dom, files) {
    for (const file of files) {
        dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
    }
}

function createSvgBlock(elementId, textId, label) {
    return (
        `<div id="content">` +
        `<div class="pedagogical-block" data-element="${elementId}" data-source-projection="mechanisms">` +
        `<figure class="official-visual" data-element="${elementId}">` +
        `<svg xmlns="http://www.w3.org/2000/svg" data-inline="true" data-inline-ready="true">` +
        `<text data-official-text-id="${textId}">${label}</text>` +
        `</svg></figure></div></div>`
    );
}

describe("SVG highlight bridge (Highlight V2 + LouInlineFormatting)", () => {
    /** @type {JSDOM} */
    let dom;
    /** @type {Window} */
    let window;
    /** @type {typeof window.LouTextHighlights} */
    let TH;

    before(() => {
        dom = new JSDOM(`<!DOCTYPE html><body></body>`, {
            url: "https://example.test/demo/renderer/",
            runScripts: "outside-only",
        });
        window = dom.window;
        window.indexedDB = new IDBFactory();
        window.requestAnimationFrame = (cb) => {
            cb();
            return 0;
        };
        loadScripts(dom, [
            "learner-patrimony.js",
            "learner-store.js",
            "annotation-colors.js",
            "annotation-toolbar.js",
            "annotation-controller.js",
            "inline-formatting.js",
            "text-highlights.js",
        ]);
    });

    beforeEach(async () => {
        window.indexedDB = new IDBFactory();
        window.LouLearnerStore.db = null;
        window.localStorage.clear();
        window.document.body.innerHTML = createSvgBlock(
            "MEC-oap",
            "t1",
            "OAP flow"
        );
        await window.LouLearnerStore.open();
        window.LouLearnerStore.setReleaseContext({
            releaseId: "cardio__234__2022__1",
            chapter: "cardio/234",
        });
        TH = window.LouTextHighlights;
        TH._bindContext = {
            chapter: "cardio/234",
            projection: {
                id: "mechanisms",
                visuals: { "MEC-oap": "figures/mec-oap.svg" },
            },
            store: window.LouLearnerStore,
        };
        TH.bindSelection(host(), TH._bindContext);
    });

    function liveSvg() {
        return host().querySelector(
            'svg[data-inline="true"][data-inline-ready="true"]'
        );
    }

    function backgroundRects(svg) {
        return svg.querySelectorAll(
            'rect[data-learner="true"][data-overlay-layer="background"]'
        );
    }

    function blueFill() {
        return window.LouAnnotationColors.svgBackgroundForHighlightColorId("blue");
    }

    function yellowFill() {
        return window.LouAnnotationColors.svgBackgroundForHighlightColorId("yellow");
    }

    function pinkFill() {
        return window.LouAnnotationColors.svgBackgroundForHighlightColorId("pink");
    }

    async function createHighlight(start, end) {
        selectSvgText(start, end);
        TH._onSelectionChange(host(), TH._bindContext);
        await flushAsync();
    }

    async function reselectForEdit(start, end) {
        TH.dismissToolbar();
        selectSvgText(start, end);
        TH._onSelectionChange(host(), TH._bindContext);
        await flushAsync();
    }

    function clickToolbarColor(colorId) {
        window.LouAnnotationController.getToolbar()
            .element.querySelector('[data-color-id="' + colorId + '"]')
            .click();
    }

    function host() {
        return window.document.getElementById("content");
    }

    function selectSvgText(start, end) {
        const text = host().querySelector("text").firstChild;
        const range = window.document.createRange();
        range.setStart(text, start);
        range.setEnd(text, end);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        return range;
    }

    async function flushAsync() {
        await new Promise((resolve) => window.setTimeout(resolve, 30));
    }

    test("creates SVG highlight immediately with last preferences", async () => {
        window.LouAnnotationColors.setLastHighlightPreferences({
            colorId: "pink",
            bold: false,
            underline: false,
            strikethrough: false,
        });
        selectSvgText(0, 3);
        TH._onSelectionChange(host(), TH._bindContext);
        await flushAsync();

        const overlay = host().querySelector(
            'rect[data-learner="true"][data-overlay-layer="background"]'
        );
        assert.ok(overlay, "background overlay created");
        assert.equal(
            overlay.getAttribute("fill"),
            window.LouAnnotationColors.svgBackgroundForHighlightColorId("pink")
        );
        assert.equal(window.LouAnnotationController.isHighlightEditActive(), true);
        assert.equal(TH._editContext.kind, "svg");
        const toolbar = window.LouAnnotationController.getToolbar();
        assert.equal(toolbar.areFormatControlsVisible(), false);
        assert.equal(
            toolbar.element.querySelector(".annotation-toolbar-formats").hidden,
            true
        );
        assert.ok(
            toolbar.element.querySelector(".annotation-toolbar-colors")
        );
        assert.ok(toolbar.element.querySelector(".annotation-toolbar-erase"));
    });

    test("toolbar color change updates SVG overlay", async () => {
        await createHighlight(0, 3);

        clickToolbarColor("blue");
        await flushAsync();

        const overlay = host().querySelector(
            'rect[data-learner="true"][data-overlay-layer="background"]'
        );
        assert.equal(overlay.getAttribute("fill"), blueFill());
    });

    test("re-select edit path changes yellow to blue on live SVG", async () => {
        await createHighlight(0, 3);
        await reselectForEdit(0, 3);

        assert.equal(TH._editContext.kind, "svg");
        assert.equal(TH._editContext.element, "MEC-oap");
        assert.equal(TH._editContext.selectionRange, undefined);
        assert.ok(TH._editContext.recordId != null);

        clickToolbarColor("blue");
        await flushAsync();

        const rects = backgroundRects(liveSvg());
        assert.equal(rects.length, 1);
        assert.equal(rects[0].getAttribute("fill"), blueFill());
        assert.equal(window.LouAnnotationController.isHighlightEditActive(), true);
    });

    test("color change after SVG DOM replacement paints live figure only", async () => {
        await createHighlight(0, 3);
        await reselectForEdit(0, 3);

        const staleSvg = liveSvg();
        const figure = host().querySelector("figure");
        figure.innerHTML =
            '<svg xmlns="http://www.w3.org/2000/svg" data-inline="true" data-inline-ready="true">' +
            '<text data-official-text-id="t1">OAP flow</text></svg>';
        const replacedLiveSvg = liveSvg();
        assert.notEqual(staleSvg, replacedLiveSvg);

        clickToolbarColor("blue");
        await flushAsync();

        assert.equal(backgroundRects(replacedLiveSvg).length, 1);
        assert.equal(
            backgroundRects(replacedLiveSvg)[0].getAttribute("fill"),
            blueFill()
        );
        if (backgroundRects(staleSvg).length) {
            assert.equal(
                backgroundRects(staleSvg)[0].getAttribute("fill"),
                yellowFill(),
                "detached SVG must not receive the new color"
            );
        }
    });

    test("new highlight succeeds after edit color change", async () => {
        await createHighlight(0, 3);
        await reselectForEdit(0, 3);
        clickToolbarColor("blue");
        await flushAsync();

        TH.dismissToolbar();
        await createHighlight(4, 7);

        const svg = liveSvg();
        assert.equal(backgroundRects(svg).length, 2);
        const rows = await window.LouLearnerStore.listSvgTextFormats(
            "cardio/234",
            "mechanisms",
            "MEC-oap"
        );
        assert.equal(rows.length, 2);
    });

    test("repeated edit color changes stay on live SVG", async () => {
        await createHighlight(0, 3);
        await reselectForEdit(0, 3);

        clickToolbarColor("blue");
        await flushAsync();
        assert.equal(backgroundRects(liveSvg())[0].getAttribute("fill"), blueFill());

        clickToolbarColor("pink");
        await flushAsync();
        assert.equal(backgroundRects(liveSvg())[0].getAttribute("fill"), pinkFill());
    });

    test("eraser after edit removes live overlay and store record", async () => {
        await createHighlight(0, 3);
        await reselectForEdit(0, 3);
        clickToolbarColor("blue");
        await flushAsync();

        window.LouAnnotationController.getToolbar()
            .element.querySelector(".annotation-toolbar-erase")
            .click();
        await flushAsync();

        assert.equal(backgroundRects(liveSvg()).length, 0);
        const rows = await window.LouLearnerStore.listSvgTextFormats(
            "cardio/234",
            "mechanisms",
            "MEC-oap"
        );
        assert.equal(rows.length, 0);
        assert.equal(window.LouAnnotationController.isHighlightEditActive(), false);
    });

    test("color change dismisses toolbar when projection visuals unavailable", async () => {
        await createHighlight(0, 3);
        await reselectForEdit(0, 3);

        const rowsBefore = await window.LouLearnerStore.listSvgTextFormats(
            "cardio/234",
            "mechanisms",
            "MEC-oap"
        );
        TH._bindContext = {
            chapter: "cardio/234",
            projection: { id: "mechanisms" },
            store: window.LouLearnerStore,
        };

        clickToolbarColor("blue");
        await flushAsync();

        assert.equal(window.LouAnnotationController.isHighlightEditActive(), false);
        assert.equal(TH._editContext, null);
        const rowsAfter = await window.LouLearnerStore.listSvgTextFormats(
            "cardio/234",
            "mechanisms",
            "MEC-oap"
        );
        assert.equal(rowsAfter.length, rowsBefore.length);
        assert.equal(
            backgroundRects(liveSvg())[0].getAttribute("fill"),
            yellowFill()
        );
    });

    test("create dismisses toolbar when overlay measurement fails", async () => {
        const IF = window.LouInlineFormatting;
        const original = IF._measureTextSegment.bind(IF);
        IF._measureTextSegment = function () {
            return null;
        };
        try {
            selectSvgText(0, 3);
            TH._onSelectionChange(host(), TH._bindContext);
            await flushAsync();

            assert.equal(window.LouAnnotationController.isHighlightEditActive(), false);
            assert.equal(TH._editContext, null);
            assert.equal(backgroundRects(liveSvg()).length, 0);
            const rows = await window.LouLearnerStore.listSvgTextFormats(
                "cardio/234",
                "mechanisms",
                "MEC-oap"
            );
            assert.equal(rows.length, 0);
        } finally {
            IF._measureTextSegment = original;
        }
    });

    test("create dismisses toolbar when live SVG cannot be resolved", async () => {
        selectSvgText(0, 3);
        host().querySelector("figure").innerHTML = "";
        TH._onSelectionChange(host(), TH._bindContext);
        await flushAsync();

        assert.equal(window.LouAnnotationController.isHighlightEditActive(), false);
        assert.equal(TH._editContext, null);
        const rows = await window.LouLearnerStore.listSvgTextFormats(
            "cardio/234",
            "mechanisms",
            "MEC-oap"
        );
        assert.equal(rows.length, 0);
    });

    test("eraser removes SVG highlight overlay and store record", async () => {
        selectSvgText(0, 3);
        TH._onSelectionChange(host(), TH._bindContext);
        await flushAsync();

        window.LouAnnotationController.getToolbar()
            .element.querySelector(".annotation-toolbar-erase")
            .click();
        await flushAsync();

        assert.equal(
            host().querySelectorAll(
                'rect[data-learner="true"][data-overlay-layer="background"]'
            ).length,
            0
        );
        const rows = await window.LouLearnerStore.listSvgTextFormats(
            "cardio/234",
            "mechanisms",
            "MEC-oap"
        );
        assert.equal(rows.length, 0);
    });

    test("restore after reload keeps SVG highlight overlay", async () => {
        selectSvgText(0, 3);
        TH._onSelectionChange(host(), TH._bindContext);
        await flushAsync();

        host().innerHTML = createSvgBlock("MEC-oap", "t1", "OAP flow");
        await window.LouInlineFormatting.restore(host(), {
            chapter: "cardio/234",
            projection: { id: "mechanisms" },
            store: window.LouLearnerStore,
        });

        const overlay = host().querySelector(
            'rect[data-learner="true"][data-overlay-layer="background"]'
        );
        assert.ok(overlay);
        assert.equal(
            overlay.getAttribute("fill"),
            window.LouAnnotationColors.svgBackgroundForHighlightColorId("yellow")
        );
    });

    test("SVG without data-official-text-id degrades silently", () => {
        host().querySelector("text").removeAttribute("data-official-text-id");
        selectSvgText(0, 3);
        TH._onSelectionChange(host(), TH._bindContext);
        assert.equal(window.LouAnnotationController.isHighlightEditActive(), false);
        assert.equal(
            host().querySelectorAll(
                'rect[data-learner="true"][data-overlay-layer="background"]'
            ).length,
            0
        );
    });

    test("HTML highlight path unchanged when prose present", async () => {
        host().innerHTML =
            `<div class="pedagogical-block" data-element="X" data-source-projection="mechanisms">` +
            `<div class="block-walkthrough" data-official="true">Alpha beta gamma.</div></div>`;
        TH._bindContext.store = {
            addTextHighlight: () => Promise.resolve(42),
        };
        const walkthrough = host().querySelector(".block-walkthrough");
        const range = TH._rangeFromTextOffsets(walkthrough, 0, 5);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        TH._onSelectionChange(host(), TH._bindContext);
        await flushAsync();

        const mark = host().querySelector("mark.learner-highlight");
        assert.ok(mark);
        assert.equal(TH._editContext.kind, "html");
        assert.equal(mark.classList.contains("is-editing"), true);
    });
});
