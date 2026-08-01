// Reader Composition V1 — Lot A static spec validation.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SPEC_VERSION,
  FROZEN_VIEW_IDS,
  ALLOWED_SOURCE_KINDS,
  ALLOWED_AVAILABILITY_POLICIES,
  validateCompositionSpec,
} from "../composition/composition-spec-schema.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SPEC_PATH = path.join(ROOT, "composition", "corpus-composition-v1.json");
const MANIFEST_FIXTURE_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/manifest.json"
);

function loadCorpusSpec() {
  return JSON.parse(fs.readFileSync(SPEC_PATH, "utf8"));
}

describe("Lot A — corpus-composition-v1.json", () => {
  test("loads and passes static validation", () => {
    const spec = loadCorpusSpec();
    const result = validateCompositionSpec(spec);
    assert.equal(result.ok, true, result.errors.join("; "));
  });

  test("has exactly 7 views with unique viewIds", () => {
    const spec = loadCorpusSpec();
    assert.equal(spec.views.length, 7);
    const ids = spec.views.map((v) => v.viewId);
    assert.equal(new Set(ids).size, 7);
  });

  test("displayOrder runs 1 through 7", () => {
    const spec = loadCorpusSpec();
    const orders = spec.views.map((v) => v.displayOrder).sort((a, b) => a - b);
    assert.deepEqual(orders, [1, 2, 3, 4, 5, 6, 7]);
  });

  test("viewIds match freeze §2", () => {
    const spec = loadCorpusSpec();
    const ids = spec.views.map((v) => v.viewId).sort();
    assert.deepEqual(ids, [...FROZEN_VIEW_IDS].sort());
  });

  test("version matches schema SPEC_VERSION", () => {
    const spec = loadCorpusSpec();
    assert.equal(spec.version, SPEC_VERSION);
  });

  test("contains no forbidden root or view fields", () => {
    const spec = loadCorpusSpec();
    const forbiddenRoot = [
      "inherits",
      "specId",
      "intent",
      "diagnosticsPolicy",
      "badgePolicy",
    ];
    for (const key of forbiddenRoot) {
      assert.ok(!(key in spec), `forbidden root field present: ${key}`);
    }
    const forbiddenView = [
      "intent",
      "badgePolicy",
      "navigation",
      "viewAvailabilityPolicy",
    ];
    for (const view of spec.views) {
      for (const key of forbiddenView) {
        assert.ok(!(key in view), `forbidden view field ${key} on ${view.viewId}`);
      }
      for (const source of view.sources) {
        assert.ok(!("elementSelector" in source), `elementSelector on ${view.viewId}`);
      }
    }
  });

  test("mental-model aggregates story and overview with mergeOrder", () => {
    const spec = loadCorpusSpec();
    const mental = spec.views.find((v) => v.viewId === "mental-model");
    assert.ok(mental);
    const projections = mental.sources.filter((s) => s.kind === "projection");
    assert.equal(projections.length, 2);
    assert.deepEqual(
      projections.map((s) => ({ ref: s.ref, mergeOrder: s.mergeOrder })),
      [
        { ref: "story", mergeOrder: 1 },
        { ref: "overview", mergeOrder: 2 },
      ]
    );
  });

  test("cognitive-priming uses cognitive-priming source and default policy", () => {
    const spec = loadCorpusSpec();
    const view = spec.views.find((v) => v.viewId === "cognitive-priming");
    assert.equal(view.sources.length, 1);
    assert.equal(view.sources[0].kind, "cognitive-priming");
    assert.equal(view.sources[0].ref, "manifest");
    assert.equal(view.availabilityPolicy, "default");
  });

  test("notes uses kind none without ref", () => {
    const spec = loadCorpusSpec();
    const view = spec.views.find((v) => v.viewId === "notes");
    assert.equal(view.sources.length, 1);
    assert.equal(view.sources[0].kind, "none");
    assert.ok(!("ref" in view.sources[0]));
  });
});

describe("Lot A — validateCompositionSpec edge cases", () => {
  test("rejects forbidden root field", () => {
    const spec = loadCorpusSpec();
    const bad = { ...spec, inherits: "corpus" };
    const result = validateCompositionSpec(bad);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes("inherits")));
  });

  test("rejects elementSelector on source", () => {
    const spec = loadCorpusSpec();
    const bad = structuredClone(spec);
    bad.views[1].sources[0].elementSelector = ["ANA-ville-pompe"];
    const result = validateCompositionSpec(bad);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes("elementSelector")));
  });

  test("rejects duplicate viewId", () => {
    const spec = loadCorpusSpec();
    const bad = structuredClone(spec);
    bad.views[1].viewId = bad.views[0].viewId;
    const result = validateCompositionSpec(bad);
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes("duplicate viewId")));
  });

  test("rejects mergeOrder on cognitive-priming kind", () => {
    const result = validateCompositionSpec({
      version: SPEC_VERSION,
      views: [
        {
          viewId: "cognitive-priming",
          label: "Amorçage cognitif",
          displayOrder: 1,
          availabilityPolicy: "default",
          sources: [{ kind: "cognitive-priming", ref: "manifest", mergeOrder: 1 }],
        },
      ],
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.errors.some((e) => e.includes("mergeOrder must not be set when kind is \"cognitive-priming\""))
    );
  });

  test("rejects invalid ref on cognitive-priming kind", () => {
    const result = validateCompositionSpec({
      version: SPEC_VERSION,
      views: [
        {
          viewId: "cognitive-priming",
          label: "Amorçage cognitif",
          displayOrder: 1,
          availabilityPolicy: "default",
          sources: [{ kind: "cognitive-priming", ref: "registry" }],
        },
      ],
    });
    assert.equal(result.ok, false);
    assert.ok(
      result.errors.some((e) => e.includes('ref must be "manifest" when kind is "cognitive-priming"'))
    );
  });

  test("rejects mergeOrder on non-projection kind", () => {
    const result = validateCompositionSpec({
      version: SPEC_VERSION,
      views: [
        {
          viewId: "qcm",
          label: "QCM",
          displayOrder: 6,
          availabilityPolicy: "default",
          sources: [{ kind: "questions", ref: "registry", mergeOrder: 1 }],
        },
      ],
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => e.includes("mergeOrder is only allowed")));
  });
});

describe("Lot A — acceptance fixture cardio/234 (ref resolution only)", () => {
  test("projection refs in spec exist in published manifest fixture", () => {
    const spec = loadCorpusSpec();
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_FIXTURE_PATH, "utf8"));
    const manifestProjectionIds = new Set(
      (manifest.projections || []).map((p) => p.id)
    );

    const projectionRefs = [];
    for (const view of spec.views) {
      for (const source of view.sources) {
        if (source.kind === "projection") {
          projectionRefs.push(source.ref);
        }
      }
    }

    assert.ok(projectionRefs.length > 0);
    for (const ref of projectionRefs) {
      assert.ok(
        manifestProjectionIds.has(ref),
        `projection ref "${ref}" not found in manifest fixture`
      );
    }
  });

  test("registry kinds are syntactically valid", () => {
    const spec = loadCorpusSpec();
    for (const view of spec.views) {
      for (const source of view.sources) {
        if (source.kind === "none") {
          continue;
        }
        assert.match(source.ref, /^[a-z][a-z0-9_-]*$/);
        assert.ok(ALLOWED_SOURCE_KINDS.includes(source.kind));
        assert.ok(ALLOWED_AVAILABILITY_POLICIES.includes(view.availabilityPolicy));
      }
    }
  });
});
