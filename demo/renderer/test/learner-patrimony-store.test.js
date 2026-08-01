/**
 * Lot E-B — Release-scoped learner patrimony persistence (unit).
 */
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";
import { SHELL_URLS } from "../library/offline-runtime-shared.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const CHAPTER = "cardio/234";
const OTHER_CHAPTER = "cardio/999";
const RELEASE_ID = "cardio__234__2022__1";
const OTHER_RELEASE_ID = "cardio__234__2023__1";

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

function setCatalogContext(window, chapter = CHAPTER, releaseId = RELEASE_ID) {
  window.LouLearnerStore.setReleaseContext({ releaseId, chapter });
}

function enableProductMode(window, releaseId = RELEASE_ID) {
  window.LouConfig = {
    productMode: true,
    _releaseId: releaseId,
    isProductMode() {
      return true;
    },
  };
}

function sampleSvgRecord(chapter, overrides) {
  return Object.assign(
    {
      chapter,
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

function sampleAnchor() {
  return {
    type: "CaretAnchor",
    position: 42,
    exact: "OAP",
    prefix: "MEC ",
    suffix: " flow",
  };
}

function openLegacyV4Database(window) {
  return new Promise(function (resolve, reject) {
    const request = window.indexedDB.open("lou-learner", 4);
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
      if (!db.objectStoreNames.contains("svg_text_formats")) {
        const formatStore = db.createObjectStore("svg_text_formats", {
          keyPath: "id",
          autoIncrement: true,
        });
        formatStore.createIndex("chapter_projection", ["chapter", "projection"]);
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

async function readAllRows(window, storeName) {
  const db = await window.LouLearnerStore.open();
  return new Promise(function (resolve, reject) {
    const tx = db.transaction(storeName, "readonly");
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

describe("Learner patrimony store (Lot E-B)", () => {
  let window;

  before(() => {
    const dom = new JSDOM(`<!DOCTYPE html><body></body>`, {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    loadScripts(dom, ["config.js", "learner-patrimony.js", "learner-store.js"]);
  });

  beforeEach(() => {
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    window.LouLearnerStore.clearReleaseContext();
    delete window.LouConfig;
  });

  test("E1 shell precache includes learner-patrimony.js", () => {
    assert.ok(SHELL_URLS.includes("/demo/renderer/learner-patrimony.js"));
    const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
    assert.match(indexHtml, /learner-patrimony\.js/);
    const patrimonyPos = indexHtml.indexOf("learner-patrimony.js");
    const storePos = indexHtml.indexOf("learner-store.js");
    assert.ok(patrimonyPos > -1 && storePos > patrimonyPos);
  });

  test("LP-E01 catalog writes require release context and stamp release_id", async () => {
    setCatalogContext(window);
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      {
        type: "TextQuoteSelector",
        exact: "OAP",
        prefix: "",
        suffix: "",
      }
    );

    const rows = await window.LouLearnerStore.listTextHighlights(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].release_id, RELEASE_ID);
    assert.equal(rows[0].schema_version, 1);
    assert.equal(rows[0].chapter, CHAPTER);
  });

  test("E2 product mode rejects write without catalog release context", async () => {
    enableProductMode(window);
    await assert.rejects(
      () =>
        window.LouLearnerStore.addTextHighlight(
          CHAPTER,
          "mechanisms",
          "MEC-oap",
          {
            type: "TextQuoteSelector",
            exact: "blocked",
            prefix: "",
            suffix: "",
          }
        ),
      /catalog release context/
    );
  });

  test("E2 product mode rejects write when chapter does not match context", async () => {
    enableProductMode(window);
    setCatalogContext(window, CHAPTER, RELEASE_ID);
    await assert.rejects(
      () =>
        window.LouLearnerStore.addTextHighlight(
          OTHER_CHAPTER,
          "mechanisms",
          "MEC-oap",
          {
            type: "TextQuoteSelector",
            exact: "wrong chapter",
            prefix: "",
            suffix: "",
          }
        ),
      /catalog release context/
    );
  });

  test("E2 product mode accepts write with matching catalog context", async () => {
    enableProductMode(window);
    setCatalogContext(window);
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      {
        type: "TextQuoteSelector",
        exact: "ok",
        prefix: "",
        suffix: "",
      }
    );
    const rows = await window.LouLearnerStore.listTextHighlights(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].release_id, RELEASE_ID);
  });

  test("E3 patrimony never invents catalog release_id without context", () => {
    const scoped = window.LouLearnerPatrimony.stampPatrimonyRecord(
      CHAPTER,
      { projection: "story" },
      {}
    );
    assert.match(scoped.release_id, /^__legacy__/);
    assert.notEqual(scoped.release_id, RELEASE_ID);
  });

  test("E6 migration without context preserves legacy rows outside active domain", async () => {
    const legacyDb = await openLegacyV4Database(window);
    await new Promise(function (resolve, reject) {
      const tx = legacyDb.transaction(
        ["text_annotations", "walkthrough_notes", "personal_diagrams", "svg_text_formats"],
        "readwrite"
      );
      tx.objectStore("text_annotations").add({
        chapter: CHAPTER,
        projection: "story",
        element: "MM-pump-decompensation",
        selector: { type: "TextQuoteSelector", exact: "legacy" },
        kind: "highlight",
        created: "2026-01-01T00:00:00.000Z",
      });
      tx.objectStore("walkthrough_notes").add({
        chapter: CHAPTER,
        projection: "mechanisms",
        element: "MEC-oap",
        anchor: { type: "CaretAnchor", offset: 1 },
        text: "Legacy note",
        created: "2026-01-01T00:00:00.000Z",
      });
      tx.objectStore("personal_diagrams").add({
        chapter: CHAPTER,
        element: "MEC-oap",
        blob: new Blob(["x"]),
        created: "2026-01-01T00:00:00.000Z",
      });
      tx.objectStore("svg_text_formats").add({
        chapter: CHAPTER,
        projection: "mechanisms",
        element: "MEC-oap",
        assetPath: "figures/mec-oap.svg",
        format: "bold",
        anchor: {
          type: "SvgTextRangeAnchor",
          start: { position: 0 },
          end: { position: 3 },
          exact: "OAP",
          prefix: "",
          suffix: "",
        },
        created: "2026-01-01T00:00:00.000Z",
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    legacyDb.close();

    await window.LouLearnerStore.open();
    setCatalogContext(window);

    const legacyReleaseId =
      window.LouLearnerPatrimony.deriveLegacyReleaseId(CHAPTER);
    const allHighlights = await readAllRows(window, "text_annotations");
    assert.equal(allHighlights.length, 1);
    assert.equal(allHighlights[0].release_id, legacyReleaseId);

    const activeHighlights = await window.LouLearnerStore.listTextHighlights(
      CHAPTER,
      "story"
    );
    assert.deepEqual(activeHighlights, []);

    const allSvg = await readAllRows(window, "svg_text_formats");
    assert.equal(allSvg.length, 1);
    assert.equal(allSvg[0].release_id, legacyReleaseId);
  });

  test("E6 migration with catalog context assigns manifest release_id", async () => {
    const legacyDb = await openLegacyV4Database(window);
    await new Promise(function (resolve, reject) {
      const tx = legacyDb.transaction("text_annotations", "readwrite");
      tx.objectStore("text_annotations").add({
        chapter: CHAPTER,
        projection: "story",
        element: "MM-pump-decompensation",
        selector: { type: "TextQuoteSelector", exact: "promoted" },
        kind: "highlight",
        created: "2026-01-01T00:00:00.000Z",
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    legacyDb.close();

    setCatalogContext(window);
    await window.LouLearnerStore.open();

    const rows = await window.LouLearnerStore.listTextHighlights(CHAPTER, "story");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].release_id, RELEASE_ID);
  });

  test("LP-E03 migration v4 to v5 is idempotent", async () => {
    const legacyDb = await openLegacyV4Database(window);
    await new Promise(function (resolve, reject) {
      const tx = legacyDb.transaction("text_annotations", "readwrite");
      tx.objectStore("text_annotations").add({
        chapter: CHAPTER,
        projection: "mechanisms",
        element: "MEC-oap",
        selector: { type: "TextQuoteSelector", exact: "once" },
        kind: "highlight",
        created: "2026-01-01T00:00:00.000Z",
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    legacyDb.close();

    setCatalogContext(window);
    await window.LouLearnerStore.open();
    window.LouLearnerStore.db.close();
    window.LouLearnerStore.db = null;

    await window.LouLearnerStore.open();
    const rows = await readAllRows(window, "text_annotations");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].release_id, RELEASE_ID);
  });

  test("E5 migration on empty database completes without error", async () => {
    const db = await window.LouLearnerStore.open();
    assert.equal(db.version, 8);
    const rows = await readAllRows(window, "text_annotations");
    assert.deepEqual(rows, []);
  });

  test("E5 migration already completed skips row rewrites", async () => {
    setCatalogContext(window);
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      {
        type: "TextQuoteSelector",
        exact: "stable",
        prefix: "",
        suffix: "",
      }
    );
    const before = await readAllRows(window, "text_annotations");
    window.LouLearnerStore.db.close();
    window.LouLearnerStore.db = null;

    await window.LouLearnerStore.open();
    const after = await readAllRows(window, "text_annotations");
    assert.deepEqual(after, before);
  });

  test("E5 incomplete legacy rows migrate to legacy unknown namespace", async () => {
    const legacyDb = await openLegacyV4Database(window);
    await new Promise(function (resolve, reject) {
      const tx = legacyDb.transaction("text_annotations", "readwrite");
      tx.objectStore("text_annotations").add({
        projection: "story",
        element: "MM-pump-decompensation",
        selector: { type: "TextQuoteSelector", exact: "no chapter" },
        kind: "highlight",
        created: "2026-01-01T00:00:00.000Z",
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    legacyDb.close();

    await window.LouLearnerStore.open();
    const rows = await readAllRows(window, "text_annotations");
    assert.equal(rows.length, 1);
    assert.equal(
      rows[0].release_id,
      window.LouLearnerPatrimony.deriveLegacyReleaseId("unknown")
    );
  });

  test("LP-E04 release_id is patrimonial authority — distinct releases do not leak", async () => {
    setCatalogContext(window, CHAPTER, RELEASE_ID);
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "mechanisms",
      "MEC-oap",
      {
        type: "TextQuoteSelector",
        exact: "release-a",
        prefix: "",
        suffix: "",
      }
    );

    setCatalogContext(window, CHAPTER, OTHER_RELEASE_ID);
    const otherReleaseRows = await window.LouLearnerStore.listTextHighlights(
      CHAPTER,
      "mechanisms"
    );
    assert.deepEqual(otherReleaseRows, []);

    setCatalogContext(window, CHAPTER, RELEASE_ID);
    const originalRows = await window.LouLearnerStore.listTextHighlights(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(originalRows.length, 1);
    assert.equal(originalRows[0].release_id, RELEASE_ID);
  });

  test("LP-E05 dev mode legacy namespace remains addressable without catalog context", async () => {
    const chapter = "demo/unknown";
    const legacyReleaseId =
      window.LouLearnerPatrimony.deriveLegacyReleaseId(chapter);

    await window.LouLearnerStore.addWalkthroughNote(
      chapter,
      "story",
      "EL-demo",
      { type: "CaretAnchor", offset: 0 },
      "Dev note"
    );

    const rows = await window.LouLearnerStore.listWalkthroughNotes(chapter, "story");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].release_id, legacyReleaseId);
  });

  test("LP-E06 listRecordsForRelease returns active release records only", async () => {
    setCatalogContext(window);
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      "MM-pump-decompensation",
      {
        type: "TextQuoteSelector",
        exact: "x",
        prefix: "",
        suffix: "",
      }
    );
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "story",
      "MM-pump-decompensation",
      { type: "CaretAnchor", offset: 0 },
      "note"
    );

    const rows = await window.LouLearnerStore.listRecordsForRelease(RELEASE_ID);
    assert.equal(rows.length, 2);
    assert.ok(rows.every((row) => row.release_id === RELEASE_ID));
  });

  test("E4 updateSvgTextFormat cannot change release_id or chapter", async () => {
    setCatalogContext(window);
    const id = await window.LouLearnerStore.addSvgTextFormat(
      sampleSvgRecord(CHAPTER)
    );

    await window.LouLearnerStore.updateSvgTextFormat(id, {
      format: "italic",
      release_id: OTHER_RELEASE_ID,
      chapter: OTHER_CHAPTER,
    });

    const rows = await window.LouLearnerStore.listSvgTextFormats(
      CHAPTER,
      "mechanisms"
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].release_id, RELEASE_ID);
    assert.equal(rows[0].chapter, CHAPTER);
    assert.equal(rows[0].format, "italic");
  });

  test("E6 v6 migration assigns logical_record_id on write", async () => {
    setCatalogContext(window);
    await window.LouLearnerStore.open();
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "story",
      "LRID",
      sampleAnchor(),
      "Logical id note"
    );
    const rows = await readAllRows(window, "walkthrough_notes");
    assert.equal(rows.length, 1);
    assert.ok(rows[0].logical_record_id);
    assert.equal(
      rows[0].logical_record_id,
      window.LouLearnerPatrimony.deriveLogicalRecordId(
        "walkthrough_notes",
        RELEASE_ID,
        rows[0].id
      )
    );
  });
});
