import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { validateMarkdown } from "../lib/validate.js";

describe("validateMarkdown", () => {
  test("accepts a well-formed mini document", () => {
    const markdown = `# Chapitre 01 – Item 1

## I. Généralités

### A Définitions

Texte.

## II. Diagnostic
`;
    const result = validateMarkdown({
      markdown,
      extractionOk: true,
      numPages: 2,
    });
    assert.equal(result.ok, true);
    assert.deepEqual(result.errors, []);
  });

  test("rejects consecutive duplicated headings", () => {
    const markdown = `# Chapitre 01 – Item 1

## I. Généralités

## I. Généralités
`;
    const result = validateMarkdown({
      markdown,
      extractionOk: true,
      numPages: 1,
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /Duplicated consecutive/i.test(e)));
  });

  test("rejects deep hierarchy jumps", () => {
    const markdown = `# Chapitre 01 – Item 1

## I. Généralités

#### 1 Trop profond
`;
    const result = validateMarkdown({
      markdown,
      extractionOk: true,
      numPages: 1,
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /hierarchy/i.test(e)));
  });

  test("rejects phantom chapter headings", () => {
    const markdown = `# Chapitre 05 – Item 339 : Syndromes

## III Physiopathologie

# Chapitre 1 – ) :

### A Sténose
`;
    const result = validateMarkdown({
      markdown,
      extractionOk: true,
      numPages: 2,
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /Phantom chapter/i.test(e)));
  });
});
