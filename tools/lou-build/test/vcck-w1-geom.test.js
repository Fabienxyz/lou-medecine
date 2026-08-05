import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  segmentsIntersect,
  segmentEndpointContact,
  GEOM_PARAM_EPS,
} from "../lib/vcck/geom-segments.js";
import {
  validateMutantFixtures,
  MUTANT_DIAGONAL_X_CROSS,
  MUTANT_DIAGONAL_THROUGH_NODE,
  validateSvgGeometryIndependent,
  segmentIntersectsRectPlan,
} from "../lib/vcck/svg-geom-independent.js";

describe("vcck-w1-geom", () => {
  it("detects perfect X crossing off-center", () => {
    const a = { x1: 0, y1: 0, x2: 100, y2: 100 };
    const b = { x1: 0, y1: 100, x2: 100, y2: 0 };
    assert.equal(segmentsIntersect(a, b), true);
  });

  it("rejects parallel segments", () => {
    const a = { x1: 0, y1: 0, x2: 100, y2: 0 };
    const b = { x1: 0, y1: 10, x2: 100, y2: 10 };
    assert.equal(segmentsIntersect(a, b), false);
  });

  it("rejects non-crossing segments", () => {
    const a = { x1: 0, y1: 0, x2: 10, y2: 0 };
    const b = { x1: 20, y1: 0, x2: 30, y2: 0 };
    assert.equal(segmentsIntersect(a, b), false);
  });

  it("allows endpoint contact without interior cross", () => {
    const a = { x1: 0, y1: 0, x2: 50, y2: 50 };
    const b = { x1: 50, y1: 50, x2: 100, y2: 0 };
    assert.equal(segmentsIntersect(a, b), false);
    assert.equal(segmentEndpointContact(a, b), true);
  });

  it("mutants fail for exact expected error codes", () => {
    const result = validateMutantFixtures();
    assert.equal(result.ok, true, JSON.stringify(result.results, null, 2));
    const x = result.results.find((r) => r.id === "diagonal-x-cross");
    assert.ok(x.errors.some((e) => e.includes("cross (X intersection)")));
    const through = result.results.find((r) => r.id === "diagonal-through-node");
    assert.ok(through.errors.some((e) => e.includes("intersects node mid interior")));
    assert.equal(through.endpointOnlyFailure, false);
  });

  it("quasi-vertical dx=0.5 intersects rect interior in plan validator", () => {
    const seg = { x1: 100.5, y1: 20, x2: 100, y2: 180 };
    const rect = { x: 80, y: 80, width: 40, height: 40 };
    assert.equal(segmentIntersectsRectPlan(seg, rect), true);
  });

  it("quasi-vertical dx=1 intersects rect interior", () => {
    const seg = { x1: 101, y1: 20, x2: 100, y2: 180 };
    const rect = { x: 80, y: 80, width: 40, height: 40 };
    assert.equal(segmentIntersectsRectPlan(seg, rect), true);
  });

  it("neighbor valid vertical route at dx=0 is not rejected by plan rect test", () => {
    const seg = { x1: 70, y1: 20, x2: 70, y2: 180 };
    const rect = { x: 80, y: 80, width: 40, height: 40 };
    assert.equal(segmentIntersectsRectPlan(seg, rect), false);
  });
});
