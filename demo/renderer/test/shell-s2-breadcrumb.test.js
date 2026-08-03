// Shell V1 — S2 breadcrumb (20-READER-V1-SHELL-ARCHITECTURE.md §3.3, PAS-SHELL S2).
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  BRAND_LABEL,
  extractItemNumber,
  extractChapterShortTitle,
  deriveChapterSegmentLabel,
  buildReaderBreadcrumbSegments,
  renderBreadcrumb,
} from "../shell/breadcrumb.mjs";
import { JSDOM } from "jsdom";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

describe("Shell V1 S2 — breadcrumb model", () => {
  test("extractItemNumber parses chapter id", () => {
    assert.equal(extractItemNumber("cardio/234"), "234");
    assert.equal(extractItemNumber("nephro/12"), "12");
    assert.equal(extractItemNumber("cardio/234-insuffisance"), null);
  });

  test("extractChapterShortTitle strips package suffix", () => {
    assert.equal(
      extractChapterShortTitle("Insuffisance cardiaque — Chapter Package v1"),
      "Insuffisance cardiaque"
    );
  });

  test("deriveChapterSegmentLabel uses item number and short title", () => {
    assert.equal(
      deriveChapterSegmentLabel({
        chapter: "cardio/234",
        title: "Insuffisance cardiaque — Chapter Package v1",
      }),
      "Item 234 — Insuffisance cardiaque"
    );
  });

  test("buildReaderBreadcrumbSegments is generic (no hardcoded chapter)", () => {
    const segments = buildReaderBreadcrumbSegments({
      specialty: "Néphrologie",
      chapter: "nephro/12",
      title: "IRC — Chapter Package v1",
    });
    assert.deepEqual(segments, [
      { kind: "brand", label: BRAND_LABEL, navigable: false },
      { kind: "specialty", label: "Néphrologie", navigable: false },
      { kind: "chapter", label: "Item 12 — IRC", navigable: true },
    ]);
  });
});

describe("Shell V1 S2 — index.html structure", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

  test("shell exposes breadcrumb nav and no legacy chapter header", () => {
    assert.match(html, /id="shell-breadcrumb"/);
    assert.match(html, /shell-breadcrumb/);
    assert.equal(html.includes('id="chapter-line"'), false);
    assert.equal(html.includes('id="chapter-title"'), false);
    assert.equal(html.includes('class="shell-brand"'), false);
  });
});

describe("Shell V1 S2 — renderBreadcrumb DOM", () => {
  test("renders three segments with navigable chapter link", () => {
    const dom = new JSDOM("<!DOCTYPE html><body><nav id='bc'></nav></body>");
    const container = dom.window.document.getElementById("bc");
    renderBreadcrumb(
      container,
      buildReaderBreadcrumbSegments({
        specialty: "Cardiologie",
        chapter: "cardio/234",
        title: "Insuffisance cardiaque — Chapter Package v1",
      })
    );

    const items = container.querySelectorAll(".shell-breadcrumb-item");
    assert.equal(items.length, 3);
    assert.equal(
      items[0].querySelector(".shell-breadcrumb-text")?.textContent,
      BRAND_LABEL
    );
    assert.equal(
      items[1].querySelector(".shell-breadcrumb-text")?.textContent,
      "Cardiologie"
    );
    const chapterBtn = items[2].querySelector(".shell-breadcrumb-link");
    assert.ok(chapterBtn);
    assert.equal(chapterBtn.textContent, "Item 234 — Insuffisance cardiaque");
    assert.equal(items[2].dataset.segment, "chapter");
  });
});
