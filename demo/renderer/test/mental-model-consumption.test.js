// MM Cleanup — mental-model consumption invariants (Content Consumption Freeze).
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";
import { compose } from "../composition/composition-engine.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const CHAPTER = "cardio/234";
const SPEC_PATH = path.join(ROOT, "composition", "corpus-composition-v1.json");
const MANIFEST_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/manifest.json"
);
const STORY_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/projections/understanding/story.md"
);
const SVG_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/figures/mm-pump-decompensation.svg"
);

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

describe("MM Cleanup — normalizeMentalModelBlocks()", () => {
  let renderer;
  let manifest;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    globalThis.window = dom.window;
    globalThis.document = dom.window.document;
    globalThis.Node = dom.window.Node;
    globalThis.URL = dom.window.URL;
    globalThis.requestAnimationFrame = (cb) => {
      cb();
      return 0;
    };
    loadScripts(dom, ["config.js", "renderer.js"]);
    renderer = dom.window.LouRenderer;
    manifest = loadJson(MANIFEST_PATH);
  });

  test("drops non-visual story blocks for MM display", () => {
    const spec = loadJson(SPEC_PATH);
    const { readingViewModel } = compose(manifest, spec);
    const mental = readingViewModel.views.find((v) => v.viewId === "mental-model");
    assert.equal(mental.blocks.length, 2);

    const normalized = renderer.normalizeMentalModelBlocks(mental.blocks, manifest);
    assert.equal(normalized.length, 1);
    assert.equal(normalized[0].elementId, "MM-pump-decompensation");
    assert.equal(normalized[0].sourceProjectionId, "story");
  });
});

describe("MM Cleanup — renderComposedView(mental-model)", () => {
  let dom;
  let manifest;
  let mentalView;
  let fetchedUrls;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><body><div id="content"></div></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    const window = dom.window;
    globalThis.window = window;
    globalThis.document = window.document;
    globalThis.Node = window.Node;
    globalThis.URL = window.URL;
    globalThis.requestAnimationFrame = (cb) => {
      cb();
      return 0;
    };
    window.indexedDB = new IDBFactory();

    loadScripts(window, [
      "node_modules/marked/marked.min.js",
      "config.js",
      "markdown.js",
      "learner-patrimony.js",
      "learner-store.js",
      "blocks.js",
      "renderer.js",
    ]);

    manifest = loadJson(MANIFEST_PATH);
    const spec = loadJson(SPEC_PATH);
    const { readingViewModel } = compose(manifest, spec);
    mentalView = readingViewModel.views.find((v) => v.viewId === "mental-model");
    window.LouRenderer.init(window.document.getElementById("content"), null);

    fetchedUrls = [];
    const storyText = fs.readFileSync(STORY_PATH, "utf8");
    const svgText = fs.readFileSync(SVG_PATH, "utf8");

    window.fetch = async function (url) {
      fetchedUrls.push(String(url));
      const href = String(url);
      if (href.includes("story.md")) {
        return { ok: true, text: async () => storyText };
      }
      if (href.includes("mm-pump-decompensation.svg")) {
        return { ok: true, text: async () => svgText };
      }
      return { ok: false, status: 404 };
    };
  });

  test("renders one official SVG, one walkthrough, no legacy guide duplication", async () => {
    await window.LouRenderer.renderComposedView(
      mentalView,
      manifest,
      CHAPTER,
      window.LouConfig
    );

    const content = window.document.getElementById("content");
    const blocks = content.querySelectorAll(".pedagogical-block");
    assert.equal(blocks.length, 1, "expected exactly one pedagogical block");

    const mmBlock = content.querySelector(
      '[data-element="MM-pump-decompensation"][data-source-projection="story"]'
    );
    assert.ok(mmBlock, "MM block must come from story projection");
    assert.equal(
      content.querySelectorAll(
        '.pedagogical-block[data-element="MM-pump-decompensation"]'
      ).length,
      1,
      "duplicate MM pedagogical block must not render"
    );
    assert.equal(
      content.querySelectorAll('[data-source-projection="overview"]').length,
      0,
      "overview legacy guide must not render"
    );

    const figures = content.querySelectorAll("figure.official-visual");
    assert.equal(figures.length, 1, "AAI-MM-03: one primary official SVG");

    const walkthroughs = content.querySelectorAll(".block-walkthrough");
    assert.equal(walkthroughs.length, 1, "AAI-MM-04: one narrative walkthrough");

    const bodyText = content.textContent || "";
    assert.ok(
      bodyText.includes("Reprenons la même trajectoire"),
      "official story walkthrough must remain"
    );
    assert.ok(
      !bodyText.includes("Étape sur la figure"),
      "overview guide table must not appear"
    );
    assert.ok(
      !bodyText.includes("Imagine une ville"),
      "ANA analogy block must not appear in MM view"
    );
    assert.ok(
      !bodyText.includes("Histoire — entrer dans l'item 234"),
      "legacy story preamble must not appear"
    );

    const titles = content.querySelectorAll(".block-question");
    assert.equal(titles.length, 1, "no duplicate MM titles");
  });

  test("does not fetch overview or generated-assets in product mode", async () => {
    window.LouConfig.enableProductMode({
      libraryBaseUrl: "https://example.test/library",
      releaseId: "lou-offline-cardio__234__2022__1-v1",
      packageAccess: {},
      buildReleaseScopedUrl: function (base, releaseId, assetPath) {
        return base + "/packages/" + releaseId + "/" + assetPath;
      },
    });

    await window.LouRenderer.renderComposedView(
      mentalView,
      manifest,
      CHAPTER,
      window.LouConfig
    );

    assert.ok(
      !fetchedUrls.some((u) => u.includes("overview.md")),
      "AAI-MM-05: overview must not be fetched"
    );
    assert.ok(
      !fetchedUrls.some((u) => u.includes("generated-assets")),
      "AAI-MM-05: no legacy generated-assets fetch"
    );
    assert.ok(
      fetchedUrls.some((u) => u.includes("/packages/") && u.includes("story.md")),
      "product mode must fetch release-scoped story"
    );
  });
});
