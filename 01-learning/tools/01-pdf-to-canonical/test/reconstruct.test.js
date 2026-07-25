import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { reconstructMarkdown } from "../lib/reconstruct.js";
import { collapseArtificialBreaks } from "../lib/normalize.js";
import { extractHeadings } from "../lib/validate.js";
import { makeLine } from "./helpers.js";

describe("hierarchy preservation", () => {
  test("emits chapter / roman / letter heading levels", () => {
    const lines = [
      makeLine("Chapitre 01 – Item 999 : Exemple", { fontSize: 30, y: 780 }),
      makeLine("I. Généralités", { fontSize: 18, y: 700 }),
      makeLine("A Définitions", { fontSize: 14, y: 650 }),
      makeLine("Texte de définition.", { fontSize: 12, y: 620 }),
      makeLine("II. Diagnostic", { fontSize: 18, y: 500 }),
    ];
    const { markdown } = reconstructMarkdown({ lines });
    const headings = extractHeadings(markdown);
    assert.deepEqual(
      headings.map((h) => h.raw),
      [
        "# Chapitre 01 – Item 999 : Exemple",
        "## I. Généralités",
        "### A Définitions",
        "## II. Diagnostic",
      ]
    );
  });

  test("keeps sommaire roman lines as plain text before body", () => {
    const lines = [
      makeLine("Chapitre 01 – Item 1 : Titre", { fontSize: 30 }),
      makeLine("I. Alpha", { fontSize: 12 }),
      makeLine("II. Beta", { fontSize: 12 }),
      makeLine("Situations de départ", { fontSize: 12 }),
      makeLine("18 Douleur thoracique.", { fontSize: 12 }),
      makeLine("I. Alpha", { fontSize: 18 }),
    ];
    const { markdown } = reconstructMarkdown({ lines });
    // Sommaire entry is plain; later body heading is ##
    assert.match(markdown, /^I\. Alpha$/m);
    assert.match(markdown, /^## I\. Alpha$/m);
    assert.match(markdown, /^## Situations de départ$/m);
    assert.match(markdown, /^- 18 Douleur thoracique\.$/m);
  });

  test("preserves bullets and nested dashes", () => {
    const lines = [
      makeLine("Chapitre 01 – X", { fontSize: 30 }),
      makeLine("I. Section", { fontSize: 18 }),
      makeLine("• premier"),
      makeLine("– sous"),
    ];
    const { markdown } = reconstructMarkdown({ lines });
    assert.match(markdown, /^- premier$/m);
    assert.match(markdown, /^  - sous$/m);
  });

  test("figure captions become italic lines", () => {
    const lines = [
      makeLine("Chapitre 01 – X", { fontSize: 30 }),
      makeLine("Fig. 1.1 Physiopathologie succincte."),
    ];
    const { markdown } = reconstructMarkdown({ lines });
    assert.match(markdown, /^\*Fig\. 1\.1 Physiopathologie succincte\.\*$/m);
  });

  test("does not promote abbreviation lines (CV :) to roman headings", () => {
    const lines = [
      makeLine("Chapitre 01 – X", { fontSize: 30 }),
      makeLine("I. Section", { fontSize: 18 }),
      makeLine("CV : cardiovasculaire ; FDR : facteur de risque"),
      makeLine("C Évolution des plaques", { fontSize: 13 }),
    ];
    const { markdown } = reconstructMarkdown({ lines });
    assert.doesNotMatch(markdown, /^## CV/m);
    assert.match(markdown, /^CV : cardiovasculaire/m);
    assert.match(markdown, /^### C Évolution des plaques$/m);
  });

  test("never invents a chapter heading from a body-size cross-reference", () => {
    const lines = collapseArtificialBreaks([
      makeLine("Chapitre 05 – Item 339 : Syndromes", { fontSize: 30 }),
      makeLine("III Physiopathologie", { fontSize: 27 }),
      makeLine(
        "La maladie coronarienne peut schématiquement évoluer de deux manières (cf. item 221 –"
      ),
      makeLine("chapitre 1) :"),
      makeLine("A Sténose athérothrombotique", { fontSize: 13 }),
    ]);
    const { markdown, headingTexts } = reconstructMarkdown({ lines });
    assert.equal(
      headingTexts.filter((h) => h.startsWith("# Chapitre")).length,
      1
    );
    assert.match(markdown, /^## III Physiopathologie$/m);
    assert.doesNotMatch(markdown, /^# Chapitre 1/m);
    assert.match(
      markdown,
      /évoluer de deux manières \(cf\. item 221 – chapitre 1\) :/
    );
    assert.match(markdown, /^### A Sténose athérothrombotique$/m);
  });
});
