import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { VCCK_POSITIVE, VCCK_NEGATIVE } from "../lib/vcck/paths.js";
import { renderVcckSpec } from "../lib/vcck/render-bridge.js";
import { gateBeforeRender } from "../lib/vcck/signature-analyzer.js";
import { runW1Pipeline } from "../lib/vcck/w1-pipeline.js";
import {
  W1_SURFACE_CONTRACT,
  w1SvgWrapperHtml,
  w1SvgValidationWrapperHtml,
  validateW1SurfaceMetrics,
  validateW1SvgViewport,
  measureW1SvgRenderedWidth,
  captureW1HtmlPng,
} from "../lib/vcck/w1-surface.js";
import { W1_FAMILIES, W1_SVG_MAX_DISPLAY_WIDTH } from "../lib/vcck/w1-constants.js";

describe("vcck-w1-responsive", () => {
  it("W1 SVG wrapper applies versioned max-width", () => {
    const html = w1SvgWrapperHtml('<svg viewBox="0 0 100 100"></svg>', 1280);
    assert.match(html, new RegExp(`max-width:${W1_SVG_MAX_DISPLAY_WIDTH}px`));
    assert.match(html, /justify-content:center/);
    assert.match(html, /data-w1-surface="W1-S1"/);
  });

  it("W1 validation wrapper preserves overflow visible", () => {
    const html = w1SvgValidationWrapperHtml("<svg></svg>", 375);
    assert.match(html, /overflow:visible/);
  });

  it("surface metrics rejects empty capture", () => {
    const r = validateW1SurfaceMetrics({
      elementCount: 0,
      contentCaptureRatio: 0.01,
      contentRect: { width: 10, height: 10 },
      captureRect: { width: 400, height: 900 },
    });
    assert.equal(r.ok, false);
    assert.ok(r.errors.some((e) => e.includes("zero observed elements")));
    assert.ok(r.errors.some((e) => e.includes("content/capture ratio")));
  });

  it("surface metrics accepts bounded content", () => {
    const r = validateW1SurfaceMetrics({
      elementCount: 5,
      contentCaptureRatio: 0.25,
      contentRect: { width: 200, height: 300 },
      captureRect: { width: 400, height: 400 },
    });
    assert.equal(r.ok, true);
  });

  for (const family of ["chain", "dependent-sequence"]) {
    it(`${family} plan includes titleBox within canvas`, () => {
      const spec = loadVisualSpec(path.join(VCCK_POSITIVE, `${family}-short.yaml`));
      const result = runW1Pipeline(spec, { expectedFamily: family });
      assert.equal(result.ok, true);
      assert.ok(result.plan.titleBox, "titleBox required");
      assert.ok(result.plan.titleBox.innerWidth + 2 * (result.plan.dimensions.width - result.plan.titleBox.innerWidth) / 2 <= result.plan.dimensions.width);
      assert.equal(result.plan.titleBox.innerWidth + 2 * (family === "chain" ? 40 : 36), result.plan.dimensions.width);
      assert.ok(result.plan.titleLines.length >= 1);
    });
  }

  it("dependent-sequence long title wraps within viewBox", async () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "dependent-sequence-long.yaml"));
    const rendered = renderVcckSpec(spec);
    assert.equal(rendered.ok, true);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "w1-title-"));
    const svgPath = path.join(tmpDir, "artifact.svg");
    fs.writeFileSync(svgPath, rendered.artifact);
    const vp = await validateW1SvgViewport(svgPath, { widths: [375, 1280] });
    assert.equal(vp.ok, true, vp.errors.join("; "));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("broken title clip fails viewport validation", async () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "dependent-sequence-short.yaml"));
    const rendered = renderVcckSpec(spec);
    assert.equal(rendered.ok, true);
    const broken = rendered.artifact.replace(
      /viewBox="0 0 (\d+) (\d+)"/,
      'viewBox="0 0 50 200"',
    );
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "w1-broken-"));
    const svgPath = path.join(tmpDir, "broken.svg");
    fs.writeFileSync(svgPath, broken);
    const vp = await validateW1SvgViewport(svgPath, { widths: [375] });
    assert.equal(vp.ok, false);
    assert.ok(vp.errors.some((e) => e.includes("clipped")));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("1280 and 2400 render identical SVG width once max-width reached", async () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
    const rendered = renderVcckSpec(spec);
    assert.equal(rendered.ok, true);
    const w1280 = await measureW1SvgRenderedWidth(rendered.artifact, 1280);
    const w2400 = await measureW1SvgRenderedWidth(rendered.artifact, 2400);
    assert.equal(w1280, w2400);
    assert.ok(w1280 <= W1_SURFACE_CONTRACT.svgMaxDisplayWidth + 2);
    assert.ok(w1280 >= 200, "SVG should render at meaningful size");
  });

  it("375 uses available width without exceeding viewport", async () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "chain-short.yaml"));
    const rendered = renderVcckSpec(spec);
    const w375 = await measureW1SvgRenderedWidth(rendered.artifact, 375);
    assert.ok(w375 <= 375);
    assert.ok(w375 >= 200);
  });

  for (const family of ["two-pole", "flat-concurrent"]) {
    it(`${family} HTML capture has healthy content ratio`, async () => {
      const spec = loadVisualSpec(path.join(VCCK_POSITIVE, `${family}-short.yaml`));
      const rendered = renderVcckSpec(spec);
      assert.equal(rendered.ok, true);
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "w1-html-"));
      const htmlPath = path.join(tmpDir, "artifact.html");
      fs.writeFileSync(htmlPath, rendered.artifact);
      const pngPath = path.join(tmpDir, "capture-530.png");
      const metrics = await captureW1HtmlPng(htmlPath, pngPath, { width: 530 });
      const surf = validateW1SurfaceMetrics(metrics);
      assert.equal(surf.ok, true, surf.errors.join("; "));
      assert.ok(metrics.elementCount >= 3);
      assert.ok(metrics.contentCaptureRatio >= W1_SURFACE_CONTRACT.minContentCaptureRatio);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });
  }

  it("dependent-sequence negative blocks with UNSUPPORTED_TOPOLOGY", () => {
    const spec = loadVisualSpec(path.join(VCCK_NEGATIVE, "dependent-sequence-negative.yaml"));
    const gate = gateBeforeRender(spec);
    assert.equal(gate.allowed, false);
    assert.equal(gate.code, "UNSUPPORTED_TOPOLOGY");
    assert.notEqual(gate.analysis?.status, "recognized");
    const attempted = renderVcckSpec(spec);
    assert.equal(attempted.ok, false);
  });
});

describe("vcck-w1-responsive wrapper contract", () => {
  it("documents minContentCaptureRatio threshold", () => {
    assert.equal(W1_SURFACE_CONTRACT.minContentCaptureRatio, 0.08);
    assert.equal(W1_SURFACE_CONTRACT.minObservedElements, 1);
  });
});
