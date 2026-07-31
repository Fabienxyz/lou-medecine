import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  READER_PSEUDO_ABSENT_IDS,
  validateKnownAbsentNeutral,
  validateManifestReaderNeutral,
  validateProjectionRegistryNeutral,
} from "../lib/manifest-neutralization.js";

describe("Lot E — manifest Reader neutralization", () => {
  test("READER_PSEUDO_ABSENT_IDS includes legacy tab ids", () => {
    assert.ok(READER_PSEUDO_ABSENT_IDS.has("actors"));
    assert.ok(READER_PSEUDO_ABSENT_IDS.has("readiness"));
  });

  test("rejects projection label in registry", () => {
    const errors = validateProjectionRegistryNeutral([
      { id: "story", label: "📖 Histoire", path: "x.md", type: "t", order: 1 },
    ]);
    assert.ok(errors.length > 0);
    assert.match(errors[0], /Reader label must not be published/);
  });

  test("accepts projection registry without label", () => {
    const errors = validateProjectionRegistryNeutral([
      { id: "story", path: "x.md", type: "t", order: 1 },
    ]);
    assert.deepEqual(errors, []);
  });

  test("rejects Reader pseudo-view in known_absent", () => {
    assert.deepEqual(validateKnownAbsentNeutral(["actors"]), [
      'chapter.package.yaml: known_absent "actors" is a Reader pseudo-view — not a package production absence',
    ]);
    assert.deepEqual(validateKnownAbsentNeutral(["readiness"]), [
      'chapter.package.yaml: known_absent "readiness" is a Reader pseudo-view — not a package production absence',
    ]);
  });

  test("allows production family absence mastery", () => {
    assert.deepEqual(validateKnownAbsentNeutral(["mastery"]), []);
  });

  test("rejects assembled manifest with projection labels", () => {
    const errors = validateManifestReaderNeutral({
      known_absent: [],
      projections: [{ id: "story", label: "Histoire" }],
    });
    assert.ok(errors.some((e) => e.includes("manifest: projection")));
  });

  test("accepts neutral manifest shape", () => {
    const errors = validateManifestReaderNeutral({
      known_absent: ["mastery"],
      projections: [{ id: "story", type: "understanding.story", order: 1 }],
    });
    assert.deepEqual(errors, []);
  });
});
