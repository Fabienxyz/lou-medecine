import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const ARTIFACT_PATH = path.resolve(
  ROOT,
  "../../01-learning/chapters/cardio/234/build/cognitive-priming.v1.json"
);

function loadModule() {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "https://example.test/demo/renderer/",
    runScripts: "outside-only",
  });
  dom.window.eval(
    fs.readFileSync(path.join(ROOT, "cognitive-priming-render.js"), "utf8")
  );
  return { cp: dom.window.LouCognitivePrimingRender, document: dom.window.document };
}

describe("Lot AP-E — cognitive-priming-render parse", () => {
  let cp;

  before(() => {
    cp = loadModule().cp;
  });

  test("parse valid artefact from package 234", () => {
    const jsonText = fs.readFileSync(ARTIFACT_PATH, "utf8");
    const result = cp.parseCognitivePrimingArtifact(jsonText);
    assert.equal(result.ok, true);
    assert.equal(result.record.schema_version, 1);
    assert.equal(result.record.chapter_id, "cardio/234");
    assert.equal(result.record.profile.comprehension, 4);
    assert.equal(result.record.summary.bullets.length, 5);
  });

  test("rejects invalid JSON", () => {
    const result = cp.parseCognitivePrimingArtifact("{not-json");
    assert.equal(result.ok, false);
    assert.equal(result.code, "parse");
  });

  test("rejects unsupported schema_version", () => {
    const result = cp.parseCognitivePrimingArtifact(
      JSON.stringify({
        schema_version: 2,
        chapter_id: "cardio/234",
        profile: { comprehension: 3, memorization: 3 },
        prerequisites: { edn_references: [], ai_complements: [] },
        summary: { bullets: ["x"] },
      })
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "schema");
  });

  test("rejects invalid AI badge", () => {
    const result = cp.parseCognitivePrimingArtifact(
      JSON.stringify({
        schema_version: 1,
        chapter_id: "cardio/234",
        profile: { comprehension: 3, memorization: 3 },
        prerequisites: {
          edn_references: [],
          ai_complements: [
            {
              complement_id: "ai-1",
              sentence: "Phrase.",
              badge: "Wrong badge",
            },
          ],
        },
        summary: { bullets: ["Bullet."] },
      })
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "badge");
  });

  test("rejects non-empty inter_edn", () => {
    const result = cp.parseCognitivePrimingArtifact(
      JSON.stringify({
        schema_version: 1,
        chapter_id: "cardio/234",
        profile: { comprehension: 3, memorization: 3 },
        prerequisites: {
          edn_references: [],
          inter_edn: [{ chapter_id: "cardio/1", label: "x" }],
          ai_complements: [],
        },
        summary: { bullets: ["Bullet."] },
      })
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "parse");
  });
});

describe("Lot AP-E — cognitive-priming-render DOM", () => {
  let cp;
  let document;

  before(() => {
    const loaded = loadModule();
    cp = loaded.cp;
    document = loaded.document;
  });

  test("renders sections in functional spec order", async () => {
    const jsonText = fs.readFileSync(ARTIFACT_PATH, "utf8");
    const parsed = cp.parseCognitivePrimingArtifact(jsonText);
    assert.equal(parsed.ok, true);

    const host = document.createElement("div");
    host.id = "host";
    document.body.appendChild(host);
    await cp.renderCognitivePriming(host, parsed.record, {
      chapterTitle: "Insuffisance cardiaque",
      manifestChapter: "cardio/234",
      document: document,
    });

    assert.ok(host.querySelector(".cp-profile"));
    assert.ok(host.querySelector(".cp-prereq"));
    assert.ok(host.querySelector(".cp-summary"));
    assert.ok(!host.textContent.includes("Inter-EDN"));
  });

  test("renders profile stars from published integers", async () => {
    const record = {
      schema_version: 1,
      chapter_id: "cardio/234",
      profile: { comprehension: 2, memorization: 5 },
      prerequisites: { edn_references: [], ai_complements: [] },
      summary: { bullets: ["Point unique."] },
    };
    const host = document.createElement("div");
    await cp.renderCognitivePriming(host, record, { document: document });

    const stars = host.querySelectorAll(".cp-star--filled");
    assert.equal(stars.length, 7);
  });

  test("renders summary bullets verbatim", async () => {
    const bullet = "Bullet exact publié sans reformulation.";
    const record = {
      schema_version: 1,
      chapter_id: "cardio/234",
      profile: { comprehension: 1, memorization: 1 },
      prerequisites: { edn_references: [], ai_complements: [] },
      summary: { bullets: [bullet] },
    };
    const host = document.createElement("div");
    await cp.renderCognitivePriming(host, record, { document: document });
    assert.equal(host.querySelector(".cp-summary-list li").textContent, bullet);
  });

  test("renders AI badge text exactly", async () => {
    const record = {
      schema_version: 1,
      chapter_id: "cardio/234",
      profile: { comprehension: 1, memorization: 1 },
      prerequisites: {
        edn_references: [],
        ai_complements: [
          {
            complement_id: "ai-1",
            sentence: "Phrase IA publiée.",
            badge: cp.AI_COMPLEMENT_BADGE_V1,
          },
        ],
      },
      summary: { bullets: ["Bullet."] },
    };
    const host = document.createElement("div");
    await cp.renderCognitivePriming(host, record, { document: document });
    assert.equal(
      host.querySelector(".cp-ai-badge").textContent,
      cp.AI_COMPLEMENT_BADGE_V1
    );
    assert.equal(
      host.querySelector(".cp-ai-sentence").textContent,
      "Phrase IA publiée."
    );
  });

  test("EDN references are non-navigable without catalog", async () => {
    const record = {
      schema_version: 1,
      chapter_id: "cardio/234",
      profile: { comprehension: 1, memorization: 1 },
      prerequisites: {
        edn_references: [
          {
            reference_id: "edn-1",
            chapter_id: "cardio/220",
            label: "Item 220",
          },
        ],
        ai_complements: [],
      },
      summary: { bullets: ["Bullet."] },
    };
    const host = document.createElement("div");
    await cp.renderCognitivePriming(host, record, {
      packageAccess: null,
      document: document,
    });
    assert.ok(host.querySelector(".cp-edn-ref--unavailable"));
    assert.ok(!host.querySelector(".cp-edn-ref--navigable"));
  });

  test("EDN references are navigable when catalog resolves chapter", async () => {
    const record = {
      schema_version: 1,
      chapter_id: "cardio/234",
      profile: { comprehension: 1, memorization: 1 },
      prerequisites: {
        edn_references: [
          {
            reference_id: "edn-1",
            chapter_id: "cardio/220",
            label: "Item 220",
          },
        ],
        ai_complements: [],
      },
      summary: { bullets: ["Bullet."] },
    };
    let navigated = null;
    const host = document.createElement("div");
    await cp.renderCognitivePriming(host, record, {
      packageAccess: {
        getActiveRelease: async function (chapterId) {
          return { release_id: "release-" + chapterId.replace("/", "__") };
        },
      },
      onEdnNavigate: function (chapterId) {
        navigated = chapterId;
      },
      document: document,
    });

    const btn = host.querySelector(".cp-edn-ref--navigable");
    assert.ok(btn);
    btn.click();
    assert.equal(navigated, "cardio/220");
  });

  test("resolveEdnReferenceNavigability returns false without package access", async () => {
    const nav = await cp.resolveEdnReferenceNavigability("cardio/220", null);
    assert.equal(nav.navigable, false);
    assert.equal(nav.reason, "no_catalog");
  });
});
