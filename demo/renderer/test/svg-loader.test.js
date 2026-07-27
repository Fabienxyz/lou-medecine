/**
 * Renderer V2.3 M2 — SVG loader and async pipeline (unit).
 */
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const CHAPTER = "cardio/234";

const VALID_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
  '<text data-official-text-id="t1">OAP</text></svg>';

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

function manifestFixture() {
  return {
    chapter: CHAPTER,
    projections: [
      {
        id: "mechanisms",
        type: "understanding.mechanisms",
        path: "projections/understanding/mechanisms.md",
        status: "published",
        elements: ["MEC-oap", "MEC-output-basics"],
        visuals: {
          "MEC-oap": "figures/mec-oap.svg",
          "MEC-output-basics": "figures/mec-output-basics.svg",
        },
      },
    ],
    visuals: [
      {
        id: "mec-oap",
        element: "MEC-oap",
        path: "figures/mec-oap.svg",
        alt: "Congestion pulmonaire → seuil PPC → transsudat → OAP cardiogénique",
      },
      {
        id: "mec-output-basics",
        element: "MEC-output-basics",
        path: "figures/mec-output-basics.svg",
        alt: "Output basics",
      },
    ],
    official_visuals: [{ element: "MEC-oap", state: "published" }],
  };
}

function makeContext(window) {
  const manifest = manifestFixture();
  return {
    projection: manifest.projections[0],
    manifest,
    chapter: CHAPTER,
    config: window.LouConfig,
    renderer: window.LouRenderer,
    store: window.LouLearnerStore,
  };
}

function officialFigure(window, elementId) {
  const figure = window.document.createElement("figure");
  figure.className = "official-visual";
  figure.dataset.element = elementId;
  figure.dataset.generated = "true";
  return figure;
}

describe("LouSvgLoader — sanitizeSvgMarkup", () => {
  let window;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    loadScripts(dom, ["svg-loader.js"]);
  });

  test("ER-01 strips script elements", () => {
    const svg = window.LouSvgLoader.sanitizeSvgMarkup(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><text id="a">ok</text></svg>'
    );
    assert.equal(svg.querySelector("script"), null);
    assert.equal(svg.querySelector("text").textContent, "ok");
  });

  test("ER-02 strips foreignObject", () => {
    const svg = window.LouSvgLoader.sanitizeSvgMarkup(
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><body>x</body></foreignObject><text>ok</text></svg>'
    );
    assert.equal(svg.querySelector("foreignObject"), null);
    assert.equal(svg.querySelector("text").textContent, "ok");
  });

  test("ER-03 removes on* event handler attributes", () => {
    const svg = window.LouSvgLoader.sanitizeSvgMarkup(
      '<svg xmlns="http://www.w3.org/2000/svg"><text onclick="alert(1)" onload="bad">ok</text></svg>'
    );
    const text = svg.querySelector("text");
    assert.equal(text.getAttribute("onclick"), null);
    assert.equal(text.getAttribute("onload"), null);
  });

  test("ER-04 rejects javascript: in attributes", () => {
    const svg = window.LouSvgLoader.sanitizeSvgMarkup(
      '<svg xmlns="http://www.w3.org/2000/svg"><text href="javascript:alert(1)">ok</text></svg>'
    );
    assert.equal(svg.querySelector("text").getAttribute("href"), null);
  });

  test("ER-05 use href must be internal fragment only", () => {
    const svg = window.LouSvgLoader.sanitizeSvgMarkup(
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">' +
        '<defs><path id="p"/></defs>' +
        '<use href="#p"/><use href="https://evil.test/x"/><use xlink:href="#p"/></svg>'
    );
    const uses = svg.querySelectorAll("use");
    assert.equal(uses.length, 2);
    assert.equal(uses[0].getAttribute("href"), "#p");
    assert.equal(uses[1].getAttribute("href"), null);
    assert.equal(uses[1].getAttribute("xlink:href"), "#p");
  });
});

describe("LouSvgLoader — loadFigure / loadAllFigures", () => {
  let window;
  let context;
  let fetchCalls;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    window.indexedDB = new IDBFactory();
    window.URL.createObjectURL = (blob) => `blob:${blob.type || "image"}`;
    window.URL.revokeObjectURL = () => {};
    window.requestAnimationFrame = (cb) => {
      cb();
      return 0;
    };
    loadScripts(dom, [
      "node_modules/marked/marked.min.js",
      "config.js",
      "markdown.js",
      "learner-store.js",
      "text-highlights.js",
      "caret-anchor.js",
      "inline-notes.js",
      "svg-loader.js",
      "inline-formatting.js",
      "blocks.js",
      "renderer.js",
    ]);
    window.LouRenderer.init(window.document.getElementById("content"), null);
  });

  beforeEach(() => {
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    window.LouTextHighlights._boundHost = null;
    window.LouInlineNotes._boundHost = null;
    window.document.body.innerHTML = '<div id="content"></div>';
    context = makeContext(window);
    fetchCalls = 0;
    window.fetch = async function (url) {
      fetchCalls += 1;
      const href = String(url);
      if (href.includes("mec-output-basics") || href.includes("MEC-output-basics")) {
        return { ok: false, status: 404 };
      }
      return {
        ok: true,
        status: 200,
        text: async () => VALID_SVG,
      };
    };
  });

  test("PL-01 valid SVG fetched, sanitized, and injected inline", async () => {
    const host = window.document.getElementById("content");
    const figure = officialFigure(window, "MEC-oap");
    host.appendChild(figure);

    const result = await window.LouSvgLoader.loadFigure(figure, context);
    assert.equal(result, "ready");

    const svg = figure.querySelector('svg[data-inline="true"][data-inline-ready="true"]');
    assert.ok(svg);
    assert.equal(figure.querySelector("img"), null);
    assert.equal(svg.getAttribute("aria-label"), manifestFixture().visuals[0].alt);
    assert.equal(svg.querySelector("text").textContent, "OAP");
  });

  test("PL-05 warns when inline SVG has no formatable text ids", async () => {
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = function (...args) {
      warnings.push(Array.from(args).join(" "));
      originalWarn.apply(console, args);
    };
    const priorFetch = window.fetch;
    window.fetch = async () => ({
      ok: true,
      status: 200,
      text: async () =>
        '<svg xmlns="http://www.w3.org/2000/svg"><text>No ids</text></svg>',
    });
    const figure = officialFigure(window, "MEC-oap");
    window.document.getElementById("content").appendChild(figure);
    try {
      const result = await window.LouSvgLoader.loadFigure(figure, context);
      assert.equal(result, "ready");
      assert.ok(
        warnings.some((message) =>
          message.includes("no formatable official text ids")
        )
      );
    } finally {
      console.warn = originalWarn;
      window.fetch = priorFetch;
    }
  });

  test("PL-03 fetch failure produces img fallback and fallback state", async () => {
    const host = window.document.getElementById("content");
    const figure = officialFigure(window, "MEC-output-basics");
    host.appendChild(figure);

    const result = await window.LouSvgLoader.loadFigure(figure, context);
    assert.equal(result, "fallback");
    assert.equal(figure.dataset.inlineFallback, "true");
    assert.equal(figure.querySelector("svg"), null);
    const img = figure.querySelector("img");
    assert.ok(img);
    assert.match(img.getAttribute("src"), /figures\/mec-output-basics\.svg$/);
    assert.equal(img.getAttribute("alt"), "Output basics");
  });

  test("PL-04 one figure failure does not block another", async () => {
    const host = window.document.getElementById("content");
    host.appendChild(officialFigure(window, "MEC-oap"));
    host.appendChild(officialFigure(window, "MEC-output-basics"));

    const summary = await window.LouSvgLoader.loadAllFigures(host, context);
    assert.equal(summary.success + summary.fallback, 2);
    assert.ok(summary.success >= 1);
    assert.ok(summary.fallback >= 1);

    const figures = host.querySelectorAll(".official-visual");
    assert.ok(
      figures[0].querySelector('svg[data-inline-ready="true"]')
    );
    assert.equal(figures[1].dataset.inlineFallback, "true");
  });

  test("fetch parse failure leaves no partial inline SVG", async () => {
    window.fetch = async () => ({
      ok: true,
      status: 200,
      text: async () => "<html>not svg</html>",
    });
    const figure = officialFigure(window, "MEC-oap");
    window.document.getElementById("content").appendChild(figure);

    const result = await window.LouSvgLoader.loadFigure(figure, context);
    assert.equal(result, "fallback");
    assert.equal(figure.querySelector("svg"), null);
    assert.ok(figure.querySelector("img"));
  });

  test("idempotent second call on ready figure", async () => {
    const figure = officialFigure(window, "MEC-oap");
    window.document.getElementById("content").appendChild(figure);

    await window.LouSvgLoader.loadFigure(figure, context);
    const beforeCalls = fetchCalls;
    const result = await window.LouSvgLoader.loadFigure(figure, context);
    assert.equal(result, "ready");
    assert.equal(fetchCalls, beforeCalls);
    assert.equal(figure.querySelectorAll("svg").length, 1);
  });

  test("idempotent second call on fallback figure", async () => {
    window.fetch = async () => ({ ok: false, status: 500 });
    const figure = officialFigure(window, "MEC-oap");
    window.document.getElementById("content").appendChild(figure);

    await window.LouSvgLoader.loadFigure(figure, context);
    const beforeCalls = fetchCalls;
    const result = await window.LouSvgLoader.loadFigure(figure, context);
    assert.equal(result, "fallback");
    assert.equal(fetchCalls, beforeCalls);
    assert.equal(figure.querySelectorAll("img").length, 1);
  });
});

describe("LouSvgLoader — async pipeline in blocks.render", () => {
  let window;
  let context;
  let mountOrder;
  let highlightsMountBase;
  let notesMountBase;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    window.indexedDB = new IDBFactory();
    window.URL.createObjectURL = (blob) => `blob:${blob.type || "image"}`;
    window.URL.revokeObjectURL = () => {};
    window.requestAnimationFrame = (cb) => {
      cb();
      return 0;
    };
    loadScripts(dom, [
      "node_modules/marked/marked.min.js",
      "config.js",
      "markdown.js",
      "learner-store.js",
      "text-highlights.js",
      "caret-anchor.js",
      "inline-notes.js",
      "svg-loader.js",
      "inline-formatting.js",
      "blocks.js",
      "renderer.js",
    ]);
    window.LouRenderer.init(window.document.getElementById("content"), null);
    highlightsMountBase = window.LouTextHighlights.mount.bind(
      window.LouTextHighlights
    );
    notesMountBase = window.LouInlineNotes.mount.bind(window.LouInlineNotes);
  });

  beforeEach(() => {
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    window.LouTextHighlights._boundHost = null;
    window.LouInlineNotes._boundHost = null;
    window.document.body.innerHTML = '<div id="content"></div>';
    context = makeContext(window);
    mountOrder = [];

    window.LouTextHighlights.mount = async function (host, ctx) {
      mountOrder.push("highlights");
      return highlightsMountBase(host, ctx);
    };

    window.LouInlineNotes.mount = async function (host, ctx) {
      mountOrder.push("notes");
      return notesMountBase(host, ctx);
    };
  });

  async function renderMechanisms(host, fetchImpl) {
    window.fetch = fetchImpl;
    const md = window.LouRenderer.prepareLearnerMarkdown(
      "## Comment la congestion mène-t-elle à l'OAP ? {#MEC-oap}\n\nWalkthrough prose."
    );
    const html = window.LouMarkdown.parse(md);
    return window.LouBlocks.render(host, html, context);
  }

  test("PL-02 slow fetch completes before learner layer mount", async () => {
    const host = window.document.getElementById("content");
    host.innerHTML = "";

    let releaseFetch;
    const fetchGate = new Promise(function (resolve) {
      releaseFetch = resolve;
    });

    const renderPromise = renderMechanisms(host, async function () {
      await fetchGate;
      return {
        ok: true,
        status: 200,
        text: async () => VALID_SVG,
      };
    });
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.deepEqual(mountOrder, []);

    releaseFetch();
    await renderPromise;

    assert.deepEqual(mountOrder, ["highlights", "notes"]);
    assert.ok(host.querySelector('svg[data-inline-ready="true"]'));
  });

  test("PL-04 pipeline continues after individual figure fallback", async () => {
    const host = window.document.getElementById("content");
    host.innerHTML = "";

    const md = window.LouRenderer.prepareLearnerMarkdown(
      "## OAP {#MEC-oap}\n\nA.\n\n## Output {#MEC-output-basics}\n\nB."
    );
    const html = window.LouMarkdown.parse(md);

    window.fetch = async function (url) {
      const href = String(url);
      if (href.includes("mec-oap")) {
        return { ok: false, status: 404 };
      }
      return {
        ok: true,
        status: 200,
        text: async () => VALID_SVG,
      };
    };

    await window.LouBlocks.render(host, html, context);

    assert.deepEqual(mountOrder, ["highlights", "notes"]);
    const figures = host.querySelectorAll(".official-visual");
    assert.equal(figures[0].dataset.inlineFallback, "true");
    assert.ok(figures[1].querySelector('svg[data-inline-ready="true"]'));
  });
});
