import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  OFFLINE_STATUS,
  OFFLINE_STATUSES,
  DEFAULT_OFFLINE_STATUS,
  OfflineStateError,
  validateOfflineStatus,
  assertOfflineStatus,
  isOfflineReady,
  canTransitionOfflineStatus,
  transitionOfflineStatus,
  loadOfflineStatus,
  setOfflineStatus,
  getCatalogOfflineStatus,
  transitionCatalogOfflineStatus,
  migrateCatalogOfflineStatus,
} from "../lib/offline-state.js";
import {
  createEmptyCatalog,
  loadOrCreateCatalog,
  saveCatalogAtomic,
  validateLibraryCatalog,
  catalogEntryFromManifest,
} from "../lib/library-catalog.js";

function sampleEntry(overrides = {}) {
  return {
    release_id: "cardio__234__2022__1",
    chapter: "cardio/234",
    edition: 2022,
    publication_version: 1,
    status: "active",
    installed_at: "2026-08-01T10:00:00.000Z",
    root: "packages/cardio__234__2022__1",
    manifest: "packages/cardio__234__2022__1/manifest.json",
    content_digest:
      "sha256:" + "a".repeat(64),
    offline_status: OFFLINE_STATUS.NOT_PREPARED,
    ...overrides,
  };
}

function sampleCatalog(entry = sampleEntry()) {
  const catalog = createEmptyCatalog();
  catalog.entries = [entry];
  catalog.active_by_chapter = { [entry.chapter]: entry.release_id };
  return catalog;
}

describe("offline state model (D2-B)", () => {
  test("validates the four authorized statuses", () => {
    for (const status of OFFLINE_STATUSES) {
      assert.deepEqual(validateOfflineStatus(status), []);
      assert.equal(assertOfflineStatus(status), status);
    }
  });

  test("rejects unknown offline_status values", () => {
    assert.ok(validateOfflineStatus("stale_offline").length > 0);
    assert.ok(validateOfflineStatus("").length > 0);
    assert.throws(
      () => assertOfflineStatus("partial"),
      (err) =>
        err instanceof OfflineStateError && err.code === "INVALID_STATUS"
    );
  });

  test("isOfflineReady is true only for offline_ready", () => {
    assert.equal(isOfflineReady(OFFLINE_STATUS.OFFLINE_READY), true);
    assert.equal(isOfflineReady(OFFLINE_STATUS.NOT_PREPARED), false);
    assert.equal(isOfflineReady(OFFLINE_STATUS.PREPARING), false);
    assert.equal(isOfflineReady(OFFLINE_STATUS.FAILED), false);
  });

  test("allows authorized transitions", () => {
    const allowed = [
      [OFFLINE_STATUS.NOT_PREPARED, OFFLINE_STATUS.PREPARING],
      [OFFLINE_STATUS.PREPARING, OFFLINE_STATUS.OFFLINE_READY],
      [OFFLINE_STATUS.PREPARING, OFFLINE_STATUS.FAILED],
      [OFFLINE_STATUS.FAILED, OFFLINE_STATUS.PREPARING],
      [OFFLINE_STATUS.OFFLINE_READY, OFFLINE_STATUS.PREPARING],
      [OFFLINE_STATUS.OFFLINE_READY, OFFLINE_STATUS.FAILED],
    ];
    for (const [from, to] of allowed) {
      assert.equal(canTransitionOfflineStatus(from, to), true);
      assert.equal(transitionOfflineStatus(from, to), to);
    }
  });

  test("rejects forbidden transitions", () => {
    const forbidden = [
      [OFFLINE_STATUS.NOT_PREPARED, OFFLINE_STATUS.OFFLINE_READY],
      [OFFLINE_STATUS.NOT_PREPARED, OFFLINE_STATUS.FAILED],
      [OFFLINE_STATUS.OFFLINE_READY, OFFLINE_STATUS.NOT_PREPARED],
      [OFFLINE_STATUS.FAILED, OFFLINE_STATUS.OFFLINE_READY],
      [OFFLINE_STATUS.PREPARING, OFFLINE_STATUS.NOT_PREPARED],
    ];
    for (const [from, to] of forbidden) {
      assert.equal(canTransitionOfflineStatus(from, to), false);
      assert.throws(
        () => transitionOfflineStatus(from, to),
        (err) =>
          err instanceof OfflineStateError && err.code === "INVALID_TRANSITION"
      );
    }
  });

  test("transition is idempotent when status unchanged", () => {
    assert.equal(
      transitionOfflineStatus(OFFLINE_STATUS.PREPARING, OFFLINE_STATUS.PREPARING),
      OFFLINE_STATUS.PREPARING
    );
  });

  test("loadOfflineStatus and setOfflineStatus on catalog entry", () => {
    const entry = sampleEntry({ offline_status: OFFLINE_STATUS.FAILED });
    assert.equal(loadOfflineStatus(entry), OFFLINE_STATUS.FAILED);
    assert.equal(setOfflineStatus(entry, OFFLINE_STATUS.NOT_PREPARED), OFFLINE_STATUS.NOT_PREPARED);
    assert.equal(entry.offline_status, OFFLINE_STATUS.NOT_PREPARED);
  });

  test("transitionCatalogOfflineStatus updates catalog entry", () => {
    const catalog = sampleCatalog(
      sampleEntry({ offline_status: OFFLINE_STATUS.NOT_PREPARED })
    );
    assert.equal(
      transitionCatalogOfflineStatus(
        catalog,
        "cardio__234__2022__1",
        OFFLINE_STATUS.PREPARING
      ),
      OFFLINE_STATUS.PREPARING
    );
    assert.equal(
      getCatalogOfflineStatus(catalog, "cardio__234__2022__1"),
      OFFLINE_STATUS.PREPARING
    );
  });

  test("transitionCatalogOfflineStatus rejects unknown release_id", () => {
    const catalog = sampleCatalog();
    assert.throws(
      () =>
        transitionCatalogOfflineStatus(
          catalog,
          "missing__release",
          OFFLINE_STATUS.PREPARING
        ),
      (err) =>
        err instanceof OfflineStateError && err.code === "UNKNOWN_RELEASE"
    );
  });
});

describe("offline status catalog persistence (D2-B)", () => {
  let tmp;
  let libraryRoot;

  beforeEach(() => {
    tmp = fs.mkdtempSync(path.join(os.tmpdir(), "lou-offline-"));
    libraryRoot = path.join(tmp, "library");
  });

  afterEach(() => {
    fs.rmSync(tmp, { recursive: true, force: true });
  });

  test("persists offline_status in library.json and reloads it", () => {
    const catalog = sampleCatalog();
    transitionCatalogOfflineStatus(
      catalog,
      "cardio__234__2022__1",
      OFFLINE_STATUS.PREPARING
    );
    transitionCatalogOfflineStatus(
      catalog,
      "cardio__234__2022__1",
      OFFLINE_STATUS.OFFLINE_READY
    );
    saveCatalogAtomic(libraryRoot, catalog);

    const reloaded = loadOrCreateCatalog(libraryRoot);
    assert.equal(
      getCatalogOfflineStatus(reloaded, "cardio__234__2022__1"),
      OFFLINE_STATUS.OFFLINE_READY
    );
    assert.deepEqual(validateLibraryCatalog(reloaded), []);
  });

  test("migrates legacy catalog entries without offline_status to not_prepared", () => {
    fs.mkdirSync(libraryRoot, { recursive: true });
    const legacy = sampleCatalog();
    delete legacy.entries[0].offline_status;
    fs.writeFileSync(
      path.join(libraryRoot, "library.json"),
      JSON.stringify(legacy, null, 2) + "\n"
    );

    const migrated = loadOrCreateCatalog(libraryRoot);
    assert.equal(
      getCatalogOfflineStatus(migrated, "cardio__234__2022__1"),
      DEFAULT_OFFLINE_STATUS
    );
    assert.deepEqual(validateLibraryCatalog(migrated), []);
  });

  test("migrateCatalogOfflineStatus is idempotent", () => {
    const catalog = sampleCatalog();
    migrateCatalogOfflineStatus(catalog);
    migrateCatalogOfflineStatus(catalog);
    assert.equal(
      getCatalogOfflineStatus(catalog, "cardio__234__2022__1"),
      OFFLINE_STATUS.NOT_PREPARED
    );
  });

  test("catalogEntryFromManifest defaults offline_status to not_prepared", () => {
    const entry = catalogEntryFromManifest({
      release_id: "cardio__234__2022__1",
      chapter: "cardio/234",
      source_edition: 2022,
      publication_version: 1,
      content_digest: "sha256:" + "b".repeat(64),
    });
    assert.equal(entry.offline_status, DEFAULT_OFFLINE_STATUS);
  });
});
