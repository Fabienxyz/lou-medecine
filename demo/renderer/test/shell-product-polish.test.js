// Product Polish V1 — Shell content-first + annotation palette (PAS ciblé).
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

function buildShellDom() {
    const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    return new JSDOM(html, {
        url: "http://localhost/?chapter=cardio%2F234",
        runScripts: "outside-only",
    });
}

describe("Product Polish V1 — shell content-first", () => {
    test("index.html uses compact shell chrome with tabs inside header", () => {
        const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
        assert.match(html, /class="shell-chrome"/);
        assert.match(html, /id="tabs"/);
        assert.doesNotMatch(html, /min-height:600px/);
        const chromePos = html.indexOf("shell-chrome");
        const tabsPos = html.indexOf('id="tabs"');
        const contentPos = html.indexOf('id="content"');
        assert.ok(chromePos >= 0 && tabsPos > chromePos && contentPos > tabsPos);
    });

    test("search trigger is a compact icon button", () => {
        const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
        assert.match(html, /local-search-trigger shell-icon-btn/);
        assert.match(html, /aria-label="Rechercher dans cette Release"/);
    });

    test("display preferences mount as Aa trigger without inline panel", () => {
        const dom = buildShellDom();
        loadScripts(dom, ["display-preferences-apply.js", "display-preferences-ui.js"]);

        const storage = {
            async listDisplayPreferencesRecords() {
                return [];
            },
            async upsertDisplayPreferencesRecord(record) {
                return record;
            },
            async deleteDisplayPreferencesRecords() {},
            async deleteDisplayPreferencesExcept() {
                return 0;
            },
        };

        const runtime = {
            applyPatch: async function () {
                return { preferences: {} };
            },
            resetToDefaults: async function () {
                return { preferences: {} };
            },
            getCurrentPreferences: function () {
                return {
                    theme: "light",
                    fontSize: "medium",
                    readingWidth: "standard",
                };
            },
        };

        const ui = dom.window.LouDisplayPreferencesUI.create({ runtime });
        ui.mount();

        const root = dom.window.document.getElementById("display-preferences-root");
        const trigger = root.querySelector(".display-preferences-trigger");
        const popover = dom.window.document.getElementById(
            "display-preferences-popover"
        );

        assert.ok(trigger);
        assert.equal(trigger.textContent.trim(), "Aa");
        assert.equal(root.querySelector(".display-preferences-panel"), null);
        assert.ok(popover);
        assert.equal(popover.hidden, true);

        trigger.click();
        assert.equal(ui.isOpen(), true);
        assert.equal(popover.hidden, false);

        dom.window.document.body.dispatchEvent(
            new dom.window.MouseEvent("mousedown", { bubbles: true })
        );
        assert.equal(ui.isOpen(), false);
    });
});

describe("Product Polish V1.1 — AnnotationToolbar", () => {
    /** @type {JSDOM} */
    let dom;

    beforeEach(() => {
        dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
            url: "http://localhost/",
            runScripts: "outside-only",
        });
        loadScripts(dom, ["annotation-colors.js", "annotation-toolbar.js"]);
        dom.window.localStorage.clear();
    });

    test("toolbar exposes two rows with five swatches and three format toggles", () => {
        const toolbar = dom.window.LouAnnotationToolbar.create({
            onStateChange: function () {},
        });
        assert.equal(toolbar.getSwatchCount(), 5);
        assert.equal(toolbar.getFormatButtonCount(), 3);
        assert.ok(toolbar.element.querySelector(".annotation-toolbar-colors"));
        assert.ok(toolbar.element.querySelector(".annotation-toolbar-formats"));
        assert.equal(
            toolbar.element.querySelectorAll(".annotation-toolbar-swatch").length,
            5
        );
        toolbar.destroy();
    });

    test("color swatch toggles off when clicking active color", () => {
        const toolbar = dom.window.LouAnnotationToolbar.create({
            onStateChange: function () {},
        });
        toolbar.setState({ colorId: "green" });
        const green = toolbar.element.querySelector('[data-color-id="green"]');
        green.click();
        assert.equal(toolbar.getState().colorId, null);
        toolbar.destroy();
    });

    test("format buttons allow independent toggles", () => {
        const toolbar = dom.window.LouAnnotationToolbar.create({
            onStateChange: function () {},
        });
        toolbar.element.querySelector(".annotation-toolbar-format-bold").click();
        toolbar.element.querySelector(".annotation-toolbar-format-underline").click();
        const state = toolbar.getState();
        assert.equal(state.bold, true);
        assert.equal(state.underline, true);
        assert.equal(state.strikethrough, false);
        toolbar.destroy();
    });

    test("note style memory persists in localStorage sidecar", () => {
        dom.window.LouAnnotationColors.setLastNotePreferences({
            colorId: "blue",
            bold: true,
            underline: true,
            strikethrough: false,
        });
        const prefs = dom.window.LouAnnotationColors.getLastNotePreferences();
        assert.equal(prefs.colorId, "blue");
        assert.equal(prefs.bold, true);
        assert.equal(prefs.underline, true);
        assert.equal(prefs.strikethrough, false);
    });

    test("record color sidecar restores highlight color without patrimony change", () => {
        dom.window.LouAnnotationColors.setRecordColor("highlight", 42, "blue");
        const mark = dom.window.document.createElement("mark");
        dom.window.LouAnnotationColors.applyHighlightColor(
            mark,
            dom.window.LouAnnotationColors.getRecordColor("highlight", 42)
        );
        assert.equal(mark.dataset.highlightColor, "blue");
        assert.equal(mark.style.backgroundColor, "rgb(219, 234, 254)");
    });
});
