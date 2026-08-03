/**
 * Lot D4 — session_resume persistence, snapshot, and commit orchestration (IA-25).
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
const RELEASE_ID = "cardio__234__2022__1";

function loadScripts(dom, files) {
  for (const file of files) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
}

function setupDom() {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost/?chapter=" + encodeURIComponent(CHAPTER),
    runScripts: "outside-only",
  });
  dom.window.indexedDB = new IDBFactory();
  dom.window.__LOU_NODE_CRYPTO__ = nodeCrypto;
  loadScripts(dom, [
    "learner-patrimony.js",
    "learner-store.js",
    "session-service.js",
    "session-resume.js",
    "learner-snapshot.js",
  ]);
  return dom;
}

describe("Lot D4 — session_resume store and snapshot", () => {
  /** @type {Window} */
  let window;

  before(() => {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
      url: "http://localhost/?chapter=" + encodeURIComponent(CHAPTER),
      runScripts: "outside-only",
    });
    window = dom.window;
    window.indexedDB = new IDBFactory();
    window.__LOU_NODE_CRYPTO__ = nodeCrypto;
    loadScripts(dom, [
      "learner-patrimony.js",
      "learner-store.js",
      "session-service.js",
      "session-resume.js",
      "learner-snapshot.js",
    ]);
  });

  beforeEach(() => {
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    window.LouLearnerStore.clearReleaseContext();
    window.LouSessionResume.resetRestoreCycleForTests();
    window.LouLearnerStore.setReleaseContext({
      releaseId: RELEASE_ID,
      chapter: CHAPTER,
    });
  });

  test("upsertSessionState persists and upserts by release_id", async () => {
    const store = window.LouLearnerStore;
    const service = window.LouSessionService;

    const first = await store.upsertSessionState(
      service.handleCommitEvent(
        {
          release_id: RELEASE_ID,
          chapter: CHAPTER,
          committedAt: "2026-08-01T10:00:00.000Z",
        },
        {
          type: "VIEW_CHANGED",
          payload: {
            viewId: "mental-model",
            resumePoint: { kind: "view_scroll", scrollY: 50 },
          },
        }
      )
    );
    assert.ok(first.id);

    const second = await store.upsertSessionState(
      service.handleCommitEvent(
        {
          release_id: RELEASE_ID,
          chapter: CHAPTER,
          committedAt: "2026-08-01T11:00:00.000Z",
          existingSessionState: first,
        },
        {
          type: "VIEW_CHANGED",
          payload: {
            viewId: "notions",
            resumePoint: { kind: "element_block", elementId: "MEC-oap" },
          },
        }
      )
    );
    assert.equal(second.id, first.id);
    assert.equal(second.viewId, "notions");

    const records = await store.listSessionRecords();
    assert.equal(records.length, 1);
  });

  test("export/import snapshot round-trip session_resume", async () => {
    const store = window.LouLearnerStore;
    const service = window.LouSessionService;

    await store.upsertSessionState(
      service.handleCommitEvent(
        {
          release_id: RELEASE_ID,
          chapter: CHAPTER,
          committedAt: "2026-08-01T10:00:00.000Z",
        },
        {
          type: "VIEW_CHANGED",
          payload: {
            viewId: "qcm",
            resumePoint: { kind: "question_id", questionId: "q-234-01" },
          },
        }
      )
    );

    const snapshot = await window.LouLearnerSnapshot.exportSnapshot({
      exportedAt: "2026-08-01T12:00:00.000Z",
    });
    const sessionDomain = snapshot.body.domains.find(
      (d) => d.domain_id === "session_resume"
    );
    assert.ok(sessionDomain);
    assert.equal(sessionDomain.records.length, 1);
    assert.equal(sessionDomain.records[0].payload.viewId, "qcm");

    const freshDom = setupDom();
    freshDom.window.LouLearnerStore.setReleaseContext({
      releaseId: RELEASE_ID,
      chapter: CHAPTER,
    });
    const importResult = await freshDom.window.LouLearnerSnapshot.importSnapshot(
      snapshot,
      { catalogReleaseIds: [RELEASE_ID] }
    );
    assert.equal(importResult.success, true);

    const imported = await freshDom.window.LouLearnerStore.listSessionRecords();
    assert.equal(imported.length, 1);
    assert.equal(imported[0].viewId, "qcm");
    assert.deepEqual(imported[0].resumePoint, {
      kind: "question_id",
      questionId: "q-234-01",
    });
  });

  test("buildRestoreContext reads session records", async () => {
    await window.LouLearnerStore.upsertSessionState({
      release_id: RELEASE_ID,
      chapter: CHAPTER,
      viewId: "clinical-cases",
      resumePoint: { kind: "view_scroll", scrollY: 200 },
      last_activity_at: "2026-08-01T10:00:00.000Z",
      schema_version: 1,
      logical_record_id: "session_resume::" + RELEASE_ID + "::0000000001",
    });

    const ctx = await window.LouSessionResume.buildRestoreContext({
      chapter: CHAPTER,
      releaseId: RELEASE_ID,
      tabs: [
        { viewId: "cognitive-priming", availability: "planned" },
        { viewId: "clinical-cases", availability: "published" },
      ],
      entryMode: "cold_boot",
    });
    assert.equal(ctx.sessionRecords.length, 1);
    assert.equal(ctx.entryMode, "cold_boot");
  });

  test("idempotent import — unchanged on second import", async () => {
    const store = window.LouLearnerStore;
    await store.upsertSessionState({
      release_id: RELEASE_ID,
      chapter: CHAPTER,
      viewId: "notes",
      resumePoint: { kind: "notes_focus", category: "personal" },
      last_activity_at: "2026-08-01T10:00:00.000Z",
      schema_version: 1,
      logical_record_id: "session_resume::" + RELEASE_ID + "::0000000001",
    });

    const snapshot = await window.LouLearnerSnapshot.exportSnapshot({
      exportedAt: "2026-08-01T12:00:00.000Z",
    });
    const first = await window.LouLearnerSnapshot.importSnapshot(snapshot, {
      catalogReleaseIds: [RELEASE_ID],
    });
    const second = await window.LouLearnerSnapshot.importSnapshot(snapshot, {
      catalogReleaseIds: [RELEASE_ID],
    });
    assert.equal(first.success, true);
    assert.equal(second.success, true);
    assert.ok(second.unchanged.length >= 1 || second.updated.length === 0);
  });

  test("L24 — resume_status absent from persisted SessionState", async () => {
    const state = await window.LouLearnerStore.upsertSessionState({
      release_id: RELEASE_ID,
      chapter: CHAPTER,
      viewId: "notions",
      resumePoint: { kind: "element_block", elementId: "x" },
      last_activity_at: "2026-08-01T10:00:00.000Z",
      schema_version: 1,
      resume_status: "should_be_stripped",
      logical_record_id: "session_resume::" + RELEASE_ID + "::0000000001",
    });
    assert.equal(state.resume_status, undefined);
    const stored = await window.LouLearnerStore.getSessionForRelease(RELEASE_ID);
    assert.equal(stored.resume_status, undefined);
    const snapshot = await window.LouLearnerSnapshot.exportSnapshot({
      exportedAt: "2026-08-01T12:00:00.000Z",
    });
    const sessionDomain = snapshot.body.domains.find(
      (d) => d.domain_id === "session_resume"
    );
    assert.equal(sessionDomain.records[0].payload.resume_status, undefined);
  });
});

describe("Lot D4 — applyResumePlan mechanical degradation", () => {
  /** @type {Window} */
  let window;

  before(() => {
    const dom = setupDom();
    window = dom.window;
  });

  beforeEach(() => {
    window.LouSessionResume.resetRestoreCycleForTests();
    window.document.body.innerHTML =
      '<div id="tabs"></div><div id="content"></div>';
  });

  test("orphan_anchor application — keeps view, adds warning", async () => {
    const tabs = [
      { viewId: "cognitive-priming", availability: "planned" },
      { viewId: "mental-model", availability: "published" },
    ];
    let shown = -1;
    const result = await window.LouSessionResume.applyResumePlan(
      {
        action: "restore",
        targetReleaseId: RELEASE_ID,
        targetChapter: CHAPTER,
        targetViewId: "mental-model",
        resumePoint: { kind: "element_block", elementId: "missing-el" },
        warnings: [],
      },
      {
        tabs: tabs,
        chapter: CHAPTER,
        showTab: async function (index) {
          shown = index;
        },
      }
    );
    assert.equal(result.ok, true);
    assert.equal(shown, 1);
    const banner = window.document.getElementById("session-resume-warnings");
    assert.ok(
      banner.textContent.includes(
        "le repère de lecture exact n'a pas pu être restauré"
      )
    );
    assert.equal(banner.textContent.includes("orphan_anchor"), false);
  });

  test("L26 — second applyResumePlan throws", async () => {
    const handlers = {
      tabs: [{ viewId: "cognitive-priming" }],
      chapter: CHAPTER,
      showTab: async function () {},
    };
    await window.LouSessionResume.applyResumePlan(
      {
        action: "fallback_amorçage",
        targetReleaseId: RELEASE_ID,
        targetChapter: CHAPTER,
        targetViewId: "cognitive-priming",
      },
      handlers
    );
    await assert.rejects(
      () => window.LouSessionResume.applyResumePlan(
        {
          action: "fallback_amorçage",
          targetReleaseId: RELEASE_ID,
          targetChapter: CHAPTER,
          targetViewId: "cognitive-priming",
        },
        handlers
      ),
      /Second applyResumePlan forbidden/
    );
  });
});
