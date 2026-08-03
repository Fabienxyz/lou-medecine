// Shell V1 — S1 legacy chrome removal (20-READER-V1-SHELL-ARCHITECTURE.md §8.1).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

const LEGACY_MARKERS = [
  "Preview",
  "Lou Learning Companion",
  "Progression",
  "Comprendre avant de mémoriser",
  "Concept précédent",
  "Concept suivant",
  "À la fin de cette page",
];

function loadScripts(dom, files) {
  for (const file of files) {
    const code = fs.readFileSync(path.join(ROOT, file), "utf8");
    dom.window.eval(code);
  }
}

describe("Shell V1 S1 — index.html chrome", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

  test("static shell exposes Lou Médecine identity and minimal reader chrome", () => {
    assert.match(html, /Lou Médecine/);
    assert.match(html, /shell-header/);
    assert.match(html, /shell-brand/);
    assert.match(html, /id="chapter-title"/);
    assert.match(html, /id="tabs"/);
    assert.match(html, /id="content"/);
    assert.match(html, /id="local-search-trigger"/);
    assert.match(html, /id="display-preferences-root"/);
  });

  for (const marker of LEGACY_MARKERS) {
    test(`static shell does not contain legacy marker: ${marker}`, () => {
      assert.equal(html.includes(marker), false, `found "${marker}" in index.html`);
    });
  }

  test("static shell has no legacy structural classes", () => {
    assert.equal(html.includes('class="badge"'), false);
    assert.equal(html.includes('class="progression"'), false);
    assert.equal(html.includes('class="objectives"'), false);
    assert.equal(html.includes('class="philosophy"'), false);
    assert.equal(html.includes("footer-nav"), false);
  });
});

describe("Shell V1 S1 — renderer content without footer", () => {
  test("showMessage does not inject footer navigation", () => {
    const dom = new JSDOM(
      '<!DOCTYPE html><html><body><div id="content"></div></body></html>',
      { url: "http://localhost/", runScripts: "outside-only" }
    );
    loadScripts(dom, ["renderer.js"]);
    const renderer = dom.window.LouRenderer;
    renderer.init(dom.window.document.getElementById("content"), {});

    renderer.showMessage("Test status", { state: "planned" });

    const content = dom.window.document.getElementById("content");
    assert.ok(content.querySelector(".content-status"));
    assert.equal(content.querySelector(".footer-nav"), null);
  });

  test("showViewQcmList does not inject footer navigation", () => {
    const dom = new JSDOM(
      '<!DOCTYPE html><html><body><div id="content"></div></body></html>',
      { url: "http://localhost/", runScripts: "outside-only" }
    );
    loadScripts(dom, ["config.js", "renderer.js"]);
    const renderer = dom.window.LouRenderer;
    renderer.init(dom.window.document.getElementById("content"), {});

    renderer.showViewQcmList(
      { questions: [{ questionId: "q-test-01" }] },
      dom.window.LouConfig
    );

    const content = dom.window.document.getElementById("content");
    assert.ok(content.querySelector(".view-qcm-list"));
    assert.equal(content.querySelector(".footer-nav"), null);
  });
});
