// Compliance remediation tests — NC-1, NC-2, NC-3 (Renderer Component Contract).
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

function baseManifest() {
  return {
    chapter: CHAPTER,
    known_absent: ["mastery", "actors", "readiness"],
    projections: [
      {
        id: "mechanisms",
        type: "understanding.mechanisms",
        path: "projections/understanding/mechanisms.md",
        status: "published",
        order: 1,
        label: "Pourquoi ?",
        elements: ["MEC-oap"],
        visuals: { "MEC-oap": "figures/mec-oap.svg" },
      },
      {
        id: "broken-published",
        type: "understanding.story",
        status: "published",
        order: 2,
        label: "Sans chemin",
        elements: [],
      },
    ],
    official_visuals: [],
  };
}

const MECHANISMS_MD = `---
type: understanding.mechanisms
---

## Comment la congestion mène-t-elle à l'OAP ? {#MEC-oap}

Transmission aux capillaires pulmonaires. Au-delà du seuil, transsudat.
`;

describe("NC-1 — known_absent and projection availability states", () => {
  let window;
  let config;
  let renderer;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    loadScripts(dom, ["config.js", "renderer.js"]);
    config = window.LouConfig;
    renderer = window.LouRenderer;
    renderer.init(window.document.getElementById("content"), null);
  });

  test("published projection is availability=published", () => {
    const tabs = renderer.buildProjectionTabs(baseManifest(), config);
    const mechanisms = tabs.find((t) => t.id === "mechanisms");
    assert.ok(mechanisms);
    assert.equal(mechanisms.availability, "published");
    assert.equal(mechanisms.implemented, true);
  });

  test("known_absent projections appear with availability=known_absent", () => {
    const tabs = renderer.buildProjectionTabs(baseManifest(), config);
    const absentIds = tabs
      .filter((t) => t.availability === "known_absent")
      .map((t) => t.id)
      .sort();
    assert.deepEqual(absentIds, ["actors", "mastery", "readiness"]);
    absentIds.forEach((id) => {
      const tab = tabs.find((t) => t.id === id);
      assert.equal(tab.implemented, false);
      assert.equal(tab.path, null);
    });
  });

  test("published projection without path is availability=invalid", () => {
    const tabs = renderer.buildProjectionTabs(baseManifest(), config);
    const broken = tabs.find((t) => t.id === "broken-published");
    assert.ok(broken);
    assert.equal(broken.availability, "invalid");
    assert.equal(broken.implemented, false);
  });

  test("known_absent message is distinct from missing and invalid", () => {
    const known = renderer.projectionAvailabilityMessage("known_absent", config);
    const missing = renderer.projectionAvailabilityMessage("missing", config);
    const invalid = renderer.projectionAvailabilityMessage("invalid", config);
    assert.notEqual(known, missing);
    assert.notEqual(known, invalid);
    assert.notEqual(missing, invalid);
    assert.match(known, /absente connue/i);
    assert.match(known, /pas une erreur/i);
  });

  test("showMessage exposes data-state for known_absent / missing / invalid", () => {
    renderer.showMessage(
      renderer.projectionAvailabilityMessage("known_absent", config),
      { state: "known_absent" }
    );
    assert.equal(
      window.document.querySelector(".content-status").dataset.state,
      "known_absent"
    );
    renderer.showMessage(
      renderer.projectionAvailabilityMessage("missing", config),
      { state: "missing" }
    );
    assert.equal(
      window.document.querySelector(".content-status").dataset.state,
      "missing"
    );
    renderer.showMessage(
      renderer.projectionAvailabilityMessage("invalid", config),
      { state: "invalid" }
    );
    assert.equal(
      window.document.querySelector(".content-status").dataset.state,
      "invalid"
    );
  });
});

describe("NC-3 — manifest load error doctrine", () => {
  let window;
  let config;
  let renderer;
  let originalFetch;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    loadScripts(dom, ["config.js", "renderer.js"]);
    config = window.LouConfig;
    renderer = window.LouRenderer;
    renderer.init(window.document.getElementById("content"), null);
    originalFetch = window.fetch;
  });

  beforeEach(() => {
    config.contentRoot = null;
    window.fetch = originalFetch;
  });

  test("classifyManifestFetchError distinguishes 404 / invalid / network / server", () => {
    assert.equal(
      renderer.classifyManifestFetchError({ code: "not_found", status: 404 }),
      "not_found"
    );
    assert.equal(
      renderer.classifyManifestFetchError({ code: "invalid" }),
      "invalid"
    );
    assert.equal(
      renderer.classifyManifestFetchError({ code: "network" }),
      "network"
    );
    assert.equal(
      renderer.classifyManifestFetchError({ code: "server", status: 500 }),
      "server"
    );
  });

  test("404 activates legacy only", async () => {
    window.fetch = async () => ({ ok: false, status: 404 });
    const result = await renderer.loadPublishedManifest(CHAPTER, config);
    assert.equal(result.ok, false);
    assert.equal(result.reason, "not_found");
    assert.equal(result.useLegacy, true);
  });

  test("invalid JSON does not activate legacy", async () => {
    window.fetch = async () => ({
      ok: true,
      status: 200,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    });
    const result = await renderer.loadPublishedManifest(CHAPTER, config);
    assert.equal(result.ok, false);
    assert.equal(result.reason, "invalid");
    assert.equal(result.useLegacy, false);
  });

  test("network error does not activate legacy", async () => {
    window.fetch = async () => {
      throw new TypeError("Failed to fetch");
    };
    const result = await renderer.loadPublishedManifest(CHAPTER, config);
    assert.equal(result.ok, false);
    assert.equal(result.reason, "network");
    assert.equal(result.useLegacy, false);
  });

  test("server error does not activate legacy", async () => {
    window.fetch = async () => ({ ok: false, status: 503 });
    const result = await renderer.loadPublishedManifest(CHAPTER, config);
    assert.equal(result.ok, false);
    assert.equal(result.reason, "server");
    assert.equal(result.useLegacy, false);
  });

  test("manifest error messages are distinct per reason", () => {
    assert.notEqual(
      renderer.manifestErrorMessage("invalid", config),
      renderer.manifestErrorMessage("network", config)
    );
    assert.notEqual(
      renderer.manifestErrorMessage("network", config),
      renderer.manifestErrorMessage("server", config)
    );
  });
});

describe("NC-2 — unrestorable learner annotations are signaled and kept", () => {
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
      "caret-anchor.js",
      "inline-notes.js",
      "svg-loader.js",
      "inline-formatting.js",
      "blocks.js",
      "renderer.js",
    ]);
  });

  beforeEach(() => {
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    const manifest = {
      chapter: CHAPTER,
      projections: [
        {
          id: "mechanisms",
          path: "projections/understanding/mechanisms.md",
          status: "published",
          elements: ["MEC-oap"],
          visuals: { "MEC-oap": "figures/mec-oap.svg" },
        },
      ],
      official_visuals: [{ element: "MEC-oap", state: "published" }],
      visuals: [
        {
          id: "mec-oap",
          element: "MEC-oap",
          path: "figures/mec-oap.svg",
          alt: "OAP",
        },
      ],
    };
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
    const html = window.LouMarkdown.parse(
      window.LouRenderer.prepareLearnerMarkdown(MECHANISMS_MD)
    );
    await window.LouRenderer.renderProjection(html, context);
    return window.document.getElementById("content");
  }

  test("restorable note mounts inline (normal restore)", async () => {
    await renderMechanisms();
    const walkthrough = window.document.querySelector(
      '[data-element="MEC-oap"] .block-walkthrough'
    );
    const anchor = window.LouCaretAnchor.createCaretAnchor(
      walkthrough,
      walkthrough.querySelector("p").firstChild,
      0
    );
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      anchor,
      "Note restaurable"
    );
    const content = await renderMechanisms();
    const note = content.querySelector(".walkthrough-note");
    assert.ok(note);
    assert.equal(note.textContent, "Note restaurable");
    assert.equal(
      content.querySelectorAll(
        '.learner-orphan-annotation[data-orphan-kind="note"]'
      ).length,
      0
    );
  });

  test("unrestorable note is signaled and kept in store", async () => {
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      {
        type: "CaretAnchor",
        offset: 0,
        prefix: "___gone___",
        suffix: "___gone___",
      },
      "Note orpheline"
    );
    const content = await renderMechanisms();
    assert.equal(content.querySelector(".walkthrough-note"), null);
    const orphan = content.querySelector(
      '.learner-orphan-annotation[data-orphan-kind="note"]'
    );
    assert.ok(orphan);
    assert.match(orphan.textContent, /Note orpheline/);
    const kept = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(kept.length, 1);
    assert.equal(kept[0].text, "Note orpheline");
  });

  test("unrestorable highlight is signaled and kept in store", async () => {
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      {
        type: "TextQuoteSelector",
        exact: "texte-inexistant-xyz",
        prefix: "aaa",
        suffix: "bbb",
      }
    );
    const content = await renderMechanisms();
    assert.equal(content.querySelector(".learner-highlight"), null);
    const orphan = content.querySelector(
      '.learner-orphan-annotation[data-orphan-kind="highlight"]'
    );
    assert.ok(orphan);
    assert.match(orphan.textContent, /texte-inexistant-xyz/);
    const kept = await window.LouLearnerStore.listTextHighlights(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(kept.length, 1);
    assert.equal(kept[0].selector.exact, "texte-inexistant-xyz");
  });
});
