import { describe, test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { convertCollege } from "../lib/pipeline.js";
import { validateMarkdown } from "../lib/validate.js";
import { buildSamplePdf, FIXTURES_DIR } from "./helpers.js";

describe("pipeline", () => {
  let samplePdf;

  before(async () => {
    samplePdf = await buildSamplePdf(path.join(FIXTURES_DIR, "sample.pdf"));
  });

  test("deterministic conversion: two runs → byte-identical Markdown", async () => {
    const dir1 = fs.mkdtempSync(path.join(os.tmpdir(), "lou-pdf1-"));
    const dir2 = fs.mkdtempSync(path.join(os.tmpdir(), "lou-pdf2-"));
    const pdf1 = path.join(dir1, "official-college.pdf");
    const pdf2 = path.join(dir2, "official-college.pdf");
    fs.copyFileSync(samplePdf, pdf1);
    fs.copyFileSync(samplePdf, pdf2);

    const a = await convertCollege({
      input: pdf1,
      specialty: "testology",
      edition: "2099",
      generatedAt: "2026-07-25T12:00:00.000Z",
    });
    const b = await convertCollege({
      input: pdf2,
      specialty: "testology",
      edition: "2099",
      generatedAt: "2026-07-25T13:00:00.000Z",
    });

    assert.equal(a.markdown, b.markdown);
    assert.equal(
      fs.readFileSync(path.join(dir1, "official-college.md"), "utf8"),
      fs.readFileSync(path.join(dir2, "official-college.md"), "utf8")
    );
    // Manifest timestamps may differ; checksums of markdown must match.
    assert.equal(a.manifest.markdown_sha256, b.manifest.markdown_sha256);
    assert.notEqual(a.manifest.generated_at, b.manifest.generated_at);
  });

  test("hierarchy + page-number removal + hyphenation on sample PDF", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lou-pdf3-"));
    const pdf = path.join(dir, "official-college.pdf");
    fs.copyFileSync(samplePdf, pdf);

    const result = await convertCollege({
      input: pdf,
      specialty: "testology",
      edition: "2099",
      generatedAt: "2026-07-25T12:00:00.000Z",
    });

    assert.match(result.markdown, /^# Chapitre 01 – Item 999 : Exemple de chapitre$/m);
    assert.match(result.markdown, /^## I\. Généralités$/m);
    assert.match(result.markdown, /^### A Définitions$/m);
    assert.match(result.markdown, /^## II\. Diagnostic$/m);
    assert.match(result.markdown, /physiopathologie/);
    assert.doesNotMatch(result.markdown, /physiopatho-\n/);
    // Page numbers stripped
    assert.doesNotMatch(result.markdown, /^1$/m);
    assert.doesNotMatch(result.markdown, /^2$/m);
    // Publication boilerplate stripped
    assert.doesNotMatch(result.markdown, /Published On/i);

    assert.equal(result.validation.ok, true);
    assert.ok(fs.existsSync(path.join(dir, "manifest.json")));
  });

  test("validation rejects empty documents", () => {
    const result = validateMarkdown({
      markdown: "",
      extractionOk: true,
      numPages: 1,
    });
    assert.equal(result.ok, false);
    assert.ok(result.errors.some((e) => /empty/i.test(e)));
  });
});
