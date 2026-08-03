// Highlight Bold Visibility Hardening — CSS conflict, legacy normalization, computed style.
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

function loadHighlightCss(dom) {
    const css = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");
    const style = dom.window.document.createElement("style");
    style.textContent = css;
    dom.window.document.head.appendChild(style);
}

function blockHtml(extra = "") {
    return `<!DOCTYPE html><body><div id="content"><div class="pedagogical-block" data-element="X" data-source-projection="mechanisms">${extra}<div class="block-walkthrough" data-official="true">Alpha beta gamma delta.</div></div></div></body>`;
}

describe("Highlight Bold Visibility Hardening — CSS rules", () => {
    test("underline and strikethrough rules do not set font-weight", () => {
        const css = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");
        const underlineBlock = css.match(
            /mark\.learner-highlight\[data-highlight-underline="true"\]\{([^}]+)\}/
        );
        const strikeBlock = css.match(
            /mark\.learner-highlight\[data-highlight-strikethrough="true"\]\{([^}]+)\}/
        );
        assert.ok(underlineBlock, "underline rule must exist");
        assert.ok(strikeBlock, "strikethrough rule must exist");
        assert.doesNotMatch(
            underlineBlock[1],
            /font-weight/i,
            "underline rule must not touch font-weight"
        );
        assert.doesNotMatch(
            strikeBlock[1],
            /font-weight/i,
            "strikethrough rule must not touch font-weight"
        );
    });

    test("bold rule pins Inter wght axis and restores subpixel smoothing", () => {
        const css = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");
        const boldBlock = css.match(
            /mark\.learner-highlight\[data-highlight-bold="true"\]\{([^}]+)\}/
        );
        assert.ok(boldBlock, "bold rule must exist");
        assert.match(boldBlock[1], /font-weight:\s*700/);
        assert.match(boldBlock[1], /font-variation-settings/);
        assert.match(boldBlock[1], /-webkit-font-smoothing:\s*auto/);
    });
});

describe("Highlight Bold Visibility Hardening — legacy multi-flag CSS + normalization", () => {
    /** @type {JSDOM} */
    let dom;
    /** @type {import("../annotation-colors.js")} */
    let C;

    beforeEach(() => {
        dom = new JSDOM(blockHtml(), {
            url: "http://localhost/",
            runScripts: "outside-only",
        });
        loadHighlightCss(dom);
        loadScripts(dom, ["annotation-colors.js"]);
        C = dom.window.LouAnnotationColors;
    });

    function computedWeight(mark) {
        return dom.window.getComputedStyle(mark).fontWeight;
    }

    function legacyMark(flags) {
        const mark = dom.window.document.createElement("mark");
        mark.className = "learner-highlight";
        mark.dataset.highlightBold = flags.bold ? "true" : "false";
        mark.dataset.highlightUnderline = flags.underline ? "true" : "false";
        mark.dataset.highlightStrikethrough = flags.strikethrough
            ? "true"
            : "false";
        mark.textContent = "legacy";
        dom.window.document.body.appendChild(mark);
        return mark;
    }

    test("legacy bold + underline keeps computed bold weight before JS normalize", () => {
        const mark = legacyMark({
            bold: true,
            underline: true,
            strikethrough: false,
        });
        assert.equal(computedWeight(mark), "700");
    });

    test("legacy bold + strikethrough keeps computed bold weight before JS normalize", () => {
        const mark = legacyMark({
            bold: true,
            underline: false,
            strikethrough: true,
        });
        assert.equal(computedWeight(mark), "700");
    });

    test("legacy all three flags keeps computed bold weight before JS normalize", () => {
        const mark = legacyMark({
            bold: true,
            underline: true,
            strikethrough: true,
        });
        assert.equal(computedWeight(mark), "700");
    });

    test("applyHighlightStyle normalizes legacy bold + underline to exclusive Gras", () => {
        const mark = legacyMark({
            bold: true,
            underline: true,
            strikethrough: false,
        });
        C.applyHighlightStyle(mark, C.readHighlightStyleFromElement(mark));
        assert.equal(mark.dataset.highlightBold, "true");
        assert.equal(mark.dataset.highlightUnderline, "false");
        assert.equal(mark.dataset.highlightStrikethrough, "false");
        assert.equal(mark.style.fontWeight, C.HIGHLIGHT_BOLD_WEIGHT);
        assert.equal(mark.style.textDecoration, "");
        assert.equal(computedWeight(mark), "700");
    });

    test("applyHighlightStyle normalizes legacy bold + strikethrough to exclusive Gras", () => {
        const mark = legacyMark({
            bold: true,
            underline: false,
            strikethrough: true,
        });
        C.applyHighlightStyle(mark, C.readHighlightStyleFromElement(mark));
        assert.equal(mark.dataset.highlightBold, "true");
        assert.equal(mark.dataset.highlightUnderline, "false");
        assert.equal(mark.dataset.highlightStrikethrough, "false");
        assert.equal(computedWeight(mark), "700");
    });
});

describe("Highlight Bold Visibility Hardening — exclusive style transitions", () => {
    /** @type {JSDOM} */
    let dom;
    /** @type {Window} */
    let window;
    /** @type {import("../annotation-colors.js")} */
    let C;

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
        loadHighlightCss(dom);
        loadScripts(dom, [
            "annotation-colors.js",
            "annotation-toolbar.js",
            "annotation-controller.js",
            "text-highlights.js",
        ]);
        C = window.LouAnnotationColors;
        window.localStorage.clear();
        window.LouTextHighlights._bindContext = {
            chapter: "cardio/234",
            projection: { id: "mechanisms" },
            store: { addTextHighlight: () => Promise.resolve(1) },
        };
    });

    function host() {
        return window.document.getElementById("content");
    }

    function rangeForText(start, end) {
        const walkthrough = host().querySelector(".block-walkthrough");
        return window.LouTextHighlights._rangeFromTextOffsets(
            walkthrough,
            start,
            end
        );
    }

    function selectRange(range) {
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    }

    function clickFormat(selector) {
        window.LouAnnotationController.getToolbar()
            .element.querySelector(selector)
            .click();
    }

    function assertNormal(mark) {
        assert.equal(mark.dataset.highlightBold, "false");
        assert.equal(mark.dataset.highlightUnderline, "false");
        assert.equal(mark.dataset.highlightStrikethrough, "false");
        assert.equal(mark.style.fontWeight, "");
        assert.equal(mark.style.textDecoration, "");
        const weight = window.getComputedStyle(mark).fontWeight;
        assert.ok(
            weight === "400" || weight === "normal",
            `expected normal weight, got ${weight}`
        );
    }

    function assertBold(mark) {
        assert.equal(mark.dataset.highlightBold, "true");
        assert.equal(mark.dataset.highlightUnderline, "false");
        assert.equal(mark.dataset.highlightStrikethrough, "false");
        assert.equal(mark.style.fontWeight, C.HIGHLIGHT_BOLD_WEIGHT);
        assert.equal(mark.style.textDecoration, "");
        assert.equal(window.getComputedStyle(mark).fontWeight, "700");
    }

    function assertUnderline(mark) {
        assert.equal(mark.dataset.highlightBold, "false");
        assert.equal(mark.dataset.highlightUnderline, "true");
        assert.equal(mark.dataset.highlightStrikethrough, "false");
        assert.equal(mark.style.textDecoration, "underline");
        const deco = window.getComputedStyle(mark).textDecorationLine;
        assert.ok(
            deco === "underline" || mark.style.textDecoration === "underline",
            `expected underline decoration, got ${deco}`
        );
    }

    function assertStrikethrough(mark) {
        assert.equal(mark.dataset.highlightBold, "false");
        assert.equal(mark.dataset.highlightUnderline, "false");
        assert.equal(mark.dataset.highlightStrikethrough, "true");
        assert.equal(mark.style.textDecoration, "line-through");
        const deco = window.getComputedStyle(mark).textDecorationLine;
        assert.ok(
            deco === "line-through" || mark.style.textDecoration === "line-through",
            `expected line-through decoration, got ${deco}`
        );
    }

    test("Normal → Gras → Souligné → Gras → Barré → Gras → Normal", async () => {
        C.setLastHighlightPreferences({
            colorId: "yellow",
            bold: false,
            underline: false,
            strikethrough: false,
        });
        selectRange(rangeForText(0, 5));
        window.LouTextHighlights._onSelectionChange(
            host(),
            window.LouTextHighlights._bindContext
        );
        await new Promise((r) => window.setTimeout(r, 20));

        const mark = host().querySelector("mark.learner-highlight");
        assert.ok(mark);
        assertNormal(mark);

        clickFormat(".annotation-toolbar-format-bold");
        assertBold(mark);

        clickFormat(".annotation-toolbar-format-underline");
        assertUnderline(mark);

        clickFormat(".annotation-toolbar-format-bold");
        assertBold(mark);

        clickFormat(".annotation-toolbar-format-strikethrough");
        assertStrikethrough(mark);

        clickFormat(".annotation-toolbar-format-bold");
        assertBold(mark);

        clickFormat(".annotation-toolbar-format-bold");
        assertNormal(mark);
    });

    test("Souligné → Gras and Barré → Gras use computed bold weight", async () => {
        C.setLastHighlightPreferences({
            colorId: "yellow",
            bold: false,
            underline: true,
            strikethrough: false,
        });
        selectRange(rangeForText(0, 5));
        window.LouTextHighlights._onSelectionChange(
            host(),
            window.LouTextHighlights._bindContext
        );
        await new Promise((r) => window.setTimeout(r, 20));

        const mark = host().querySelector("mark.learner-highlight");
        assertUnderline(mark);

        clickFormat(".annotation-toolbar-format-bold");
        assertBold(mark);

        clickFormat(".annotation-toolbar-format-strikethrough");
        assertStrikethrough(mark);

        clickFormat(".annotation-toolbar-format-bold");
        assertBold(mark);
    });

    test("reload restores Gras with computed font-weight", async () => {
        const walkthrough = host().querySelector(".block-walkthrough");
        const range = rangeForText(0, 5);
        const selector = window.LouTextHighlights.selectorFromRange(
            walkthrough,
            range
        );
        C.setRecordColor("highlight", 42, "yellow");
        C.setRecordStyle("highlight", 42, {
            bold: true,
            underline: false,
            strikethrough: false,
        });

        await window.LouTextHighlights.restore(host(), {
            chapter: "cardio/234",
            projection: { id: "mechanisms" },
            store: {
                listTextHighlights: async () => [
                    {
                        id: 42,
                        element: "X",
                        projection: "mechanisms",
                        selector,
                    },
                ],
            },
        });

        const mark = host().querySelector("mark.learner-highlight");
        assertBold(mark);
    });
});
