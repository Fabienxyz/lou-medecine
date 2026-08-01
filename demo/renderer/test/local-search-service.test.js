/**
 * Lot D6-C — Local Search Service unit tests (D6-B reference suites).
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
    INDEX_SCHEMA_VERSION,
    DIAGNOSTICS,
    normText,
    normQuery,
    tokenizeQuery,
    normTextPreserveCase,
} from "../local-search-normalize.js";

import {
    extractMarkdownUnits,
    extractQuestionUnits,
    extractScenarioUnits,
    extractManifestAltUnit,
} from "../local-search-extract.js";

import {
    buildSearchIndex,
    validateSearchCache,
    searchLocalIndex,
} from "../local-search-service.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PKG = path.join(
    HERE,
    "fixtures/product-library/packages/cardio__234__2022__1"
);

const RELEASE_ID = "cardio__234__2022__1";
const CONTENT_DIGEST = "sha256:test-digest";

function baseContext(overrides) {
    return Object.assign(
        {
            release_id: RELEASE_ID,
            content_digest: CONTENT_DIGEST,
            index_schema_version: INDEX_SCHEMA_VERSION,
            compositionSpecVersion: "1.0",
            viewBindings: [
                {
                    viewId: "mental-model",
                    displayOrder: 2,
                    availability: "published",
                    sources: [
                        {
                            sourceKind: "projection",
                            projectionId: "story",
                            projectionOrder: 1,
                            documentRefs: ["projections/understanding/story.md"],
                        },
                    ],
                },
                {
                    viewId: "notions",
                    displayOrder: 3,
                    availability: "published",
                    sources: [
                        {
                            sourceKind: "projection",
                            projectionId: "mechanisms",
                            projectionOrder: 1,
                            documentRefs: ["projections/understanding/mechanisms.md"],
                        },
                    ],
                },
                {
                    viewId: "cognitive-priming",
                    displayOrder: 1,
                    availability: "planned",
                    sources: [],
                },
            ],
        },
        overrides || {}
    );
}

function readFixture(relPath) {
    return fs.readFileSync(path.join(FIXTURE_PKG, relPath), "utf8");
}

describe("T-NORM — normalization", () => {
    test("T-NORM-01 NFC compositing", () => {
        assert.equal(normText("e\u0301"), "é");
    });

    test("T-NORM-02 CRLF to LF then query space", () => {
        assert.equal(normText("a\r\nb"), "a\nb");
        assert.equal(normQuery("a\r\nb"), "a b");
    });

    test("T-NORM-03 ASCII case fold", () => {
        assert.equal(normText("Insuffisance"), "insuffisance");
        assert.equal(normText("Été"), "Été");
    });

    test("T-NORM-04 trailing line spaces removed", () => {
        assert.equal(normText("line  \nnext"), "line\nnext");
    });

    test("T-NORM-05 collapse 3+ newlines", () => {
        assert.equal(normText("a\n\n\n\nb"), "a\n\nb");
    });

    test("T-NORM-06 tabs to spaces", () => {
        assert.equal(normText("a\tb"), "a b");
    });

    test("T-NORM-07 normQuery collapses spaces", () => {
        assert.equal(normQuery("  foo   bar  "), "foo bar");
    });

    test("T-NORM-08 tokenize min length 2", () => {
        assert.deepEqual(tokenizeQuery("a bc de"), ["bc", "de"]);
    });

    test("T-NORM-09 empty query tokens", () => {
        assert.deepEqual(tokenizeQuery(""), []);
        assert.deepEqual(tokenizeQuery("x"), []);
    });

    test("T-NORM-10 preserve case for section titles", () => {
        assert.equal(normTextPreserveCase("Titre IC"), "Titre IC");
    });
});

describe("T-EXTRACT-MD — projection markdown", () => {
    test("T-EXTRACT-MD-01 element and content_block units", () => {
        const md = `## Title {#MEC-test}

Intro paragraph before block. {#cb-test-block}

Text after anchor in block.
`;
        const { units } = extractMarkdownUnits(md, "projection");
        const element = units.find((u) => u.unitType === "element");
        const block = units.find((u) => u.unitType === "content_block");
        assert.ok(element);
        assert.equal(element.unitId, "MEC-test");
        assert.equal(element.anchor.kind, "element_block");
        assert.ok(block);
        assert.equal(block.unitId, "cb-test-block");
        assert.ok(block.passages[0].normalizedText.includes("text after anchor"));
    });

    test("T-EXTRACT-MD-02 frontmatter excluded", () => {
        const md = `---
type: test
---
## Section {#EL-1}

Body text searchable.
`;
        const { units } = extractMarkdownUnits(md, "projection");
        assert.ok(units.some((u) => u.passages.some((p) => p.normalizedText.includes("searchable"))));
        assert.ok(
            !units.some((u) => u.passages.some((p) => p.normalizedText.includes("type: test")))
        );
    });

    test("T-EXTRACT-MD-03 code blocks excluded", () => {
        const md = `## X {#EL-2}

\`\`\`
secret code
\`\`\`

visible text.
`;
        const { units } = extractMarkdownUnits(md, "projection");
        const text = units.flatMap((u) => u.passages.map((p) => p.normalizedText)).join(" ");
        assert.ok(text.includes("visible"));
        assert.ok(!text.includes("secret"));
    });

    test("T-EXTRACT-MD-04 fixture mechanisms excerpt", () => {
        const md = readFixture("projections/understanding/mechanisms.md");
        const { units } = extractMarkdownUnits(md, "projection");
        assert.ok(units.length > 5);
        assert.ok(units.some((u) => u.unitId === "MEC-output-basics"));
        assert.ok(units.some((u) => u.unitId === "cb-mec-out-physio"));
    });
});

describe("T-EXTRACT-COL — college markdown", () => {
    test("T-EXTRACT-COL-01 nested section_path", () => {
        const md = `# Chapitre

## Section A

Texte section A.

### Section B

Texte section B.
`;
        const { units } = extractMarkdownUnits(md, "college");
        assert.equal(units.length, 2);
        assert.deepEqual(units[0].anchor.path, ["Chapitre", "Section A"]);
        assert.deepEqual(units[1].anchor.path, ["Chapitre", "Section A", "Section B"]);
        assert.ok(units[1].passages[0].normalizedText.includes("texte section b"));
    });
});

describe("T-EXTRACT-Q — question YAML", () => {
    test("T-EXTRACT-Q-01 published question fields", () => {
        const yaml = readFixture("questions/q-234-01.yaml");
        const { units, diagnostics } = extractQuestionUnits(yaml, "q-234-01");
        assert.equal(diagnostics.length, 0);
        assert.equal(units.length, 1);
        assert.equal(units[0].unitId, "q-234-01");
        const fields = units[0].passages.map((p) => p.fieldPath);
        assert.ok(fields.includes("stem.text"));
        assert.ok(fields.some((f) => f.startsWith("options[0].label")));
        assert.ok(fields.some((f) => f.startsWith("options[0].explanation")));
        assert.ok(!fields.some((f) => f.includes("claim_facets")));
    });

    test("T-EXTRACT-Q-02 draft skipped", () => {
        const yaml = `question_id: q-draft
status: draft
stem:
  text: Hidden
`;
        const { units, diagnostics } = extractQuestionUnits(yaml);
        assert.equal(units.length, 0);
        assert.ok(diagnostics.includes(DIAGNOSTICS.ARTIFACT_SKIPPED));
    });
});

describe("T-EXTRACT-SC — scenario YAML", () => {
    test("T-EXTRACT-SC-01 decision and narrative segments", () => {
        const yaml = readFixture("scenarios/sc-234-standard-01.yaml");
        const { units } = extractScenarioUnits(yaml, "sc-234-standard-01");
        assert.ok(units.some((u) => u.unitType === "scenario"));
        assert.ok(units.some((u) => u.unitType === "scenario_segment"));
        const seg = units.find((u) => u.unitId === "sc-234-standard-01/seg-1");
        assert.ok(seg);
        assert.ok(seg.passages.some((p) => p.fieldPath.includes("prompt")));
        assert.ok(seg.passages.some((p) => p.fieldPath.includes("label")));
    });
});

describe("T-MATCH — matching", () => {
    function miniIndex(passageText) {
        const context = baseContext({
            viewBindings: [
                {
                    viewId: "notions",
                    displayOrder: 3,
                    availability: "published",
                    sources: [
                        {
                            sourceKind: "projection",
                            projectionId: "mechanisms",
                            projectionOrder: 1,
                            documentRefs: ["test.md"],
                        },
                    ],
                },
            ],
        });
        const md = `## Block {#MEC-x}

${passageText}
`;
        const { index } = buildSearchIndex({
            context,
            artifacts: [
                {
                    documentRef: "test.md",
                    documentKind: "projection_markdown",
                    content: md,
                    publicationStatus: "published",
                },
            ],
        });
        return index;
    }

    test("T-MATCH-01 mono-token substring", () => {
        const index = miniIndex("insuffisance cardiaque chronique");
        const { hits } = searchLocalIndex(index, "insuffisance");
        assert.ok(hits.length >= 1);
        assert.ok(hits[0].snippet.includes("insuffisance"));
    });

    test("T-MATCH-02 case insensitive ASCII", () => {
        const index = miniIndex("Insuffisance Cardiaque");
        const { hits } = searchLocalIndex(index, "INSUFFISANCE");
        assert.equal(hits.length, 1);
    });

    test("T-MATCH-03 multi-token AND", () => {
        const index = miniIndex("debit cardiaque insuffisant au repos");
        const { hits } = searchLocalIndex(index, "debit insuffisant");
        assert.equal(hits.length, 1);
        assert.equal(hits[0].matchRanges.length, 2);
    });

    test("T-MATCH-04 multi-token order independent", () => {
        const index = miniIndex("alpha beta gamma");
        const a = searchLocalIndex(index, "gamma alpha");
        const b = searchLocalIndex(index, "alpha gamma");
        assert.equal(a.hits.length, 1);
        assert.equal(b.hits.length, 1);
    });

    test("T-MATCH-05 no match", () => {
        const index = miniIndex("texte medical");
        const { hits } = searchLocalIndex(index, "zzzz");
        assert.equal(hits.length, 0);
    });

    test("T-MATCH-06 query too short", () => {
        const index = miniIndex("texte");
        const { hits, diagnostics } = searchLocalIndex(index, "x");
        assert.equal(hits.length, 0);
        assert.ok(diagnostics.includes(DIAGNOSTICS.QUERY_TOO_SHORT));
    });

    test("T-MATCH-07 empty query", () => {
        const index = miniIndex("texte");
        const { hits, diagnostics } = searchLocalIndex(index, "  ");
        assert.equal(hits.length, 0);
        assert.ok(diagnostics.includes(DIAGNOSTICS.QUERY_TOO_SHORT));
    });

    test("T-MATCH-08 all occurrences mono-token", () => {
        const index = miniIndex("foo bar foo baz foo");
        const { hits } = searchLocalIndex(index, "foo");
        assert.equal(hits.length, 3);
    });
});

describe("T-SNIPPET — snippets", () => {
    test("T-SNIPPET-01 ellipsis when truncated", () => {
        const long = "word ".repeat(80);
        const index = buildSearchIndex({
            context: baseContext({
                viewBindings: [
                    {
                        viewId: "notions",
                        displayOrder: 3,
                        availability: "published",
                        sources: [
                            {
                                sourceKind: "projection",
                                projectionId: "mechanisms",
                                projectionOrder: 1,
                                documentRefs: ["t.md"],
                            },
                        ],
                    },
                ],
            }),
            artifacts: [
                {
                    documentRef: "t.md",
                    documentKind: "projection_markdown",
                    content: `## X {#EL}

${long}target${long}`,
                    publicationStatus: "published",
                },
            ],
        }).index;
        const { hits } = searchLocalIndex(index, "target");
        assert.ok(hits[0].snippet.includes("\u2026"));
        assert.ok(hits[0].snippet.length <= 162);
    });

    test("T-SNIPPET-02 snippetMatchRanges aligned", () => {
        const index = buildSearchIndex({
            context: baseContext({
                viewBindings: [
                    {
                        viewId: "notions",
                        displayOrder: 3,
                        availability: "published",
                        sources: [
                            {
                                sourceKind: "projection",
                                projectionId: "mechanisms",
                                projectionOrder: 1,
                                documentRefs: ["t.md"],
                            },
                        ],
                    },
                ],
            }),
            artifacts: [
                {
                    documentRef: "t.md",
                    documentKind: "projection_markdown",
                    content: "## X {#EL}\n\nhello world match here",
                    publicationStatus: "published",
                },
            ],
        }).index;
        const { hits } = searchLocalIndex(index, "match");
        assert.equal(hits[0].snippetMatchRanges.length, 1);
        const range = hits[0].snippetMatchRanges[0];
        assert.equal(hits[0].snippet.slice(range.start, range.start + range.length), "match");
    });
});

describe("T-SORT — ordering", () => {
    test("T-SORT-01 view displayOrder before documentRef", () => {
        const context = baseContext({
            viewBindings: [
                {
                    viewId: "mental-model",
                    displayOrder: 2,
                    availability: "published",
                    sources: [
                        {
                            sourceKind: "projection",
                            projectionId: "story",
                            projectionOrder: 1,
                            documentRefs: ["b.md"],
                        },
                    ],
                },
                {
                    viewId: "notions",
                    displayOrder: 3,
                    availability: "published",
                    sources: [
                        {
                            sourceKind: "projection",
                            projectionId: "mechanisms",
                            projectionOrder: 1,
                            documentRefs: ["a.md"],
                        },
                    ],
                },
            ],
        });
        const { index } = buildSearchIndex({
            context,
            artifacts: [
                {
                    documentRef: "a.md",
                    documentKind: "projection_markdown",
                    content: "## A {#A}\n\nalpha token",
                    publicationStatus: "published",
                },
                {
                    documentRef: "b.md",
                    documentKind: "projection_markdown",
                    content: "## B {#B}\n\nbeta token",
                    publicationStatus: "published",
                },
            ],
        });
        const { hits } = searchLocalIndex(index, "token");
        assert.equal(hits.length, 2);
        assert.equal(hits[0].viewId, "mental-model");
        assert.equal(hits[1].viewId, "notions");
    });

    test("T-SORT-02 documentRef UTF-8 lex within view", () => {
        const context = baseContext({
            viewBindings: [
                {
                    viewId: "notions",
                    displayOrder: 3,
                    availability: "published",
                    sources: [
                        {
                            sourceKind: "projection",
                            projectionId: "mechanisms",
                            projectionOrder: 1,
                            documentRefs: ["z.md", "a.md"],
                        },
                    ],
                },
            ],
        });
        const { index } = buildSearchIndex({
            context,
            artifacts: [
                {
                    documentRef: "z.md",
                    documentKind: "projection_markdown",
                    content: "## Z {#Z}\n\nsame",
                    publicationStatus: "published",
                },
                {
                    documentRef: "a.md",
                    documentKind: "projection_markdown",
                    content: "## A {#A}\n\nsame",
                    publicationStatus: "published",
                },
            ],
        });
        const { hits } = searchLocalIndex(index, "same");
        assert.equal(hits[0].documentRef, "a.md");
        assert.equal(hits[1].documentRef, "z.md");
    });
});

describe("T-VIEW — view availability", () => {
    test("T-VIEW-01 planned view skipped", () => {
        const { index, diagnostics } = buildSearchIndex({
            context: baseContext(),
            artifacts: [],
        });
        assert.ok(diagnostics.includes(DIAGNOSTICS.VIEW_SKIPPED));
        const { hits } = searchLocalIndex(index, "anything");
        assert.equal(hits.length, 0);
    });
});

describe("T-SVG — manifest alt only", () => {
    test("T-SVG-01 alt indexed not svg markup", () => {
        const { index } = buildSearchIndex({
            context: baseContext({
                viewBindings: [
                    {
                        viewId: "mental-model",
                        displayOrder: 2,
                        availability: "published",
                        sources: [
                            {
                                sourceKind: "manifest-alt",
                                documentRefs: [],
                            },
                        ],
                    },
                ],
            }),
            artifacts: [],
            manifestVisuals: [
                {
                    id: "mec-oap",
                    element: "MEC-oap",
                    alt: "Schema OAP insuffisance cardiaque",
                    viewId: "mental-model",
                    projectionId: "mechanisms",
                },
            ],
        });
        const { hits } = searchLocalIndex(index, "insuffisance");
        assert.equal(hits.length, 1);
        assert.equal(hits[0].unitType, "figure_alt");
    });
});

describe("T-D4-ANCHOR — ResumePoint compatibility", () => {
    test("T-D4-ANCHOR-01 element_block", () => {
        const { units } = extractMarkdownUnits("## T {#EL-1}\n\nText.", "projection");
        assert.equal(units[0].anchor.kind, "element_block");
    });

    test("T-D4-ANCHOR-02 section_path", () => {
        const { units } = extractMarkdownUnits("# A\n\nText.", "college");
        assert.equal(units[0].anchor.kind, "section_path");
    });

    test("T-D4-ANCHOR-03 question_id", () => {
        const { units } = extractQuestionUnits(
            `question_id: q-1\nstatus: published\nstem:\n  text: Q?`,
            "q-1"
        );
        assert.equal(units[0].anchor.kind, "question_id");
    });

    test("T-D4-ANCHOR-04 scenario_scroll", () => {
        const { units } = extractScenarioUnits(
            `scenario_id: sc-1\nstatus: published\ntitle: T\nsegments:\n  - type: narrative\n    id: s1\n    text: N`,
            "sc-1"
        );
        assert.ok(units.some((u) => u.anchor.kind === "scenario_scroll"));
    });

    test("T-D4-ANCHOR-05 manifest_alt", () => {
        const { units } = extractManifestAltUnit({ id: "v1", element: "EL", alt: "desc" });
        assert.equal(units[0].anchor.kind, "manifest_alt");
    });
});

describe("T-HIT-GOLDEN — end-to-end", () => {
    test("T-HIT-GOLDEN-01 miniature index", () => {
        const md = `## Insuffisance {#MEC-output-basics}

La insuffisance cardiaque est définie par un débit inadapté. {#cb-mec-out-physio}
`;
        const { index } = buildSearchIndex({
            context: baseContext(),
            artifacts: [
                {
                    documentRef: "projections/understanding/mechanisms.md",
                    documentKind: "projection_markdown",
                    content: md,
                    publicationStatus: "published",
                    projectionId: "mechanisms",
                },
            ],
        });
        const first = searchLocalIndex(index, "insuffisance");
        const second = searchLocalIndex(index, "insuffisance");
        assert.deepEqual(first.hits, second.hits);
        assert.ok(first.hits.length >= 1);
        for (const hit of first.hits) {
            assert.equal(hit.release_id, RELEASE_ID);
            assert.ok(hit.snippet);
            assert.ok(hit.anchor);
            assert.ok(hit.navigation);
        }
    });
});

describe("T-REPRO — reproductibility", () => {
    test("T-REPRO-01 double execution identical", () => {
        const md = readFixture("projections/understanding/mechanisms.md");
        const input = {
            context: baseContext(),
            artifacts: [
                {
                    documentRef: "projections/understanding/mechanisms.md",
                    documentKind: "projection_markdown",
                    content: md,
                    publicationStatus: "published",
                },
            ],
        };
        const indexA = buildSearchIndex(input).index;
        const indexB = buildSearchIndex(input).index;
        const hitsA = searchLocalIndex(indexA, "insuffisance").hits;
        const hitsB = searchLocalIndex(indexB, "insuffisance").hits;
        assert.deepEqual(hitsA, hitsB);
    });
});

describe("Cache validation", () => {
    test("missing cache", () => {
        const result = validateSearchCache(null, baseContext());
        assert.equal(result.status, "missing");
        assert.ok(result.diagnostics.includes(DIAGNOSTICS.CACHE_MISSING));
    });

    test("valid cache", () => {
        const ctx = baseContext();
        const result = validateSearchCache(
            {
                release_id: ctx.release_id,
                content_digest: ctx.content_digest,
                index_schema_version: INDEX_SCHEMA_VERSION,
                viewBindings: ctx.viewBindings,
            },
            ctx
        );
        assert.equal(result.status, "valid");
    });

    test("stale cache on digest change", () => {
        const ctx = baseContext();
        const result = validateSearchCache(
            {
                release_id: ctx.release_id,
                content_digest: "sha256:other",
                index_schema_version: INDEX_SCHEMA_VERSION,
                viewBindings: ctx.viewBindings,
            },
            ctx
        );
        assert.equal(result.status, "stale");
        assert.ok(result.diagnostics.includes(DIAGNOSTICS.CACHE_STALE));
    });

    test("schema incompatible", () => {
        const ctx = baseContext();
        const result = validateSearchCache(
            {
                release_id: ctx.release_id,
                content_digest: ctx.content_digest,
                index_schema_version: 99,
                viewBindings: ctx.viewBindings,
            },
            ctx
        );
        assert.equal(result.status, "stale");
        assert.ok(result.diagnostics.includes(DIAGNOSTICS.SCHEMA_INCOMPATIBLE));
    });
});

describe("Build diagnostics", () => {
    test("partial build on missing artifact", () => {
        const { diagnostics } = buildSearchIndex({
            context: baseContext(),
            artifacts: [],
        });
        assert.ok(diagnostics.includes(DIAGNOSTICS.DOC_MISSING));
        assert.ok(diagnostics.includes(DIAGNOSTICS.BUILD_PARTIAL));
    });
});
