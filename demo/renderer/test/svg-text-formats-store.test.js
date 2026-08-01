/**
 * Renderer V2.3 M1 — svg_text_formats store (unit).
 */
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const CHAPTER = "cardio/234";

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

function sampleRecord(overrides) {
  return Object.assign(
    {
      chapter: CHAPTER,
      projection: "mechanisms",
      element: "MEC-oap",
      assetPath: "figures/mec-oap.svg",
      format: "bold",
      anchor: {
        type: "SvgTextRangeAnchor",
        start: { position: 0 },
        end: { position: 5 },
        exact: "OAP",
        prefix: "MEC ",
        suffix: " flow",
      },
    },
    overrides || {}
  );
}

function openLegacyV3Database(window) {
  return new Promise(function (resolve, reject) {
    const request = window.indexedDB.open("lou-learner", 3);
    request.onupgradeneeded = function () {
      const db = request.result;
      if (!db.objectStoreNames.contains("personal_diagrams")) {
        db.createObjectStore("personal_diagrams", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains("text_annotations")) {
        db.createObjectStore("text_annotations", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
      if (!db.objectStoreNames.contains("walkthrough_notes")) {
        db.createObjectStore("walkthrough_notes", {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };
    request.onsuccess = function () {
      resolve(request.result);
    };
    request.onerror = function () {
      reject(request.error);
    };
  });
}

describe("svg_text_formats store (unit)", () => {
  let window;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    loadScripts(dom, ["learner-patrimony.js", "learner-store.js"]);
  });

  beforeEach(() => {
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    window.LouLearnerStore.clearReleaseContext();
    window.LouLearnerStore.setReleaseContext({
      releaseId: "cardio__234__2022__1",
      chapter: CHAPTER,
    });
  });

  test("SF-01 DB v5 creates svg_text_formats with compound indexes", async () => {
    const db = await window.LouLearnerStore.open();
    assert.equal(db.version, 5);
    assert.ok(db.objectStoreNames.contains("svg_text_formats"));
    assert.ok(db.objectStoreNames.contains("walkthrough_notes"));
    assert.ok(db.objectStoreNames.contains("patrimony_meta"));

    const tx = db.transaction("svg_text_formats", "readonly");
    const store = tx.objectStore("svg_text_formats");
    assert.deepEqual(Array.from(store.indexNames).sort(), [
      "chapter_projection",
      "chapter_projection_element",
      "release_id",
    ]);
  });

  test("SF-02 migration v3 to v4 preserves existing stores and data", async () => {
    const legacyDb = await openLegacyV3Database(window);
    await new Promise(function (resolve, reject) {
      const tx = legacyDb.transaction("walkthrough_notes", "readwrite");
      const req = tx.objectStore("walkthrough_notes").add({
        chapter: CHAPTER,
        projection: "mechanisms",
        element: "MEC-oap",
        anchor: { type: "CaretAnchor", offset: 1 },
        text: "Persisted note",
        created: "2026-01-01T00:00:00.000Z",
      });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    legacyDb.close();

    window.LouLearnerStore.clearReleaseContext();
    await window.LouLearnerStore.open();
    const notes = await window.LouLearnerStore.listWalkthroughNotes(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(notes.length, 1);
    assert.equal(notes[0].text, "Persisted note");

    const db = await window.LouLearnerStore.open();
    assert.ok(db.objectStoreNames.contains("svg_text_formats"));
  });

  test("SF-03 addSvgTextFormat persists FormatRecord shape", async () => {
    const id = await window.LouLearnerStore.addSvgTextFormat(sampleRecord());
    assert.ok(Number.isInteger(id));

    const rows = await window.LouLearnerStore.listSvgTextFormats(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, id);
    assert.equal(rows[0].format, "bold");
    assert.equal(rows[0].assetPath, "figures/mec-oap.svg");
    assert.equal(rows[0].anchor.type, "SvgTextRangeAnchor");
    assert.equal(rows[0].anchor.exact, "OAP");
    assert.equal(rows[0].anchor.start.position, 0);
    assert.equal(rows[0].anchor.end.position, 5);
    assert.equal(rows[0].release_id, "cardio__234__2022__1");
    assert.equal(rows[0].schema_version, 1);
    assert.match(rows[0].created, /^\d{4}-\d{2}-\d{2}T/);
    assert.equal(rows[0].updated, undefined);
  });

  test("SF-04 listSvgTextFormats filters chapter and projection", async () => {
    await window.LouLearnerStore.addSvgTextFormat(
      sampleRecord({ projection: "story", element: "MM-pump-decompensation" })
    );
    await window.LouLearnerStore.addSvgTextFormat(sampleRecord());
    await window.LouLearnerStore.addSvgTextFormat(
      sampleRecord({ chapter: "cardio/999" })
    );

    const story = await window.LouLearnerStore.listSvgTextFormats(
      CHAPTER,
      "story"
    );
    const mech = await window.LouLearnerStore.listSvgTextFormats(
      CHAPTER,
      "mechanisms"
    );

    assert.equal(story.length, 1);
    assert.equal(mech.length, 1);
    assert.equal(story[0].projection, "story");
    assert.equal(mech[0].projection, "mechanisms");
  });

  test("SF-05 listSvgTextFormats filters by element", async () => {
    await window.LouLearnerStore.addSvgTextFormat(sampleRecord());
    await window.LouLearnerStore.addSvgTextFormat(
      sampleRecord({ element: "MEC-output-basics" })
    );

    const one = await window.LouLearnerStore.listSvgTextFormats(
      CHAPTER,
      "mechanisms",
      "MEC-oap"
    );
    const all = await window.LouLearnerStore.listSvgTextFormats(
      CHAPTER,
      "mechanisms"
    );

    assert.equal(one.length, 1);
    assert.equal(all.length, 2);
    assert.equal(one[0].element, "MEC-oap");
  });

  test("SF-06 updateSvgTextFormat merges partial and sets updated", async () => {
    const id = await window.LouLearnerStore.addSvgTextFormat(sampleRecord());
    const before = (
      await window.LouLearnerStore.listSvgTextFormats(CHAPTER, "mechanisms")
    )[0];

    await window.LouLearnerStore.updateSvgTextFormat(id, { format: "italic" });

    const after = (
      await window.LouLearnerStore.listSvgTextFormats(CHAPTER, "mechanisms")
    )[0];
    assert.equal(after.format, "italic");
    assert.equal(after.created, before.created);
    assert.match(after.updated, /^\d{4}-\d{2}-\d{2}T/);
  });

  test("SF-07 deleteSvgTextFormat removes record", async () => {
    const id = await window.LouLearnerStore.addSvgTextFormat(sampleRecord());
    await window.LouLearnerStore.deleteSvgTextFormat(id);

    const rows = await window.LouLearnerStore.listSvgTextFormats(
      CHAPTER,
      "mechanisms"
    );
    assert.deepEqual(rows, []);
  });

  test("SF-08 records persist across store reconnect", async () => {
    const id = await window.LouLearnerStore.addSvgTextFormat(sampleRecord());
    const db = await window.LouLearnerStore.open();
    db.close();
    window.LouLearnerStore.db = null;

    const rows = await window.LouLearnerStore.listSvgTextFormats(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].id, id);
  });

  test("SF-09 rejects invalid format kind", async () => {
    await assert.rejects(
      window.LouLearnerStore.addSvgTextFormat(
        sampleRecord({ format: "combined" })
      )
    );
  });

  test("SF-10 rejects empty exact after normalization", async () => {
    await assert.rejects(
      window.LouLearnerStore.addSvgTextFormat(
        sampleRecord({
          anchor: {
            type: "SvgTextRangeAnchor",
            start: { position: 0 },
            end: { position: 3 },
            exact: "   \n\t  ",
            prefix: "",
            suffix: "",
          },
        })
      )
    );
  });

  test("SF-11 rejects invalid stream range", async () => {
    await assert.rejects(
      window.LouLearnerStore.addSvgTextFormat(
        sampleRecord({
          anchor: {
            type: "SvgTextRangeAnchor",
            start: { position: 5 },
            end: { position: 5 },
            exact: "OAP",
            prefix: "",
            suffix: "",
          },
        })
      )
    );
  });

  test("SF-12 accepts palette textColor and rejects out-of-palette color", async () => {
    const id = await window.LouLearnerStore.addSvgTextFormat(
      sampleRecord({
        format: "textColor",
        style: { color: "#c0392b" },
      })
    );
    const row = (
      await window.LouLearnerStore.listSvgTextFormats(CHAPTER, "mechanisms")
    )[0];
    assert.equal(row.id, id);
    assert.deepEqual(row.style, { color: "#c0392b" });

    await assert.rejects(
      window.LouLearnerStore.addSvgTextFormat(
        sampleRecord({
          format: "textColor",
          style: { color: "#ff0000" },
        })
      )
    );
  });

  test("SF-13 accepts palette backgroundColor and rejects missing style", async () => {
    await window.LouLearnerStore.addSvgTextFormat(
      sampleRecord({
        format: "backgroundColor",
        style: { backgroundColor: "#fff3bf" },
      })
    );

    await assert.rejects(
      window.LouLearnerStore.addSvgTextFormat(
        sampleRecord({ format: "backgroundColor" })
      )
    );
  });

  test("SF-14 normalizes exact whitespace on write", async () => {
    await window.LouLearnerStore.addSvgTextFormat(
      sampleRecord({
        anchor: {
          type: "SvgTextRangeAnchor",
          start: { position: 1 },
          end: { position: 6 },
          exact: "  OAP\nflow  ",
          prefix: "",
          suffix: "",
        },
      })
    );

    const row = (
      await window.LouLearnerStore.listSvgTextFormats(CHAPTER, "mechanisms")
    )[0];
    assert.equal(row.anchor.exact, "OAP flow");
  });

  test("SF-15 rejects prefix or suffix longer than 32 characters", async () => {
    await assert.rejects(
      window.LouLearnerStore.addSvgTextFormat(
        sampleRecord({
          anchor: {
            type: "SvgTextRangeAnchor",
            start: { position: 0 },
            end: { position: 3 },
            exact: "OAP",
            prefix: "x".repeat(33),
            suffix: "",
          },
        })
      )
    );
  });

  test("SF-16 updateSvgTextFormat rejects unknown id", async () => {
    await assert.rejects(
      window.LouLearnerStore.updateSvgTextFormat(999, { format: "italic" })
    );
  });
});
