// Product Polish V1.1 — annotation toolbar, zoom icon, overlay neutrality (PAS ciblé).
import { test, describe, beforeEach, before } from "node:test";
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

describe("Product Polish V1.1 — overlay toolbar neutrality", () => {
    /** @type {JSDOM} */
    let dom;

    beforeEach(() => {
        dom = new JSDOM(
            `<!DOCTYPE html><body><div id="content"><div class="pedagogical-block" data-element="X"><div class="block-walkthrough" data-official="true">Alpha beta gamma delta.</div></div></div></body>`,
            { url: "http://localhost/", runScripts: "outside-only" }
        );
        dom.window.requestAnimationFrame = (cb) => {
            cb();
            return 0;
        };
        loadScripts(dom, [
            "annotation-colors.js",
            "annotation-toolbar.js",
            "annotation-controller.js",
            "text-highlights.js",
        ]);
        dom.window.localStorage.clear();
        dom.window.LouAnnotationColors.setLastHighlightColorId("violet");
        dom.window.LouAnnotationColors.setLastNotePreferences({
            colorId: "pink",
            bold: true,
            underline: false,
            strikethrough: false,
        });
    });

    test("new text selection opens toolbar with no active color or format", () => {
        const host = dom.window.document.getElementById("content");
        const walkthrough = host.querySelector(".block-walkthrough");
        const textNode = walkthrough.firstChild;
        const range = dom.window.document.createRange();
        range.setStart(textNode, 0);
        range.setEnd(textNode, 5);
        range.getBoundingClientRect = () => ({
            left: 10,
            top: 20,
            width: 80,
            height: 16,
            right: 90,
            bottom: 36,
        });
        dom.window.getSelection().removeAllRanges();
        dom.window.getSelection().addRange(range);

        dom.window.LouTextHighlights._selectionContext = {
            host: host,
            context: {
                chapter: "cardio/234",
                store: { addTextHighlight: () => Promise.resolve(1) },
            },
            officialRoot: walkthrough,
            element: "X",
            sourceProjection: null,
            range: range,
        };
        dom.window.LouTextHighlights._showToolbar(range);

        const toolbar = dom.window.LouAnnotationController.getToolbar();
        assert.ok(toolbar);
        assert.equal(
            dom.window.document.querySelectorAll(".annotation-toolbar").length,
            1
        );
        assert.equal(toolbar.isVisible(), true);
        const state = toolbar.getState();
        assert.equal(state.colorId, null);
        assert.equal(state.bold, false);
        assert.equal(state.underline, false);
        assert.equal(state.strikethrough, false);
    });
});

describe("Product Polish V1.1 — figure zoom trigger", () => {
    /** @type {JSDOM} */
    let dom;

    before(() => {
        dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
            url: "http://localhost/",
            runScripts: "outside-only",
        });
        loadScripts(dom, ["figure-zoom.js"]);
    });

    test("figure click does not open zoom; trigger icon does", () => {
        const host = dom.window.document.createElement("div");
        const figure = dom.window.document.createElement("figure");
        figure.className = "official-visual";
        figure.dataset.element = "FIG-1";
        const svg = dom.window.document.createElementNS(
            "http://www.w3.org/2000/svg",
            "svg"
        );
        svg.setAttribute("data-inline-ready", "true");
        figure.appendChild(svg);
        host.appendChild(figure);
        dom.window.document.body.appendChild(host);

        dom.window.LouFigureZoom.bind(host);
        figure.dispatchEvent(
            new dom.window.MouseEvent("click", { bubbles: true })
        );
        assert.equal(dom.window.document.querySelector(".figure-zoom-overlay"), null);

        const trigger = figure.querySelector(".figure-zoom-trigger");
        assert.ok(trigger);
        trigger.dispatchEvent(
            new dom.window.MouseEvent("click", { bubbles: true })
        );
        assert.ok(dom.window.document.querySelector(".figure-zoom-overlay"));
        dom.window.LouFigureZoom.close();
    });
});
