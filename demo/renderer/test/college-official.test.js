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
const SPEC_PATH = path.join(ROOT, "composition", "corpus-composition-v1.json");
const MANIFEST_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/manifest.json"
);

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

describe("Reader Acceptance — Collège officiel view", () => {
  let window;
  let config;
  let renderer;

  before(() => {
    const dom = new JSDOM(
      `<!DOCTYPE html><body><div id="content"></div></body>`,
      {
        url: "https://example.test/demo/renderer/",
        runScripts: "outside-only",
      }
    );
    window = dom.window;
    window.indexedDB = new IDBFactory();
    loadScripts(dom, [
      "config.js",
      "lib/marked.min.js",
      "markdown.js",
      "learner-patrimony.js",
      "learner-store.js",
      "renderer.js",
    ]);
    config = window.LouConfig;
    renderer = window.LouRenderer;
    renderer.init(window.document.getElementById("content"), null);
  });

  beforeEach(() => {
    config.contentRoot = null;
  });

  test("manifest exposes college_source_path for Item 234", () => {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    assert.equal(manifest.college_source_path, "source/official-college.md");
  });

  test("renderCollegeOfficial loads verbatim FIL B markdown", async () => {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
    const spec = JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
    const { readingViewModel } = compose(manifest, spec);
    const view = readingViewModel.views.find((v) => v.viewId === "college-official");
    assert.equal(view.availability, "published");

    const sourcePath = path.join(
      ROOT,
      "../../01-learning/chapters/cardio/234",
      manifest.college_source_path
    );
    const sourceText = fs.readFileSync(sourcePath, "utf8");

    window.fetch = async function (url) {
      const href = String(url);
      if (href.includes("source/official-college.md")) {
        return { ok: true, text: async () => sourceText };
      }
      return { ok: false, status: 404 };
    };

    await renderer.renderCollegeOfficial(view, manifest, "cardio/234", config);

    const body = window.document.querySelector(".college-official-body");
    assert.ok(body);
    assert.match(body.textContent, /Insuffisance cardiaque/);
    assert.match(body.innerHTML, /<h2[^>]*>/);
    assert.ok(window.document.querySelector(".college-official-badge"));
  });
});
