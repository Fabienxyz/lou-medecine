import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { compose } from "../composition/composition-engine.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SPEC_PATH = path.join(ROOT, "composition", "corpus-composition-v1.json");
const MANIFEST_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/manifest.json"
);
const ARTIFACT_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/build/cognitive-priming.v1.json"
);
const FIXTURE_MANIFEST_PATH = path.join(
  HERE,
  "fixtures",
  "manifest-understanding-full.fixture.json"
);

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

describe("Lot AP-E — Renderer cognitive priming integration", () => {
  let window;
  let config;
  let renderer;
  let artifactText;

  before(() => {
    const dom = new JSDOM(
      `<!DOCTYPE html><body><div id="content"></div></body>`,
      {
        url: "https://example.test/demo/renderer/",
        runScripts: "outside-only",
      }
    );
    window = dom.window;
    loadScripts(dom, [
      "config.js",
      "cognitive-priming-render.js",
      "renderer.js",
    ]);
    config = window.LouConfig;
    renderer = window.LouRenderer;
    renderer.init(window.document.getElementById("content"), null);
    artifactText = fs.readFileSync(ARTIFACT_PATH, "utf8");
  });

  beforeEach(() => {
    config.contentRoot = null;
    window.fetch = async function () {
      return { ok: false, status: 404 };
    };
  });

  test("package 234 published view renders full cognitive priming content", async () => {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
    const { readingViewModel } = compose(manifest, spec);
    const view = readingViewModel.views.find(
      (v) => v.viewId === "cognitive-priming"
    );
    assert.equal(view.availability, "published");
    assert.equal(view.primingRef.resolved, true);

    window.fetch = async function (url) {
      const href = String(url);
      if (href.includes("cognitive-priming.v1.json")) {
        return { ok: true, text: async () => artifactText };
      }
      return { ok: false, status: 404 };
    };

    await renderer.renderComposedView(view, manifest, "cardio/234", config);

    const body = window.document.querySelector(".cognitive-priming-body");
    assert.ok(body);
    assert.ok(body.querySelector(".cp-profile"));
    assert.ok(body.querySelector(".cp-summary-list"));
    assert.equal(body.querySelectorAll(".cp-star--filled").length, 8);
    assert.match(body.textContent, /Insuffisance cardiaque/);
    assert.match(body.textContent, /L'insuffisance cardiaque combine un débit insuffisant/);
    assert.match(
      body.textContent,
      /Complément pédagogique \(IA\) — non issu du Collège/
    );
    assert.ok(body.querySelector(".cp-edn-ref--unavailable"));
    assert.equal(
      window.document.querySelector(".content-status"),
      null
    );
  });

  test("legacy package without artefact stays planned", async () => {
    const manifest = JSON.parse(fs.readFileSync(FIXTURE_MANIFEST_PATH, "utf8"));
    const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
    const { readingViewModel } = compose(manifest, spec);
    const view = readingViewModel.views.find(
      (v) => v.viewId === "cognitive-priming"
    );
    assert.equal(view.availability, "planned");

    let fetchCalled = false;
    window.fetch = async function () {
      fetchCalled = true;
      return { ok: false, status: 404 };
    };

    await renderer.renderComposedView(view, manifest, manifest.chapter, config);
    assert.equal(fetchCalled, false);
    assert.equal(
      window.document.querySelector(".content-status").dataset.state,
      "planned"
    );
  });

  test("missing artefact shows explicit error state", async () => {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
    const { readingViewModel } = compose(manifest, spec);
    const view = readingViewModel.views.find(
      (v) => v.viewId === "cognitive-priming"
    );

    window.fetch = async function () {
      return { ok: false, status: 404 };
    };

    await renderer.renderComposedView(view, manifest, "cardio/234", config);
    const status = window.document.querySelector(".content-status");
    assert.equal(status.dataset.state, "cp_artifact_missing");
    assert.match(status.textContent, /introuvable/i);
  });

  test("invalid JSON shows parse error state", async () => {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
    const { readingViewModel } = compose(manifest, spec);
    const view = readingViewModel.views.find(
      (v) => v.viewId === "cognitive-priming"
    );

    window.fetch = async function (url) {
      if (String(url).includes("cognitive-priming.v1.json")) {
        return { ok: true, text: async () => "{bad-json" };
      }
      return { ok: false, status: 404 };
    };

    await renderer.renderComposedView(view, manifest, "cardio/234", config);
    assert.equal(
      window.document.querySelector(".content-status").dataset.state,
      "cp_parse"
    );
  });

  test("unsupported schema shows schema error state", async () => {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
    const { readingViewModel } = compose(manifest, spec);
    const view = readingViewModel.views.find(
      (v) => v.viewId === "cognitive-priming"
    );

    window.fetch = async function (url) {
      if (String(url).includes("cognitive-priming.v1.json")) {
        return {
          ok: true,
          text: async () =>
            JSON.stringify({
              schema_version: 99,
              chapter_id: "cardio/234",
              profile: { comprehension: 1, memorization: 1 },
              prerequisites: { edn_references: [], ai_complements: [] },
              summary: { bullets: ["x"] },
            }),
        };
      }
      return { ok: false, status: 404 };
    };

    await renderer.renderComposedView(view, manifest, "cardio/234", config);
    assert.equal(
      window.document.querySelector(".content-status").dataset.state,
      "cp_schema"
    );
  });

  test("notes view remains unchanged", async () => {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
    const { readingViewModel } = compose(manifest, spec);
    const view = readingViewModel.views.find((v) => v.viewId === "notes");

    await renderer.renderComposedView(view, manifest, "cardio/234", config);
    assert.ok(window.document.querySelector(".view-notes-shell"));
  });
});
