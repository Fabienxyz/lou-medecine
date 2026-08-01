/**
 * Lot E-D — Learner Snapshot import / restoration (LP-06).
 */
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodeCrypto from "node:crypto";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const CHAPTER = "cardio/234";
const OTHER_CHAPTER = "cardio/999";
const RELEASE_ID = "cardio__234__2022__1";
const OTHER_RELEASE_ID = "cardio__234__2023__1";
const UNINSTALLED_RELEASE = "cardio__999__2099__1";

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

function setCatalogContext(win, chapter = CHAPTER, releaseId = RELEASE_ID) {
  win.LouLearnerStore.setReleaseContext({ releaseId, chapter });
}

function sampleSelector() {
  return {
    type: "TextQuoteSelector",
    exact: "OAP",
    prefix: "MEC ",
    suffix: " flow",
  };
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

function restorePersonalDiagramBlobs(window, storeGroups, bytes, mediaType) {
  return storeGroups.map(function (group) {
    if (group.storeName !== "personal_diagrams") {
      return group;
    }
    return {
      storeName: group.storeName,
      records: (group.records || []).map(function (row) {
        return Object.assign({}, row, {
          blob: new window.Blob([bytes], { type: mediaType }),
        });
      }),
    };
  });
}

function storeReaderFromGroups(groups) {
  return {
    listAllPatrimonialRecords() {
      return Promise.resolve(groups);
    },
  };
}

/**
 * Wrap LouLearnerStore for import tests — rehydrates personal diagram blobs from
 * the snapshot payload so idempotence is not skewed by fake-indexeddb blob loss.
 */
function importStoreWithSnapshotDiagramBlobs(window, snapshot) {
  const inner = window.LouLearnerStore;
  const diagramDomain = snapshot.body.domains.find(
    (d) => d.domain_id === "personal_diagrams"
  );
  const diagramRecord =
    diagramDomain && diagramDomain.records.length > 0
      ? diagramDomain.records[0]
      : null;
  const diagramBytes = diagramRecord
    ? Buffer.from(diagramRecord.payload.binary_base64, "base64")
    : null;
  const diagramMediaType =
    diagramRecord && diagramRecord.payload.media_type
      ? diagramRecord.payload.media_type
      : "image/png";

  return {
    open() {
      return inner.open();
    },
    listAllPatrimonialRecords() {
      return inner.listAllPatrimonialRecords().then(function (groups) {
        if (!diagramBytes) {
          return groups;
        }
        return restorePersonalDiagramBlobs(
          window,
          groups,
          diagramBytes,
          diagramMediaType
        );
      });
    },
    applyPatrimonialImportPlan(plan) {
      return inner.applyPatrimonialImportPlan(plan);
    },
  };
}

function openLegacyV5Database(window) {
  return new Promise(function (resolve, reject) {
    const request = window.indexedDB.open("lou-learner", 5);
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
        formatStore.createIndex("chapter_projection_element", [
          "chapter",
          "projection",
          "element",
        ]);
        formatStore.createIndex("release_id", "release_id", { unique: false });
      }
      if (!db.objectStoreNames.contains("patrimony_meta")) {
        db.createObjectStore("patrimony_meta", { keyPath: "key" });
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

async function seedPatrimony(window) {
  setCatalogContext(window);
  await window.LouLearnerStore.open();
  await window.LouLearnerStore.addTextHighlight(
    CHAPTER,
    "story",
    "H1",
    sampleSelector()
  );
  await window.LouLearnerStore.addWalkthroughNote(
    CHAPTER,
    "mechanisms",
    "N1",
    sampleAnchor(),
    "Walk note"
  );
  await window.LouLearnerStore.addSvgTextFormat(sampleSvgRecord(CHAPTER));
  await window.LouLearnerStore.addPersonalDiagram(
    CHAPTER,
    "MEC-oap",
    new window.Blob(["diagram-bytes"], { type: "image/png" })
  );
}

async function exportWithRestoredDiagrams(window) {
  const storeGroups = restorePersonalDiagramBlobs(
    window,
    await window.LouLearnerStore.listAllPatrimonialRecords(),
    "diagram-bytes",
    "image/png"
  );
  return window.LouLearnerSnapshot.exportSnapshot({
    store: storeReaderFromGroups(storeGroups),
  });
}

async function countAllRecords(window) {
  const groups = await window.LouLearnerStore.listAllPatrimonialRecords();
  return groups.reduce(function (sum, group) {
    return sum + (group.records || []).length;
  }, 0);
}

describe("Lot E-D — Learner Snapshot import", () => {
  /** @type {Window & typeof globalThis} */
  let window;

  before(() => {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
      url: "https://example.test/demo/renderer/",
      runScripts: "outside-only",
    });
    window = dom.window;
    window.__LOU_NODE_CRYPTO__ = nodeCrypto;
    loadScripts(dom, [
      "config.js",
      "learner-patrimony.js",
      "learner-store.js",
      "learner-snapshot.js",
    ]);
  });

  beforeEach(() => {
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    window.LouLearnerStore.clearReleaseContext();
  });

  test("LP-I01 nominal import into empty store restores four domains", async () => {
    await seedPatrimony(window);
    const snapshot = await exportWithRestoredDiagrams(window);

    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    await window.LouLearnerStore.open();

    const result = await window.LouLearnerSnapshot.importSnapshot(snapshot);
    assert.equal(result.success, true);
    assert.equal(result.inserted.length, 4);
    assert.equal(result.updated.length, 0);
    assert.equal(result.conflicts.length, 0);
    assert.equal(await countAllRecords(window), 4);
  });

  test("LP-I02 invalid digest refuses import with rollback", async () => {
    await seedPatrimony(window);
    const snapshot = await exportWithRestoredDiagrams(window);
    const beforeCount = await countAllRecords(window);

    snapshot.integrity.digest = "0".repeat(64);
    const result = await window.LouLearnerSnapshot.importSnapshot(snapshot);

    assert.equal(result.success, false);
    assert.match(result.refused[0].reason, /digest mismatch/i);
    assert.ok(result.rollback);
    assert.equal(await countAllRecords(window), beforeCount);
  });

  test("LP-I03 idempotent re-import produces unchanged only", async () => {
    await seedPatrimony(window);
    const snapshot = await exportWithRestoredDiagrams(window);

    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    await window.LouLearnerStore.open();

    const first = await window.LouLearnerSnapshot.importSnapshot(snapshot);
    assert.equal(first.success, true);
    assert.equal(first.inserted.length, 4);

    const second = await window.LouLearnerSnapshot.importSnapshot(snapshot, {
      store: importStoreWithSnapshotDiagramBlobs(window, snapshot),
    });
    assert.equal(second.success, true);
    assert.equal(second.inserted.length, 0);
    assert.equal(second.updated.length, 0);
    assert.equal(second.unchanged.length, 4);
    assert.equal(second.conflicts.length, 0);
    assert.equal(await countAllRecords(window), 4);
  });

  test("LP-I04 conflict — snapshot wins and is traced", async () => {
    setCatalogContext(window);
    await window.LouLearnerStore.open();
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      "LOCAL",
      sampleSelector()
    );

    const rows = await window.LouLearnerStore.listTextHighlights(CHAPTER, "story");
    const storeGroups = await window.LouLearnerStore.listAllPatrimonialRecords();
    const snapshot = await window.LouLearnerSnapshot.exportSnapshot({
      store: storeReaderFromGroups(storeGroups),
    });

    const domain = snapshot.body.domains.find(
      (d) => d.domain_id === "walkthrough_annotations"
    );
    domain.records[0].payload.selector = {
      type: "TextQuoteSelector",
      exact: "CHANGED",
      prefix: "",
      suffix: "",
    };
    snapshot.integrity.digest = await window.LouLearnerSnapshot.computeBodyDigest(
      snapshot.body
    );

    const result = await window.LouLearnerSnapshot.importSnapshot(snapshot);
    assert.equal(result.success, true);
    assert.equal(result.updated.length, 1);
    assert.equal(result.conflicts.length, 1);
    assert.equal(result.conflicts[0].resolution, "snapshot_wins");

    const after = await window.LouLearnerStore.listTextHighlights(CHAPTER, "story");
    assert.equal(after.length, 1);
    assert.equal(after[0].selector.exact, "CHANGED");
    assert.equal(after[0].id, rows[0].id);
  });

  test("LP-I05 local-only record preserved when absent from snapshot", async () => {
    setCatalogContext(window);
    await window.LouLearnerStore.open();
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      "LOCAL-ONLY",
      sampleSelector()
    );
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "story",
      "N-LOCAL",
      sampleAnchor(),
      "Local only note"
    );

    const emptyBody = window.LouLearnerSnapshot.canonicalizeBody({ domains: [] });
    const emptyDigest = await window.LouLearnerSnapshot.computeBodyDigest(emptyBody);
    const emptySnapshot = {
      snapshot_format_version: 1,
      export_metadata: {
        exported_at: "2026-08-01T00:00:00.000Z",
        exporter_component: "lou-learner-snapshot/1",
      },
      integrity: {
        algorithm: "sha256-canonical-v1",
        digest: emptyDigest,
      },
      summary: {
        record_count_total: 0,
        record_count_by_domain: {},
        release_ids_referenced: [],
      },
      body: emptyBody,
    };
    assert.equal(emptySnapshot.summary.record_count_total, 0);

    const result = await window.LouLearnerSnapshot.importSnapshot(emptySnapshot);
    assert.equal(result.success, true);
    assert.equal(await countAllRecords(window), 2);
  });

  test("LP-I06 legacy release imported and preserved", async () => {
    await window.LouLearnerStore.open();
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      "LEG",
      sampleSelector()
    );

    const snapshot = await window.LouLearnerSnapshot.exportSnapshot();
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    await window.LouLearnerStore.open();

    const result = await window.LouLearnerSnapshot.importSnapshot(snapshot);
    assert.equal(result.success, true);
    const rows = (
      await window.LouLearnerStore.listAllPatrimonialRecords()
    ).find((g) => g.storeName === "text_annotations").records;
    assert.match(rows[0].release_id, /^__legacy__/);
  });

  test("LP-I07 release absent from optional catalog yields warning not refusal", async () => {
    await seedPatrimony(window);
    const snapshot = await exportWithRestoredDiagrams(window);
    snapshot.body.domains
      .find((d) => d.domain_id === "walkthrough_notes")
      .records.push({
        record_id:
          "walkthrough_notes::" + UNINSTALLED_RELEASE + "::0000000042",
        release_id: UNINSTALLED_RELEASE,
        schema_version: 1,
        domain: "walkthrough_notes",
        chapter: OTHER_CHAPTER,
        orphan_status: "none",
        payload: {
          projection: "story",
          element: "ORPHAN",
          anchor: sampleAnchor(),
          text: "Orphan note",
          created: "2026-08-01T00:00:00.000Z",
        },
      });
    snapshot.integrity.digest = await window.LouLearnerSnapshot.computeBodyDigest(
      snapshot.body
    );

    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    await window.LouLearnerStore.open();

    const result = await window.LouLearnerSnapshot.importSnapshot(snapshot, {
      catalogReleaseIds: [RELEASE_ID],
    });
    assert.equal(result.success, true);
    assert.ok(result.warnings.some((w) => w.code === "release_not_in_catalog"));
    assert.equal(await countAllRecords(window), 5);
  });

  test("LP-I08 import succeeds without catalog dependency", async () => {
    await window.LouLearnerStore.open();
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "story",
      "NC",
      sampleAnchor(),
      "No catalog"
    );
    const snapshot = await window.LouLearnerSnapshot.exportSnapshot();

    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    await window.LouLearnerStore.open();

    const result = await window.LouLearnerSnapshot.importSnapshot(snapshot);
    assert.equal(result.success, true);
    assert.equal(result.warnings.length, 0);
  });

  test("LP-I09 personal diagram invalid blob refuses import", async () => {
    const snapshot = await window.LouLearnerSnapshot.exportSnapshot({
      exportedAt: "2026-08-01T00:00:00.000Z",
    });
    snapshot.body.domains
      .find((d) => d.domain_id === "personal_diagrams")
      .records.push({
        record_id: "personal_diagrams::" + RELEASE_ID + "::0000000001",
        release_id: RELEASE_ID,
        schema_version: 1,
        domain: "personal_diagrams",
        chapter: CHAPTER,
        orphan_status: "none",
        payload: {
          element: "MEC-oap",
          created: "2026-08-01T00:00:00.000Z",
          media_type: "image/png",
          binary_base64: "%%%invalid-base64%%%",
        },
      });
    snapshot.integrity.digest = await window.LouLearnerSnapshot.computeBodyDigest(
      snapshot.body
    );

    await window.LouLearnerStore.open();
    const result = await window.LouLearnerSnapshot.importSnapshot(snapshot);
    assert.equal(result.success, false);
    assert.match(result.refused[0].reason, /could not be decoded/i);
    assert.equal(await countAllRecords(window), 0);
  });

  test("LP-I10 round-trip export import export preserves canonical digest", async () => {
    await seedPatrimony(window);
    const exported = await exportWithRestoredDiagrams(window);

    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    await window.LouLearnerStore.open();

    const imported = await window.LouLearnerSnapshot.importSnapshot(exported);
    assert.equal(imported.success, true);

    const roundTrip = await exportWithRestoredDiagrams(window);
    assert.equal(
      exported.integrity.digest,
      roundTrip.integrity.digest
    );
    assert.equal(
      window.LouLearnerSnapshot.stableStringify(
        window.LouLearnerSnapshot.canonicalizeBody(exported.body)
      ),
      window.LouLearnerSnapshot.stableStringify(
        window.LouLearnerSnapshot.canonicalizeBody(roundTrip.body)
      )
    );
  });

  test("LP-I11 A import B import A leaves consistent state", async () => {
    setCatalogContext(window, CHAPTER, RELEASE_ID);
    await window.LouLearnerStore.open();
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      "A1",
      sampleSelector()
    );
    const snapshotA = await window.LouLearnerSnapshot.exportSnapshot();

    window.LouLearnerStore.setReleaseContext({
      releaseId: OTHER_RELEASE_ID,
      chapter: OTHER_CHAPTER,
    });
    await window.LouLearnerStore.addWalkthroughNote(
      OTHER_CHAPTER,
      "story",
      "B1",
      sampleAnchor(),
      "Snapshot B note"
    );
    const snapshotB = await window.LouLearnerSnapshot.exportSnapshot();

    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    await window.LouLearnerStore.open();

    assert.equal((await window.LouLearnerSnapshot.importSnapshot(snapshotA)).success, true);
    assert.equal((await window.LouLearnerSnapshot.importSnapshot(snapshotB)).success, true);
    const backToA = await window.LouLearnerSnapshot.importSnapshot(snapshotA);
    assert.equal(backToA.success, true);
    assert.equal(await countAllRecords(window), 2);

    const thirdA = await window.LouLearnerSnapshot.importSnapshot(snapshotA);
    assert.equal(thirdA.success, true);
    assert.equal(thirdA.inserted.length, 0);
    assert.equal(await countAllRecords(window), 2);

    const annotation = (
      await window.LouLearnerStore.listAllPatrimonialRecords()
    )
      .find((g) => g.storeName === "text_annotations")
      .records.find((row) => row.logical_record_id === snapshotA.body.domains
        .find((d) => d.domain_id === "walkthrough_annotations").records[0].record_id);
    assert.ok(annotation);
    assert.equal(
      annotation.selector.exact,
      snapshotA.body.domains.find((d) => d.domain_id === "walkthrough_annotations")
        .records[0].payload.selector.exact
    );
  });

  test("LP-I12 migration v6 backfills logical_record_id idempotently", async () => {
    setCatalogContext(window);
    await window.LouLearnerStore.open();
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      "MIG",
      sampleSelector()
    );

    const rows = (
      await window.LouLearnerStore.listAllPatrimonialRecords()
    ).find((g) => g.storeName === "text_annotations").records;
    assert.ok(rows[0].logical_record_id);
    assert.match(rows[0].logical_record_id, /^walkthrough_annotations::/);

    const firstPass = JSON.parse(JSON.stringify(rows));
    window.LouLearnerStore.db.close();
    window.LouLearnerStore.db = null;
    await window.LouLearnerStore.open();
    const secondPass = (
      await window.LouLearnerStore.listAllPatrimonialRecords()
    ).find((g) => g.storeName === "text_annotations").records;

    assert.deepEqual(secondPass, firstPass);
    assert.equal(window.LouLearnerStore.DB_VERSION, 6);
  });

  test("LP-I13 pre-apply validation error leaves store unchanged", async () => {
    await seedPatrimony(window);
    const snapshot = await exportWithRestoredDiagrams(window);

    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    await window.LouLearnerStore.open();

    const result = await window.LouLearnerSnapshot.importSnapshot(snapshot, {
      _injectApplyError: new Error("simulated apply failure"),
    });
    assert.equal(result.success, false);
    assert.ok(result.rollback);
    assert.equal(await countAllRecords(window), 0);
  });

  test("LP-I16 mid-apply soft-fail aborts transaction with no partial writes", async () => {
    await window.LouLearnerStore.open();
    const beforeCount = await countAllRecords(window);

    const plan = [
      {
        storeName: "walkthrough_notes",
        logicalRecordId: "walkthrough_notes::cardio__234__2022__1::0000000099",
        action: "insert",
        row: {
          logical_record_id:
            "walkthrough_notes::cardio__234__2022__1::0000000099",
          release_id: RELEASE_ID,
          schema_version: 1,
          chapter: CHAPTER,
          projection: "story",
          element: "MID-FAIL",
          anchor: sampleAnchor(),
          text: "Should not persist after abort",
          created: "2026-08-01T00:00:00.000Z",
        },
      },
      {
        storeName: "text_annotations",
        logicalRecordId:
          "walkthrough_annotations::cardio__234__2022__1::0000000042",
        action: "update",
        row: {
          logical_record_id:
            "walkthrough_annotations::cardio__234__2022__1::0000000042",
          release_id: RELEASE_ID,
          schema_version: 1,
          chapter: CHAPTER,
          projection: "story",
          element: "MISSING",
          selector: sampleSelector(),
          kind: "highlight",
          created: "2026-08-01T00:00:00.000Z",
        },
      },
    ];

    await assert.rejects(
      () => window.LouLearnerStore.applyPatrimonialImportPlan(plan),
      /Import update missing row/
    );
    assert.equal(await countAllRecords(window), beforeCount);
  });

  test("LP-I17 v5 database migrates to v6 with logical_record_id backfill", async () => {
    const legacyDb = await openLegacyV5Database(window);
    await new Promise(function (resolve, reject) {
      const tx = legacyDb.transaction(
        ["text_annotations", "patrimony_meta"],
        "readwrite"
      );
      tx.objectStore("text_annotations").add({
        release_id: RELEASE_ID,
        schema_version: 1,
        chapter: CHAPTER,
        projection: "story",
        element: "V5-ROW",
        selector: sampleSelector(),
        kind: "highlight",
        created: "2026-01-01T00:00:00.000Z",
      });
      tx.objectStore("patrimony_meta").put({
        key: "migration_v5",
        completed: true,
        completedAt: "2026-01-01T00:00:00.000Z",
        targetDbVersion: 5,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    legacyDb.close();
    window.LouLearnerStore.db = null;

    const db = await window.LouLearnerStore.open();
    assert.equal(db.version, 6);

    const rows = (
      await window.LouLearnerStore.listAllPatrimonialRecords()
    ).find((g) => g.storeName === "text_annotations").records;
    assert.equal(rows.length, 1);
    assert.equal(
      rows[0].logical_record_id,
      window.LouLearnerPatrimony.deriveLogicalRecordId(
        "walkthrough_annotations",
        RELEASE_ID,
        rows[0].id
      )
    );

    const firstPass = JSON.parse(JSON.stringify(rows));
    window.LouLearnerStore.db.close();
    window.LouLearnerStore.db = null;
    await window.LouLearnerStore.open();
    const secondPass = (
      await window.LouLearnerStore.listAllPatrimonialRecords()
    ).find((g) => g.storeName === "text_annotations").records;
    assert.deepEqual(secondPass, firstPass);
  });

  test("LP-I14 no duplicate records after repeated imports", async () => {
    await seedPatrimony(window);
    const snapshot = await exportWithRestoredDiagrams(window);

    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    await window.LouLearnerStore.open();

    for (let i = 0; i < 3; i++) {
      const result = await window.LouLearnerSnapshot.importSnapshot(snapshot);
      assert.equal(result.success, true);
    }
    assert.equal(await countAllRecords(window), 4);
  });

  test("LP-I15 missing personal diagram blob refuses import", async () => {
    const snapshot = await window.LouLearnerSnapshot.exportSnapshot({
      exportedAt: "2026-08-01T00:00:00.000Z",
    });
    snapshot.body.domains
      .find((d) => d.domain_id === "personal_diagrams")
      .records.push({
        record_id: "personal_diagrams::" + RELEASE_ID + "::0000000099",
        release_id: RELEASE_ID,
        schema_version: 1,
        domain: "personal_diagrams",
        chapter: CHAPTER,
        orphan_status: "none",
        payload: {
          element: "MEC-oap",
          created: "2026-08-01T00:00:00.000Z",
          media_type: "image/png",
        },
      });
    snapshot.integrity.digest = await window.LouLearnerSnapshot.computeBodyDigest(
      snapshot.body
    );

    await window.LouLearnerStore.open();
    const result = await window.LouLearnerSnapshot.importSnapshot(snapshot);
    assert.equal(result.success, false);
    assert.match(result.refused[0].reason, /missing binary_base64/i);
  });
});
