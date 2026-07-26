// Renderer-contract tests (IMPLEMENTATION_CONTRACT.md C.7).
//
// These check the obligations that are mechanically checkable: block structure, visual binding by
// identifier, the three availability states, the two learner affordances, and honest degradation.
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

function loadScripts(dom, files) {
  for (const file of files) {
    const code = fs.readFileSync(path.join(ROOT, file), "utf8");
    dom.window.eval(code);
  }
}

// A manifest shaped like the real one, exercising all three visual states at once.
function manifestFixture() {
  return {
    chapter: CHAPTER,
    projections: [
      {
        id: "mechanisms",
        type: "understanding.mechanisms",
        path: "projections/understanding/mechanisms.md",
        status: "published",
        elements: ["MEC-congestion", "MEC-oap", "MEC-compensation"],
        visuals: { "MEC-oap": "figures/mec-oap.svg" },
      },
      {
        id: "overview",
        type: "understanding.overview",
        path: "projections/understanding/overview.md",
        status: "published",
        elements: ["MM-pump-decompensation"],
      },
    ],
    visuals: [
      {
        id: "mec-oap",
        element: "MEC-oap",
        path: "figures/mec-oap.svg",
        alt: "Congestion pulmonaire → seuil PPC → transsudat → OAP cardiogénique",
      },
    ],
    official_visuals: [
      { element: "MEC-oap", state: "published" },
      {
        element: "MEC-compensation",
        state: "withheld",
        reasons: ["unsupported visual_intent: feedback-loop"],
      },
      {
        element: "MM-pump-decompensation",
        state: "planned-not-built",
        intent: "causal-graph",
      },
    ],
  };
}

// Two blocks: one with an Official Visual, one without. Both are valid and complete.
const MECHANISMS_MD = `---
type: understanding.mechanisms
---

# Pourquoi ? — mécanismes causaux

Intro qui n'appartient à aucun bloc.

## Pourquoi la congestion pulmonaire apparaît-elle ? {#MEC-congestion}

La pression de remplissage gauche remonte. {#cb-mec-cong-steps}

---

## Comment la congestion mène-t-elle à l'OAP ? {#MEC-oap}

Transmission aux capillaires pulmonaires. {#cb-oap-bridge} Au-delà du seuil, transsudat. {#cb-oap-threshold}

## Pourquoi le corps aide-t-il puis aggrave-t-il ? {#MEC-compensation}

Les compensations achètent du temps. {#cb-mec-comp-steps}
`;

// Path wiring: the renderer must consume the build's canonical output location, with no per-chapter
// allowlist and no copying of artifacts between locations.
describe("renderer — chapter path resolution", () => {
  let config;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    loadScripts(dom, ["config.js"]);
    config = dom.window.LouConfig;
  });

  beforeEach(() => {
    config.contentRoot = null;
  });

  test("a chapter resolves to the build output by default", () => {
    assert.match(
      config.resolveManifestPath("cardio/234"),
      /01-learning\/chapters\/cardio\/234\/manifest\.json$/
    );
  });

  test("a chapter the renderer has never heard of resolves the same way", () => {
    // The regression this replaces: config hardcoded `if (chapter === "cardio/234")`.
    assert.match(
      config.resolveManifestPath("pneumo/999"),
      /01-learning\/chapters\/pneumo\/999\/manifest\.json$/
    );
  });

  test("a legacy prose slug is aliased onto the built chapter id", () => {
    assert.equal(
      config.sanitizeChapter("cardio/234-insuffisance-cardiaque"),
      "cardio/234"
    );
    assert.match(
      config.resolveManifestPath(
        config.sanitizeChapter("cardio/234-insuffisance-cardiaque")
      ),
      /01-learning\/chapters\/cardio\/234\/manifest\.json$/
    );
  });

  test("the legacy prototype folder is used only as an explicit fallback", () => {
    assert.equal(config.isLegacyContentRoot(), false);
    config.useLegacyContentRoot();
    assert.equal(config.isLegacyContentRoot(), true);
    assert.match(
      config.resolveAssetPath("cardio/221-atherome", "histoire.md"),
      /01-learning\/generated-assets\/cardio\/221-atherome\/histoire\.md$/
    );
  });

  test("path traversal is still rejected", () => {
    assert.equal(config.sanitizeChapter("../../etc"), null);
    assert.equal(config.sanitizeChapter("/absolute"), null);
    assert.equal(config.sanitizeChapter(""), null);
  });
});

describe("renderer — pedagogical blocks and learner layer", () => {
  let dom;
  let window;
  let context;

  before(() => {
    dom = new JSDOM(
      `<!DOCTYPE html><body><div id="content"></div></body>`,
      { url: "https://example.test/demo/renderer/", runScripts: "outside-only" }
    );
    window = dom.window;
    window.indexedDB = new IDBFactory();
    // jsdom implements neither of these; both are only needed to display a stored image.
    window.URL.createObjectURL = (blob) => `blob:${blob.type || "image"}`;
    window.URL.revokeObjectURL = () => {};
    loadScripts(dom, [
      "node_modules/marked/marked.min.js",
      "config.js",
      "markdown.js",
      "learner-store.js",
      "text-highlights.js",
      "blocks.js",
      "renderer.js",
    ]);
  });

  beforeEach(() => {
    // A fresh database per test keeps learner artifacts from leaking between cases.
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    const manifest = manifestFixture();
    window.LouRenderer.init(window.document.getElementById("content"), null);
    context = {
      projection: manifest.projections[0],
      manifest,
      chapter: CHAPTER,
      config: window.LouConfig,
      renderer: window.LouRenderer,
      store: window.LouLearnerStore,
    };
  });

  async function renderMechanisms() {
    const md = window.LouRenderer.prepareLearnerMarkdown(MECHANISMS_MD);
    const html = window.LouMarkdown.parse(md);
    await window.LouRenderer.renderProjection(html, context);
    return window.document.getElementById("content");
  }

  test("one block per Blueprint element, in document order, keyed by element id", async () => {
    const content = await renderMechanisms();
    const blocks = [...content.querySelectorAll(".pedagogical-block")];
    assert.deepEqual(
      blocks.map((b) => b.dataset.element),
      ["MEC-congestion", "MEC-oap", "MEC-compensation"]
    );
    for (const block of blocks) {
      assert.ok(block.querySelector(".block-question"));
      assert.ok(block.querySelector(".block-walkthrough").textContent.trim());
    }
  });

  test("content before the first block stays a preamble and is not invented into a block", async () => {
    const content = await renderMechanisms();
    assert.ok(content.querySelector("h1"));
    assert.equal(content.querySelector("h1").closest(".pedagogical-block"), null);
  });

  test("the Official Visual is bound by identifier, inside its own block", async () => {
    const content = await renderMechanisms();
    const oap = content.querySelector('[data-element="MEC-oap"]');
    const figure = oap.querySelector(".official-visual img");
    assert.match(figure.getAttribute("src"), /figures\/mec-oap\.svg$/);
    // The regression this replaces: the visual used to land after the first h2 of the projection.
    const first = content.querySelector('[data-element="MEC-congestion"]');
    assert.equal(first.querySelector(".official-visual"), null);
  });

  test("alt text comes from the manifest, never authored by the renderer", async () => {
    const content = await renderMechanisms();
    const img = content.querySelector(
      '[data-element="MEC-oap"] .official-visual img'
    );
    assert.equal(img.getAttribute("alt"), manifestFixture().visuals[0].alt);
    assert.doesNotMatch(img.getAttribute("alt"), /diagram/i);
  });

  test("a withheld visual is reported, and a block with no visual planned says nothing", async () => {
    const content = await renderMechanisms();
    const withheld = content.querySelector(
      '[data-element="MEC-compensation"] .visual-unavailable'
    );
    assert.equal(withheld.dataset.state, "withheld");
    assert.match(withheld.textContent, /indisponible/i);

    // MEC-congestion has no official_visuals entry: no visual is warranted, so nothing is implied.
    const quiet = content.querySelector(
      '[data-element="MEC-congestion"] .visual-unavailable'
    );
    assert.equal(quiet, null);
  });

  test("the two absent states are distinguishable, never collapsed", async () => {
    const notice = window.LouRenderer.visualStateNotice(
      context.manifest,
      "MM-pump-decompensation"
    );
    assert.match(notice, /data-state="planned-not-built"/);
    const withheld = window.LouRenderer.visualStateNotice(
      context.manifest,
      "MEC-compensation"
    );
    assert.match(withheld, /data-state="withheld"/);
    assert.notEqual(notice, withheld);
  });

  test("the Personal Diagram affordance exists on every block, visual or not", async () => {
    const content = await renderMechanisms();
    const blocks = [...content.querySelectorAll(".pedagogical-block")];
    assert.equal(blocks.length, 3);
    for (const block of blocks) {
      assert.ok(
        block.querySelector(".diagram-affordance"),
        `${block.dataset.element} must offer a Personal Diagram`
      );
    }
  });

  test("the Inline Note affordance is separate, and sits at claim-block boundaries", async () => {
    const content = await renderMechanisms();
    const oap = content.querySelector('[data-element="MEC-oap"]');
    const claims = [...oap.querySelectorAll(".note-affordance")].map(
      (b) => b.dataset.claim
    );
    assert.deepEqual(claims, ["cb-oap-bridge", "cb-oap-threshold"]);
    // Two mechanisms, not one generalised attachment control.
    assert.notEqual(
      oap.querySelector(".diagram-affordance"),
      oap.querySelector(".note-affordance")
    );
  });

  test("generated content carries no editing affordance", async () => {
    const content = await renderMechanisms();
    assert.equal(content.querySelector("[contenteditable]"), null);
    for (const el of content.querySelectorAll("[data-generated]")) {
      assert.equal(el.getAttribute("contenteditable"), null);
    }
  });

  test("a Personal Diagram on a visual-less block survives re-rendering", async () => {
    await renderMechanisms();
    await window.LouLearnerStore.addPersonalDiagram(
      CHAPTER,
      "MEC-congestion",
      new window.Blob(["fake-png"], { type: "image/png" })
    );

    const content = await renderMechanisms();
    const gallery = content.querySelector(
      '[data-element="MEC-congestion"] .diagram-gallery'
    );
    assert.equal(gallery.querySelectorAll(".personal-diagram").length, 1);
  });

  test("an Inline Note survives regeneration while its claim block persists", async () => {
    await renderMechanisms();
    await window.LouLearnerStore.addInlineNote(
      CHAPTER,
      "MEC-oap",
      "cb-oap-threshold",
      "je bloque sur le seuil"
    );

    const content = await renderMechanisms();
    const container = content.querySelector('[data-notes-for="cb-oap-threshold"]');
    const note = container.querySelector(".inline-note");
    assert.match(note.textContent, /je bloque sur le seuil/);
    assert.equal(note.classList.contains("inline-note-degraded"), false);
    assert.equal(note.dataset.learner, "true");
  });

  test("a note whose claim block was re-cut degrades to its block, not to nothing", async () => {
    await renderMechanisms();
    await window.LouLearnerStore.addInlineNote(
      CHAPTER,
      "MEC-oap",
      "cb-oap-removed-by-regeneration",
      "note à conserver"
    );

    const content = await renderMechanisms();
    const oap = content.querySelector('[data-element="MEC-oap"]');
    const degraded = oap.querySelector(".inline-note-degraded");
    assert.match(degraded.textContent, /note à conserver/);
    assert.match(degraded.textContent, /régénéré/);
  });

  test("an artifact anchored to a vanished element is surfaced as orphaned, never discarded", async () => {
    await renderMechanisms();
    await window.LouLearnerStore.addInlineNote(
      CHAPTER,
      "MEC-element-that-no-longer-exists",
      "cb-gone",
      "note orpheline"
    );

    const content = await renderMechanisms();
    const panel = content.querySelector(".learner-orphans");
    assert.match(panel.textContent, /note orpheline/);
    assert.match(panel.textContent, /MEC-element-that-no-longer-exists/);
  });

  test("an artifact belonging to another projection is not shown here and not orphaned", async () => {
    await renderMechanisms();
    await window.LouLearnerStore.addInlineNote(
      CHAPTER,
      "MM-pump-decompensation",
      "cb-ov-oap",
      "note de la vue d'ensemble"
    );

    const content = await renderMechanisms();
    assert.equal(content.querySelector(".learner-orphans"), null);
    assert.doesNotMatch(content.textContent, /note de la vue d'ensemble/);
  });

  test("text highlights restore after re-render from stored TextQuoteSelectors", async () => {
    await renderMechanisms();
    const content = await renderMechanisms();
    const walkthrough = content.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    assert.equal(walkthrough.dataset.official, "true");

    const full = walkthrough.textContent;
    const exact = "Au-delà du seuil";
    const pos = full.indexOf(exact);
    assert.ok(pos >= 0, "fixture phrase must exist in walkthrough");

    const selector = {
      type: "TextQuoteSelector",
      exact: exact,
      prefix: full.slice(Math.max(0, pos - 32), pos),
      suffix: full.slice(pos + exact.length, pos + exact.length + 32),
    };

    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      selector
    );

    const restored = await renderMechanisms();
    const mark = restored.querySelector(
      '[data-element="MEC-oap"] mark.learner-highlight'
    );
    assert.ok(mark);
    assert.match(mark.textContent, /Au-delà du seuil/);
    assert.equal(mark.dataset.learner, "true");
    assert.equal(restored.querySelector("[contenteditable]"), null);
  });

  test("official walkthrough containers are marked for highlight scoping", async () => {
    const content = await renderMechanisms();
    for (const block of content.querySelectorAll(".pedagogical-block")) {
      const walkthrough = block.querySelector(".block-walkthrough");
      assert.equal(walkthrough.dataset.official, "true");
    }
  });
});

describe("renderer — learner storage robustness", () => {
  let dom;
  let window;
  let context;

  before(() => {
    dom = new JSDOM(
      `<!DOCTYPE html><body><div id="content"></div></body>`,
      { url: "https://example.test/demo/renderer/", runScripts: "outside-only" }
    );
    window = dom.window;
    window.indexedDB = new IDBFactory();
    window.URL.createObjectURL = (blob) => `blob:${blob.type || "image"}`;
    window.URL.revokeObjectURL = () => {};
    loadScripts(dom, [
      "node_modules/marked/marked.min.js",
      "config.js",
      "markdown.js",
      "learner-store.js",
      "text-highlights.js",
      "blocks.js",
      "renderer.js",
    ]);
  });

  beforeEach(() => {
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    window.LouTextHighlights._boundHost = null;
    window.LouRenderer.init(window.document.getElementById("content"), null);
    const manifest = manifestFixture();
    context = {
      projection: manifest.projections[0],
      manifest,
      chapter: CHAPTER,
      config: window.LouConfig,
      renderer: window.LouRenderer,
      store: window.LouLearnerStore,
    };
  });

  async function renderMechanisms() {
    const md = window.LouRenderer.prepareLearnerMarkdown(MECHANISMS_MD);
    const html = window.LouMarkdown.parse(md);
    await window.LouRenderer.renderProjection(html, context);
    return window.document.getElementById("content");
  }

  test("bindSelection runs when highlight restore rejects", async () => {
    const host = window.document.getElementById("content");
    const original = window.LouLearnerStore.listTextHighlights;
    window.LouLearnerStore.listTextHighlights = () =>
      Promise.reject(new Error("idb read failed"));

    try {
      await window.LouTextHighlights.mount(host, context);
      assert.equal(window.LouTextHighlights._boundHost, host);
    } finally {
      window.LouLearnerStore.listTextHighlights = original;
    }
  });

  test("selection mount runs when hydrate rejects", async () => {
    const original = window.LouLearnerStore.listPersonalDiagrams;
    window.LouLearnerStore.listPersonalDiagrams = () =>
      Promise.reject(new Error("idb read failed"));

    try {
      const content = await renderMechanisms();
      assert.ok(content.querySelector(".pedagogical-block"));
      assert.equal(window.LouTextHighlights._boundHost, content);
    } finally {
      window.LouLearnerStore.listPersonalDiagrams = original;
    }
  });

  test("invalid diagram blob does not abort hydration", async () => {
    const originalList = window.LouLearnerStore.listPersonalDiagrams;
    const originalCreateObjectURL = window.URL.createObjectURL;
    window.LouLearnerStore.listPersonalDiagrams = () =>
      Promise.resolve([
        {
          id: 1,
          chapter: CHAPTER,
          element: "MEC-oap",
          blob: { type: "image/png" },
        },
      ]);
    window.URL.createObjectURL = () => {
      throw new TypeError("invalid blob");
    };

    try {
      const content = await renderMechanisms();
      const block = content.querySelector('[data-element="MEC-oap"]');
      assert.ok(block);
      assert.equal(block.querySelector(".personal-diagram"), null);
      assert.equal(window.LouTextHighlights._boundHost, content);
    } finally {
      window.LouLearnerStore.listPersonalDiagrams = originalList;
      window.URL.createObjectURL = originalCreateObjectURL;
    }
  });

  test("versionchange closes and invalidates the cached connection", async () => {
    await window.LouLearnerStore.open();
    const db = window.LouLearnerStore.db;
    assert.ok(db);

    let closeCalled = false;
    const originalClose = db.close.bind(db);
    db.close = function () {
      closeCalled = true;
      return originalClose();
    };

    db.onversionchange();
    assert.equal(window.LouLearnerStore.db, null);
    assert.equal(closeCalled, true);
  });

  test("healthy highlight restore behaviour is unchanged", async () => {
    await renderMechanisms();
    const walkthrough = window.document.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    const full = walkthrough.textContent;
    const exact = "Au-delà du seuil";
    const pos = full.indexOf(exact);

    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      {
        type: "TextQuoteSelector",
        exact,
        prefix: full.slice(Math.max(0, pos - 32), pos),
        suffix: full.slice(pos + exact.length, pos + exact.length + 32),
      }
    );

    const restored = await renderMechanisms();
    assert.ok(
      restored.querySelector('[data-element="MEC-oap"] mark.learner-highlight')
    );
    assert.equal(window.LouTextHighlights._boundHost, restored);
  });
});

describe("renderer — text highlight restore regressions", () => {
  let dom;
  let window;
  let context;
  let realMechanismsMd;

  const THREE_PARAGRAPH_PHRASES = [
    "débit adapté aux besoins",
    "volume d'éjection systolique",
    "précharge, la postcharge et la contractilité",
  ];

  before(() => {
    dom = new JSDOM(
      `<!DOCTYPE html><html><body><div id="content"></div></body>`,
      { url: "https://example.test/demo/renderer/", runScripts: "outside-only" }
    );
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
      "learner-store.js",
      "text-highlights.js",
      "blocks.js",
      "renderer.js",
    ]);
    realMechanismsMd = fs.readFileSync(
      path.join(
        ROOT,
        "../../01-learning/chapters/cardio/234/projections/understanding/mechanisms.md"
      ),
      "utf8"
    );
  });

  beforeEach(() => {
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    window.LouTextHighlights._boundHost = null;
    const manifest = JSON.parse(
      fs.readFileSync(
        path.join(ROOT, "../../01-learning/chapters/cardio/234/manifest.json"),
        "utf8"
      )
    );
    window.LouRenderer.init(window.document.getElementById("content"), null);
    context = {
      projection: manifest.projections.find((p) => p.id === "mechanisms"),
      manifest,
      chapter: CHAPTER,
      config: window.LouConfig,
      renderer: window.LouRenderer,
      store: window.LouLearnerStore,
    };
  });

  async function renderRealMechanisms() {
    const html = window.LouMarkdown.parse(
      window.LouRenderer.prepareLearnerMarkdown(realMechanismsMd)
    );
    await window.LouRenderer.renderProjection(html, context);
    return window.document.getElementById("content");
  }

  function walkthroughForBasics(content) {
    return content.querySelector(
      '[data-element="MEC-output-basics"] .block-walkthrough'
    );
  }

  function assertHealthyMarks(marks) {
    for (const mark of marks) {
      assert.ok(mark.textContent.length > 0, "mark must not be empty");
      assert.equal(
        mark.querySelector("." + window.LouTextHighlights.HIGHLIGHT_CLASS),
        null,
        "marks must not nest"
      );
      assert.equal(
        [...mark.childNodes].some(
          (n) => n.nodeType === 3 && n.textContent === ""
        ),
        false,
        "marks must not contain empty text nodes"
      );
    }
  }

  async function seedThreeParagraphHighlights(walkthrough) {
    const TH = window.LouTextHighlights;
    for (const phrase of THREE_PARAGRAPH_PHRASES) {
      const pos = walkthrough.textContent.indexOf(phrase);
      assert.ok(pos >= 0, `fixture phrase must exist: ${phrase}`);
      const range = TH._rangeFromTextOffsets(
        walkthrough,
        pos,
        pos + phrase.length
      );
      assert.ok(range, `range must resolve for: ${phrase}`);
      assert.equal(range.toString(), phrase);
      await window.LouLearnerStore.addTextHighlight(
        CHAPTER,
        "mechanisms",
        "MEC-output-basics",
        TH.selectorFromRange(walkthrough, range)
      );
    }
  }

  test("three highlights in different paragraphs survive reload unchanged", async () => {
    await renderRealMechanisms();
    const wt = walkthroughForBasics(window.document.getElementById("content"));
    await seedThreeParagraphHighlights(wt);

    const reloaded = await renderRealMechanisms();
    const marks = [
      ...walkthroughForBasics(reloaded).querySelectorAll(
        "mark.learner-highlight"
      ),
    ];
    assert.equal(marks.length, 3);
    assertHealthyMarks(marks);
    for (const phrase of THREE_PARAGRAPH_PHRASES) {
      assert.ok(
        marks.some((m) => m.textContent.includes(phrase)),
        `restored mark must contain: ${phrase}`
      );
    }
  });

  test("a new highlight after reload survives the next reload", async () => {
    await renderRealMechanisms();
    const wt = walkthroughForBasics(window.document.getElementById("content"));
    await seedThreeParagraphHighlights(wt);

    const afterFirstReload = await renderRealMechanisms();
    const wt2 = walkthroughForBasics(afterFirstReload);
    const extra = "fréquence cardiaque";
    const pos = wt2.textContent.indexOf(extra);
    assert.ok(pos >= 0);
    const range = window.LouTextHighlights._rangeFromTextOffsets(
      wt2,
      pos,
      pos + extra.length
    );
    const selector = window.LouTextHighlights.selectorFromRange(wt2, range);
    window.LouTextHighlights.wrapRangeInMark(range);
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-output-basics",
      selector
    );

    const afterSecondReload = await renderRealMechanisms();
    const marks = [
      ...walkthroughForBasics(afterSecondReload).querySelectorAll(
        "mark.learner-highlight"
      ),
    ];
    assert.equal(marks.length, 4);
    assertHealthyMarks(marks);
    assert.ok(marks.some((m) => m.textContent.includes(extra)));
  });

  test("restore() is idempotent on an already restored walkthrough", async () => {
    await renderRealMechanisms();
    const wt = walkthroughForBasics(window.document.getElementById("content"));
    await seedThreeParagraphHighlights(wt);

    const host = await renderRealMechanisms();
    const wt2 = walkthroughForBasics(host);
    await window.LouTextHighlights.restore(host, context);

    const marks = [...wt2.querySelectorAll("mark.learner-highlight")];
    assert.equal(marks.length, 3);
    assertHealthyMarks(marks);
  });

  test("_rangeFromTextOffsets uses half-open boundaries on split text nodes", () => {
    const root = window.document.createElement("div");
    root.appendChild(window.document.createTextNode("before"));
    const inner = window.document.createElement("mark");
    inner.className = "learner-highlight";
    inner.appendChild(window.document.createTextNode("highlight"));
    root.appendChild(inner);
    root.appendChild(window.document.createTextNode("after"));

    const TH = window.LouTextHighlights;
    const pos = "before".length;
    const end = pos + "highlight".length;
    const range = TH._rangeFromTextOffsets(root, pos, end);

    assert.ok(range);
    assert.equal(range.toString(), "highlight");
    assert.equal(range.startOffset, 0);
    assert.equal(range.endOffset, "highlight".length);
    assert.equal(range.startContainer.parentElement, inner);
    assert.equal(range.endContainer.parentElement, inner);
  });
});
