import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { BlockType } from "../lib/blocks.js";
import { classifyTableRegion, classifySegments } from "../lib/classify.js";
import { segmentDocument } from "../lib/segment.js";
import { reconstructBlocks } from "../lib/reconstructors/index.js";
import { isHierarchyTableGrid } from "../lib/reconstructors/hierarchy-table.js";
import { matchBoxHeader, consumeBox } from "../lib/reconstructors/box.js";
import { renderDocument } from "../lib/render.js";
import { createWarningCollector } from "../lib/warnings.js";
import { makeLine } from "./helpers.js";

describe("HierarchyTable structure detection", () => {
  test("recognizes sparse-rank multi-column grids", () => {
    const grid = [
      ["Rang", "Rubrique", "Intitulé", "Descriptif"],
      ["", "Définition", "Connaître X", "Détail"],
      ["", "Diagnostic", "Savoir Y", ""],
      ["A", "Prise en charge", "Connaître Z", "Texte"],
    ];
    assert.equal(isHierarchyTableGrid(grid, [44, 92, 203, 395]), true);
  });

  test("rejects dense data-like grids", () => {
    const grid = [
      ["Dose", "Matin", "Soir"],
      ["Amlodipine 5 mg", "1", "0"],
      ["Bisoprolol 2.5", "1", "1"],
      ["Ramipril 5", "1", "1"],
    ];
    assert.equal(isHierarchyTableGrid(grid, [50, 200, 350]), false);
  });

  test("normalizes ghost columns and canonical headers", () => {
    const warnings = createWarningCollector();
    const draft = [
      {
        type: BlockType.HierarchyTable,
        page: 1,
        segmentGrids: [
          [
            ["Rang", "Rubrique", "Intitulé", "Descriptif", ""],
            ["", "Définition", "Connaître A", "", ""],
            ["", "Diagnostic", "Savoir B", "Détail", ""],
          ],
          [
            ["Rang", "", "Rubrique", "Intitulé", "Descriptif"],
            ["", "", "Dépistage", "Savoir quand", ""],
            ["", "", "Étiologies", "Connaître causes", "Texte"],
          ],
        ],
      },
    ];
    const [block] = reconstructBlocks(draft, { warnings });
    assert.equal(block.kind, "pipe");
    assert.match(block.markdown, /^\| Rang \| Rubrique \| Intitulé \| Descriptif \|$/m);
    assert.match(block.markdown, /Dépistage/);
    assert.match(block.markdown, /Étiologies/);
    assert.doesNotMatch(block.markdown, /^\| Rang \|  \| Rubrique/m);
  });

  test("merges three-page hierarchy continuations", () => {
    const draft = [
      {
        type: BlockType.HierarchyTable,
        page: 49,
        segments: [{ page: 49, yTop: 300, yBottom: 60 }],
        grid: [
          ["Rang", "Rubrique", "Intitulé", "Descriptif"],
          ["", "Définition", "Définition de l’HTA", ""],
          ["", "Physiopathologie", "Physiopathologie de l’HTA", ""],
        ],
      },
      {
        type: BlockType.HierarchyTable,
        page: 50,
        segments: [{ page: 50, yTop: 770, yBottom: 60 }],
        grid: [
          ["Rang", "Rubrique", "Intitulé", "Descriptif"],
          ["", "Diagnostic positif", "Mesure de la PA", ""],
          ["", "Étiologies", "Causes secondaires", ""],
        ],
      },
      {
        type: BlockType.HierarchyTable,
        page: 51,
        segments: [{ page: 51, yTop: 770, yBottom: 400 }],
        grid: [
          ["Rang", "Rubrique", "Intitulé", "Descriptif"],
          ["", "Prise en charge", "Traitement médicamenteux", ""],
          ["", "Suivi et/ou pronostic", "Plan de soins", ""],
        ],
      },
    ];
    const blocks = reconstructBlocks(draft);
    assert.equal(blocks.length, 1);
    assert.match(blocks[0].markdown, /Définition de l’HTA/);
    assert.match(blocks[0].markdown, /Mesure de la PA/);
    assert.match(blocks[0].markdown, /Traitement médicamenteux/);
    assert.equal(
      (blocks[0].markdown.match(/^\| Rang \| Rubrique \|/gm) || []).length,
      1
    );
  });

  test("merges page-continuation even when second segment was typed DataTable", () => {
    const draft = [
      {
        type: BlockType.HierarchyTable,
        page: 10,
        y: 120,
        segments: [{ page: 10, yTop: 400, yBottom: 80 }],
        grid: [
          ["Rang", "Rubrique", "Intitulé", "Descriptif"],
          ["", "Définition", "Connaître A", ""],
          ["", "Diagnostic", "Savoir B", ""],
        ],
      },
      {
        type: BlockType.DataTable,
        page: 11,
        y: 750,
        segments: [{ page: 11, yTop: 780, yBottom: 500 }],
        grid: [
          ["Rang", "", "Rubrique", "Intitulé", "Descriptif"],
          ["", "", "Dépistage", "Savoir quand", ""],
          ["", "", "Étiologies", "Connaître causes", "Texte"],
        ],
      },
    ];
    const blocks = reconstructBlocks(draft);
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0].type, BlockType.HierarchyTable);
    assert.match(blocks[0].markdown, /Dépistage/);
    assert.match(blocks[0].markdown, /Étiologies/);
    assert.equal(
      (blocks[0].markdown.match(/^\| Rang \| Rubrique \|/gm) || []).length,
      1
    );
  });

  test("drops trailing prose leak rows", () => {
    const draft = [
      {
        type: BlockType.HierarchyTable,
        page: 1,
        grid: [
          ["Rang", "Rubrique", "Intitulé", "Descriptif"],
          ["", "Définition", "Connaître A", ""],
          ["", "Diagnostic", "Savoir B", ""],
          [
            "",
            "Les risques médicaux associés aux dyslipidémies sont essentiellement le risque de",
            "",
            "",
          ],
        ],
      },
    ];
    const [block] = reconstructBlocks(draft);
    assert.doesNotMatch(block.markdown, /Les risques médicaux/);
  });
});

describe("Box reconstructor", () => {
  test("keeps id / title / body distinct", () => {
    const stream = [
      {
        kind: "line",
        line: makeLine("Encadré 9.1 Cardiopathies à risque d’endocardite infectieuse", {
          fontSize: 12,
        }),
      },
      {
        kind: "line",
        line: makeLine("Cardiopathies à risque intermédiaire (groupe B)"),
      },
      { kind: "line", line: makeLine("• Bicuspidie aortique") },
      {
        kind: "line",
        line: makeLine("I. Diagnostic", { fontSize: 18 }),
      },
    ];
    const consumed = consumeBox(stream, 0, (line) => line.fontSize >= 16);
    assert.ok(consumed);
    assert.equal(consumed.block.id, "Encadré 9.1");
    assert.equal(
      consumed.block.title,
      "Cardiopathies à risque d’endocardite infectieuse"
    );
    assert.equal(consumed.block.body[0], "Cardiopathies à risque intermédiaire (groupe B)");
    assert.equal(consumed.block.body[1], "• Bicuspidie aortique");
    assert.equal(consumed.next, 3);
  });

  test("ignores citation fragments", () => {
    assert.equal(matchBoxHeader("encadré 10.1)."), null);
  });

  test("splits title that absorbed a following body clause", () => {
    const stream = [
      {
        kind: "line",
        line: makeLine(
          "Encadré 10.1 Critères de Duke modifiés pour le diagnostic d’endocardite Critères majeurs Hémocultures positives en l’absence de foyer infectieux identifié"
        ),
      },
      { kind: "line", line: makeLine("• Bactérie typique") },
    ];
    const consumed = consumeBox(stream, 0, () => false);
    assert.ok(consumed);
    assert.match(consumed.block.title, /^Critères de Duke/);
    assert.doesNotMatch(consumed.block.title, /Critères majeurs/);
    assert.match(consumed.block.body[0], /Critères majeurs/);
  });
});

describe("DataTable reconstructor", () => {
  test("warns instead of inventing structure when confidence is low", () => {
    const warnings = createWarningCollector();
    const draft = [
      {
        type: BlockType.DataTable,
        page: 2,
        grid: [
          ["A long prose cell that stands alone", "", ""],
          ["Another singleton", "", ""],
          ["Third", "", ""],
        ],
        confidence: 0.2,
      },
    ];
    const [block] = reconstructBlocks(draft, { warnings });
    assert.equal(block.kind, "fallback");
    assert.match(block.markdown, /^```/m);
    assert.ok(warnings.list().some((w) => w.code === "data-table-unrecoverable"));
  });
});

describe("classifyTableRegion", () => {
  test("types hierarchy vs data by structure", () => {
    const hierarchy = classifyTableRegion({
      page: 1,
      yTop: 700,
      yBottom: 400,
      colCenters: [44, 92, 203, 395],
      grid: [
        ["Rang", "Rubrique", "Intitulé", "Descriptif"],
        ["", "Définition", "X", ""],
        ["", "Diagnostic", "Y", ""],
        ["", "Prise en charge", "Z", ""],
      ],
      kind: "pipe",
      markdown: "",
    });
    assert.equal(hierarchy.type, BlockType.HierarchyTable);

    const data = classifyTableRegion({
      page: 1,
      yTop: 700,
      yBottom: 400,
      colCenters: [50, 200, 350],
      grid: [
        ["Dose", "Matin", "Soir"],
        ["Amlodipine", "1", "0"],
        ["Bisoprolol", "1", "1"],
        ["Ramipril", "1", "1"],
      ],
      kind: "pipe",
      markdown: "",
    });
    assert.equal(data.type, BlockType.DataTable);
  });
});

describe("end-to-end block pipeline", () => {
  test("segment → classify → reconstruct → render preserves headings and boxes", () => {
    const lines = [
      makeLine("Chapitre 01 – Item 1 : Titre", { fontSize: 30, y: 800 }),
      makeLine("I. Section", { fontSize: 18, y: 700 }),
      makeLine("Encadré 1.1 Titre du box", { fontSize: 12, y: 650 }),
      makeLine("Corps du box.", { fontSize: 12, y: 620 }),
      makeLine("Suite du paragraphe.", { fontSize: 12, y: 500 }),
    ];
    const segments = segmentDocument(lines, []);
    const draft = classifySegments(segments);
    const blocks = reconstructBlocks(draft);
    const { markdown } = renderDocument(blocks);
    assert.match(markdown, /^# Chapitre 01/m);
    assert.match(markdown, /^## I\. Section$/m);
    assert.match(markdown, /^> \*\*Encadré 1\.1 Titre du box\*\*$/m);
    assert.match(markdown, /^> Corps du box\.$/m);
  });
});
