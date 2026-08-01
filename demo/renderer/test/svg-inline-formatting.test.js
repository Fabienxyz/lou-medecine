/**
 * Renderer V2.3 M3 — SVG Text Stream, selection, toolbar (unit).
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

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

function createReadyFigure(window, elementId, svgInner) {
  const figure = window.document.createElement("figure");
  figure.className = "official-visual";
  figure.dataset.element = elementId;
  figure.dataset.generated = "true";
  figure.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" data-inline="true" data-inline-ready="true">' +
    svgInner +
    "</svg>";
  return figure;
}

function selectRange(window, startNode, startOffset, endNode, endOffset) {
  const selection = window.getSelection();
  const range = window.document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  selection.removeAllRanges();
  selection.addRange(range);
  return range;
}

const BASE_SCRIPTS = [
  "learner-patrimony.js",
  "learner-store.js",
  "svg-loader.js",
  "inline-formatting.js",
];

describe("SVG Text Stream", () => {
  let window;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    loadScripts(dom, BASE_SCRIPTS);
  });

  test("TS-01 single text node stream", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="t1">OAP</text>'
    );
    const svg = figure.querySelector("svg");
    const data = window.LouInlineFormatting.buildSvgTextStream(svg);
    assert.equal(data.stream, "OAP");
    assert.equal(data.length, 3);
  });

  test("TS-02 multi-tspan document order", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="root">' +
        '<tspan data-official-text-id="a">Hel</tspan>' +
        '<tspan data-official-text-id="b">lo</tspan>' +
        "</text>"
    );
    const data = window.LouInlineFormatting.buildSvgTextStream(
      figure.querySelector("svg")
    );
    assert.equal(data.stream, "Hello");
  });

  test("TS-03 UTF-16 code units for astral character", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="t1">A😀B</text>'
    );
    const textNode = figure.querySelector("text").firstChild;
    const data = window.LouInlineFormatting.buildSvgTextStream(
      figure.querySelector("svg")
    );
    assert.equal(data.length, 4);
    assert.equal(data.stream.length, 4);
    const pos = window.LouInlineFormatting.streamPositionFromPoint(
      data,
      textNode,
      2
    );
    assert.equal(pos, 2);
  });

  test("TS-04 global to local and local to global mapping", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="root">' +
        '<tspan data-official-text-id="a">AB</tspan>' +
        '<tspan data-official-text-id="b">CD</tspan>' +
        "</text>"
    );
    const svg = figure.querySelector("svg");
    const data = window.LouInlineFormatting.buildSvgTextStream(svg);
    const tspanB = figure.querySelector('[data-official-text-id="b"]').firstChild;
    assert.equal(
      window.LouInlineFormatting.streamPositionFromPoint(data, tspanB, 1),
      3
    );
    const point = window.LouInlineFormatting.streamPointFromPosition(data, 3);
    assert.equal(point.node, tspanB);
    assert.equal(point.offset, 1);
  });

  test("TS-05 excludes data-learner nodes", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="ok">OK</text>' +
        '<g data-learner="true"><text data-official-text-id="bad">NO</text></g>'
    );
    const data = window.LouInlineFormatting.buildSvgTextStream(
      figure.querySelector("svg")
    );
    assert.equal(data.stream, "OK");
  });

  test("TS-06 excludes textPath", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="ok">OK</text>' +
        '<text data-official-text-id="wrap">' +
        '<textPath href="#p"><tspan data-official-text-id="tp">NO</tspan></textPath>' +
        "</text>"
    );
    const data = window.LouInlineFormatting.buildSvgTextStream(
      figure.querySelector("svg")
    );
    assert.equal(data.stream, "OK");
  });

  test("TS-07 excludes nodes without data-official-text-id", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="ok">OK</text><text>SKIP</text>'
    );
    const data = window.LouInlineFormatting.buildSvgTextStream(
      figure.querySelector("svg")
    );
    assert.equal(data.stream, "OK");
  });
});

describe("SVG selection and anchor", () => {
  let window;
  let host;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    loadScripts(dom, BASE_SCRIPTS);
    host = window.document.getElementById("content");
  });

  beforeEach(() => {
    host.innerHTML = "";
    window.getSelection().removeAllRanges();
  });

  test("LF-06 multi-tspan same parent selection allowed", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="root">' +
        '<tspan data-official-text-id="a">Hel</tspan>' +
        '<tspan data-official-text-id="b">lo</tspan>' +
        "</text>"
    );
    host.appendChild(figure);
    const svg = figure.querySelector("svg");
    const a = figure.querySelector('[data-official-text-id="a"]').firstChild;
    const b = figure.querySelector('[data-official-text-id="b"]').firstChild;
    selectRange(window, a, 0, b, 2);
    const result = window.LouInlineFormatting.selectionToStreamRange(
      window.getSelection(),
      svg
    );
    assert.ok(result);
    assert.equal(result.anchor.exact, "Hello");
    assert.equal(result.start.position, 0);
    assert.equal(result.end.position, 5);
  });

  test("LF-03 multi-text root rejected", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="t1">AB</text><text data-official-text-id="t2">CD</text>'
    );
    host.appendChild(figure);
    const svg = figure.querySelector("svg");
    const t1 = figure.querySelector('[data-official-text-id="t1"]').firstChild;
    const t2 = figure.querySelector('[data-official-text-id="t2"]').firstChild;
    selectRange(window, t1, 1, t2, 1);
    assert.equal(
      window.LouInlineFormatting.selectionToStreamRange(
        window.getSelection(),
        svg
      ),
      null
    );
  });

  test("LF-04 textPath rejected", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="wrap">' +
        '<textPath href="#p"><tspan data-official-text-id="tp">Bad</tspan></textPath>' +
        "</text>"
    );
    host.appendChild(figure);
    const svg = figure.querySelector("svg");
    const text = figure.querySelector('[data-official-text-id="tp"]').firstChild;
    selectRange(window, text, 0, text, 3);
    assert.equal(
      window.LouInlineFormatting.selectionToStreamRange(
        window.getSelection(),
        svg
      ),
      null
    );
  });

  test("LF-05 missing data-official-text-id rejected", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      "<text>Bad</text>"
    );
    host.appendChild(figure);
    const svg = figure.querySelector("svg");
    const text = figure.querySelector("text").firstChild;
    selectRange(window, text, 0, text, 3);
    assert.equal(
      window.LouInlineFormatting.selectionToStreamRange(
        window.getSelection(),
        svg
      ),
      null
    );
  });

  test("LF-07 intersect data-learner rejected", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<g data-learner="true"><text data-official-text-id="x">Bad</text></g>'
    );
    host.appendChild(figure);
    const svg = figure.querySelector("svg");
    const text = figure.querySelector("text").firstChild;
    selectRange(window, text, 0, text, 3);
    assert.equal(
      window.LouInlineFormatting.selectionToStreamRange(
        window.getSelection(),
        svg
      ),
      null
    );
  });

  test("collapsed selection rejected", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="t1">OAP</text>'
    );
    host.appendChild(figure);
    const svg = figure.querySelector("svg");
    const text = figure.querySelector("text").firstChild;
    selectRange(window, text, 1, text, 1);
    assert.equal(
      window.LouInlineFormatting.selectionToStreamRange(
        window.getSelection(),
        svg
      ),
      null
    );
  });

  test("AN-01 anchor exact prefix suffix and half-open range", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="t1">Before OAP After</text>'
    );
    host.appendChild(figure);
    const svg = figure.querySelector("svg");
    const text = figure.querySelector("text").firstChild;
    selectRange(window, text, 7, text, 10);
    const result = window.LouInlineFormatting.selectionToStreamRange(
      window.getSelection(),
      svg
    );
    assert.equal(result.element, "MEC-oap");
    assert.equal(result.anchor.type, "SvgTextRangeAnchor");
    assert.equal(result.anchor.exact, "OAP");
    assert.ok(result.anchor.prefix.length <= 32);
    assert.ok(result.anchor.suffix.length <= 32);
    assert.ok(result.start.position < result.end.position);
    assert.equal(
      window.LouInlineFormatting.buildSvgTextStream(svg).stream.slice(
        result.start.position,
        result.end.position
      ),
      "OAP"
    );
  });

  test("AN-02 half-open stream range invariant", () => {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="t1">OAP</text>'
    );
    host.appendChild(figure);
    const svg = figure.querySelector("svg");
    const text = figure.querySelector("text").firstChild;
    selectRange(window, text, 0, text, 3);
    const result = window.LouInlineFormatting.selectionToStreamRange(
      window.getSelection(),
      svg
    );
    assert.ok(result.start.position >= 0);
    assert.ok(result.end.position <= window.LouInlineFormatting.buildSvgTextStream(svg).length);
    assert.ok(result.start.position < result.end.position);
  });
});

describe("SVG formatting toolbar", () => {
  let window;
  let host;
  let context;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    window.indexedDB = new IDBFactory();
    loadScripts(dom, BASE_SCRIPTS);
    host = window.document.getElementById("content");
    context = {
      chapter: "cardio/234",
      projection: {
        id: "mechanisms",
        visuals: { "MEC-oap": "figures/mec-oap.svg" },
      },
      manifest: {},
      store: window.LouLearnerStore,
    };
  });

  beforeEach(async () => {
    host.innerHTML = "";
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    window.LouInlineFormatting._boundHost = null;
    window.LouInlineFormatting._writing = false;
    window.LouInlineFormatting.dismissToolbar();
    window.getSelection().removeAllRanges();
    await window.LouInlineFormatting.mount(host, context);
  });

  function appendSimpleFigure() {
    const figure = createReadyFigure(
      window,
      "MEC-oap",
      '<text data-official-text-id="t1">OAP flow</text>'
    );
    host.appendChild(figure);
    return figure;
  }

  test("LF-01 valid selection shows toolbar with required formats", () => {
    appendSimpleFigure();
    const text = host.querySelector("text").firstChild;
    selectRange(window, text, 0, text, 3);
    window.LouInlineFormatting._onSelectionChange(host, context);

    const toolbar = window.document.querySelector(
      "." + window.LouInlineFormatting.TOOLBAR_CLASS
    );
    assert.ok(toolbar);
    assert.equal(toolbar.hidden, false);
    assert.equal(toolbar.querySelectorAll(".svg-format-toolbar-btn").length, 5);
    assert.equal(
      toolbar.querySelectorAll(".svg-format-toolbar-swatch").length,
      window.LouLearnerStore.SVG_TEXT_COLOR_PALETTE.length +
        window.LouLearnerStore.SVG_BACKGROUND_COLOR_PALETTE.length
    );
  });

  test("LF-02 fallback figure never shows toolbar", () => {
    const figure = window.document.createElement("figure");
    figure.className = "official-visual";
    figure.dataset.element = "MEC-oap";
    figure.dataset.inlineFallback = "true";
    figure.innerHTML = '<img src="figures/mec-oap.svg" alt="x" />';
    host.appendChild(figure);
    window.LouInlineFormatting._onSelectionChange(host, context);
    const toolbar = window.document.querySelector(
      "." + window.LouInlineFormatting.TOOLBAR_CLASS
    );
    assert.ok(!toolbar || toolbar.hidden);
  });

  test("toolbar dismisses on invalid selection", () => {
    appendSimpleFigure();
    const text = host.querySelector("text").firstChild;
    selectRange(window, text, 0, text, 3);
    window.LouInlineFormatting._onSelectionChange(host, context);
    window.getSelection().removeAllRanges();
    window.LouInlineFormatting._onSelectionChange(host, context);
    assert.equal(window.LouInlineFormatting._selectionContext, null);
  });

  test("format click applies bold via store and overlay", async () => {
    appendSimpleFigure();
    const svg = host.querySelector("svg");
    const officialText = host.querySelector("text");
    const beforeContent = officialText.textContent;
    const text = officialText.firstChild;
    selectRange(window, text, 0, text, 3);
    window.LouInlineFormatting._onSelectionChange(host, context);
    await window.LouInlineFormatting._onFormatIntent("bold", null);

    assert.equal(officialText.textContent, beforeContent);
    const records = await window.LouLearnerStore.listSvgTextFormats(
      context.chapter,
      context.projection.id,
      "MEC-oap"
    );
    assert.equal(records.length, 1);
    assert.equal(records[0].format, "bold");
    const overlayGroup = svg.querySelector(
      "g." + window.LouInlineFormatting.OVERLAY_GROUP_CLASS
    );
    assert.ok(overlayGroup);
    assert.ok(
      overlayGroup.querySelector('[data-format-id="' + records[0].id + '"]')
    );
    assert.equal(window.LouInlineFormatting._selectionContext, null);
  });

  test("color intent uses closed palette only", async () => {
    appendSimpleFigure();
    const text = host.querySelector("text").firstChild;
    selectRange(window, text, 0, text, 3);
    window.LouInlineFormatting._onSelectionChange(host, context);
    const color = window.LouLearnerStore.SVG_TEXT_COLOR_PALETTE[0];
    await window.LouInlineFormatting._onFormatIntent("textColor", { color: color });

    const records = await window.LouLearnerStore.listSvgTextFormats(
      context.chapter,
      context.projection.id,
      "MEC-oap"
    );
    assert.equal(records.length, 1);
    assert.equal(records[0].format, "textColor");
    assert.ok(
      window.LouLearnerStore.SVG_TEXT_COLOR_PALETTE.includes(
        records[0].style.color
      )
    );
  });

  test("mount is idempotent on same host", async () => {
    const first = window.LouInlineFormatting._boundHost;
    await window.LouInlineFormatting.mount(host, context);
    assert.equal(window.LouInlineFormatting._boundHost, first);
  });
});

describe("SVG formatting pipeline mount order", () => {
  let window;
  let mountOrder;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
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
      "node_modules/marked/marked.min.js",
      "config.js",
      "markdown.js",
      "learner-patrimony.js",
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
    mountOrder = [];
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;

    const highlightsBase = window.LouTextHighlights.mount.bind(
      window.LouTextHighlights
    );
    const notesBase = window.LouInlineNotes.mount.bind(window.LouInlineNotes);
    const formattingBase = window.LouInlineFormatting.mount.bind(
      window.LouInlineFormatting
    );
    const loaderBase = window.LouSvgLoader.loadAllFigures.bind(
      window.LouSvgLoader
    );

    window.LouSvgLoader.loadAllFigures = async function (host, ctx) {
      mountOrder.push("loader");
      return loaderBase(host, ctx);
    };
    window.LouTextHighlights.mount = async function (host, ctx) {
      mountOrder.push("highlights");
      return highlightsBase(host, ctx);
    };
    window.LouInlineNotes.mount = async function (host, ctx) {
      mountOrder.push("notes");
      return notesBase(host, ctx);
    };
    window.LouInlineFormatting.mount = async function (host, ctx) {
      mountOrder.push("formatting");
      return formattingBase(host, ctx);
    };

    window.fetch = async () => ({
      ok: true,
      status: 200,
      text: async () =>
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">' +
        '<text data-official-text-id="t1">OAP</text></svg>',
    });
  });

  test("formatting mount runs after loader and notes", async () => {
    const host = window.document.getElementById("content");
    const context = {
      chapter: "cardio/234",
      projection: {
        id: "mechanisms",
        elements: ["MEC-oap"],
        visuals: { "MEC-oap": "figures/mec-oap.svg" },
      },
      manifest: {
        visuals: [{ element: "MEC-oap", alt: "OAP" }],
      },
      config: window.LouConfig,
      renderer: window.LouRenderer,
      store: window.LouLearnerStore,
    };
    const md = window.LouRenderer.prepareLearnerMarkdown(
      "## OAP {#MEC-oap}\n\nWalkthrough."
    );
    const html = window.LouMarkdown.parse(md);
    await window.LouBlocks.render(host, html, context);

    assert.deepEqual(mountOrder, [
      "loader",
      "highlights",
      "notes",
      "formatting",
    ]);
  });
});
