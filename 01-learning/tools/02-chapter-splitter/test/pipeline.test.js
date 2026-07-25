import { describe, test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { splitFromMarkdown, splitCollege } from "../lib/pipeline.js";
import { sha256 } from "../lib/manifest.js";

const SAMPLE = [
  "# Chapitre 01 – Item 221 : Athérome",
  "",
  "Intro A.",
  "",
  "## I Section",
  "Texte A.",
  "# Chapitre 02 – Item 234 : Insuffisance cardiaque",
  "",
  "Intro B.",
  "- point",
  "",
].join("\n");

describe("splitFromMarkdown", () => {
  test("valid document splits with round-trip", () => {
    const result = splitFromMarkdown(SAMPLE, {
      generatedAt: "2026-07-25T00:00:00.000Z",
    });
    assert.equal(result.files.length, 2);
    assert.equal(result.files[0].filename, "item-221-atherome.md");
    assert.equal(
      result.files[1].filename,
      "item-234-insuffisance-cardiaque.md"
    );
    assert.equal(result.files.map((f) => f.markdown).join(""), SAMPLE);
    assert.equal(result.manifest.chapter_count, 2);
    assert.equal(result.manifest.tool_version, "1.0.0");
    assert.equal(result.manifest.chapters[0].first_line, 1);
    assert.ok(result.manifest.chapters[0].sha256);
  });

  test("deterministic filenames and content", () => {
    const a = splitFromMarkdown(SAMPLE, {
      generatedAt: "2026-07-25T00:00:00.000Z",
    });
    const b = splitFromMarkdown(SAMPLE, {
      generatedAt: "2026-07-25T00:00:00.000Z",
    });
    assert.deepEqual(
      a.files.map((f) => f.filename),
      b.files.map((f) => f.filename)
    );
    assert.deepEqual(
      a.files.map((f) => f.markdown),
      b.files.map((f) => f.markdown)
    );
    assert.equal(
      JSON.stringify(a.manifest.chapters),
      JSON.stringify(b.manifest.chapters)
    );
  });

  test("rejects malformed document without H1", () => {
    assert.throws(() => splitFromMarkdown("no headings\n"), /Validation failed|No chapter H1/);
  });

  test("preserves Markdown bytes exactly (no rewrite)", () => {
    const md = "# Item 1 : Title\n\n> **Encadré 1.1 X**\n> body\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n";
    const result = splitFromMarkdown(md);
    assert.equal(result.files[0].markdown, md);
  });
});

describe("splitCollege filesystem", () => {
  test("writes chapters and byte-identical on second run", () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-t02-"));
    const mdPath = path.join(tmp, "official-college.md");
    fs.writeFileSync(mdPath, SAMPLE, "utf8");

    const r1 = splitCollege({
      input: mdPath,
      generatedAt: "2026-07-25T00:00:00.000Z",
    });
    const hashes1 = r1.files.map((f) =>
      sha256(fs.readFileSync(path.join(r1.paths.chaptersDir, f.filename)))
    );

    const r2 = splitCollege({
      input: mdPath,
      generatedAt: "2026-07-25T00:00:00.000Z",
    });
    const hashes2 = r2.files.map((f) =>
      sha256(fs.readFileSync(path.join(r2.paths.chaptersDir, f.filename)))
    );

    assert.deepEqual(hashes1, hashes2);
    const roundTrip = r2.files
      .map((f) =>
        fs.readFileSync(path.join(r2.paths.chaptersDir, f.filename), "utf8")
      )
      .join("");
    assert.equal(roundTrip, SAMPLE);

    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
