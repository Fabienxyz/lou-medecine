import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { detectChapters, parseHeadingContent } from "../lib/detect.js";

describe("parseHeadingContent", () => {
  test("extracts item number and title from heading text", () => {
    const p = parseHeadingContent(
      "Chapitre 18 – Item 234 : Insuffisance cardiaque de l’adulte"
    );
    assert.equal(p.itemNumber, "234");
    assert.equal(p.titleForSlug, "Insuffisance cardiaque de l’adulte");
  });

  test("handles Item : N form found in source headings", () => {
    const p = parseHeadingContent(
      "Chapitre 09 – Item : 152 Endocardite infectieuse"
    );
    assert.equal(p.itemNumber, "152");
    assert.equal(p.titleForSlug, "Endocardite infectieuse");
  });

  test("works without item number", () => {
    const p = parseHeadingContent("Preface");
    assert.equal(p.itemNumber, null);
    assert.equal(p.titleForSlug, "Preface");
  });
});

describe("detectChapters", () => {
  test("detects H1 chapters in order", () => {
    const md = [
      "# Chapitre 01 – Item 221 : Alpha",
      "",
      "Body A",
      "# Chapitre 02 – Item 222 : Beta",
      "Body B",
      "",
    ].join("\n");
    const { chapters } = detectChapters(md);
    assert.equal(chapters.length, 2);
    assert.equal(chapters[0].filename, "item-221-alpha.md");
    assert.equal(chapters[1].filename, "item-222-beta.md");
    assert.equal(chapters[0].startLine, 0);
    assert.ok(chapters[0].endLine < chapters[1].startLine);
  });

  test("fails when no H1 headings", () => {
    assert.throws(() => detectChapters("## Only H2\n\nText\n"), /No chapter H1/);
  });

  test("fails on content before first H1", () => {
    assert.throws(
      () => detectChapters("Preamble\n\n# Chapitre 01 – Item 1 : X\n\nBody\n"),
      /before the first chapter/
    );
  });

  test("fails on empty chapter", () => {
    assert.throws(
      () =>
        detectChapters(
          "# Chapitre 01 – Item 1 : Alpha\n# Chapitre 02 – Item 2 : Beta\n\nBody\n"
        ),
      /Empty chapter/
    );
  });

  test("fails on duplicate heading", () => {
    assert.throws(
      () =>
        detectChapters(
          "# Same Title Item 1 : Alpha\n\nA\n# Same Title Item 1 : Alpha\n\nB\n"
        ),
      /Duplicate chapter heading/
    );
  });

  test("fails on duplicate derived filename", () => {
    assert.throws(
      () =>
        detectChapters(
          "# Chapitre 01 – Item 9 : Titre\n\nA\n# Chapitre 02 – Item 9 : Titre!\n\nB\n"
        ),
      /Duplicate derived filename/
    );
  });
});
