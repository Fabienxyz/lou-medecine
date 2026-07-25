import { describe, test, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildManifest,
  serializeManifest,
  sha256,
  CONVERTER_VERSION,
} from "../lib/manifest.js";
import { buildSamplePdf } from "./helpers.js";

describe("manifest generation", () => {
  let pdfPath;

  before(async () => {
    pdfPath = await buildSamplePdf();
  });

  test("includes required fields and checksums", () => {
    const markdown = "# Title\n\nHello\n";
    const manifest = buildManifest({
      specialty: "cardiology",
      edition: "2022",
      originalPdfFilename: "official-college.pdf",
      pdfPath,
      markdown,
      warnings: [],
      validation: { ok: true, errors: [], anomalies: [] },
      stats: { pages: 2 },
      generatedAt: "2026-07-25T12:00:00.000Z",
    });

    assert.equal(manifest.specialty, "cardiology");
    assert.equal(manifest.edition, "2022");
    assert.equal(manifest.original_pdf_filename, "official-college.pdf");
    assert.equal(manifest.converter_version, CONVERTER_VERSION);
    assert.equal(manifest.generated_at, "2026-07-25T12:00:00.000Z");
    assert.equal(manifest.original_pdf_sha256, sha256(fs.readFileSync(pdfPath)));
    assert.equal(manifest.markdown_sha256, sha256(Buffer.from(markdown, "utf8")));
    assert.match(manifest.original_pdf_sha256, /^[a-f0-9]{64}$/);
  });

  test("serializeManifest is stable for identical input", () => {
    const markdown = "# A\n";
    const m1 = buildManifest({
      specialty: "x",
      edition: "1",
      originalPdfFilename: "official-college.pdf",
      pdfPath,
      markdown,
      generatedAt: "2026-07-25T12:00:00.000Z",
      validation: { ok: true, errors: [], anomalies: [] },
    });
    const m2 = buildManifest({
      specialty: "x",
      edition: "1",
      originalPdfFilename: "official-college.pdf",
      pdfPath,
      markdown,
      generatedAt: "2026-07-25T12:00:00.000Z",
      validation: { ok: true, errors: [], anomalies: [] },
    });
    assert.equal(serializeManifest(m1), serializeManifest(m2));
  });

  test("writes JSON file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "lou-manifest-"));
    const target = path.join(dir, "manifest.json");
    const markdown = "# A\n";
    const manifest = buildManifest({
      specialty: "x",
      edition: "1",
      originalPdfFilename: "official-college.pdf",
      pdfPath,
      markdown,
      generatedAt: "2026-07-25T12:00:00.000Z",
      validation: { ok: true, errors: [], anomalies: [] },
    });
    fs.writeFileSync(target, serializeManifest(manifest));
    const parsed = JSON.parse(fs.readFileSync(target, "utf8"));
    assert.equal(parsed.markdown_sha256, manifest.markdown_sha256);
  });
});
