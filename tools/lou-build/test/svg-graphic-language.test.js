import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadSvgGraphicLanguage,
  resetSvgGraphicLanguageCache,
  getDecisionNodeKindStyle,
  getW1DependentSequenceNodeStyle,
  markerSvg,
} from "../lib/svg-graphic-language.js";

const CONFIG_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../config/svg-graphic-language-v1.yaml",
);

describe("svg-graphic-language loader", () => {
  beforeEach(() => {
    resetSvgGraphicLanguageCache();
  });

  it("loads canonical config with required sections", () => {
    const lang = loadSvgGraphicLanguage();
    assert.equal(lang.colors.accent, "#2563eb");
    assert.equal(lang.typography.font_stack, "Inter, system-ui, -apple-system, sans-serif");
    assert.ok(lang.w1VerticalLayout.rowGap);
    assert.ok(lang.w1DecisionLayout.rowGap);
    assert.ok(lang.decisionAlgorithmLayout.layerGapY);
    assert.ok(lang.twoPoleLayout.width);
  });

  it("caches config within process", () => {
    const a = loadSvgGraphicLanguage();
    const b = loadSvgGraphicLanguage();
    assert.equal(a, b);
  });

  it("reloads when reload option is set", () => {
    const a = loadSvgGraphicLanguage();
    const b = loadSvgGraphicLanguage({ reload: true });
    assert.notEqual(a, b);
    assert.deepEqual(a.raw.version, b.raw.version);
  });

  it("fails explicitly on missing config file", () => {
    assert.throws(
      () => loadSvgGraphicLanguage({ configPath: "/nonexistent/svg-graphic-language-v1.yaml", reload: true }),
      /missing/,
    );
  });

  it("fails explicitly on missing required section", () => {
    const tmp = path.join(path.dirname(fileURLToPath(import.meta.url)), ".tmp-graphic-lang.yaml");
    fs.writeFileSync(tmp, "version: test\ncolors:\n  accent: '#000'\n");
    try {
      assert.throws(() => loadSvgGraphicLanguage({ configPath: tmp, reload: true }), /missing required section/);
    } finally {
      fs.unlinkSync(tmp);
    }
  });

  it("exposes node kind styles from YAML", () => {
    const entry = getDecisionNodeKindStyle("entry");
    assert.equal(entry.fill, "#f5f7fa");
    assert.equal(entry.strokeWidth, 2);
    const decision = getDecisionNodeKindStyle("decision");
    assert.equal(decision.shape, "diamond");
    const humanReview = getDecisionNodeKindStyle("human-review");
    assert.equal(humanReview.stroke, "#ea580c");
    const test = getW1DependentSequenceNodeStyle("test");
    assert.equal(test.dash, "5 4");
  });

  it("renders marker definitions from YAML connectors", () => {
    const svg = markerSvg("arrow_solid");
    assert.match(svg, /id="vg-arrow-solid"/);
    assert.match(svg, /markerWidth="7"/);
    assert.match(svg, /fill="#9ca3af"/);
  });

  it("maps family profiles to W1 layouts", () => {
    const lang = loadSvgGraphicLanguage();
    assert.equal(lang.w1VerticalLayout.fontSize, lang.raw.families.chain.theme_label.size_px);
    assert.equal(lang.w1DecisionLayout.fontSize, lang.raw.families.dependent_sequence.theme_label.size_px);
    assert.equal(lang.decisionAlgorithmLayout.fontSize, lang.raw.families.decision_algorithm.theme_label.size_px);
  });

  it("reads config from expected path by default", () => {
    assert.ok(fs.existsSync(CONFIG_PATH));
    const lang = loadSvgGraphicLanguage({ configPath: CONFIG_PATH, reload: true });
    assert.equal(lang.raw.contract, "SVG-GRAPHIC-LANGUAGE-V1");
  });
});
