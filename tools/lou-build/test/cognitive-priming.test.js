import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  AI_COMPLEMENT_BADGE_V1,
  COGNITIVE_PRIMING_ARTIFACT_REL,
  COGNITIVE_PRIMING_SOURCE_REL,
  buildCognitivePrimingRecord,
  loadCognitivePrimingSource,
  publishCognitivePriming,
  serializeCognitivePrimingRecord,
  validateCognitivePrimingGate,
  validateCognitivePrimingRecord,
  validateCognitivePrimingSource,
} from "../lib/cognitive-priming.js";
import { assembleManifest } from "../lib/package.js";
import { collectDeclaredArtifactPaths } from "../lib/release-identity.js";

const MINIMAL_SOURCE = `schema_version: 1
profile:
  comprehension: 3
  memorization: 2
prerequisites:
  edn_references:
    - reference_id: edn-test-1
      chapter_id: cardio/108
      label: Item 108 — test
  ai_complements:
    - complement_id: ai-1
      sentence: Une phrase de complement pedagogique.
summary:
  bullets:
    - Premier point de resume.
`;

describe("cognitive priming (AP-C)", () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lou-cp-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function writeSource(yaml = MINIMAL_SOURCE) {
    fs.mkdirSync(path.join(tmpDir, "build"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, COGNITIVE_PRIMING_SOURCE_REL), yaml);
  }

  test("validateCognitivePrimingRecord enforces V-CP-01 through V-CP-07", () => {
    const errors = validateCognitivePrimingRecord(
      {
        schema_version: 2,
        chapter_id: "cardio/234",
        profile: { comprehension: 6, memorization: 0 },
        prerequisites: {
          inter_edn: ["forbidden"],
          edn_references: [{ reference_id: "", chapter_id: "", label: "" }],
          ai_complements: [{ complement_id: "x", sentence: "", badge: "wrong" }],
        },
        summary: { bullets: [] },
      },
      "cardio/234"
    );
    assert.ok(errors.some((e) => e.includes("V-CP-01")));
    assert.ok(errors.some((e) => e.includes("V-CP-03")));
    assert.ok(errors.some((e) => e.includes("CP-BUILD-INTER-EDN")));
    assert.ok(errors.some((e) => e.includes("V-CP-05")));
    assert.ok(errors.some((e) => e.includes("V-CP-06")));
    assert.ok(errors.some((e) => e.includes("V-CP-07")));
  });

  test("buildCognitivePrimingRecord injects chapter_id and badge IA", () => {
    writeSource();
    const source = loadCognitivePrimingSource(tmpDir);
    const record = buildCognitivePrimingRecord(source, { chapter: "cardio/234" });
    assert.equal(record.chapter_id, "cardio/234");
    assert.equal(record.schema_version, 1);
    assert.equal(record.prerequisites.ai_complements[0].badge, AI_COMPLEMENT_BADGE_V1);
    assert.equal(validateCognitivePrimingRecord(record, "cardio/234").length, 0);
  });

  test("rejects inter_edn non empty in source", () => {
    writeSource(
      MINIMAL_SOURCE.replace(
        "prerequisites:",
        "prerequisites:\n  inter_edn:\n    - blocked\n"
      )
    );
    const source = loadCognitivePrimingSource(tmpDir);
    const errors = validateCognitivePrimingSource(source);
    assert.ok(errors.some((e) => e.includes("CP-BUILD-INTER-EDN")));
  });

  test("rejects inter_edn object in source (A3)", () => {
    writeSource(
      MINIMAL_SOURCE.replace(
        "prerequisites:",
        "prerequisites:\n  inter_edn:\n    foo: 1\n"
      )
    );
    const source = loadCognitivePrimingSource(tmpDir);
    const errors = validateCognitivePrimingSource(source);
    assert.ok(
      errors.some((e) =>
        e.includes("CP-BUILD-INTER-EDN: prerequisites.inter_edn must be absent, null, or empty array")
      )
    );
  });

  test("rejects badge in source YAML", () => {
    writeSource(
      MINIMAL_SOURCE.replace(
        "sentence: Une phrase de complement pedagogique.",
        "sentence: Une phrase.\n      badge: forged"
      )
    );
    const source = loadCognitivePrimingSource(tmpDir);
    const errors = validateCognitivePrimingSource(source);
    assert.ok(errors.some((e) => e.includes("badge must not appear")));
  });

  test("publishCognitivePriming writes JSON artefact", () => {
    writeSource();
    const rel = publishCognitivePriming(
      tmpDir,
      { chapter: "cardio/234" },
      {},
      { evaluationConfig: { completeness_level: "complete" } }
    );
    assert.equal(rel, COGNITIVE_PRIMING_ARTIFACT_REL);
    const artifact = path.join(tmpDir, COGNITIVE_PRIMING_ARTIFACT_REL);
    assert.ok(fs.existsSync(artifact));
    const record = JSON.parse(fs.readFileSync(artifact, "utf8"));
    assert.equal(record.chapter_id, "cardio/234");
  });

  test("complete package without source fails with CP-BUILD-SOURCE-MISSING", () => {
    assert.throws(
      () =>
        publishCognitivePriming(
          tmpDir,
          { chapter: "cardio/234" },
          {},
          { evaluationConfig: { completeness_level: "complete" } }
        ),
      (err) => err.code === "CP-BUILD-SOURCE-MISSING"
    );
  });

  test("incomplete package without source returns null", () => {
    const rel = publishCognitivePriming(tmpDir, { chapter: "cardio/108" }, {}, null);
    assert.equal(rel, null);
  });

  test("assembleManifest declares path only when published this build (A1)", () => {
    writeSource();
    const cognitivePrimingPath = publishCognitivePriming(
      tmpDir,
      { chapter: "cardio/234" },
      {},
      { evaluationConfig: { completeness_level: "complete" } }
    );
    fs.mkdirSync(path.join(tmpDir, "source"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "source", "official-college.md"), "college\n");
    fs.writeFileSync(path.join(tmpDir, "build", "traceability.json"), "{}\n");

    const manifest = assembleManifest({
      chapterDir: tmpDir,
      inventory: { chapter: "cardio/234" },
      sourceMeta: { edition: 2022 },
      packageConfig: { slug: "test", title: "Test", specialty: "Test" },
      projections: [],
      reconciliation: { scope: "test", requiredIds: [] },
      visualBuild: { rendered: [], planned: [], withheld: [] },
      evaluation: { questions: [], scenarios: [] },
      cognitivePrimingPath,
    });

    assert.equal(manifest.cognitive_priming_path, COGNITIVE_PRIMING_ARTIFACT_REL);
  });

  test("incomplete package with orphan JSON does not declare path (A1)", () => {
    fs.mkdirSync(path.join(tmpDir, "build"), { recursive: true });
    fs.writeFileSync(
      path.join(tmpDir, COGNITIVE_PRIMING_ARTIFACT_REL),
      JSON.stringify(
        {
          schema_version: 1,
          chapter_id: "cardio/108",
          profile: { comprehension: 1, memorization: 1 },
          prerequisites: { edn_references: [], ai_complements: [] },
          summary: { bullets: ["stale"] },
        },
        null,
        2
      ) + "\n"
    );
    fs.mkdirSync(path.join(tmpDir, "source"), { recursive: true });
    fs.writeFileSync(path.join(tmpDir, "source", "official-college.md"), "college\n");
    fs.writeFileSync(path.join(tmpDir, "build", "traceability.json"), "{}\n");

    const cognitivePrimingPath = publishCognitivePriming(
      tmpDir,
      { chapter: "cardio/108" },
      {},
      null
    );
    assert.equal(cognitivePrimingPath, null);
    assert.equal(fs.existsSync(path.join(tmpDir, COGNITIVE_PRIMING_ARTIFACT_REL)), false);

    const manifest = assembleManifest({
      chapterDir: tmpDir,
      inventory: { chapter: "cardio/108" },
      sourceMeta: { edition: 2022 },
      packageConfig: { slug: "test", title: "Test", specialty: "Test" },
      projections: [],
      reconciliation: { scope: "test", requiredIds: [] },
      visualBuild: { rendered: [], planned: [], withheld: [] },
      evaluation: { questions: [], scenarios: [] },
      cognitivePrimingPath,
    });

    assert.equal(manifest.cognitive_priming_path, undefined);
  });

  test("collectDeclaredArtifactPaths lists cognitive priming path", () => {
    const paths = collectDeclaredArtifactPaths({
      college_source_path: "source/official-college.md",
      cognitive_priming_path: COGNITIVE_PRIMING_ARTIFACT_REL,
      projections: [],
      visuals: [],
    });
    assert.ok(paths.includes(COGNITIVE_PRIMING_ARTIFACT_REL));
  });

  test("validateCognitivePrimingGate requires artefact in validate mode", () => {
    writeSource();
    const inventory = { chapter: "cardio/234" };
    const evaluation = { evaluationConfig: { completeness_level: "complete" } };

    const preBuild = validateCognitivePrimingGate({
      chapterDir: tmpDir,
      packageConfig: {},
      evaluation,
      inventory,
      manifestPath: path.join(tmpDir, "manifest.json"),
      mutate: true,
    });
    assert.deepEqual(preBuild, []);

    publishCognitivePriming(tmpDir, inventory, {}, evaluation);
    fs.writeFileSync(
      path.join(tmpDir, "manifest.json"),
      JSON.stringify(
        {
          chapter: "cardio/234",
          cognitive_priming_path: COGNITIVE_PRIMING_ARTIFACT_REL,
        },
        null,
        2
      ) + "\n"
    );

    const postBuild = validateCognitivePrimingGate({
      chapterDir: tmpDir,
      packageConfig: {},
      evaluation,
      inventory,
      manifestPath: path.join(tmpDir, "manifest.json"),
      mutate: false,
    });
    assert.deepEqual(postBuild, []);
  });

  test("validate rejects source and published JSON divergence (A2)", () => {
    writeSource();
    const inventory = { chapter: "cardio/234" };
    const evaluation = { evaluationConfig: { completeness_level: "complete" } };
    publishCognitivePriming(tmpDir, inventory, {}, evaluation);

    let src = fs.readFileSync(path.join(tmpDir, COGNITIVE_PRIMING_SOURCE_REL), "utf8");
    src = src.replace("comprehension: 3", "comprehension: 1");
    fs.writeFileSync(path.join(tmpDir, COGNITIVE_PRIMING_SOURCE_REL), src);
    fs.writeFileSync(
      path.join(tmpDir, "manifest.json"),
      JSON.stringify(
        {
          chapter: "cardio/234",
          cognitive_priming_path: COGNITIVE_PRIMING_ARTIFACT_REL,
        },
        null,
        2
      ) + "\n"
    );

    const errors = validateCognitivePrimingGate({
      chapterDir: tmpDir,
      packageConfig: {},
      evaluation,
      inventory,
      manifestPath: path.join(tmpDir, "manifest.json"),
      mutate: false,
    });
    assert.ok(
      errors.some((e) => e.includes("CP-BUILD-SOURCE-ARTIFACT-DIVERGENCE")),
      errors.join("; ")
    );
  });

  test("publishCognitivePriming rebuild is deterministic", () => {
    writeSource();
    const inventory = { chapter: "cardio/234" };
    const evaluation = { evaluationConfig: { completeness_level: "complete" } };
    publishCognitivePriming(tmpDir, inventory, {}, evaluation);
    const first = fs.readFileSync(path.join(tmpDir, COGNITIVE_PRIMING_ARTIFACT_REL), "utf8");
    publishCognitivePriming(tmpDir, inventory, {}, evaluation);
    const second = fs.readFileSync(path.join(tmpDir, COGNITIVE_PRIMING_ARTIFACT_REL), "utf8");
    assert.equal(first, second);
    const source = loadCognitivePrimingSource(tmpDir);
    const record = buildCognitivePrimingRecord(source, inventory);
    assert.equal(first, serializeCognitivePrimingRecord(record));
  });
});
