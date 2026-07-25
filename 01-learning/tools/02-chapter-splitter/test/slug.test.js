import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { slugify, chapterFilename } from "../lib/slug.js";

describe("slugify", () => {
  test("lowercases, strips accents, replaces spaces", () => {
    assert.equal(slugify("Insuffisance cardiaque"), "insuffisance-cardiaque");
    assert.equal(slugify("Électrocardiogramme"), "electrocardiogramme");
    assert.equal(slugify("Péricardite aiguë"), "pericardite-aigue");
  });

  test("removes punctuation and collapses hyphens", () => {
    assert.equal(
      slugify("Athérome : épidémiologie et physiopathologie."),
      "atherome-epidemiologie-et-physiopathologie"
    );
    assert.equal(slugify("foo — bar / baz"), "foo-bar-baz");
  });

  test("is deterministic", () => {
    const a = slugify("Valvulopathies");
    const b = slugify("Valvulopathies");
    assert.equal(a, b);
  });
});

describe("chapterFilename", () => {
  test("uses item number from content when present", () => {
    assert.equal(
      chapterFilename({
        itemNumber: "234",
        titleForSlug: "Insuffisance cardiaque de l’adulte",
      }),
      "item-234-insuffisance-cardiaque-de-ladulte.md"
    );
  });

  test("falls back to slug-only when no item number in content", () => {
    assert.equal(
      chapterFilename({
        itemNumber: null,
        titleForSlug: "Introduction générale",
      }),
      "introduction-generale.md"
    );
  });

  test("rejects empty slug", () => {
    assert.throws(() =>
      chapterFilename({ itemNumber: "1", titleForSlug: "???" })
    );
  });
});
