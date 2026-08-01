/**
 * Lot E-C — Learner Snapshot export (LP-05).
 */
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodeCrypto from "node:crypto";
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

function collectSnapshotRecords(snapshot) {
  const out = [];
  for (const domain of snapshot.body.domains) {
    for (const record of domain.records) {
      out.push({ domain: domain.domain_id, record });
    }
  }
  return out;
}

/** fake-indexeddb drops Blob payloads — restore for complete-export tests. */
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

function assertExportIncomplete(promise, messageFragment) {
  return promise.then(
    () => {
      assert.fail("Expected export to fail with incomplete patrimony error");
    },
    (err) => {
      assert.match(String(err.message), /\[LouLearnerSnapshot\] Incomplete export:/);
      if (messageFragment) {
        assert.match(String(err.message), new RegExp(messageFragment, "i"));
      }
    }
  );
}

function assertFutureDomainsEmpty(snapshot, win) {
  for (const domainId of win.LouLearnerSnapshot.FUTURE_DOMAIN_IDS) {
    const domain = snapshot.body.domains.find((d) => d.domain_id === domainId);
    assert.ok(domain, "future domain present: " + domainId);
    assert.equal(domain.records.length, 0, domainId + " must be explicitly empty");
    assert.equal(domain.domain_schema_version, 1);
  }
}

describe("Lot E-C — Learner Snapshot export", () => {
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

  test("E1 shell precache includes learner-snapshot.js after learner-store.js", () => {
    const idx = SHELL_URLS.indexOf("/demo/renderer/learner-snapshot.js");
    const storeIdx = SHELL_URLS.indexOf("/demo/renderer/learner-store.js");
    assert.ok(idx >= 0);
    assert.ok(storeIdx >= 0);
    assert.ok(idx > storeIdx);
  });

  test("LP-E01 empty export — envelope, empty domains, stable digest", async () => {
    await window.LouLearnerStore.open();

    const snapshot = await window.LouLearnerSnapshot.exportSnapshot({
      exportedAt: "2026-08-01T12:00:00.000Z",
    });

    assert.equal(snapshot.snapshot_format_version, 1);
    assert.equal(snapshot.export_metadata.exporter_component, "lou-learner-snapshot/1");
    assert.equal(snapshot.integrity.algorithm, "sha256-canonical-v1");
    assert.match(snapshot.integrity.digest, /^[a-f0-9]{64}$/);
    assert.equal(snapshot.summary.record_count_total, 0);
    assert.equal(snapshot.summary.release_ids_referenced.length, 0);
    assert.equal(snapshot.body.domains.length, 9);
    assertFutureDomainsEmpty(snapshot, window);

    const again = await window.LouLearnerSnapshot.exportSnapshot({
      exportedAt: "2026-09-01T00:00:00.000Z",
    });
    assert.equal(snapshot.integrity.digest, again.integrity.digest);
    assert.notEqual(
      snapshot.export_metadata.exported_at,
      again.export_metadata.exported_at
    );
  });

  test("LP-E02 multi-release export covers all domains with data", async () => {
    setCatalogContext(window, CHAPTER, RELEASE_ID);
    await window.LouLearnerStore.open();

    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      "STORY-1",
      sampleSelector()
    );

    window.LouLearnerStore.setReleaseContext({
      releaseId: OTHER_RELEASE_ID,
      chapter: OTHER_CHAPTER,
    });
    await window.LouLearnerStore.addWalkthroughNote(
      OTHER_CHAPTER,
      "story",
      "OTHER-1",
      sampleAnchor(),
      "Note on other release"
    );

    window.LouLearnerStore.setReleaseContext({
      releaseId: RELEASE_ID,
      chapter: CHAPTER,
    });
    await window.LouLearnerStore.addSvgTextFormat(sampleSvgRecord(CHAPTER));
    await window.LouLearnerStore.addPersonalDiagram(
      CHAPTER,
      "MEC-oap",
      new window.Blob(["diagram-bytes"], { type: "image/png" })
    );

    const storeGroups = restorePersonalDiagramBlobs(
      window,
      await window.LouLearnerStore.listAllPatrimonialRecords(),
      "diagram-bytes",
      "image/png"
    );
    const snapshot = await window.LouLearnerSnapshot.exportSnapshot({
      store: storeReaderFromGroups(storeGroups),
    });
    assert.equal(snapshot.summary.record_count_total, 4);
    assert.equal(snapshot.summary.release_ids_referenced.length, 2);
    assert.equal(snapshot.summary.release_ids_referenced[0], RELEASE_ID);
    assert.equal(snapshot.summary.release_ids_referenced[1], OTHER_RELEASE_ID);

    const byDomain = snapshot.summary.record_count_by_domain;
    assert.equal(byDomain.walkthrough_annotations, 1);
    assert.equal(byDomain.walkthrough_notes, 1);
    assert.equal(byDomain.svg_text_formats, 1);
    assert.equal(byDomain.personal_diagrams, 1);
    assertFutureDomainsEmpty(snapshot, window);
  });

  test("LP-E03 legacy records exported with orphan_status, never promoted", async () => {
    await window.LouLearnerStore.open();

    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      "LEG-1",
      sampleSelector()
    );

    const snapshot = await window.LouLearnerSnapshot.exportSnapshot();
    const records = collectSnapshotRecords(snapshot);
    assert.equal(records.length, 1);

    const exported = records[0].record;
    assert.match(exported.release_id, /^__legacy__/);
    assert.equal(exported.orphan_status, "legacy_unresolved");
    assert.notEqual(exported.release_id, RELEASE_ID);
    assert.ok(
      !snapshot.summary.release_ids_referenced.includes(RELEASE_ID),
      "legacy must not be promoted to catalog release"
    );
  });

  test("LP-E04 logical record_id hides IndexedDB identity model", async () => {
    setCatalogContext(window);
    await window.LouLearnerStore.open();

    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      "ID-1",
      sampleSelector()
    );

    const rows = await window.LouLearnerStore.listTextHighlights(CHAPTER, "story");
    assert.ok(Number.isInteger(rows[0].id));

    const snapshot = await window.LouLearnerSnapshot.exportSnapshot();
    const record = snapshot.body.domains.find(
      (d) => d.domain_id === "walkthrough_annotations"
    ).records[0];

    assert.equal(typeof record.record_id, "string");
    assert.match(
      record.record_id,
      /^walkthrough_annotations::cardio__234__2022__1::\d{10}$/
    );
    assert.ok(record.record_id.endsWith(String(rows[0].id).padStart(10, "0")));
    assert.equal(record.id, undefined);
    assert.equal(record.payload.id, undefined);

    const serialized = JSON.stringify(snapshot);
    assert.equal(serialized.includes('"indexeddb"'), false);
    assert.equal(serialized.includes("IndexedDB"), false);
  });

  test("LP-E05 determinism — physical read order does not change digest", async () => {
    setCatalogContext(window, CHAPTER, RELEASE_ID);
    await window.LouLearnerStore.open();

    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      "A",
      sampleSelector()
    );
    window.LouLearnerStore.setReleaseContext({
      releaseId: OTHER_RELEASE_ID,
      chapter: OTHER_CHAPTER,
    });
    await window.LouLearnerStore.addTextHighlight(
      OTHER_CHAPTER,
      "story",
      "B",
      sampleSelector()
    );

    const groups = await window.LouLearnerStore.listAllPatrimonialRecords();
    const reversed = groups.map(function (group) {
      return {
        storeName: group.storeName,
        records: group.records.slice().reverse(),
      };
    });

    const bodyForward = await window.LouLearnerSnapshot.buildBodyFromStoreGroups(groups);
    const bodyReverse = await window.LouLearnerSnapshot.buildBodyFromStoreGroups(
      reversed
    );

    const digestForward = await window.LouLearnerSnapshot.computeBodyDigest(
      bodyForward
    );
    const digestReverse = await window.LouLearnerSnapshot.computeBodyDigest(
      bodyReverse
    );

    assert.equal(digestForward, digestReverse);
    const annotations = bodyForward.domains.find(
      (d) => d.domain_id === "walkthrough_annotations"
    ).records;
    assert.equal(annotations[0].release_id, RELEASE_ID);
    assert.equal(annotations[1].release_id, OTHER_RELEASE_ID);
  });

  test("LP-E06 digest verifies against canonical body", async () => {
    setCatalogContext(window);
    await window.LouLearnerStore.open();
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "story",
      "N-1",
      sampleAnchor(),
      "Canonical note"
    );

    const snapshot = await window.LouLearnerSnapshot.exportSnapshot();
    const recomputed = await window.LouLearnerSnapshot.computeBodyDigest(
      snapshot.body
    );
    assert.equal(snapshot.integrity.digest, recomputed);
  });

  test("LP-E07 no Library/Offline/catalog data in snapshot body", async () => {
    setCatalogContext(window);
    await window.LouLearnerStore.open();
    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      "X",
      sampleSelector()
    );

    const snapshot = await window.LouLearnerSnapshot.exportSnapshot();
    const serialized = JSON.stringify(snapshot.body).toLowerCase();

    const forbidden = [
      "library.json",
      "offline_status",
      "content_digest",
      "lou-offline",
      "package access",
      "manifest.json",
      "patrimony_meta",
      "source_persistence",
    ];
    for (const token of forbidden) {
      assert.equal(
        serialized.includes(token),
        false,
        "forbidden token in body: " + token
      );
    }
  });

  test("LP-E08 diagnostics separated from patrimonial integrity (A1)", async () => {
    await window.LouLearnerStore.open();

    const baseline = await window.LouLearnerSnapshot.exportSnapshot({
      exportedAt: "2026-08-01T00:00:00.000Z",
    });

    const withDiagnostics = await window.LouLearnerSnapshot.exportSnapshot({
      exportedAt: "2026-08-01T00:00:00.000Z",
      diagnostics: {
        source_persistence: { engine: "indexeddb", store_version: 5 },
      },
    });

    assert.equal(baseline.integrity.digest, withDiagnostics.integrity.digest);
    assert.ok(withDiagnostics.diagnostics);
    assert.equal(
      JSON.stringify(withDiagnostics.body).includes("source_persistence"),
      false
    );
  });

  test("LP-E09 LP-05 completeness — every patrimonial store row is exported", async () => {
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
      new window.Blob(["png"], { type: "image/png" })
    );

    const storeGroups = restorePersonalDiagramBlobs(
      window,
      await window.LouLearnerStore.listAllPatrimonialRecords(),
      "png",
      "image/png"
    );
    const storeCount = storeGroups.reduce(
      (sum, group) => sum + group.records.length,
      0
    );

    const snapshot = await window.LouLearnerSnapshot.exportSnapshot({
      store: storeReaderFromGroups(storeGroups),
    });
    assert.equal(snapshot.summary.record_count_total, storeCount);
    assert.equal(storeCount, 4);

    for (const group of storeGroups) {
      const domainId = window.LouLearnerSnapshot.STORE_TO_DOMAIN[group.storeName];
      const domain = snapshot.body.domains.find((d) => d.domain_id === domainId);
      assert.equal(domain.records.length, group.records.length, domainId);
    }
  });

  test("LP-E10 snapshot valid without catalog context (A3)", async () => {
    await window.LouLearnerStore.open();
    await window.LouLearnerStore.addWalkthroughNote(
      CHAPTER,
      "story",
      "NC-1",
      sampleAnchor(),
      "No catalog"
    );

    assert.equal(window.LouLearnerStore.getReleaseContext(), null);
    const snapshot = await window.LouLearnerSnapshot.exportSnapshot();
    assert.equal(snapshot.summary.record_count_total, 1);
    assert.match(snapshot.integrity.digest, /^[a-f0-9]{64}$/);
  });

  test("LP-E11 contract fields on every exported record", async () => {
    setCatalogContext(window);
    await window.LouLearnerStore.open();
    await window.LouLearnerStore.addSvgTextFormat(sampleSvgRecord(CHAPTER));

    const snapshot = await window.LouLearnerSnapshot.exportSnapshot();
    const record = snapshot.body.domains.find(
      (d) => d.domain_id === "svg_text_formats"
    ).records[0];

    assert.equal(typeof record.record_id, "string");
    assert.equal(record.release_id, RELEASE_ID);
    assert.equal(record.schema_version, 1);
    assert.equal(record.domain, "svg_text_formats");
    assert.equal(typeof record.chapter, "string");
    assert.equal(record.orphan_status, "none");
    assert.ok(record.payload);
    assert.equal(record.payload.content_digest, undefined);
  });

  test("LP-E12 personal diagram binary encoded at projection layer", async () => {
    setCatalogContext(window);
    const bytes = "personal-diagram-payload";
    const body = await window.LouLearnerSnapshot.buildBodyFromStoreGroups([
      {
        storeName: "personal_diagrams",
        records: [
          {
            id: 1,
            release_id: RELEASE_ID,
            schema_version: 1,
            chapter: CHAPTER,
            element: "MEC-oap",
            created: "2026-08-01T00:00:00.000Z",
            blob: new window.Blob([bytes], { type: "image/svg+xml" }),
          },
        ],
      },
    ]);

    const record = body.domains.find(
      (d) => d.domain_id === "personal_diagrams"
    ).records[0];

    assert.equal(record.payload.media_type, "image/svg+xml");
    assert.equal(
      Buffer.from(record.payload.binary_base64, "base64").toString("utf8"),
      bytes
    );
  });

  test("C1-E01 missing release_id fails export explicitly", async () => {
    await assertExportIncomplete(
      window.LouLearnerSnapshot.buildBodyFromStoreGroups([
        {
          storeName: "text_annotations",
          records: [
            {
              id: 1,
              schema_version: 1,
              chapter: CHAPTER,
              projection: "story",
              element: "X",
              selector: sampleSelector(),
              kind: "highlight",
            },
          ],
        },
      ]),
      "missing release_id"
    );
  });

  test("C1-E02 missing schema_version fails export explicitly", async () => {
    await assertExportIncomplete(
      window.LouLearnerSnapshot.buildBodyFromStoreGroups([
        {
          storeName: "walkthrough_notes",
          records: [
            {
              id: 1,
              release_id: RELEASE_ID,
              chapter: CHAPTER,
              projection: "story",
              element: "N",
              anchor: sampleAnchor(),
              text: "note",
            },
          ],
        },
      ]),
      "missing schema_version"
    );
  });

  test("C1-E03 invalid patrimonial record fails export explicitly", async () => {
    await assertExportIncomplete(
      window.LouLearnerSnapshot.buildBodyFromStoreGroups([
        {
          storeName: "svg_text_formats",
          records: [null],
        },
      ]),
      "invalid patrimonial record"
    );
  });

  test("C2-E01 unexportable personal diagram blob fails export explicitly", async () => {
    await assertExportIncomplete(
      window.LouLearnerSnapshot.buildBodyFromStoreGroups([
        {
          storeName: "personal_diagrams",
          records: [
            {
              id: 1,
              release_id: RELEASE_ID,
              schema_version: 1,
              chapter: CHAPTER,
              element: "MEC-oap",
              created: "2026-08-01T00:00:00.000Z",
              blob: {},
            },
          ],
        },
      ]),
      "binary could not be encoded"
    );
  });

  test("C2-E02 personal diagram missing blob fails export explicitly", async () => {
    await assertExportIncomplete(
      window.LouLearnerSnapshot.buildBodyFromStoreGroups([
        {
          storeName: "personal_diagrams",
          records: [
            {
              id: 2,
              release_id: RELEASE_ID,
              schema_version: 1,
              chapter: CHAPTER,
              element: "MEC-oap",
              created: "2026-08-01T00:00:00.000Z",
            },
          ],
        },
      ]),
      "missing blob"
    );
  });

  test("C2-E03 fake-indexeddb blob loss fails exportSnapshot explicitly", async () => {
    setCatalogContext(window);
    await window.LouLearnerStore.open();
    await window.LouLearnerStore.addPersonalDiagram(
      CHAPTER,
      "MEC-oap",
      new window.Blob(["lost-in-fake-idb"], { type: "image/png" })
    );

    await assertExportIncomplete(
      window.LouLearnerSnapshot.exportSnapshot(),
      "binary could not be encoded"
    );
  });

  test("C1-C2-E01 complete export succeeds when all patrimony prerequisites hold", async () => {
    setCatalogContext(window);
    await window.LouLearnerStore.open();

    await window.LouLearnerStore.addTextHighlight(
      CHAPTER,
      "story",
      "OK-1",
      sampleSelector()
    );
    await window.LouLearnerStore.addPersonalDiagram(
      CHAPTER,
      "MEC-oap",
      new window.Blob(["complete-bytes"], { type: "image/png" })
    );

    const storeGroups = restorePersonalDiagramBlobs(
      window,
      await window.LouLearnerStore.listAllPatrimonialRecords(),
      "complete-bytes",
      "image/png"
    );

    const snapshot = await window.LouLearnerSnapshot.exportSnapshot({
      store: storeReaderFromGroups(storeGroups),
    });

    assert.equal(snapshot.summary.record_count_total, 2);
    const diagram = snapshot.body.domains.find(
      (d) => d.domain_id === "personal_diagrams"
    ).records[0];
    assert.ok(diagram.payload.binary_base64);
    assert.notEqual(diagram.payload.binary_base64, null);
  });
});
