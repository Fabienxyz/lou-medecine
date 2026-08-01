/**
 * Lot D4 — Session Service unit tests (buildResumePlan, handleCommitEvent, V4 contract).
 */
import { test, describe, before } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const CHAPTER = "cardio/234";
const RELEASE_ID = "cardio__234__2022__1";
const OLD_RELEASE_ID = "cardio__234__2021__1";

function loadService(dom) {
  dom.window.eval(
    fs.readFileSync(path.join(ROOT, "learner-patrimony.js"), "utf8")
  );
  dom.window.eval(
    fs.readFileSync(path.join(ROOT, "session-service.js"), "utf8")
  );
  return dom.window.LouSessionService || globalThis.LouSessionService;
}

function baseContext(overrides) {
  return Object.assign(
    {
      entryMode: "cold_boot",
      requestedChapter: CHAPTER,
      activeReleaseId: RELEASE_ID,
      offlineStatus: "offline_ready",
      releaseInstalled: true,
      installedReleaseIds: [RELEASE_ID],
      viewAvailability: {
        "cognitive-priming": "planned",
        "mental-model": "published",
        notions: "published",
        "clinical-cases": "published",
        "college-official": "published",
        qcm: "published",
        notes: "published",
      },
      viewOrder: [
        "cognitive-priming",
        "mental-model",
        "notions",
        "clinical-cases",
        "college-official",
        "qcm",
        "notes",
      ],
      sessionRecords: [],
      observedAt: "2026-08-01T10:00:00.000Z",
      isOfflineRequired: false,
      productMode: false,
    },
    overrides || {}
  );
}

function sampleSession(overrides) {
  return Object.assign(
    {
      logical_record_id: "session_resume::" + RELEASE_ID + "::0000000001",
      release_id: RELEASE_ID,
      chapter: CHAPTER,
      viewId: "mental-model",
      resumePoint: { kind: "view_scroll", scrollY: 120 },
      last_activity_at: "2026-08-01T09:00:00.000Z",
      schema_version: 1,
    },
    overrides || {}
  );
}

describe("Lot D4 — Session Service", () => {
  let service;

  before(() => {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
      url: "http://localhost/",
      runScripts: "outside-only",
    });
    service = loadService(dom);
    assert.ok(service, "LouSessionService must load");
  });

  test("L01 — première ouverture sans session → fallback_amorçage", () => {
    const plan = service.buildResumePlan(baseContext());
    assert.equal(plan.action, "fallback_amorçage");
    assert.equal(plan.targetViewId, "cognitive-priming");
    assert.equal(plan.targetChapter, CHAPTER);
    assert.equal(plan.resumePoint, undefined);
    assert.equal(plan.blockedReason, undefined);
    assert.ok(service.validateResumePlanCompleteness(plan));
  });

  test("reprise normale cold_boot → restore", () => {
    const plan = service.buildResumePlan(
      baseContext({
        sessionRecords: [sampleSession()],
      })
    );
    assert.equal(plan.action, "restore");
    assert.equal(plan.targetViewId, "mental-model");
    assert.equal(plan.resumePoint.kind, "view_scroll");
    assert.equal(plan.resumePoint.scrollY, 120);
    assert.ok(service.validateResumePlanCompleteness(plan));
  });

  test("continue_global — record last_activity_at max", () => {
    const plan = service.buildResumePlan(
      baseContext({
        entryMode: "continue_global",
        sessionRecords: [
          sampleSession({
            last_activity_at: "2026-08-01T08:00:00.000Z",
            viewId: "qcm",
            resumePoint: { kind: "question_id", questionId: "q-234-01" },
          }),
          sampleSession({
            release_id: RELEASE_ID,
            last_activity_at: "2026-08-01T12:00:00.000Z",
            viewId: "notions",
            resumePoint: { kind: "element_block", elementId: "MEC-oap" },
          }),
        ],
      })
    );
    assert.equal(plan.action, "restore");
    assert.equal(plan.targetViewId, "notions");
  });

  test("chapter_direct — record pour Release active du chapitre", () => {
    const plan = service.buildResumePlan(
      baseContext({
        entryMode: "chapter_direct",
        sessionRecords: [
          sampleSession({ chapter: "cardio/999", viewId: "qcm" }),
          sampleSession({ viewId: "clinical-cases" }),
        ],
      })
    );
    assert.equal(plan.action, "restore");
    assert.equal(plan.targetViewId, "clinical-cases");
  });

  test("breadcrumb_amorçage → fallback_amorçage", () => {
    const plan = service.buildResumePlan(
      baseContext({
        entryMode: "breadcrumb_amorçage",
        sessionRecords: [sampleSession()],
      })
    );
    assert.equal(plan.action, "fallback_amorçage");
  });

  test("Release superseded → fallback_amorçage + warning", () => {
    const plan = service.buildResumePlan(
      baseContext({
        entryMode: "continue_global",
        installedReleaseIds: [RELEASE_ID, OLD_RELEASE_ID],
        sessionRecords: [
          sampleSession({ release_id: OLD_RELEASE_ID }),
        ],
      })
    );
    assert.equal(plan.action, "fallback_amorçage");
    assert.ok(plan.warnings.includes("superseded_release"));
  });

  test("Release absente → orphan_signal", () => {
    const plan = service.buildResumePlan(
      baseContext({
        installedReleaseIds: [],
        releaseInstalled: false,
        sessionRecords: [sampleSession()],
      })
    );
    assert.equal(plan.action, "orphan_signal");
    assert.ok(plan.warnings.includes("orphan_release"));
    assert.ok(service.validateResumePlanCompleteness(plan));
  });

  test("offline_ready — restore when online", () => {
    const plan = service.buildResumePlan(
      baseContext({
        isOfflineRequired: false,
        offlineStatus: "not_prepared",
        sessionRecords: [sampleSession()],
      })
    );
    assert.equal(plan.action, "restore");
  });

  test("blocked_offline when offline required and not ready", () => {
    const plan = service.buildResumePlan(
      baseContext({
        isOfflineRequired: true,
        offlineStatus: "not_prepared",
        sessionRecords: [sampleSession()],
      })
    );
    assert.equal(plan.action, "blocked_offline");
    assert.equal(plan.blockedReason, "offline_not_ready");
    assert.ok(service.validateResumePlanCompleteness(plan));
  });

  test("L02 — schema incompatible → fallback_amorçage", () => {
    const plan = service.buildResumePlan(
      baseContext({
        sessionRecords: [sampleSession({ schema_version: 99 })],
      })
    );
    assert.equal(plan.action, "fallback_amorçage");
    assert.ok(plan.warnings.includes("schema_incompatible"));
  });

  test("L03 — viewId inconnu → fallback_requested_chapter", () => {
    const plan = service.buildResumePlan(
      baseContext({
        sessionRecords: [
          sampleSession({ viewId: "nonexistent-view" }),
        ],
      })
    );
    assert.equal(plan.action, "fallback_requested_chapter");
  });

  test("L04 — vue planned → fallback published", () => {
    const plan = service.buildResumePlan(
      baseContext({
        sessionRecords: [
          sampleSession({
            viewId: "cognitive-priming",
            resumePoint: { kind: "view_entry" },
          }),
        ],
      })
    );
    assert.equal(plan.action, "restore");
    assert.equal(plan.targetViewId, "mental-model");
    assert.ok(plan.warnings.includes("planned"));
  });

  test("L05 — ResumePoint invalide → restore + orphan_anchor warning", () => {
    const plan = service.buildResumePlan(
      baseContext({
        sessionRecords: [
          sampleSession({
            viewId: "mental-model",
            resumePoint: { kind: "question_id", questionId: "bad" },
          }),
        ],
      })
    );
    assert.equal(plan.action, "restore");
    assert.equal(plan.targetViewId, "mental-model");
    assert.ok(plan.warnings.includes("orphan_anchor"));
    assert.ok(service.validateResumePlanCompleteness(plan));
  });

  test("L23 — RestoreContext identique → même ResumePlan (IA-05)", () => {
    const ctx = baseContext({ sessionRecords: [sampleSession()] });
    const a = service.buildResumePlan(ctx);
    const b = service.buildResumePlan(ctx);
    assert.deepEqual(a, b);
  });

  test("L27 — validateResumePlanCompleteness rejects incomplete restore", () => {
    assert.equal(
      service.validateResumePlanCompleteness({
        action: "restore",
        targetReleaseId: RELEASE_ID,
        targetChapter: CHAPTER,
        targetViewId: "notions",
      }),
      false
    );
  });

  test("handleCommitEvent CE-01 VIEW_CHANGED", () => {
    const state = service.handleCommitEvent(
      {
        release_id: RELEASE_ID,
        chapter: CHAPTER,
        committedAt: "2026-08-01T11:00:00.000Z",
      },
      {
        type: "VIEW_CHANGED",
        payload: {
          viewId: "notions",
          resumePoint: { kind: "element_block", elementId: "MEC-oap" },
        },
      }
    );
    assert.equal(state.viewId, "notions");
    assert.equal(state.release_id, RELEASE_ID);
    assert.equal(state.schema_version, 1);
    assert.equal(state.last_activity_at, "2026-08-01T11:00:00.000Z");
  });

  test("handleCommitEvent CE-04 INTERNAL_NAV_VALIDATED", () => {
    const state = service.handleCommitEvent(
      {
        release_id: RELEASE_ID,
        chapter: CHAPTER,
        committedAt: "2026-08-01T11:00:00.000Z",
      },
      { type: "INTERNAL_NAV_VALIDATED", payload: {} }
    );
    assert.equal(state.viewId, "cognitive-priming");
    assert.equal(state.resumePoint.kind, "view_entry");
  });

  test("IA-19 — même CommitContext + event → même SessionState", () => {
    const ctx = {
      release_id: RELEASE_ID,
      chapter: CHAPTER,
      committedAt: "2026-08-01T11:00:00.000Z",
      existingSessionState: { id: 3 },
    };
    const event = {
      type: "VIEW_CHANGED",
      payload: {
        viewId: "qcm",
        resumePoint: { kind: "question_id", questionId: "q-234-02" },
      },
    };
    assert.deepEqual(
      service.handleCommitEvent(ctx, event),
      service.handleCommitEvent(ctx, event)
    );
  });

  test("post_import entry mode selects latest activity", () => {
    const plan = service.buildResumePlan(
      baseContext({
        entryMode: "post_import",
        sessionRecords: [
          sampleSession({ last_activity_at: "2026-08-01T07:00:00.000Z" }),
          sampleSession({
            last_activity_at: "2026-08-01T13:00:00.000Z",
            viewId: "notes",
            resumePoint: { kind: "notes_focus", category: "general" },
          }),
        ],
      })
    );
    assert.equal(plan.targetViewId, "notes");
  });

  test("multi-Release — continue_global sur Release superseded → fallback", () => {
    const plan = service.buildResumePlan(
      baseContext({
        entryMode: "continue_global",
        installedReleaseIds: [RELEASE_ID, "cardio__234__2023__1"],
        sessionRecords: [
          sampleSession({
            release_id: "cardio__234__2023__1",
            chapter: "cardio/234",
            last_activity_at: "2026-08-01T14:00:00.000Z",
            viewId: "qcm",
            resumePoint: { kind: "question_id", questionId: "q-234-10" },
          }),
          sampleSession({
            last_activity_at: "2026-08-01T09:00:00.000Z",
          }),
        ],
      })
    );
    assert.equal(plan.action, "fallback_amorçage");
    assert.ok(plan.warnings.includes("superseded_release"));
  });
});
