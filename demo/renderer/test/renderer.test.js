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
});
