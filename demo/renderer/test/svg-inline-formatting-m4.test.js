/**
 * Renderer V2.3 M4 — apply, split, overlay, restore (unit).
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
const PROJECTION = "mechanisms";
const ELEMENT = "MEC-oap";
const ASSET = "figures/mec-oap.svg";

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

function makeContext(window) {
  return {
    chapter: CHAPTER,
    projection: {
      id: PROJECTION,
      visuals: { [ELEMENT]: ASSET },
    },
    manifest: {},
    store: window.LouLearnerStore,
  };
}

function makeSelectionRange(figure, start, end) {
  const svgRoot = figure.querySelector("svg");
  return {
    element: figure.dataset.element,
    figure: figure,
    svgRoot: svgRoot,
    start: { position: start },
    end: { position: end },
  };
}

function makeRecord(id, start, end, format, exact, style) {
  const record = {
    id: id,
    chapter: CHAPTER,
    projection: PROJECTION,
    element: ELEMENT,
    assetPath: ASSET,
    format: format,
    anchor: {
      type: "SvgTextRangeAnchor",
      start: { position: start },
      end: { position: end },
      exact: exact,
      prefix: "",
      suffix: "",
    },
  };
  if (style) {
    record.style = style;
  }
  return record;
}

function metaFor(window, figure) {
  return {
    chapter: CHAPTER,
    projection: PROJECTION,
    element: figure.dataset.element,
    assetPath: ASSET,
  };
}

function splitPlan(window, existing, start, end, intent, streamData, meta) {
  return window.LouInlineFormatting._computeFinalRecords(
    existing,
    start,
    end,
    intent,
    streamData,
    meta
  );
}

function rangesOf(records) {
  return records
    .map(function (record) {
      return [
        record.anchor.start.position,
        record.anchor.end.position,
        record.format,
      ];
    })
    .sort(function (a, b) {
      return a[0] - b[0];
    });
}

function assertRangesEqual(actual, expected) {
  assert.equal(JSON.stringify(actual), JSON.stringify(expected));
}

function assertNoOverlap(records) {
  const sorted = records
    .slice()
    .sort(function (a, b) {
      return a.anchor.start.position - b.anchor.start.position;
    });
  for (let i = 1; i < sorted.length; i += 1) {
    assert.ok(
      sorted[i - 1].anchor.end.position <= sorted[i].anchor.start.position,
      "overlap between records"
    );
  }
}

describe("M4 split algorithm", () => {
  let window;
  let streamData;
  let meta;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    loadScripts(dom, ["learner-store.js", "inline-formatting.js"]);
  });

  beforeEach(() => {
    const figure = createReadyFigure(
      window,
      ELEMENT,
      '<text data-official-text-id="t1">01234567890123456789</text>'
    );
    streamData = window.LouInlineFormatting.buildSvgTextStream(
      figure.querySelector("svg")
    );
    meta = metaFor(window, figure);
  });

  test("SP-01 no overlap keeps existing record", () => {
    const existing = [makeRecord(1, 0, 5, "bold", "01234")];
    const plan = splitPlan(
      window,
      existing,
      10,
      15,
      { format: "italic", style: null },
      streamData,
      meta
    );
    assert.equal(plan.records.length, 2);
    assertRangesEqual(rangesOf(plan.records), [
      [0, 5, "bold"],
      [10, 15, "italic"],
    ]);
  });

  test("SP-02 full cover deletes existing record", () => {
    const existing = [makeRecord(1, 0, 10, "bold", "0123456789")];
    const plan = splitPlan(
      window,
      existing,
      0,
      10,
      { format: "italic", style: null },
      streamData,
      meta
    );
    assertRangesEqual(rangesOf(plan.records), [[0, 10, "italic"]]);
  });

  test("SP-03 right overlap keeps left fragment", () => {
    const existing = [makeRecord(1, 0, 10, "bold", "0123456789")];
    const plan = splitPlan(
      window,
      existing,
      5,
      15,
      { format: "italic", style: null },
      streamData,
      meta
    );
    assertRangesEqual(rangesOf(plan.records), [
      [0, 5, "bold"],
      [5, 15, "italic"],
    ]);
  });

  test("SP-04 left overlap keeps right fragment", () => {
    const existing = [makeRecord(1, 5, 15, "bold", "5678901234")];
    const plan = splitPlan(
      window,
      existing,
      0,
      10,
      { format: "italic", style: null },
      streamData,
      meta
    );
    assertRangesEqual(rangesOf(plan.records), [
      [0, 10, "italic"],
      [10, 15, "bold"],
    ]);
  });

  test("SP-05 strict inclusion produces two fragments", () => {
    const existing = [makeRecord(1, 0, 10, "bold", "0123456789")];
    const plan = splitPlan(
      window,
      existing,
      3,
      7,
      { format: "textColor", style: { color: "#c0392b" } },
      streamData,
      meta
    );
    assertRangesEqual(rangesOf(plan.records), [
      [0, 3, "bold"],
      [3, 7, "textColor"],
      [7, 10, "bold"],
    ]);
  });

  test("SP-06 identical range replaces format", () => {
    const existing = [makeRecord(1, 0, 10, "bold", "0123456789")];
    const plan = splitPlan(
      window,
      existing,
      0,
      10,
      { format: "italic", style: null },
      streamData,
      meta
    );
    assertRangesEqual(rangesOf(plan.records), [[0, 10, "italic"]]);
  });

  test("SP-07 identical format is strict no-op", () => {
    const existing = [makeRecord(1, 0, 5, "bold", "01234")];
    const plan = splitPlan(
      window,
      existing,
      0,
      5,
      { format: "bold", style: null },
      streamData,
      meta
    );
    assert.equal(plan.noOp, true);
  });

  test("SP-08 adjacent compatible records merge", () => {
    const existing = [
      makeRecord(1, 0, 5, "bold", "01234"),
      makeRecord(2, 5, 10, "bold", "56789"),
    ];
    const plan = splitPlan(
      window,
      existing,
      10,
      15,
      { format: "bold", style: null },
      streamData,
      meta
    );
    assert.equal(plan.records.length, 1);
    assert.equal(plan.records[0].anchor.start.position, 0);
    assert.equal(plan.records[0].anchor.end.position, 15);
  });

  test("SP-09 remove on unformatted range is no-op", () => {
    const existing = [makeRecord(1, 0, 5, "bold", "01234")];
    const plan = splitPlan(
      window,
      existing,
      10,
      15,
      { format: "remove", style: null },
      streamData,
      meta
    );
    assert.equal(plan.noOp, true);
  });

  test("SP-10 final records never overlap", () => {
    const existing = [
      makeRecord(1, 0, 10, "bold", "0123456789"),
      makeRecord(2, 12, 18, "underline", "2345678"),
    ];
    const plan = splitPlan(
      window,
      existing,
      5,
      15,
      { format: "strike", style: null },
      streamData,
      meta
    );
    assertNoOverlap(plan.records);
  });
});

describe("M4 apply and restore", () => {
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
    loadScripts(dom, ["learner-store.js", "inline-formatting.js"]);
    host = window.document.getElementById("content");
  });

  beforeEach(async () => {
    host.innerHTML = "";
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    window.LouInlineFormatting._boundHost = null;
    context = makeContext(window);
    await window.LouInlineFormatting.mount(host, context);
  });

  function appendFigure(text) {
    const figure = createReadyFigure(
      window,
      ELEMENT,
      '<text data-official-text-id="t1">' + text + "</text>"
    );
    host.appendChild(figure);
    return figure;
  }

  test("IF-01 bold apply persists and keeps official text intact", async () => {
    const figure = appendFigure("OAP flow");
    const official = figure.querySelector("text");
    const before = official.textContent;
    await window.LouInlineFormatting.applyFormat(
      host,
      context,
      makeSelectionRange(figure, 0, 3),
      { format: "bold", style: null }
    );
    assert.equal(official.textContent, before);
    const records = await context.store.listSvgTextFormats(
      CHAPTER,
      PROJECTION,
      ELEMENT
    );
    assert.equal(records.length, 1);
    assert.equal(records[0].format, "bold");
    const overlay = figure.querySelector('[data-format-id="' + records[0].id + '"]');
    assert.ok(overlay);
    assert.equal(overlay.getAttribute("data-learner"), "true");
  });

  test("IF-02 all format kinds persist", async () => {
    const cases = [
      { format: "italic", style: null, text: "A" },
      { format: "underline", style: null, text: "B" },
      { format: "strike", style: null, text: "C" },
      {
        format: "textColor",
        style: { color: window.LouLearnerStore.SVG_TEXT_COLOR_PALETTE[0] },
        text: "D",
      },
      {
        format: "backgroundColor",
        style: {
          backgroundColor:
            window.LouLearnerStore.SVG_BACKGROUND_COLOR_PALETTE[0],
        },
        text: "E",
      },
    ];
    for (let i = 0; i < cases.length; i += 1) {
      host.innerHTML = "";
      window.indexedDB = new IDBFactory();
      window.LouLearnerStore.db = null;
      const figure = appendFigure(cases[i].text);
      await window.LouInlineFormatting.applyFormat(
        host,
        context,
        makeSelectionRange(figure, 0, 1),
        cases[i]
      );
      const records = await context.store.listSvgTextFormats(
        CHAPTER,
        PROJECTION,
        ELEMENT
      );
      assert.equal(records.length, 1);
      assert.equal(records[0].format, cases[i].format);
    }
  });

  test("IF-03 replace format on overlapping range", async () => {
    const figure = appendFigure("0123456789");
    await window.LouInlineFormatting.applyFormat(
      host,
      context,
      makeSelectionRange(figure, 0, 10),
      { format: "bold", style: null }
    );
    await window.LouInlineFormatting.applyFormat(
      host,
      context,
      makeSelectionRange(figure, 3, 7),
      {
        format: "textColor",
        style: { color: "#2980b9" },
      }
    );
    const records = await context.store.listSvgTextFormats(
      CHAPTER,
      PROJECTION,
      ELEMENT
    );
    assertRangesEqual(rangesOf(records), [
      [0, 3, "bold"],
      [3, 7, "textColor"],
      [7, 10, "bold"],
    ]);
  });

  test("IF-04 remove clears covered format only", async () => {
    const figure = appendFigure("0123456789");
    await window.LouInlineFormatting.applyFormat(
      host,
      context,
      makeSelectionRange(figure, 0, 10),
      { format: "bold", style: null }
    );
    await window.LouInlineFormatting.removeFormat(
      host,
      context,
      makeSelectionRange(figure, 3, 7)
    );
    const records = await context.store.listSvgTextFormats(
      CHAPTER,
      PROJECTION,
      ELEMENT
    );
    assertRangesEqual(rangesOf(records), [
      [0, 3, "bold"],
      [7, 10, "bold"],
    ]);
  });

  test("RS-01 restore is idempotent", async () => {
    const figure = appendFigure("OAP flow");
    await window.LouInlineFormatting.applyFormat(
      host,
      context,
      makeSelectionRange(figure, 0, 3),
      { format: "bold", style: null }
    );
    await window.LouInlineFormatting.restore(host, context);
    await window.LouInlineFormatting.restore(host, context);
    const svg = figure.querySelector("svg");
    const overlays = svg.querySelectorAll("[data-format-id]");
    const ids = Array.from(overlays).map(function (node) {
      return node.getAttribute("data-format-id");
    });
    assert.equal(new Set(ids).size, ids.length);
    assert.equal(
      svg.querySelectorAll("g." + window.LouInlineFormatting.OVERLAY_GROUP_CLASS)
        .length,
      1
    );
  });

  test("RS-02 restore ignores invalid anchor silently", async () => {
    const figure = appendFigure("OAP flow");
    await context.store.addSvgTextFormat({
      chapter: CHAPTER,
      projection: PROJECTION,
      element: ELEMENT,
      assetPath: ASSET,
      format: "bold",
      anchor: {
        type: "SvgTextRangeAnchor",
        start: { position: 0 },
        end: { position: 3 },
        exact: "BAD",
        prefix: "",
        suffix: "",
      },
    });
    await window.LouInlineFormatting.restore(host, context);
    const svg = figure.querySelector("svg");
    assert.equal(svg.querySelectorAll("[data-format-id]").length, 0);
  });

  test("RS-03 restore skips fallback figure", async () => {
    const fallback = window.document.createElement("figure");
    fallback.className = "official-visual";
    fallback.dataset.element = ELEMENT;
    fallback.dataset.inlineFallback = "true";
    fallback.innerHTML = '<img src="figures/mec-oap.svg" alt="x" />';
    host.appendChild(fallback);
    await context.store.addSvgTextFormat({
      chapter: CHAPTER,
      projection: PROJECTION,
      element: ELEMENT,
      assetPath: ASSET,
      format: "bold",
      anchor: {
        type: "SvgTextRangeAnchor",
        start: { position: 0 },
        end: { position: 3 },
        exact: "OAP",
        prefix: "",
        suffix: "",
      },
    });
    await window.LouInlineFormatting.restore(host, context);
    assert.equal(fallback.querySelector("[data-format-id]"), null);
  });

  test("RS-04 reload remount restores formats", async () => {
    const figure = appendFigure("OAP flow");
    await window.LouInlineFormatting.applyFormat(
      host,
      context,
      makeSelectionRange(figure, 0, 3),
      { format: "underline", style: null }
    );
    host.innerHTML = "";
    window.LouInlineFormatting._boundHost = null;
    appendFigure("OAP flow");
    await window.LouInlineFormatting.mount(host, context);
    const records = await context.store.listSvgTextFormats(
      CHAPTER,
      PROJECTION,
      ELEMENT
    );
    assert.equal(records.length, 1);
    assert.ok(host.querySelector('[data-format-id="' + records[0].id + '"]'));
  });

  test("ER-01 store reject rolls back overlay", async () => {
    const figure = appendFigure("OAP flow");
    const originalAdd = context.store.addSvgTextFormat.bind(context.store);
    context.store.addSvgTextFormat = async function () {
      throw new Error("store reject");
    };
    await assert.rejects(
      window.LouInlineFormatting.applyFormat(
        host,
        context,
        makeSelectionRange(figure, 0, 3),
        { format: "bold", style: null }
      )
    );
    context.store.addSvgTextFormat = originalAdd;
    const svg = figure.querySelector("svg");
    assert.equal(svg.querySelectorAll("[data-format-id]").length, 0);
    const records = await window.LouLearnerStore.listSvgTextFormats(
      CHAPTER,
      PROJECTION,
      ELEMENT
    );
    assert.equal(records.length, 0);
  });

  test("ER-02 official attributes unchanged after apply", async () => {
    const figure = createReadyFigure(
      window,
      ELEMENT,
      '<text data-official-text-id="t1" fill="#000" font-size="12">OAP</text>'
    );
    host.appendChild(figure);
    const official = figure.querySelector("text");
    const attrs = {
      fill: official.getAttribute("fill"),
      fontSize: official.getAttribute("font-size"),
    };
    await window.LouInlineFormatting.applyFormat(
      host,
      context,
      makeSelectionRange(figure, 0, 3),
      { format: "bold", style: null }
    );
    assert.equal(official.getAttribute("fill"), attrs.fill);
    assert.equal(official.getAttribute("font-size"), attrs.fontSize);
  });

  test("lifecycle projection scope isolates records", async () => {
    const figure = appendFigure("OAP flow");
    await window.LouInlineFormatting.applyFormat(
      host,
      context,
      makeSelectionRange(figure, 0, 3),
      { format: "bold", style: null }
    );
    assert.equal(host.querySelectorAll("[data-format-id]").length, 1);

    const otherContext = makeContext(window);
    otherContext.projection.id = "clinical";
    await window.LouInlineFormatting.restore(host, otherContext);
    assert.equal(host.querySelectorAll("[data-format-id]").length, 0);

    await window.LouInlineFormatting.restore(host, context);
    assert.equal(host.querySelectorAll("[data-format-id]").length, 1);

    host.innerHTML = "";
    appendFigure("OAP flow");
    await window.LouInlineFormatting.restore(host, otherContext);
    assert.equal(host.querySelectorAll("[data-format-id]").length, 0);
  });
});
