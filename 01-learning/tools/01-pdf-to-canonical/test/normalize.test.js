import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  tryJoinHyphenated,
  repairHyphenation,
  isPageNumber,
  normalizeWhitespace,
  stripChrome,
  joinItems,
  collapseArtificialBreaks,
} from "../lib/normalize.js";
import { createWarningCollector } from "../lib/warnings.js";
import { makeLine } from "./helpers.js";

describe("normalizeWhitespace", () => {
  test("collapses duplicated whitespace and NBSP", () => {
    assert.equal(normalizeWhitespace("a \u00a0  b\t\tc"), "a b c");
  });

  test("strips soft-hyphen characters", () => {
    assert.equal(normalizeWhitespace("pré\u00advention"), "prévention");
  });
});

describe("hyphenation repair", () => {
  test("joins soft-hyphenated line breaks", () => {
    assert.equal(
      tryJoinHyphenated("avec physiopatho-", "logie et listes."),
      "avec physiopathologie et listes."
    );
  });

  test("keeps real compound hyphens at end of complete words when next is uppercase", () => {
    assert.equal(tryJoinHyphenated("sous-", "Intimale suite"), null);
  });

  test("repairHyphenation merges across lines", () => {
    const lines = [
      makeLine("sur plusieurs lignes avec physiopatho-"),
      makeLine("logie et listes."),
    ];
    const out = repairHyphenation(lines);
    assert.equal(out.length, 1);
    assert.equal(out[0].text, "sur plusieurs lignes avec physiopathologie et listes.");
  });
});

describe("page-number removal", () => {
  test("detects bare page numbers in footer band", () => {
    assert.equal(
      isPageNumber("12", makeLine("12", { y: 20, pageHeight: 842 })),
      true
    );
  });

  test("does not treat body numbers as page numbers", () => {
    assert.equal(
      isPageNumber("12", makeLine("12", { y: 400, pageHeight: 842 })),
      false
    );
  });

  test("stripChrome removes publication boilerplate and footer page numbers", () => {
    const warnings = createWarningCollector();
    const lines = [
      makeLine("By SFC Published On: 07/11/2024"),
      makeLine("I. Généralités", { y: 700 }),
      makeLine("1", { y: 30, pageHeight: 842 }),
    ];
    const out = stripChrome(lines, warnings);
    assert.deepEqual(
      out.map((l) => l.text),
      ["I. Généralités"]
    );
  });
});

describe("joinItems", () => {
  test("concatenates tight glyphs and spaces wider gaps", () => {
    const items = [
      { str: "trans", x: 0, width: 30, y: 100, fontSize: 12, fontName: "f" },
      { str: "forme", x: 30.5, width: 30, y: 100, fontSize: 12, fontName: "f" },
      { str: "mot", x: 80, width: 20, y: 100, fontSize: 12, fontName: "f" },
    ];
    assert.equal(joinItems(items), "transforme mot");
  });

  test("preserves explicit hyphen tokens", () => {
    const items = [
      { str: "sous", x: 0, width: 20, y: 100, fontSize: 12, fontName: "f" },
      { str: "-", x: 21, width: 4, y: 100, fontSize: 12, fontName: "f" },
      { str: "intimale", x: 26, width: 40, y: 100, fontSize: 12, fontName: "f" },
    ];
    assert.equal(joinItems(items), "sous-intimale");
  });
});

describe("collapseArtificialBreaks", () => {
  test("joins wrapped prose continuing lowercase", () => {
    const out = collapseArtificialBreaks([
      makeLine("Ceci est une phrase qui continue"),
      makeLine("sur la ligne suivante sans fin de phrase"),
    ]);
    assert.equal(out.length, 1);
    assert.match(out[0].text, /continue sur la ligne/);
  });

  test("does not join a heading-like next line", () => {
    const out = collapseArtificialBreaks([
      makeLine("Fin de paragraphe relatif"),
      makeLine("II. Diagnostic", { fontSize: 14 }),
    ]);
    assert.equal(out.length, 2);
  });
});
