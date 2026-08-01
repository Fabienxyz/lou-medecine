/**
 * Lot D4 — post-audit corrections (B1, M1–M4, m1–m4).
 */
import { test, describe, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import nodeCrypto from "node:crypto";
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";
import { createBrowserPackageAccess } from "../library/browser-package-access.js";
import { buildRestoreCatalogFacts } from "../library/restore-catalog-facts.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const FIXTURE_LIBRARY = path.join(HERE, "fixtures/product-library");
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
  return dom.window.LouSessionService;
}

function setupResumeDom() {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost/?chapter=" + encodeURIComponent(CHAPTER),
    runScripts: "outside-only",
  });
  dom.window.indexedDB = new IDBFactory();
  dom.window.__LOU_NODE_CRYPTO__ = nodeCrypto;
  for (const file of [
    "learner-patrimony.js",
    "learner-store.js",
    "session-service.js",
    "session-resume.js",
  ]) {
    dom.window.eval(fs.readFileSync(path.join(ROOT, file), "utf8"));
  }
  return dom;
}

const CE02_ELEMENT_ID = "MEC-oap";

function buildAppDomHtml() {
  return `<!DOCTYPE html><html><body>
    <div id="tabs"></div>
    <div id="content"></div>
    <h1 id="specialty"></h1>
    <p id="chapter-line"></p>
    <p id="chapter-title"></p>
    <ul id="objectives-list"></ul>
    <span id="read-time"></span>
  </body></html>`;
}

function buildNavigationTabs() {
  return [
    {
      viewId: "cognitive-priming",
      label: "Amorçage",
      availability: "planned",
      view: { viewId: "cognitive-priming", availability: "planned" },
    },
    {
      viewId: "mental-model",
      label: "Schéma",
      availability: "published",
      view: {
        viewId: "mental-model",
        availability: "published",
        blocks: [],
      },
    },
    {
      viewId: "notions",
      label: "Notions",
      availability: "published",
      view: { viewId: "notions", availability: "published", blocks: [] },
    },
  ];
}

/**
 * Minimal Reader harness executing app.js click wiring for CE-02.
 * @returns {Promise<{ window: Window, notionCalls: string[] }>}
 */
async function setupCe02DomHarness() {
  const notionCalls = [];
  const navigationTabs = buildNavigationTabs();

  const dom = new JSDOM(buildAppDomHtml(), {
    url: "http://localhost/?chapter=" + encodeURIComponent(CHAPTER),
    runScripts: "outside-only",
  });
  const window = dom.window;
  window.indexedDB = new IDBFactory();
  window.__LOU_NODE_CRYPTO__ = nodeCrypto;
  Object.defineProperty(window.navigator, "webdriver", {
    value: true,
    configurable: true,
  });

  window.eval(fs.readFileSync(path.join(ROOT, "config.js"), "utf8"));
  window.eval(fs.readFileSync(path.join(ROOT, "learner-patrimony.js"), "utf8"));
  window.eval(fs.readFileSync(path.join(ROOT, "session-service.js"), "utf8"));
  window.eval(fs.readFileSync(path.join(ROOT, "session-resume.js"), "utf8"));

  const realCreateCommitController =
    window.LouSessionResume.createCommitController;
  window.LouSessionResume.createCommitController = function (
    getCurrentViewState
  ) {
    const controller = realCreateCommitController(getCurrentViewState);
    return Object.assign({}, controller, {
      onNotionChanged: function (elementId) {
        notionCalls.push(elementId);
        return Promise.resolve(null);
      },
      onViewChanged: function () {},
      flushViewLeave: function () {
        return Promise.resolve(null);
      },
      bindLifecycleEvents: function () {},
    });
  };

  window.LouSessionResume.applyResumePlan = async function () {
    return { ok: true, action: "fallback_amorçage" };
  };

  window.LouMarkdown = {
    parse: function (text) {
      return text;
    },
  };

  window.LouComposition = {
    buildReadingViewModel: async function () {
      return {
        readingViewModel: {
          views: navigationTabs.map(function (tab) {
            return tab.view;
          }),
        },
      };
    },
    buildNavigationFromViewModel: function () {
      return navigationTabs.map(function (tab) {
        return Object.assign({}, tab);
      });
    },
  };

  window.LouRenderer = {
    init: function () {},
    showMessage: function () {},
    loadPublishedManifest: async function () {
      return {
        ok: true,
        manifest: {
          title: "Test chapter",
          chapter: CHAPTER,
          release_id: null,
        },
      };
    },
    applyHeaderMetadata: function () {},
    manifestErrorMessage: function () {
      return "manifest error";
    },
    renderComposedView: async function () {},
    projectionAvailabilityMessage: function () {
      return "";
    },
    viewAvailabilityMessage: function () {
      return "";
    },
  };

  window.LouLearnerStore = {
    setReleaseContext: function () {},
    getReleaseContext: function () {
      return null;
    },
    listSessionRecords: async function () {
      return [];
    },
  };

  window.eval(fs.readFileSync(path.join(ROOT, "app.js"), "utf8"));

  if (window.LouApp && window.LouApp.whenTabReady) {
    await window.LouApp.whenTabReady();
  }
  await new Promise(function (resolve) {
    setTimeout(resolve, 0);
  });

  return { window: window, notionCalls: notionCalls };
}

async function activateView(window, viewId) {
  const tabEl = window.document.querySelector(
    '#tabs .tab[data-view-id="' + viewId + '"]'
  );
  assert.ok(tabEl, "tab for view " + viewId + " must exist");
  tabEl.dispatchEvent(
    new window.MouseEvent("click", { bubbles: true, cancelable: true })
  );
  for (let attempt = 0; attempt < 20; attempt += 1) {
    if (window.LouApp && window.LouApp.whenTabReady) {
      await window.LouApp.whenTabReady();
    }
    if (window.LouApp.getCurrentViewId() === viewId) {
      return;
    }
    await new Promise(function (resolve) {
      setTimeout(resolve, 10);
    });
  }
  assert.equal(window.LouApp.getCurrentViewId(), viewId);
}

function mountPedagogicalBlock(window, elementId) {
  const content = window.document.getElementById("content");
  content.innerHTML = "";
  const block = window.document.createElement("section");
  block.className = "pedagogical-block";
  block.setAttribute("data-element", elementId);
  block.innerHTML = "<p>Block content</p>";
  content.appendChild(block);
  return block;
}

async function clickPedagogicalBlock(window, elementId) {
  const block = window.document.querySelector(
    '.pedagogical-block[data-element="' + elementId + '"]'
  );
  assert.ok(block, "pedagogical block must exist");
  block.dispatchEvent(
    new window.MouseEvent("click", { bubbles: true, cancelable: true })
  );
  await new Promise(function (resolve) {
    setTimeout(resolve, 0);
  });
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

function openLegacyV6Database(window) {
  return new Promise(function (resolve, reject) {
    const request = window.indexedDB.open("lou-learner", 6);
    request.onupgradeneeded = function () {
      const db = request.result;
      if (!db.objectStoreNames.contains("personal_diagrams")) {
        const store = db.createObjectStore("personal_diagrams", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("logical_record_id", "logical_record_id", {
          unique: true,
        });
      }
      if (!db.objectStoreNames.contains("text_annotations")) {
        const store = db.createObjectStore("text_annotations", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("logical_record_id", "logical_record_id", {
          unique: true,
        });
      }
      if (!db.objectStoreNames.contains("walkthrough_notes")) {
        const store = db.createObjectStore("walkthrough_notes", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("logical_record_id", "logical_record_id", {
          unique: true,
        });
      }
      if (!db.objectStoreNames.contains("svg_text_formats")) {
        const store = db.createObjectStore("svg_text_formats", {
          keyPath: "id",
          autoIncrement: true,
        });
        store.createIndex("logical_record_id", "logical_record_id", {
          unique: true,
        });
        store.createIndex("chapter_projection", ["chapter", "projection"]);
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

async function seedLegacyV6Patrimony(window) {
  const db = await openLegacyV6Database(window);
  await new Promise(function (resolve, reject) {
    const tx = db.transaction(
      ["text_annotations", "walkthrough_notes", "patrimony_meta"],
      "readwrite"
    );
    tx.objectStore("text_annotations").add({
      release_id: RELEASE_ID,
      schema_version: 1,
      chapter: CHAPTER,
      projection: "mechanisms",
      element: "MEC-oap",
      selector: { type: "TextQuoteSelector", exact: "OAP", prefix: "", suffix: "" },
      color: "yellow",
      created: "2026-08-01T08:00:00.000Z",
      logical_record_id:
        "walkthrough_annotations::" + RELEASE_ID + "::0000000001",
    });
    tx.objectStore("walkthrough_notes").add({
      release_id: RELEASE_ID,
      schema_version: 1,
      chapter: CHAPTER,
      projection: "story",
      element: "MM-pump",
      anchor: { type: "CaretAnchor", offset: 0 },
      text: "legacy note",
      created: "2026-08-01T08:00:00.000Z",
      logical_record_id: "walkthrough_notes::" + RELEASE_ID + "::0000000001",
    });
    tx.objectStore("patrimony_meta").put({
      key: "migration_v6",
      completed_at: "2026-08-01T08:00:00.000Z",
    });
    tx.oncomplete = () => resolve(undefined);
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

describe("D4 audit — catalog facts (B1/M4)", () => {
  test("buildRestoreCatalogFacts lists all installed releases from catalog", async () => {
    const catalogJson = fs.readFileSync(
      path.join(FIXTURE_LIBRARY, "library.json"),
      "utf8"
    );
    const packageAccess = createBrowserPackageAccess({
      libraryBaseUrl: "https://example.test/library",
      fetch: async (url) => {
        if (String(url).endsWith("/library.json")) {
          return {
            ok: true,
            json: async () => JSON.parse(catalogJson),
          };
        }
        throw new Error("unexpected fetch: " + url);
      },
    });

    const facts = await buildRestoreCatalogFacts({
      chapter: CHAPTER,
      packageAccess,
      releaseId: RELEASE_ID,
      offlineStatus: "offline_ready",
    });

    assert.equal(facts.activeReleaseId, RELEASE_ID);
    assert.deepEqual(facts.installedReleaseIds, [RELEASE_ID]);
    assert.equal(facts.releaseInstalled, true);
    assert.equal(facts.offlineStatus, "offline_ready");
  });

  test("Release N installée + N+1 active → superseded_release, pas orphan_signal", () => {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
      url: "http://localhost/",
      runScripts: "outside-only",
    });
    const service = loadService(dom);
    const plan = service.buildResumePlan(
      baseContext({
        entryMode: "continue_global",
        activeReleaseId: RELEASE_ID,
        installedReleaseIds: [RELEASE_ID, OLD_RELEASE_ID],
        sessionRecords: [
          sampleSession({
            release_id: OLD_RELEASE_ID,
            last_activity_at: "2026-08-01T12:00:00.000Z",
          }),
        ],
      })
    );
    assert.equal(plan.action, "fallback_amorçage");
    assert.ok(plan.warnings.includes("superseded_release"));
    assert.notEqual(plan.action, "orphan_signal");
  });

  test("Release réellement absente → orphan_signal", () => {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
      url: "http://localhost/",
      runScripts: "outside-only",
    });
    const service = loadService(dom);
    const plan = service.buildResumePlan(
      baseContext({
        entryMode: "continue_global",
        installedReleaseIds: [RELEASE_ID],
        releaseInstalled: false,
        sessionRecords: [
          sampleSession({ release_id: "missing__release__1" }),
        ],
      })
    );
    assert.equal(plan.action, "orphan_signal");
    assert.ok(plan.warnings.includes("orphan_release"));
  });
});

describe("D4 audit — Reader strict (M2) and m4", () => {
  /** @type {Window} */
  let window;

  before(() => {
    window = setupResumeDom().window;
  });

  beforeEach(() => {
    window.LouSessionResume.resetRestoreCycleForTests();
  });

  test("ResumePlan incomplet → erreur explicite, pas d Amorçage implicite", async () => {
    await assert.rejects(
      () =>
        window.LouSessionResume.applyResumePlan(
          {
            action: "restore",
            targetReleaseId: RELEASE_ID,
            targetChapter: CHAPTER,
            targetViewId: "notions",
          },
          {
            tabs: [{ viewId: "notions" }],
            chapter: CHAPTER,
            showTab: async function () {},
          }
        ),
      /Incomplete ResumePlan/
    );
  });

  test("targetViewId inconnu → erreur d application, pas index 0", async () => {
    let shown = -1;
    await assert.rejects(
      () =>
        window.LouSessionResume.applyResumePlan(
          {
            action: "fallback_requested_chapter",
            targetReleaseId: RELEASE_ID,
            targetChapter: CHAPTER,
            targetViewId: "ghost-view",
            warnings: [],
          },
          {
            tabs: [{ viewId: "notions" }],
            chapter: CHAPTER,
            showTab: async function (index) {
              shown = index;
            },
          }
        ),
      /targetViewId not in rendered tabs/
    );
    assert.equal(shown, -1);
  });

  test("m4 — sans viewOrder explicite, fallback_requested_chapter dégrade vers amorçage", () => {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
      url: "http://localhost/",
      runScripts: "outside-only",
    });
    const service = loadService(dom);
    const plan = service.buildResumePlan(
      baseContext({
        viewOrder: undefined,
        sessionRecords: [sampleSession({ viewId: "nonexistent-view" })],
      })
    );
    assert.equal(plan.action, "fallback_amorçage");
    assert.ok(plan.warnings.includes("unknown_view"));
    assert.ok(plan.warnings.includes("no_published_view"));
  });
});

describe("D4 audit — IA-10 overlay order (M1)", () => {
  test("ordre strict vue → ancre → overlays", async () => {
    const dom = setupResumeDom();
    const window = dom.window;
    window.LouSessionResume.resetRestoreCycleForTests();
    const order = [];

    await window.LouSessionResume.applyResumePlan(
      {
        action: "restore",
        targetReleaseId: RELEASE_ID,
        targetChapter: CHAPTER,
        targetViewId: "mental-model",
        resumePoint: { kind: "view_scroll", scrollY: 0 },
        warnings: [],
      },
      {
        tabs: [
          { viewId: "cognitive-priming" },
          { viewId: "mental-model" },
        ],
        chapter: CHAPTER,
        showTab: async function (index, options) {
          order.push("view:" + index);
          if (options && options.deferLearnerLayers) {
            order.push("defer_requested");
          }
        },
        flushLearnerLayers: async function () {
          order.push("overlays");
        },
      }
    );

    assert.deepEqual(order, ["view:1", "defer_requested", "overlays"]);
  });

  test("échec ancre → vue conservée → overlays montés, un seul plan", async () => {
    const dom = setupResumeDom();
    const window = dom.window;
    window.LouSessionResume.resetRestoreCycleForTests();
    window.document.body.innerHTML =
      '<div id="tabs"></div><div id="content"></div>';
    const order = [];

    const result = await window.LouSessionResume.applyResumePlan(
      {
        action: "restore",
        targetReleaseId: RELEASE_ID,
        targetChapter: CHAPTER,
        targetViewId: "mental-model",
        resumePoint: { kind: "element_block", elementId: "missing-block" },
        warnings: [],
      },
      {
        tabs: [
          { viewId: "cognitive-priming" },
          { viewId: "mental-model" },
        ],
        chapter: CHAPTER,
        showTab: async function (index) {
          order.push("view:" + index);
        },
        flushLearnerLayers: async function () {
          order.push("overlays");
        },
      }
    );

    assert.equal(result.ok, true);
    assert.deepEqual(order, ["view:1", "overlays"]);
    const banner = window.document.getElementById("session-resume-warnings");
    assert.ok(banner.textContent.includes("orphan_anchor"));
  });
});

describe("D4 audit — commit events (M3)", () => {
  /** @type {Window} */
  let window;

  before(() => {
    window = setupResumeDom().window;
  });

  beforeEach(() => {
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    window.LouLearnerStore.setReleaseContext({
      releaseId: RELEASE_ID,
      chapter: CHAPTER,
    });
  });

  test("CE-02 NOTION_CHANGED persiste elementId stable", async () => {
    const state = await window.LouSessionResume.persistCommitEvent(
      "NOTION_CHANGED",
      {
        elementId: "MEC-oap",
        resumePoint: { kind: "element_block", elementId: "MEC-oap" },
      }
    );
    assert.equal(state.viewId, "notions");
    assert.deepEqual(state.resumePoint, {
      kind: "element_block",
      elementId: "MEC-oap",
    });
  });

  test("CE-03 QCM_QUESTION_CHANGED persiste questionId stable", async () => {
    const state = await window.LouSessionResume.persistCommitEvent(
      "QCM_QUESTION_CHANGED",
      {
        questionId: "q-234-07",
        resumePoint: { kind: "question_id", questionId: "q-234-07" },
      }
    );
    assert.equal(state.viewId, "qcm");
    assert.equal(state.resumePoint.questionId, "q-234-07");
  });

  test("CE-04 INTERNAL_NAV_VALIDATED persiste Amorçage", async () => {
    const state = await window.LouSessionResume.persistCommitEvent(
      "INTERNAL_NAV_VALIDATED",
      {}
    );
    assert.equal(state.viewId, "cognitive-priming");
    assert.equal(state.resumePoint.kind, "view_entry");
  });

  test("CE-05 NOTES_FOCUS_CHANGED persiste catégorie shell uniquement", async () => {
    const state = await window.LouSessionResume.persistCommitEvent(
      "NOTES_FOCUS_CHANGED",
      {
        category: "shell",
        resumePoint: { kind: "notes_focus", category: "shell" },
      }
    );
    assert.equal(state.viewId, "notes");
    assert.equal(state.resumePoint.category, "shell");
    assert.equal(state.resumePoint.noteId, undefined);
  });
});

describe("D4 audit — CE-02 DOM wiring (Reader)", () => {
  test("clic Notions → onNotionChanged appelé une fois avec elementId", async () => {
    const harness = await setupCe02DomHarness();
    await activateView(harness.window, "notions");
    mountPedagogicalBlock(harness.window, CE02_ELEMENT_ID);

    await clickPedagogicalBlock(harness.window, CE02_ELEMENT_ID);

    assert.equal(harness.notionCalls.length, 1);
    assert.equal(harness.notionCalls[0], CE02_ELEMENT_ID);
  });

  test("clic Mental Model → onNotionChanged jamais appelé", async () => {
    const harness = await setupCe02DomHarness();
    await activateView(harness.window, "mental-model");
    mountPedagogicalBlock(harness.window, CE02_ELEMENT_ID);

    await clickPedagogicalBlock(harness.window, CE02_ELEMENT_ID);

    assert.equal(harness.notionCalls.length, 0);
  });
});

describe("D4 audit — pureté et immutabilité (m1/m2)", () => {
  test("m1 — Session Service sans LouLearnerPatrimony global", () => {
    const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
      url: "http://localhost/",
      runScripts: "outside-only",
    });
    delete dom.window.LouLearnerPatrimony;
    dom.window.eval(
      fs.readFileSync(path.join(ROOT, "session-service.js"), "utf8")
    );
    const service = dom.window.LouSessionService;
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
          resumePoint: { kind: "element_block", elementId: "x" },
        },
      }
    );
    assert.equal(
      state.logical_record_id,
      "session_resume::" + RELEASE_ID + "::0000000001"
    );
  });

  test("m2 — RestoreContext et CommitContext gelés profondément", async () => {
    const dom = setupResumeDom();
    const window = dom.window;
    window.LouLearnerStore.setReleaseContext({
      releaseId: RELEASE_ID,
      chapter: CHAPTER,
    });
    await window.LouLearnerStore.upsertSessionState({
      release_id: RELEASE_ID,
      chapter: CHAPTER,
      viewId: "notions",
      resumePoint: { kind: "element_block", elementId: "A" },
      last_activity_at: "2026-08-01T10:00:00.000Z",
      schema_version: 1,
      logical_record_id: "session_resume::" + RELEASE_ID + "::0000000001",
    });

    const ctx = await window.LouSessionResume.buildRestoreContext({
      chapter: CHAPTER,
      releaseId: RELEASE_ID,
      installedReleaseIds: [RELEASE_ID],
      releaseInstalled: true,
      tabs: [{ viewId: "notions", availability: "published" }],
    });

    assert.throws(() => {
      ctx.installedReleaseIds.push("mutated");
    });
    assert.throws(() => {
      ctx.sessionRecords[0].viewId = "mutated";
    });

    const service = window.LouSessionService;
    const a = service.buildResumePlan(ctx);
    const b = service.buildResumePlan(ctx);
    assert.deepEqual(a, b);
  });
});

describe("D4 audit — migration v6 → v7 (m3)", () => {
  /** @type {Window} */
  let window;

  before(() => {
    window = setupResumeDom().window;
  });

  beforeEach(async () => {
    window.indexedDB = new IDBFactory();
    window.LouLearnerStore.db = null;
    window.LouLearnerStore.clearReleaseContext();
    window.LouLearnerStore.setReleaseContext({
      releaseId: RELEASE_ID,
      chapter: CHAPTER,
    });
    await seedLegacyV6Patrimony(window);
  });

  test("v6 → v7 conserve E-B/E-C stores et crée session_resume", async () => {
    await window.LouLearnerStore.open();
    assert.equal(window.LouLearnerStore.db.version, 7);
    assert.ok(
      window.LouLearnerStore.db.objectStoreNames.contains("session_resume")
    );

    const highlights = await new Promise(function (resolve, reject) {
      const tx = window.LouLearnerStore.db.transaction(
        "text_annotations",
        "readonly"
      );
      const req = tx.objectStore("text_annotations").getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    assert.equal(highlights.length, 1);
    assert.equal(highlights[0].element, "MEC-oap");

    const notes = await new Promise(function (resolve, reject) {
      const tx = window.LouLearnerStore.db.transaction(
        "walkthrough_notes",
        "readonly"
      );
      const req = tx.objectStore("walkthrough_notes").getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    assert.equal(notes.length, 1);
    assert.equal(notes[0].text, "legacy note");

    window.LouLearnerStore.db.close();
    window.LouLearnerStore.db = null;
    await window.LouLearnerStore.open();
    assert.equal(window.LouLearnerStore.db.version, 7);

    const sessionRows = await window.LouLearnerStore.listSessionRecords();
    assert.equal(sessionRows.length, 0);
  });
});
