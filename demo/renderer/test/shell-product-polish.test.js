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

describe("Product Polish V1 — AnnotationColorPalette", () => {
    /** @type {JSDOM} */
    let dom;

    beforeEach(() => {
        dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
            url: "http://localhost/",
            runScripts: "outside-only",
        });
        loadScripts(dom, ["annotation-colors.js", "annotation-color-palette.js"]);
        dom.window.localStorage.clear();
    });

    test("palette exposes exactly five swatches without plus control", () => {
        const palette = dom.window.LouAnnotationColorPalette.create({
            onSelect: function () {},
        });
        assert.equal(palette.getSwatchCount(), 5);
        assert.equal(
            palette.element.querySelectorAll(".annotation-color-palette-swatch").length,
            5
        );
        assert.equal(palette.element.textContent.includes("+"), false);
        palette.destroy();
    });

    test("selecting a swatch invokes callback and closes on consumer action", () => {
        let chosen = null;
        const palette = dom.window.LouAnnotationColorPalette.create({
            selectedColorId: "green",
            onSelect: function (colorId) {
                chosen = colorId;
                palette.hide();
            },
        });
        palette.showNearRect({ left: 40, top: 40, width: 80, height: 20, right: 120, bottom: 60 });
        const swatch = palette.element.querySelector('[data-color-id="pink"]');
        swatch.click();
        assert.equal(chosen, "pink");
        palette.destroy();
    });

    test("last highlight color persists in localStorage", () => {
        dom.window.LouAnnotationColors.setLastHighlightColorId("violet");
        assert.equal(dom.window.LouAnnotationColors.getLastHighlightColorId(), "violet");
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
