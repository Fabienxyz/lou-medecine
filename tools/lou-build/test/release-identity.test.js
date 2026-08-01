import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  buildReleaseId,
  resolvePublicationVersion,
  computeContentDigest,
  validateReleaseIdentity,
  attachReleaseIdentity,
  collectDeclaredArtifactPaths,
} from "../lib/release-identity.js";

describe("release identity (D1-B)", () => {
  test("buildReleaseId matches LIBRARY-CATALOG-CONTRACT derivation", () => {
    assert.equal(buildReleaseId("cardio/234", 2022, 1), "cardio__234__2022__1");
    assert.equal(buildReleaseId("cardio/234", "2022", "2"), "cardio__234__2022__2");
  });

  test("resolvePublicationVersion defaults to 1 then reuses same edition", () => {
    assert.equal(
      resolvePublicationVersion({
        chapter: "cardio/234",
        edition: 2022,
      }),
      1
    );
    assert.equal(
      resolvePublicationVersion({
        chapter: "cardio/234",
        edition: 2022,
        previousManifest: {
          chapter: "cardio/234",
          source_edition: 2022,
          publication_version: 3,
        },
      }),
      3
    );
    assert.equal(
      resolvePublicationVersion({
        chapter: "cardio/234",
        edition: 2026,
        previousManifest: {
          chapter: "cardio/234",
          source_edition: 2022,
          publication_version: 3,
        },
      }),
      1
    );
  });

  test("resolvePublicationVersion honors packageConfig pin", () => {
    assert.equal(
      resolvePublicationVersion({
        chapter: "cardio/234",
        edition: 2022,
        packageConfig: { publication_version: 5 },
        previousManifest: {
          chapter: "cardio/234",
          source_edition: 2022,
          publication_version: 1,
        },
      }),
      5
    );
  });

  test("validateReleaseIdentity accepts coherent triplet and digest shape", () => {
    const errors = validateReleaseIdentity({
      chapter: "cardio/234",
      source_edition: 2022,
      publication_version: 1,
      release_id: "cardio__234__2022__1",
      content_digest:
        "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });
    assert.deepEqual(errors, []);
  });

  test("validateReleaseIdentity rejects incoherent release_id", () => {
    const errors = validateReleaseIdentity({
      chapter: "cardio/234",
      source_edition: 2022,
      publication_version: 1,
      release_id: "wrong",
      content_digest:
        "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    });
    assert.ok(errors.some((e) => e.includes("incoherent")));
  });

  describe("content_digest stability", () => {
    let tmpDir;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lou-digest-"));
    });

    afterEach(() => {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    test("identical artefacts yield identical digest", () => {
      const src = path.join(tmpDir, "source");
      fs.mkdirSync(src, { recursive: true });
      fs.writeFileSync(path.join(src, "official-college.md"), "college\n");

      const draft = {
        chapter: "test/1",
        source_edition: 2022,
        publication_version: 1,
        release_id: "test__1__2022__1",
        college_source_path: "source/official-college.md",
        projections: [],
        visuals: [],
      };

      const a = computeContentDigest(tmpDir, draft);
      const b = computeContentDigest(tmpDir, draft);
      assert.equal(a, b);
      assert.match(a, /^sha256:[a-f0-9]{64}$/);
    });

    test("attachReleaseIdentity never takes a manual release_id", () => {
      const src = path.join(tmpDir, "source");
      fs.mkdirSync(src, { recursive: true });
      fs.writeFileSync(path.join(src, "official-college.md"), "college\n");

      const manifest = {
        chapter: "cardio/234",
        source_edition: 2022,
        college_source_path: "source/official-college.md",
        projections: [],
        visuals: [],
        release_id: "manually-forged",
      };

      attachReleaseIdentity(manifest, { chapterDir: tmpDir, packageConfig: {} });
      assert.equal(manifest.release_id, "cardio__234__2022__1");
      assert.equal(manifest.publication_version, 1);
      assert.match(manifest.content_digest, /^sha256:[a-f0-9]{64}$/);
    });

    test("collectDeclaredArtifactPaths lists college source", () => {
      const paths = collectDeclaredArtifactPaths({
        college_source_path: "source/official-college.md",
        projections: [{ path: "projections/understanding/story.md" }],
        visuals: [{ path: "figures/mec-oap.svg" }],
      });
      assert.deepEqual(paths, [
        "figures/mec-oap.svg",
        "projections/understanding/story.md",
        "source/official-college.md",
      ]);
    });
  });
});
