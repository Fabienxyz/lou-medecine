import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  clusterXs,
  bandLogicalRows,
  buildTableFromRows,
  renderPipeTable,
  detectTablesOnPage,
} from "../lib/tables.js";
import { createWarningCollector } from "../lib/warnings.js";

function item(str, x, y, fontSize = 12) {
  return { str, x, y, width: str.length * 5, height: fontSize, fontSize, fontName: "f" };
}

describe("clusterXs", () => {
  test("clusters nearby x positions into column centers", () => {
    const clusters = clusterXs([44, 46, 92, 95, 203, 200, 395, 398]);
    assert.equal(clusters.length, 4);
    assert.ok(Math.abs(clusters[0].center - 45) < 3);
    assert.ok(Math.abs(clusters[3].center - 396) < 5);
  });
});

describe("bandLogicalRows", () => {
  test("merges wrapped cell lines within a logical row", () => {
    const bands = bandLogicalRows([
      { y: 500, items: [item("Prévalence,", 92, 500)] },
      { y: 486, items: [item("épidémiologie", 92, 486), item("Texte long", 203, 486)] },
      { y: 400, items: [item("Autre", 92, 400)] },
    ]);
    assert.equal(bands.length, 2);
    assert.equal(bands[0].length, 2);
    assert.equal(bands[1].length, 1);
  });
});

describe("buildTableFromRows", () => {
  test("reconstructs a 4-column hierarchy-like table", () => {
    const warnings = createWarningCollector();
    const page = { pageNumber: 1, width: 595, height: 842, items: [] };
    const centers = [44, 92, 203, 395];
    const visualRows = [
      {
        y: 700,
        items: [
          item("Rang", 44, 700),
          item("Rubrique", 92, 700),
          item("Intitulé", 203, 700),
          item("Descriptif", 395, 700),
        ],
      },
      {
        y: 620,
        items: [
          item("A", 44, 620),
          item("Définition", 92, 620),
          item("Définition de l’athérome", 203, 620),
          item("Texte", 395, 620),
        ],
      },
      {
        y: 540,
        items: [
          item("A", 44, 540),
          item("Prévalence,", 92, 540),
          item("Titre", 203, 540),
          item("Desc", 395, 540),
        ],
      },
      {
        y: 526,
        items: [
          item("épidémiologie", 92, 526),
          item("Prévalence et incidence", 203, 526),
          item("Détail descriptif", 395, 526),
        ],
      },
      {
        y: 450,
        items: [
          item("B", 44, 450),
          item("Diagnostic", 92, 450),
          item("Intitulé 2", 203, 450),
          item("Descriptif 2", 395, 450),
        ],
      },
    ];
    // Give items realistic widths so gutters are detected.
    for (const row of visualRows) {
      for (const it of row.items) {
        it.width = Math.min(40, it.str.length * 4);
      }
    }
    const table = buildTableFromRows(visualRows, centers, page, warnings);
    assert.ok(table);
    assert.equal(table.kind, "pipe");
    assert.match(table.markdown, /\| Rang \| Rubrique \| Intitulé \| Descriptif \|/);
    assert.match(table.markdown, /Définition de l’athérome/);
    assert.match(table.markdown, /Prévalence, épidémiologie/);
    assert.doesNotMatch(table.markdown, /Contenu \(fidélité source\)/);
  });
});

describe("detectTablesOnPage", () => {
  test("detects a compact data table by geometry alone", () => {
    const warnings = createWarningCollector();
    const mk = (str, x, y, fontSize = 12) => {
      const it = item(str, x, y, fontSize);
      it.width = Math.min(50, str.length * 4);
      return it;
    };
    const page = {
      pageNumber: 7,
      width: 595,
      height: 842,
      items: [
        mk("Tableau 9.1 Exemple.", 36, 780),
        mk("Catégorie", 44, 700),
        mk("Systolique", 234, 700),
        mk("Diastolique", 407, 700),
        mk("Optimale", 44, 640),
        mk("< 120", 234, 640),
        mk("< 80", 407, 640),
        mk("Normale", 44, 580),
        mk("120-129", 234, 580),
        mk("80-84", 407, 580),
        mk("Normale haute", 44, 520),
        mk("130-139", 234, 520),
        mk("85-89", 407, 520),
        mk("I Épidémiologie", 36, 480, 27),
      ],
    };
    const tables = detectTablesOnPage(page, warnings);
    assert.ok(tables.length >= 1);
    const t = tables[0];
    assert.equal(t.kind, "pipe");
    assert.match(t.markdown, /Catégorie/);
    assert.match(t.markdown, /Optimale/);
    assert.match(t.markdown, /< 120/);
  });

  test("does not treat ordinary prose word spacing as a table", () => {
    const warnings = createWarningCollector();
    const page = {
      pageNumber: 3,
      width: 595,
      height: 842,
      items: [
        item("La majorité des", 36, 700),
        item("hypercholestérolémies", 122, 700),
        item("sont dites", 251, 700),
        item("polygéniques", 308, 700),
        item("et sont favorisées par", 384, 700),
        item("des facteurs environnementaux multiples.", 36, 680),
        item("Cette phrase continue le paragraphe.", 36, 660),
      ],
    };
    for (const it of page.items) it.width = it.str.length * 4.5;
    const tables = detectTablesOnPage(page, warnings);
    assert.equal(tables.length, 0);
  });
});

describe("renderPipeTable", () => {
  test("escapes pipes inside cells", () => {
    const md = renderPipeTable([
      ["A", "B"],
      ["x|y", "z"],
    ]);
    assert.match(md, /x\\|y/);
  });
});
