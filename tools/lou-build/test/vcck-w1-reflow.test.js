import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { loadVisualSpec } from "../lib/visual-spec.js";
import { VCCK_POSITIVE } from "../lib/vcck/paths.js";
import { runW1Pipeline } from "../lib/vcck/w1-pipeline.js";
import { W1_VIEWPORT_WIDTHS } from "../lib/vcck/w1-constants.js";
import {
  validateW1HtmlReflowAtWidth,
  validateW1HtmlReflowMutant,
} from "../lib/vcck/w1-reflow-validate.js";

describe("vcck-w1-reflow", () => {
  it("two-pole reflow matches plan at five widths", async () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "two-pole-short.yaml"));
    const rendered = runW1Pipeline(spec, { expectedFamily: "two-pole" });
    assert.equal(rendered.ok, true);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "w1-reflow-tp-"));
    const htmlPath = path.join(tmpDir, "artifact.html");
    fs.writeFileSync(htmlPath, rendered.artifact);

    for (const width of W1_VIEWPORT_WIDTHS) {
      const r = await validateW1HtmlReflowAtWidth(rendered.plan, htmlPath, width, "two-pole");
      assert.equal(r.ok, true, `${width}px: ${r.errors?.join("; ")}`);
      assert.ok(r.detail?.observed);
      if (width < 768) {
        assert.equal(r.detail.observed.cardsVisible, true);
        assert.equal(r.detail.observed.tableVisible, false);
      } else {
        assert.equal(r.detail.observed.tableVisible, true);
        assert.equal(r.detail.observed.cardsVisible, false);
      }
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("flat-concurrent columns match plan.reflowByWidth", async () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "flat-concurrent-short.yaml"));
    const rendered = runW1Pipeline(spec, { expectedFamily: "flat-concurrent" });
    assert.equal(rendered.ok, true);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "w1-reflow-fc-"));
    const htmlPath = path.join(tmpDir, "artifact.html");
    fs.writeFileSync(htmlPath, rendered.artifact);

    for (const width of W1_VIEWPORT_WIDTHS) {
      const r = await validateW1HtmlReflowAtWidth(rendered.plan, htmlPath, width, "flat-concurrent");
      assert.equal(r.ok, true, `${width}px: ${r.errors?.join("; ")}`);
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("CSS breakpoint mutant fails without plan change", async () => {
    const spec = loadVisualSpec(path.join(VCCK_POSITIVE, "two-pole-short.yaml"));
    const rendered = runW1Pipeline(spec, { expectedFamily: "two-pole" });
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "w1-reflow-mut-"));
    const htmlPath = path.join(tmpDir, "artifact.html");
    fs.writeFileSync(htmlPath, rendered.artifact);

    const r = await validateW1HtmlReflowMutant(rendered.plan, htmlPath, 768, "two-pole", 900);
    assert.equal(r.ok, false);
    assert.ok(r.errors.includes("REFLOW_TABLE_HIDDEN"));
    assert.ok(r.errors.includes("REFLOW_CARDS_VISIBLE_AT_OR_ABOVE_BREAKPOINT"));
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
