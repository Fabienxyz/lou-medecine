import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  assembleManifest,
  publishCollegeSource,
  PUBLISHED_COLLEGE_SOURCE_REL,
} from "../lib/package.js";

describe("publishCollegeSource", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lou-college-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("copies source into package and manifest uses in-package path", () => {
    const externalDir = path.join(tmpDir, "external");
    fs.mkdirSync(externalDir, { recursive: true });
    const externalFile = path.join(externalDir, "college.md");
    fs.writeFileSync(externalFile, "# Official college\n\nVerbatim text.\n");

    const chapterDir = path.join(tmpDir, "chapter");
    fs.mkdirSync(chapterDir, { recursive: true });
    const metaPath = path.join(chapterDir, "source.meta.yaml");
    fs.writeFileSync(metaPath, "chapter: test/1\n");

    const sourceMeta = {
      _path: metaPath,
      source_file: path.relative(chapterDir, externalFile),
      edition: 2022,
    };

    const rel = publishCollegeSource(chapterDir, sourceMeta);
    assert.equal(rel, PUBLISHED_COLLEGE_SOURCE_REL);

    const published = path.join(chapterDir, PUBLISHED_COLLEGE_SOURCE_REL);
    assert.ok(fs.existsSync(published));
    assert.match(fs.readFileSync(published, "utf8"), /Verbatim text/);

    const manifest = assembleManifest({
      chapterDir,
      inventory: { chapter: "test/1" },
      sourceMeta,
      packageConfig: { slug: "test", title: "Test", specialty: "Test" },
      projections: [],
      reconciliation: { scope: "test", requiredIds: [] },
      visualBuild: { rendered: [], planned: [], withheld: [] },
      evaluation: { questions: [], scenarios: [] },
    });

    assert.equal(manifest.college_source_path, PUBLISHED_COLLEGE_SOURCE_REL);
    assert.ok(!manifest.college_source_path.includes(".."));
  });
});
