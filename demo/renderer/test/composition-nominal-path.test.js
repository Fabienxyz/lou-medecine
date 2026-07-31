// Lot F — nominal Reader path uses Composition only (no projection-tab legacy).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

function readSource(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

describe("Lot F — composition nominal path", () => {
  test("LouRenderer exposes no buildProjectionTabs", () => {
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    dom.window.eval(readSource("config.js"));
    dom.window.eval(readSource("renderer.js"));
    assert.equal(typeof dom.window.LouRenderer.buildProjectionTabs, "undefined");
  });

  test("LouConfig exposes no legacyTabLabel or USE_COMPOSITION_V1 flag", () => {
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    dom.window.eval(readSource("config.js"));
    assert.equal(typeof dom.window.LouConfig.legacyTabLabel, "undefined");
    assert.equal(dom.window.LouConfig.USE_COMPOSITION_V1, undefined);
  });

  test("app.js boot uses Composition for manifest-backed chapters only", () => {
    const appSource = readSource("app.js");
    assert.match(appSource, /buildReadingViewModel/);
    assert.match(appSource, /buildNavigationFromViewModel/);
    assert.doesNotMatch(appSource, /buildProjectionTabs/);
    assert.doesNotMatch(appSource, /USE_COMPOSITION_V1/);
    assert.match(appSource, /loadLegacyPrototypeTabContent/);
  });
});
